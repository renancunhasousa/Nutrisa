import ResumoPage from './ResumoPage.jsx';
import ComposicaoPage from './ComposicaoPage.jsx';
import EvolucaoPage from './EvolucaoPage.jsx';
import OrientacoesPage from './OrientacoesPage.jsx';
import React from 'react';

import { ArrowLeft, Printer, Save } from 'lucide-react';

import { useAvaliacaoContext } from '../AvaliacaoContext.jsx';

export default function LaudoReport() {
const { currentStep, setCurrentStep, saveEvaluation, isSavingEvaluation, savedEvaluationId } = useAvaliacaoContext();
return (<>        {/* STEP 3: CUSTOM UNIFIED REPORT (PRINT READY) */}
        {currentStep === 3 && (
          <div className="space-y-6">
            
            {/* Top Toolbar (Hidden on Print) - CLEAN LUXURY SAAS STYLE */}
            <div className="mx-auto flex max-w-4xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs print:hidden md:flex-row md:items-center md:justify-between md:p-5">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl bg-slate-100 px-4 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-200 active:scale-95"
                >
                  <ArrowLeft className="size-3.5" aria-hidden="true" /> Editar Seleções
                </button>
                <span className="hidden text-xs font-medium text-slate-500 lg:inline">
                  Laudo estruturado e pronto para envio ao paciente ou impressão em PDF.
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:flex md:shrink-0">
                <button
                  type="button"
                  onClick={saveEvaluation}
                  disabled={isSavingEvaluation}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
                >
                  <Save className="size-4 shrink-0" aria-hidden="true" />
                  <span>{isSavingEvaluation ? 'Salvando…' : savedEvaluationId ? 'Atualizar no prontuário' : 'Salvar no prontuário'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 active:scale-95"
                >
                  <Printer className="size-4 shrink-0" aria-hidden="true" />
                  <span>Imprimir / Salvar em PDF</span>
                </button>
              </div>
            </div>

            <ResumoPage />
            <ComposicaoPage />
            <EvolucaoPage />
            <OrientacoesPage />
          </div>
        )}
</>);
}
