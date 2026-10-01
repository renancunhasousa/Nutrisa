import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Plus, Check } from 'lucide-react';
import { searchFoods } from '../services/foodService.js';
import { FOOD_CATEGORIES } from '../data/tacoFoods.js';
import { calculateFoodItemNutrition } from '../domain/nutritionCalculations.js';

export function FoodSearchModal({
  isOpen,
  onClose,
  mealTitle = 'Refeição',
  onSelectFood,
  onOpenCreateCustom,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [foodsList, setFoodsList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Alimento em foco para inserção
  const [activeFood, setActiveFood] = useState(null);
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState('g');

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setActiveFood(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    searchFoods({ query: searchTerm, category: selectedCategory })
      .then((results) => {
        if (isMounted) {
          setFoodsList(results);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, searchTerm, selectedCategory]);

  const handlePickFood = (food) => {
    setActiveFood(food);
    // Selecionar primeira medida caseira se houver, ou 100g
    if (food.household_measures && food.household_measures.length > 0) {
      setUnit(food.household_measures[0].name);
      setQuantity(1);
    } else {
      setUnit('g');
      setQuantity(100);
    }
  };

  const portionNutrition = useMemo(() => {
    if (!activeFood) return null;
    return calculateFoodItemNutrition(activeFood, quantity, unit);
  }, [activeFood, quantity, unit]);

  const handleConfirmAdd = () => {
    if (!activeFood) return;
    onSelectFood(activeFood, Number(quantity) || 1, unit);
    setActiveFood(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Adicionar Alimento em <span className="text-emerald-700">{mealTitle}</span>
            </h3>
            <p className="text-xs text-slate-500">
              Pesquise na Tabela TACO / IBGE ou cadastre um alimento personalizado
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Pesquisa e Filtros */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/60">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome (ex: frango, arroz, aveia, banana, azeite)..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:border-emerald-500 focus:outline-hidden shadow-2xs"
            />
          </div>

          {/* Categorias Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {FOOD_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Corpo do Modal: Lista de Alimentos + Painel de Porção */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Coluna da Esquerda: Resultados */}
          <div className={`${activeFood ? 'md:col-span-7' : 'md:col-span-12'} space-y-2 overflow-y-auto max-h-[380px] pr-1`}>
            {loading ? (
              <p className="text-center py-8 text-xs text-slate-400 font-medium">Buscando alimentos...</p>
            ) : foodsList.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <p className="text-xs text-slate-500">Nenhum alimento encontrado para sua busca.</p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCreateCustom();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Cadastrar Novo Alimento
                </button>
              </div>
            ) : (
              foodsList.map((food) => {
                const isSelected = activeFood?.id === food.id;
                return (
                  <div
                    key={food.id}
                    onClick={() => handlePickFood(food)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-2xs'
                        : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50/80 bg-white'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {food.name}
                        </span>
                        {food.is_custom && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                            Custom
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {food.category} • Base 100g
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-slate-800 block">
                        {food.calories} kcal
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        P: {food.protein}g • C: {food.carbs}g • G: {food.fat}g
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Coluna da Direita: Ajuste de Porção quando um alimento é clicado */}
          {activeFood && (
            <div className="md:col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                  Ajustar Porção
                </span>
                <h4 className="text-sm font-bold text-slate-900">
                  {activeFood.name}
                </h4>

                {/* Controles de Quantidade */}
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Medida / Unidade:
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:border-emerald-500 focus:outline-hidden"
                    >
                      <option value="g">gramas (g)</option>
                      <option value="ml">mililitros (ml)</option>
                      {(activeFood.household_measures || []).map((m) => (
                        <option key={m.name} value={m.name}>
                          {m.name} ({m.grams}g)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Quantidade:
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.5"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Resumo da Porção Calculada */}
                {portionNutrition && (
                  <div className="mt-4 bg-white p-3 rounded-lg border border-slate-200/80 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center font-bold text-slate-800">
                      <span>Total da Porção:</span>
                      <span className="text-emerald-700">{portionNutrition.calories} kcal ({portionNutrition.grams}g)</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[11px] pt-1 text-slate-600 border-t border-slate-100">
                      <div>P: <strong>{portionNutrition.protein}g</strong></div>
                      <div>C: <strong>{portionNutrition.carbs}g</strong></div>
                      <div>G: <strong>{portionNutrition.fat}g</strong></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Botão de Confirmação */}
              <button
                type="button"
                onClick={handleConfirmAdd}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" /> Adicionar à Refeição
              </button>
            </div>
          )}

        </div>

        {/* Rodapé: Botão de cadastro rápido de alimento customizado */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            Não encontrou o que procurava?
          </span>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCreateCustom();
            }}
            className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Criar Alimento Personalizado
          </button>
        </div>

      </div>
    </div>
  );
}
