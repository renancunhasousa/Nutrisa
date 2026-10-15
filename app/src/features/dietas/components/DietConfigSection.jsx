import React, { useEffect, useState } from 'react';
import { Apple, Beef, Droplets, Dumbbell, HeartPulse, Leaf, Target, Trophy, TrendingDown, User, Wheat } from 'lucide-react';
import { LipidIcon } from './LipidIcon.jsx';
import { EvaluationEnergyImporter } from './EvaluationEnergyImporter.jsx';

export function DietConfigSection({ 
  plan, 
  onUpdateField, 
  activePatient, 
  hasActivePatient, 
  showAppNotification 
}) {
  const [evaluationWeight, setEvaluationWeight] = useState(null);

  useEffect(() => {
    setEvaluationWeight(null);
  }, [activePatient?.id]);

  const objectives = [
    'Emagrecimento e Definição',
    'Hipertrofia e Ganho de Massa',
    'Manutenção e Longevidade',
    'Performance Esportiva',
    'Reeducação Alimentar',
    'Controle Glicêmico / Saúde Metabólica',
  ];

  const objectiveIcons = [TrendingDown, Dumbbell, Leaf, Trophy, Apple, HeartPulse];

  const macroPresets = [
    {
      label: 'Hipertrofia (Alta Prot)',
      proteinG: 140,
      carbsG: 220,
      fatG: 60,
    },
    {
      label: 'Emagrecimento Padrão',
      proteinG: 120,
      carbsG: 150,
      fatG: 50,
    },
    {
      label: 'Low Carb Funcional',
      proteinG: 130,
      carbsG: 80,
      fatG: 75,
    },
    {
      label: 'Manutenção Equilibrada',
      proteinG: 110,
      carbsG: 200,
      fatG: 55,
    },
  ];

  const targetCalories = Number(plan.target_calories) || 1800;
  const macroDefinitions = {
    protein: { field: 'target_protein', factor: 4 },
    carbs: { field: 'target_carbs', factor: 4 },
    fat: { field: 'target_fat', factor: 9 },
  };
  const roundToOneDecimal = (value) => Math.round(value * 10) / 10;
  const getMacroGrams = (key) => Number(plan[macroDefinitions[key].field]) || 0;
  const getMacroEnergy = (key) => getMacroGrams(key) * macroDefinitions[key].factor;

  const applyEnergyDistribution = (energyByMacro, calories = targetCalories) => {
    Object.entries(macroDefinitions).forEach(([key, definition]) => {
      onUpdateField(definition.field, roundToOneDecimal(energyByMacro[key] / definition.factor));
    });
    if (calories !== targetCalories) onUpdateField('target_calories', calories);
  };

  const applyPreset = (preset) => {
    const presetEnergy = {
      protein: preset.proteinG * 4,
      carbs: preset.carbsG * 4,
      fat: preset.fatG * 9,
    };
    const presetTotal = presetEnergy.protein + presetEnergy.carbs + presetEnergy.fat || 1;

    applyEnergyDistribution({
      protein: targetCalories * (presetEnergy.protein / presetTotal),
      carbs: targetCalories * (presetEnergy.carbs / presetTotal),
      fat: targetCalories * (presetEnergy.fat / presetTotal),
    });
  };

  const updateMacroEnergy = (changedKey, requestedEnergy) => {
    const changedEnergy = Math.min(targetCalories, Math.max(0, requestedEnergy));
    const otherKeys = Object.keys(macroDefinitions).filter((key) => key !== changedKey);
    const otherCurrentTotal = otherKeys.reduce((sum, key) => sum + getMacroEnergy(key), 0);
    const remainingEnergy = targetCalories - changedEnergy;
    const energyByMacro = { [changedKey]: changedEnergy };

    otherKeys.forEach((key) => {
      energyByMacro[key] = otherCurrentTotal > 0
        ? remainingEnergy * (getMacroEnergy(key) / otherCurrentTotal)
        : remainingEnergy / otherKeys.length;
    });

    applyEnergyDistribution(energyByMacro);
  };

  const handleMacroGramsChange = (key, grams) => {
    updateMacroEnergy(key, (Number(grams) || 0) * macroDefinitions[key].factor);
  };

  const handleMacroPercentageChange = (key, percentage) => {
    const safePercentage = Math.min(100, Math.max(0, Number(percentage) || 0));
    updateMacroEnergy(key, targetCalories * (safePercentage / 100));
  };

  const handleTargetCaloriesChange = (calories) => {
    const nextCalories = Math.max(0, Number(calories) || 0);
    const currentEnergy = Object.fromEntries(
      Object.keys(macroDefinitions).map((key) => [key, getMacroEnergy(key)])
    );
    const currentTotal = Object.values(currentEnergy).reduce((sum, value) => sum + value, 0) || 1;

    applyEnergyDistribution(
      Object.fromEntries(
        Object.entries(currentEnergy).map(([key, energy]) => [key, nextCalories * (energy / currentTotal)])
      ),
      nextCalories
    );
  };

  const getPresetMacroPercentages = (preset) => {
    const proteinCalories = preset.proteinG * 4;
    const carbsCalories = preset.carbsG * 4;
    const fatCalories = preset.fatG * 9;
    const totalCalories = proteinCalories + carbsCalories + fatCalories || 1;

    return {
      protein: ((proteinCalories / totalCalories) * 100).toFixed(1),
      carbs: ((carbsCalories / totalCalories) * 100).toFixed(1),
      fat: ((fatCalories / totalCalories) * 100).toFixed(1),
    };
  };

  const macroCalories = {
    protein: getMacroEnergy('protein'),
    carbs: getMacroEnergy('carbs'),
    fat: getMacroEnergy('fat'),
  };
  const macroPercentages = {
    protein: roundToOneDecimal((macroCalories.protein / targetCalories) * 100),
    carbs: roundToOneDecimal((macroCalories.carbs / targetCalories) * 100),
    fat: roundToOneDecimal((macroCalories.fat / targetCalories) * 100),
  };
  const patientWeightFromRecord = Number.parseFloat(
    String(activePatient?.weight ?? activePatient?.current_weight ?? activePatient?.peso ?? '').replace(',', '.')
  );
  const patientWeight = evaluationWeight || (Number.isFinite(patientWeightFromRecord) ? patientWeightFromRecord : 0);
  const waterIntakeMl = Number(plan.water_intake_ml) || 2500;
  const waterMlPerKg = patientWeight ? roundToOneDecimal(waterIntakeMl / patientWeight) : 0;

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
              <p className="text-xs text-slate-500">Defina os alvos de energia e macronutrientes</p>
            </div>
          </div>

          {/* Presets de metas em 1 clique */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <span className="text-[11px] text-slate-400 font-medium shrink-0">Presets:</span>
            {macroPresets.map((preset) => {
              const percentages = getPresetMacroPercentages(preset);

              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="flex basis-[9.5rem] shrink-0 flex-col items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-center text-[11px] font-semibold text-slate-700 transition-all hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 cursor-pointer"
                >
                  <span className="whitespace-nowrap">{preset.label}</span>
                  <span className="flex w-full items-start justify-center gap-1.5 text-[10px] font-bold">
                    <span className="inline-flex flex-col items-center gap-0.5 text-rose-600">
                      <Beef className="size-3" aria-hidden="true" />
                      <span className="sr-only">Proteína: </span>{percentages.protein}%
                    </span>
                    <span className="inline-flex flex-col items-center gap-0.5 text-amber-600">
                      <Wheat className="size-3" aria-hidden="true" />
                      <span className="sr-only">Carboidratos: </span>{percentages.carbs}%
                    </span>
                    <span className="inline-flex flex-col items-center gap-0.5 text-teal-600">
                      <LipidIcon className="size-3" aria-hidden="true" />
                      <span className="sr-only">Gorduras: </span>{percentages.fat}%
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Integração Clínica: Puxar calorias da avaliação mais recente do paciente */}
        <EvaluationEnergyImporter
          activePatient={activePatient}
          hasActivePatient={hasActivePatient}
          onApplyCalories={handleTargetCaloriesChange}
          onApplyWater={(waterMl) => onUpdateField('water_intake_ml', waterMl)}
          onEvaluationWeight={setEvaluationWeight}
          showAppNotification={showAppNotification}
        />

        <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
          <MacroDonut calories={macroCalories} total={targetCalories} targetCalories={targetCalories} onTargetCaloriesChange={handleTargetCaloriesChange} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Hidratação */}
            <div className="rounded-2xl border border-sky-200/80 bg-gradient-to-br from-white to-sky-100/80 p-4 shadow-xs transition hover:-translate-y-0.5 hover:shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold text-sky-900">
                <Droplets className="size-4 text-sky-500" aria-hidden="true" /> Hidratação
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label htmlFor="water-total-ml" className="text-[10px] font-bold text-sky-700">
                  Total (ml)
                  <input
                    id="water-total-ml"
                    type="number"
                    min="0"
                    step="100"
                    value={waterIntakeMl}
                    onChange={(event) => onUpdateField('water_intake_ml', Number(event.target.value) || 0)}
                    className="mt-1 w-full rounded-xl border border-sky-200 bg-white/90 p-2.5 text-base font-black text-sky-950 shadow-inner focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/15"
                  />
                </label>
                <label htmlFor="water-ml-per-kg" className="text-[10px] font-bold text-sky-700">
                  Por peso (ml/kg)
                  <input
                    id="water-ml-per-kg"
                    type="number"
                    min="0"
                    step="1"
                    value={patientWeight ? waterMlPerKg : ''}
                    disabled={!patientWeight}
                    onChange={(event) => onUpdateField('water_intake_ml', Math.round((Number(event.target.value) || 0) * patientWeight))}
                    className="mt-1 w-full rounded-xl border border-sky-200 bg-white/90 p-2.5 text-base font-black text-sky-950 shadow-inner focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </label>
              </div>
              <p className="mt-1.5 text-[10px] text-sky-600">
                {patientWeight ? `Calculado com ${patientWeight} kg.` : 'Carregue a avaliação recente para calcular por peso.'}
              </p>
            </div>

            {/* Proteína Alvo */}
            <div className="rounded-2xl border border-rose-200/80 bg-gradient-to-br from-white to-rose-50/80 p-4 shadow-xs transition hover:-translate-y-0.5 hover:shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold text-rose-900">
                <Beef className="size-4 text-rose-600" aria-hidden="true" /> Proteínas
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label htmlFor="target-protein-grams" className="text-[10px] font-bold text-rose-700">
                  Gramas (g)
                  <input id="target-protein-grams" type="number" min="0" step="1" value={getMacroGrams('protein')} onChange={(event) => handleMacroGramsChange('protein', event.target.value)} className="mt-1 w-full rounded-xl border border-rose-200 bg-white/90 p-2.5 text-base font-black text-rose-950 shadow-inner focus:border-rose-500 focus:outline-hidden focus:ring-2 focus:ring-rose-500/15" />
                </label>
                <label htmlFor="target-protein-percent" className="text-[10px] font-bold text-rose-700">
                  Percentual (%)
                  <input id="target-protein-percent" type="number" min="0" max="100" step="0.1" value={macroPercentages.protein} onChange={(event) => handleMacroPercentageChange('protein', event.target.value)} className="mt-1 w-full rounded-xl border border-rose-200 bg-white/90 p-2.5 text-base font-black text-rose-950 shadow-inner focus:border-rose-500 focus:outline-hidden focus:ring-2 focus:ring-rose-500/15" />
                </label>
              </div>
              <span className="text-[10px] text-rose-600 block mt-1">
                ≈ {macroCalories.protein} kcal
              </span>
            </div>

            {/* Carboidratos Alvo */}
            <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-white to-amber-50/80 p-4 shadow-xs transition hover:-translate-y-0.5 hover:shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold text-amber-900">
                <Wheat className="size-4 text-amber-600" aria-hidden="true" /> Carboidratos
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label htmlFor="target-carbs-grams" className="text-[10px] font-bold text-amber-700">
                  Gramas (g)
                  <input id="target-carbs-grams" type="number" min="0" step="1" value={getMacroGrams('carbs')} onChange={(event) => handleMacroGramsChange('carbs', event.target.value)} className="mt-1 w-full rounded-xl border border-amber-200 bg-white/90 p-2.5 text-base font-black text-amber-950 shadow-inner focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/15" />
                </label>
                <label htmlFor="target-carbs-percent" className="text-[10px] font-bold text-amber-700">
                  Percentual (%)
                  <input id="target-carbs-percent" type="number" min="0" max="100" step="0.1" value={macroPercentages.carbs} onChange={(event) => handleMacroPercentageChange('carbs', event.target.value)} className="mt-1 w-full rounded-xl border border-amber-200 bg-white/90 p-2.5 text-base font-black text-amber-950 shadow-inner focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/15" />
                </label>
              </div>
              <span className="text-[10px] text-amber-600 block mt-1">
                ≈ {macroCalories.carbs} kcal
              </span>
            </div>

            {/* Gorduras Alvo */}
            <div className="rounded-2xl border border-teal-200/80 bg-gradient-to-br from-white to-teal-50/80 p-4 shadow-xs transition hover:-translate-y-0.5 hover:shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold text-teal-900">
                <LipidIcon className="size-4 text-teal-600" aria-hidden="true" /> Gorduras
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label htmlFor="target-fat-grams" className="text-[10px] font-bold text-teal-700">
                  Gramas (g)
                  <input id="target-fat-grams" type="number" min="0" step="0.5" value={getMacroGrams('fat')} onChange={(event) => handleMacroGramsChange('fat', event.target.value)} className="mt-1 w-full rounded-xl border border-teal-200 bg-white/90 p-2.5 text-base font-black text-teal-950 shadow-inner focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/15" />
                </label>
                <label htmlFor="target-fat-percent" className="text-[10px] font-bold text-teal-700">
                  Percentual (%)
                  <input id="target-fat-percent" type="number" min="0" max="100" step="0.1" value={macroPercentages.fat} onChange={(event) => handleMacroPercentageChange('fat', event.target.value)} className="mt-1 w-full rounded-xl border border-teal-200 bg-white/90 p-2.5 text-base font-black text-teal-950 shadow-inner focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/15" />
                </label>
              </div>
              <span className="text-[10px] text-teal-600 block mt-1">
                ≈ {macroCalories.fat} kcal
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
  const gradientParts = segments.map((segment) => {
    const start = Math.min(offset, 100);
    offset += (segment.value / total) * 100;
    return `${segment.color} ${start}% ${Math.min(offset, 100)}%`;
  });
  if (offset < 100) gradientParts.push(`#e2e8f0 ${offset}% 100%`);
  const gradient = gradientParts.join(', ');

  const chartWidth = 352;
  const chartHeight = 208;
  const chartCenter = { x: chartWidth / 2, y: chartHeight / 2 };
  let labelOffset = 0;
  const chartLabels = segments.map((segment) => {
    const percentage = (segment.value / total) * 100;
    const middleAngle = labelOffset + percentage / 2;
    const radians = (middleAngle * 3.6 - 90) * (Math.PI / 180);
    const direction = Math.cos(radians) >= 0 ? 1 : -1;
    const pointAtRadius = (radius) => ({
      x: chartCenter.x + Math.cos(radians) * radius,
      y: chartCenter.y + Math.sin(radians) * radius,
    });
    const start = pointAtRadius(68);
    const elbow = pointAtRadius(88);
    const end = { x: elbow.x + direction * 24, y: elbow.y };
    const labelPosition = {
      x: Math.min(chartWidth - 34, Math.max(34, end.x + direction * 24)),
      y: Math.min(chartHeight - 18, Math.max(18, end.y)),
    };

    labelOffset += percentage;
    return { ...segment, percentage: Math.round(percentage), start, elbow, end, labelPosition };
  });

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
      <figure className="relative h-52 w-full max-w-[22rem]" aria-label="Distribuição percentual dos macronutrientes">
        <svg
          className="pointer-events-none absolute inset-0 size-full"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          aria-hidden="true"
        >
          {chartLabels.map(({ label, color, start, elbow, end }) => (
            <g key={label}>
              <polyline
                points={`${start.x},${start.y} ${elbow.x},${elbow.y} ${end.x},${end.y}`}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx={start.x} cy={start.y} r="2.5" fill={color} />
            </g>
          ))}
        </svg>

        <div
          className="absolute left-1/2 top-1/2 size-36 -translate-x-1/2 -translate-y-1/2 rounded-full p-1 shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
          style={{ background: `conic-gradient(${gradient})` }}
        >
          <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full border border-white/80 bg-white text-center shadow-inner">
            <span className="text-[10px] font-semibold text-slate-400">Meta</span>
            <strong className="text-xl font-black tracking-tight text-slate-800">{targetCalories}</strong>
            <span className="text-[10px] font-bold text-slate-500">kcal</span>
          </div>
        </div>

        {chartLabels.map(({ label, percentage, color, Icon, labelPosition }) => (
          <div
            key={label}
            className="absolute z-10 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full border border-white bg-white/95 px-2 py-1 text-[10px] font-black shadow-xs"
            style={{
              color,
              left: `${(labelPosition.x / chartWidth) * 100}%`,
              top: `${(labelPosition.y / chartHeight) * 100}%`,
            }}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            <span className="sr-only">{label}: </span>
            {percentage}%
          </div>
        ))}

        <figcaption className="sr-only">
          {chartLabels.map(({ label, percentage }) => `${label}: ${percentage}%`).join('; ')}.
        </figcaption>
      </figure>
    </div>
  );
}
