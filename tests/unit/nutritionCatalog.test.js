import assert from 'node:assert/strict';
import test from 'node:test';
import { mapCatalogItemToFood } from '../../app/src/features/dietas/services/foodService.js';
import { calculateFoodItemNutrition } from '../../app/src/features/dietas/domain/nutritionCalculations.js';
import { mapTbcaFoodToCatalog } from '../../server/products/tbcaParse.js';

test('adapta item do catálogo por porção sem tratar seus nutrientes como valores por 100 g', () => {
  const food = mapCatalogItemToFood({
    id: 'whey-1', name: 'Whey', item_type: 'suplemento', reference_quantity: 30,
    reference_unit: 'g', calories: 120, protein_g: 24, carbs_g: 3, fat_g: 2,
    fiber_g: 0, household_measures: [{ name: 'Scoop', grams: 30 }],
    verification_status: 'verified', organization_id: 'clinic-1',
  });

  assert.equal(food.portion_base_grams, 30);
  assert.equal(food.category, 'Suplementos');
  assert.deepEqual(calculateFoodItemNutrition(food, 1, 'Scoop'), {
    grams: 30, calories: 120, protein: 24, carbs: 3, fat: 2, fiber: 0,
  });
});

test('cria medida Unidade para itens cuja referência é unitária', () => {
  const food = mapCatalogItemToFood({
    id: 'bar-1', name: 'Barra', item_type: 'produto', reference_quantity: 1,
    reference_unit: 'unidade', calories: 90, protein_g: 3, carbs_g: 15, fat_g: 2,
    organization_id: 'clinic-1', household_measures: [],
  });
  assert.deepEqual(food.household_measures[0], { name: 'Unidade', grams: 1 });
  assert.equal(calculateFoodItemNutrition(food, 1, 'Unidade').calories, 90);
});

test('cadastro rápido da dieta aponta para o catálogo nutricional central', async () => {
  const source = await import('node:fs/promises').then(({ readFile }) => readFile(
    new URL('../../app/src/features/dietas/services/foodService.js', import.meta.url), 'utf8',
  ));
  assert.match(source, /createProduct\(organizationId, userId/i);
  assert.match(source, /verification_status:\s*'verified'/i);
  assert.match(source, /is_available_for_diets:\s*true/i);
});

test('busca Storage usa somente o catálogo persistido no Supabase', async () => {
  const source = await import('node:fs/promises').then(({ readFile }) => readFile(
    new URL('../../app/src/features/dietas/services/foodService.js', import.meta.url), 'utf8',
  ));
  assert.doesNotMatch(source, /import\s*\{\s*TACO_FOODS\s*\}/);
  assert.match(source, /source\s*=\s*'storage'/);
  assert.match(source, /source\s*!==\s*'storage'/);
});

test('mapeia os macronutrientes do perfil TBCA e escolhe energia em kcal', () => {
  const food = mapTbcaFoodToCatalog(
    { code: 'BRC0012A', name: 'Arroz', detail_id: 'detail-1' },
    { nutrients: [
      { component: 'Energia', units: 'kJ', value_per_100g: '540' },
      { component: 'Energia', units: 'kcal', value_per_100g: '128' },
      { component: 'Proteína', units: 'g', value_per_100g: '2,5' },
      { component: 'Carboidrato total', units: 'g', value_per_100g: '28,1' },
      { component: 'Lipídeos', units: 'g', value_per_100g: '0,2' },
    ] },
  );

  assert.equal(food.calories, 128);
  assert.equal(food.protein_g, 2.5);
  assert.equal(food.carbs_g, 28.1);
  assert.equal(food.fat_g, 0.2);
  assert.equal(food.tbca_detail_id, 'detail-1');
});
