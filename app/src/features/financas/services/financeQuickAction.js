const STORAGE_KEY = 'nutrisa_finance_quick_action';
const FILTER_KEY = 'nutrisa_finance_patient_filter';
const ACTIONS = ['package', 'transaction'];

export function writeFinanceQuickAction(action) {
  if (!ACTIONS.includes(action)) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, action);
  } catch {}
}

export function readFinanceQuickAction() {
  try {
    const action = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    return ACTIONS.includes(action) ? action : null;
  } catch {
    return null;
  }
}

export function writeFinancePatientFilter(patient) {
  if (!patient?.id) return;
  try {
    sessionStorage.setItem(FILTER_KEY, JSON.stringify({
      id: patient.id,
      name: patient.full_name || patient.name || '',
    }));
  } catch {}
}

export function readFinancePatientFilter() {
  try {
    const raw = sessionStorage.getItem(FILTER_KEY);
    sessionStorage.removeItem(FILTER_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.id ? parsed : null;
  } catch {
    return null;
  }
}
