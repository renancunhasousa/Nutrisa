import {
  Activity,
  Calendar,
  CheckSquare,
  FileSignature,
  FileText,
  MessageSquare,
  Radar,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';

export const CLINICAL_MODULES = [
  { id: 'dietas', label: 'Dieta', icon: UtensilsCrossed, description: 'Criação e edição de planos alimentares' },
  { id: 'anamnese', label: 'Anamnese', icon: FileText, description: 'Questionários e prontuários clínicos' },
  { id: 'avaliacao', label: 'Avaliação', icon: Activity, description: 'Medições corporais, dobras e laudos' },
  { id: 'atendimento', label: 'Atendimento', icon: MessageSquare, description: 'Conversas e WhatsApp dos pacientes' },
  { id: 'agenda', label: 'Agenda', icon: Calendar, description: 'Marcação e visualização de consultas' },
  { id: 'tarefas', label: 'Tarefas', icon: CheckSquare, description: 'Demandas do dia e follow-up' },
  { id: 'contratos', label: 'Contratos', icon: FileSignature, description: 'Termos de adesão e assinaturas' },
  { id: 'crm', label: 'Relacionamento', icon: Radar, description: 'Radar de retenção e reativação' },
  { id: 'produtos', label: 'Produtos', icon: ShoppingBag, description: 'Catálogo de alimentos e suplementos' },
  { id: 'marketing', label: 'Marketing', icon: Sparkles, description: 'Estúdio de posts para Instagram' },
];

export const ROLE_PRESETS = {
  owner: {
    label: 'Dra. / Proprietária',
    description: 'Acesso completo a todos os recursos clínicos e administrativos.',
    modules: CLINICAL_MODULES.map((m) => m.id),
  },
  receptionist: {
    label: 'Secretária / Recepção',
    description: 'Acesso à agenda, WhatsApp, tarefas de follow-up e radar.',
    modules: ['agenda', 'atendimento', 'tarefas', 'crm'],
  },
  assistant: {
    label: 'Administrativo / Financeiro',
    description: 'Acesso a contratos, tarefas e acompanhamento administrativo.',
    modules: ['contratos', 'tarefas'],
  },
  custom: {
    label: 'Personalizado',
    description: 'Defina manualmente quais módulos estarão liberados.',
    modules: [],
  },
};

export function getRoleLabel(role) {
  return ROLE_PRESETS[role]?.label || 'Membro da equipe';
}

export function hasModulePermission(member, moduleId) {
  if (!member) return true; // Por padrão sem restrição
  if (member.role === 'owner') return true;
  const permissions = Array.isArray(member.permissions) ? member.permissions : [];
  return permissions.includes(moduleId);
}
