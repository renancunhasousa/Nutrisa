// Provedor OpenAI para chamadas à API Chat Completions (ex: gpt-4o-mini).
import { convertGeminiPayloadToOpenAi, formatOpenAiResponseToGemini } from './openAiCompatible.js';

const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const TIMEOUT_MS = 90_000;

/**
 * Executa requisição para a API da OpenAI.
 *
 * @param {string} model - Identificador do modelo OpenAI (padrão 'gpt-4o-mini')
 * @param {object} payload - Objeto com contents, systemInstruction e generationConfig
 * @param {{ env?: object, fetchImpl?: typeof fetch }} options
 * @returns {Promise<Response>}
 */
export async function callOpenAiApi(model = 'gpt-4o-mini', payload, { env = process.env, fetchImpl = fetch } = {}) {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error('Configure OPENAI_API_KEY no servidor.'), { status: 503 });
  }

  const requestBody = convertGeminiPayloadToOpenAi(payload, model);

  return fetchImpl(OPENAI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

export { formatOpenAiResponseToGemini };
