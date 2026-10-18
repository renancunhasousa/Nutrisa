import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchConversations } from '../../app/src/features/atendimento/services/conversations.js';
import { fetchCalendarPage } from '../../app/src/features/agenda/services/calendar.js';
import { generateContent, DEFAULT_MODELS } from '../../server/ai/service.js';
import handler from '../../api/ai.js';
const json = body => ({ok:true,json:async()=>body});

test('conversation pagination fetches beyond 1000 even with a lower server page cap', async () => {
  const source=Array.from({length:1205},(_,id)=>({id,mensagem_texto:'Teste'}));
  let calls=0;
  const items=await fetchConversations({url:'https://example.test',key:'test',fetchImpl:async url=>{
    calls++;
    const offset=Number(new URL(url).searchParams.get('offset'));
    return json(source.slice(offset,offset+500));
  }});
  assert.equal(items.length,1205);
  assert.equal(calls,4);
});
test('an explicit notification limit is preserved', async () => {
  const items=await fetchConversations({limit:100,url:'https://example.test',key:'test',fetchImpl:async url=>{
    assert.equal(new URL(url).searchParams.get('limit'),'100');
    return json(Array.from({length:100},(_,id)=>({id})));
  }});
  assert.equal(items.length,100);
});
test('calendar follows nextPageToken', async () => {
  const items=await fetchCalendarPage('test','primary',new Date('2026-08-01'),new Date('2026-09-01'),async url=>
    json(new URL(url).searchParams.has('pageToken') ? {items:[{id:2}]} : {items:[{id:1}],nextPageToken:'next'}));
  assert.deepEqual(items.map(i=>i.id),[1,2]);
});
test('AI rejects unknown models before making a network request', async () => {
  await assert.rejects(generateContent({model:'unknown',payload:{}},{fetchImpl:()=>assert.fail('network')}),/Modelo/);
});
test('AI retries a quota failure with the next configured model', async () => {
  const calls=[];
  const output=await generateContent({model:DEFAULT_MODELS[0],payload:{contents:[{parts:[{text:'synthetic test'}]}]}},{env:{GEMINI_API_KEY:'test'},fetchImpl:async (url,options)=>{
    calls.push(url);
    assert.equal(options.headers['x-goog-api-key'],'test');
    assert.ok(!url.includes('key='));
    return calls.length===1?{ok:false,status:429}:json({candidates:[{content:{parts:[{text:'ok'}]}}]});
  }});
  assert.equal(output.usedModel,DEFAULT_MODELS[1]);
  assert.equal(calls.length,2);
});
test('AI does not retry invalid credentials', async () => {
  let count=0;
  await assert.rejects(generateContent({model:DEFAULT_MODELS[0],payload:{contents:[{}]}},{env:{GEMINI_API_KEY:'test'},fetchImpl:async()=>{count++;return {ok:false,status:403};}}));
  assert.equal(count,1);
});
test('production API fails closed without access configuration and rejects bad tokens', async () => {
  const previous={ NODE_ENV:process.env.NODE_ENV, AI_ACCESS_TOKEN:process.env.AI_ACCESS_TOKEN };
  const response=()=>({code:0,body:null,setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;}});
  try {
    process.env.NODE_ENV='production';
    delete process.env.AI_ACCESS_TOKEN;
    let res=response();
    await handler({method:'GET',headers:{}},res);
    assert.equal(res.code,503);
    process.env.AI_ACCESS_TOKEN='test-only-access';
    res=response(); await handler({method:'GET',headers:{}},res); assert.equal(res.code,401);
    res=response(); await handler({method:'GET',headers:{authorization:'Bearer test-only-access'}},res); assert.equal(res.code,200);
    assert.ok(!JSON.stringify(res.body).includes('test-only-access'));
  } finally {
    for(const [key,value] of Object.entries(previous)) { if(value===undefined) delete process.env[key]; else process.env[key]=value; }
  }
});

test('AI falls back from Gemini to OpenAI (gpt-6-luna) when Gemini quota is exhausted', async () => {
  const urls = [];
  const output = await generateContent(
    { model: DEFAULT_MODELS[0], payload: { contents: [{ parts: [{ text: 'test fallback' }] }] } },
    {
      env: {
        GEMINI_MODELS: DEFAULT_MODELS[0],
        GEMINI_API_KEY: 'gemini-key',
        OPENAI_API_KEY: 'openai-key',
      },
      fetchImpl: async (url, options) => {
        urls.push(url);
        if (url.includes('googleapis.com')) {
          return { ok: false, status: 429 };
        }
        if (url.includes('api.openai.com')) {
          assert.equal(options.headers.Authorization, 'Bearer openai-key');
          const body = JSON.parse(options.body);
          assert.equal(body.model, 'gpt-6-luna');
          return json({ choices: [{ message: { content: 'resposta gpt' }, finish_reason: 'stop' }] });
        }
        assert.fail(`URL inesperada: ${url}`);
      },
    }
  );
  assert.equal(output.usedModel, 'gpt-6-luna');
  assert.equal(output.result.candidates[0].content.parts[0].text, 'resposta gpt');
  assert.equal(urls.length, 2);
});

test('AI falls back from OpenAI to DeepSeek (deepseek-flash) when OpenAI also fails', async () => {
  const urls = [];
  const output = await generateContent(
    { model: DEFAULT_MODELS[0], payload: { contents: [{ parts: [{ text: 'test deepseek fallback' }] }] } },
    {
      env: {
        GEMINI_MODELS: DEFAULT_MODELS[0],
        GEMINI_API_KEY: 'gemini-key',
        OPENAI_API_KEY: 'openai-key',
        DEEPSEEK_API_KEY: 'deepseek-key',
      },
      fetchImpl: async (url, options) => {
        urls.push(url);
        if (url.includes('googleapis.com')) {
          return { ok: false, status: 429 };
        }
        if (url.includes('api.openai.com')) {
          return { ok: false, status: 500 };
        }
        if (url.includes('api.deepseek.com')) {
          assert.equal(options.headers.Authorization, 'Bearer deepseek-key');
          const body = JSON.parse(options.body);
          assert.equal(body.model, 'deepseek-flash');
          return json({ choices: [{ message: { content: 'resposta deepseek' }, finish_reason: 'stop' }] });
        }
        assert.fail(`URL inesperada: ${url}`);
      },
    }
  );
  assert.equal(output.usedModel, 'deepseek-flash');
  assert.equal(output.result.candidates[0].content.parts[0].text, 'resposta deepseek');
  assert.equal(urls.length, 3);
});

test('pingAllProviders executes live ping across all 3 providers in parallel', async () => {
  const { pingAllProviders } = await import('../../server/ai/ping.js');
  const calledUrls = [];
  const results = await pingAllProviders({
    env: {
      GEMINI_API_KEY: 'test-gemini',
      OPENAI_API_KEY: 'test-openai',
      DEEPSEEK_API_KEY: 'test-deepseek',
    },
    fetchImpl: async (url) => {
      calledUrls.push(url);
      return json({ candidates: [{ content: { parts: [{ text: 'ok' }] } }], choices: [{ message: { content: 'ok' } }] });
    },
  });

  assert.equal(calledUrls.length, 3);
  assert.equal(results.results.gemini.online, true);
  assert.equal(results.results.openai.online, true);
  assert.equal(results.results.deepseek.online, true);
});


