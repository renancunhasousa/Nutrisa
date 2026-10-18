import { useMemo, useState } from 'react';
import { ArrowRight, CalendarCheck, Check, CheckCheck, ChevronDown, EyeOff, Search, Undo2, UserPlus } from 'lucide-react';
import { normalizeName } from '../../agenda/services/appointmentMatcher.js';

const formatDate = (time) => new Date(time).toLocaleDateString('pt-BR');
const lastDate = (group) => formatDate(Math.max(...group.starts));
const countLabel = (group) => `${group.starts.length} ${group.starts.length === 1 ? 'evento' : 'eventos'} · último em ${lastDate(group)}`;

function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = async (action) => {
    setBusy(true);
    setError('');
    try { await action(); } catch (requestError) { setError(requestError.message); } finally { setBusy(false); }
  };
  return { busy, error, run };
}

function SuggestionRow({ group, onLink, onIgnore }) {
  const { busy, error, run } = useAction();
  return (
    <li className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs">
          <strong className="truncate text-slate-900">{group.label}</strong>
          <ArrowRight className="size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
          <strong className="truncate text-emerald-800">{group.patient.full_name}</strong>
          <span className="text-[11px] text-slate-500">({countLabel(group)})</span>
        </div>
        <div className="flex gap-1.5">
          <button type="button" disabled={busy} onClick={() => run(() => onLink(group.nameKey, group.patient.id))} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500 disabled:opacity-50 cursor-pointer">
            <Check className="size-3" aria-hidden="true" /> Confirmar
          </button>
          <button type="button" disabled={busy} onClick={() => run(() => onIgnore(group.nameKey))} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer" title="Compromisso que não é de paciente">
            Não é paciente
          </button>
        </div>
      </div>
      {error ? <p role="alert" className="mt-1 text-[11px] text-rose-700">{error}</p> : null}
    </li>
  );
}

function PendingRow({ group, patients, onLink, onIgnore, onRegister }) {
  const [query, setQuery] = useState('');
  const { busy, error, run } = useAction();

  const options = useMemo(() => {
    const term = normalizeName(query);
    if (!term) return group.candidates;
    return patients.filter((patient) => normalizeName(patient.full_name).includes(term)).slice(0, 6);
  }, [query, patients, group.candidates]);

  const handleRegister = () => {
    if (!onRegister) return;
    const draft = {
      full_name: group.label,
      preferred_name: '',
      email: group.emails?.[0] || '',
      phone: group.phones?.[0] || '',
      whatsapp_phone: group.phones?.[0] || '',
      acquisition_source: 'Google Agenda',
      lifecycle_stage: 'lead',
      notes: `Compromisso importado da agenda: ${group.label}`,
    };
    onRegister(draft, group.nameKey);
  };

  return (
    <li className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <strong className="block truncate text-sm text-slate-900">{group.label}</strong>
          <span className="text-[11px] text-slate-500">{countLabel(group)}{group.status === 'ambiguous' ? ' · mais de um paciente possível' : ''}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {onRegister ? (
            <button
              type="button"
              onClick={handleRegister}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 cursor-pointer"
              title="Cadastrar este compromisso como novo paciente"
            >
              <UserPlus className="size-3" aria-hidden="true" /> Cadastrar paciente
            </button>
          ) : null}
          <button type="button" disabled={busy} onClick={() => run(() => onIgnore(group.nameKey))} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer" title="Compromisso que não é de paciente">
            <EyeOff className="size-3" aria-hidden="true" /> Não é paciente
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {options.map((patient) => (
          <button key={patient.id} type="button" disabled={busy} onClick={() => run(() => onLink(group.nameKey, patient.id))} className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 cursor-pointer">
            {patient.full_name}
          </button>
        ))}
        <label className="relative block min-w-40 flex-1 sm:max-w-56">
          <span className="sr-only">Buscar outro paciente para {group.label}</span>
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={options.length ? 'Outro paciente…' : 'Buscar paciente…'} className="min-h-8 w-full rounded-full border border-slate-200 bg-slate-50 pl-8 pr-2 text-[11px] focus:border-emerald-500 focus:bg-white focus:outline-hidden" />
        </label>
      </div>
      {error ? <p role="alert" className="text-[11px] text-rose-700">{error}</p> : null}
    </li>
  );
}

export default function CalendarLinkReview({ state, error, groups, patients, onLink, onLinkMany, onIgnore, onUnlink, onRefresh, onOpenAgenda, onRegister }) {
  const [open, setOpen] = useState(false);
  const [bulk, setBulk] = useState({ busy: false, error: '' });
  const suggested = groups.filter((group) => group.status === 'suggested');
  const pending = groups.filter((group) => group.status === 'ambiguous' || group.status === 'unmatched');
  const linked = groups.filter((group) => group.status === 'auto' || group.status === 'manual');
  const manual = groups.filter((group) => group.status === 'manual');
  const ignored = groups.filter((group) => group.status === 'ignored');

  const confirmAll = async () => {
    setBulk({ busy: true, error: '' });
    try {
      await onLinkMany(suggested.map((group) => ({ nameKey: group.nameKey, patientId: group.patient.id })));
      setBulk({ busy: false, error: '' });
    } catch (requestError) {
      setBulk({ busy: false, error: requestError.message });
    }
  };

  const linkedByEmail = linked.filter((group) => group.matchReason === 'email').length;
  const toReview = suggested.length + pending.length;
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm" aria-labelledby="calendar-links-title">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 bg-slate-50 p-4 sm:p-5 text-left cursor-pointer transition-colors hover:bg-slate-100/70">
        <div className="min-w-0">
          <h2 id="calendar-links-title" className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
            <CalendarCheck className="size-[18px] text-emerald-600" aria-hidden="true" />
            <span>Vincular Consultas da Agenda aos Pacientes</span>
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            {state === 'ready'
              ? `${linked.length} consultas vinculadas aos pacientes${linkedByEmail > 0 ? ` (${linkedByEmail} por e-mail)` : ''} · ${suggested.length} sugestões para confirmar · ${pending.length} sem correspondência`
              : state === 'loading'
                ? 'Consultando agendamentos no Google Calendar…'
                : 'Associe os agendamentos do Google Calendar aos pacientes para sincronizar datas de consultas, retornos e métricas.'}
          </p>
        </div>
        <ChevronDown className={`size-4 shrink-0 text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open ? (
        <div className="border-t border-slate-100 max-h-80 overflow-y-auto space-y-4 p-4 sm:p-5 pr-2 [scrollbar-width:thin] [scrollbar-color:theme(colors.slate.300)_transparent]">
          {state === 'no_token' ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              Conecte o Google Calendar na tela Agenda (ou renove o login, que expira em 1 hora) para ler os eventos.
              <button type="button" onClick={onOpenAgenda} className="ml-2 font-bold underline cursor-pointer">Abrir Agenda</button>
            </div>
          ) : null}
          {state === 'error' ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</p> : null}
          {state === 'ready' ? (
            <>
              <p className="text-xs text-slate-600">Eventos com e-mail do paciente (em convidados ou descrição) ou telefone são vinculados automaticamente com 100% de precisão. Nomes idênticos também ligam sozinhos. Para nomes parecidos ou abreviados, basta 1 clique para confirmar.</p>

              {suggested.length ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs font-black uppercase tracking-wide text-emerald-700">Sugestões ({suggested.length})</h3>
                    <button type="button" disabled={bulk.busy} onClick={confirmAll} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 cursor-pointer">
                      <CheckCheck className="size-4" aria-hidden="true" /> {bulk.busy ? 'Salvando…' : `Confirmar todas (${suggested.length})`}
                    </button>
                  </div>
                  {bulk.error ? <p role="alert" className="text-[11px] text-rose-700">{bulk.error}</p> : null}
                  <ul className="space-y-1.5" role="list">
                    {suggested.map((group) => <SuggestionRow key={group.nameKey} group={group} onLink={onLink} onIgnore={onIgnore} />)}
                  </ul>
                </div>
              ) : null}

              {pending.length ? (
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-wide text-slate-600">Escolha o paciente ({pending.length})</h3>
                  <ul className="space-y-2" role="list">
                    {pending.map((group) => <PendingRow key={group.nameKey} group={group} patients={patients} onLink={onLink} onIgnore={onIgnore} onRegister={onRegister} />)}
                  </ul>
                </div>
              ) : null}

              {!toReview ? <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><Check className="size-4" aria-hidden="true" /> Todos os nomes da agenda já estão resolvidos.</p> : null}

              {manual.length ? (
                <details className="text-xs text-slate-600">
                  <summary className="cursor-pointer font-bold">Vinculados por você ({manual.length})</summary>
                  <ul className="mt-2 space-y-1" role="list">
                    {manual.map((group) => (
                      <li key={group.nameKey} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2 py-1">
                        <span className="truncate">{group.label} → <strong>{group.patient.full_name}</strong></span>
                        <button type="button" onClick={() => onUnlink(group.nameKey)} className="inline-flex shrink-0 items-center gap-1 font-bold text-emerald-700 cursor-pointer"><Undo2 className="size-3" aria-hidden="true" /> Desfazer</button>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
              {ignored.length ? (
                <details className="text-xs text-slate-600">
                  <summary className="cursor-pointer font-bold">Ignorados ({ignored.length})</summary>
                  <ul className="mt-2 space-y-1" role="list">
                    {ignored.map((group) => (
                      <li key={group.nameKey} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2 py-1">
                        <span className="truncate">{group.label}</span>
                        <button type="button" onClick={() => onUnlink(group.nameKey)} className="inline-flex shrink-0 items-center gap-1 font-bold text-emerald-700 cursor-pointer"><Undo2 className="size-3" aria-hidden="true" /> Desfazer</button>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
              <button type="button" onClick={onRefresh} className="text-xs font-bold text-emerald-700 underline cursor-pointer">Reler a agenda</button>
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
