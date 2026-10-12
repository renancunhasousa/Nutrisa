import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_BASE_URL = 'https://api.parse.bot/scraper/f3f96c01-69e8-48d9-8e26-b6765980f9d6';
const SEARCH_PAGE_SIZE = 8;
const listingCache = new Map();

function getApiKey() {
  const current = String(process.env.TBCA_PARSE_API_KEY || '').trim();
  if (current) return current;
  try {
    for (const dir of [process.cwd(), path.resolve(process.cwd(), '..')]) {
      const envPath = path.join(dir, '.env');
      if (fs.existsSync(envPath)) {
        const text = fs.readFileSync(envPath, 'utf8');
        const match = text.match(/^\s*TBCA_PARSE_API_KEY\s*=\s*(.+)$/m);
        if (match && match[1]?.trim()) {
          const val = match[1].trim();
          process.env.TBCA_PARSE_API_KEY = val;
          return val;
        }
      }
    }
  } catch {}
  return '';
}

export function isTbcaConfigured() {
  return Boolean(getApiKey());
}

function getConfig() {
  const apiKey = getApiKey();
  if (!apiKey) {
    const error = new Error('TBCA não configurada: defina TBCA_PARSE_API_KEY no ambiente do servidor.');
    error.status = 503;
    throw error;
  }
  return {
    apiKey,
    baseUrl: String(process.env.TBCA_PARSE_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, ''),
  };
}

function number(value) {
  if (value == null || value === '') return null;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function findNutrient(nutrients, names, units = []) {
  const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const normalizedNames = names.map(normalize);
  const matching = (nutrients || []).filter((entry) => normalizedNames.some((name) => normalize(entry.component).includes(name)));
  const item = units.length > 0
    ? matching.find((entry) => units.includes(String(entry.units || entry.unit || '').toLowerCase()))
    : matching[0];
  return number(item?.value_per_100g ?? item?.value);
}

function decodeHtml(value = '') {
  return String(value)
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .trim();
}

async function getOfficialTbcaProfile(detailId, food = {}, signal) {
  const normalizedDetailId = String(detailId || '').replace(/^\?/, '');
  const url = `https://www.tbca.net.br/base-dados/int_composicao_alimentos.php?${normalizedDetailId}`;
  const response = await fetch(url, {
    signal,
    headers: { 'User-Agent': 'NutrIsa/1.0 (nutrition data lookup)' },
  });
  if (!response.ok) throw new Error(`Site oficial da TBCA retornou HTTP ${response.status}.`);
  const html = await response.text();
  const table = html.match(/<table[^>]+id=['"]tabela1['"][^>]*>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/i)?.[1] || '';
  const nutrients = Array.from(table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)).map((row) => {
    const cells = Array.from(row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi), (cell) => decodeHtml(cell[1]));
    return { component: cells[0], units: cells[1], value_per_100g: cells[2] };
  }).filter((entry) => entry.component && entry.units);
  if (nutrients.length === 0) throw new Error('A página oficial da TBCA não retornou a tabela nutricional.');
  return {
    ...mapTbcaFoodToCatalog(food, { nutrients }),
    source_version: 'TBCA oficial',
  };
}

async function listOfficialTbcaFoods(query, signal) {
  const url = new URL('https://www.tbca.net.br/base-dados/composicao_alimentos.php');
  url.searchParams.set('produto', query);
  const response = await fetch(url, {
    signal,
    headers: { 'User-Agent': 'NutrIsa/1.0 (nutrition data lookup)' },
  });
  if (!response.ok) throw new Error(`Busca oficial da TBCA retornou HTTP ${response.status}.`);
  const html = await response.text();
  const table = html.match(/<table[^>]+class=['"][^'"]*table-striped[^'"]*['"][^>]*>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/i)?.[1] || '';
  const foods = Array.from(table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)).map((row) => {
    const cells = Array.from(row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi), (cell) => decodeHtml(cell[1]));
    const href = row[1].match(/href=['"]int_composicao_alimentos\.php\?([^'"]+)['"]/i)?.[1];
    return { code: cells[0], name: cells[1], scientific_name: cells[2], group: cells[3], brand: cells[4], detail_id: href };
  }).filter((food) => food.code && food.name && food.detail_id);
  return { data: { foods, total_pages: 1 } };
}

async function getProfileWithFallback(food, signal) {
  try {
    return await getOfficialTbcaProfile(food.detail_id, food, signal);
  } catch (error) {
    if (signal?.aborted) throw error;
    const timeoutSignal = AbortSignal.timeout(8_000);
    const parseSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
    const profilePayload = await call('get_food_nutritional_profile', { detail_id: food.detail_id }, parseSignal);
    return mapTbcaFoodToCatalog(food, profilePayload?.data || profilePayload);
  }
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      try {
        results[index] = { status: 'fulfilled', value: await mapper(items[index], index) };
      } catch (reason) {
        results[index] = { status: 'rejected', reason };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

export function mapTbcaFoodToCatalog(food, profile = null) {
  const metadata = profile?.metadata || {};
  const nutrients = profile?.nutrients || [];
  return {
    name: String(metadata.nome || metadata.name || food.name || '').trim(),
    item_type: 'alimento',
    food_group: metadata.grupo || food.group || 'TBCA',
    reference_quantity: 100,
    reference_unit: 'g',
    serving_size: 100,
    serving_unit: 'g',
    calories: findNutrient(nutrients, ['energia', 'energy'], ['kcal']),
    protein_g: findNutrient(nutrients, ['proteína', 'proteina', 'protein']),
    carbs_g: findNutrient(nutrients, ['carboidrato', 'carbohydrate']),
    fat_g: findNutrient(nutrients, ['lipid', 'gordura', 'fat']),
    fiber_g: findNutrient(nutrients, ['fibra', 'fiber']),
    sodium_mg: findNutrient(nutrients, ['sódio', 'sodio', 'sodium']),
    official_source: 'TBCA',
    official_source_code: food.code || metadata.código || metadata.codigo || null,
    tbca_detail_id: food.detail_id || null,
    source_version: 'TBCA via Parse API',
    is_available_for_diets: true,
    is_verified: true,
    source_notes: 'Importado sob demanda; revisar antes de disponibilizar em dietas.',
  };
}

async function call(endpoint, params, signal) {
  const config = getConfig();
  const url = new URL(`${config.baseUrl}/${endpoint}`);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });
  const response = await fetch(url, { headers: { 'X-API-Key': config.apiKey }, signal });
  if (!response.ok) {
    const error = new Error(`TBCA Parse retornou HTTP ${response.status}.`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export async function searchTbca(query, { page = 1, signal } = {}) {
  const normalizedQuery = String(query || '').trim();
  const officialQuery = normalizedQuery.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const requestedPage = Math.max(Number(page) || 1, 1);
  const offset = (requestedPage - 1) * SEARCH_PAGE_SIZE;
  const providerPage = Math.floor(offset / 100) + 1;
  const cacheKey = `${normalizedQuery.toLowerCase()}::${providerPage}`;
  const cached = listingCache.get(cacheKey);
  let payload = cached && cached.expiresAt > Date.now() ? cached.payload : null;
  if (!payload) {
    try {
      payload = await listOfficialTbcaFoods(officialQuery, signal);
    } catch (error) {
      if (signal?.aborted) throw error;
      payload = await call('list_foods', { page: providerPage, query: normalizedQuery }, signal);
    }
  }
  if (!cached || cached.expiresAt <= Date.now()) {
    listingCache.set(cacheKey, { payload, expiresAt: Date.now() + 5 * 60_000 });
  }
  const data = payload?.data || payload;
  const providerFoods = data?.foods || [];
  const localOffset = offset % 100;
  const foods = providerFoods.slice(localOffset, localOffset + SEARCH_PAGE_SIZE);
  // A listagem não contém nutrientes. Busca os oito perfis na página oficial
  // com no máximo quatro requisições simultâneas.
  const profiles = await mapWithConcurrency(foods, 4, async (food) => {
    if (!food.detail_id) return mapTbcaFoodToCatalog(food);
    return getProfileWithFallback(food, signal);
  });
  const enrichedFoods = foods.map((food, index) => {
    const profile = profiles[index];
    if (profile?.status === 'fulfilled') return profile.value;
    return { ...mapTbcaFoodToCatalog(food), nutrition_profile_loaded: false };
  });
  return {
    totalPages: Number(data?.total_pages || 0),
    foods: enrichedFoods,
    page: requestedPage,
    hasMore: localOffset + SEARCH_PAGE_SIZE < providerFoods.length || providerPage < Number(data?.total_pages || 0),
  };
}

export async function getTbcaFoodProfile(detailId, { signal } = {}) {
  return getProfileWithFallback({ detail_id: detailId }, signal);
}

export const TBCA_PARSE_BASE_URL = DEFAULT_BASE_URL;
