import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../config/env.js';
import { TACO_FOODS } from '../data/tacoFoods.js';

const STORAGE_CUSTOM_FOODS = 'nutrisa_custom_foods_v1';
const STORAGE_FAVORITES = 'nutrisa_favorite_foods_v1';

let memoryCacheFoods = null;

/**
 * Remove acentos e normaliza para busca insensível
 */
export function normalizeText(text = '') {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Carrega a lista completa de alimentos (Supabase + customizados locais + TACO fallback)
 */
export async function loadFoods() {
  if (memoryCacheFoods && memoryCacheFoods.length > 0) {
    return memoryCacheFoods;
  }

  let remoteFoods = [];

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/foods?is_active=eq.true&order=name.asc`, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          remoteFoods = data.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            calories: Number(item.calories) || 0,
            protein: Number(item.protein) || 0,
            carbs: Number(item.carbs) || 0,
            fat: Number(item.fat) || 0,
            fiber: Number(item.fiber) || 0,
            portion_base_grams: Number(item.portion_base_grams) || 100,
            household_measures: Array.isArray(item.household_measures) ? item.household_measures : [],
            source: item.source || 'TACO',
            is_custom: Boolean(item.is_custom),
          }));
        }
      }
    } catch (err) {
      console.warn('Falha ao carregar alimentos do Supabase, usando base local:', err);
    }
  }

  // Alimentos customizados locais salvos pela Dra.
  const localCustomFoods = getLocalCustomFoods();

  // Se o Supabase retornou dados, usa Supabase + locais customizados; se não, usa TACO_FOODS + locais
  const baseList = remoteFoods.length > 0 ? remoteFoods : TACO_FOODS;

  // Mesclar sem duplicatas por ID
  const map = new Map();
  for (const item of baseList) {
    map.set(item.id, item);
  }
  for (const custom of localCustomFoods) {
    map.set(custom.id, custom);
  }

  memoryCacheFoods = Array.from(map.values());
  return memoryCacheFoods;
}

/**
 * Busca alimentos com filtro por termo e categoria
 */
export async function searchFoods({ query = '', category = 'Todas', onlyFavorites = false } = {}) {
  const all = await loadFoods();
  const normQuery = normalizeText(query);
  const favorites = getFavoriteFoodIds();

  return all.filter(food => {
    if (onlyFavorites && !favorites.has(food.id)) {
      return false;
    }

    if (category && category !== 'Todas') {
      if (category === 'Personalizados' && !food.is_custom) return false;
      if (category !== 'Personalizados' && food.category !== category) return false;
    }

    if (!normQuery) return true;

    const normName = normalizeText(food.name);
    const normCat = normalizeText(food.category);
    return normName.includes(normQuery) || normCat.includes(normQuery);
  });
}

/**
 * Salva um novo alimento personalizado criado pela Dra.
 */
export async function createCustomFood(foodData) {
  const newFood = {
    id: 'custom_' + Date.now(),
    name: foodData.name.trim(),
    category: foodData.category || 'Personalizados',
    calories: Number(foodData.calories) || 0,
    protein: Number(foodData.protein) || 0,
    carbs: Number(foodData.carbs) || 0,
    fat: Number(foodData.fat) || 0,
    fiber: Number(foodData.fiber) || 0,
    portion_base_grams: Number(foodData.portion_base_grams) || 100,
    household_measures: Array.isArray(foodData.household_measures) ? foodData.household_measures : [],
    source: 'Personalizado',
    is_custom: true,
  };

  // Salva no localStorage imediatamente
  const customs = getLocalCustomFoods();
  customs.unshift(newFood);
  try {
    localStorage.setItem(STORAGE_CUSTOM_FOODS, JSON.stringify(customs));
  } catch (e) {
    console.error('Erro ao salvar no localStorage:', e);
  }

  // Tenta persistir no Supabase se disponível
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/foods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          name: newFood.name,
          category: newFood.category,
          calories: newFood.calories,
          protein: newFood.protein,
          carbs: newFood.carbs,
          fat: newFood.fat,
          fiber: newFood.fiber,
          portion_base_grams: newFood.portion_base_grams,
          household_measures: newFood.household_measures,
          source: 'Personalizado',
          is_custom: true,
          is_active: true,
        }),
      });

      if (response.ok) {
        const [saved] = await response.json();
        if (saved?.id) {
          newFood.id = saved.id;
        }
      }
    } catch (err) {
      console.warn('Aviso: Alimento salvo localmente mas falhou envio ao Supabase:', err);
    }
  }

  // Atualiza cache em memória
  if (memoryCacheFoods) {
    memoryCacheFoods.unshift(newFood);
  } else {
    memoryCacheFoods = [newFood, ...TACO_FOODS];
  }

  return newFood;
}

/**
 * Gerenciamento de favoritos da Dra.
 */
export function getFavoriteFoodIds() {
  try {
    const raw = localStorage.getItem(STORAGE_FAVORITES);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export function toggleFavoriteFood(foodId) {
  const favs = getFavoriteFoodIds();
  if (favs.has(foodId)) {
    favs.delete(foodId);
  } else {
    favs.add(foodId);
  }
  try {
    localStorage.setItem(STORAGE_FAVORITES, JSON.stringify(Array.from(favs)));
  } catch (e) {
    console.error(e);
  }
  return favs.has(foodId);
}

function getLocalCustomFoods() {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_FOODS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
