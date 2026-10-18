import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Cake,
  CalendarClock,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FilterX,
  HeartHandshake,
  Info,
  ListFilter,
  MessageCircle,
  MessageSquare,
  RefreshCw,
  Repeat,
  Search,
  Sparkles,
  TrendingUp,
  UserPlus,
  UserRound,
} from 'lucide-react';
import PageHeader from '../../shared/ui/PageHeader.jsx';
import { usePatient } from '../pacientes/usePatient.js';
import { useAuth } from '../auth/useAuth.js';
import { fetchConversations } from '../atendimento/services/conversations.js';
import { createTask, getTasks, syncTasksFromCloud, TASKS_UPDATED_EVENT } from '../tarefas/services/taskStorage.js';
import { getPresetDate } from '../tarefas/domain/taskTypes.js';
import { writePatientHandoff } from '../pacientes/services/patientHandoff.js';
import { buildCommercialOpportunities, buildRadarDiagnostics, buildRadarItem, isPatientInOpportunity } from './domain/radar.js';
import { generateCommercialInsights } from './services/commercialInsights.js';
import { loadLatestCommercialInsight, persistCommercialInsight } from './services/crmInsightsStorage.js';
import QuickMessageModal from './components/QuickMessageModal.jsx';
import { useCalendarPatientLinks } from './hooks/useCalendarPatientLinks.js';

const DAY = 86_400_000;
const FILTERS = [
  ['all', 'Todos', ListFilter],
  ['urgent', 'Urgentes', AlertTriangle],
  ['return', 'Retornos', CalendarClock],
  ['relationship', 'Relacionamento', RefreshCw],
  ['birthdays', 'Aniversários', Cake],
];

const SIGNAL_META = {
  unanswered: { label: 'SLA estourado', tone: 'rose', group: 'urgent', icon: MessageCircle },
  overdue_task: { label: 'Tarefa vencida', tone: 'amber', group: 'urgent', icon: AlertTriangle },
  return_due: { label: 'Retorno pendente', tone: 'sky', group: 'return', icon: CalendarClock },
  inactive: { label: 'Reativação', tone: 'violet', group: 'relationship', icon: RefreshCw },
  stalled_lead: { label: 'Lead sem avanço', tone: 'slate', group: 'relationship', icon: UserRound },
  birthday_today: { label: 'Aniversário hoje', tone: 'amber', group: 'birthdays', icon: Cake },
  birthday_soon: { label: 'Aniversário próximo', tone: 'sky', group: 'birthdays', icon: Cake },
};

const TONES = {
  rose: 'border-rose-200 bg-rose-50 text-rose-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  sky: 'border-sky-200 bg-sky-50 text-sky-700',
  violet: 'border-violet-200 bg-violet-50 text-violet-700',
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
};

const FUNNEL_ORDER = ['first-journey', 'membership', 'continuity', 'reactivation'];

const OPPORTUNITY_THEMES = {
  'first-journey': {
    name: 'Leads',
    icon: UserPlus,
    colorText: 'text-violet-700',
    colorBg: 'bg-violet-50',
    barColor: 'bg-violet-500',
    activeRing: 'border-violet-500 ring-2 ring-violet-500/30 bg-violet-50/50 shadow-md',
    badge: 'bg-violet-100 text-violet-800',
  },
  'membership': {
    name: 'Mensal',
    icon: Repeat,
    colorText: 'text-emerald-700',
    colorBg: 'bg-emerald-50',
    barColor: 'bg-emerald-500',
    activeRing: 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/50 shadow-md',
    badge: 'bg-emerald-100 text-emerald-800',
  },
  'continuity': {
    name: 'Retornos',
    icon: CalendarClock,
    colorText: 'text-amber-700',
    colorBg: 'bg-amber-50',
    barColor: 'bg-amber-500',
    activeRing: 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-50/50 shadow-md',
    badge: 'bg-amber-100 text-amber-800',
  },
  'reactivation': {
    name: 'Reativação',
    icon: HeartHandshake,
    colorText: 'text-rose-700',
    colorBg: 'bg-rose-50',
    barColor: 'bg-rose-500',
    activeRing: 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-50/50 shadow-md',
    badge: 'bg-rose-100 text-rose-800',
  },
};

export default function CrmPage({ onNavigate, activeModel }) {
  const { organizationId } = useAuth();
  const { patients: basePatients, selectPatient, loading: patientsLoading } = usePatient();
  const calendar = useCalendarPatientLinks({ patients: basePatients, organizationId });
  const patients = calendar.enrichedPatients;
  const [conversations, setConversations] = useState([]);
  const [tasks, setTasks] = useState(getTasks);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [expandedDetailsId, setExpandedDetailsId] = useState(null);
  const [quickMessageTarget, setQuickMessageTarget] = useState(null);
  const [aiInsight, setAiInsight] = useState(null);
  const [aiModel, setAiModel] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const refresh = async () => {
    setLoading(true);
    setError('');
    const since = new Date(Date.now() - 120 * DAY).toISOString();
    try {
      const [messages] = await Promise.all([
        fetchConversations({ limit: 2000, startDate: since }),
        syncTasksFromCloud(),
      ]);
      setConversations(messages);
      setTasks(getTasks());
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível atualizar o radar.');
      setTasks(getTasks());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [organizationId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    let active = true;
    loadLatestCommercialInsight(organizationId).then((data) => {
      if (active && data?.insight) {
        setAiInsight(data.insight);
        setAiModel(data.modelUsed || '');
      }
    });
    return () => { active = false; };
  }, [organizationId]);
  useEffect(() => {
    const update = () => setTasks(getTasks());
    window.addEventListener(TASKS_UPDATED_EVENT, update);
    return () => window.removeEventListener(TASKS_UPDATED_EVENT, update);
  }, []);

  const allRadarItems = useMemo(() => {
    const now = Date.now();
    return patients.map((patient) => buildRadarItem(patient, conversations, tasks, now)).filter(Boolean);
  }, [patients, conversations, tasks]);

  const diagnostics = useMemo(() => buildRadarDiagnostics(patients, conversations), [patients, conversations]);

  const totals = useMemo(() => ({
    all: allRadarItems.length,
    urgent: allRadarItems.filter((item) => item.signals.some((signal) => SIGNAL_META[signal.type]?.group === 'urgent')).length,
    returns: allRadarItems.filter((item) => item.signals.some((signal) => signal.type === 'return_due')).length,
    reactivation: allRadarItems.filter((item) => item.signals.some((signal) => signal.type === 'inactive')).length,
    birthdays: allRadarItems.filter((item) => item.signals.some((signal) => signal.type.startsWith('birthday_'))).length,
  }), [allRadarItems]);

  const opportunities = useMemo(
    () => buildCommercialOpportunities(allRadarItems, patients),
    [allRadarItems, patients],
  );

  const funnelOpportunities = useMemo(() => {
    return [...opportunities].sort((a, b) => {
      const idxA = FUNNEL_ORDER.indexOf(a.id);
      const idxB = FUNNEL_ORDER.indexOf(b.id);
      return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
    });
  }, [opportunities]);

  const totalOpportunityPatients = useMemo(
    () => opportunities.reduce((acc, opp) => acc + (opp.patientCount || 0), 0),
    [opportunities],
  );

  const items = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    return allRadarItems
      .filter((item) => !selectedOpportunity || isPatientInOpportunity(item, selectedOpportunity))
      .filter((item) => {
        if (filter === 'all') return true;
        if (filter === 'birthdays') return item.signals.some((signal) => signal.type.startsWith('birthday_'));
        return item.signals.some((signal) => SIGNAL_META[signal.type]?.group === filter);
      })
      .filter((item) => !query || [item.patient.full_name, item.patient.phone, item.patient.whatsapp_phone]
        .some((value) => value?.toLocaleLowerCase('pt-BR').includes(query)))
      .sort((a, b) => b.score - a.score || new Date(a.lastActivity) - new Date(b.lastActivity));
  }, [allRadarItems, filter, search, selectedOpportunity]);

  const activeOpportunityObj = useMemo(
    () => opportunities.find((opp) => opp.id === selectedOpportunity),
    [opportunities, selectedOpportunity],
  );

  const runAiAnalysis = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const result = await generateCommercialInsights({ patients, conversations, opportunities, model: activeModel });
      setAiInsight(result.insight);
      setAiModel(result.modelUsed);
      if (organizationId) {
        await persistCommercialInsight({ organizationId, insight: result.insight, modelUsed: result.modelUsed });
      }
    } catch (requestError) {
      setAiError(requestError.message || 'Não foi possível gerar os insights comerciais.');
    } finally {
      setAiLoading(false);
    }
  };

  const openPatient = (patient, mode = 'pacientes') => {
    selectPatient(patient);
    if (mode !== 'pacientes') writePatientHandoff(mode, patient);
    onNavigate(mode);
  };

  const handleToggleOpportunity = (oppId) => {
    setSelectedOpportunity((prev) => (prev === oppId ? null : oppId));
  };

  const busy = loading || patientsLoading;
  return (
    <div className="animate-fadeIn space-y-5">
      <PageHeader
        category="Relacionamento"
        title="Radar de relacionamento"
        description="Prioridades do dia para responder, reter e reativar pacientes."
        actions={<button type="button" onClick={() => { calendar.refresh(); refresh(); }} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-50"><RefreshCw className={`size-4 ${busy ? 'animate-spin' : ''}`} /> Atualizar</button>}
      />

      <section aria-label="Resumo do CRM" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Precisam de ação" value={totals.all} icon={Sparkles} tone="emerald" />
        <Metric label="Urgentes" value={totals.urgent} icon={AlertTriangle} tone="rose" />
        <Metric label="Retornos & reativação" value={totals.returns + totals.reactivation} icon={CalendarClock} tone="sky" />
        <Metric label="Aniversariantes" value={totals.birthdays} icon={Cake} tone="amber" />
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm" aria-labelledby="commercial-opportunities-title">
        <div className="border-b border-slate-100 bg-slate-50 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="size-[18px] text-emerald-600" aria-hidden="true" />
                <h2 id="commercial-opportunities-title" className="text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
                  Funil de Oportunidades & Pacotes
                </h2>
              </div>
              <p className="mt-1 max-w-2xl text-xs sm:text-sm text-slate-600">
                Distribuição da base nos 4 momentos do relacionamento. Acompanhe a distribuição e clique para filtrar.
              </p>
            </div>
            <button
              type="button"
              onClick={runAiAnalysis}
              disabled={aiLoading || !patients.length}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-800 shadow-xs transition-colors hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles className={`size-3.5 text-emerald-600 ${aiLoading ? 'animate-pulse' : ''}`} />
              {aiLoading ? 'Analisando oportunidades…' : aiInsight ? 'Atualizar insights com IA' : 'Gerar insights com IA'}
            </button>
          </div>

          {/* Barra Visual Segmentada do Pipeline / Funil */}
          <div className="mt-5 space-y-2">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-200/80 p-0.5 gap-1 shadow-inner">
              {funnelOpportunities.map((opp) => {
                const theme = OPPORTUNITY_THEMES[opp.id] || OPPORTUNITY_THEMES.continuity;
                const pct = totalOpportunityPatients > 0
                  ? Math.round((opp.patientCount / totalOpportunityPatients) * 100)
                  : 0;
                if (opp.patientCount <= 0) return null;
                return (
                  <div
                    key={opp.id}
                    className={`${theme.barColor} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${Math.max(pct, 4)}%` }}
                    title={`${opp.title}: ${opp.patientCount} pacientes (${pct}%)`}
                  />
                );
              })}
              {totalOpportunityPatients === 0 ? (
                <div className="h-full w-full rounded-full bg-slate-200" title="Sem pacientes qualificados no momento" />
              ) : null}
            </div>

            {/* Legenda do Funil */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
              <div className="flex flex-wrap items-center gap-3">
                {funnelOpportunities.map((opp) => {
                  const theme = OPPORTUNITY_THEMES[opp.id] || OPPORTUNITY_THEMES.continuity;
                  const pct = totalOpportunityPatients > 0
                    ? Math.round((opp.patientCount / totalOpportunityPatients) * 100)
                    : 0;
                  return (
                    <span key={opp.id} className="inline-flex items-center gap-1.5 font-medium">
                      <span className={`size-2 rounded-full ${theme.barColor}`} />
                      <span className="font-bold text-slate-700">{theme.name}:</span>
                      <span>{opp.patientCount} ({pct}%)</span>
                    </span>
                  );
                })}
              </div>
              <span className="font-semibold text-slate-400">
                Total no radar: <strong className="text-slate-700">{totalOpportunityPatients}</strong> potenciais
              </span>
            </div>
          </div>
        </div>

        {/* 4 Cards Métricos em Grid Executivo */}
        <div className="p-5 sm:p-6">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="list">
            {funnelOpportunities.map((opportunity) => {
              const isSelected = selectedOpportunity === opportunity.id;
              const theme = OPPORTUNITY_THEMES[opportunity.id] || OPPORTUNITY_THEMES.continuity;
              const Icon = theme.icon;
              const isExpanded = expandedDetailsId === opportunity.id;
              const pctOfTotal = totalOpportunityPatients > 0
                ? Math.round((opportunity.patientCount / totalOpportunityPatients) * 100)
                : 0;

              return (
                <li key={opportunity.id} className="flex">
                  <div
                    className={`group relative flex w-full flex-col justify-between rounded-2xl border p-4 transition-all duration-200 ${
                      isSelected
                        ? theme.activeRing
                        : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Topo do Card: Ícone + Status */}
                      <div className="flex items-start justify-between gap-2">
                        <Icon className={`size-5 shrink-0 ${theme.colorText}`} aria-hidden="true" />
                        {isSelected ? (
                          <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 text-[9px] font-black uppercase text-white shadow-2xs">
                            Ativo
                          </span>
                        ) : (
                          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                            opportunity.patientCount > 0 ? theme.badge : 'bg-slate-100 text-slate-400'
                          }`}>
                            {pctOfTotal}%
                          </span>
                        )}
                      </div>

                      {/* Título e Métrica Numérica */}
                      <div className="mt-3">
                        <h3 className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-slate-800 line-clamp-1" title={opportunity.title}>
                          {opportunity.title}
                        </h3>
                        <div className="mt-1 flex items-baseline gap-1.5">
                          <span className="text-2xl font-black text-slate-900">
                            {opportunity.patientCount}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            {opportunity.patientCount === 1 ? 'potencial' : 'potenciais'}
                          </span>
                        </div>
                      </div>

                      {/* Barrinha de Volume Individual */}
                      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${theme.barColor}`}
                          style={{ width: `${Math.min(pctOfTotal, 100)}%` }}
                        />
                      </div>

                      {/* Frase Resumo de Propósito (Tagline) */}
                      <p className="mt-3 text-[11px] font-medium leading-relaxed text-slate-600">
                        {opportunity.tagline}
                      </p>

                      {/* Seção Expansível de Detalhes (Dor e Formato) */}
                      {isExpanded ? (
                        <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-2.5 text-[11px] border border-slate-200/70 animate-fadeIn">
                          <p className="text-slate-600">
                            <strong className="text-slate-800">Público:</strong> {opportunity.audience}
                          </p>
                          <p className="text-slate-600">
                            <strong className="text-slate-800">Dor:</strong> {opportunity.pain}
                          </p>
                          <p className="text-slate-600">
                            <strong className="text-slate-800">Formato:</strong> {opportunity.offer}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    {/* Rodapé com Ações de Filtro e Info */}
                    <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleOpportunity(opportunity.id)}
                        className={`flex-1 inline-flex items-center justify-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                            : opportunity.patientCount > 0
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected ? '✓ Limpar filtro' : '⚡ Filtrar'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedDetailsId((prev) => (prev === opportunity.id ? null : opportunity.id))}
                        className={`p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer ${
                          isExpanded ? 'text-emerald-700 bg-emerald-50' : ''
                        }`}
                        title={isExpanded ? 'Ocultar detalhes clínicos e formato' : 'Ver dor identificada e formato da oferta'}
                        aria-label="Ver detalhes"
                      >
                        <Info className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {aiError ? <p role="alert" className="mx-5 mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 sm:mx-6 sm:mb-6">{aiError}</p> : null}
        {aiInsight ? <AiCommercialInsight insight={aiInsight} model={aiModel} organizationId={organizationId} /> : null}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm space-y-4 p-4 sm:p-5">
        {activeOpportunityObj ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-xs font-medium text-emerald-950">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="size-4 shrink-0 text-emerald-600" />
              <span className="truncate">
                Filtrando por oportunidade: <strong className="font-black text-slate-900">{activeOpportunityObj.title}</strong> ({items.length} {items.length === 1 ? 'paciente qualificado' : 'pacientes qualificados'})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedOpportunity(null)}
              className="inline-flex items-center gap-1 shrink-0 rounded-lg bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-800 transition-colors cursor-pointer"
            >
              <FilterX className="size-3.5" />
              Remover filtro
            </button>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5" role="group" aria-label="Filtrar radar">
            {FILTERS.map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
                className={`flex min-h-9 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-2 text-xs font-bold transition-colors cursor-pointer ${
                  filter === id ? 'border-emerald-300 bg-emerald-50 text-emerald-800 shadow-2xs' : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <label className="relative block sm:w-72">
            <span className="sr-only">Buscar paciente</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome ou telefone"
              className="min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm focus:bg-white focus:border-emerald-500 focus:outline-hidden"
            />
          </label>
        </div>

        {error ? <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{error} Exibindo os dados disponíveis.</p> : null}
        {busy ? <p className="p-10 text-center text-sm text-slate-500">Montando prioridades…</p> : items.length ? (
          <div className="divide-y divide-slate-100 max-h-[440px] overflow-y-auto overscroll-contain pr-2 custom-scrollbar">
            {items.map(({ patient, signals, lastMessageSnippet }) => (
              <article key={patient.id} className="crm-radar-row flex flex-col gap-3.5 py-3.5 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-slate-50/60 rounded-xl px-2">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2.5">
                    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-100 text-xs font-black text-emerald-800 shadow-2xs border border-emerald-200/60">
                      {patient.avatar_url ? (
                        <img
                          src={patient.avatar_url}
                          alt={patient.full_name}
                          className="size-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement.innerText = patient.full_name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
                          }}
                        />
                      ) : (
                        patient.full_name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h2 className="truncate text-sm font-black text-slate-900">{patient.full_name}</h2>
                        {patient.whatsapp_name && patient.whatsapp_name !== patient.full_name ? (
                          <span className="truncate text-[11px] font-semibold text-slate-400" title={`Nome no WhatsApp: ${patient.whatsapp_name}`}>
                            ({patient.whatsapp_name})
                          </span>
                        ) : null}
                      </div>
                      <p className="truncate text-xs text-slate-500">
                        {patient.whatsapp_phone || patient.phone || 'Sem telefone cadastrado'}
                        {lastMessageSnippet ? (
                          <span className="ml-2 font-normal text-slate-400 italic">
                            · &ldquo;{lastMessageSnippet}&rdquo;
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {signals.map((signal) => {
                      const meta = SIGNAL_META[signal.type] || { label: 'Aviso', tone: 'slate', icon: Sparkles };
                      const Icon = meta.icon;
                      return (
                        <span key={signal.type} title={signal.detail} className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold ${TONES[meta.tone]}`}>
                          <Icon className="size-3" /> {meta.label} · {signal.detail}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {(patient.whatsapp_phone || patient.phone) ? (
                    <button
                      type="button"
                      onClick={() => setQuickMessageTarget({ patient, signals })}
                      className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 text-[11px] font-bold text-slate-700 shadow-2xs transition-colors hover:border-emerald-200 hover:bg-emerald-50/40 hover:text-slate-900 cursor-pointer"
                      title="Abrir mensagens rápidas prontas para WhatsApp"
                    >
                      <MessageCircle className="size-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => openPatient(patient, 'dashboard')}
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 text-[11px] font-bold text-slate-700 shadow-2xs transition-colors hover:border-emerald-200 hover:bg-emerald-50/40 hover:text-slate-900 cursor-pointer"
                    title="Abrir atendimento e histórico de conversas"
                  >
                    <MessageSquare className="size-3.5 text-emerald-600" />
                    <span>Conversa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openPatient(patient)}
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 text-[11px] font-bold text-slate-700 shadow-2xs transition-colors hover:border-emerald-200 hover:bg-emerald-50/40 hover:text-slate-900 cursor-pointer"
                    title="Abrir prontuário completo do paciente"
                  >
                    <ExternalLink className="size-3.5 text-emerald-600" />
                    <span>Abrir ficha</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center">
            <CheckCircle2 className="mx-auto mb-3 size-10 text-emerald-500" />
            <h2 className="font-black text-slate-900">{allRadarItems.length ? 'Nenhum paciente corresponde aos filtros' : 'Nenhum sinal de relacionamento encontrado'}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {allRadarItems.length ? 'Ajuste os filtros ou a busca para ver outros pacientes.' : 'Nenhum paciente atende hoje às regras do radar. Veja abaixo os dados que alimentam os sinais.'}
            </p>
            {!allRadarItems.length ? (
              <ul className="mx-auto mt-4 max-w-md space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left text-xs text-slate-600" role="list">
                <li><strong>{diagnostics.patients}</strong> pacientes carregados</li>
                <li><strong>{diagnostics.conversations}</strong> mensagens nos últimos 120 dias, ligadas a <strong>{diagnostics.patientsWithConversation}</strong> pacientes</li>
                <li><strong>{diagnostics.withoutConsultationDate}</strong> pacientes sem data da última consulta (retornos e reativação dependem dela)</li>
                <li><strong>{diagnostics.withoutBirthDate}</strong> pacientes sem data de nascimento (aniversários)</li>
              </ul>
            ) : null}
            {selectedOpportunity ? (
              <button
                type="button"
                onClick={() => setSelectedOpportunity(null)}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
              >
                <FilterX className="size-3.5" />
                Limpar filtro da oportunidade
              </button>
            ) : null}
          </div>
        )}
      </section>

      {quickMessageTarget ? (
        <QuickMessageModal
          patient={quickMessageTarget.patient}
          signals={quickMessageTarget.signals}
          onClose={() => setQuickMessageTarget(null)}
        />
      ) : null}
    </div>
  );
}

function AiCommercialInsight({ insight, model, organizationId }) {
  const [open, setOpen] = useState(true);
  const [addedActions, setAddedActions] = useState(new Set());
  const [bulkSuccess, setBulkSuccess] = useState(false);

  const handleAddAction = (actionText) => {
    createTask({
      organizationId,
      title: actionText,
      category: 'relacionamento',
      priority: 'media',
      dueDate: getPresetDate(2),
      notes: 'Demanda gerada pela Leitura Estratégica da IA no Radar de Relacionamento.',
    });
    setAddedActions((prev) => new Set(prev).add(actionText));
  };

  const handleAddAll = () => {
    (insight.nextActions || []).forEach((action) => {
      createTask({
        organizationId,
        title: action,
        category: 'relacionamento',
        priority: 'media',
        dueDate: getPresetDate(2),
        notes: 'Demanda gerada pela Leitura Estratégica da IA no Radar de Relacionamento.',
      });
    });
    setAddedActions(new Set(insight.nextActions || []));
    setBulkSuccess(true);
    setTimeout(() => setBulkSuccess(false), 3000);
  };

  return (
    <div className="border-t border-slate-100 bg-slate-50/50" aria-live="polite">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 p-4 sm:p-5 text-left transition-colors hover:bg-slate-100/70 cursor-pointer"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
          <h3 className="text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900 truncate">
            Leitura estratégica da IA
          </h3>
          {model ? (
            <span className="text-[10px] font-semibold text-slate-400 shrink-0">
              · {model}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400">
            {open ? 'Recolher' : 'Expandir'}
          </span>
          <ChevronDown className={`size-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open ? (
        <div className="px-5 pb-6 sm:px-6 space-y-4 border-t border-slate-100 pt-4">
          <p className="text-sm leading-relaxed text-slate-600 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            {insight.executiveSummary}
          </p>

          <div className="grid gap-4 xl:grid-cols-2">
            <div>
              <h4 className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-emerald-800 mb-2">
                Dores e oportunidades
              </h4>
              <ul className="space-y-2.5" role="list">
                {(insight.painPatterns || []).map((item, index) => (
                  <li key={`${item.pain}-${index}`} className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                    <strong className="block text-xs font-bold text-slate-900">{item.pain}</strong>
                    <span className="mt-1 block text-xs text-slate-600">{item.evidence}</span>
                    <span className="mt-1.5 block text-xs font-semibold text-emerald-700">
                      Oportunidade: {item.opportunity}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-emerald-800 mb-2">
                Planos sugeridos
              </h4>
              <ul className="space-y-2.5" role="list">
                {(insight.suggestedPlans || []).map((plan, index) => (
                  <li key={`${plan.name}-${index}`} className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-xs font-bold text-slate-900">{plan.name}</strong>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{plan.duration}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600"><strong className="text-slate-700">Para:</strong> {plan.audience}</p>
                    <p className="mt-1 text-xs text-slate-600">{plan.promise}</p>
                    <p className="mt-1.5 text-xs font-semibold text-emerald-700">{plan.salesAngle}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {(insight.nextActions || []).length ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3 border-b border-emerald-200/60 pb-2.5">
                <h4 className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-emerald-900">
                  Próximas ações recomendadas
                </h4>
                <button
                  type="button"
                  onClick={handleAddAll}
                  disabled={bulkSuccess}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100/80 transition-colors cursor-pointer shadow-2xs"
                >
                  <CheckSquare className="size-3.5 text-emerald-600" />
                  {bulkSuccess ? '✓ Ações incluídas!' : 'Incluir todas em Tarefas'}
                </button>
              </div>

              <ol className="grid gap-2.5 sm:grid-cols-2">
                {insight.nextActions.map((action, index) => {
                  const isAdded = addedActions.has(action);
                  return (
                    <li key={`${action}-${index}`} className="flex items-start justify-between gap-2 rounded-xl bg-white p-2.5 border border-emerald-100 shadow-2xs">
                      <div className="flex items-start gap-2 min-w-0">
                        <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                        <span className="text-xs text-slate-700 leading-snug">{action}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddAction(action)}
                        disabled={isAdded}
                        className={`shrink-0 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-100 text-emerald-800 cursor-default'
                            : 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300'
                        }`}
                        title="Criar tarefa na categoria Relacionamento"
                      >
                        <CheckSquare className="size-3" />
                        <span>{isAdded ? 'Em tarefas' : '+ Tarefa'}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : null}

          <p className="text-[11px] text-slate-400">
            Hipóteses comerciais para validação humana. Não constituem diagnóstico, prescrição ou promessa de resultado.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value, icon: Icon, tone }) {
  const styles = {
    emerald: 'text-emerald-700',
    rose: 'text-rose-700',
    sky: 'text-sky-700',
    amber: 'text-amber-700',
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-[0.06em] text-slate-500">{label}</span>
        <Icon className={`size-4 ${styles[tone] || styles.emerald}`} aria-hidden="true" />
      </div>
      <strong className="block text-2xl font-black text-slate-900">{value}</strong>
    </div>
  );
}
