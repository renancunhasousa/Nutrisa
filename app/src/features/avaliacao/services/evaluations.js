import { requireSupabase } from '../../../shared/services/supabase.js';

export async function createPatientEvaluation({ id, organizationId, patientId, assessment, notes = '' }) {
  if (!organizationId || !patientId) return null;
  const payload = {
    organization_id: organizationId,
    patient_id: patientId,
    evaluation_date: new Date().toISOString().slice(0, 10),
    data: assessment,
    notes: notes || null,
    status: 'completed',
  };
  const query = id
    ? requireSupabase().from('physical_evaluations').update(payload).eq('id', id)
    : requireSupabase().from('physical_evaluations').insert(payload);
  const { data, error } = await query.select('id').single();
  if (error) throw new Error(error.message || 'Erro ao salvar avaliação no Supabase');
  return data;
}
