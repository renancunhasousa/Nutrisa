export function normalizePatientPhone(value) {
  const digits = String(value || '').replace(/@.*$/, '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
}

export function findPatientsInListByPhone(patients, phone) {
  const normalized = normalizePatientPhone(phone);
  if (!normalized) return [];
  return patients.filter((patient) => [patient.whatsapp_phone, patient.phone]
    .some((value) => normalizePatientPhone(value) === normalized));
}

export function findPatientInListByPhone(patients, phone) {
  const matches = findPatientsInListByPhone(patients, phone);
  return matches.length === 1 ? matches[0] : null;
}
