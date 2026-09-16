// Coordenação: valida a entrada, tenta o modelo preferido e executa fallback entre modelos.
import { getModels } from './models.js';
import { validateAiRequest } from './validation.js';
import { callGeminiApi } from './providers/gemini.js';

export { getModels, DEFAULT_MODELS } from './models.js';

const RETRYABLE_STATUS_CODES = [404, 429, 500, 502, 503, 504];

/**
 * Gera conteúdo com IA, tentando o modelo solicitado primeiro e fazendo fallback
 * nos modelos alternativos configurados em caso de cota ou indisponibilidade.
 *
 * @param {{ model: string, payload: object }} request
 * @param {{ env?: object, fetchImpl?: typeof fetch }} options
 * @returns {Promise<{ result: object, usedModel: string }>}
 */
export async function generateContent({ model, payload }, { env = process.env, fetchImpl = fetch } = {}) {
  validateAiRequest({ model, payload }, { env });

  const models = getModels(env);
  const chain = [model, ...models.filter(m => m !== model)];

  for (const candidate of chain) {
    const response = await callGeminiApi(candidate, payload, { env, fetchImpl });

    if (!response.ok) {
      const isLast = candidate === chain.at(-1);
      if (RETRYABLE_STATUS_CODES.includes(response.status) && !isLast) continue;
      throw Object.assign(
        new Error(`O provedor de IA retornou erro ${response.status}. Tente novamente mais tarde.`),
        { status: response.status },
      );
    }

    const result = await response.json();
    if (!result.candidates?.[0]?.content?.parts?.some(p => p.text)) {
      throw Object.assign(new Error('A IA não retornou conteúdo legível.'), { status: 502 });
    }

    return { result, usedModel: candidate };
  }
}
