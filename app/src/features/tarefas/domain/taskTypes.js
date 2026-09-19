/**
 * Tipos, categorias e modelos para a Central de Tarefas & Follow-up Clínico.
 */

export const TASK_CATEGORIES = {
  dieta: {
    id: 'dieta',
    label: 'Plano Alimentar',
    iconName: 'Salad',
    color: 'orange',
    badgeBg: 'bg-orange-50 text-orange-700 border-orange-200',
    dotBg: 'bg-orange-500',
    defaultModule: 'laudo',
  },
  anamnese: {
    id: 'anamnese',
    label: 'Anamnese & Laudo',
    iconName: 'FileText',
    color: 'sky',
    badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
    dotBg: 'bg-sky-500',
    defaultModule: 'anamnese',
  },
  whatsapp: {
    id: 'whatsapp',
    label: 'WhatsApp / Dúvidas',
    iconName: 'MessageSquare',
    color: 'emerald',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotBg: 'bg-emerald-500',
  },
  followup: {
    id: 'followup',
    label: 'Follow-up de Adesão',
    iconName: 'Sparkles',
    color: 'purple',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    dotBg: 'bg-purple-500',
  },
  retorno: {
    id: 'retorno',
    label: 'Retorno & Agenda',
    iconName: 'Calendar',
    color: 'amber',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    dotBg: 'bg-amber-500',
    defaultModule: 'agenda',
  },
  geral: {
    id: 'geral',
    label: 'Geral / Consultório',
    iconName: 'CheckSquare',
    color: 'slate',
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
    dotBg: 'bg-slate-400',
  },
};

export const TASK_PRIORITIES = {
  alta: {
    id: 'alta',
    label: 'Alta Prioridade',
    color: 'rose',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
  media: {
    id: 'media',
    label: 'Média',
    color: 'amber',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-400',
  },
  baixa: {
    id: 'baixa',
    label: 'Baixa',
    color: 'slate',
    badgeBg: 'bg-slate-50 text-slate-600 border-slate-200',
    dot: 'bg-slate-300',
  },
};

/**
 * Atalhos rápidos de data de vencimento.
 */
export const DATE_PRESETS = [
  { id: 'today', label: 'Hoje', daysOffset: 0 },
  { id: 'tomorrow', label: 'Amanhã', daysOffset: 1 },
  { id: 'in_7_days', label: 'Em 7 dias', daysOffset: 7 },
  { id: 'in_15_days', label: 'Em 15 dias', daysOffset: 15 },
  { id: 'in_30_days', label: 'Em 30 dias', daysOffset: 30 },
];

/**
 * Calcula uma data YYYY-MM-DD somando dias a partir de hoje.
 */
export function getPresetDate(daysOffset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Modelos de mensagens rápidas para WhatsApp.
 */
export const WHATSAPP_TEMPLATES = [
  {
    id: 'followup_7_days',
    title: 'Check-in de 1ª Semana (Adesão)',
    text: (patientName) =>
      `Oi ${patientName || 'tudo bem'}! Aqui é a Dra. passando para saber como foi sua primeira semana com o plano alimentar. Sentiu alguma dificuldade ou teve fome em algum horário específico?`,
  },
  {
    id: 'plano_liberado',
    title: 'Plano Alimentar Liberado',
    text: (patientName) =>
      `Oi ${patientName || 'tudo bem'}! Acabei de finalizar e liberar o seu plano alimentar personalizado. Dá uma olhada com calma e me diga se ficou alguma dúvida, tá bem?`,
  },
  {
    id: 'retorno_lembrete',
    title: 'Lembrete de Retorno',
    text: (patientName) =>
      `Olá ${patientName || 'tudo bem'}! Como está indo o acompanhamento? Já está chegando o período da nossa consulta de retorno para reavaliarmos suas metas. Vamos agendar seu melhor horário?`,
  },
  {
    id: 'duvida_suplemento',
    title: 'Acompanhamento de Exames / Dúvida',
    text: (patientName) =>
      `Oi ${patientName || 'tudo bem'}! Passando para checar se você conseguiu fazer aqueles exames / iniciar a suplementação que combinamos na consulta. Qualquer dúvida estou por aqui!`,
  },
];

/**
 * Gera URL do WhatsApp com número e texto pré-formatados.
 */
export function buildWhatsAppUrl(phone, messageText) {
  const cleanPhone = (phone || '').replace(/\D/g, '');
  const encodedText = encodeURIComponent(messageText || '');
  if (cleanPhone) {
    // Adiciona código do Brasil se não tiver
    const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    return `https://wa.me/${fullPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}
