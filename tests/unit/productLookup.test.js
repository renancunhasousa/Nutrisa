import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { mapOpenFoodFactsResponse, normalizeBarcode } from '../../server/products/openFoodFacts.js';
import { lookupProductByBarcode } from '../../server/products/productLookup.js';

test('normaliza código de barras sem remover zeros significativos', () => {
  assert.equal(normalizeBarcode(' 0789-1234-56789 '), '0789123456789');
  assert.throws(() => normalizeBarcode('123'), /7 a 14 dígitos/i);
});

test('mapeia nutrientes da porção do Open Food Facts para o catálogo', () => {
  const product = mapOpenFoodFactsResponse({
    status: 1,
    product: {
      code: '7891234567890',
      product_name_pt: 'Bebida proteica',
      brands: 'Marca X, Outra marca',
      categories: 'Bebidas, Suplementos',
      serving_size: '30 g',
      nutriments: {
        'energy-kcal_serving': 120,
        proteins_serving: 20,
        carbohydrates_serving: 4,
        fat_serving: 2,
        fiber_serving: 1,
        sodium_serving: 0.18,
        sodium_unit: 'g',
        sugars_serving: 1.5,
        sugars_unit: 'g',
      },
      image_front_url: 'https://images.openfoodfacts.org/product.jpg',
    },
  }, '7891234567890');

  assert.equal(product.name, 'Bebida proteica');
  assert.equal(product.brand, 'Marca X');
  assert.equal(product.category, 'suplemento');
  assert.equal(product.serving_size, 30);
  assert.equal(product.protein_g, 20);
  assert.equal(product.sodium_mg, 180);
  assert.deepEqual(product.nutrition_facts, [{ name: 'Açúcares totais', amount: 1.5, unit: 'g' }]);
  assert.equal(product.source_type, 'open_food_facts');
  assert.equal(product.verification_status, 'draft');
});

test('usa valores por 100 g quando a base não informa valores por porção', () => {
  const product = mapOpenFoodFactsResponse({
    status: 1,
    product: {
      code: '3017624010701',
      product_name: 'Produto por 100 g',
      nutriments: {
        'energy-kcal_100g': 539,
        proteins_100g: 6.3,
        carbohydrates_100g: 57.5,
        fat_100g: 30.9,
      },
    },
  }, '3017624010701');

  assert.equal(product.serving_size, 100);
  assert.equal(product.serving_unit, 'g');
  assert.equal(product.calories, 539);
  assert.match(product.source_notes, /100 g\/ml/i);
});

test('consulta Open Food Facts diretamente pelo código de barras', async () => {
  let requestedBarcode;
  const result = await lookupProductByBarcode('7891234567890', {
    lookupOpenFoodFactsImpl: async (barcode) => {
      requestedBarcode = barcode;
      return { name: 'Produto público', source_type: 'open_food_facts' };
    },
  });

  assert.equal(requestedBarcode, '7891234567890');
  assert.equal(result.provider, 'open_food_facts');
  assert.equal(result.product.name, 'Produto público');
});

test('interface diferencia busca gratuita de código e interpretação de imagem com IA', () => {
  const source = readFileSync(join(process.cwd(), 'app', 'src', 'features', 'produtos', 'components', 'ProductFormDialog.jsx'), 'utf8');
  assert.match(source, /não usa Gemini nem consome cota de IA/i);
  assert.match(source, /Buscar código/i);
  assert.match(source, /Interpretar imagem com IA/i);
  assert.match(source, /pressione Ctrl\+V/i);
});

test('migration aceita somente origens atuais e legadas necessárias', () => {
  const directory = join(process.cwd(), 'supabase', 'migrations');
  const file = readdirSync(directory).find((name) => name.endsWith('_expand_product_catalog_sources.sql'));
  assert.ok(file);
  const migrationSql = readFileSync(join(directory, file), 'utf8');
  for (const sourceType of ['manual', 'ai_web', 'imported', 'open_food_facts', 'ai_vision']) {
    assert.match(migrationSql, new RegExp(`'${sourceType}'`));
  }
  for (const removedSourceType of ['n8n', 'label_ocr', 'web_import']) {
    assert.doesNotMatch(migrationSql, new RegExp(`'${removedSourceType}'`, 'i'));
  }
});
