const STORAGE_KEY = 'nutrisa_patient_handoff';
let recentlyConsumed = null;

export function writePatientHandoff(mode, patient) {
  if (!mode || !patient?.id) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      mode,
      id: patient.id,
      name: patient.full_name || patient.name || '',
      phone: patient.whatsapp_phone || patient.phone || '',
    }));
  } catch {}
}

export function consumePatientHandoff(mode) {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return recentlyConsumed?.mode === mode && recentlyConsumed.expiresAt > Date.now()
        ? recentlyConsumed.value
        : null;
    }
    const handoff = JSON.parse(raw);
    if (handoff?.mode !== mode) return null;
    sessionStorage.removeItem(STORAGE_KEY);
    if (!handoff?.id) return null;
    recentlyConsumed = { mode, value: handoff, expiresAt: Date.now() + 250 };
    return handoff;
  } catch {
    return null;
  }
}
