import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../config/env.js';
import { sanitizeMealPlan } from '../domain/dietValidators.js';

const STORAGE_DIETS_LIST = 'nutrisa_saved_diets_v1';
const STORAGE_CURRENT_DRAFT = 'nutrisa_diet_draft_v1';

/**
 * Salva ou atualiza um plano alimentar
 */
export async function saveDietPlan(plan) {
  const sanitized = sanitizeMealPlan(plan);

  // 1. Salvar localmente em cache
  saveLocalDiet(sanitized);

  // 2. Persistir no Supabase se configurado
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const payload = {
        id: sanitized.id,
        patient_id: sanitized.patient_id || null,
        title: sanitized.title,
        description: `${sanitized.objective} • ${sanitized.target_calories} kcal`,
        status: sanitized.status || 'rascunho',
        content: sanitized,
        updated_at: new Date().toISOString(),
      };

      const response = await fetch(`${SUPABASE_URL}/rest/v1/plano_alimentar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('Erro ao sincronizar plano com Supabase:', errorText);
      }
    } catch (err) {
      console.warn('Falha na requisição ao Supabase para plano alimentar:', err);
    }
  }

  return sanitized;
}

/**
 * Lista todos os planos alimentares
 */
export async function listDietPlans() {
  const localList = getLocalDiets();

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/plano_alimentar?select=*&order=updated_at.desc`, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });

      if (response.ok) {
        const remoteData = await response.json();
        if (Array.isArray(remoteData) && remoteData.length > 0) {
          const map = new Map();
          // Coloca locais primeiro
          localList.forEach(p => map.set(p.id, p));
          // Sobrescreve com remotos
          remoteData.forEach(row => {
            const plan = row.content || {
              id: row.id,
              title: row.title,
              patient_id: row.patient_id,
              status: row.status,
              created_at: row.created_at,
              updated_at: row.updated_at,
            };
            map.set(row.id, sanitizeMealPlan(plan));
          });
          return Array.from(map.values()).sort(
            (a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0)
          );
        }
      }
    } catch (err) {
      console.warn('Falha ao listar planos do Supabase, retornando locais:', err);
    }
  }

  return localList.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
}

/**
 * Recupera um plano específico por ID
 */
export async function getDietPlan(id) {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/plano_alimentar?id=eq.${id}&select=*`, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });

      if (response.ok) {
        const rows = await response.json();
        if (rows?.[0]?.content) {
          return sanitizeMealPlan(rows[0].content);
        }
      }
    } catch (err) {
      console.warn('Erro ao buscar plano no Supabase:', err);
    }
  }

  const locals = getLocalDiets();
  const found = locals.find(p => p.id === id);
  return found ? sanitizeMealPlan(found) : null;
}

/**
 * Remove um plano alimentar
 */
export async function deleteDietPlan(id) {
  // Remover do local
  const locals = getLocalDiets().filter(p => p.id !== id);
  try {
    localStorage.setItem(STORAGE_DIETS_LIST, JSON.stringify(locals));
  } catch (e) {
    console.error(e);
  }

  // Remover do Supabase
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/plano_alimentar?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });
    } catch (err) {
      console.warn('Erro ao excluir no Supabase:', err);
    }
  }

  return true;
}

/**
 * Duplica um plano alimentar para servir de base para outro paciente ou nova versão
 */
export function duplicateDietPlan(originalPlan) {
  const newPlan = JSON.parse(JSON.stringify(originalPlan));
  newPlan.id = 'plan_' + Date.now();
  newPlan.title = `${originalPlan.title} (Cópia)`;
  newPlan.status = 'rascunho';
  newPlan.version = 1;
  newPlan.created_at = new Date().toISOString();
  newPlan.updated_at = new Date().toISOString();
  return sanitizeMealPlan(newPlan);
}

/**
 * Rascunho ativo temporário (auto-save da sessão)
 */
export function saveCurrentDraft(plan) {
  try {
    localStorage.setItem(STORAGE_CURRENT_DRAFT, JSON.stringify(plan));
  } catch (e) {
    console.error(e);
  }
}

export function loadCurrentDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_CURRENT_DRAFT);
    return raw ? sanitizeMealPlan(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function getLocalDiets() {
  try {
    const raw = localStorage.getItem(STORAGE_DIETS_LIST);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalDiet(plan) {
  const list = getLocalDiets();
  const idx = list.findIndex(p => p.id === plan.id);
  if (idx >= 0) {
    list[idx] = plan;
  } else {
    list.unshift(plan);
  }
  try {
    localStorage.setItem(STORAGE_DIETS_LIST, JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }
}
