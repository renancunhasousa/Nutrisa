// Provedor DeepSeek para chamadas à API Chat Completions (ex: deepseek-flash).
import { convertGeminiPayloadToOpenAi, formatOpenAiResponseToGemini } from './openAiCompatible.js';

const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/chat/completions';
const TIMEOUT_MS = 90_000;

/**
 * Executa requisição para a API da DeepSeek.
 *
 * @param {string} model - Identificador do modelo DeepSeek (padrão 'deepseek-flash')
 * @param {object} payload - Objeto com contents, systemInstruction e generationConfig
 * @param {{ env?: object, fetchImpl?: typeof fetch }} options
 * @returns {Promise<Response>}
 */
export async function callDeepSeekApi(model = 'deepseek-flash', payload, { env = process.env, fetchImpl = fetch } = {}) {
  const apiKey = env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error('Configure DEEPSEEK_API_KEY no servidor.'), { status: 503 });
  }

  const requestBody = convertGeminiPayloadToOpenAi(payload, model);

  return fetchImpl(DEEPSEEK_ENDPOINT, {
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
