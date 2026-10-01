import React from 'react';
import { Target, User } from 'lucide-react';

export function DietConfigSection({ plan, onUpdateField }) {
  const objectives = [
    'Emagrecimento e Definição',
    'Hipertrofia e Ganho de Massa',
    'Manutenção e Longevidade',
    'Performance Esportiva',
    'Reeducação Alimentar',
    'Controle Glicêmico / Saúde Metabólica',
  ];

  const macroPresets = [
    {
      label: 'Hipertrofia (Alta Prot)',
      proteinG: 140,
      carbsG: 220,
      fatG: 60,
      calories: 1980,
    },
    {
      label: 'Emagrecimento Padrão',
      proteinG: 120,
      carbsG: 150,
      fatG: 50,
      calories: 1530,
    },
    {
      label: 'Low Carb Funcional',
      proteinG: 130,
      carbsG: 80,
      fatG: 75,
      calories: 1515,
    },
    {
      label: 'Manutenção Equilibrada',
      proteinG: 110,
      carbsG: 200,
      fatG: 55,
      calories: 1735,
    },
  ];

  const applyPreset = (preset) => {
    onUpdateField('target_calories', preset.calories);
    onUpdateField('target_protein', preset.proteinG);
    onUpdateField('target_carbs', preset.carbsG);
    onUpdateField('target_fat', preset.fatG);
  };

  return (
    <div className="space-y-6">
      
      {/* Dados do Paciente e Dieta */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <User className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Paciente e Título da Prescrição</h3>
            <p className="text-xs text-slate-500">Identificação para registro clínico e emissão do laudo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Nome do Paciente
            </label>
            <input
              type="text"
              value={plan.patient_name || ''}
              onChange={(e) => onUpdateField('patient_name', e.target.value)}
              placeholder="Ex: Mariana Castro"
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Título do Plano
            </label>
            <input
              type="text"
              value={plan.title || ''}
              onChange={(e) => onUpdateField('title', e.target.value)}
              placeholder="Ex: Plano Alimentar - Fase 1 (Déficit Calórico)"
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden font-medium"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Objetivo Principal
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {objectives.map((obj) => {
              const isSelected = plan.objective === obj;
              return (
                <button
                  key={obj}
                  type="button"
                  onClick={() => onUpdateField('objective', obj)}
                  className={`p-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer border ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 bg-white'
                  }`}
                >
                  {obj}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Metas Nutricionais (Calorias e Macronutrientes) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Target className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Metas Nutricionais Diárias</h3>
              <p className="text-xs text-slate-500">Defina os alvos de energia e macronutrientes da Dra.</p>
            </div>
          </div>

          {/* Presets de metas em 1 clique */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <span className="text-[11px] text-slate-400 font-medium shrink-0">Presets rápidos:</span>
            {macroPresets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-[11px] font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Calorias Alvo */}
          <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/70">
            <label className="text-xs font-bold text-amber-900 block mb-1">
              Calorias Alvo (kcal)
            </label>
            <input
              type="number"
              step="50"
              value={plan.target_calories || 1800}
              onChange={(e) => onUpdateField('target_calories', Number(e.target.value) || 0)}
              className="w-full text-base font-black text-amber-950 bg-white border border-amber-300 rounded-lg p-2 focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Proteína Alvo */}
          <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-200/70">
            <label className="text-xs font-bold text-rose-900 block mb-1">
              Proteína Alvo (g)
            </label>
            <input
              type="number"
              step="5"
              value={plan.target_protein || 120}
              onChange={(e) => onUpdateField('target_protein', Number(e.target.value) || 0)}
              className="w-full text-base font-black text-rose-950 bg-white border border-rose-300 rounded-lg p-2 focus:border-rose-500 focus:outline-hidden"
            />
            <span className="text-[10px] text-rose-600 block mt-1">
              ≈ {((plan.target_protein || 120) * 4)} kcal
            </span>
          </div>

          {/* Carboidratos Alvo */}
          <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/70">
            <label className="text-xs font-bold text-amber-900 block mb-1">
              Carboidrato Alvo (g)
            </label>
            <input
              type="number"
              step="5"
              value={plan.target_carbs || 180}
              onChange={(e) => onUpdateField('target_carbs', Number(e.target.value) || 0)}
              className="w-full text-base font-black text-amber-950 bg-white border border-amber-300 rounded-lg p-2 focus:border-amber-500 focus:outline-hidden"
            />
            <span className="text-[10px] text-amber-600 block mt-1">
              ≈ {((plan.target_carbs || 180) * 4)} kcal
            </span>
          </div>

          {/* Gorduras Alvo */}
          <div className="bg-teal-50/60 p-3 rounded-xl border border-teal-200/70">
            <label className="text-xs font-bold text-teal-900 block mb-1">
              Gordura Alvo (g)
            </label>
            <input
              type="number"
              step="2"
              value={plan.target_fat || 55}
              onChange={(e) => onUpdateField('target_fat', Number(e.target.value) || 0)}
              className="w-full text-base font-black text-teal-950 bg-white border border-teal-300 rounded-lg p-2 focus:border-teal-500 focus:outline-hidden"
            />
            <span className="text-[10px] text-teal-600 block mt-1">
              ≈ {((plan.target_fat || 55) * 9)} kcal
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
