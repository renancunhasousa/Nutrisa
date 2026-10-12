import { requireSupabase } from '../../../shared/services/supabase.js';

const PRODUCT_FIELDS = 'id,organization_id,name,brand,category,item_type,food_group,preparation_method,video_url,barcode,description,serving_size,serving_unit,reference_quantity,reference_unit,calories,protein_g,carbs_g,fat_g,fiber_g,sodium_mg,nutrition_facts,household_measures,ingredients,allergens,image_path,image_url,source_type,official_source,official_source_code,source_version,source_urls,source_notes,verification_status,is_available_for_diets,verified_at,created_by,updated_by,created_at,updated_at';
const IMAGE_BUCKET = 'product-images';
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function throwIfError(error) {
  if (error) throw new Error(error.message || 'Erro ao acessar o catálogo de produtos.');
}

const optionalText = (value) => value?.trim() || null;
const optionalNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const optionalVideoUrl = (value) => {
  const url = optionalText(value);
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') throw new Error();
    return parsed.href;
  } catch {
    throw new Error('Informe um link de vídeo HTTPS válido.');
  }
};

function normalizeNutrients(items = []) {
  return items
    .map((item) => ({
      name: item.name?.trim() || '',
      amount: optionalNumber(item.amount),
      unit: item.unit?.trim() || '',
    }))
    .filter((item) => item.name && item.amount !== null);
}

const normalizeNutrientName = (value = '') => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

function optionalNutrientAmount(items, names) {
  const nutrient = (items || []).find((item) => names.includes(normalizeNutrientName(item.name)));
  return optionalNumber(nutrient?.amount);
}

function productPayload(values, userId) {
  const verified = values.verification_status === 'verified';
  const referenceQuantity = optionalNumber(values.reference_quantity || values.serving_size) || 100;
  const requestedUnit = values.reference_unit || values.serving_unit || 'g';
  const referenceUnit = ['g', 'ml', 'unidade'].includes(requestedUnit) ? requestedUnit : 'g';
  return {
    name: values.name.trim(),
    brand: optionalText(values.brand),
    category: values.item_type || values.category || 'produto',
    item_type: values.item_type || values.category || 'produto',
    food_group: optionalText(values.food_group),
    preparation_method: optionalText(values.preparation_method),
    video_url: values.item_type === 'preparacao' ? optionalVideoUrl(values.video_url) : null,
    barcode: optionalText(values.barcode),
    description: optionalText(values.description),
    serving_size: optionalNumber(values.serving_size),
    serving_unit: optionalText(values.serving_unit),
    reference_quantity: referenceQuantity,
    reference_unit: referenceUnit,
    calories: optionalNumber(values.calories),
    protein_g: optionalNumber(values.protein_g),
    carbs_g: optionalNumber(values.carbs_g),
    fat_g: optionalNumber(values.fat_g),
    fiber_g: optionalNutrientAmount(values.nutrition_facts, ['fibra', 'fibras']),
    sodium_mg: optionalNutrientAmount(values.nutrition_facts, ['sodio']),
    nutrition_facts: normalizeNutrients(values.nutrition_facts),
    household_measures: (values.household_measures || [])
      .map((measure) => ({ name: measure.name?.trim(), grams: optionalNumber(measure.grams) }))
      .filter((measure) => measure.name && measure.grams > 0),
    ingredients: optionalText(values.ingredients),
    allergens: optionalText(values.allergens),
    image_path: optionalText(values.image_path),
    image_url: optionalText(values.image_url),
    source_type: values.source_type || 'manual',
    official_source: optionalText(values.official_source),
    official_source_code: optionalText(values.official_source_code),
    source_version: optionalText(values.source_version),
    source_urls: (values.source_urls || []).filter(Boolean),
    source_notes: optionalText(values.source_notes),
    verification_status: verified ? 'verified' : 'draft',
    is_available_for_diets: verified && Boolean(values.is_available_for_diets),
    verified_at: verified ? (values.verified_at || new Date().toISOString()) : null,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  };
}

export async function listProducts(organizationId) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('product_catalog')
    .select(PRODUCT_FIELDS)
    .or(`organization_id.eq.${organizationId},organization_id.is.null`)
    .is('archived_at', null)
    .order('name');
  throwIfError(error);
  return data ?? [];
}

export async function createProduct(organizationId, userId, values) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('product_catalog')
    .insert({
      ...productPayload(values, userId),
      organization_id: organizationId,
      created_by: userId,
    })
    .select(PRODUCT_FIELDS)
    .single();
  throwIfError(error);
  return data;
}

export async function updateProduct(organizationId, productId, userId, values) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('product_catalog')
    .update(productPayload(values, userId))
    .eq('organization_id', organizationId)
    .eq('id', productId)
    .select(PRODUCT_FIELDS)
    .single();
  throwIfError(error);
  return data;
}

export async function archiveProduct(organizationId, productId, userId) {
  const client = requireSupabase();
  const { error } = await client
    .from('product_catalog')
    .update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString(), updated_by: userId })
    .eq('organization_id', organizationId)
    .eq('id', productId);
  throwIfError(error);
}

export async function uploadProductImage(organizationId, file) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) throw new Error('Use uma imagem JPG, PNG ou WebP.');
  if (file.size > MAX_IMAGE_BYTES) throw new Error('A imagem deve ter no máximo 5 MB.');

  const client = requireSupabase();
  const extension = file.name.split('.').pop()?.toLowerCase() || file.type.split('/')[1];
  const path = `${organizationId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await client.storage.from(IMAGE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  });
  throwIfError(error);
  const { data } = client.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  return { image_path: path, image_url: data.publicUrl };
}

export async function removeProductImage(path) {
  if (!path) return;
  const client = requireSupabase();
  const { error } = await client.storage.from(IMAGE_BUCKET).remove([path]);
  throwIfError(error);
}
