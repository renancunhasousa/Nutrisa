import React, { useState } from 'react';
import { X, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { createCustomFood } from '../services/foodService.js';
import { FOOD_CATEGORIES } from '../data/tacoFoods.js';

export function CustomFoodModal({ isOpen, onClose, onFoodCreated }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Personalizados');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [householdMeasures, setHouseholdMeasures] = useState([
    { name: 'Colher de sopa', grams: 25 },
  ]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAddMeasure = () => {
    setHouseholdMeasures([...householdMeasures, { name: '', grams: 100 }]);
  };

  const handleUpdateMeasure = (idx, field, value) => {
    const copy = [...householdMeasures];
    copy[idx] = { ...copy[idx], [field]: value };
    setHouseholdMeasures(copy);
  };

  const handleRemoveMeasure = (idx) => {
    setHouseholdMeasures(householdMeasures.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, informe o nome do alimento.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const validMeasures = householdMeasures
        .filter((m) => m.name.trim() && Number(m.grams) > 0)
        .map((m) => ({ name: m.name.trim(), grams: Number(m.grams) }));

      const newFood = await createCustomFood({
        name,
        category,
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        fiber: Number(fiber) || 0,
        portion_base_grams: 100,
        household_measures: validMeasures,
      });

      if (onFoodCreated) {
        onFoodCreated(newFood);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError('Erro ao salvar alimento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Novo Alimento Personalizado</h3>
            <p className="text-xs text-slate-500">Valores de referência para a porção base de 100g</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-xl flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Nome do Alimento *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Pão de fermentação natural, Whey Vegano..."
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-hidden"
            >
              {FOOD_CATEGORIES.filter((c) => c !== 'Todas').map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Macronutrientes por 100g */}
          <div>
            <span className="text-xs font-bold text-slate-700 block mb-2">
              Composição Nutricional (por 100g):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Calorias (kcal)</label>
                <input
                  type="number"
                  step="0.1"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="0"
                  className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Proteína (g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="0"
                  className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Carboidratos (g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="0"
                  className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Gorduras (g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  placeholder="0"
                  className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Fibras (g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={fiber}
                  onChange={(e) => setFiber(e.target.value)}
                  placeholder="0"
                  className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Medidas Caseiras */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">Medidas Caseiras Equivalentes:</span>
              <button
                type="button"
                onClick={handleAddMeasure}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Adicionar Medida
              </button>
            </div>

            <div className="space-y-2">
              {householdMeasures.map((measure, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={measure.name}
                    onChange={(e) => handleUpdateMeasure(idx, 'name', e.target.value)}
                    placeholder="Ex: Fatia média, Scoop, Xícara..."
                    className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-emerald-500 focus:outline-hidden"
                  />
                  <div className="flex items-center gap-1 w-24">
                    <input
                      type="number"
                      value={measure.grams}
                      onChange={(e) => handleUpdateMeasure(idx, 'grams', e.target.value)}
                      placeholder="g"
                      className="w-full text-xs font-bold text-center bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-emerald-500 focus:outline-hidden"
                    />
                    <span className="text-[11px] text-slate-400">g</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMeasure(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Salvando...' : 'Salvar Alimento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
