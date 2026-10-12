import { useEffect, useRef, useState } from 'react';
import { Activity, Eye, FileSignature, FileText, History, Pencil, RefreshCw, UtensilsCrossed, X } from 'lucide-react';
import { listPatientClinicalRecords, writeClinicalRecordHandoff } from '../services/clinicalRecords.js';

const META = {
  avaliacao: { label: 'avaliações', singular: 'Avaliação', icon: Activity },
  anamnese: { label: 'anamneses', singular: 'Anamnese', icon: FileText },
  dieta: { label: 'dietas', singular: 'Dieta', icon: UtensilsCrossed },
  contrato: { label: 'contratos', singular: 'Contrato', icon: FileSignature },
};
const formatDate = (value) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(value.includes?.('T') ? value : `${value}T12:00:00`)) : 'Sem data';
const formatStatus = (value) => ({ completed: 'Concluído', pending: 'Aguardando assinatura', signed: 'Assinado', rascunho: 'Rascunho', publicada: 'Publicada' }[value] || value || 'Salvo');

export default function PatientFeatureHistory({ patient, type }) {
  const dialogRef = useRef(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState(null);
  const meta = META[type];

  const load = async () => {
    if (!patient?.id) return;
    setLoading(true); setError('');
    try { setRecords((await listPatientClinicalRecords(patient.id)).filter((record) => record.recordType === type)); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  };
  const open = async () => { dialogRef.current?.showModal(); await load(); };
  const close = () => { setViewing(null); dialogRef.current?.close(); };
  const preview = viewing?.report || viewing?.final_content || viewing?.notes || viewing?.content?.notes || JSON.stringify(viewing?.data || viewing?.content || {}, null, 2);
  const edit = (record) => {
    writeClinicalRecordHandoff(record);
    window.location.reload();
  };

  useEffect(() => () => { if (dialogRef.current?.open) dialogRef.current.close(); }, []);
  if (!patient || !meta) return null;
  const Icon = meta.icon;
  return <>
    <button type="button" onClick={open} className="flex min-h-8 shrink-0 items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-2.5 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
      <History className="size-3.5" aria-hidden="true" /> Ver histórico
    </button>
    <dialog ref={dialogRef} onClose={() => setViewing(null)} aria-labelledby="feature-history-title" className="m-auto max-h-[88vh] w-[min(42rem,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-2xl backdrop:bg-slate-950/45">
      <div className="flex max-h-[88vh] flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h2 id="feature-history-title" className="flex items-center gap-2 text-base font-black text-slate-900"><Icon className="size-4 text-emerald-600" /> Histórico de {meta.label}</h2><p className="mt-0.5 text-xs text-slate-500">{patient.full_name}</p></div><button type="button" onClick={close} className="flex size-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Fechar histórico"><X className="size-4" /></button></header>
        <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
          <div className="mb-3 flex justify-end"><button type="button" onClick={load} disabled={loading} className="flex min-h-8 items-center gap-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 px-2"><RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Atualizar</button></div>
          {error ? <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</p> : null}
          {!loading && !error && !records.length ? <p className="rounded-2xl border border-dashed border-slate-200 p-7 text-center text-sm text-slate-500">Nenhuma {meta.singular.toLowerCase()} salva para este paciente.</p> : null}
          <ul className="divide-y divide-slate-100" aria-label={`Registros de ${meta.label}`}>{records.map((record) => { const editable = type !== 'contrato' && record.status !== 'signed'; return <li key={record.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="text-sm font-extrabold text-slate-800">{meta.singular} · {formatDate(record.recordDate)}</p><p className="text-[11px] font-semibold text-slate-500">{formatStatus(record.status)}</p></div><div className="flex gap-2"><button type="button" onClick={() => setViewing(record)} className="flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50"><Eye className="size-3.5" /> Visualizar</button>{editable ? <button type="button" onClick={() => edit(record)} className="flex min-h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700"><Pencil className="size-3.5" /> Abrir</button> : null}</div></li>; })}</ul>
          {viewing ? <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="mb-3 flex items-center justify-between"><p className="text-xs font-black text-slate-800">Pré-visualização</p><button type="button" onClick={() => setViewing(null)} className="text-xs font-bold text-slate-500 hover:text-slate-800">Fechar</button></div><pre className="max-h-64 overflow-auto whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-700">{preview || 'Registro sem conteúdo textual para pré-visualização.'}</pre></div> : null}
        </div>
      </div>
    </dialog>
  </>;
}
