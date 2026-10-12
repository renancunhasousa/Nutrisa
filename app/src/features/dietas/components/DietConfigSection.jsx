import React from 'react';
import { Apple, Beef, Droplets, Dumbbell, HeartPulse, Target, Trophy, TrendingDown, User, Wheat } from 'lucide-react';
import { LipidIcon } from './LipidIcon.jsx';

export function DietConfigSection({ plan, onUpdateField }) {
  const objectives = [
    'Emagrecimento e Definição',
    'Hipertrofia e Ganho de Massa',
    'Manutenção e Longevidade',
    'Performance Esportiva',
    'Reeducação Alimentar',
    'Controle Glicêmico / Saúde Metabólica',
  ];

  const objectiveIcons = [TrendingDown, Dumbbell, HeartPulse, Trophy, Apple, HeartPulse];

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

  const macroCalories = {
    protein: (plan.target_protein || 120) * 4,
    carbs: (plan.target_carbs || 180) * 4,
    fat: (plan.target_fat || 55) * 9,
  };
  const macroTotal = macroCalories.protein + macroCalories.carbs + macroCalories.fat || 1;

  return (
    <div className="space-y-6">
      
      {/* Dados do Paciente e Dieta */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl font-bold text-emerald-700">
            <User className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">Paciente e Título da Prescrição</h3>
            <p className="text-xs text-slate-500">Identificação para registro clínico e emissão do laudo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
              Nome do Paciente
            </label>
            <input
              type="text"
              value={plan.patient_name || ''}
              onChange={(e) => onUpdateField('patient_name', e.target.value)}
              placeholder="Ex: Mariana Castro"
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-hidden sm:text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
              Título do Plano
            </label>
            <input
              type="text"
              value={plan.title || ''}
              onChange={(e) => onUpdateField('title', e.target.value)}
              placeholder="Ex: Plano Alimentar - Fase 1 (Déficit Calórico)"
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-hidden sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
            Objetivo Principal
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {objectives.map((obj) => {
              const isSelected = plan.objective === obj;
              const ObjectiveIcon = objectiveIcons[objectives.indexOf(obj)] || Target;
              return (
                <button
                  key={obj}
                  type="button"
                  onClick={() => onUpdateField('objective', isSelected ? '' : obj)}
                  aria-pressed={isSelected}
                  className={`inline-flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 shadow-2xs'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50'
                  }`}
                >
                  <ObjectiveIcon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="leading-tight">{obj}</span>
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
          <div className="flex h-9 w-9 items-center justify-center rounded-xl font-bold text-emerald-700">
              <Target className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">Metas Nutricionais Diárias</h3>
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

        <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
          <MacroDonut calories={macroCalories} total={macroTotal} targetCalories={plan.target_calories || 1800} onTargetCaloriesChange={(value) => onUpdateField('target_calories', value)} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Hidratação */}
          <div className="rounded-2xl border border-sky-200/80 bg-gradient-to-br from-white to-sky-100/80 p-4 shadow-xs transition hover:-translate-y-0.5 hover:shadow-sm">
            <label className="mb-3 flex items-center gap-2 text-xs font-bold text-sky-900">
              <Droplets className="size-4 text-sky-500" aria-hidden="true" /> Hidratação <span className="ml-auto font-semibold text-sky-600">ml</span>
            </label>
            <input
              type="number"
              step="100"
              value={plan.water_intake_ml || 2500}
              onChange={(e) => onUpdateField('water_intake_ml', Number(e.target.value) || 0)}
              className="w-full rounded-xl border border-sky-200 bg-white/90 p-2.5 text-lg font-black text-sky-950 shadow-inner focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/15"
            />
          </div>

          {/* Proteína Alvo */}
          <div className="rounded-2xl border border-rose-200/80 bg-gradient-to-br from-white to-rose-50/80 p-4 shadow-xs transition hover:-translate-y-0.5 hover:shadow-sm">
            <label className="mb-3 flex items-center gap-2 text-xs font-bold text-rose-900">
              <Beef className="size-4 text-rose-600" aria-hidden="true" /> Proteínas <span className="ml-auto font-semibold text-rose-600">g</span>
            </label>
            <input
              type="number"
              step="5"
              value={plan.target_protein || 120}
              onChange={(e) => onUpdateField('target_protein', Number(e.target.value) || 0)}
              className="w-full rounded-xl border border-rose-200 bg-white/90 p-2.5 text-lg font-black text-rose-950 shadow-inner focus:border-rose-500 focus:outline-hidden focus:ring-2 focus:ring-rose-500/15"
            />
            <span className="text-[10px] text-rose-600 block mt-1">
              ≈ {((plan.target_protein || 120) * 4)} kcal
            </span>
          </div>

          {/* Carboidratos Alvo */}
          <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-white to-amber-50/80 p-4 shadow-xs transition hover:-translate-y-0.5 hover:shadow-sm">
            <label className="mb-3 flex items-center gap-2 text-xs font-bold text-amber-900">
              <Wheat className="size-4 text-amber-600" aria-hidden="true" /> Carboidratos <span className="ml-auto font-semibold text-amber-600">g</span>
            </label>
            <input
              type="number"
              step="5"
              value={plan.target_carbs || 180}
              onChange={(e) => onUpdateField('target_carbs', Number(e.target.value) || 0)}
              className="w-full rounded-xl border border-amber-200 bg-white/90 p-2.5 text-lg font-black text-amber-950 shadow-inner focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/15"
            />
            <span className="text-[10px] text-amber-600 block mt-1">
              ≈ {((plan.target_carbs || 180) * 4)} kcal
            </span>
          </div>

          {/* Gorduras Alvo */}
          <div className="rounded-2xl border border-teal-200/80 bg-gradient-to-br from-white to-teal-50/80 p-4 shadow-xs transition hover:-translate-y-0.5 hover:shadow-sm">
            <label className="mb-3 flex items-center gap-2 text-xs font-bold text-teal-900">
              <LipidIcon className="size-4 text-teal-600" aria-hidden="true" /> Gorduras <span className="ml-auto font-semibold text-teal-600">g</span>
            </label>
            <input
              type="number"
              step="2"
              value={plan.target_fat || 55}
              onChange={(e) => onUpdateField('target_fat', Number(e.target.value) || 0)}
              className="w-full rounded-xl border border-teal-200 bg-white/90 p-2.5 text-lg font-black text-teal-950 shadow-inner focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/15"
            />
            <span className="text-[10px] text-teal-600 block mt-1">
              ≈ {((plan.target_fat || 55) * 9)} kcal
            </span>
          </div>
          </div>
        </div>

      </div>

    </div>
  );
}

function MacroDonut({ calories, total, targetCalories, onTargetCaloriesChange }) {
  const segments = [
    { label: 'Proteína', value: calories.protein, color: '#e11d48', Icon: Beef },
    { label: 'Carboidrato', value: calories.carbs, color: '#d97706', Icon: Wheat },
    { label: 'Gordura', value: calories.fat, color: '#0d9488', Icon: LipidIcon },
  ];
  let offset = 0;
  const gradient = segments.map((segment) => {
    const start = offset;
    offset += (segment.value / total) * 100;
    return `${segment.color} ${start}% ${offset}%`;
  }).join(', ');

  return (
    <div className="flex min-h-64 flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 p-5 shadow-xs">
      <div className="mb-4 flex w-full items-center justify-between gap-3">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Distribuição energética</p>
        <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
          Meta calórica
          <span className="relative">
            <input
              type="number"
              step="50"
              value={targetCalories}
              onChange={(event) => onTargetCaloriesChange(Number(event.target.value) || 0)}
              className="h-9 w-24 rounded-lg border border-emerald-200 bg-white px-2 pr-9 text-right text-sm font-black text-emerald-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/15"
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-emerald-600">kcal</span>
          </span>
        </label>
      </div>
      <div className="relative size-36 rounded-full p-1 shadow-[0_12px_30px_rgba(15,23,42,0.12)]" style={{ background: `conic-gradient(${gradient})` }}>
        <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full border border-white/80 bg-white text-center shadow-inner">
          <span className="text-[10px] font-semibold text-slate-400">Macros</span>
          <strong className="text-xl font-black tracking-tight text-slate-800">{total}</strong>
          <span className="text-[10px] font-bold text-slate-500">kcal</span>
        </div>
      </div>
      <div className="mt-4 grid w-full gap-2">
        {segments.map(({ label, value, color, Icon }) => (
          <div key={label} className="flex items-center justify-between rounded-lg border border-white bg-white/75 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 shadow-2xs">
            <span className="flex items-center gap-1.5"><Icon className="size-3.5" style={{ color }} aria-hidden="true" />{label}</span>
            <span className="font-black" style={{ color }}>{Math.round((value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
