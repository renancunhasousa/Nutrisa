import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { createDemoDietPlan } from '../../app/src/features/dietas/data/demoDietData.js';
import { calculateDietTotals } from '../../app/src/features/dietas/domain/nutritionCalculations.js';

describe('Demo Diet Plan Generator', () => {
  test('deve gerar plano demonstrativo com todos os campos e 5 refeições estruturadas', () => {
    const demo = createDemoDietPlan();

    assert.ok(demo.id, 'Plano deve ter id');
    assert.strictEqual(demo.patient_name, 'Mariana Santos Silva');
    assert.strictEqual(demo.meals.length, 5, 'Deve conter exatamente 5 refeições');
    assert.strictEqual(demo.status, 'publicada');

    // Nenhuma refeição deve ter alimentos vazios ou nulos
    demo.meals.forEach((meal, idx) => {
      assert.ok(meal.title, `Refeição ${idx + 1} deve ter título`);
      assert.ok(meal.items.length > 0, `Refeição ${meal.title} deve ter itens`);
      meal.items.forEach(item => {
        assert.ok(item.food_id, 'Item deve ter food_id');
        assert.ok(item.name, 'Item deve ter nome');
        assert.ok(item.quantity > 0, 'Item deve ter quantidade maior que zero');
        assert.ok(item.household_measure, 'Item deve ter medida caseira definida');
        assert.ok(item.nutrition_snapshot, 'Item deve ter snapshot nutricional');
        assert.ok(item.nutrition_snapshot.calories > 0, 'Item deve ter calorias calculadas');
      });
    });

    // Validar presença de substituições em refeições principais
    const almoco = demo.meals.find(m => m.title.includes('Almoço'));
    assert.ok(almoco, 'Deve conter refeição de Almoço');
    const pratoPrincipal = almoco.items.find(i => i.substitutions?.length > 0);
    assert.ok(pratoPrincipal, 'Almoço deve ter prato principal com opções de substituição cadastradas');
    assert.ok(pratoPrincipal.substitutions.length >= 2, 'Deve ter pelo menos 2 alternativas de substituição');
  });

  test('deve calcular totais nutricionais coerentes próximos das metas estipuladas', () => {
    const demo = createDemoDietPlan();
    const totals = calculateDietTotals(demo.meals);

    assert.ok(totals.calories >= 1900 && totals.calories <= 2200, `Calorias calculadas (${totals.calories}) devem estar coerentes`);
    assert.ok(totals.protein >= 150 && totals.protein <= 190, `Proteínas calculadas (${totals.protein}g) devem estar coerentes`);
    assert.ok(totals.carbs >= 160 && totals.carbs <= 210, `Carboidratos calculados (${totals.carbs}g) devem estar coerentes`);
    assert.ok(totals.fat >= 60 && totals.fat <= 85, `Gorduras calculadas (${totals.fat}g) devem estar coerentes`);
    assert.ok(totals.fiber >= 25, `Fibras calculadas (${totals.fiber}g) devem garantir ingestão recomendada`);
  });
});
