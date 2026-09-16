import React from 'react';

import { useAvaliacaoContext } from '../AvaliacaoContext.jsx';

export default function ProgressSteps() {
const { currentStep, setCurrentStep } = useAvaliacaoContext();
return (<>        {/* STEPPER PROGRESS BAR - REPLICANDO O MOCKUP */}
        <div className="flex items-center justify-center max-w-2xl mx-auto my-6 print:hidden">
          {/* Step 1 */}
          <div 
            onClick={() => setCurrentStep(1)} 
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
              currentStep === 1 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 ring-4 ring-emerald-50' 
                : currentStep > 1 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}>
              1
            </div>
            <span className={`text-xs uppercase tracking-wider font-extrabold transition-colors ${
              currentStep === 1 ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'
            }`}>
              1. Upload PDFs
            </span>
          </div>

          {/* Line 1-2 */}
          <div className={`flex-1 h-0.5 mx-4 transition-colors ${currentStep >= 2 ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>

          {/* Step 2 */}
          <div 
            onClick={() => currentStep >= 2 && setCurrentStep(2)} 
            className={`flex items-center space-x-2.5 ${currentStep >= 2 ? 'cursor-pointer group' : 'cursor-not-allowed opacity-60'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
              currentStep === 2 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 ring-4 ring-emerald-50' 
                : currentStep > 2 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-white text-slate-400 border border-slate-200'
            }`}>
              2
            </div>
            <span className={`text-xs uppercase tracking-wider font-extrabold transition-colors ${
              currentStep === 2 ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'
            }`}>
              2. Seleção de Dados
            </span>
          </div>

          {/* Line 2-3 */}
          <div className={`flex-1 h-0.5 mx-4 transition-colors ${currentStep >= 3 ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>

          {/* Step 3 */}
          <div 
            onClick={() => currentStep >= 2 && setCurrentStep(3)} 
            className={`flex items-center space-x-2.5 ${currentStep >= 2 ? 'cursor-pointer group' : 'cursor-not-allowed opacity-60'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
              currentStep === 3 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 ring-4 ring-emerald-50' 
                : 'bg-white text-slate-400 border border-slate-200'
            }`}>
              3
            </div>
            <span className={`text-xs uppercase tracking-wider font-extrabold transition-colors ${
              currentStep === 3 ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'
            }`}>
              3. Laudo Unificado
            </span>
          </div>
        </div>

</>);
}
