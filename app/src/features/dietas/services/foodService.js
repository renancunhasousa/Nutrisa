import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../config/env.js';
import { supabase } from '../../../shared/services/supabase.js';
import { createProduct } from '../../produtos/services/products.js';

const STORAGE_CUSTOM_FOODS = 'nutrisa_custom_foods_v1';
const STORAGE_FAVORITES = 'nutrisa_favorite_foods_v1';

let memoryCacheFoods = null;

export function mapCatalogItemToFood(item) {
  const referenceQuantity = Number(item.reference_quantity || item.serving_size) || 100;
  const referenceUnit = item.reference_unit || item.serving_unit || 'g';
  const measures = Array.isArray(item.household_measures) ? [...item.household_measures] : [];
  if (referenceUnit === 'unidade' && !measures.some((measure) => measure.name?.toLowerCase() === 'unidade')) {
    measures.unshift({ name: 'Unidade', grams: referenceQuantity });
  }
  return {
    id: item.id || (item.official_source_code ? `tbca_${item.official_source_code}` : undefined),
    name: item.name,
    category: item.food_group || ({ preparacao: 'Preparações', produto: 'Produtos', suplemento: 'Suplementos', bebida: 'Bebidas' }[item.item_type] || 'Personalizados'),
    calories: Number(item.calories) || 0,
    protein: Number(item.protein_g) || 0,
    carbs: Number(item.carbs_g) || 0,
    fat: Number(item.fat_g) || 0,
    fiber: Number(item.fiber_g) || 0,
    portion_base_grams: referenceQuantity,
    household_measures: measures,
    source: item.official_source || item.brand || 'Catálogo da clínica',
    official_source_code: item.official_source_code || null,
    source_version: item.source_version || null,
    is_custom: item.organization_id !== null,
    catalog_item_type: item.item_type,
    nutrition_profile_loaded: item.nutrition_profile_loaded !== false,
  };
}

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

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('product_catalog')
        .select('id,organization_id,name,brand,item_type,food_group,reference_quantity,reference_unit,serving_size,serving_unit,calories,protein_g,carbs_g,fat_g,fiber_g,sodium_mg,household_measures,official_source,official_source_code,source_version')
        .eq('verification_status', 'verified')
        .eq('is_available_for_diets', true)
        .is('archived_at', null)
        .order('name');
      if (error) throw error;
      remoteFoods = (data || []).map(mapCatalogItemToFood);
    } catch (err) {
      console.warn('Falha ao carregar o catálogo nutricional, tentando a base legada:', err);
    }
  }

  if (remoteFoods.length === 0 && SUPABASE_URL && SUPABASE_ANON_KEY) {
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

  // A busca Storage usa exclusivamente os alimentos persistidos no Supabase.
  const map = new Map();
  for (const item of remoteFoods) {
    map.set(item.id, item);
  }

  memoryCacheFoods = Array.from(map.values());
  return memoryCacheFoods;
}

let isTbcaDisabled = false;
let isOfficialCacheRpcAvailable = true;
const REMOTE_SEARCH_TIMEOUT_MS = 15_000;

async function fetchWithTimeout(url, { signal, timeoutMs = REMOTE_SEARCH_TIMEOUT_MS } = {}) {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(new DOMException('Tempo limite excedido.', 'TimeoutError')), timeoutMs);
  const combinedSignal = signal
    ? AbortSignal.any([signal, timeoutController.signal])
    : timeoutController.signal;

  try {
    return await fetch(url, { signal: combinedSignal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function cacheOfficialFoods(foods) {
  const cacheable = foods.filter((food) => (
    food.nutrition_profile_loaded !== false
    && food.official_source_code
    && ['TBCA', 'USDA FoodData Central'].includes(food.source)
  ));
  if (cacheable.length === 0) return;

  if (memoryCacheFoods) {
    const existingIds = new Set(memoryCacheFoods.map((food) => food.id));
    memoryCacheFoods = [...cacheable.filter((food) => !existingIds.has(food.id)), ...memoryCacheFoods];
  }
  if (!supabase || !isOfficialCacheRpcAvailable) return;

  const payload = cacheable.map((food) => ({
    name: food.name,
    food_group: food.category,
    calories: food.calories,
    protein_g: food.protein,
    carbs_g: food.carbs,
    fat_g: food.fat,
    fiber_g: food.fiber,
    sodium_mg: food.sodium_mg ?? null,
    official_source: food.source,
    official_source_code: food.official_source_code,
    source_version: food.source_version || null,
  }));
  const { error } = await supabase.rpc('cache_official_foods', { p_foods: payload });
  if (error) {
    if (error.code === 'PGRST202' || /cache_official_foods|schema cache/i.test(error.message || '')) {
      isOfficialCacheRpcAvailable = false;
      console.info('Cache permanente de alimentos aguardando a migração do Supabase.');
      return;
    }
    console.warn('Não foi possível salvar o cache de alimentos oficiais:', error);
  }
}

/**
 * Busca alimentos com filtro por termo e categoria
 */
export async function searchFoods({
  query = '',
  category = 'Todas',
  onlyFavorites = false,
  source = 'storage',
  signal,
  onLocalResults,
  onRemoteMeta,
  page = 1,
} = {}) {
  const all = await loadFoods();
  const normQuery = normalizeText(query);
  const favorites = getFavoriteFoodIds();

  const localResults = all.filter(food => {
    if (source === 'tbca' && food.source !== 'TBCA') return false;
    if (source === 'fdc' && food.source !== 'USDA FoodData Central') return false;
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

  // Complementa a TACO/catálogo local com TBCA e USDA somente quando há uma busca textual.
  // O alimento só é persistido no catálogo quando o usuário o selecionar/cadastrar.
  if (normQuery.length >= 2 && !onlyFavorites && category === 'Todas' && source !== 'storage') {
    if (page === 1) onLocalResults?.(localResults.slice(0, 50));
    const cachedSourceCounts = localResults.reduce((counts, food) => {
      counts.set(food.source, (counts.get(food.source) || 0) + 1);
      return counts;
    }, new Map());
    const requestedSources = source === 'todas'
      ? (isTbcaDisabled ? ['fdc'] : ['tbca', 'fdc'])
      : [source];
    const sources = page > 1 ? requestedSources : requestedSources.filter((remoteSource) => (
      remoteSource === 'tbca'
        ? (cachedSourceCounts.get('TBCA') || 0) < 8
        : (cachedSourceCounts.get('USDA FoodData Central') || 0) < 8
    ));
    if (sources.length === 0) return localResults.slice(0, 50);

    const remoteResults = await Promise.allSettled(sources.map(async (remoteSource) => {
      try {
        const response = await fetchWithTimeout(
          `/api/products?source=${remoteSource}&query=${encodeURIComponent(query)}&page=${page}`,
          { signal, timeoutMs: remoteSource === 'tbca' ? 30_000 : REMOTE_SEARCH_TIMEOUT_MS },
        );
        if (response.status === 503 && remoteSource === 'tbca') {
          // Se a TBCA não estiver configurada no backend (.env), evita retentativas na busca combinada
          isTbcaDisabled = true;
          return [];
        }
        if (!response.ok) return [];
        const payload = await response.json();
        onRemoteMeta?.(remoteSource, { page: payload.page || page, hasMore: Boolean(payload.hasMore) });
        if (payload?.notConfigured && remoteSource === 'tbca') {
          isTbcaDisabled = true;
          return [];
        }
        return (payload.foods || []).map((food) => {
          const mappedFood = mapCatalogItemToFood({ ...food, organization_id: null });
          return {
            ...mappedFood,
            id: mappedFood.id || `${remoteSource}_${food.official_source_code || food.official_code || normalizeText(food.name).replace(/\s+/g, '_')}`,
            source: mappedFood.source || (remoteSource === 'tbca' ? 'TBCA' : 'USDA FoodData Central'),
            is_custom: false,
            official_source_code: food.official_source_code || food.official_code || null,
            source_version: food.source_version || food.official_version || null,
          };
        });
      } catch (err) {
        if (err?.name === 'AbortError') return [];
        return [];
      }
    }));
    const remoteFoods = remoteResults.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
    await cacheOfficialFoods(remoteFoods);
    const existing = new Set(localResults.map((food) => normalizeText(food.name)));
    return [...localResults, ...remoteFoods.filter((food) => !existing.has(normalizeText(food.name)))].slice(0, 50);
  }

  return localResults;
}

export async function loadTbcaFoodProfile(food, { signal } = {}) {
  if (!food?.tbca_detail_id || food.nutrition_profile_loaded !== false) return food;
  const response = await fetchWithTimeout(
    `/api/products?source=tbca&query=${encodeURIComponent(food.name)}&detailId=${encodeURIComponent(food.tbca_detail_id)}`,
    { signal, timeoutMs: 30_000 },
  );
  if (!response.ok) throw new Error('Não foi possível carregar o perfil nutricional da TBCA.');
  const payload = await response.json();
  return {
    ...mapCatalogItemToFood({ ...payload.food, organization_id: null }),
    id: food.id,
    nutrition_profile_loaded: true,
  };
}

/**
 * Salva um novo alimento personalizado criado pela Dra.
 */
export async function createCustomFood(foodData, { organizationId, userId } = {}) {
  if (organizationId && userId) {
    const savedItem = await createProduct(organizationId, userId, {
      name: foodData.name,
      category: foodData.item_type || 'alimento',
      item_type: foodData.item_type || 'alimento',
      food_group: foodData.category || 'Personalizados',
      preparation_method: foodData.preparation_method || null,
      video_url: foodData.video_url || null,
      reference_quantity: Number(foodData.portion_base_grams) || 100,
      reference_unit: 'g',
      serving_size: Number(foodData.portion_base_grams) || 100,
      serving_unit: 'g',
      calories: Number(foodData.calories) || 0,
      protein_g: Number(foodData.protein) || 0,
      carbs_g: Number(foodData.carbs) || 0,
      fat_g: Number(foodData.fat) || 0,
      fiber_g: Number(foodData.fiber) || null,
      nutrition_facts: foodData.nutrition_facts || [],
      household_measures: foodData.household_measures || [],
      official_source: 'Cadastro da clínica',
      source_type: 'manual',
      verification_status: 'verified',
      is_available_for_diets: true,
      source_urls: [],
    });
    const catalogFood = mapCatalogItemToFood(savedItem);
    memoryCacheFoods = memoryCacheFoods
      ? [catalogFood, ...memoryCacheFoods.filter((food) => food.id !== catalogFood.id)]
      : null;
    return catalogFood;
  }

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
    memoryCacheFoods = [newFood];
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
