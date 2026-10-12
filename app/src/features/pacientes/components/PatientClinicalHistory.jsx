import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Eye, FileSignature, FileText, Layers, Pencil, RefreshCw, Trash2, UtensilsCrossed, X } from 'lucide-react';
import { deletePatientClinicalRecord, listPatientClinicalRecords, writeClinicalRecordHandoff } from '../services/clinicalRecords.js';

const META = {
  avaliacao: { label: 'Avaliação', icon: Activity, mode: 'laudo' },
  anamnese: { label: 'Anamnese', icon: FileText, mode: 'anamnese' },
  dieta: { label: 'Dieta', icon: UtensilsCrossed, mode: 'dietas' },
  contrato: { label: 'Contrato', icon: FileSignature, mode: 'contratos' },
};
const date = (value) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: value.includes?.('T') ? 'short' : undefined }).format(new Date(value.includes?.('T') ? value : `${value}T12:00:00`)) : 'Sem data';
const status = (value) => ({ completed: 'Concluído', pending: 'Aguardando assinatura', signed: 'Assinado', rascunho: 'Rascunho', publicada: 'Publicada' }[value] || value || 'Salvo');

export default function PatientClinicalHistory({ patient, onNavigate }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('todos');
  const [viewing, setViewing] = useState(null);
  const [deletingKey, setDeletingKey] = useState('');

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
  const remove = async (record) => {
    const info = META[record.recordType];
    if (!window.confirm(`Excluir permanentemente este registro de ${info.label.toLowerCase()} do prontuário? Esta ação não pode ser desfeita.`)) return;
    const key = `${record.recordType}-${record.id}`;
    setDeletingKey(key); setError('');
    try {
      await deletePatientClinicalRecord(record);
      setRecords((current) => current.filter((item) => `${item.recordType}-${item.id}` !== key));
      if (viewing?.id === record.id && viewing?.recordType === record.recordType) setViewing(null);
    } catch (requestError) { setError(requestError.message); }
    finally { setDeletingKey(''); }
  };
  const preview = viewing ? viewing.report || viewing.final_content || viewing.notes || viewing.content?.notes || JSON.stringify(viewing.data || viewing.content || {}, null, 2) : '';

  return <section className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-xs">
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400"><FileText className="size-4 shrink-0 text-emerald-600" aria-hidden="true" /> Prontuário e histórico</h3><button type="button" onClick={load} disabled={loading} className="inline-flex w-[6.5rem] items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs transition-colors hover:bg-emerald-700 disabled:opacity-60"><RefreshCw className={`size-3 ${loading ? 'animate-spin' : ''}`} /> Atualizar</button></div>
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">{['todos', ...Object.keys(META)].map((key) => { const FilterIcon = key === 'todos' ? Layers : META[key].icon; return <button key={key} type="button" onClick={() => setFilter(key)} className={`inline-flex min-w-0 w-full items-center justify-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-bold transition-colors ${filter === key ? 'border-emerald-300 bg-emerald-50 text-emerald-800 shadow-2xs' : 'border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200'}`}><FilterIcon className="size-3.5 shrink-0" aria-hidden="true" />{key === 'todos' ? `Todos (${records.length})` : META[key].label}</button>; })}</div>
    {error ? <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</p> : null}
    {!loading && !visible.length ? <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">Nenhum registro encontrado.</div> : null}
    <div className="mt-3 divide-y divide-slate-100">{visible.map((record) => { const info = META[record.recordType]; const Icon = info.icon; const editable = record.recordType !== 'contrato' && record.status !== 'signed'; const recordKey = `${record.recordType}-${record.id}`; const deleting = deletingKey === recordKey; return <article key={recordKey} className="flex items-center gap-2.5 py-3"><span className="flex size-6 shrink-0 items-center justify-center text-blue-600"><Icon className="size-4" aria-hidden="true" /></span><div className="min-w-0 flex-1"><p className="text-xs font-bold text-slate-800">{info.label} · {date(record.recordDate)}</p><p className="text-[10px] font-semibold text-slate-500">{status(record.status)}</p></div><div className="flex shrink-0 items-center gap-1"><button type="button" onClick={() => setViewing(record)} aria-label={`Visualizar ${info.label.toLowerCase()}`} title="Visualizar" className="inline-flex size-8 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"><Eye className="size-3.5" aria-hidden="true" /></button>{editable ? <button type="button" onClick={() => open(record)} aria-label={`Editar ${info.label.toLowerCase()}`} title="Editar" className="inline-flex size-8 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"><Pencil className="size-3.5" aria-hidden="true" /></button> : null}<button type="button" onClick={() => remove(record)} disabled={deleting} aria-label={`Excluir ${info.label.toLowerCase()}`} title="Excluir" className="inline-flex size-8 items-center justify-center rounded-lg text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-wait disabled:opacity-40"><Trash2 className="size-3.5" aria-hidden="true" /></button></div></article>; })}</div>
    {viewing ? <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-3" role="dialog" aria-modal="true" aria-label="Visualizar registro"><div className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl"><header className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h3 className="font-black text-slate-900">{META[viewing.recordType].label}</h3><p className="text-xs text-slate-500">{date(viewing.recordDate)} · {status(viewing.status)}</p></div><button type="button" onClick={() => setViewing(null)} className="flex size-9 items-center justify-center rounded-xl hover:bg-slate-100"><X className="size-4" /></button></header><div className="max-h-[65vh] overflow-y-auto whitespace-pre-wrap p-5 text-sm leading-relaxed text-slate-700">{preview || 'Registro sem conteúdo textual para pré-visualização.'}</div><footer className="flex justify-end border-t border-slate-100 p-4"><button type="button" onClick={() => setViewing(null)} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white">Fechar</button></footer></div></div> : null}
  </section>;
}
