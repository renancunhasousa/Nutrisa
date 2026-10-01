import React from 'react';
import { Flame, Beef, Wheat, CheckCircle, AlertCircle, Save, Printer } from 'lucide-react';
import { LipidIcon } from './LipidIcon.jsx';

export function TargetMacrosBar({
  totals,
  targetComparison,
  onSave,
  isSaving,
  saveStatus,
  onViewReport,
}) {
  const { calories, protein, carbs, fat } = targetComparison;

  const getProgressColor = (percent) => {
    if (percent >= 90 && percent <= 110) return 'bg-emerald-500';
    if (percent < 90) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getStatusBadge = (diff, percent) => {
    if (percent === 0) return null;
    if (percent >= 95 && percent <= 105) {
      return (
        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
          <CheckCircle className="w-2.5 h-2.5" /> Na meta
        </span>
      );
    }
    const diffSign = diff > 0 ? `+${diff}` : `${diff}`;
    return (
      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${diff > 0 ? 'text-rose-600 bg-rose-50' : 'text-amber-600 bg-amber-50'}`}>
        <AlertCircle className="w-2.5 h-2.5" /> {diffSign}g
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 sm:p-4 backdrop-blur-md bg-white/95">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
        
        {/* Indicadores Nutricionais em Tempo Real com Máximo Espaço */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 flex-1">
          
          {/* Calorias */}
          <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-semibold text-slate-600 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" /> Calorias
              </span>
              <span className="text-[11px] font-bold text-slate-700">
                {totals.calories} / {calories.target} kcal
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${getProgressColor(calories.percentage)}`}
                style={{ width: `${Math.min(calories.percentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-[10px] text-slate-400">{calories.percentage}% atingido</span>
              <span className={`text-[10px] font-medium ${calories.diff > 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                {calories.diff > 0 ? `+${calories.diff} kcal` : `${calories.diff} kcal`}
              </span>
            </div>
          </div>

          {/* Proteínas */}
          <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-semibold text-slate-600 flex items-center gap-1">
                <Beef className="w-3.5 h-3.5 text-rose-500" /> Proteína
              </span>
              <span className="text-[11px] font-bold text-slate-700">
                {totals.protein}g / {protein.target}g
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${getProgressColor(protein.percentage)}`}
                style={{ width: `${Math.min(protein.percentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-[10px] text-slate-400">{totals.percentages?.protein || 0}% kcal</span>
              {getStatusBadge(protein.diff, protein.percentage)}
            </div>
          </div>

          {/* Carboidratos */}
          <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-semibold text-slate-600 flex items-center gap-1">
                <Wheat className="w-3.5 h-3.5 text-amber-500" /> Carbo
              </span>
              <span className="text-[11px] font-bold text-slate-700">
                {totals.carbs}g / {carbs.target}g
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${getProgressColor(carbs.percentage)}`}
                style={{ width: `${Math.min(carbs.percentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-[10px] text-slate-400">{totals.percentages?.carbs || 0}% kcal</span>
              {getStatusBadge(carbs.diff, carbs.percentage)}
            </div>
          </div>

          {/* Gorduras */}
          <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-semibold text-slate-600 flex items-center gap-1">
                <LipidIcon className="w-3.5 h-3.5 text-teal-600" /> Gordura
              </span>
              <span className="text-[11px] font-bold text-slate-700">
                {totals.fat}g / {fat.target}g
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${getProgressColor(fat.percentage)}`}
                style={{ width: `${Math.min(fat.percentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-[10px] text-slate-400">{totals.percentages?.fat || 0}% kcal</span>
              {getStatusBadge(fat.diff, fat.percentage)}
            </div>
          </div>

        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
          <button
            type="button"
            onClick={() => onSave(false)}
            disabled={isSaving}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Salvar alterações como rascunho"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
          </button>

          <button
            type="button"
            onClick={onViewReport}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Visualizar e Imprimir Relatório em PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Relatório PDF</span>
          </button>
        </div>

      </div>

      {saveStatus === 'saved' && (
        <div className="mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 py-1 px-3 rounded-lg flex items-center gap-1.5 animate-fadeIn">
          <CheckCircle className="w-3.5 h-3.5" /> Dieta salva com sucesso no Supabase e em cache local!
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="mt-2 text-xs font-semibold text-rose-700 bg-rose-50 py-1 px-3 rounded-lg flex items-center gap-1.5 animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5" /> Erro ao salvar online. Os dados foram preservados no seu navegador.
        </div>
      )}
    </div>
  );
}
