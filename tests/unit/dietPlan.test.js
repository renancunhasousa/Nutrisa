import { describe, it } from 'node:test';
import assert from 'node:assert';
import { convertToGrams, formatMeasureDisplay } from '../../app/src/features/dietas/domain/measureConversions.js';
import { 
  calculateFoodItemNutrition, 
  calculateMealTotals, 
  calculateDietTotals, 
  calculateMacroPercentages, 
  compareTargetVsActual 
} from '../../app/src/features/dietas/domain/nutritionCalculations.js';
import { 
  sanitizeMealPlan, 
  sanitizeMeal, 
  getDefaultMeals 
} from '../../app/src/features/dietas/domain/dietValidators.js';
import { duplicateDietPlan } from '../../app/src/features/dietas/services/dietStorageService.js';

describe('Diet Plan Domain & Calculations', () => {
  it('converte gramas e medidas caseiras corretamente', () => {
    const householdMeasures = [
      { name: 'Colher de sopa', grams: 25 },
      { name: 'Xícara de chá', grams: 160 },
    ];

    assert.strictEqual(convertToGrams(100, 'g', householdMeasures), 100);
    assert.strictEqual(convertToGrams(200, 'ml', householdMeasures), 200);
    assert.strictEqual(convertToGrams(2, 'Colher de sopa', householdMeasures), 50);
    assert.strictEqual(convertToGrams(1.5, 'Xícara de chá', householdMeasures), 240);
    assert.strictEqual(convertToGrams(0, 'Colher de sopa', householdMeasures), 0);
  });

  it('formata texto de exibição da medida', () => {
    assert.strictEqual(formatMeasureDisplay(100, 'g', 100), '100g');
    assert.strictEqual(formatMeasureDisplay(2, 'Colher de sopa', 50), '2 Colher de sopa (50g)');
  });

  it('calcula snapshot nutricional do alimento individual por grama e por medida', () => {
    const food = {
      name: 'Peito de frango grelhado',
      calories: 159,
      protein: 32.0,
      carbs: 0.0,
      fat: 2.5,
      fiber: 0.0,
      portion_base_grams: 100,
      household_measures: [
        { name: 'Filé médio', grams: 120 },
      ],
    };

    // 100g direto
    const snap100g = calculateFoodItemNutrition(food, 100, 'g');
    assert.strictEqual(snap100g.grams, 100);
    assert.strictEqual(snap100g.calories, 159);
    assert.strictEqual(snap100g.protein, 32);

    // 1 Filé médio (120g) -> 159 * 1.2 = 190.8 kcal
    const snapFile = calculateFoodItemNutrition(food, 1, 'Filé médio');
    assert.strictEqual(snapFile.grams, 120);
    assert.strictEqual(snapFile.calories, 190.8);
    assert.strictEqual(snapFile.protein, 38.4);
    assert.strictEqual(snapFile.fat, 3.0);
  });

  it('calcula totais de uma refeição somando seus itens', () => {
    const items = [
      {
        nutrition_snapshot: { grams: 100, calories: 128, protein: 2.5, carbs: 28.1, fat: 0.2, fiber: 1.6 },
      },
      {
        nutrition_snapshot: { grams: 120, calories: 190.8, protein: 38.4, carbs: 0, fat: 3.0, fiber: 0 },
      },
    ];

    const totals = calculateMealTotals(items);
    assert.strictEqual(totals.calories, 318.8);
    assert.strictEqual(totals.protein, 40.9);
    assert.strictEqual(totals.carbs, 28.1);
    assert.strictEqual(totals.fat, 3.2);
    assert.strictEqual(totals.totalGrams, 220);
  });

  it('calcula totais gerais da dieta e distribuição percentual de macronutrientes', () => {
    const meals = [
      {
        items: [
          { nutrition_snapshot: { grams: 100, calories: 400, protein: 50, carbs: 40, fat: 4.4, fiber: 5 } },
        ],
      },
      {
        items: [
          { nutrition_snapshot: { grams: 100, calories: 600, protein: 50, carbs: 60, fat: 17.8, fiber: 5 } },
        ],
      },
    ];

    const dietTotals = calculateDietTotals(meals);
    assert.strictEqual(dietTotals.calories, 1000);
    assert.strictEqual(dietTotals.protein, 100);
    assert.strictEqual(dietTotals.carbs, 100);
    assert.strictEqual(dietTotals.fat, 22.2);
    assert.strictEqual(dietTotals.mealCount, 2);

    // Proteína: 100g * 4 = 400 kcal
    // Carbo: 100g * 4 = 400 kcal
    // Gordura: 22.2g * 9 = 199.8 kcal ≈ 200 kcal
    // Total: 1000 kcal -> ~40% P, ~40% C, ~20% F
    assert.strictEqual(Math.round(dietTotals.percentages.protein), 40);
    assert.strictEqual(Math.round(dietTotals.percentages.carbs), 40);
    assert.strictEqual(Math.round(dietTotals.percentages.fat), 20);
  });

  it('compara alvos com valores atuais e calcula diferenças e percentual realizado', () => {
    const target = { calories: 2000, protein: 150, carbs: 200, fat: 60 };
    const actual = { calories: 1800, protein: 150, carbs: 180, fat: 50, fiber: 25 };

    const comp = compareTargetVsActual(target, actual);
    assert.strictEqual(comp.calories.diff, -200);
    assert.strictEqual(comp.calories.percentage, 90);

    assert.strictEqual(comp.protein.diff, 0);
    assert.strictEqual(comp.protein.percentage, 100);

    assert.strictEqual(comp.carbs.diff, -20);
    assert.strictEqual(comp.carbs.percentage, 90);

    assert.strictEqual(comp.fat.diff, -10);
  });

  it('sanitiza e fornece defaults consistentes para planos e refeições', () => {
    const emptyPlan = sanitizeMealPlan();
    assert.ok(emptyPlan.id);
    assert.strictEqual(emptyPlan.status, 'rascunho');
    assert.strictEqual(emptyPlan.version, 1);
    assert.strictEqual(emptyPlan.meals.length, 6);

    const defaultMeals = getDefaultMeals();
    assert.strictEqual(defaultMeals[0].title, 'Café da Manhã');
    assert.strictEqual(defaultMeals[2].title, 'Almoço');
  });

  it('duplica um plano alimentar criando clone isolado', () => {
    const original = sanitizeMealPlan({
      title: 'Plano Hipertrofia',
      patient_name: 'Carlos Lima',
      status: 'publicada',
      target_calories: 2500,
    });

    const clone = duplicateDietPlan(original);
    assert.notStrictEqual(clone.id, original.id);
    assert.strictEqual(clone.title, 'Plano Hipertrofia (Cópia)');
    assert.strictEqual(clone.status, 'rascunho');
    assert.strictEqual(clone.patient_name, 'Carlos Lima');
    assert.strictEqual(clone.target_calories, 2500);
  });
});
