import { normalizeConversation } from '../domain/conversations.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../config/env.js';
import { supabase } from '../../../shared/services/supabase.js';

export async function fetchConversations({ limit = Infinity, startDate, endDate, signal, fetchImpl = fetch,
  url = SUPABASE_URL, key = SUPABASE_ANON_KEY } = {}) {
  if (!url || !key) throw new Error('Configure a conexão com o Supabase.');
  const { data: { session } = {} } = supabase ? await supabase.auth.getSession() : { data: {} };
  const accessToken = session?.access_token || key;
  const result = [];
  while (result.length < limit) {
    const pageLimit = Math.min(1000, limit - result.length);
    // Nota: URLSearchParams codifica vírgulas como %2C, o que o PostgREST rejeita com 400.
    // Por isso montamos a query string manualmente preservando a vírgula literal no order.
    let qs = `select=*&order=data_envio.desc,id_mensagem.desc&limit=${pageLimit}&offset=${result.length}`;
    if (startDate) qs += `&data_envio=gte.${encodeURIComponent(startDate)}`;
    if (endDate)   qs += `&data_envio=lte.${encodeURIComponent(endDate)}`;

    let response = await fetchImpl(`${url}/rest/v1/log_conversas?${qs}`, {
      headers: { apikey: key, Authorization: 'Bearer ' + accessToken }, signal,
    });
    if (!response.ok && response.status === 400) {
      let fallbackQs = `select=*&order=data_envio.desc&limit=${pageLimit}&offset=${result.length}`;
      if (startDate) fallbackQs += `&data_envio=gte.${encodeURIComponent(startDate)}`;
      if (endDate)   fallbackQs += `&data_envio=lte.${encodeURIComponent(endDate)}`;
      const fallbackResp = await fetchImpl(`${url}/rest/v1/log_conversas?${fallbackQs}`, {
        headers: { apikey: key, Authorization: 'Bearer ' + accessToken }, signal,
      });
      if (fallbackResp.ok) response = fallbackResp;
    }
    if (!response.ok) throw new Error('Erro ao consultar conversas: ' + response.status);
    const page = await response.json();
    if (!Array.isArray(page)) throw new Error('Resposta inválida do banco de dados.');
    if (!page.length) break;
    result.push(...page.map(normalizeConversation));
    if (result.length >= 100_000 && result.length < limit) throw new Error('Histórico muito grande. Consulte um período menor.');
  }
  return result;
}

const normalizePhone = (value) => String(value || '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');

export async function linkConversationsToPatient({ organizationId, patientId, phone }) {
  const normalizedPhone = normalizePhone(phone);
  if (!supabase || !organizationId || !patientId || !normalizedPhone) return 0;

  const { data, error } = await supabase
    .from('log_conversas')
    .select('id_mensagem,contato_jid')
    .eq('organization_id', organizationId)
    .is('patient_id', null)
    .limit(5000);
  if (error) throw error;

  const messageIds = (data || [])
    .filter((row) => normalizePhone(row.contato_jid) === normalizedPhone)
    .map((row) => row.id_mensagem)
    .filter(Boolean);

  for (let index = 0; index < messageIds.length; index += 200) {
    const { error: updateError } = await supabase
      .from('log_conversas')
      .update({ patient_id: patientId })
      .eq('organization_id', organizationId)
      .in('id_mensagem', messageIds.slice(index, index + 200));
    if (updateError) throw updateError;
  }
  return messageIds.length;
}
