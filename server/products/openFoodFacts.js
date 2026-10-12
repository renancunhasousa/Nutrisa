const OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.org/api/v2/product';
const OPEN_FOOD_FACTS_PRODUCT = 'https://world.openfoodfacts.org/product';
const PRODUCT_FIELDS = [
  'code', 'product_name', 'product_name_pt', 'generic_name', 'brands', 'categories',
  'categories_tags', 'quantity', 'serving_size', 'nutrition_data_per', 'product_quantity_unit', 'nutriments',
  'ingredients_text', 'ingredients_text_pt', 'allergens', 'allergens_from_ingredients',
  'image_front_url', 'image_nutrition_url',
].join(',');

const CORE_NUTRIENTS = new Set(['energy-kcal', 'proteins', 'carbohydrates', 'fat', 'fiber', 'sodium']);
const EXTRA_NUTRIENTS = [
  ['sugars', 'Açúcares totais'],
  ['added-sugars', 'Açúcares adicionados'],
  ['saturated-fat', 'Gorduras saturadas'],
  ['trans-fat', 'Gorduras trans'],
  ['salt', 'Sal'],
  ['calcium', 'Cálcio'],
  ['iron', 'Ferro'],
  ['potassium', 'Potássio'],
];

export function normalizeBarcode(value) {
  const barcode = String(value || '').replace(/\D/g, '');
  if (barcode.length < 7 || barcode.length > 14) {
    const error = new Error('Informe um código de barras válido, com 7 a 14 dígitos.');
    error.status = 400;
    throw error;
  }
  return barcode;
}

function asNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function parseServingSize(value, fallbackBasis, fallbackUnit = 'g') {
  const matches = [...String(value || '').replace(',', '.').matchAll(/([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Zµ]+)?/g)];
  const match = [...matches].reverse().find((item) => /^(g|kg|mg|ml|l)$/i.test(item[2] || '')) || matches[0];
  if (match) return { size: Number(match[1]), unit: (match[2] || 'g').toLowerCase() };
  return fallbackBasis === 'serving' ? { size: null, unit: null } : { size: 100, unit: fallbackUnit };
}

function nutrientValue(nutriments, key, basis) {
  const suffix = basis === 'serving' ? '_serving' : '_100g';
  return asNumber(nutriments[`${key}${suffix}`] ?? nutriments[key]);
}

function nutrientUnit(nutriments, key) {
  return String(nutriments[`${key}_unit`] || (key === 'energy-kcal' ? 'kcal' : 'g')).trim();
}

function toMilligrams(value, unit) {
  if (value === null) return null;
  const normalizedUnit = unit.toLowerCase();
  if (normalizedUnit === 'kg') return value * 1_000_000;
  if (normalizedUnit === 'g') return value * 1_000;
  if (normalizedUnit === 'µg' || normalizedUnit === 'ug') return value / 1_000;
  return value;
}

function inferCategory(product) {
  const haystack = [product.categories, ...(product.categories_tags || [])].join(' ').toLocaleLowerCase('pt-BR');
  if (/supplement|suplement|protein powder|whey|creatine|creatina/.test(haystack)) return 'suplemento';
  if (/beverage|drink|bebida|juice|suco|refrigerante|water|água/.test(haystack)) return 'bebida';
  return 'alimento';
}

function mapExtraNutrients(nutriments, basis) {
  return EXTRA_NUTRIENTS.flatMap(([key, name]) => {
    if (CORE_NUTRIENTS.has(key)) return [];
    const amount = nutrientValue(nutriments, key, basis);
    if (amount === null) return [];
    return [{ name, amount, unit: nutrientUnit(nutriments, key) }];
  });
}

export function mapOpenFoodFactsResponse(payload, requestedBarcode) {
  const product = payload?.product;
  const found = payload?.status === 1 || payload?.status === 'success' || payload?.result?.id === 'product_found';
  if (!found || !product) return null;

  const barcode = normalizeBarcode(product.code || requestedBarcode);
  const nutriments = product.nutriments || {};
  const hasServingValues = ['energy-kcal', 'proteins', 'carbohydrates', 'fat']
    .some((key) => asNumber(nutriments[`${key}_serving`]) !== null);
  const basis = hasServingValues ? 'serving' : '100g';
  const fallbackUnit = product.nutrition_data_per === '100ml' || product.product_quantity_unit === 'ml' ? 'ml' : 'g';
  const serving = parseServingSize(product.serving_size, basis, fallbackUnit);
  const sodiumValue = nutrientValue(nutriments, 'sodium', basis);
  const sodiumUnit = nutrientUnit(nutriments, 'sodium');
  const sourceUrl = `${OPEN_FOOD_FACTS_PRODUCT}/${barcode}`;
  const basisLabel = basis === 'serving' && serving.size
    ? `${serving.size} ${serving.unit}`
    : '100 g/ml';

  return {
    name: String(product.product_name_pt || product.product_name || product.generic_name || '').trim() || `Produto ${barcode}`,
    brand: String(product.brands || '').split(',')[0].trim() || null,
    category: inferCategory(product),
    barcode,
    description: String(product.generic_name || product.quantity || '').trim() || null,
    serving_size: serving.size,
    serving_unit: serving.unit,
    calories: nutrientValue(nutriments, 'energy-kcal', basis),
    protein_g: nutrientValue(nutriments, 'proteins', basis),
    carbs_g: nutrientValue(nutriments, 'carbohydrates', basis),
    fat_g: nutrientValue(nutriments, 'fat', basis),
    fiber_g: nutrientValue(nutriments, 'fiber', basis),
    sodium_mg: toMilligrams(sodiumValue, sodiumUnit),
    nutrition_facts: mapExtraNutrients(nutriments, basis),
    ingredients: String(product.ingredients_text_pt || product.ingredients_text || '').trim() || null,
    allergens: String(product.allergens || product.allergens_from_ingredients || '').trim() || null,
    image_url: product.image_front_url || null,
    source_type: 'open_food_facts',
    source_urls: [sourceUrl, product.image_nutrition_url].filter(Boolean),
    source_notes: `Importado do Open Food Facts com valores referentes a ${basisLabel}. Confira a embalagem antes de marcar como verificado.`,
    verification_status: 'draft',
    verified_at: null,
  };
}

export async function lookupOpenFoodFacts(barcodeValue, { fetchImpl = fetch } = {}) {
  const barcode = normalizeBarcode(barcodeValue);
  const url = `${OPEN_FOOD_FACTS_API}/${encodeURIComponent(barcode)}.json?fields=${encodeURIComponent(PRODUCT_FIELDS)}`;
  let response;
  try {
    response = await fetchImpl(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'NutrIsa/1.0 (product-catalog; contact via application owner)',
      },
      signal: AbortSignal.timeout(12_000),
    });
  } catch (cause) {
    const error = new Error('A base de produtos não respondeu. Tente novamente em instantes.');
    error.status = cause?.name === 'TimeoutError' ? 504 : 502;
    throw error;
  }

  if (response.status === 404) return null;
  if (response.status === 429) {
    const error = new Error('Muitas consultas de produtos. Aguarde um minuto e tente novamente.');
    error.status = 429;
    throw error;
  }
  if (!response.ok) {
    const error = new Error('Não foi possível consultar a base de produtos agora.');
    error.status = 502;
    throw error;
  }
  return mapOpenFoodFactsResponse(await response.json(), barcode);
}
