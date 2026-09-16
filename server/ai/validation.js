// Validação de entrada dos requests de IA antes de chamar o provedor.
import { getModels } from './models.js';

/**
 * Valida o modelo e o payload recebidos pelo handler HTTP.
 * Lança um Error com `.status` em caso de problema.
 * @param {{ model: string, payload: object }} request
 * @param {{ env?: object }} options
 */
export function validateAiRequest({ model, payload }, { env = process.env } = {}) {
  const models = getModels(env);
  if (!models.includes(model)) {
    throw Object.assign(new Error('Modelo não permitido.'), { status: 400 });
  }
  if (
    !payload ||
    !Array.isArray(payload.contents) ||
    !payload.contents.length ||
    payload.contents.length > 10
  ) {
    throw Object.assign(new Error('Conteúdo de IA inválido.'), { status: 400 });
  }
}
