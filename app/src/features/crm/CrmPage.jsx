import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Cake,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  FilterX,
  ListFilter,
  MessageCircle,
  RefreshCw,
  Search,
  Sparkles,
  UserRound,
} from 'lucide-react';
import PageHeader from '../../shared/ui/PageHeader.jsx';
import { usePatient } from '../pacientes/usePatient.js';
import { useAuth } from '../auth/useAuth.js';
import { fetchConversations } from '../atendimento/services/conversations.js';
import { getTasks, syncTasksFromCloud, TASKS_UPDATED_EVENT } from '../tarefas/services/taskStorage.js';
import { writePatientHandoff } from '../pacientes/services/patientHandoff.js';
import { buildCommercialOpportunities, buildRadarItem, isPatientInOpportunity } from './domain/radar.js';
import { generateCommercialInsights } from './services/commercialInsights.js';
import QuickMessageModal from './components/QuickMessageModal.jsx';

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

export default function CrmPage({ onNavigate, activeModel }) {
  const { organizationId } = useAuth();
  const { patients, selectPatient, loading: patientsLoading } = usePatient();
  const [conversations, setConversations] = useState([]);
  const [tasks, setTasks] = useState(getTasks);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
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
    const update = () => setTasks(getTasks());
    window.addEventListener(TASKS_UPDATED_EVENT, update);
    return () => window.removeEventListener(TASKS_UPDATED_EVENT, update);
  }, []);

  const allRadarItems = useMemo(() => {
    const now = Date.now();
    return patients.map((patient) => buildRadarItem(patient, conversations, tasks, now)).filter(Boolean);
  }, [patients, conversations, tasks]);

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
        actions={<button type="button" onClick={refresh} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-50"><RefreshCw className={`size-4 ${busy ? 'animate-spin' : ''}`} /> Atualizar</button>}
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
            <h2 id="commercial-opportunities-title" className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900"><Sparkles className="size-[18px] text-emerald-600" aria-hidden="true" /> Oportunidades de pacotes</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">Segmentos calculados com regras explicáveis. Clique em um plano para filtrar os pacientes qualificados ou use a IA para hipóteses.</p>
          </div>
          <button type="button" onClick={runAiAnalysis} disabled={aiLoading || !patients.length} className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-800 shadow-xs transition-colors hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-50">
            <Sparkles className={`size-3.5 text-emerald-600 ${aiLoading ? 'animate-pulse' : ''}`} />
            {aiLoading ? 'Analisando oportunidades…' : aiInsight ? 'Atualizar insights com IA' : 'Gerar insights com IA'}
          </button>
        </div>
        </div>

        <ul className="grid gap-3 p-5 sm:p-6 lg:grid-cols-2" role="list">
          {opportunities.length ? opportunities.map((opportunity) => {
            const isSelected = selectedOpportunity === opportunity.id;
            return (
              <li key={opportunity.id}>
                <button
                  type="button"
                  onClick={() => handleToggleOpportunity(opportunity.id)}
                  aria-pressed={isSelected}
                  className={`w-full text-left rounded-2xl border p-4 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/90 shadow-md ring-2 ring-emerald-500/30'
                      : 'border-slate-200 bg-slate-50/70 hover:border-emerald-300 hover:bg-emerald-50/40 hover:shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-slate-900">{opportunity.title}</h3>
                        {isSelected ? (
                          <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-black uppercase text-white">
                            Filtrando lista
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs font-semibold text-emerald-700">{opportunity.audience}</p>
                    </div>
                    <span className={`shrink-0 rounded-lg border px-2 py-1 text-xs font-black transition-colors ${
                      isSelected
                        ? 'border-emerald-300 bg-emerald-600 text-white'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    }`}>
                      {opportunity.patientCount} potenciais
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-600"><strong className="text-slate-800">Dor:</strong> {opportunity.pain}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600"><strong className="text-slate-800">Formato:</strong> {opportunity.offer}</p>
                  <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-500 border-t border-slate-200/60 pt-2.5">
                    <span>{isSelected ? '✓ Clique para remover este filtro' : '⚡ Clique para filtrar os pacientes'}</span>
                    <ChevronRight className={`size-3.5 text-emerald-600 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                  </div>
                </button>
              </li>
            );
          }) : <li className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">Ainda não há volume suficiente nos segmentos atuais para sugerir um pacote.</li>}
        </ul>

        {aiError ? <p role="alert" className="mx-5 mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 sm:mx-6 sm:mb-6">{aiError}</p> : null}
        {aiInsight ? <AiCommercialInsight insight={aiInsight} model={aiModel} /> : null}
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
                {id === 'birthdays' && totals.birthdays > 0 ? (
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.2 text-[10px] font-black ${filter === id ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-800'}`}>
                    {totals.birthdays}
                  </span>
                ) : null}
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
          <div className="divide-y divide-slate-100">
            {items.map(({ patient, signals }) => (
              <article key={patient.id} className="crm-radar-row flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xs font-black text-emerald-800">
                      {patient.full_name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-black text-slate-900">{patient.full_name}</h2>
                      <p className="truncate text-xs text-slate-500">
                        {patient.whatsapp_phone || patient.phone || 'Sem telefone cadastrado'}
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
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs"
                      title="Abrir mensagens rápidas prontas para WhatsApp"
                    >
                      <MessageCircle className="size-3.5" />
                      <span>Mensagem WhatsApp</span>
                    </button>
                  ) : null}
                  <button type="button" onClick={() => openPatient(patient, 'dashboard')} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
                    Conversa
                  </button>
                  <button type="button" onClick={() => openPatient(patient)} className="inline-flex min-h-9 items-center gap-1 rounded-xl bg-slate-900 px-3 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer">
                    Abrir ficha <ChevronRight className="size-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center">
            <CheckCircle2 className="mx-auto mb-3 size-10 text-emerald-500" />
            <h2 className="font-black text-slate-900">Radar em dia</h2>
            <p className="mt-1 text-sm text-slate-500">Nenhum paciente corresponde aos filtros atuais.</p>
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

function AiCommercialInsight({ insight, model }) {
  return <div className="border-t border-slate-100 bg-slate-50/50 p-5 sm:p-6" aria-live="polite">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="flex items-center gap-2 text-base font-black text-slate-900"><span className="flex size-8 items-center justify-center rounded-xl bg-emerald-100"><Sparkles className="size-4 text-emerald-700" /></span> Leitura estratégica da IA</h3>{model ? <span className="text-[11px] text-slate-400">Modelo: {model}</span> : null}</div>
    <p className="mt-3 text-sm leading-relaxed text-slate-600">{insight.executiveSummary}</p>
    <div className="mt-4 grid gap-4 xl:grid-cols-2">
      <div><h4 className="text-xs font-black uppercase tracking-wide text-emerald-700">Dores e oportunidades</h4><ul className="mt-2 space-y-2" role="list">{(insight.painPatterns || []).map((item, index) => <li key={`${item.pain}-${index}`} className="rounded-xl border border-slate-200 bg-white p-3"><strong className="block text-sm text-slate-900">{item.pain}</strong><span className="mt-1 block text-xs text-slate-600">{item.evidence}</span><span className="mt-1 block text-xs font-semibold text-emerald-700">Oportunidade: {item.opportunity}</span></li>)}</ul></div>
      <div><h4 className="text-xs font-black uppercase tracking-wide text-emerald-700">Planos sugeridos</h4><ul className="mt-2 space-y-2" role="list">{(insight.suggestedPlans || []).map((plan, index) => <li key={`${plan.name}-${index}`} className="rounded-xl border border-slate-200 bg-white p-3"><div className="flex items-center justify-between gap-2"><strong className="text-sm text-slate-900">{plan.name}</strong><span className="text-[11px] text-slate-400">{plan.duration}</span></div><p className="mt-1 text-xs text-slate-600">Para: {plan.audience}</p><p className="mt-1 text-xs text-slate-600">{plan.promise}</p><p className="mt-2 text-xs font-semibold text-emerald-700">{plan.salesAngle}</p></li>)}</ul></div>
    </div>
    {(insight.nextActions || []).length ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3"><h4 className="text-xs font-black uppercase tracking-wide text-emerald-700">Próximas ações</h4><ol className="mt-2 grid gap-2 text-xs text-slate-700 sm:grid-cols-2">{insight.nextActions.map((action, index) => <li key={`${action}-${index}`} className="flex gap-2"><ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-emerald-600" /> {action}</li>)}</ol></div> : null}
    <p className="mt-3 text-[11px] text-slate-400">Hipóteses comerciais para validação humana. Não constituem diagnóstico, prescrição ou promessa de resultado.</p>
  </div>;
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
