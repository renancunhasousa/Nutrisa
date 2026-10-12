import { Link2, UserRound, X } from 'lucide-react';
import { usePatient } from '../usePatient.js';
import PatientFeatureHistory from './PatientFeatureHistory.jsx';

export default function PatientContextBar({ action = 'Este conteúdo', recordType }) {
  const { selectedPatient, selectPatient } = usePatient();
  return <div className={`mb-4 flex min-h-11 items-center gap-3 rounded-2xl border px-3 py-2 print:hidden ${selectedPatient ? 'border-emerald-200 bg-emerald-50/70' : 'border-dashed border-slate-300 bg-white/60'}`}>
    <span className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${selectedPatient ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{selectedPatient ? <Link2 className="size-4" /> : <UserRound className="size-4" />}</span>
    <span className="min-w-0 flex-1 text-xs">{selectedPatient ? <><strong className="text-slate-900">{selectedPatient.full_name}</strong><span className="text-slate-500"> · {action} será vinculado ao prontuário</span></> : <><strong className="text-slate-700">Sem paciente vinculado</strong><span className="text-slate-500"> · selecione um paciente no topo antes de salvar</span></>}</span>
    {selectedPatient && recordType ? <PatientFeatureHistory patient={selectedPatient} type={recordType} /> : null}
    {selectedPatient ? <button type="button" onClick={() => selectPatient(null)} className="flex size-8 items-center justify-center rounded-xl text-slate-400 hover:bg-white hover:text-slate-700" title="Remover vínculo"><X className="size-4" /></button> : null}
  </div>;
}
