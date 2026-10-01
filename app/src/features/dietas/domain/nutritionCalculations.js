import { convertToGrams } from './measureConversions.js';

/**
 * Calcula os macronutrientes de um alimento individual na refeição baseado na quantidade e medida selecionada.
 * Salva um snapshot nutricional completo para garantir imutabilidade.
 * 
 * @param {Object} food - Alimento com valores base (por 100g)
 * @param {number} quantity - Quantidade selecionada
 * @param {string} unit - Unidade ou nome da medida caseira
 * @returns {Object} Snapshot com calorias, proteína, carboidrato, gordura, fibra e gramas totais
 */
export function calculateFoodItemNutrition(food, quantity = 1, unit = 'g') {
  if (!food) {
    return {
      grams: 0,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    };
  }

  const portionBase = Number(food.portion_base_grams) || 100;
  const householdMeasures = food.household_measures || [];
  const grams = convertToGrams(quantity, unit, householdMeasures, portionBase);
  const factor = grams / portionBase;

  // Suporte a formato plano ou objeto aninhado
  const baseCalories = Number(food.calories ?? food.nutrition_per_100g?.calories ?? 0);
  const baseProtein = Number(food.protein ?? food.nutrition_per_100g?.protein ?? 0);
  const baseCarbs = Number(food.carbs ?? food.nutrition_per_100g?.carbs ?? 0);
  const baseFat = Number(food.fat ?? food.nutrition_per_100g?.fat ?? 0);
  const baseFiber = Number(food.fiber ?? food.nutrition_per_100g?.fiber ?? 0);

  return {
    grams: round(grams, 1),
    calories: round(baseCalories * factor, 1),
    protein: round(baseProtein * factor, 1),
    carbs: round(baseCarbs * factor, 1),
    fat: round(baseFat * factor, 1),
    fiber: round(baseFiber * factor, 1),
  };
}

/**
 * Calcula os totais nutricionais de uma refeição individual somando seus itens
 */
export function calculateMealTotals(items = []) {
  if (!Array.isArray(items)) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, totalGrams: 0 };
  }

  return items.reduce(
    (acc, item) => {
      const snap = item.nutrition_snapshot || calculateFoodItemNutrition(item.food || item, item.quantity, item.unit);
      return {
        calories: round(acc.calories + (snap.calories || 0), 1),
        protein: round(acc.protein + (snap.protein || 0), 1),
        carbs: round(acc.carbs + (snap.carbs || 0), 1),
        fat: round(acc.fat + (snap.fat || 0), 1),
        fiber: round(acc.fiber + (snap.fiber || 0), 1),
        totalGrams: round(acc.totalGrams + (snap.grams || 0), 1),
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, totalGrams: 0 }
  );
}

/**
 * Calcula os totais gerais da dieta somando todas as refeições
 */
export function calculateDietTotals(meals = []) {
  if (!Array.isArray(meals)) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, mealCount: 0 };
  }

  const totals = meals.reduce(
    (acc, meal) => {
      const mealTotals = calculateMealTotals(meal.items || []);
      return {
        calories: round(acc.calories + mealTotals.calories, 1),
        protein: round(acc.protein + mealTotals.protein, 1),
        carbs: round(acc.carbs + mealTotals.carbs, 1),
        fat: round(acc.fat + mealTotals.fat, 1),
        fiber: round(acc.fiber + mealTotals.fiber, 1),
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  return {
    ...totals,
    mealCount: meals.length,
    percentages: calculateMacroPercentages(totals.protein, totals.carbs, totals.fat),
  };
}

/**
 * Calcula as porcentagens calóricas de cada macronutriente
 * Proteína: 4 kcal/g, Carboidrato: 4 kcal/g, Gordura: 9 kcal/g
 */
export function calculateMacroPercentages(proteinGrams = 0, carbsGrams = 0, fatGrams = 0) {
  const pKcal = (Number(proteinGrams) || 0) * 4;
  const cKcal = (Number(carbsGrams) || 0) * 4;
  const fKcal = (Number(fatGrams) || 0) * 9;
  const totalKcal = pKcal + cKcal + fKcal;

  if (totalKcal <= 0) {
    return { protein: 0, carbs: 0, fat: 0 };
  }

  return {
    protein: round((pKcal / totalKcal) * 100, 1),
    carbs: round((cKcal / totalKcal) * 100, 1),
    fat: round((fKcal / totalKcal) * 100, 1),
  };
}

/**
 * Compara metas com valores atuais realizados
 */
export function compareTargetVsActual(target = {}, actual = {}) {
  const tCal = Number(target.calories) || 0;
  const aCal = Number(actual.calories) || 0;
  const calDiff = round(aCal - tCal, 1);
  const calPercent = tCal > 0 ? round((aCal / tCal) * 100, 1) : 0;

  const tProt = Number(target.protein) || 0;
  const aProt = Number(actual.protein) || 0;
  const protDiff = round(aProt - tProt, 1);
  const protPercent = tProt > 0 ? round((aProt / tProt) * 100, 1) : 0;

  const tCarb = Number(target.carbs) || 0;
  const aCarb = Number(actual.carbs) || 0;
  const carbDiff = round(aCarb - tCarb, 1);
  const carbPercent = tCarb > 0 ? round((aCarb / tCarb) * 100, 1) : 0;

  const tFat = Number(target.fat) || 0;
  const aFat = Number(actual.fat) || 0;
  const fatDiff = round(aFat - tFat, 1);
  const fatPercent = tFat > 0 ? round((aFat / tFat) * 100, 1) : 0;

  return {
    calories: { target: tCal, actual: aCal, diff: calDiff, percentage: calPercent },
    protein: { target: tProt, actual: aProt, diff: protDiff, percentage: protPercent },
    carbs: { target: tCarb, actual: aCarb, diff: carbDiff, percentage: carbPercent },
    fat: { target: tFat, actual: aFat, diff: fatDiff, percentage: fatPercent },
    fiber: { actual: Number(actual.fiber) || 0 },
  };
}

function round(value, decimals = 1) {
  const factor = Math.pow(10, decimals);
  return Math.round(Number(value || 0) * factor) / factor;
}
