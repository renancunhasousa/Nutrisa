import { useState, useEffect, useMemo, useCallback } from 'react';
import { sanitizeMealPlan, sanitizeMeal, sanitizeMealItem, getDefaultMeals } from '../domain/dietValidators.js';
import { calculateFoodItemNutrition, calculateDietTotals, compareTargetVsActual } from '../domain/nutritionCalculations.js';
import { saveDietPlan, saveCurrentDraft, loadCurrentDraft, duplicateDietPlan } from '../services/dietStorageService.js';
import { createDemoDietPlan } from '../data/demoDietData.js';

export function useDietPlan(initialPatient = null) {
  const [plan, setPlan] = useState(() => {
    const draft = loadCurrentDraft();
    if (draft) return draft;
    return sanitizeMealPlan({
      patient_name: initialPatient?.name || '',
      patient_id: initialPatient?.id || null,
      meals: getDefaultMeals(),
    });
  });

  const [activeTab, setActiveTab] = useState('refeicoes'); // 'refeicoes' | 'metas' | 'orientacoes' | 'relatorio'
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [activeMealIndex, setActiveMealIndex] = useState(null);
  const [isCustomFoodModalOpen, setIsCustomFoodModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'saved' | 'error' | null

  // Auto-save local draft
  useEffect(() => {
    saveCurrentDraft(plan);
  }, [plan]);

  // Recalcular totais e comparação de metas
  const totals = useMemo(() => calculateDietTotals(plan.meals), [plan.meals]);

  const targetComparison = useMemo(() => {
    return compareTargetVsActual(
      {
        calories: plan.target_calories,
        protein: plan.target_protein,
        carbs: plan.target_carbs,
        fat: plan.target_fat,
      },
      totals
    );
  }, [plan.target_calories, plan.target_protein, plan.target_carbs, plan.target_fat, totals]);

  const updatePlanField = useCallback((field, value) => {
    setPlan(prev => ({
      ...prev,
      [field]: value,
      updated_at: new Date().toISOString(),
    }));
  }, []);

  const addMeal = useCallback((customTitle = '') => {
    setPlan(prev => {
      const newIndex = prev.meals.length;
      const newMeal = sanitizeMeal({
        title: customTitle || `Refeição ${newIndex + 1}`,
        time: '12:00',
        position: newIndex,
        items: [],
      }, newIndex);

      return {
        ...prev,
        meals: [...prev.meals, newMeal],
      };
    });
  }, []);

  const updateMeal = useCallback((mealIndex, updates) => {
    setPlan(prev => {
      const updatedMeals = [...prev.meals];
      if (updatedMeals[mealIndex]) {
        updatedMeals[mealIndex] = {
          ...updatedMeals[mealIndex],
          ...updates,
        };
      }
      return { ...prev, meals: updatedMeals };
    });
  }, []);

  const deleteMeal = useCallback((mealIndex) => {
    setPlan(prev => ({
      ...prev,
      meals: prev.meals.filter((_, idx) => idx !== mealIndex),
    }));
  }, []);

  const duplicateMeal = useCallback((mealIndex) => {
    setPlan(prev => {
      const target = prev.meals[mealIndex];
      if (!target) return prev;
      const cloned = JSON.parse(JSON.stringify(target));
      cloned.id = 'meal_' + Date.now();
      cloned.title = `${cloned.title} (Cópia)`;
      cloned.position = prev.meals.length;

      return {
        ...prev,
        meals: [...prev.meals, cloned],
      };
    });
  }, []);

  const moveMeal = useCallback((index, direction) => {
    setPlan(prev => {
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= prev.meals.length) return prev;
      const copy = [...prev.meals];
      const temp = copy[index];
      copy[index] = copy[newIndex];
      copy[newIndex] = temp;
      return { ...prev, meals: copy };
    });
  }, []);

  const addFoodToMeal = useCallback((mealIndex, food, quantity = 1, unit = 'g') => {
    const nutrition = calculateFoodItemNutrition(food, quantity, unit);
    const newItem = sanitizeMealItem({
      food_id: food.id,
      name: food.name,
      category: food.category,
      quantity,
      unit,
      household_measure: unit,
      household_measures: food.household_measures || [],
      nutrition_snapshot: nutrition,
    });

    setPlan(prev => {
      const updatedMeals = [...prev.meals];
      if (!updatedMeals[mealIndex]) return prev;
      updatedMeals[mealIndex] = {
        ...updatedMeals[mealIndex],
        items: [...updatedMeals[mealIndex].items, newItem],
      };
      return { ...prev, meals: updatedMeals };
    });
  }, []);

  const updateFoodInMeal = useCallback((mealIndex, itemIndex, updates) => {
    setPlan(prev => {
      const updatedMeals = [...prev.meals];
      const meal = updatedMeals[mealIndex];
      if (!meal || !meal.items[itemIndex]) return prev;

      const currentItem = meal.items[itemIndex];
      const merged = { ...currentItem, ...updates };

      // Recalcular snapshot nutricional
      const nutrition = calculateFoodItemNutrition(
        {
          calories: merged.nutrition_snapshot?.calories / ((merged.nutrition_snapshot?.grams || 100) / 100) || 0,
          protein: merged.nutrition_snapshot?.protein / ((merged.nutrition_snapshot?.grams || 100) / 100) || 0,
          carbs: merged.nutrition_snapshot?.carbs / ((merged.nutrition_snapshot?.grams || 100) / 100) || 0,
          fat: merged.nutrition_snapshot?.fat / ((merged.nutrition_snapshot?.grams || 100) / 100) || 0,
          fiber: merged.nutrition_snapshot?.fiber / ((merged.nutrition_snapshot?.grams || 100) / 100) || 0,
          household_measures: merged.household_measures || [],
        },
        merged.quantity,
        merged.unit
      );

      merged.nutrition_snapshot = nutrition;

      const newItems = [...meal.items];
      newItems[itemIndex] = merged;
      updatedMeals[mealIndex] = { ...meal, items: newItems };

      return { ...prev, meals: updatedMeals };
    });
  }, []);

  const removeFoodFromMeal = useCallback((mealIndex, itemIndex) => {
    setPlan(prev => {
      const updatedMeals = [...prev.meals];
      const meal = updatedMeals[mealIndex];
      if (!meal) return prev;
      updatedMeals[mealIndex] = {
        ...meal,
        items: meal.items.filter((_, idx) => idx !== itemIndex),
      };
      return { ...prev, meals: updatedMeals };
    });
  }, []);

  const addSubstitution = useCallback((mealIndex, itemIndex, subFood, quantity = 1, unit = 'g') => {
    const nutrition = calculateFoodItemNutrition(subFood, quantity, unit);
    const subItem = {
      id: 'sub_' + Date.now(),
      food_id: subFood.id,
      name: subFood.name,
      quantity,
      unit,
      nutrition_snapshot: nutrition,
    };

    setPlan(prev => {
      const updatedMeals = [...prev.meals];
      const meal = updatedMeals[mealIndex];
      if (!meal || !meal.items[itemIndex]) return prev;

      const item = meal.items[itemIndex];
      const subs = Array.isArray(item.substitutions) ? [...item.substitutions, subItem] : [subItem];
      
      const newItems = [...meal.items];
      newItems[itemIndex] = { ...item, substitutions: subs };
      updatedMeals[mealIndex] = { ...meal, items: newItems };

      return { ...prev, meals: updatedMeals };
    });
  }, []);

  const removeSubstitution = useCallback((mealIndex, itemIndex, subIndex) => {
    setPlan(prev => {
      const updatedMeals = [...prev.meals];
      const meal = updatedMeals[mealIndex];
      if (!meal || !meal.items[itemIndex]) return prev;

      const item = meal.items[itemIndex];
      const subs = item.substitutions.filter((_, idx) => idx !== subIndex);

      const newItems = [...meal.items];
      newItems[itemIndex] = { ...item, substitutions: subs };
      updatedMeals[mealIndex] = { ...meal, items: newItems };

      return { ...prev, meals: updatedMeals };
    });
  }, []);

  const handleSave = async (asPublished = false) => {
    setIsSaving(true);
    try {
      const toSave = {
        ...plan,
        status: asPublished ? 'publicada' : (plan.status || 'rascunho'),
      };
      const saved = await saveDietPlan(toSave);
      setPlan(saved);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 3000);
      return saved;
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 4000);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNew = () => {
    const fresh = sanitizeMealPlan({
      patient_name: '',
      meals: getDefaultMeals(),
    });
    setPlan(fresh);
    setActiveTab('refeicoes');
  };

  const handleLoadPlan = (selectedPlan) => {
    setPlan(sanitizeMealPlan(selectedPlan));
    setIsHistoryModalOpen(false);
  };

  const handleDuplicateCurrent = () => {
    const duplicated = duplicateDietPlan(plan);
    setPlan(duplicated);
  };

  const handleLoadDemoPlan = useCallback(() => {
    const demo = createDemoDietPlan();
    setPlan(demo);
    setActiveTab('refeicoes');
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus(null), 3000);
    return demo;
  }, []);

  const openFoodSearchForMeal = (mealIndex) => {
    setActiveMealIndex(mealIndex);
    setIsFoodModalOpen(true);
  };

  return {
    plan,
    totals,
    targetComparison,
    activeTab,
    setActiveTab,
    updatePlanField,
    addMeal,
    updateMeal,
    deleteMeal,
    duplicateMeal,
    moveMeal,
    addFoodToMeal,
    updateFoodInMeal,
    removeFoodFromMeal,
    addSubstitution,
    removeSubstitution,
    handleSave,
    handleCreateNew,
    handleLoadPlan,
    handleDuplicateCurrent,
    handleLoadDemoPlan,
    isSaving,
    saveStatus,
    isFoodModalOpen,
    setIsFoodModalOpen,
    activeMealIndex,
    openFoodSearchForMeal,
    isCustomFoodModalOpen,
    setIsCustomFoodModalOpen,
    isHistoryModalOpen,
    setIsHistoryModalOpen,
  };
}
