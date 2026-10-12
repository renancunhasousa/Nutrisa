// Lista e seleção dos modelos Gemini permitidos pelo servidor e modelos de fallback.
// Ajuste a variável de ambiente GEMINI_MODELS para substituir a lista padrão.
export const DEFAULT_MODELS = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'];

export const FALLBACK_MODELS = ['gpt-4o-mini', 'deepseek-flash'];

export function getModels(env = process.env) {
  const configured = (env.GEMINI_MODELS || '').split(',').map(s => s.trim()).filter(Boolean);
  return configured.length ? configured : DEFAULT_MODELS;
}

export function getAllowedModels(env = process.env) {
  return [...getModels(env), ...FALLBACK_MODELS];
}

export function getProviderForModel(model = '') {
  if (model.startsWith('gpt-')) return 'openai';
  if (model.startsWith('deepseek')) return 'deepseek';
  return 'gemini';
}
