// Categorias clínicas atribuídas diretamente à Dra. Isabela
export const CLINICAL_CATEGORIES = [
  'Dúvida Plano Alimentar',
  'Dificuldades e Sintomas',
  'Exames e Documentos',
  'Suplementação e Receitas',
  'Feedback e Motivação'
];

// Helper para identificar o atendente responsável / que efetivamente respondeu
export const getAttendantType = (item) => {
  if (!item) return 'secretaria';

  const src = (item.source || '').toLowerCase();
  const resp = (item.resposta_secretaria || '').toLowerCase();
  const cat = item.categoria || '';

  // 1. Se já tem indicação explícita de resposta da Dra. Isabela
  if (src === 'primario' || src === 'notebook' || resp.includes('dra isabela') || resp.includes('isabela muñoz')) {
    return 'isabela';
  }

  // 2. Se já tem indicação explícita de resposta da secretária
  if (src === 'secretaria' || item.categoria_secretaria) {
    return 'secretaria';
  }

  // 3. Se for uma categoria clínica (ex: Exames e Documentos, Dúvidas de Dieta), é da Dra. Isabela
  if (CLINICAL_CATEGORIES.includes(cat)) {
    return 'isabela';
  }

  // 4. Se for administrativo / financeiro / agendamento ou outros
  return 'secretaria';
};


// Expressões e palavras típicas de encerramento / cortesia / confirmação rápida
const COURTESY_PHRASES = [
  'obrigado', 'obrigada', 'obg', 'obgd', 'valeu', 'vlw', 'brigado', 'brigada',
  'ok', 'okk', 'blz', 'beleza', 'combinado', 'combinadissimo', 'ta bom', 'tá bom', 'tabom', 'certo',
  'sim', 'simm', 'nao', 'não', 'pode ser', 'pode sim', 'pode vir', 'perfeito', 'show', 'otimo', 'ótimo',
  'bom dia', 'boa tarde', 'boa noite', 'ola', 'olá', 'oii', 'oi', 'oie', 'ate mais', 'até mais', 'tchau'
];

export const isClosingOrGreetingMessage = (item) => {
  const text = (item.mensagem_texto || '').trim().toLowerCase();
  if (!text || text.length === 0) return true;
  const clean = text.replace(/(?:\p{P}|\p{S}|\p{M}|\u200D|\uFE0F)/gu, '').trim();
  if (!clean && text.length > 0) return true;

  if (clean.length <= 25) {
    if (COURTESY_PHRASES.includes(clean)) return true;
    if (COURTESY_PHRASES.some(p => clean === p || clean === `${p} ${p}` || (clean.startsWith(`${p} `) && clean.length <= 15))) {
      return true;
    }
  }
  return false;
};
