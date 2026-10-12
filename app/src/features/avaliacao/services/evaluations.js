import { requireSupabase } from '../../../shared/services/supabase.js';

export async function createPatientEvaluation({ organizationId, patientId, assessment, notes = '' }) {
  if (!organizationId || !patientId) return null;
  const { data, error } = await requireSupabase().from('physical_evaluations').insert({
    organization_id: organizationId,
    patient_id: patientId,
    evaluation_date: new Date().toISOString().slice(0, 10),
    data: assessment,
    notes: notes || null,
    status: 'completed',
  }).select('id').single();
  if (error) throw new Error(error.message || 'Erro ao salvar avaliação no Supabase');
  return data;
}
