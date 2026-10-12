import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

function getApiKey() {
  const current = String(process.env.FDC_API_KEY || '').trim();
  if (current) return current;
  try {
    for (const dir of [process.cwd(), path.resolve(process.cwd(), '..')]) {
      const envPath = path.join(dir, '.env');
      if (fs.existsSync(envPath)) {
        const text = fs.readFileSync(envPath, 'utf8');
        const match = text.match(/^\s*FDC_API_KEY\s*=\s*(.+)$/m);
        if (match && match[1]?.trim()) {
          const val = match[1].trim();
          process.env.FDC_API_KEY = val;
          return val;
        }
      }
    }
  } catch {}
  return '';
}

export function isFdcConfigured() {
  return Boolean(getApiKey());
}

function getConfig() {
  const apiKey = getApiKey();
  if (!apiKey) {
    const error = new Error('FoodData Central não configurado: defina FDC_API_KEY no ambiente do servidor.');
    error.status = 503;
    throw error;
  }
  return {
    apiKey,
    baseUrl: String(process.env.FDC_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, ''),
  };
}

const nutrientMap = {
  1008: 'calories',
  1003: 'protein_g',
  1005: 'carbs_g',
  1004: 'fat_g',
  1079: 'fiber_g',
  1093: 'sodium_mg',
};

function nutrient(food, id) {
  const item = (food.foodNutrients || []).find((entry) => Number(entry.nutrientId || entry.nutrient?.id) === id);
  return item?.value == null ? null : Number(item.value);
}

export function mapFdcFoodToCatalog(food) {
  return {
    name: String(food.description || '').trim(),
    item_type: 'alimento',
    food_group: food.foodCategory || 'USDA FoodData Central',
    reference_quantity: 100,
    reference_unit: 'g',
    serving_size: 100,
    serving_unit: 'g',
    calories: nutrient(food, 1008),
    protein_g: nutrient(food, 1003),
    carbs_g: nutrient(food, 1005),
    fat_g: nutrient(food, 1004),
    fiber_g: nutrient(food, 1079),
    sodium_mg: nutrient(food, 1093),
    official_source: 'USDA FoodData Central',
    official_source_code: food.fdcId ? String(food.fdcId) : null,
    source_version: food.dataType || null,
    is_available_for_diets: true,
    is_verified: true,
  };
}

export async function searchFoodDataCentral(query, { pageSize = 25, pageNumber = 1, signal } = {}) {
  const config = getConfig();
  const url = new URL(`${config.baseUrl}/foods/search`);
  url.searchParams.set('api_key', config.apiKey);
  url.searchParams.set('query', String(query || '').trim());
  url.searchParams.set('pageSize', String(Math.min(Math.max(Number(pageSize) || 25, 1), 200)));
  url.searchParams.set('pageNumber', String(Math.max(Number(pageNumber) || 1, 1)));

  let response;
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      response = await fetch(url, { signal });
      if (response.status < 500 && response.status !== 429) break;
    } catch (error) {
      lastError = error;
      if (signal?.aborted) throw error;
    }
  }
  if (!response) throw lastError || new Error('FoodData Central não respondeu.');
  if (!response.ok) {
    const error = new Error(`FoodData Central retornou HTTP ${response.status}.`);
    error.status = response.status;
    throw error;
  }
  const payload = await response.json();
  return {
    totalHits: Number(payload.totalHits || 0),
    foods: (payload.foods || []).map(mapFdcFoodToCatalog),
  };
}

export const FOOD_DATA_CENTRAL_BASE_URL = DEFAULT_BASE_URL;
