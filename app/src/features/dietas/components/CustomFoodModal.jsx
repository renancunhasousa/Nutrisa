import React from 'react';
import ProductFormDialog from '../../produtos/components/ProductFormDialog.jsx';
import { createCustomFood } from '../services/foodService.js';
import { useAuth } from '../../auth/useAuth.js';

/** Usa exatamente o mesmo formulário do módulo Cadastros, inclusive validações e layout. */
export function CustomFoodModal({ isOpen, onClose, onFoodCreated }) {
  const { organizationId, user } = useAuth();
  const handleSave = async (form) => {
    if (!organizationId || !user?.id) throw new Error('A organização da clínica ainda não foi carregada. Entre novamente antes de cadastrar.');
    const newFood = await createCustomFood({
      name: form.name,
      category: form.food_group || 'Personalizados',
      item_type: form.item_type,
      preparation_method: form.preparation_method,
      video_url: form.video_url,
      calories: form.calories,
      protein: form.protein_g,
      carbs: form.carbs_g,
      fat: form.fat_g,
      fiber: form.fiber_g,
      nutrition_facts: form.nutrition_facts,
      portion_base_grams: form.reference_quantity || 100,
      household_measures: form.household_measures || [],
    }, { organizationId, userId: user.id });
    onFoodCreated?.(newFood);
    onClose();
  };

  return (
    <ProductFormDialog
      open={isOpen}
      product={{ item_type: 'alimento', category: 'alimento', verification_status: 'verified', is_available_for_diets: true }}
      onClose={onClose}
      onSave={handleSave}
    />
  );
}
