import { supabase } from '../../../shared/services/supabase.js';

const STORAGE_KEY = (orgId) => `nutrisa_crm_ai_insight_${orgId || 'default'}`;

export async function loadLatestCommercialInsight(organizationId) {
  let localData = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY(organizationId));
    if (raw) localData = JSON.parse(raw);
  } catch (err) {
    console.error('Falha ao ler insight do localStorage:', err);
  }

  if (!supabase || !organizationId) return localData;

  try {
    const { data, error } = await supabase
      .from('crm_commercial_insights')
      .select('insight, model_used, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data?.insight) {
      const cloudData = {
        insight: data.insight,
        modelUsed: data.model_used,
        createdAt: data.created_at,
      };
      // Atualiza o cache local
      try {
        localStorage.setItem(STORAGE_KEY(organizationId), JSON.stringify(cloudData));
      } catch {}
      return cloudData;
    }
  } catch (err) {
    console.warn('Falha ao buscar insight da nuvem:', err.message);
  }

  return localData;
}

export async function persistCommercialInsight({ organizationId, insight, modelUsed }) {
  const payload = {
    insight,
    modelUsed,
    createdAt: new Date().toISOString(),
  };

  // 1. Salva localmente de imediato
  try {
    localStorage.setItem(STORAGE_KEY(organizationId), JSON.stringify(payload));
  } catch (err) {
    console.error('Falha ao salvar insight no localStorage:', err);
  }

  // 2. Persiste no Supabase em segundo plano
  if (supabase && organizationId) {
    try {
      await supabase.from('crm_commercial_insights').insert({
        organization_id: organizationId,
        insight,
        model_used: modelUsed,
      });
    } catch (err) {
      console.warn('Falha ao salvar insight no Supabase:', err.message);
    }
  }

  return payload;
}
