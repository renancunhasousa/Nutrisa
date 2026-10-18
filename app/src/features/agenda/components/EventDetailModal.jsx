import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Clock,
  Calendar,
  Video,
  Copy,
  Check,
  ExternalLink,
  Edit3,
  Save,
  CheckCircle,
  MessageCircle,
  Palette,
  ChevronDown,
  Link2,
  Unlink,
  Plus,
  CheckSquare,
  UtensilsCrossed,
  FileText,
  Activity,
  MessageSquare,
  FileSignature,
  Search,
  Sparkles,
  UserCheck,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { colorMapper } from '../domain/calendarMapper.js';
import { usePatient } from '../../pacientes/usePatient.js';
import { useAuth } from '../../auth/useAuth.js';
import { writePatientHandoff } from '../../pacientes/services/patientHandoff.js';
import { linkConversationsToPatient } from '../../atendimento/services/conversations.js';
import { getOwnerLabel } from '../../configuracoes/services/clinicProfileService.js';
import { listCalendarLinks, saveCalendarLink, removeCalendarLink } from '../../crm/services/calendarLinks.js';
import {
  eventNameKey,
  rankPatientCandidates,
  buildPatientNameIndex,
  matchNameKeyToPatient,
} from '../../crm/domain/calendarLinks.js';
import { createTask } from '../../tarefas/services/taskStorage.js';

function formatIsoDateToBr(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return dateStr;
}

function getFutureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DATE_SHORTCUTS = [
  { label: 'Hoje', days: 0 },
  { label: 'Amanhã', days: 1 },
  { label: 'Em 7 dias (1 semana)', days: 7 },
  { label: 'Em 15 dias', days: 15 },
  { label: 'Em 30 dias (1 mês)', days: 30 },
  { label: 'Em 60 dias (2 meses)', days: 60 },
];

const TIME_OPTIONS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30',
];

const PATIENT_SHORTCUTS = [
  {
    id: 'dietas',
    label: 'Dieta',
    icon: UtensilsCrossed,
    tooltip: 'Criar nova dieta para este paciente',
    colorClasses: 'hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800',
    iconColor: 'text-sky-600',
  },
  {
    id: 'anamnese',
    label: 'Anamnese',
    icon: FileText,
    tooltip: 'Criar nova anamnese para este paciente',
    colorClasses: 'hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800',
    iconColor: 'text-sky-600',
  },
  {
    id: 'laudo',
    label: 'Avaliação',
    icon: Activity,
    tooltip: 'Criar nova avaliação física para este paciente',
    colorClasses: 'hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800',
    iconColor: 'text-sky-600',
  },
  {
    id: 'dashboard',
    label: 'Conversa',
    icon: MessageSquare,
    tooltip: 'Abrir atendimento e conversas deste paciente',
    colorClasses: 'hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800',
    iconColor: 'text-sky-600',
  },
  {
    id: 'tarefas',
    label: 'Tarefas',
    icon: CheckSquare,
    tooltip: 'Ver tarefas e demandas deste paciente',
    colorClasses: 'hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800',
    iconColor: 'text-sky-600',
  },
  {
    id: 'contratos',
    label: 'Contrato',
    icon: FileSignature,
    tooltip: 'Criar novo contrato para este paciente',
    colorClasses: 'hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800',
    iconColor: 'text-sky-600',
  },
];

const TASK_QUICK_TYPES = [
  { id: 'dieta', label: 'Dieta', desc: 'Elaborar / ajustar plano alimentar', icon: UtensilsCrossed, iconColor: 'text-orange-500' },
  { id: 'followup', label: 'Follow-Up', desc: 'Acompanhamento pós-consulta', icon: Sparkles, iconColor: 'text-purple-500' },
  { id: 'exames', label: 'Exames / Laudo', desc: 'Analisar exames laboratoriais', icon: Activity, iconColor: 'text-teal-600' },
  { id: 'whatsapp', label: 'Dúvidas WhatsApp', desc: 'Retorno de dúvidas clínicas', icon: MessageSquare, iconColor: 'text-emerald-600' },
  { id: 'retorno', label: 'Agendar Retorno', desc: 'Consulta de acompanhamento', icon: Calendar, iconColor: 'text-amber-500' },
  { id: 'geral', label: 'Geral', desc: 'Demanda clínica / administrativa', icon: CheckSquare, iconColor: 'text-slate-500' },
];

export default function EventDetailModal(props) {
  if (!props.event) return null;
  return <EventDetailForm key={props.event.id || 'new-event'} {...props} />;
}

function EventDetailForm({
  event,
  onClose,
  onUpdateEvent,
  onCreateEvent,
  meetLink = 'https://meet.google.com/bela-consultas',
  onSaveMeetLink,
}) {
  const isNew = Boolean(event.isNew || !event.id);
  const { organizationId, canAccessModule } = useAuth();
  const { patients, selectPatient } = usePatient();

  // Categoria inicial detectada
  const initialCategory = colorMapper.getCategoryByEvent(event);

  const getInitialCategoryKey = () => {
    if (event.categoryKey && colorMapper.categories[event.categoryKey]) {
      return event.categoryKey;
    }
    const foundEntry = Object.entries(colorMapper.categories).find(([, v]) => v.label === initialCategory.label);
    return foundEntry ? foundEntry[0] : 'online';
  };

  const [selectedCategoryKey, setSelectedCategoryKey] = useState(getInitialCategoryKey);
  const activeCategory = colorMapper.categories[selectedCategoryKey] || initialCategory;

  // Estados de edição
  const [isEditing, setIsEditing] = useState(isNew);
  const [summary, setSummary] = useState(event.summary || '');
  const [description, setDescription] = useState(event.description || '');

  // Datas e Horários
  const startObj = new Date(event.start?.dateTime || event.start?.date);
  const endObj = new Date(event.end?.dateTime || event.end?.date);

  const [dateStr, setDateStr] = useState(() => {
    const y = startObj.getFullYear();
    const m = String(startObj.getMonth() + 1).padStart(2, '0');
    const d = String(startObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const [startTimeStr, setStartTimeStr] = useState(() => {
    return startObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).slice(0, 5);
  });

  const [endTimeStr, setEndTimeStr] = useState(() => {
    return endObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).slice(0, 5);
  });

  // Dropdown de Data e Horários (estilo Seção 1 do Contrato)
  const [openDropdown, setOpenDropdown] = useState(null); // 'date' | 'startTime' | 'endTime' | null

  // Status selecionado: 'a_confirmar', 'confirmado', 'desmarcado'
  const [statusKey, setStatusKey] = useState(() => colorMapper.getStatusKey(event));

  // Link do Google Meet
  const [customMeetLink, setCustomMeetLink] = useState(meetLink);
  const [isEditingMeet, setIsEditingMeet] = useState(false);
  const [copiedMeet, setCopiedMeet] = useState(false);
  const [saving, setSaving] = useState(false);

  // Vínculo com Paciente
  const [linkedPatient, setLinkedPatient] = useState(null);
  const [isLinkingOpen, setIsLinkingOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [linkingLoading, setLinkingLoading] = useState(false);

  // Inserção como Tarefa
  const [isTaskPanelOpen, setIsTaskPanelOpen] = useState(false);
  const [selectedTaskType, setSelectedTaskType] = useState('dieta');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(() => dateStr || getFutureDate(0));
  const [taskPriority, setTaskPriority] = useState('media');
  const [taskSuccessMsg, setTaskSuccessMsg] = useState('');

  // Identificação inicial de paciente vinculado
  useEffect(() => {
    let isMounted = true;
    async function detectLinkedPatient() {
      if (!patients || patients.length === 0) return;
      const cleanSumm = (summary || event.summary || '').replace(/\[[^\]]*\]/g, '').replace(/[✅❌]/g, '').trim();
      const nameKey = eventNameKey(cleanSumm);
      if (!nameKey) return;

      // 1. Verificar em calendar_event_links no Supabase
      if (organizationId) {
        try {
          const linksMap = await listCalendarLinks(organizationId);
          const link = linksMap.get(nameKey);
          if (link && link.patient_id && !link.ignored) {
            const found = patients.find((p) => p.id === link.patient_id);
            if (found && isMounted) {
              setLinkedPatient(found);
              return;
            }
          }
        } catch {}
      }

      // 2. Se não houver link salvo, tentar matching por nome exato ou tokens
      const nameIndex = buildPatientNameIndex(patients);
      const match = matchNameKeyToPatient(nameKey, nameIndex);
      if (match?.patient && isMounted) {
        setLinkedPatient(match.patient);
        return;
      }

      // 3. Fallback: procurar por nome contido
      const fallbackFound = patients.find((p) => {
        const pNorm = (p.full_name || '').toLowerCase();
        const sNorm = cleanSumm.toLowerCase();
        return pNorm && sNorm && (pNorm.includes(sNorm) || sNorm.includes(pNorm));
      });
      if (fallbackFound && isMounted) {
        setLinkedPatient(fallbackFound);
      }
    }

    detectLinkedPatient();
    return () => { isMounted = false; };
  }, [summary, event.summary, patients, organizationId]);

  // Atualizar título padrão da tarefa ao mudar tipo ou paciente
  useEffect(() => {
    const cleanSumm = (summary || event.summary || '').replace(/\[[^\]]*\]/g, '').replace(/[✅❌]/g, '').trim();
    const pName = linkedPatient?.full_name || cleanSumm || 'Paciente';
    const typeObj = TASK_QUICK_TYPES.find((t) => t.id === selectedTaskType);
    setTaskTitle(`${typeObj?.label || 'Demanda'}: ${pName}`);
  }, [selectedTaskType, linkedPatient, summary, event.summary]);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    if (!openDropdown) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('.agenda-modal-dropdown')) {
        setOpenDropdown(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpenDropdown(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openDropdown]);

  useEffect(() => {
    setCustomMeetLink(meetLink);
  }, [meetLink]);

  const handleCopyMeet = () => {
    navigator.clipboard.writeText(customMeetLink);
    setCopiedMeet(true);
    setTimeout(() => setCopiedMeet(false), 2000);
  };

  const handleSaveMeet = () => {
    if (onSaveMeetLink) {
      onSaveMeetLink(customMeetLink);
    }
    setIsEditingMeet(false);
  };

  const handleNavigateToPatientModule = async (mode) => {
    if (!linkedPatient) return;
    selectPatient(linkedPatient);
    writePatientHandoff(mode, linkedPatient);

    if (mode === 'dashboard') {
      try {
        await linkConversationsToPatient({
          organizationId,
          patientId: linkedPatient.id,
          phone: linkedPatient.whatsapp_phone || linkedPatient.phone,
        });
      } catch {}
    }

    if (mode === 'tarefas') {
      try {
        sessionStorage.setItem('nutrisa_tasks_patient_filter', JSON.stringify({
          id: linkedPatient.id,
          name: linkedPatient.full_name,
        }));
      } catch {}
    }

    onClose();
    window.location.hash = `#${mode}`;
  };

  const handleLinkPatient = async (patient) => {
    setLinkingLoading(true);
    try {
      const cleanSumm = (summary || event.summary || '').replace(/\[[^\]]*\]/g, '').replace(/[✅❌]/g, '').trim();
      const nameKey = eventNameKey(cleanSumm || patient.full_name);
      if (organizationId && nameKey) {
        await saveCalendarLink({
          organizationId,
          nameKey,
          patientId: patient.id,
        });
      }
      setLinkedPatient(patient);
      selectPatient(patient);
      setIsLinkingOpen(false);
    } catch (err) {
      alert('Erro ao vincular paciente: ' + (err.message || 'Tente novamente.'));
    } finally {
      setLinkingLoading(false);
    }
  };

  const handleUnlinkPatient = async () => {
    if (!window.confirm('Deseja desvincular este paciente deste agendamento?')) return;
    setLinkingLoading(true);
    try {
      const cleanSumm = (summary || event.summary || '').replace(/\[[^\]]*\]/g, '').replace(/[✅❌]/g, '').trim();
      const nameKey = eventNameKey(cleanSumm);
      if (organizationId && nameKey) {
        await removeCalendarLink({ organizationId, nameKey });
      }
      setLinkedPatient(null);
    } catch (err) {
      alert('Erro ao desvincular paciente: ' + (err.message || 'Tente novamente.'));
    } finally {
      setLinkingLoading(false);
    }
  };

  const handleCreateTaskFromEvent = () => {
    if (!taskTitle.trim()) {
      alert('Por favor, informe o título da tarefa.');
      return;
    }

    const cleanSumm = (summary || event.summary || '').replace(/\[[^\]]*\]/g, '').replace(/[✅❌]/g, '').trim();
    const newTask = createTask({
      organizationId,
      patientId: linkedPatient?.id || null,
      patientName: linkedPatient?.full_name || cleanSumm,
      patientPhone: linkedPatient?.whatsapp_phone || linkedPatient?.phone || '',
      title: taskTitle.trim(),
      category: selectedTaskType,
      priority: taskPriority,
      dueDate: taskDueDate || dateStr || getFutureDate(0),
      calendarEventId: event.id || null,
      eventDate: dateStr,
      eventTime: startTimeStr,
      notes: `Criado a partir da consulta em ${formatIsoDateToBr(dateStr)} às ${startTimeStr}.`,
    });

    setTaskSuccessMsg(`Tarefa "${newTask.title}" adicionada com sucesso!`);
    setTimeout(() => {
      setTaskSuccessMsg('');
      setIsTaskPanelOpen(false);
    }, 3000);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const [startH, startM] = startTimeStr.split(':').map(Number);
      const [endH, endM] = endTimeStr.split(':').map(Number);

      const newStart = new Date(year, month - 1, day, startH, startM, 0);
      const newEnd = new Date(year, month - 1, day, endH, endM, 0);
      if (!Number.isFinite(newStart.getTime()) || !Number.isFinite(newEnd.getTime()) || newEnd <= newStart) {
        throw new Error('O horário final deve ser posterior ao inicial.');
      }

      let cleanSummary = summary.replace(/\[(confirmado|desmarcado|cancelado|a_confirmar|a confirmar)\]/gi, '').replace(/[✅❌]/g, '').trim();
      let statusTag = '';
      if (statusKey === 'desmarcado') statusTag = '[DESMARCADO] ';
      else if (statusKey === 'confirmado') statusTag = '[CONFIRMADO] ';

      const finalSummary = `${statusTag}${cleanSummary}`;

      const invertedColorIds = {
        online: '7',
        primeira_vez: '2',
        permuta: '3',
        presencial: '4',
        encaixe: '5',
        em_grupo: '6',
        pacote: '8',
        pessoal: '9',
        antropometria: '10',
        retorno: '11',
        amigo: '11',
        teste: '8',
      };

      if (isNew) {
        if (!cleanSummary) {
          throw new Error('Por favor, informe o nome do paciente / consulta.');
        }
        const createPayload = {
          summary: finalSummary,
          description: description,
          categoryKey: selectedCategoryKey,
          statusKey: statusKey,
          colorId: invertedColorIds[selectedCategoryKey] || '7',
          start: { dateTime: newStart.toISOString() },
          end: { dateTime: newEnd.toISOString() },
        };
        if (onCreateEvent) {
          await onCreateEvent(createPayload);
        }
        onClose();
        return;
      }

      const updatedPayload = {
        ...event,
        statusKey: statusKey,
        categoryKey: selectedCategoryKey,
        colorId: invertedColorIds[selectedCategoryKey] || event.colorId,
        summary: finalSummary,
        description: description,
        start: { dateTime: newStart.toISOString() },
        end: { dateTime: newEnd.toISOString() },
      };

      if (event.start?.date && !event.start?.dateTime) {
        throw new Error('Edite eventos de dia inteiro diretamente no Google Calendar.');
      }
      if (onUpdateEvent) {
        await onUpdateEvent(updatedPayload, statusKey);
      }
      setIsEditing(false);
    } catch (err) {
      alert('Erro ao salvar agendamento: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const eventDateFormatted = startObj.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Filtragem de pacientes para seleção
  const filteredCandidates = useMemo(() => {
    if (!patientSearch.trim()) return patients.slice(0, 10);
    const q = patientSearch.toLowerCase().trim();
    return patients
      .filter((p) => {
        const name = (p.full_name || '').toLowerCase();
        const phone = (p.whatsapp_phone || p.phone || '').replace(/\D/g, '');
        const cpf = (p.cpf || '').replace(/\D/g, '');
        return name.includes(q) || phone.includes(q) || cpf.includes(q);
      })
      .slice(0, 10);
  }, [patients, patientSearch]);

  const candidateSuggestions = useMemo(() => {
    if (!summary || patients.length === 0) return [];
    const nameKey = eventNameKey(summary);
    if (!nameKey) return [];
    const nameIndex = buildPatientNameIndex(patients);
    return rankPatientCandidates(nameKey, nameIndex).slice(0, 3).map((r) => r.patient);
  }, [summary, patients]);

  const isDateOpen = openDropdown === 'date';
  const isStartTimeOpen = openDropdown === 'startTime';
  const isEndTimeOpen = openDropdown === 'endTime';
  const isTaskDateOpen = openDropdown === 'taskDueDate';

  return createPortal(
    <div className="app-modal-overlay animate-fade-in">
      <div className="app-modal-panel max-w-2xl animate-scale-up">
        {/* Header com a categoria do WebDiet */}
        <div
          className="p-6 text-white flex justify-between items-start relative overflow-hidden transition-colors duration-300"
          style={{ backgroundColor: activeCategory.hexBg }}
        >
          <div className="relative z-10 space-y-1 max-w-[85%]">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 drop-shadow-2xs">
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                {isNew ? 'Novo Agendamento' : activeCategory.label}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                  statusKey === 'desmarcado'
                    ? 'bg-rose-500 text-white border-rose-300'
                    : statusKey === 'confirmado'
                    ? 'bg-emerald-500 text-white border-emerald-300'
                    : 'bg-white/30 text-white border-white/40'
                }`}
              >
                {statusKey === 'desmarcado' ? 'Desmarcado' : statusKey === 'confirmado' ? 'Confirmado' : 'À Confirmar'}
              </span>
            </div>

            {isEditing ? (
              <input
                type="text"
                autoFocus={isNew}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Nome do Paciente / Consulta"
                className="w-full text-lg font-bold bg-white/20 text-white placeholder-white/60 px-3 py-1.5 rounded-xl border border-white/30 focus:outline-none focus:bg-white/30 mt-2"
              />
            ) : (
              <h3 className="text-xl md:text-2xl font-black leading-tight drop-shadow-xs pt-1">
                {summary || 'Sem Nome'}
              </h3>
            )}

            <p className="text-xs text-white/90 capitalize">{eventDateFormatted}</p>
          </div>

          <button
            onClick={onClose}
            className="app-modal-close flex size-10 items-center justify-center rounded-xl bg-black/15 hover:bg-black/25 text-white transition-colors cursor-pointer"
            aria-label="Fechar detalhes do agendamento"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="app-modal-body p-6 space-y-5 text-slate-700 text-xs custom-scrollbar">
          {/* Seção de Vínculo com Prontuário do Paciente & Atalhos Rápidos */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <UserCheck className="size-3.5 text-emerald-600" />
                <span>Prontuário & Atalhos do Paciente</span>
              </span>

              {linkedPatient ? (
                <button
                  type="button"
                  onClick={handleUnlinkPatient}
                  disabled={linkingLoading}
                  className="text-[10px] font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Desvincular paciente deste agendamento"
                >
                  <Unlink className="size-3" />
                  <span>Desvincular</span>
                </button>
              ) : null}
            </div>

            {linkedPatient ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="size-9 shrink-0 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-xs shadow-2xs">
                    {linkedPatient.full_name?.slice(0, 2).toUpperCase() || 'PA'}
                  </span>
                  <div className="min-w-0">
                    <strong className="block text-sm font-bold text-slate-900 truncate">
                      {linkedPatient.full_name}
                    </strong>
                    <span className="block text-[11px] text-emerald-700 font-semibold truncate">
                      {linkedPatient.whatsapp_phone || linkedPatient.phone || 'Sem telefone'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsLinkingOpen(true)}
                    className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-white hover:bg-emerald-100/70 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                  >
                    Trocar paciente
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <AlertCircle className="size-4 text-amber-500 shrink-0" />
                  <span className="text-[11px] text-slate-600 font-medium">
                    Nenhum paciente vinculado a este agendamento.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLinkingOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-2xs cursor-pointer shrink-0"
                >
                  <Link2 className="size-3.5" />
                  <span>Vincular a cadastro existente</span>
                </button>
              </div>
            )}

            {/* Sugestões automáticas de pacientes se não houver vínculo */}
            {!linkedPatient && candidateSuggestions.length > 0 && !isLinkingOpen && (
              <div className="pt-1 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400">Sugeridos:</span>
                {candidateSuggestions.map((candidate) => (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => handleLinkPatient(candidate)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-[11px] font-semibold text-emerald-800 transition-colors cursor-pointer"
                  >
                    <span>{candidate.full_name}</span>
                    <ArrowRight className="size-2.5" />
                  </button>
                ))}
              </div>
            )}

            {/* Painel de busca e seleção de paciente */}
            {isLinkingOpen && (
              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <span className="text-[11px] font-extrabold text-slate-700">
                    Selecione o paciente cadastrado:
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsLinkingOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>

                <div className="relative">
                  <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    autoFocus
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Buscar paciente por nome, WhatsApp ou CPF..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                  {filteredCandidates.length === 0 ? (
                    <p className="text-[11px] text-slate-400 text-center py-2">
                      Nenhum paciente encontrado com esse termo.
                    </p>
                  ) : (
                    filteredCandidates.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleLinkPatient(p)}
                        className="w-full text-left p-2 rounded-lg hover:bg-emerald-50 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <strong className="block text-xs font-bold text-slate-800 truncate">
                            {p.full_name}
                          </strong>
                          <span className="block text-[10px] text-slate-500 truncate">
                            {p.whatsapp_phone || p.phone || 'Sem contato'} {p.cpf ? `· CPF ${p.cpf}` : ''}
                          </span>
                        </div>
                        <Check className="size-3.5 text-emerald-600 shrink-0 ml-2" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Atalhos Rápidos para Dieta, Anamnese, Avaliação, Conversa, Tarefas, Contrato */}
            {linkedPatient && (
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Atalhos Rápidos de {linkedPatient.full_name}
                </span>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2" role="toolbar">
                  {PATIENT_SHORTCUTS.filter((s) => !canAccessModule || canAccessModule(s.id)).map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleNavigateToPatientModule(s.id)}
                        className={`group relative flex size-9 items-center justify-center rounded-xl border border-slate-200/90 bg-slate-50/90 text-slate-600 shadow-2xs transition-all duration-200 hover:shadow-xs active:scale-95 cursor-pointer ${s.colorClasses}`}
                        title={s.tooltip}
                        aria-label={`Acessar ${s.label} de ${linkedPatient.full_name}`}
                      >
                        <Icon className={`size-4 transition-transform duration-200 group-hover:scale-110 ${s.iconColor}`} />
                        <span
                          role="tooltip"
                          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900/95 px-2.5 py-1 text-[11px] font-medium text-white shadow-md opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                        >
                          {s.tooltip}
                          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Seletor de Cor de Fundo / Tipo de Atendimento WebDiet */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                <Palette className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cor de Fundo / Tipo de Consulta</span>
              </label>
              <span className="text-[10px] font-bold text-slate-400">Padrão WebDiet</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'presencial', label: 'Presencial', hexBg: '#dc66aa' },
                { id: 'online', label: 'Online', hexBg: '#1bb3c8' },
                { id: 'primeira_vez', label: 'Primeira vez', hexBg: '#2ecc71' },
                { id: 'retorno', label: 'Retorno', hexBg: '#f25c38' },
                { id: 'pacote', label: 'Pacote', hexBg: '#767676' },
                { id: 'permuta', label: 'Permuta', hexBg: '#8e24aa' },
                { id: 'pessoal', label: 'Pessoal', hexBg: '#1e75bb' },
                { id: 'antropometria', label: 'Antropometria', hexBg: '#2e7d32' },
              ].map((cat) => {
                const isSelected = selectedCategoryKey === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryKey(cat.id);
                      setIsEditing(true);
                    }}
                    className={`p-2 rounded-xl border flex items-center space-x-2 transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'border-slate-800 bg-white ring-2 ring-slate-800/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shrink-0 shadow-2xs border border-white flex items-center justify-center"
                      style={{ backgroundColor: cat.hexBg }}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                    </span>
                    <span className={`text-[11px] truncate ${isSelected ? 'font-black text-slate-900' : 'font-semibold text-slate-600'}`}>
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status da Consulta */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Status de Atendimento</span>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'confirmado', label: 'Confirmado', border: 'border-emerald-500 text-emerald-700 bg-emerald-50' },
                { id: 'a_confirmar', label: 'À Confirmar', border: 'border-slate-300 text-slate-700 bg-slate-100' },
                { id: 'desmarcado', label: 'Desmarcado', border: 'border-rose-500 text-rose-700 bg-rose-50' },
              ].map((s) => {
                const isSelected = statusKey === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setStatusKey(s.id);
                      setIsEditing(true);
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      isSelected
                        ? `${s.border} ring-2 ring-emerald-500/20 shadow-xs font-black`
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seção de Data e Horários (PADRONIZADA NO ESTILO DA SEÇÃO 1 DO CONTRATO) */}
          <div className={`bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-3 ${openDropdown ? 'relative z-30' : 'relative z-10'}`}>
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Data & Horário do Agendamento</span>
              </label>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-emerald-700 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Editar</span>
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. SELETOR SUSPENSO DE DATA */}
                <div className="relative min-w-0 agenda-modal-dropdown">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">Data da Consulta</span>
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(isDateOpen ? null : 'date')}
                    className={`w-full min-h-11 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer flex items-center justify-between shadow-2xs active:scale-[0.99] ${
                      isDateOpen
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-white text-slate-900'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                    }`}
                    aria-expanded={isDateOpen}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Calendar className="size-4 text-emerald-600 shrink-0" aria-hidden="true" />
                      <span className={`truncate ${dateStr ? 'font-semibold text-slate-800' : 'text-slate-400'}`}>
                        {dateStr ? formatIsoDateToBr(dateStr) : 'Definir data'}
                      </span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 ml-2 opacity-70 shrink-0 transition-transform duration-200 ${
                        isDateOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isDateOpen && (
                    <div
                      className="absolute left-0 mt-2 w-72 sm:w-80 app-solid-dropdown !bg-white bg-[#ffffff] rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50 animate-scale-up space-y-1"
                      style={{ backgroundColor: '#ffffff', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
                    >
                      <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Selecionar data da consulta
                      </div>

                      <div className="max-h-52 overflow-y-auto space-y-0.5 custom-scrollbar">
                        {DATE_SHORTCUTS.map((sc) => {
                          const scDate = getFutureDate(sc.days);
                          const isSelected = dateStr === scDate;
                          return (
                            <button
                              key={sc.label}
                              type="button"
                              onClick={() => {
                                setDateStr(scDate);
                                setOpenDropdown(null);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-50 text-emerald-900 font-bold'
                                  : 'text-slate-700 hover:bg-slate-50 font-medium'
                              }`}
                            >
                              <span className="truncate">{sc.label}</span>
                              <div className="flex items-center gap-2 ml-2 shrink-0">
                                <span className="text-[11px] text-slate-400">{formatIsoDateToBr(scDate)}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="border-t border-slate-100 pt-2 mt-1 px-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Ou escolher no calendário
                        </div>
                        <input
                          type="date"
                          value={dateStr}
                          onChange={(e) => {
                            setDateStr(e.target.value);
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. SELETOR SUSPENSO DE HORÁRIO INICIAL */}
                <div className="relative min-w-0 agenda-modal-dropdown">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">Horário de Início</span>
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(isStartTimeOpen ? null : 'startTime')}
                    className={`w-full min-h-11 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer flex items-center justify-between shadow-2xs active:scale-[0.99] ${
                      isStartTimeOpen
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-white text-slate-900'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                    }`}
                    aria-expanded={isStartTimeOpen}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Clock className="size-4 text-emerald-600 shrink-0" aria-hidden="true" />
                      <span className={`truncate ${startTimeStr ? 'font-semibold text-slate-800' : 'text-slate-400'}`}>
                        {startTimeStr || 'Início'}
                      </span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 ml-1 opacity-70 shrink-0 transition-transform duration-200 ${
                        isStartTimeOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isStartTimeOpen && (
                    <div
                      className="absolute left-0 mt-2 w-48 app-solid-dropdown !bg-white bg-[#ffffff] rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50 animate-scale-up space-y-1"
                      style={{ backgroundColor: '#ffffff', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
                    >
                      <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Horário de Início
                      </div>

                      <div className="max-h-52 overflow-y-auto space-y-0.5 custom-scrollbar">
                        {TIME_OPTIONS.map((time) => {
                          const isSelected = startTimeStr === time;
                          return (
                            <button
                              key={time}
                              type="button"
                              onClick={() => {
                                setStartTimeStr(time);
                                // Sugere término padrão 50 minutos depois se não configurado
                                const [h, m] = time.split(':').map(Number);
                                const endM = m + 50;
                                const newEndH = h + Math.floor(endM / 60);
                                const remM = endM % 60;
                                const calcEnd = `${String(newEndH).padStart(2, '0')}:${String(remM).padStart(2, '0')}`;
                                if (endTimeStr <= time) {
                                  setEndTimeStr(calcEnd);
                                }
                                setOpenDropdown(null);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-50 text-emerald-900 font-bold'
                                  : 'text-slate-700 hover:bg-slate-50 font-medium'
                              }`}
                            >
                              <span className="font-medium text-slate-800">{time}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                            </button>
                          );
                        })}
                      </div>

                      <div className="border-t border-slate-100 pt-2 mt-1 px-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Horário livre
                        </div>
                        <input
                          type="time"
                          value={startTimeStr}
                          onChange={(e) => setStartTimeStr(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. SELETOR SUSPENSO DE HORÁRIO DE TÉRMINO */}
                <div className="relative min-w-0 agenda-modal-dropdown">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">Horário de Fim</span>
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(isEndTimeOpen ? null : 'endTime')}
                    className={`w-full min-h-11 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer flex items-center justify-between shadow-2xs active:scale-[0.99] ${
                      isEndTimeOpen
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-white text-slate-900'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                    }`}
                    aria-expanded={isEndTimeOpen}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Clock className="size-4 text-emerald-600 shrink-0" aria-hidden="true" />
                      <span className={`truncate ${endTimeStr ? 'font-semibold text-slate-800' : 'text-slate-400'}`}>
                        {endTimeStr || 'Fim'}
                      </span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 ml-1 opacity-70 shrink-0 transition-transform duration-200 ${
                        isEndTimeOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isEndTimeOpen && (
                    <div
                      className="absolute right-0 sm:left-0 mt-2 w-48 app-solid-dropdown !bg-white bg-[#ffffff] rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50 animate-scale-up space-y-1"
                      style={{ backgroundColor: '#ffffff', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
                    >
                      <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Horário de Fim
                      </div>

                      <div className="max-h-52 overflow-y-auto space-y-0.5 custom-scrollbar">
                        {TIME_OPTIONS.map((time) => {
                          const isSelected = endTimeStr === time;
                          return (
                            <button
                              key={time}
                              type="button"
                              onClick={() => {
                                setEndTimeStr(time);
                                setOpenDropdown(null);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-50 text-emerald-900 font-bold'
                                  : 'text-slate-700 hover:bg-slate-50 font-medium'
                              }`}
                            >
                              <span className="font-medium text-slate-800">{time}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                            </button>
                          );
                        })}
                      </div>

                      <div className="border-t border-slate-100 pt-2 mt-1 px-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Horário livre
                        </div>
                        <input
                          type="time"
                          value={endTimeStr}
                          onChange={(e) => setEndTimeStr(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{formatIsoDateToBr(dateStr)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{startTimeStr} às {endTimeStr}</span>
                </div>
              </div>
            )}
          </div>

          {/* Painel: Inserir como Tarefa / Demanda Clínica */}
          <div className={`bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5 ${isTaskDateOpen ? 'relative z-30' : 'relative z-10'}`}>
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Demandas & Tarefas Clínicas</span>
              </label>

              <button
                type="button"
                onClick={() => setIsTaskPanelOpen((prev) => !prev)}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>{isTaskPanelOpen ? 'Recolher' : 'Inserir como Tarefa'}</span>
              </button>
            </div>

            {taskSuccessMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fade-in">
                <CheckCircle className="size-4 text-emerald-700 shrink-0" />
                <span className="flex-1">{taskSuccessMsg}</span>
              </div>
            )}

            {isTaskPanelOpen && (
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-3 animate-fade-in">
                {/* Seleção de Tipo de Tarefa */}
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Qual o tipo da tarefa?
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {TASK_QUICK_TYPES.map((t) => {
                      const isSelected = selectedTaskType === t.id;
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedTaskType(t.id)}
                          className={`p-2 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-500/20'
                              : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <Icon className={`size-4 shrink-0 mt-0.5 ${t.iconColor}`} />
                          <div className="min-w-0">
                            <span className={`block text-[11px] truncate ${isSelected ? 'font-black text-emerald-900' : 'font-bold text-slate-700'}`}>
                              {t.label}
                            </span>
                            <span className="block text-[9px] text-slate-500 truncate">
                              {t.desc}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Título da Tarefa e Prazo */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">Título da Demanda</span>
                    <input
                      type="text"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="Ex: Elaborar plano alimentar de..."
                      className="w-full min-h-11 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>

                  {/* SELETOR SUSPENSO DE DATA DE ENTREGA (PADRÃO CONTRATO) */}
                  <div className="relative min-w-0 agenda-modal-dropdown">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">Prazo de Entrega</span>
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(isTaskDateOpen ? null : 'taskDueDate')}
                      className={`w-full min-h-11 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer flex items-center justify-between shadow-2xs active:scale-[0.99] ${
                        isTaskDateOpen
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-white text-slate-900'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                      }`}
                      aria-expanded={isTaskDateOpen}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Calendar className="size-4 text-emerald-600 shrink-0" aria-hidden="true" />
                        <span className={`truncate ${taskDueDate ? 'font-semibold text-slate-800 text-xs' : 'text-slate-400 text-xs'}`}>
                          {taskDueDate ? formatIsoDateToBr(taskDueDate) : 'Definir prazo'}
                        </span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 ml-1 opacity-70 shrink-0 transition-transform duration-200 ${
                          isTaskDateOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isTaskDateOpen && (
                      <div
                        className="absolute right-0 sm:left-0 mt-2 w-72 sm:w-80 app-solid-dropdown !bg-white bg-[#ffffff] rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50 animate-scale-up space-y-1"
                        style={{ backgroundColor: '#ffffff', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
                      >
                        <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          Selecionar prazo da tarefa
                        </div>

                        <div className="max-h-52 overflow-y-auto space-y-0.5 custom-scrollbar">
                          {DATE_SHORTCUTS.map((sc) => {
                            const scDate = getFutureDate(sc.days);
                            const isSelected = taskDueDate === scDate;
                            return (
                              <button
                                key={sc.label}
                                type="button"
                                onClick={() => {
                                  setTaskDueDate(scDate);
                                  setOpenDropdown(null);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-50 text-emerald-900 font-bold'
                                    : 'text-slate-700 hover:bg-slate-50 font-medium'
                                }`}
                              >
                                <span className="truncate">{sc.label}</span>
                                <div className="flex items-center gap-2 ml-2 shrink-0">
                                  <span className="text-[11px] text-slate-400">{formatIsoDateToBr(scDate)}</span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <div className="border-t border-slate-100 pt-2 mt-1 px-2">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Ou escolher no calendário
                          </div>
                          <input
                            type="date"
                            value={taskDueDate}
                            onChange={(e) => {
                              setTaskDueDate(e.target.value);
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400">Prioridade:</span>
                    {['baixa', 'media', 'alta'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setTaskPriority(p)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider cursor-pointer border ${
                          taskPriority === p
                            ? p === 'alta'
                              ? 'bg-rose-50 text-rose-700 border-rose-300'
                              : p === 'media'
                              ? 'bg-amber-50 text-amber-700 border-amber-300'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-white text-slate-400 border-slate-200'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateTaskFromEvent}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                    <span>Salvar Tarefa</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Link Universal do Google Meet */}
          <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-200/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center space-x-1.5">
                <Video className="w-3.5 h-3.5 text-emerald-600" />
                <span>Link da Reunião (Google Meet)</span>
              </label>

              <div className="flex items-center space-x-2">
                {isEditingMeet ? (
                  <button
                    onClick={handleSaveMeet}
                    className="text-[10px] text-emerald-700 font-bold hover:underline flex items-center space-x-0.5 cursor-pointer"
                  >
                    <Save className="w-3 h-3" />
                    <span>Salvar link</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditingMeet(true)}
                    className="text-[10px] text-slate-500 hover:text-emerald-700 font-bold flex items-center space-x-0.5 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Alterar link</span>
                  </button>
                )}
              </div>
            </div>

            {isEditingMeet ? (
              <input
                type="text"
                value={customMeetLink}
                onChange={(e) => setCustomMeetLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            ) : (
              <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-emerald-200/80 gap-2">
                <a
                  href={customMeetLink}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-emerald-700 hover:underline truncate flex items-center space-x-1.5"
                >
                  <span className="truncate">{customMeetLink}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>

                <button
                  type="button"
                  onClick={handleCopyMeet}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 shrink-0 cursor-pointer ${
                    copiedMeet ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                  title="Copiar Link para envio"
                >
                  {copiedMeet ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedMeet ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            )}
            <p className="text-[10px] text-slate-400">
              * Este mesmo link é reutilizado em todas as consultas online de {getOwnerLabel()}.
            </p>
          </div>

          {/* Observações / Descrição */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
              Observações do Agendamento
            </span>
            {isEditing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Observações ou anotações clínicas..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-emerald-500 resize-none"
              />
            ) : (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 whitespace-pre-wrap max-h-28 overflow-y-auto">
                {description || 'Nenhuma observação registrada.'}
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="pt-2 flex flex-col gap-2">
            {isEditing ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => (isNew ? onClose() : setIsEditing(false))}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Salvando...' : isNew ? 'Criar Agendamento' : 'Salvar Alterações'}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const greeting = `Olá, tudo bem? Confirmando seu atendimento com ${getOwnerLabel()} dia ${startObj.toLocaleDateString('pt-BR')} às ${startTimeStr}.`;
                  const meetText = activeCategory.label.toLowerCase().includes('online')
                    ? `\nLink da Reunião (Google Meet): ${customMeetLink}`
                    : '';
                  const query = encodeURIComponent(`${greeting}${meetText}`);
                  window.open(`https://wa.me/?text=${query}`, '_blank');
                }}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Confirmação e Meet no WhatsApp</span>
              </button>
            )}

            {!isNew && !isEditing && (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Fechar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
