import { TACO_FOODS } from './tacoFoods.js';
import { calculateFoodItemNutrition } from '../domain/nutritionCalculations.js';
import { sanitizeMealPlan } from '../domain/dietValidators.js';

function buildFoodItem(foodId, quantity, unit, customNotes = '', substitutionsList = []) {
  const food = TACO_FOODS.find(f => f.id === foodId);
  if (!food) {
    console.warn(`Alimento demo ${foodId} não encontrado na tabela TACO.`);
    return null;
  }

  const nutrition = calculateFoodItemNutrition(food, quantity, unit);

  const builtSubs = substitutionsList.map((sub, sIdx) => {
    const sFood = TACO_FOODS.find(f => f.id === sub.foodId);
    if (!sFood) return null;
    const sNutrition = calculateFoodItemNutrition(sFood, sub.quantity, sub.unit);
    return {
      id: `sub_demo_${foodId}_${sIdx}`,
      food_id: sFood.id,
      name: sFood.name,
      quantity: sub.quantity,
      unit: sub.unit,
      nutrition_snapshot: sNutrition,
    };
  }).filter(Boolean);

  return {
    id: `item_demo_${foodId}_${Math.random().toString(36).substring(2, 7)}`,
    food_id: food.id,
    name: food.name,
    category: food.category,
    quantity,
    unit,
    household_measure: unit,
    household_measures: food.household_measures || [],
    notes: customNotes,
    nutrition_snapshot: nutrition,
    substitutions: builtSubs,
  };
}

export function createDemoDietPlan() {
  const meals = [
    {
      id: 'meal_demo_cafe',
      title: 'Café da Manhã',
      time: '07:30',
      notes: 'Prepare os ovos mexidos na frigideira untada levemente. Pode acompanhar café coado ou chá sem açúcar.',
      position: 0,
      items: [
        buildFoodItem('taco_ovo_cozido', 2, 'Unidade média'),
        buildFoodItem('taco_pao_integral', 2, 'Fatia'),
        buildFoodItem('taco_queijo_minas', 1, 'Fatia média'),
        buildFoodItem('taco_mamao_papaia', 1, 'Fatia'),
        buildFoodItem('taco_aveia_flocos', 1, 'Colher de sopa cheia'),
      ].filter(Boolean),
    },
    {
      id: 'meal_demo_lanche_manha',
      title: 'Lanche da Manhã',
      time: '10:15',
      notes: 'Picar as castanhas e misturar junto ao iogurte com os morangos frescos.',
      position: 1,
      items: [
        buildFoodItem('taco_iogurte_desnatado', 1, 'Pote'),
        buildFoodItem('taco_morango', 1, 'Caixinha (porção)'),
        buildFoodItem('taco_castanha_para', 2, 'Unidade'),
      ].filter(Boolean),
    },
    {
      id: 'meal_demo_almoco',
      title: 'Almoço Completo',
      time: '13:00',
      notes: 'Mastigue devagar (mínimo 20 min). Folhas verdes à vontade, temperadas com o azeite, limão e ervas.',
      position: 2,
      items: [
        buildFoodItem(
          'taco_frango_peito', 
          1, 
          'Filé grande', 
          '', 
          [
            { foodId: 'taco_tilapia', quantity: 1, unit: 'Filé médio' },
            { foodId: 'taco_patinho_moido', quantity: 1, unit: 'Porção média' },
          ]
        ),
        buildFoodItem('taco_arroz_integral', 1, 'Escumadeira média'),
        buildFoodItem('taco_feijao_carioca', 1, 'Concha média'),
        buildFoodItem('taco_brocolis', 1, 'Xícara de chá picado'),
        buildFoodItem('taco_tomate', 1, 'Unidade média'),
        buildFoodItem('taco_alface', 1, 'Prato de sobremesa'),
        buildFoodItem('taco_azeite', 1, 'Colher de sopa'),
      ].filter(Boolean),
    },
    {
      id: 'meal_demo_lanche_tarde',
      title: 'Lanche da Tarde / Pré-Treino',
      time: '16:30',
      notes: 'Consumir cerca de 60 a 90 minutos antes do treino de força. Bater o Whey com 200ml de água gelada.',
      position: 3,
      items: [
        buildFoodItem('taco_banana_prata', 1, 'Unidade média'),
        buildFoodItem('taco_pasta_amendoim', 1, 'Colher de sopa'),
        buildFoodItem('taco_whey_80', 1, 'Scoop dosador'),
        buildFoodItem('taco_aveia_flocos', 1, 'Colher de sopa cheia'),
      ].filter(Boolean),
    },
    {
      id: 'meal_demo_jantar',
      title: 'Jantar',
      time: '20:00',
      notes: 'Refeição noturna para recuperação muscular. Evitar telas luminosas após a refeição.',
      position: 4,
      items: [
        buildFoodItem(
          'taco_patinho_moido', 
          1, 
          'Porção média',
          '',
          [
            { foodId: 'taco_salmao', quantity: 1, unit: 'Filé médio' },
            { foodId: 'taco_frango_peito', quantity: 1, unit: 'Filé médio' },
          ]
        ),
        buildFoodItem('taco_batata_doce', 1, 'Unidade média'),
        buildFoodItem('taco_abobrinha', 2, 'Colher de sopa fatiada'),
        buildFoodItem('taco_azeite', 1, 'Colher de sobremesa'),
      ].filter(Boolean),
    },
  ];

  return sanitizeMealPlan({
    id: 'demo_plan_nutrisa',
    patient_id: 'demo_patient_mariana',
    patient_name: 'Mariana Santos Silva',
    title: 'Plano Nutricional - Recomposição Corporal & Performance',
    objective: 'Hipertrofia Muscular com Redução de Gordura Corporal',
    target_calories: 2050,
    target_protein: 170,
    target_carbs: 185,
    target_fat: 72,
    water_intake_ml: 2800,
    general_notes: `1. Hidratação Diária:
• Ingerir ao menos 2,8 litros de água mineral distribuídos ao longo do dia (cerca de 35 a 40 ml/kg).
• Evitar ingerir grandes volumes de líquidos durante o almoço e jantar (limite de 150ml se necessário).

2. Rotina de Treino:
• O Lanche da Tarde atua estrategicamente como pré-treino para garantir estoques adequados de glicogênio.
• Manter intervalo de 60 a 90 minutos entre o lanche e o treino de musculação.

3. Saladas e Vegetais:
• Folhas verdes escuras são de consumo livre para garantir saciedade e fibras.
• Priorize o azeite de oliva extravirgem cru para manter os antioxidantes e ácidos graxos monoinsaturados.

4. Higiene do Sono e Recuperação:
• Ceia ou jantar pelo menos 2 horas antes de dormir para não comprometer a secreção do GH e digestão noturna.`,
    status: 'publicada',
    version: 1,
    meals,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}
