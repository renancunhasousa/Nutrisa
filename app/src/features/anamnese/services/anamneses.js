import { requireSupabase } from '../../../shared/services/supabase.js';

export async function createPatientAnamnese({
  organizationId,
  patientId,
  patientAnswers,
  professionalNotes,
  report,
  patientTranslation = '',
  clinicInsights = '',
}) {
  if (!organizationId || !patientId) return null;
  const { data, error } = await requireSupabase().from('anamnese').insert({
    organization_id: organizationId,
    patient_id: patientId,
    patient_answers: patientAnswers || '',
    professional_notes: professionalNotes || '',
    report: report || '',
    patient_translation: patientTranslation || '',
    clinic_insights: clinicInsights || '',
    status: 'completed',
  }).select('id').single();
  if (error) throw new Error(error.message || 'Erro ao salvar anamnese no Supabase');
  return data;
}

export async function updatePatientAnamnese(id, updates) {
  if (!id) return null;
  const { data, error } = await requireSupabase().from('anamnese')
    .update(updates)
    .eq('id', id)
    .select('id')
    .single();
  if (error) throw new Error(error.message || 'Erro ao atualizar anamnese no Supabase');
  return data;
}
