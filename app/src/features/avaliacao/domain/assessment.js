export function emptyAssessment() {
  return { patient: {}, metrics: [], skinfolds: [], circumferences: [], segmental: {}, history: [], aiAnalysisText: '', biaEquipment: '', anthropometricMethod: '' };
}
export function numericValue(value) {
  if (value === null || value === undefined || value === '') return null;
  const result = Number(typeof value === 'string' ? value.replace(',', '.') : value);
  if (!Number.isFinite(result)) throw new Error('O exame contém um valor numérico inválido.');
  return result;
}
export function validateAssessment(value) {
  if (!value || !value.patient || typeof value.patient.name !== 'string' || !value.patient.name.trim()) throw new Error('A IA não identificou o paciente.');
  if (!Array.isArray(value.metrics) || !value.metrics.length) throw new Error('A IA não retornou métricas válidas.');
  const keys = new Set();
  const metrics = value.metrics.map(metric => {
    if (!metric || typeof metric.key !== 'string' || !metric.key || keys.has(metric.key)) throw new Error('Métrica ausente ou duplicada no exame.');
    keys.add(metric.key);
    const biaValue = numericValue(metric.biaValue), adipometryValue = numericValue(metric.adipometryValue);
    return { ...metric, title: String(metric.title || metric.key), unit: String(metric.unit || ''), biaValue, adipometryValue, selected: adipometryValue !== null ? 'adipometry' : 'bia', idealMin: numericValue(metric.idealMin), idealMax: numericValue(metric.idealMax) };
  });
  const measurements = name => {
    if (value[name] == null) return [];
    if (!Array.isArray(value[name])) throw new Error('Formato inválido: ' + name);
    return value[name].map(item => {
      if (!item || typeof item.site !== 'string') throw new Error('Medida sem identificação.');
      return { ...item, value: numericValue(item.value) };
    });
  };
  if (value.history != null && !Array.isArray(value.history)) throw new Error('Histórico inválido.');
  const segmental = {};
  for (const limb of ['rightArm', 'leftArm', 'trunk', 'rightLeg', 'leftLeg']) {
    const item = value.segmental?.[limb];
    segmental[limb] = Object.fromEntries(['leanMass','leanMassRatio','fatMass','fatMassRatio'].map(key => [key,numericValue(item?.[key])]));
  }
  return { ...emptyAssessment(), ...value, metrics, skinfolds: measurements('skinfolds'), circumferences: measurements('circumferences'), segmental,
    history: value.history || [], biaEquipment: String(value.biaEquipment || 'Não informado'), anthropometricMethod: String(value.anthropometricMethod || 'Não informado') };
}
export function selectedValue(metric, custom = {}) {
  if (metric.selected === 'custom') return numericValue(custom[metric.key]);
  return metric.selected === 'adipometry' ? metric.adipometryValue ?? metric.biaValue ?? null : metric.biaValue ?? metric.adipometryValue ?? null;
}
