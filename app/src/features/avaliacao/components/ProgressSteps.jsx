import React from 'react';
import { useAvaliacaoContext } from '../AvaliacaoContext.jsx';

export default function ProgressSteps() {
  const { currentStep, setCurrentStep } = useAvaliacaoContext();

  return (
    <div
      className="mx-auto my-6 flex w-full min-w-0 max-w-2xl items-center justify-center print:hidden"
      aria-label="Progresso da avaliação"
    >
      <button
        type="button"
        onClick={() => setCurrentStep(1)}
        aria-current={currentStep === 1 ? 'step' : undefined}
        className="group flex shrink-0 cursor-pointer items-center gap-2.5"
      >
        <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
          currentStep === 1
            ? 'border border-emerald-300 bg-emerald-100 text-emerald-800 ring-4 ring-emerald-50'
            : currentStep > 1
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'border border-slate-200 bg-slate-100 text-slate-400'
        }`}>
          1
        </span>
        <span className={`${currentStep === 1 ? 'inline' : 'hidden sm:inline'} text-xs font-extrabold uppercase tracking-wider transition-colors ${
          currentStep === 1 ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'
        }`}>
          1. Upload PDFs
        </span>
      </button>

      <span className={`mx-2 h-0.5 min-w-2 flex-1 transition-colors sm:mx-4 ${currentStep >= 2 ? 'bg-emerald-500' : 'bg-slate-200'}`} />

      <button
        type="button"
        onClick={() => currentStep >= 2 && setCurrentStep(2)}
        disabled={currentStep < 2}
        aria-current={currentStep === 2 ? 'step' : undefined}
        className={`flex shrink-0 items-center gap-2.5 ${currentStep >= 2 ? 'group cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
      >
        <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
          currentStep === 2
            ? 'border border-emerald-300 bg-emerald-100 text-emerald-800 ring-4 ring-emerald-50'
            : currentStep > 2
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'border border-slate-200 bg-white text-slate-400'
        }`}>
          2
        </span>
        <span className={`${currentStep === 2 ? 'inline' : 'hidden sm:inline'} text-xs font-extrabold uppercase tracking-wider transition-colors ${
          currentStep === 2 ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'
        }`}>
          2. Seleção de Dados
        </span>
      </button>

      <span className={`mx-2 h-0.5 min-w-2 flex-1 transition-colors sm:mx-4 ${currentStep >= 3 ? 'bg-emerald-500' : 'bg-slate-200'}`} />

      <button
        type="button"
        onClick={() => currentStep >= 2 && setCurrentStep(3)}
        disabled={currentStep < 2}
        aria-current={currentStep === 3 ? 'step' : undefined}
        className={`flex shrink-0 items-center gap-2.5 ${currentStep >= 2 ? 'group cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
      >
        <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
          currentStep === 3
            ? 'border border-emerald-300 bg-emerald-100 text-emerald-800 ring-4 ring-emerald-50'
            : 'border border-slate-200 bg-white text-slate-400'
        }`}>
          3
        </span>
        <span className={`${currentStep === 3 ? 'inline' : 'hidden sm:inline'} text-xs font-extrabold uppercase tracking-wider transition-colors ${
          currentStep === 3 ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'
        }`}>
          3. Laudo Unificado
        </span>
      </button>
    </div>
  );
}
