import React from 'react';
import { Flame, Beef, Wheat, CheckCircle, AlertCircle, Save, Printer, ChevronUp } from 'lucide-react';
import { LipidIcon } from './LipidIcon.jsx';

/**
 * Rodapé flutuante de monitoramento contínuo de macronutrientes.
 * Aparece automaticamente quando a Dra. Isabela rola a página para baixo e a seção
 * superior de macronutrientes sai de vista.
 */
export function FloatingMacrosFooter({
  visible = false,
  totals,
  targetComparison,
  onSave,
  isSaving,
  saveStatus,
  onViewReport,
}) {
  const { calories, protein, carbs, fat } = targetComparison || {};

  const getProgressColor = (percent) => {
    if (percent >= 90 && percent <= 110) return 'bg-emerald-400';
    if (percent < 90) return 'bg-amber-400';
    return 'bg-rose-400';
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <aside 
      aria-label="Resumo de macronutrientes flutuante"
      className="fixed bottom-4 inset-x-3 sm:inset-x-6 z-50 max-w-6xl mx-auto transition-all duration-300 ease-out"
    >
      <div className="bg-slate-900/92 text-white backdrop-blur-md border border-slate-700/70 rounded-2xl shadow-2xl p-2.5 sm:px-4 sm:py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-4">
        
        {/* Indicadores Nutricionais Compactos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
          
          {/* Calorias */}
          <div className="bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/60 flex flex-col justify-center">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1 text-[11px]">
                <Flame className="w-3.5 h-3.5 text-amber-400" /> Kcal
              </span>
              <span className="text-[11px] font-bold text-white">
                {totals?.calories || 0} <span className="text-slate-400 text-[10px]">/ {calories?.target || 0}</span>
              </span>
            </div>
            <div className="w-full bg-slate-700/70 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full transition-all duration-300 ${getProgressColor(calories?.percentage || 0)}`}
                style={{ width: `${Math.min(calories?.percentage || 0, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-0.5 text-[9.5px]">
              <span className="text-slate-400">{calories?.percentage || 0}%</span>
              <span className={calories?.diff > 0 ? 'text-rose-400 font-medium' : 'text-slate-400'}>
                {calories?.diff > 0 ? `+${calories.diff}` : `${calories?.diff || 0}`}
              </span>
            </div>
          </div>

          {/* Proteínas */}
          <div className="bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/60 flex flex-col justify-center">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1 text-[11px]">
                <Beef className="w-3.5 h-3.5 text-rose-400" /> Proteína
              </span>
              <span className="text-[11px] font-bold text-white">
                {totals?.protein || 0}g <span className="text-slate-400 text-[10px]">/ {protein?.target || 0}g</span>
              </span>
            </div>
            <div className="w-full bg-slate-700/70 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full transition-all duration-300 ${getProgressColor(protein?.percentage || 0)}`}
                style={{ width: `${Math.min(protein?.percentage || 0, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-0.5 text-[9.5px]">
              <span className="text-slate-400">{totals?.percentages?.protein || 0}% kcal</span>
              <span className={protein?.diff > 0 ? 'text-rose-400 font-medium' : 'text-slate-400'}>
                {protein?.percentage >= 95 && protein?.percentage <= 105 ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                    <CheckCircle className="w-2.5 h-2.5" /> Meta
                  </span>
                ) : (
                  `${protein?.diff > 0 ? '+' : ''}${protein?.diff || 0}g`
                )}
              </span>
            </div>
          </div>

          {/* Carboidratos */}
          <div className="bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/60 flex flex-col justify-center">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1 text-[11px]">
                <Wheat className="w-3.5 h-3.5 text-amber-300" /> Carbo
              </span>
              <span className="text-[11px] font-bold text-white">
                {totals?.carbs || 0}g <span className="text-slate-400 text-[10px]">/ {carbs?.target || 0}g</span>
              </span>
            </div>
            <div className="w-full bg-slate-700/70 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full transition-all duration-300 ${getProgressColor(carbs?.percentage || 0)}`}
                style={{ width: `${Math.min(carbs?.percentage || 0, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-0.5 text-[9.5px]">
              <span className="text-slate-400">{totals?.percentages?.carbs || 0}% kcal</span>
              <span className={carbs?.diff > 0 ? 'text-rose-400 font-medium' : 'text-slate-400'}>
                {carbs?.percentage >= 95 && carbs?.percentage <= 105 ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                    <CheckCircle className="w-2.5 h-2.5" /> Meta
                  </span>
                ) : (
                  `${carbs?.diff > 0 ? '+' : ''}${carbs?.diff || 0}g`
                )}
              </span>
            </div>
          </div>

          {/* Gorduras */}
          <div className="bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/60 flex flex-col justify-center">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1 text-[11px]">
                <LipidIcon className="w-3.5 h-3.5 text-teal-400" /> Gordura
              </span>
              <span className="text-[11px] font-bold text-white">
                {totals?.fat || 0}g <span className="text-slate-400 text-[10px]">/ {fat?.target || 0}g</span>
              </span>
            </div>
            <div className="w-full bg-slate-700/70 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full transition-all duration-300 ${getProgressColor(fat?.percentage || 0)}`}
                style={{ width: `${Math.min(fat?.percentage || 0, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-0.5 text-[9.5px]">
              <span className="text-slate-400">{totals?.percentages?.fat || 0}% kcal</span>
              <span className={fat?.diff > 0 ? 'text-rose-400 font-medium' : 'text-slate-400'}>
                {fat?.percentage >= 95 && fat?.percentage <= 105 ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                    <CheckCircle className="w-2.5 h-2.5" /> Meta
                  </span>
                ) : (
                  `${fat?.diff > 0 ? '+' : ''}${fat?.diff || 0}g`
                )}
              </span>
            </div>
          </div>

        </div>

        {/* Ações Rápidas no Rodapé */}
        <div className="flex items-center justify-end gap-2 shrink-0 border-t md:border-t-0 md:border-l border-slate-800 md:pl-3 pt-2 md:pt-0">
          <button
            type="button"
            onClick={() => onSave(false)}
            disabled={isSaving}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
              saveStatus === 'saved'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="Salvar rascunho da dieta"
          >
            {saveStatus === 'saved' ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-200" />
                <span>Salvo!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-slate-300" />
                <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
              </>
            )}
          </button>

          {onViewReport && (
            <button
              type="button"
              onClick={onViewReport}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Visualizar laudo e cardápio"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Laudo</span>
            </button>
          )}

          <button
            type="button"
            onClick={scrollToTop}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer"
            title="Voltar ao topo da página"
            aria-label="Voltar ao topo"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>

      </div>
    </aside>
  );
}
