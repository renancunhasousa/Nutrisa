/**
 * Variáveis de ambiente públicas do frontend (prefixo VITE_).
 * Importe daqui para evitar acesso direto a `import.meta.env` espalhado.
 * Valores sem default explícito podem ser undefined — verifique antes de usar.
 */
const env = import.meta.env || {};

/** URL base do projeto Supabase */
export const SUPABASE_URL = env.VITE_SUPABASE_URL || '';

/** Chave anônima do Supabase (somente leitura pública) */
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || '';

/** ID do calendário Google a ser consultado (default: 'primary') */
export const GOOGLE_CALENDAR_ID = env.VITE_GOOGLE_CALENDAR_ID || 'primary';

/** Client ID OAuth do Google (para login do Google Calendar) */
export const GOOGLE_CLIENT_ID = env.VITE_GOOGLE_CLIENT_ID || '';
