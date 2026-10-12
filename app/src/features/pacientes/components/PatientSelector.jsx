import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, UserRound, X } from 'lucide-react';
import { usePatient } from '../usePatient.js';

const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'P';

export default function PatientSelector() {
  const { patients, selectedPatient, selectPatient, loading } = usePatient();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [imageError, setImageError] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    const escape = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR');
    if (!normalized) return patients.slice(0, 8);
    return patients.filter((patient) => [patient.full_name, patient.preferred_name, patient.phone, patient.whatsapp_phone]
      .some((value) => value?.toLocaleLowerCase('pt-BR').includes(normalized))).slice(0, 8);
  }, [patients, query]);

  const choose = (patient) => {
    selectPatient(patient);
    setImageError(false);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative w-11 sm:w-56">
      <button type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-controls="global-patient-selector" aria-label={selectedPatient ? `Paciente ativo: ${selectedPatient.full_name}` : 'Selecionar paciente'} className={`flex h-11 w-full min-w-0 items-center gap-2 rounded-2xl border p-1.5 text-left transition sm:px-2.5 ${selectedPatient ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900 sm:pr-10' : 'border-slate-200/65 bg-white/55 text-slate-600 hover:border-emerald-200 hover:bg-white/90'}`}>
        <span className={`flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-xl text-[10px] font-black ${selectedPatient ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{selectedPatient?.avatar_url && !imageError ? <img src={selectedPatient.avatar_url} alt="" className="size-full object-cover" onError={() => setImageError(true)} /> : selectedPatient ? initials(selectedPatient.full_name) : <UserRound className="size-4" />}</span>
        <span className="hidden w-0 min-w-0 flex-1 overflow-hidden pr-1 sm:block"><span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Paciente ativo</span><span className="block truncate text-xs font-extrabold">{selectedPatient?.full_name || 'Selecionar paciente'}</span></span>
        {!selectedPatient ? <ChevronDown className="hidden size-3.5 shrink-0 text-slate-400 sm:block" /> : null}
      </button>
      {selectedPatient ? <button type="button" onClick={() => choose(null)} aria-label="Desselecionar paciente" title="Desselecionar paciente" className="absolute right-1.5 top-1/2 z-10 hidden size-7 -translate-y-1/2 items-center justify-center rounded-lg text-emerald-700 hover:bg-white/80 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-600 sm:inline-flex"><X className="size-3.5" /></button> : null}
      {open ? (
        <div id="global-patient-selector" className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl" role="dialog" aria-label="Selecionar paciente ativo">
          <label className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100"><Search className="size-4 text-slate-400" /><span className="sr-only">Buscar paciente</span><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nome ou telefone" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
          <div className="mt-2 max-h-72 overflow-y-auto">
            {loading ? <p className="p-3 text-xs text-slate-500">Carregando pacientes…</p> : null}
            {!loading && !filtered.length ? <p className="p-3 text-xs text-slate-500">Nenhum paciente encontrado.</p> : null}
            {filtered.map((patient) => <button key={patient.id} type="button" onClick={() => choose(patient)} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left hover:bg-emerald-50"><span className="flex size-8 items-center justify-center rounded-xl bg-slate-100 text-[10px] font-black text-slate-600">{initials(patient.full_name)}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-800">{patient.full_name}</span><span className="block truncate text-[10px] text-slate-500">{patient.whatsapp_phone || patient.phone || 'Sem telefone'}</span></span>{selectedPatient?.id === patient.id ? <Check className="size-4 text-emerald-600" /> : null}</button>)}
          </div>
          {selectedPatient ? <button type="button" onClick={() => choose(null)} className="mt-2 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"><X className="size-3.5" /> Trabalhar sem paciente</button> : null}
        </div>
      ) : null}
    </div>
  );
}
