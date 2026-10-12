import {
  Activity,
  Calendar,
  CheckSquare,
  FileSignature,
  FileText,
  MessageSquare,
  PackageSearch,
  Radar,
  Settings,
  Sparkles,
  Users,
  UtensilsCrossed,
} from 'lucide-react';

export const CLINICAL_MODULES = [
  { id: 'pacientes', label: 'Pacientes', icon: Users, description: 'Cadastro e gestão de pacientes' },
  { id: 'crm', label: 'Relacionamento', icon: Radar, description: 'Radar de retenção, oportunidades e aniversariantes' },
  { id: 'laudo', label: 'Avaliação', icon: Activity, description: 'Medições corporais, dobras e laudos' },
  { id: 'anamnese', label: 'Anamnese', icon: FileText, description: 'Questionários e prontuários clínicos' },
  { id: 'dietas', label: 'Dietas', icon: UtensilsCrossed, description: 'Criação e edição de planos alimentares' },
  { id: 'produtos', label: 'Cadastros', icon: PackageSearch, description: 'Catálogo de alimentos, produtos e suplementos' },
  { id: 'dashboard', label: 'Atendimento', icon: MessageSquare, description: 'Conversas e WhatsApp dos pacientes' },
  { id: 'agenda', label: 'Agenda', icon: Calendar, description: 'Marcação e visualização de consultas' },
  { id: 'tarefas', label: 'Tarefas', icon: CheckSquare, description: 'Demandas do dia e follow-up' },
  { id: 'contratos', label: 'Contratos', icon: FileSignature, description: 'Termos de adesão e assinaturas digitais' },
  { id: 'marketing', label: 'Marketing', icon: Sparkles, description: 'Estúdio de posts para Instagram' },
  { id: 'ai', label: 'Configurar IA', icon: Sparkles, description: 'Ajustes de inteligência artificial' },
  { id: 'configuracoes', label: 'Configurações', icon: Settings, description: 'Perfil da clínica e parâmetros gerais' },
];

export const ROLE_PRESETS = {
  owner: {
    label: 'Dra. / Proprietária',
    description: 'Acesso completo a todos os recursos clínicos e administrativos.',
    modules: CLINICAL_MODULES.map((m) => m.id),
  },
  receptionist: {
    label: 'Secretária / Recepção',
    description: 'Acesso a Pacientes, Relacionamento, Atendimento, Agenda e Tarefas.',
    modules: ['pacientes', 'crm', 'dashboard', 'agenda', 'tarefas'],
  },
  assistant: {
    label: 'Administrativo / Financeiro',
    description: 'Acesso a Pacientes, Contratos e Tarefas administrativas.',
    modules: ['pacientes', 'contratos', 'tarefas'],
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
  if (member.role === 'owner' || member.isOwner) return true;
  const permissions = Array.isArray(member.permissions) ? member.permissions : [];
  if (permissions.includes(moduleId)) return true;
  if (moduleId === 'laudo' && permissions.includes('avaliacao')) return true;
  if (moduleId === 'dashboard' && permissions.includes('atendimento')) return true;
  return false;
}
