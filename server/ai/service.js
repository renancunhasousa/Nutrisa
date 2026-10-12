// Coordenação: valida a entrada, tenta o modelo preferido e executa fallback
// inteligente entre provedores: 1º Gemini ➔ 2º OpenAI (GPT-4o-mini) ➔ 3º DeepSeek (Flash).
import { getModels, getAllowedModels, getProviderForModel } from './models.js';
import { validateAiRequest } from './validation.js';
import { callGeminiApi } from './providers/gemini.js';
import { callOpenAiApi, formatOpenAiResponseToGemini as formatOpenAi } from './providers/openai.js';
import { callDeepSeekApi, formatOpenAiResponseToGemini as formatDeepSeek } from './providers/deepseek.js';

export { getModels, getAllowedModels, DEFAULT_MODELS, FALLBACK_MODELS } from './models.js';

const RETRYABLE_STATUS_CODES = [404, 429, 500, 502, 503, 504];

/**
 * Monta a cadeia de candidatos para execução com fallback.
 * Ordem padrão: Gemini titular + alternativas ➔ OpenAI (gpt-4o-mini) ➔ DeepSeek (deepseek-flash).
 *
 * @param {string} requestedModel
 * @param {object} env
 * @returns {Array<{ provider: 'gemini' | 'openai' | 'deepseek', model: string }>}
 */
function buildExecutionChain(requestedModel, env = process.env) {
  const geminiModels = getModels(env);
  const primaryProvider = getProviderForModel(requestedModel);

  const chain = [];

  if (primaryProvider === 'openai') {
    chain.push({ provider: 'openai', model: requestedModel || 'gpt-4o-mini' });
    if (env.DEEPSEEK_API_KEY) chain.push({ provider: 'deepseek', model: 'deepseek-flash' });
    geminiModels.forEach(m => chain.push({ provider: 'gemini', model: m }));
  } else if (primaryProvider === 'deepseek') {
    chain.push({ provider: 'deepseek', model: requestedModel || 'deepseek-flash' });
    if (env.OPENAI_API_KEY) chain.push({ provider: 'openai', model: 'gpt-4o-mini' });
    geminiModels.forEach(m => chain.push({ provider: 'gemini', model: m }));
  } else {
    // Padrão: 1º Gemini ➔ 2º OpenAI (GPT-4o-mini) ➔ 3º DeepSeek (deepseek-flash)
    const geminiChain = [requestedModel, ...geminiModels.filter(m => m !== requestedModel)];
    geminiChain.forEach(m => chain.push({ provider: 'gemini', model: m }));

    if (env.OPENAI_API_KEY) {
      chain.push({ provider: 'openai', model: 'gpt-4o-mini' });
    }
    if (env.DEEPSEEK_API_KEY) {
      chain.push({ provider: 'deepseek', model: 'deepseek-flash' });
    }
  }

  return chain;
}

/**
 * Despacha a chamada para o provedor apropriado.
 */
async function executeCandidate(candidate, payload, { env, fetchImpl }) {
  if (candidate.provider === 'openai') {
    const response = await callOpenAiApi(candidate.model, payload, { env, fetchImpl });
    return { response, format: formatOpenAi };
  }
  if (candidate.provider === 'deepseek') {
    const response = await callDeepSeekApi(candidate.model, payload, { env, fetchImpl });
    return { response, format: formatDeepSeek };
  }
  const response = await callGeminiApi(candidate.model, payload, { env, fetchImpl });
  return { response, format: data => data };
}

/**
 * Gera conteúdo com IA, tentando o modelo solicitado primeiro e fazendo fallback
 * ordenado entre Gemini, OpenAI (GPT-4o-mini) e DeepSeek (Flash) em caso de erro ou cota.
 *
 * @param {{ model: string, payload: object }} request
 * @param {{ env?: object, fetchImpl?: typeof fetch }} options
 * @returns {Promise<{ result: object, usedModel: string }>}
 */
export async function generateContent({ model, payload }, { env = process.env, fetchImpl = fetch } = {}) {
  validateAiRequest({ model, payload }, { env });

  const chain = buildExecutionChain(model, env);

  for (const candidate of chain) {
    const isLast = candidate === chain.at(-1);

    let response;
    let format;
    try {
      const dispatched = await executeCandidate(candidate, payload, { env, fetchImpl });
      response = dispatched.response;
      format = dispatched.format;
    } catch (error) {
      if (RETRYABLE_STATUS_CODES.includes(error?.status) && !isLast) {
        continue;
      }
      throw error;
    }

    if (!response.ok) {
      if (RETRYABLE_STATUS_CODES.includes(response.status) && !isLast) {
        continue;
      }
      throw Object.assign(
        new Error(`O provedor de IA retornou erro ${response.status}. Tente novamente mais tarde.`),
        { status: response.status },
      );
    }

    const raw = await response.json();
    const result = format(raw);

    if (!result?.candidates?.[0]?.content?.parts?.some(p => p.text)) {
      if (!isLast) continue;
      throw Object.assign(new Error('A IA não retornou conteúdo legível.'), { status: 502 });
    }

    return { result, usedModel: candidate.model };
  }
}
