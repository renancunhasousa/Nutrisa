import { Layers, Receipt, Wallet } from 'lucide-react';

export default function PatientFinanceShortcuts({ onOpen }) {
  return <section className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-xs">
    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
      <Wallet className="size-4 shrink-0 text-emerald-600" aria-hidden="true" /> Financeiro
    </h3>
    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
      <button type="button" onClick={() => onOpen('package')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50">
        <Layers className="size-4 text-emerald-600" aria-hidden="true" /> Novo pacote
      </button>
      <button type="button" onClick={() => onOpen('transaction')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50">
        <Receipt className="size-4 text-emerald-600" aria-hidden="true" /> Lançamento financeiro
      </button>
    </div>
  </section>;
}
