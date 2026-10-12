/**
 * Utilitários para extrair e integrar dados da avaliação física (TMB, calorias, peso, hidratação)
 * ao criador de dietas da NutrIsa.
 */

export function extractEvaluationEnergy(evaluation) {
  if (!evaluation) return null;
  const data = evaluation.data || {};

  let tmb = null;
  let weight = evaluation.weight != null ? Number(evaluation.weight) : null;
  let bodyFat = evaluation.body_fat != null ? Number(evaluation.body_fat) : null;
  let leanMass = evaluation.muscle_mass != null ? Number(evaluation.muscle_mass) : null;
  let water = null;

  // 1. Extração de formato direto (laudos simplificados ou InBody)
  if (data.taxa_metabolica_basal_kcal != null) {
    tmb = Number(data.taxa_metabolica_basal_kcal);
  }
  if (data.peso_kg != null && weight == null) {
    weight = Number(data.peso_kg);
  }
  if (data.agua_corporal_total_l != null) {
    water = Number(data.agua_corporal_total_l);
  }

  // 2. Extração de formato estruturado por metrics (useAvaliacao / Gemini Extraction)
  if (Array.isArray(data.metrics)) {
    const customValues = data.customValues || {};

    const resolveMetricValue = (metric) => {
      if (!metric) return null;
      if (metric.selected === 'custom' && customValues[metric.key] != null) {
        return Number(customValues[metric.key]);
      }
      if (metric.selected === 'adipometry') {
        return Number(metric.adipometryValue ?? metric.biaValue ?? null);
      }
      return Number(metric.biaValue ?? metric.adipometryValue ?? null);
    };

    if (tmb == null) {
      const bmrMetric = data.metrics.find((m) => m.key === 'bmr' || m.key === 'tmb');
      const resolvedTmb = resolveMetricValue(bmrMetric);
      if (resolvedTmb != null && !Number.isNaN(resolvedTmb)) {
        tmb = resolvedTmb;
      }
    }

    if (weight == null) {
      const weightMetric = data.metrics.find((m) => m.key === 'weight' || m.key === 'peso');
      const resolvedWeight = resolveMetricValue(weightMetric);
      if (resolvedWeight != null && !Number.isNaN(resolvedWeight)) {
        weight = resolvedWeight;
      }
    }

    if (bodyFat == null) {
      const fatMetric = data.metrics.find((m) => m.key === 'fatPercentage');
      const resolvedFat = resolveMetricValue(fatMetric);
      if (resolvedFat != null && !Number.isNaN(resolvedFat)) {
        bodyFat = resolvedFat;
      }
    }

    if (leanMass == null) {
      const leanMetric = data.metrics.find((m) => m.key === 'leanMass');
      const resolvedLean = resolveMetricValue(leanMetric);
      if (resolvedLean != null && !Number.isNaN(resolvedLean)) {
        leanMass = resolvedLean;
      }
    }

    if (water == null) {
      const waterMetric = data.metrics.find((m) => m.key === 'totalBodyWater');
      const resolvedWater = resolveMetricValue(waterMetric);
      if (resolvedWater != null && !Number.isNaN(resolvedWater)) {
        water = resolvedWater;
      }
    }
  }

  // 3. Fallbacks em dados de paciente ou campos genéricos
  if (weight == null && data.patient?.weight) {
    const match = String(data.patient.weight).replace(',', '.').match(/[\d.]+/);
    if (match) weight = parseFloat(match[0]);
  }

  if (tmb == null) {
    const rawTmb = data.bmr ?? data.tmb ?? data.taxa_metabolica_basal;
    if (rawTmb != null) tmb = Number(rawTmb);
  }

  if (!tmb || Number.isNaN(tmb)) return null;

  tmb = Math.round(tmb);
  const roundedWeight = weight && !Number.isNaN(weight) ? Number(weight.toFixed(1)) : null;

  // Cálculo de água recomendada: 35ml por kg de peso
  const recommendedWater = roundedWeight ? Math.round(roundedWeight * 35) : (water ? Math.round(water * 1000) : 2500);

  // Formatação amigável da data
  let formattedDate = 'Data não informada';
  const rawDate = evaluation.evaluation_date || evaluation.created_at;
  if (rawDate) {
    const dateObj = new Date(rawDate.length === 10 ? `${rawDate}T12:00:00` : rawDate);
    if (!Number.isNaN(dateObj.getTime())) {
      formattedDate = dateObj.toLocaleDateString('pt-BR');
    }
  }

  return {
    evaluationId: evaluation.id,
    evaluationDate: formattedDate,
    rawDate,
    tmb,
    weight: roundedWeight,
    bodyFat: bodyFat && !Number.isNaN(bodyFat) ? Number(bodyFat.toFixed(1)) : null,
    leanMass: leanMass && !Number.isNaN(leanMass) ? Number(leanMass.toFixed(1)) : null,
    waterRecommended: recommendedWater,
    suggestedScenarios: {
      maintenance: tmb,
      deficitModerate: Math.max(1000, tmb - 350),
      deficitAggressive: Math.max(1000, tmb - 500),
      surplusModerate: tmb + 350,
      surplusAggressive: tmb + 500,
    },
  };
}
