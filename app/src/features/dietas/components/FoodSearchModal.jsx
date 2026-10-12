import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Plus, Check, Database, Wheat, Globe2, Layers3, Apple, Salad, Milk, Bean, Drumstick, Pill, CupSoda, CookingPot, Package, Nut } from 'lucide-react';
import { loadTbcaFoodProfile, searchFoods } from '../services/foodService.js';
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
  const [selectedSource, setSelectedSource] = useState('storage');
  const [foodsList, setFoodsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [remotePage, setRemotePage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [profileLoadingId, setProfileLoadingId] = useState(null);

  // Alimento em foco para inserção
  const [activeFood, setActiveFood] = useState(null);
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState('g');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce para evitar rajadas de requisições nas APIs externas ao digitar
  useEffect(() => {
    if (!searchTerm) {
      setDebouncedSearchTerm('');
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setDebouncedSearchTerm('');
      setActiveFood(null);
      setSelectedSource('storage');
      setRemotePage(1);
      setHasMore(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    searchFoods({
      query: debouncedSearchTerm,
      category: selectedCategory,
      source: selectedSource,
      page: remotePage,
      signal: controller.signal,
      onLocalResults: (results) => {
        if (!controller.signal.aborted) setFoodsList(results);
      },
      onRemoteMeta: (remoteSource, meta) => {
        if (!controller.signal.aborted && remoteSource === selectedSource) setHasMore(meta.hasMore);
      },
    })
      .then((results) => {
        if (!controller.signal.aborted) {
          setFoodsList((current) => {
            if (remotePage === 1) return results;
            const merged = new Map(current.map((food) => [food.id, food]));
            results.forEach((food) => merged.set(food.id, food));
            return Array.from(merged.values());
          });
          setLoading(false);
        }
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          console.error(err);
        }
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [isOpen, debouncedSearchTerm, selectedCategory, selectedSource, remotePage]);

  const handlePickFood = async (food) => {
    let selectedFood = food;
    if (food.nutrition_profile_loaded === false && food.tbca_detail_id) {
      setProfileLoadingId(food.id);
      try {
        selectedFood = await loadTbcaFoodProfile(food);
        setFoodsList((current) => current.map((item) => item.id === food.id ? selectedFood : item));
      } catch (error) {
        console.error(error);
        return;
      } finally {
        setProfileLoadingId(null);
      }
    }
    setActiveFood(selectedFood);
    // Selecionar primeira medida caseira se houver, ou 100g
    if (selectedFood.household_measures && selectedFood.household_measures.length > 0) {
      setUnit(selectedFood.household_measures[0].name);
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

  return createPortal(
    (
    <div className="app-modal-overlay animate-fade-in">
      <div 
        className="app-modal-panel max-w-5xl animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Modal */}
        <div className="app-modal-header p-4 sm:p-5 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
              <Apple className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Adicionar Alimento em <span className="text-emerald-700">{mealTitle}</span>
              </h3>
              <p className="text-xs text-slate-500">
                Pesquise na TACO, TBCA e catálogo da clínica, ou cadastre um alimento personalizado
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="app-modal-close p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            aria-label="Fechar busca de alimentos"
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
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setRemotePage(1);
                setHasMore(false);
              }}
              placeholder="Buscar por nome (ex: frango, arroz, aveia, banana, azeite)..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:border-emerald-500 focus:outline-hidden shadow-2xs"
            />
          </div>

          {/* Categorias e fontes na mesma linha */}
          <div className="flex items-center gap-3 min-w-0">
          <div className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {FOOD_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              const CategoryIcon = {
                Todas: Layers3,
                'Cereais e Tubérculos': Wheat,
                'Carnes e Ovos': Drumstick,
                Leguminosas: Bean,
                Laticínios: Milk,
                Frutas: Apple,
                'Verduras e Legumes': Salad,
                'Gorduras e Oleaginosas': Nut,
                Suplementos: Pill,
                Bebidas: CupSoda,
                Preparações: CookingPot,
                Produtos: Package,
                Personalizados: Plus,
              }[cat] || Layers3;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setRemotePage(1);
                    setHasMore(false);
                  }}
                  className={`group inline-flex shrink-0 items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer overflow-hidden ${
                    active
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                  }`}
                  aria-label={`Filtrar por ${cat}`}
                  title={cat}
                >
                  <CategoryIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span className="max-w-0 opacity-0 -translate-x-1 group-hover:max-w-44 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:max-w-44 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 transition-all duration-200">
                    {cat}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="shrink-0 flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-600 mr-1">Fonte:</span>
            {[
              ['storage', 'Storage', Database],
              ['tbca', 'TBCA', Database],
              ['fdc', 'USDA', Globe2],
            ].map(([value, label]) => {
              const displayLabel = label;
              return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setSelectedSource(value);
                  setRemotePage(1);
                  setHasMore(false);
                  setFoodsList([]);
                }}
                className={`group inline-flex w-20 justify-center items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer overflow-hidden ${selectedSource === value ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'}`}
                aria-pressed={selectedSource === value}
                aria-label={`Consultar ${displayLabel}`}
                title={displayLabel}
              >
                <span className="inline-block">
                  {displayLabel}
                </span>
              </button>
              );
            })}
          </div>
          </div>
        </div>

        {/* Corpo do Modal: Lista de Alimentos + Painel de Porção */}
        <div className="app-modal-body flex-1 p-4 grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Coluna da Esquerda: Resultados */}
          <div className={`${activeFood ? 'md:col-span-7' : 'md:col-span-12'} space-y-2 overflow-y-auto max-h-[380px] pr-1`}>
            {loading && foodsList.length === 0 ? (
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
              <>
              {loading && (
                <p className="text-center py-2 text-xs text-slate-400 font-medium" role="status">
                  {remotePage > 1 ? 'Buscando mais 8 alimentos...' : `Consultando ${selectedSource === 'tbca' ? 'TBCA' : selectedSource === 'fdc' ? 'USDA' : 'Storage'}...`}
                </p>
              )}
              {foodsList.map((food) => {
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
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          food.source === 'TBCA'
                            ? 'bg-blue-100 text-blue-700'
                            : food.source === 'USDA FoodData Central'
                              ? 'bg-violet-100 text-violet-700'
                              : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {food.source === 'USDA FoodData Central' ? 'USDA' : food.source || 'Catálogo'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {food.category} • Base 100g
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      {profileLoadingId === food.id ? (
                        <span className="text-[10px] text-emerald-600 font-semibold block">
                          Carregando macros...
                        </span>
                      ) : food.nutrition_profile_loaded === false ? (
                        <span className="text-[10px] text-amber-600 font-semibold block">
                          Perfil nutricional não carregado
                        </span>
                      ) : (
                        <>
                          <span className="text-xs font-bold text-slate-800 block">
                            {food.calories} kcal
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium block">
                            P: {food.protein}g • C: {food.carbs}g • G: {food.fat}g
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              {(selectedSource === 'tbca' || selectedSource === 'fdc') && hasMore && !loading && (
                <button
                  type="button"
                  onClick={() => setRemotePage((current) => current + 1)}
                  className="mx-auto mt-3 flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
                >
                  Buscar mais 8
                </button>
              )}
              </>
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
        <div className="app-modal-footer p-3 flex items-center justify-between text-xs">
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
    ),
    document.body,
  );
}
