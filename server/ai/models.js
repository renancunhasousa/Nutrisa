// Lista e seleção dos modelos Gemini permitidos pelo servidor.
// Ajuste a variável de ambiente GEMINI_MODELS para substituir a lista padrão.
export const DEFAULT_MODELS = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'];

export function getModels(env = process.env) {
  const configured = (env.GEMINI_MODELS || '').split(',').map(s => s.trim()).filter(Boolean);
  return configured.length ? configured : DEFAULT_MODELS;
}
