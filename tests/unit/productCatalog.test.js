import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { researchProduct, sanitizeProductDraft } from '../../server/ai/productResearch.js';

const migrationsDirectory = join(process.cwd(), 'supabase', 'migrations');
const migrationFile = readdirSync(migrationsDirectory)
  .find((file) => file.endsWith('_create_product_catalog.sql'));

assert.ok(migrationFile, 'A migration create_product_catalog deve existir.');
const sql = readFileSync(join(migrationsDirectory, migrationFile), 'utf8');
const appSource = readFileSync(join(process.cwd(), 'app', 'src', 'App.jsx'), 'utf8');
const navigationSource = readFileSync(join(process.cwd(), 'app', 'src', 'layout', 'navigationItems.js'), 'utf8');
const formSource = readFileSync(join(process.cwd(), 'app', 'src', 'features', 'produtos', 'components', 'ProductFormDialog.jsx'), 'utf8');
const unifiedMigrationFile = readdirSync(migrationsDirectory)
  .find((file) => file.endsWith('_unify_nutrition_catalog.sql'));
const unifiedSql = readFileSync(join(migrationsDirectory, unifiedMigrationFile), 'utf8');
const foodServiceSource = readFileSync(join(process.cwd(), 'app', 'src', 'features', 'dietas', 'services', 'foodService.js'), 'utf8');
const productServiceSource = readFileSync(join(process.cwd(), 'app', 'src', 'features', 'produtos', 'services', 'products.js'), 'utf8');
const videoMigrationFile = readdirSync(migrationsDirectory)
  .find((file) => file.endsWith('_add_preparation_video_url.sql'));
const videoMigrationSql = readFileSync(join(migrationsDirectory, videoMigrationFile), 'utf8');

test('módulo Produtos oferece cadastro manual, código de barras e imagem colada', () => {
  assert.match(appSource, /produtos:\s*<ProdutosPage\s*\/>/i);
  assert.match(navigationSource, /id:\s*'produtos'[\s\S]*label:\s*'Cadastros'/i);
  assert.match(formSource, /Buscar dados do produto/i);
  assert.match(formSource, /Buscar código/i);
  assert.match(formSource, /Interpretar imagem com IA/i);
  assert.match(formSource, /Ctrl\+V/i);
  assert.match(formSource, /clipboardData/i);
  assert.match(formSource, /labelPreviewUrl/i);
  assert.doesNotMatch(formSource, /Link da loja ou fabricante/i);
  assert.match(formSource, /Salvar item/i);
});

test('catálogo nutricional unifica alimentos, preparações, produtos e suplementos', () => {
  for (const column of ['item_type', 'food_group', 'reference_quantity', 'reference_unit', 'household_measures', 'official_source', 'is_available_for_diets']) {
    assert.match(unifiedSql, new RegExp(`\\b${column}\\b`, 'i'));
  }
  assert.match(unifiedSql, /item_type in \('alimento', 'preparacao', 'produto', 'suplemento', 'bebida'\)/i);
  assert.match(unifiedSql, /organization_id is null[\s\S]*private\.is_organization_member\(organization_id\)/i);
  assert.match(unifiedSql, /from public\.foods/i);
  assert.match(formSource, /Tipo de cadastro/i);
  assert.match(formSource, /Medidas caseiras/i);
  assert.match(formSource, /Disponibilizar este item verificado no criador de dietas/i);
  assert.match(foodServiceSource, /from\('product_catalog'\)/i);
  assert.match(foodServiceSource, /is_available_for_diets/i);
});

test('preparações aceitam vídeo externo e persistem o link no catálogo', () => {
  assert.match(formSource, /name="preparation-video-url"/i);
  assert.match(formSource, /form\.item_type === 'preparacao'[\s\S]*video_url/i);
  assert.match(productServiceSource, /PRODUCT_FIELDS[^\n]*video_url/i);
  assert.match(productServiceSource, /video_url:\s*values\.item_type === 'preparacao'/i);
  assert.match(foodServiceSource, /video_url:\s*foodData\.video_url/i);
  assert.match(videoMigrationSql, /add column(?: if not exists)? video_url text/i);
  assert.match(videoMigrationSql, /product_catalog_video_url_check/i);
  assert.match(videoMigrationSql, /\^https:\/\//i);
});

test('fibras e sódio são tratados somente como outros nutrientes', () => {
  assert.doesNotMatch(formSource, /<Field label="Fibras \(g\)"/i);
  assert.doesNotMatch(formSource, /<Field label="Sódio \(mg\)"/i);
  assert.doesNotMatch(formSource, /addNutrientPreset/i);
  assert.match(formSource, /Adicionar nutriente/i);
  assert.match(formSource, /includeOptionalNutrients/i);
  assert.match(productServiceSource, /fiber_g:\s*optionalNutrientAmount/i);
  assert.match(productServiceSource, /sodium_mg:\s*optionalNutrientAmount/i);
});

test('catálogo de produtos persiste rótulo, macros, origem e revisão', () => {
  assert.match(sql, /create table public\.product_catalog/i);
  for (const column of ['organization_id', 'serving_size', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'nutrition_facts', 'source_urls', 'verification_status']) {
    assert.match(sql, new RegExp(`\\b${column}\\b`, 'i'));
  }
  assert.match(sql, /check \(category in \('alimento', 'suplemento', 'bebida', 'outro'\)\)/i);
  assert.match(sql, /source_type in \('manual', 'ai_web', 'imported'\)/i);
});

test('catálogo e imagens são isolados por organização', () => {
  assert.match(sql, /alter table public\.product_catalog enable row level security/i);
  assert.match(sql, /create policy product_catalog_select_member[\s\S]*private\.is_organization_member\(organization_id\)/i);
  assert.match(sql, /create policy product_catalog_insert_member[\s\S]*with check/i);
  assert.match(sql, /revoke all on table public\.product_catalog from anon/i);
  assert.match(sql, /grant select, insert, update, delete on table public\.product_catalog to authenticated/i);
  assert.match(sql, /'product-images'[\s\S]*5242880[\s\S]*image\/webp/i);
  assert.match(sql, /create policy product_images_insert_member[\s\S]*storage\.foldername\(name\)/i);
});

test('rascunho da IA normaliza números inválidos sem inventar dados', () => {
  assert.deepEqual(sanitizeProductDraft({
    name: '  Produto X ',
    category: 'inválida',
    calories: -1,
    protein_g: '20.5',
    nutrition_facts: [{ name: ' Cálcio ', amount: '120', unit: ' mg ' }, { name: '', amount: 2, unit: 'g' }],
  }), {
    name: 'Produto X', brand: null, category: 'outro', barcode: null, description: null,
    serving_size: null, serving_unit: null, calories: null, protein_g: 20.5, carbs_g: null,
    fat_g: null, fiber_g: null, sodium_mg: null,
    nutrition_facts: [{ name: 'Cálcio', amount: 120, unit: 'mg' }],
    ingredients: null, allergens: null, source_notes: null,
  });
});

test('interpretação envia somente a imagem, usa saída estruturada e não armazena interação', async () => {
  let request;
  const result = await researchProduct({ image: { data: 'YWJj', mimeType: 'image/jpeg' } }, {
    createInteraction: async (value) => {
      request = value;
      return { output_text: JSON.stringify({ name: 'Produto da foto', category: 'suplemento', protein_g: 20, nutrition_facts: [] }) };
    },
  });

  assert.equal(request.model, 'gemini-3.6-flash');
  assert.equal(request.store, false);
  assert.equal(request.tools, undefined);
  assert.equal(request.response_format.mime_type, 'application/json');
  assert.deepEqual(request.input[1], { type: 'image', data: 'YWJj', mime_type: 'image/jpeg' });
  assert.match(request.input[0].text, /não pesquise na internet/i);
  assert.equal(result.product.protein_g, 20);
  assert.equal(result.researchMode, 'label_image');
  assert.deepEqual(result.sources, []);
});

test('interpretação tenta o modelo alternativo quando a cota principal acaba', async () => {
  const models = [];
  const result = await researchProduct({ image: { data: 'YWJj', mimeType: 'image/png' } }, {
    createInteraction: async (request) => {
      models.push(request.model);
      if (models.length === 1) throw Object.assign(new Error('quota'), { status: 429 });
      return { output_text: JSON.stringify({ name: 'Produto alternativo', category: 'alimento', nutrition_facts: [] }) };
    },
  });

  assert.deepEqual(models, ['gemini-3.6-flash', 'gemini-3.5-flash']);
  assert.equal(result.usedModel, 'gemini-3.5-flash');
});

test('servidor rejeita pesquisa por nome ou link sem imagem', async () => {
  await assert.rejects(
    researchProduct({ query: 'Produto X', productUrl: 'https://loja.example/produto' }, { createInteraction: assert.fail }),
    (error) => error.status === 400 && /envie ou cole uma imagem/i.test(error.message),
  );
});

test('interpretação explica quando a cota de todos os modelos está esgotada', async () => {
  await assert.rejects(
    researchProduct({ image: { data: 'YWJj', mimeType: 'image/webp' } }, {
      createInteraction: async () => { throw Object.assign(new Error('quota'), { status: 429 }); },
    }),
    (error) => error.status === 429 && /cota gratuita da Gemini está esgotada/i.test(error.message),
  );
});
