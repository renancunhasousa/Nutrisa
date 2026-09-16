/**
 * Chaves de armazenamento local centralizadas.
 * Importe daqui ao invés de escrever strings literais nos componentes.
 *
 * localStorage  — persistência permanente (perfil, modelo, preferências)
 * sessionStorage — persistência de sessão (token de acesso de IA)
 */

// ── localStorage ────────────────────────────────────────────────────────────
/** Perfil da nutricionista (nome, CRN, clínica, etc.) */
export const KEY_NUTRITIONIST = 'nutrisa_nutritionist';

/** Modelo de IA selecionado pelo usuário */
export const KEY_SELECTED_MODEL = 'nutrisa_selected_model';

/** Templates de anamnese salvos pelo usuário */
export const KEY_ANAMNESE_TEMPLATES = 'nutrisa_anamnese_templates';

/** Rascunho do template de anamnese em edição */
export const KEY_ANAMNESE_DRAFT = 'nutrisa_anamnese_draft';

/** Preferência de notificações ao vivo */
export const KEY_LIVE_NOTIFS = 'nutrisa_live_notifs';

/** Token de autenticação do Google (agenda) */
export const KEY_GOOGLE_TOKEN = 'nutriisa_google_token';

/** Link do Google Meet padrão (agenda) */
export const KEY_GOOGLE_MEET = 'nutriisa_google_meet_link';

// ── sessionStorage ───────────────────────────────────────────────────────────
/** Token de acesso à API de IA (armazenado apenas por sessão) */
export const KEY_AI_ACCESS = 'nutrisa_ai_access';
