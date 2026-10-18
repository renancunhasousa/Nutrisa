import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Bell,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  CheckSquare,
  CreditCard,
  FileSignature,
  FileText,
  HeartPulse,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  NotebookText,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuth } from '../auth/useAuth.js';
import { usePatient } from './usePatient.js';
import PatientFormDialog from './components/PatientFormDialog.jsx';
import WhatsAppPatientCandidates from './components/WhatsAppPatientCandidates.jsx';
import CalendarLinkReview from '../crm/components/CalendarLinkReview.jsx';
import { useCalendarPatientLinks } from '../crm/hooks/useCalendarPatientLinks.js';
import { archivePatient, createPatient, findPatientByPhone, updatePatient } from './services/patients.js';
import { writePatientHandoff } from './services/patientHandoff.js';
import { runPatientDataSweep } from './services/patientSweep.js';
import PageHeader from '../../shared/ui/PageHeader.jsx';
import { linkConversationsToPatient } from '../atendimento/services/conversations.js';
import PatientAiSummary from './components/PatientAiSummary.jsx';
import PatientClinicalHistory from './components/PatientClinicalHistory.jsx';

const STAGE_LABELS = {
  lead: 'Lead',
  scheduled: 'Agendado',
  active: 'Em acompanhamento',
  at_risk: 'Atenção',
  inactive: 'Inativo',
  churned: 'Encerrado',
};

const SEX_LABELS = {
  female: 'Feminino',
  male: 'Masculino',
  other: 'Outro',
};

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
    id: 'agenda',
    label: 'Agenda',
    icon: Calendar,
    tooltip: 'Ver agenda e consultas deste paciente',
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

function normalizeSex(sex) {
  if (!sex) return null;
  const s = String(sex).trim().toLowerCase();
  if (s === 'f' || s === 'female' || s === 'feminino') return 'female';
  if (s === 'm' || s === 'male' || s === 'masculino') return 'male';
  if (s === 'other' || s === 'outro') return 'other';
  return sex;
}

function GenderBadge({ sex }) {
  const normalized = normalizeSex(sex);
  if (normalized === 'female') {
    return (
      <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
        <span className="text-sm font-black leading-none text-pink-500" aria-label="Feminino" title="Feminino">♀</span>
        <span>Feminino</span>
      </span>
    );
  }
  if (normalized === 'male') {
    return (
      <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
        <span className="text-sm font-black leading-none text-sky-500" aria-label="Masculino" title="Masculino">♂</span>
        <span>Masculino</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 font-medium text-slate-400">
      {SEX_LABELS[normalized] || sex || 'Não informado'}
    </span>
  );
}

function formatDateTime(value, fallback = 'Não registrada') {
  if (!value) return fallback;
  try {
    const raw = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const [year, month, day] = raw.split('-').map(Number);
      return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(year, month - 1, day));
    }
    const d = new Date(raw);
    if (isNaN(d.getTime())) return fallback;
    const hasTime = raw.includes('T') && !raw.endsWith('T00:00:00.000Z') && !raw.endsWith('T00:00:00Z') && !raw.endsWith('T00:00:00');
    if (hasTime) {
      return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(d);
    }
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(d);
  } catch {
    return fallback;
  }
}

function formatBirthDateWithAge(value) {
  if (!value) return 'Não informado';
  try {
    const raw = String(value).trim();
    let birthDate;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const [year, month, day] = raw.split('-').map(Number);
      birthDate = new Date(year, month - 1, day);
    } else {
      birthDate = new Date(raw);
    }
    if (isNaN(birthDate.getTime())) return value;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    const formatted = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(birthDate);
    return age >= 0 && age < 130 ? `${formatted} (${age} anos)` : formatted;
  } catch {
    return value;
  }
}

const formatDate = (value) => formatBirthDateWithAge(value);

export default function PacientesPage({ onNavigate, activeModel }) {
  const { organizationId, canAccessModule } = useAuth();
  const { patients, selectedPatient, selectPatient, refreshPatients, loading, error } = usePatient();
  const calendar = useCalendarPatientLinks({ patients, organizationId });
  const [pendingCalendarLinkKey, setPendingCalendarLinkKey] = useState('');
  const [search, setSearch] = useState('');
  const detailPanelRef = useRef(null);
  const [detailPanelHeight, setDetailPanelHeight] = useState(null);

  useEffect(() => {
    const panel = detailPanelRef.current;
    if (!panel || typeof ResizeObserver === 'undefined') return undefined;
    const syncHeight = () => {
      const rect = panel.getBoundingClientRect();
      if (rect.height > 0) {
        setDetailPanelHeight(Math.round(rect.height));
      }
    };
    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [selectedPatient]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [initialValues, setInitialValues] = useState(null);
  const [deletingPatientId, setDeletingPatientId] = useState('');
  const [actionError, setActionError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const handleSweepData = async () => {
    setSyncing(true);
    setSyncResult(null);
    setActionError('');
    try {
      const result = await runPatientDataSweep({ organizationId, patients });
      await refreshPatients();
      setSyncResult(result);
      setTimeout(() => setSyncResult(null), 10000);
    } catch (err) {
      setActionError(err.message || 'Falha ao sincronizar dados da base.');
    } finally {
      setSyncing(false);
    }
  };

  const handleNavigate = async (mode) => {
    if (selectedPatient) {
      selectPatient(selectedPatient);
      writePatientHandoff(mode, selectedPatient);
      if (mode === 'dashboard') {
        try {
          await linkConversationsToPatient({
            organizationId,
            patientId: selectedPatient.id,
            phone: selectedPatient.whatsapp_phone || selectedPatient.phone,
          });
        } catch {}
      }
      if (mode === 'tarefas') {
        try {
          sessionStorage.setItem('nutrisa_tasks_patient_filter', JSON.stringify({
            id: selectedPatient.id,
            name: selectedPatient.full_name,
          }));
        } catch {}
      }
    }
    if (typeof onNavigate === 'function') {
      onNavigate(mode);
    } else {
      window.location.hash = `#${mode}`;
    }
  };

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    if (!query) return patients;
    return patients.filter((patient) => [
      patient.full_name,
      patient.preferred_name,
      patient.email,
      patient.phone,
      patient.whatsapp_phone,
      patient.cpf,
    ].some((value) => value?.toLocaleLowerCase('pt-BR').includes(query)));
  }, [patients, search]);

  const savePatient = async (form) => {
    let saved;
    if (editingPatient) {
      saved = await updatePatient(editingPatient.id, form);
    } else if (initialValues?.acquisition_source === 'WhatsApp') {
      saved = await findPatientByPhone(organizationId, form.whatsapp_phone || form.phone)
        || await createPatient(organizationId, form);
    } else {
      saved = await createPatient(organizationId, form);
    }
    if (pendingCalendarLinkKey && saved?.id) {
      try {
        await calendar.link(pendingCalendarLinkKey, saved.id);
      } catch (err) {
        console.error('Falha ao vincular paciente à agenda:', err);
      }
      setPendingCalendarLinkKey('');
    }
    await refreshPatients();
    selectPatient(saved);
  };

  const openNewPatient = () => {
    setPendingCalendarLinkKey('');
    setEditingPatient(null);
    setInitialValues(null);
    setDialogOpen(true);
  };

  const openWhatsAppContact = (draft) => {
    setPendingCalendarLinkKey('');
    setEditingPatient(null);
    setInitialValues(draft);
    setDialogOpen(true);
  };

  const openRegisterFromCalendar = (draft, nameKey) => {
    setPendingCalendarLinkKey(nameKey || '');
    setEditingPatient(null);
    setInitialValues(draft);
    setDialogOpen(true);
  };

  const registerWhatsAppContacts = async (contacts) => {
    let created = 0;
    let skipped = 0;

    try {
      for (const contact of contacts) {
        const draft = {
          ...contact.draft,
          full_name: contact.draft.full_name || contact.name,
        };
        const existingPatient = await findPatientByPhone(organizationId, draft.whatsapp_phone || draft.phone);
        if (existingPatient) {
          skipped += 1;
          continue;
        }
        await createPatient(organizationId, draft);
        created += 1;
      }
    } finally {
      await refreshPatients();
    }

    return { created, skipped };
  };

  const openEditPatient = (patient) => {
    selectPatient(patient);
    setEditingPatient(patient);
    setInitialValues(null);
    setDialogOpen(true);
  };

  const removePatient = async (patient) => {
    if (!window.confirm(`Excluir “${patient.full_name}” da lista de pacientes? O cadastro será arquivado.`)) return;

    setDeletingPatientId(patient.id);
    setActionError('');
    try {
      await archivePatient(patient.id);
      if (selectedPatient?.id === patient.id) selectPatient(null);
      await refreshPatients();
    } catch (archiveError) {
      setActionError(archiveError.message || 'Não foi possível excluir o paciente.');
    } finally {
      setDeletingPatientId('');
    }
  };

  return (
    <div className="animate-fadeIn space-y-5">
      <PageHeader
        category="Base da clínica"
        title="Cadastro de pacientes"
        description="Dados cadastrais, informações pessoais e contatos dos pacientes."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSweepData}
              disabled={syncing || loading}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-400 active:scale-95 disabled:opacity-50 shadow-2xs transition-all cursor-pointer"
              title="Cruza fotos do WhatsApp e consultas da agenda para enriquecer a base de pacientes"
            >
              <RefreshCw className={`size-3.5 text-emerald-600 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Sincronizando…' : 'Sincronizar base'}</span>
            </button>
            <button
              type="button"
              onClick={openNewPatient}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="size-4" /> Novo paciente
            </button>
          </div>
        }
      />

      {syncResult ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-xs font-medium text-emerald-950 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            <span>
              Varredura concluída: <strong>{syncResult.photosUpdated}</strong> fotos atualizadas
              {syncResult.conversationsLinked > 0 ? `, ${syncResult.conversationsLinked} conversas vinculadas` : ''}
              {syncResult.calendarConnected
                ? `, ${syncResult.appointmentsSynced} datas de consultas sincronizadas com a agenda.`
                : ' (Dica: conecte a agenda na aba Agenda para sincronizar datas de consultas).'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSyncResult(null)}
            className="text-[11px] font-bold text-emerald-800 hover:underline cursor-pointer"
          >
            Fechar
          </button>
        </div>
      ) : null}

      <div className="grid min-w-0 gap-5 lg:items-start lg:grid-cols-[22.5rem_minmax(0,1fr)]">
        <aside
          className="min-h-0 min-w-0 flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm max-h-[75vh] lg:max-h-none lg:sticky lg:top-20"
          style={detailPanelHeight ? { height: `${detailPanelHeight}px`, maxHeight: `${detailPanelHeight}px` } : undefined}
          aria-label="Lista de pacientes"
        >
          <form role="search" className="relative mb-3 shrink-0" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="patient-search" className="sr-only">Buscar paciente</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input id="patient-search" name="patient-search" type="search" autoComplete="off" spellCheck="false" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome, CPF, telefone ou e-mail" className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-base sm:text-sm" />
          </form>

          {actionError ? <p role="alert" className="mb-2 shrink-0 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">{actionError}</p> : null}

          {loading ? (
            <p className="p-4 text-sm text-slate-500">Carregando pacientes…</p>
          ) : error ? (
            <p role="alert" className="p-4 text-sm text-rose-700">{error}</p>
          ) : filteredPatients.length ? (
            <div className="flex-1 min-h-0 space-y-1 overflow-y-auto overscroll-contain pr-1.5 [scrollbar-width:thin] [scrollbar-color:theme(colors.slate.300)_transparent]">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className={`group relative flex min-h-14 w-full items-center rounded-2xl transition-colors ${
                    selectedPatient?.id === patient.id ? 'bg-emerald-50 text-emerald-900' : 'hover:bg-slate-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => selectPatient(patient)}
                    aria-pressed={selectedPatient?.id === patient.id}
                    className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2.5 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                  >
                    <PatientAvatar patient={patient} />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block text-[13px] font-bold leading-snug line-clamp-2 text-slate-800"
                        title={patient.full_name}
                      >
                        {patient.full_name}
                      </span>
                      <span className="block truncate text-[11px] font-medium text-slate-400">
                        {patient.whatsapp_phone || patient.phone || patient.email || 'Sem contato'}
                      </span>
                    </span>
                  </button>
                  <div
                    className={`flex shrink-0 items-center gap-0.5 pr-1.5 transition-opacity duration-150 ${
                      selectedPatient?.id === patient.id
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => openEditPatient(patient)}
                      aria-label={`Editar cadastro de ${patient.full_name}`}
                      title="Editar cadastro"
                      className="inline-flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-emerald-700 hover:shadow-2xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-colors"
                    >
                      <Pencil className="size-3" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removePatient(patient)}
                      disabled={deletingPatientId === patient.id}
                      aria-label={`Excluir ${patient.full_name}`}
                      title="Excluir paciente"
                      className="inline-flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-wait disabled:opacity-50 transition-colors"
                    >
                      <Trash2 className="size-3" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <Users className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm text-slate-500">Nenhum paciente encontrado.</p>
            </div>
          )}
        </aside>

        <section ref={detailPanelRef} className="min-w-0" aria-live="polite">
          {!selectedPatient ? (
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex min-h-28 items-center gap-3 border-b border-slate-100 pb-5">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
                  <UserRound className="size-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800">Selecione um cadastro</h2>
                  <p className="text-sm text-slate-500">Consulte ou edite os dados do paciente selecionado.</p>
                </div>
              </div>
              <div className="my-6 border-t border-slate-200/90" />
              <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-[0.06em] text-slate-400">Resumo com IA</h3>
                <p className="mt-3 text-xs text-slate-400">Selecione um paciente para visualizar o resumo.</p>
              </section>
              <div className="my-6 border-t border-slate-200/90" />
              <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-[0.06em] text-slate-400">Prontuário e histórico</h3>
                <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
                  Selecione um paciente para visualizar os registros.
                </div>
              </section>
            </article>
          ) : (
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex min-w-0 items-center gap-3.5 flex-1">
                  <PatientAvatar patient={selectedPatient} size="large" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold tracking-wide text-emerald-700">
                        {STAGE_LABELS[selectedPatient.lifecycle_stage] || 'Paciente'}
                      </span>
                      {selectedPatient.acquisition_source ? (
                        <span className="text-[11px] font-semibold text-slate-400">
                          • {selectedPatient.acquisition_source}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-slate-900 sm:text-2xl" title={selectedPatient.full_name}>
                        {selectedPatient.full_name}
                      </h2>
                      <button
                        type="button"
                        onClick={() => openEditPatient(selectedPatient)}
                        aria-label={`Editar cadastro de ${selectedPatient.full_name}`}
                        title="Editar cadastro"
                        className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-emerald-700"
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                    {selectedPatient.preferred_name ? (
                      <p className="truncate text-xs font-medium text-slate-500">
                        Nome preferido: <span className="font-semibold text-slate-700">{selectedPatient.preferred_name}</span>
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0 xl:items-end">
                  <span className="text-xs font-bold uppercase tracking-[0.06em] text-slate-400">
                    Atalhos rápidos
                  </span>
                  <div
                    className="flex flex-wrap items-center gap-1.5 sm:gap-2"
                    role="toolbar"
                    aria-label={`Ações rápidas vinculadas a ${selectedPatient.full_name}`}
                  >
                    {PATIENT_SHORTCUTS.filter((shortcut) => canAccessModule(shortcut.id)).map((shortcut) => {
                      const Icon = shortcut.icon;
                      return (
                        <button
                          key={shortcut.id}
                          type="button"
                          onClick={() => handleNavigate(shortcut.id)}
                          className={`group relative flex size-9 items-center justify-center rounded-xl border border-slate-200/90 bg-slate-50/90 text-slate-600 shadow-2xs backdrop-blur-xs transition-all duration-200 hover:shadow-xs active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${shortcut.colorClasses}`}
                          title={shortcut.tooltip}
                          aria-label={`Acessar ${shortcut.label} de ${selectedPatient.full_name}`}
                        >
                          <Icon className={`size-4 transition-transform duration-200 group-hover:scale-110 ${shortcut.iconColor}`} aria-hidden="true" />
                          <span
                            role="tooltip"
                            className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900/95 px-2.5 py-1 text-[11px] font-medium text-white shadow-md backdrop-blur-xs opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                          >
                            {shortcut.tooltip}
                            <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Faixa compacta de Consultas */}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 px-3.5 py-2.5 shadow-2xs">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-2xs">
                    <CalendarClock className="size-4 text-slate-600" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Última consulta</p>
                    <p className="text-xs font-bold text-slate-800 truncate" title={selectedPatient.last_consultation_at || ''}>
                      {formatDateTime(selectedPatient.last_consultation_at, 'Nenhuma registrada')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 px-3.5 py-2.5 shadow-2xs">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-2xs">
                    <CalendarCheck className="size-4 text-slate-600" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Próxima consulta</p>
                    <p className="text-xs font-bold text-slate-800 truncate" title={selectedPatient.next_appointment_at || ''}>
                      {formatDateTime(selectedPatient.next_appointment_at, 'Não agendada')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ficha cadastral compacta e de alta densidade */}
              <div className="mt-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 shadow-2xs sm:p-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 text-xs">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Sexo</span>
                    <div className="mt-1">
                      <GenderBadge sex={selectedPatient.sex} />
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Nascimento</span>
                    <div className="mt-1 flex items-center gap-1.5 font-semibold text-slate-700 truncate" title={selectedPatient.birth_date}>
                      <Calendar className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                      <span className="truncate">{formatBirthDateWithAge(selectedPatient.birth_date)}</span>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">WhatsApp</span>
                    {(selectedPatient.whatsapp_phone || selectedPatient.phone) ? (
                      <a
                        href={`https://wa.me/55${(selectedPatient.whatsapp_phone || selectedPatient.phone).replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800 hover:underline truncate"
                        title="Abrir conversa no WhatsApp"
                      >
                        <MessageCircle className="size-3.5 shrink-0 text-emerald-600" />
                        <span className="truncate">{selectedPatient.whatsapp_phone || selectedPatient.phone}</span>
                      </a>
                    ) : (
                      <p className="mt-1 font-medium text-slate-400">Não informado</p>
                    )}
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">E-mail</span>
                    {selectedPatient.email ? (
                      <a
                        href={`mailto:${selectedPatient.email}`}
                        className="mt-1 inline-flex items-center gap-1.5 font-semibold text-slate-700 hover:text-emerald-700 hover:underline truncate max-w-full"
                        title={selectedPatient.email}
                      >
                        <Mail className="size-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{selectedPatient.email}</span>
                      </a>
                    ) : (
                      <p className="mt-1 font-medium text-slate-400">Não informado</p>
                    )}
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">CPF</span>
                    <div className="mt-1 flex items-center gap-1.5 font-semibold text-slate-700 truncate">
                      <CreditCard className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                      <span className="truncate">{selectedPatient.cpf || 'Não informado'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Origem</span>
                    <div className="mt-1 flex items-center gap-1.5 font-semibold text-slate-700 truncate">
                      <MapPin className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                      <span className="truncate">{selectedPatient.acquisition_source || 'Não informada'}</span>
                    </div>
                  </div>
                </div>

                {/* Consentimentos e Observações integrados de forma compacta */}
                {(selectedPatient.consent_health_data_at || selectedPatient.consent_communications_at || selectedPatient.notes) ? (
                  <div className="mt-3 border-t border-slate-200/70 pt-2.5 flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedPatient.consent_health_data_at ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/70">
                          <HeartPulse className="size-2.5 text-emerald-600" /> Consentimento de saúde ativo
                        </span>
                      ) : null}
                      {selectedPatient.consent_communications_at ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 border border-sky-200/70">
                          <Bell className="size-2.5 text-sky-600" /> Comunicações autorizadas
                        </span>
                      ) : null}
                    </div>

                    {selectedPatient.notes ? (
                      <div className="rounded-xl bg-white p-2.5 border border-slate-200/80 text-xs shadow-2xs">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          <NotebookText className="size-3 text-emerald-600" />
                          <span>Observações</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-600 whitespace-pre-wrap">
                          {selectedPatient.notes}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="my-6 border-t border-slate-200/90" />
              <PatientAiSummary patient={selectedPatient} activeModel={activeModel} />
              <div className="my-6 border-t border-slate-200/90" />
              <PatientClinicalHistory patient={selectedPatient} onNavigate={handleNavigate} />
            </article>
          )}
        </section>
      </div>

      <CalendarLinkReview
        state={calendar.state}
        error={calendar.error}
        groups={calendar.groups}
        patients={patients}
        onLink={calendar.link}
        onLinkMany={calendar.linkMany}
        onIgnore={calendar.ignore}
        onUnlink={calendar.unlink}
        onRefresh={calendar.refresh}
        onOpenAgenda={() => handleNavigate('agenda')}
        onRegister={openRegisterFromCalendar}
      />

      <WhatsAppPatientCandidates onRegister={openWhatsAppContact} onRegisterAll={registerWhatsAppContacts} />

      <PatientFormDialog open={dialogOpen} patient={editingPatient} initialValues={initialValues} onClose={() => setDialogOpen(false)} onSave={savePatient} />
    </div>
  );
}

function PatientAvatar({ patient, size = 'default' }) {
  const [failedImageUrl, setFailedImageUrl] = useState('');

  const sizeClass = size === 'large' ? 'size-14 rounded-2xl text-base' : 'size-9 rounded-xl text-sm';
  const showImage = patient.avatar_url && patient.avatar_url !== failedImageUrl;

  return (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden bg-slate-100 font-black text-slate-600 ${sizeClass}`} aria-hidden="true">
      {showImage ? (
        <img
          src={patient.avatar_url}
          alt=""
          width={size === 'large' ? 56 : 36}
          height={size === 'large' ? 56 : 36}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="size-full object-cover"
          onError={() => setFailedImageUrl(patient.avatar_url)}
        />
      ) : patient.full_name.slice(0, 2).toUpperCase()}
    </span>
  );
}

function PatientDetail({ icon: Icon, label, value, href }) {
  const isLink = Boolean(href && value && value !== 'Não informado');

  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-xs">
      <dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.06em] text-slate-500">
        <Icon className="size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1.5 break-words text-[0.6875rem] font-medium leading-4 text-slate-700">
        {isLink ? (
          <a
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
