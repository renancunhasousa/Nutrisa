import { normalizeConversation } from '../domain/conversations.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../config/env.js';

export async function fetchConversations({ limit = Infinity, startDate, endDate, signal, fetchImpl = fetch,
  url = SUPABASE_URL, key = SUPABASE_ANON_KEY } = {}) {
  if (!url || !key) throw new Error('Configure a conexão com o Supabase.');
  const result = [];
  while (result.length < limit) {
    const pageLimit = Math.min(1000, limit - result.length);
    // Nota: URLSearchParams codifica vírgulas como %2C, o que o PostgREST rejeita com 400.
    // Por isso montamos a query string manualmente preservando a vírgula literal no order.
    let qs = `select=*&order=data_envio.desc,id_mensagem.desc&limit=${pageLimit}&offset=${result.length}`;
    if (startDate) qs += `&data_envio=gte.${encodeURIComponent(startDate)}`;
    if (endDate)   qs += `&data_envio=lte.${encodeURIComponent(endDate)}`;

    let response = await fetchImpl(`${url}/rest/v1/log_conversas?${qs}`, {
      headers: { apikey: key, Authorization: 'Bearer ' + key }, signal,
    });
    if (!response.ok && response.status === 400) {
      let fallbackQs = `select=*&order=data_envio.desc&limit=${pageLimit}&offset=${result.length}`;
      if (startDate) fallbackQs += `&data_envio=gte.${encodeURIComponent(startDate)}`;
      if (endDate)   fallbackQs += `&data_envio=lte.${encodeURIComponent(endDate)}`;
      const fallbackResp = await fetchImpl(`${url}/rest/v1/log_conversas?${fallbackQs}`, {
        headers: { apikey: key, Authorization: 'Bearer ' + key }, signal,
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

