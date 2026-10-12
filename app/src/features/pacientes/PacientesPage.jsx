import { useMemo, useState } from 'react';
import {
  Activity,
  Bell,
  Calendar,
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
  Phone,
  Plus,
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
import { archivePatient, createPatient, findPatientByPhone, updatePatient } from './services/patients.js';
import { writePatientHandoff } from './services/patientHandoff.js';
import PageHeader from '../../shared/ui/PageHeader.jsx';
import { linkConversationsToPatient } from '../atendimento/services/conversations.js';
import PatientAiSummary from './components/PatientAiSummary.jsx';

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
    tooltip: 'Acessar Plano Alimentar e Metas',
    colorClasses: 'hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800',
    iconColor: 'text-sky-600',
  },
  {
    id: 'anamnese',
    label: 'Anamnese',
    icon: FileText,
    tooltip: 'Acessar Anamnese e Histórico Clínico',
    colorClasses: 'hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800',
    iconColor: 'text-sky-600',
  },
  {
    id: 'laudo',
    label: 'Avaliação',
    icon: Activity,
    tooltip: 'Acessar Avaliação Física, Bioimpedância e Laudos',
    colorClasses: 'hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800',
    iconColor: 'text-sky-600',
  },
  {
    id: 'dashboard',
    label: 'Conversa',
    icon: MessageSquare,
    tooltip: 'Acessar Atendimento e Conversas',
    colorClasses: 'hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800',
    iconColor: 'text-sky-600',
  },
  {
    id: 'agenda',
    label: 'Agenda',
    icon: Calendar,
    tooltip: 'Acessar Agenda e Consultas',
    colorClasses: 'hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800',
    iconColor: 'text-sky-600',
  },
  {
    id: 'tarefas',
    label: 'Tarefas',
    icon: CheckSquare,
    tooltip: 'Acessar Tarefas e Demandas',
    colorClasses: 'hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800',
    iconColor: 'text-sky-600',
  },
  {
    id: 'contratos',
    label: 'Contrato',
    icon: FileSignature,
    tooltip: 'Acessar Contratos e Propostas',
    colorClasses: 'hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800',
    iconColor: 'text-sky-600',
  },
];

const formatDate = (value) => value
  ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(`${value}T12:00:00`))
  : 'Não informado';

export default function PacientesPage({ onNavigate, activeModel }) {
  const { organizationId } = useAuth();
  const { patients, selectedPatient, selectPatient, refreshPatients, loading, error } = usePatient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [initialValues, setInitialValues] = useState(null);
  const [deletingPatientId, setDeletingPatientId] = useState('');
  const [actionError, setActionError] = useState('');

  const handleNavigate = (mode) => {
    if (selectedPatient) {
      selectPatient(selectedPatient);
      writePatientHandoff(mode, selectedPatient);
      if (mode === 'dashboard') {
        linkConversationsToPatient({
          organizationId,
          patientId: selectedPatient.id,
          phone: selectedPatient.whatsapp_phone || selectedPatient.phone,
        }).catch(() => {});
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
    await refreshPatients();
    selectPatient(saved);
  };

  const openNewPatient = () => {
    setEditingPatient(null);
    setInitialValues(null);
    setDialogOpen(true);
  };

  const openWhatsAppContact = (draft) => {
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
          <button type="button" onClick={openNewPatient} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700">
            <Plus className="size-4" /> Novo paciente
          </button>
        }
      />

      <div className="grid min-w-0 gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="min-w-0 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm" aria-label="Lista de pacientes">
          <form role="search" className="relative mb-3" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="patient-search" className="sr-only">Buscar paciente</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input id="patient-search" name="patient-search" type="search" autoComplete="off" spellCheck="false" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome, CPF, telefone ou e-mail" className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-base sm:text-sm" />
          </form>

          {actionError ? <p role="alert" className="mb-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">{actionError}</p> : null}

          {loading ? (
            <p className="p-4 text-sm text-slate-500">Carregando pacientes…</p>
          ) : error ? (
            <p role="alert" className="p-4 text-sm text-rose-700">{error}</p>
          ) : filteredPatients.length ? (
            <div className="max-h-[65vh] space-y-1 overflow-y-auto">
              {filteredPatients.map((patient) => (
                <div key={patient.id} className={`flex min-h-14 w-full items-center rounded-2xl ${selectedPatient?.id === patient.id ? 'bg-emerald-50 text-emerald-900' : 'hover:bg-slate-50'}`}>
                  <button type="button" onClick={() => selectPatient(patient)} aria-pressed={selectedPatient?.id === patient.id} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
                    <PatientAvatar patient={patient} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">{patient.full_name}</span>
                      <span className="block truncate text-xs text-slate-500">{patient.whatsapp_phone || patient.phone || patient.email || 'Sem contato'}</span>
                    </span>
                  </button>
                  <div className="flex shrink-0 items-center gap-1 pr-2">
                    <button type="button" onClick={() => openEditPatient(patient)} aria-label={`Editar cadastro de ${patient.full_name}`} title="Editar cadastro" className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
                      <Pencil className="size-3.5" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => removePatient(patient)} disabled={deletingPatientId === patient.id} aria-label={`Excluir ${patient.full_name}`} title="Excluir paciente" className="inline-flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-wait disabled:opacity-50">
                      <Trash2 className="size-3.5" aria-hidden="true" />
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

        <section className="min-w-0" aria-live="polite">
          {!selectedPatient ? (
            <div className="flex min-h-96 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
              <UserRound className="mb-3 size-10 text-slate-300" />
              <h2 className="text-lg font-black text-slate-800">Selecione um cadastro</h2>
              <p className="max-w-md text-sm text-slate-500">Consulte ou edite os dados do paciente selecionado.</p>
            </div>
          ) : (
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex min-w-0 items-center gap-3.5">
                  <PatientAvatar patient={selectedPatient} size="large" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs tracking-wide text-emerald-700">
                        {STAGE_LABELS[selectedPatient.lifecycle_stage] || 'Paciente'}
                      </span>
                      {selectedPatient.acquisition_source ? (
                        <span className="text-[11px] font-semibold text-slate-400">
                          • {selectedPatient.acquisition_source}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-xl font-black text-slate-900 sm:text-2xl">{selectedPatient.full_name}</h2>
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

                <div className="flex flex-col gap-1.5 xl:items-end">
                  <span className="text-xs font-bold uppercase tracking-[0.06em] text-slate-500">
                    Atalhos do paciente
                  </span>
                  <div
                    className="flex flex-wrap items-center gap-1.5 sm:gap-2"
                    role="toolbar"
                    aria-label={`Ações rápidas vinculadas a ${selectedPatient.full_name}`}
                  >
                    {PATIENT_SHORTCUTS.map((shortcut) => {
                      const Icon = shortcut.icon;
                      return (
                        <button
                          key={shortcut.id}
                          type="button"
                          onClick={() => handleNavigate(shortcut.id)}
                          className={`group relative flex h-9 items-center rounded-xl border border-slate-200/90 bg-slate-50/90 px-2.5 text-xs font-bold text-slate-600 shadow-2xs backdrop-blur-xs transition-all duration-300 ease-out hover:shadow-xs active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${shortcut.colorClasses}`}
                          title={shortcut.tooltip}
                          aria-label={`Acessar ${shortcut.label} de ${selectedPatient.full_name}`}
                        >
                          <Icon className={`size-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${shortcut.iconColor}`} aria-hidden="true" />
                          <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-out group-hover:max-w-28 group-hover:pl-1.5 group-hover:opacity-100">
                            {shortcut.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <dl className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <PatientDetail icon={Calendar} label="Nascimento" value={formatDate(selectedPatient.birth_date)} />
                <PatientDetail icon={UserRound} label="Sexo" value={SEX_LABELS[selectedPatient.sex] || 'Não informado'} />
                <PatientDetail icon={CreditCard} label="CPF" value={selectedPatient.cpf || 'Não informado'} />
                <PatientDetail
                  icon={Phone}
                  label="Telefone"
                  value={selectedPatient.phone || 'Não informado'}
                  href={selectedPatient.phone ? `tel:${selectedPatient.phone.replace(/\D/g, '')}` : undefined}
                />
                <PatientDetail
                  icon={MessageCircle}
                  label="WhatsApp"
                  value={selectedPatient.whatsapp_phone || 'Não informado'}
                  href={selectedPatient.whatsapp_phone ? `https://wa.me/55${selectedPatient.whatsapp_phone.replace(/\D/g, '')}` : undefined}
                />
                <PatientDetail
                  icon={Mail}
                  label="E-mail"
                  value={selectedPatient.email || 'Não informado'}
                  href={selectedPatient.email ? `mailto:${selectedPatient.email}` : undefined}
                />
                <PatientDetail icon={MapPin} label="Origem" value={selectedPatient.acquisition_source || 'Não informada'} />
                <PatientDetail icon={Activity} label="Etapa" value={STAGE_LABELS[selectedPatient.lifecycle_stage] || 'Não informada'} />
                <PatientDetail icon={HeartPulse} label="Dados de saúde" value={selectedPatient.consent_health_data_at ? 'Consentimento registrado' : 'Sem consentimento registrado'} />
                <PatientDetail icon={Bell} label="Comunicações" value={selectedPatient.consent_communications_at ? 'Consentimento registrado' : 'Sem consentimento registrado'} />
                <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-xs sm:col-span-1 xl:col-span-2">
                  <dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.06em] text-slate-500">
                    <NotebookText className="size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                    Observações
                  </dt>
                  <dd className="mt-1.5 break-words text-[0.6875rem] font-medium leading-4 text-slate-700 whitespace-pre-wrap">
                    {selectedPatient.notes || 'Nenhuma observação cadastrada.'}
                  </dd>
                </div>
              </dl>

              <div className="my-6 border-t border-slate-200/90" />

              <PatientAiSummary patient={selectedPatient} activeModel={activeModel} />
            </article>
          )}
        </section>
      </div>

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
