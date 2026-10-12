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
            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap justify-between items-center gap-4 print:hidden max-w-4xl mx-auto">
              <div className="flex items-center space-x-3">
                <button onClick={saveEvaluation} disabled={isSavingEvaluation} className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-full transition-all flex items-center space-x-2">
                  <Save className="w-4 h-4" /><span>{isSavingEvaluation ? 'Salvando…' : savedEvaluationId ? 'Atualizar no prontuário' : 'Salvar no prontuário'}</span>
                </button>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center shadow-2xs active:scale-95"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Editar Seleções
                </button>
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  Laudo estruturado e pronto para envio ao paciente ou impressão em PDF.
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => window.print()}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-full shadow-sm hover:shadow transition-all flex items-center space-x-2 active:scale-95"
                >
                  <Printer className="w-4 h-4 mr-1.5" />
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
