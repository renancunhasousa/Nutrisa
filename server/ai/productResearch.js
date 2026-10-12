import { GoogleGenAI } from '@google/genai';

const DEFAULT_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash'];
const MAX_IMAGE_BASE64_LENGTH = 3_500_000;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const PRODUCT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: { type: ['string', 'null'] },
    brand: { type: ['string', 'null'] },
    category: { type: 'string', enum: ['alimento', 'suplemento', 'bebida', 'outro'] },
    barcode: { type: ['string', 'null'] },
    description: { type: ['string', 'null'] },
    serving_size: { type: ['number', 'null'] },
    serving_unit: { type: ['string', 'null'] },
    calories: { type: ['number', 'null'] },
    protein_g: { type: ['number', 'null'] },
    carbs_g: { type: ['number', 'null'] },
    fat_g: { type: ['number', 'null'] },
    fiber_g: { type: ['number', 'null'] },
    sodium_mg: { type: ['number', 'null'] },
    nutrition_facts: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          amount: { type: 'number' },
          unit: { type: 'string' },
        },
        required: ['name', 'amount', 'unit'],
      },
    },
    ingredients: { type: ['string', 'null'] },
    allergens: { type: ['string', 'null'] },
    source_notes: { type: ['string', 'null'] },
  },
  required: [
    'name', 'brand', 'category', 'barcode', 'description', 'serving_size', 'serving_unit',
    'calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sodium_mg',
    'nutrition_facts', 'ingredients', 'allergens', 'source_notes',
  ],
};

const asNullableNumber = (value) => {
  const number = Number(value);
  return value === null || value === '' || !Number.isFinite(number) || number < 0 ? null : number;
};

export function sanitizeProductDraft(value = {}) {
  const text = (field) => typeof value[field] === 'string' ? value[field].trim() || null : null;
  const allowedCategories = new Set(['alimento', 'suplemento', 'bebida', 'outro']);
  return {
    name: text('name'),
    brand: text('brand'),
    category: allowedCategories.has(value.category) ? value.category : 'outro',
    barcode: text('barcode'),
    description: text('description'),
    serving_size: asNullableNumber(value.serving_size),
    serving_unit: text('serving_unit'),
    calories: asNullableNumber(value.calories),
    protein_g: asNullableNumber(value.protein_g),
    carbs_g: asNullableNumber(value.carbs_g),
    fat_g: asNullableNumber(value.fat_g),
    fiber_g: asNullableNumber(value.fiber_g),
    sodium_mg: asNullableNumber(value.sodium_mg),
    nutrition_facts: Array.isArray(value.nutrition_facts)
      ? value.nutrition_facts.map((item) => ({
        name: typeof item?.name === 'string' ? item.name.trim() : '',
        amount: asNullableNumber(item?.amount),
        unit: typeof item?.unit === 'string' ? item.unit.trim() : '',
      })).filter((item) => item.name && item.amount !== null)
      : [],
    ingredients: text('ingredients'),
    allergens: text('allergens'),
    source_notes: text('source_notes'),
  };
}

function normalizeImage(image) {
  if (!image) return null;
  if (!ALLOWED_IMAGE_TYPES.has(image.mimeType) || typeof image.data !== 'string') {
    throw Object.assign(new Error('Use uma imagem JPG, PNG ou WebP da tabela nutricional.'), { status: 400 });
  }
  if (image.data.length > MAX_IMAGE_BASE64_LENGTH || !/^[A-Za-z0-9+/]+={0,2}$/.test(image.data)) {
    throw Object.assign(new Error('A imagem da tabela nutricional ficou grande demais para análise.'), { status: 413 });
  }
  return { data: image.data, mimeType: image.mimeType };
}

export async function researchProduct(input, { env = process.env, createInteraction } = {}) {
  const values = input && typeof input === 'object' ? input : {};
  const image = normalizeImage(values.image);
  if (!image) {
    const error = new Error('Envie ou cole uma imagem da tabela nutricional para usar a IA.');
    error.status = 400;
    throw error;
  }

  const apiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;
  if (!apiKey && !createInteraction) {
    const error = new Error('Configure a chave da Gemini para interpretar imagens de produtos.');
    error.status = 503;
    throw error;
  }

  const client = createInteraction ? null : new GoogleGenAI({ apiKey });
  const create = createInteraction || ((request) => client.interactions.create(request));
  const prompt = 'Leia exclusivamente a imagem anexada do produto e da tabela nutricional. Não pesquise na internet e não complete dados usando conhecimento prévio. Retorne os valores exatamente para a porção visível, sem converter para 100 g. Se uma informação não estiver legível ou não aparecer na imagem, use null; não estime. Não dê aconselhamento médico. Em source_notes, registre que os dados vieram da imagem, informe a porção identificada e indique qualquer trecho ilegível.';
  const request = {
    store: false,
    input: [
      { type: 'text', text: prompt },
      { type: 'image', data: image.data, mime_type: image.mimeType },
    ],
    response_format: { type: 'text', mime_type: 'application/json', schema: PRODUCT_SCHEMA },
  };

  let interaction;
  let usedModel;
  let lastError;
  for (const model of DEFAULT_MODELS) {
    try {
      interaction = await create({ ...request, model });
      usedModel = model;
      break;
    } catch (error) {
      lastError = error;
      if (Number(error.status) !== 429) throw error;
    }
  }
  if (!interaction && Number(lastError?.status) === 429) {
    const error = new Error('A cota gratuita da Gemini está esgotada no momento. Tente novamente após a renovação da cota ou preencha o produto manualmente.');
    error.status = 429;
    throw error;
  }
  if (!interaction) throw lastError;

  let parsed;
  try {
    parsed = JSON.parse(interaction.output_text || '{}');
  } catch {
    const error = new Error('A imagem não retornou dados estruturados. Tente uma foto mais nítida e com a tabela nutricional inteira.');
    error.status = 502;
    throw error;
  }

  return {
    product: sanitizeProductDraft(parsed),
    sources: [],
    usedModel,
    researchMode: 'label_image',
  };
}
