// Lightweight client for Supabase REST API (PostgREST)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://tauzwcmefnapmdewuysg.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhdXp3Y21lZm5hcG1kZXd1eXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NzI1MDEsImV4cCI6MjA4NTA0ODUwMX0.1ON8SE83KcSLnRgdzFeHRMTt2M-BvPIR2p8f0gKCYaY';

/**
 * Busca os registros da tabela log_conversas
 * @param {Object} options
 * @param {number} options.limit Limite de registros (padrão 1000)
 * @param {string} [options.startDate] Data inicial ISO
 * @param {string} [options.endDate] Data final ISO
 * @returns {Promise<Array>}
 */
export async function fetchConversations({ limit = 1000, startDate, endDate } = {}) {
  try {
    let url = `${SUPABASE_URL}/rest/v1/log_conversas?select=*&order=data_envio.desc&limit=${limit}`;

    if (startDate) {
      url += `&data_envio=gte.${encodeURIComponent(startDate)}`;
    }
    if (endDate) {
      url += `&data_envio=lte.${encodeURIComponent(endDate)}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao consultar Supabase: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Erro no fetchConversations:', error);
    throw error;
  }
}
