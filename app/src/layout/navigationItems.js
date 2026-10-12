import {
  Activity,
  Calendar,
  CheckSquare,
  FileSignature,
  FileText,
  MessageSquare,
  Radar,
  PackageSearch,
  Sparkles,
  UtensilsCrossed,
  Users,
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'pacientes', label: 'Pacientes', icon: Users },
  { id: 'crm', label: 'Relacionamento', icon: Radar },
  { id: 'laudo', label: 'Avaliação', icon: Activity },
  { id: 'anamnese', label: 'Anamnese', icon: FileText },
  { id: 'dietas', label: 'Dietas', icon: UtensilsCrossed },
  { id: 'produtos', label: 'Cadastros', icon: PackageSearch },
  { id: 'dashboard', label: 'Atendimento', icon: MessageSquare },
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'tarefas', label: 'Tarefas', icon: CheckSquare },
  { id: 'contratos', label: 'Contratos', icon: FileSignature },
  { id: 'marketing', label: 'Marketing', icon: Sparkles },
];

export const MOBILE_PRIMARY_MODE_IDS = new Set(['pacientes', 'crm', 'agenda', 'tarefas']);

export const getModeLabel = (mode) =>
  NAV_ITEMS.find((item) => item.id === mode)?.label ?? 'NutrIsa';
