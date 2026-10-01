/**
 * Validadores e sanitizadores para o módulo de dietas
 */

export function sanitizeMealPlan(plan = {}) {
  return {
    id: plan.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'plan_' + Date.now()),
    patient_id: plan.patient_id || null,
    patient_name: (plan.patient_name || '').trim(),
    title: (plan.title || 'Plano Alimentar Personalizado').trim(),
    objective: plan.objective || 'Emagrecimento Saudável',
    target_calories: Number(plan.target_calories) || 1800,
    target_protein: Number(plan.target_protein) || 120,
    target_carbs: Number(plan.target_carbs) || 180,
    target_fat: Number(plan.target_fat) || 55,
    water_intake_ml: Number(plan.water_intake_ml) || 2500,
    general_notes: plan.general_notes || '',
    status: plan.status || 'rascunho', // 'rascunho' | 'publicada' | 'arquivada'
    version: Number(plan.version) || 1,
    meals: Array.isArray(plan.meals) ? plan.meals.map(sanitizeMeal) : getDefaultMeals(),
    created_at: plan.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function sanitizeMeal(meal = {}, index = 0) {
  return {
    id: meal.id || 'meal_' + Date.now() + '_' + index,
    title: (meal.title || `Refeição ${index + 1}`).trim(),
    time: meal.time || '08:00',
    notes: meal.notes || '',
    position: typeof meal.position === 'number' ? meal.position : index,
    items: Array.isArray(meal.items) ? meal.items.map(sanitizeMealItem) : [],
  };
}

export function sanitizeMealItem(item = {}, index = 0) {
  return {
    id: item.id || 'item_' + Date.now() + '_' + index,
    food_id: item.food_id || item.food?.id || null,
    name: item.name || item.food?.name || 'Alimento',
    category: item.category || item.food?.category || 'Geral',
    quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
    unit: item.unit || 'g',
    household_measure: item.household_measure || item.unit || 'g',
    household_measures: item.household_measures || item.food?.household_measures || [],
    nutrition_snapshot: item.nutrition_snapshot || {
      grams: 0,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    },
    substitutions: Array.isArray(item.substitutions) ? item.substitutions : [],
  };
}

export function getDefaultMeals() {
  return [
    {
      id: 'meal_1',
      title: 'Café da Manhã',
      time: '07:30',
      notes: '',
      position: 0,
      items: [],
    },
    {
      id: 'meal_2',
      title: 'Lanche da Manhã',
      time: '10:00',
      notes: '',
      position: 1,
      items: [],
    },
    {
      id: 'meal_3',
      title: 'Almoço',
      time: '12:30',
      notes: '',
      position: 2,
      items: [],
    },
    {
      id: 'meal_4',
      title: 'Lanche da Tarde',
      time: '16:00',
      notes: '',
      position: 3,
      items: [],
    },
    {
      id: 'meal_5',
      title: 'Jantar',
      time: '19:30',
      notes: '',
      position: 4,
      items: [],
    },
    {
      id: 'meal_6',
      title: 'Ceia',
      time: '21:30',
      notes: '',
      position: 5,
      items: [],
    },
  ];
}
