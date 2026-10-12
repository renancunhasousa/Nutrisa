import { requireSupabase } from '../../../shared/services/supabase.js';

const TABLES = [
  { type: 'avaliacao', table: 'physical_evaluations', date: 'evaluation_date', select: 'id,patient_id,evaluation_date,status,data,notes,created_at,updated_at' },
  { type: 'anamnese', table: 'anamnese', date: 'created_at', select: 'id,patient_id,status,patient_answers,professional_notes,report,patient_translation,clinic_insights,created_at,updated_at' },
  { type: 'dieta', table: 'plano_alimentar', date: 'updated_at', select: 'id,patient_id,status,content,created_at,updated_at' },
  { type: 'contrato', table: 'contracts', date: 'created_at', select: 'id,patient_id,patient_name,plan,final_content,status,signed_at,created_at,updated_at' },
];

export async function listPatientClinicalRecords(patientId) {
  if (!patientId) return [];
  const supabase = requireSupabase();
  const groups = await Promise.all(TABLES.map(async (config) => {
    const { data, error } = await supabase.from(config.table).select(config.select).eq('patient_id', patientId).order(config.date, { ascending: false }).limit(30);
    if (error) throw new Error(error.message || `Erro ao buscar ${config.type}`);
    return (data || []).map((record) => ({ ...record, recordType: config.type, recordDate: record[config.date] || record.created_at }));
  }));
  return groups.flat().sort((a, b) => new Date(b.recordDate || 0) - new Date(a.recordDate || 0));
}

const OPEN_RECORD_KEY = 'nutrisa_open_clinical_record';
let recentlyOpened = null;
export function writeClinicalRecordHandoff(record) {
  sessionStorage.setItem(OPEN_RECORD_KEY, JSON.stringify(record));
}
export function consumeClinicalRecordHandoff(type) {
  try {
    const value = JSON.parse(sessionStorage.getItem(OPEN_RECORD_KEY) || 'null');
    if (!value || value.recordType !== type) return recentlyOpened?.type === type && recentlyOpened.expiresAt > Date.now() ? recentlyOpened.value : null;
    sessionStorage.removeItem(OPEN_RECORD_KEY);
    recentlyOpened = { type, value, expiresAt: Date.now() + 250 };
    return value;
  } catch { return null; }
}
