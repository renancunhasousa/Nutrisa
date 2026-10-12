import { requireSupabase } from '../../../shared/services/supabase.js';

export async function createRemoteContract({ organizationId, patientId, patientName, plan, finalContent }) {
  const { data, error } = await requireSupabase().from('contracts').insert({
    organization_id: organizationId,
    patient_id: patientId || null,
    patient_name: patientName,
    plan,
    final_content: finalContent,
    status: 'pending',
  }).select('id,public_token,status').single();
  if (error) throw new Error(error.message || 'Erro ao criar contrato no Supabase');
  return data;
}

export async function getRemoteContract(id) {
  const { data, error } = await requireSupabase().from('contracts').select('*').eq('id', id).single();
  if (error) throw new Error(error.message || 'Erro ao buscar contrato no Supabase');
  return data;
}

export async function getPublicContract(token) {
  const { data, error } = await requireSupabase().rpc('get_contract_for_signature', { p_token: token });
  if (error) throw new Error(error.message || 'Erro ao buscar contrato no Supabase');
  return data?.[0] ?? null;
}

export async function signRemoteContract(token, signatureBase64) {
  const { data, error } = await requireSupabase().rpc('sign_contract', {
    p_token: token,
    p_signature_base64: signatureBase64,
  });
  if (error) throw new Error(error.message || 'Erro ao salvar assinatura no Supabase');
  if (!data) throw new Error('Este contrato já foi assinado ou não está disponível.');
  return true;
}
