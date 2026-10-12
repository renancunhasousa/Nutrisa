import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Eye, FileSignature, FileText, Layers, Pencil, RefreshCw, UtensilsCrossed, X } from 'lucide-react';
import { listPatientClinicalRecords, writeClinicalRecordHandoff } from '../services/clinicalRecords.js';

const META = {
  avaliacao: { label: 'Avaliação', icon: Activity, mode: 'laudo', color: 'text-violet-700 bg-violet-50' },
  anamnese: { label: 'Anamnese', icon: FileText, mode: 'anamnese', color: 'text-sky-700 bg-sky-50' },
  dieta: { label: 'Dieta', icon: UtensilsCrossed, mode: 'dietas', color: 'text-emerald-700 bg-emerald-50' },
  contrato: { label: 'Contrato', icon: FileSignature, mode: 'contratos', color: 'text-amber-700 bg-amber-50' },
};
const date = (value) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: value.includes?.('T') ? 'short' : undefined }).format(new Date(value.includes?.('T') ? value : `${value}T12:00:00`)) : 'Sem data';
const status = (value) => ({ completed: 'Concluído', pending: 'Aguardando assinatura', signed: 'Assinado', rascunho: 'Rascunho', publicada: 'Publicada' }[value] || value || 'Salvo');

export default function PatientClinicalHistory({ patient, onNavigate }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('todos');
  const [viewing, setViewing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setRecords(await listPatientClinicalRecords(patient.id)); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }, [patient.id]);
  useEffect(() => { load(); }, [load]);
  const visible = useMemo(() => filter === 'todos' ? records : records.filter((item) => item.recordType === filter), [filter, records]);
  const open = (record) => {
    writeClinicalRecordHandoff(record);
    onNavigate(META[record.recordType].mode);
  };
  const preview = viewing ? viewing.report || viewing.final_content || viewing.notes || viewing.content?.notes || JSON.stringify(viewing.data || viewing.content || {}, null, 2) : '';

  return <section className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-xs">
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400"><FileText className="size-4 shrink-0 text-emerald-600" aria-hidden="true" /> Prontuário e histórico</h3><button type="button" onClick={load} disabled={loading} className="inline-flex w-[6.5rem] items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs transition-colors hover:bg-emerald-700 disabled:opacity-60"><RefreshCw className={`size-3 ${loading ? 'animate-spin' : ''}`} /> Atualizar</button></div>
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">{['todos', ...Object.keys(META)].map((key) => { const FilterIcon = key === 'todos' ? Layers : META[key].icon; return <button key={key} type="button" onClick={() => setFilter(key)} className={`inline-flex min-w-0 w-full items-center justify-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-bold transition-colors ${filter === key ? 'border-emerald-300 bg-emerald-50 text-emerald-800 shadow-2xs' : 'border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200'}`}><FilterIcon className="size-3.5 shrink-0" aria-hidden="true" />{key === 'todos' ? `Todos (${records.length})` : META[key].label}</button>; })}</div>
    {error ? <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</p> : null}
    {!loading && !visible.length ? <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">Nenhum registro encontrado.</div> : null}
    <div className="mt-3 divide-y divide-slate-100">{visible.map((record) => { const info = META[record.recordType]; const Icon = info.icon; const editable = record.recordType !== 'contrato' && record.status !== 'signed'; return <article key={`${record.recordType}-${record.id}`} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center"><span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${info.color}`}><Icon className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-extrabold text-slate-800">{info.label} · {date(record.recordDate)}</p><p className="text-[11px] font-semibold text-slate-500">{status(record.status)}</p></div><div className="flex gap-2"><button type="button" onClick={() => setViewing(record)} className="flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50"><Eye className="size-3.5" /> Visualizar</button>{editable ? <button type="button" onClick={() => open(record)} className="flex min-h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700"><Pencil className="size-3.5" /> Abrir</button> : null}</div></article>; })}</div>
    {viewing ? <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-3" role="dialog" aria-modal="true" aria-label="Visualizar registro"><div className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl"><header className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h3 className="font-black text-slate-900">{META[viewing.recordType].label}</h3><p className="text-xs text-slate-500">{date(viewing.recordDate)} · {status(viewing.status)}</p></div><button type="button" onClick={() => setViewing(null)} className="flex size-9 items-center justify-center rounded-xl hover:bg-slate-100"><X className="size-4" /></button></header><div className="max-h-[65vh] overflow-y-auto whitespace-pre-wrap p-5 text-sm leading-relaxed text-slate-700">{preview || 'Registro sem conteúdo textual para pré-visualização.'}</div><footer className="flex justify-end border-t border-slate-100 p-4"><button type="button" onClick={() => setViewing(null)} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white">Fechar</button></footer></div></div> : null}
  </section>;
}
