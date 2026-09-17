import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../config/env.js';

export async function createRemoteContract({ patientName, plan, finalContent }) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase não configurado');

  const response = await fetch(`${SUPABASE_URL}/rest/v1/contracts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: 'return=representation'
    },
    body: JSON.stringify({
      patient_name: patientName,
      plan: plan,
      final_content: finalContent,
      status: 'pending'
    })
  });

  if (!response.ok) throw new Error('Erro ao criar contrato no Supabase');
  const data = await response.json();
  return data[0];
}

export async function getRemoteContract(id) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase não configurado');

  const response = await fetch(`${SUPABASE_URL}/rest/v1/contracts?id=eq.${id}&select=*`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    }
  });

  if (!response.ok) throw new Error('Erro ao buscar contrato no Supabase');
  const data = await response.json();
  return data[0];
}

export async function signRemoteContract(id, signatureBase64) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase não configurado');

  const response = await fetch(`${SUPABASE_URL}/rest/v1/contracts?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: 'return=representation'
    },
    body: JSON.stringify({
      signature_base64: signatureBase64,
      status: 'signed'
    })
  });

  if (!response.ok) throw new Error('Erro ao salvar assinatura no Supabase');
  const data = await response.json();
  return data[0];
}
