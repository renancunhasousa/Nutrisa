// Chamada HTTP direta à API Gemini (Google Generative Language).
// Esta função não conhece lógica de fallback nem validação de entrada —
// responsabilidades que pertencem ao service.js.

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/';
const MAX_OUTPUT_TOKENS = 16384;
const DEFAULT_OUTPUT_TOKENS = 8192;
const TIMEOUT_MS = 90_000;

/**
 * Faz uma chamada à API Gemini para um modelo específico.
 * @param {string} model  — identificador do modelo (ex: 'gemini-3.8-flash')
 * @param {object} payload — objeto com `contents`, `systemInstruction`, `generationConfig`
 * @param {{ env?: object, fetchImpl?: typeof fetch }} options
 * @returns {Promise<Response>}
 */
export async function callGeminiApi(model, payload, { env = process.env, fetchImpl = fetch } = {}) {
  const apiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error('Configure GEMINI_API_KEY no servidor.'), { status: 503 });
  }

  const url = GEMINI_ENDPOINT + encodeURIComponent(model) + ':generateContent';
  const body = JSON.stringify({
    contents: payload.contents,
    systemInstruction: payload.systemInstruction,
    generationConfig: {
      ...payload.generationConfig,
      maxOutputTokens: Math.min(
        Number(payload.generationConfig?.maxOutputTokens) || DEFAULT_OUTPUT_TOKENS,
        MAX_OUTPUT_TOKENS,
      ),
    },
  });

  return fetchImpl(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}
