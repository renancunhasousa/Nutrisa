import React, { useState } from 'react';
import { 
  Clock, Plus, Trash2, Copy, ChevronUp, ChevronDown, 
  MessageSquare, RefreshCw, Layers 
} from 'lucide-react';
import { calculateMealTotals } from '../domain/nutritionCalculations.js';

export function MealCard({
  meal,
  mealIndex,
  isFirst,
  isLast,
  onUpdateMeal,
  onDeleteMeal,
  onDuplicateMeal,
  onMoveMeal,
  onOpenFoodSearch,
  onUpdateFood,
  onRemoveFood,
  onAddSubstitution,
  onRemoveSubstitution,
}) {
  const [showNotes, setShowNotes] = useState(Boolean(meal.notes));
  const [expandedSubIndex, setExpandedSubIndex] = useState(null);

  const mealTotals = calculateMealTotals(meal.items || []);

  const mealSuggestions = [
    'Café da Manhã',
    'Lanche da Manhã',
    'Almoço',
    'Lanche da Tarde',
    'Pré-Treino',
    'Pós-Treino',
    'Jantar',
    'Ceia',
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-600/30 transition-all overflow-hidden">
      
      {/* Header da Refeição */}
      <div className="bg-gradient-to-r from-slate-50 to-white px-4 sm:px-6 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
          
          {/* Horário */}
          <div className="flex items-center bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
            <input
              type="time"
              value={meal.time || '08:00'}
              onChange={(e) => onUpdateMeal(mealIndex, { time: e.target.value })}
              className="text-xs font-bold text-slate-700 bg-transparent focus:outline-hidden"
              title="Horário sugerido para a refeição"
            />
          </div>

          {/* Título da Refeição com datalist de sugestões */}
          <div className="flex-1">
            <input
              type="text"
              list={`meal-suggestions-${mealIndex}`}
              value={meal.title}
              onChange={(e) => onUpdateMeal(mealIndex, { title: e.target.value })}
              placeholder="Ex: Almoço, Lanche..."
              className="text-sm sm:text-base font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-hidden px-1 py-0.5 w-full transition-all"
            />
            <datalist id={`meal-suggestions-${mealIndex}`}>
              {mealSuggestions.map((sug) => (
                <option key={sug} value={sug} />
              ))}
            </datalist>
          </div>

        </div>

        {/* Totais Rápidos da Refeição & Ações */}
        <div className="flex items-center gap-2">
          
          {/* Badge de Macronutrientes desta refeição */}
          <div className="flex items-center gap-1.5 bg-slate-100/90 text-slate-700 px-2.5 py-1 rounded-xl text-xs font-semibold">
            <span className="text-amber-700 font-bold">{mealTotals.calories} kcal</span>
            <span className="text-slate-300">•</span>
            <span className="text-rose-600">P: {mealTotals.protein}g</span>
            <span className="text-slate-300">•</span>
            <span className="text-amber-600">C: {mealTotals.carbs}g</span>
            <span className="text-slate-300">•</span>
            <span className="text-teal-600">G: {mealTotals.fat}g</span>
          </div>

          {/* Botões de Ação na Refeição */}
          <div className="flex items-center gap-0.5 border-l border-slate-200 pl-2">
            <button
              type="button"
              onClick={() => onMoveMeal(mealIndex, -1)}
              disabled={isFirst}
              title="Mover para cima"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-30 cursor-pointer"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onMoveMeal(mealIndex, 1)}
              disabled={isLast}
              title="Mover para baixo"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-30 cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDuplicateMeal(mealIndex)}
              title="Duplicar esta refeição"
              className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDeleteMeal(mealIndex)}
              title="Excluir refeição"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Lista de Alimentos da Refeição */}
      <div className="p-4 sm:p-6 space-y-3">
        {(!meal.items || meal.items.length === 0) ? (
          <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Nenhum alimento adicionado a esta refeição.</p>
            <button
              type="button"
              onClick={() => onOpenFoodSearch(mealIndex)}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar Primeiro Alimento
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Cabeçalho sutil de alinhamento das colunas (telas médias e grandes) */}
            <div className="hidden sm:flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1.5 border-b border-slate-100">
              <span className="flex-1 min-w-0">Alimento</span>
              <div className="w-[300px] md:w-[340px] shrink-0 flex items-center gap-2 pl-1">
                <span className="w-16 text-center">Qtd</span>
                <span className="w-44 md:w-52 text-left pl-2">Medida Caseira</span>
                <span className="w-14 text-right">Peso</span>
              </div>
              <span className="w-32 md:w-36 shrink-0 text-right pr-7">Nutrientes</span>
            </div>

            <div className="divide-y divide-slate-100">
              {meal.items.map((item, itemIdx) => {
                const snap = item.nutrition_snapshot || {};
                const measures = item.household_measures || [];
                const hasSubs = item.substitutions && item.substitutions.length > 0;
                const isSubExpanded = expandedSubIndex === itemIdx;

                return (
                  <div key={item.id || itemIdx} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 px-1 py-1 rounded-xl hover:bg-slate-50/70 transition-colors">
                      
                      {/* Coluna 1: Nome do alimento e categoria */}
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-semibold text-slate-800">
                            {item.name}
                          </span>
                          {item.category && (
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                              {item.category}
                            </span>
                          )}
                        </div>

                        {/* Botão para gerenciar opções de substituição */}
                        <div className="mt-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setExpandedSubIndex(isSubExpanded ? null : itemIdx)}
                            className={`text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer ${
                              hasSubs ? 'text-teal-600 hover:text-teal-700 font-bold' : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            <RefreshCw className="w-2.5 h-2.5" />
                            <span>{hasSubs ? `${item.substitutions.length} substituição(ões)` : '+ Adicionar substituição'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Coluna 2: Controles de Quantidade e Medida Caseira perfeitamente alinhados */}
                      <div className="w-full sm:w-[300px] md:w-[340px] shrink-0 flex items-center gap-2">
                        {/* Input de Quantidade com largura padronizada */}
                        <input
                          type="number"
                          min="0.1"
                          step="0.5"
                          value={item.quantity}
                          onChange={(e) => onUpdateFood(mealIndex, itemIdx, { quantity: Number(e.target.value) || 0 })}
                          className="w-16 shrink-0 text-center text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg p-1.5 focus:border-emerald-500 focus:bg-white focus:outline-hidden transition-all"
                          title="Quantidade"
                        />

                        {/* Seletor de Unidade / Medida Caseira com largura fixa e truncate */}
                        <select
                          value={item.unit}
                          onChange={(e) => onUpdateFood(mealIndex, itemIdx, { unit: e.target.value })}
                          className="w-44 md:w-52 shrink-0 truncate text-xs text-slate-700 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg p-1.5 focus:border-emerald-500 focus:bg-white focus:outline-hidden cursor-pointer transition-all"
                          title="Medida ou unidade"
                        >
                          <option value="g">gramas (g)</option>
                          <option value="ml">ml</option>
                          {measures.map((m) => (
                            <option key={m.name} value={m.name}>
                              {m.name} ({m.grams}g)
                            </option>
                          ))}
                        </select>

                        {/* Equivalente em gramas com largura fixa reservada para manter tudo 100% alinhado */}
                        <span className="w-14 shrink-0 text-[11px] text-slate-400 font-medium text-right tabular-nums">
                          {item.unit !== 'g' && item.unit !== 'ml' ? `≈ ${snap.grams}g` : ''}
                        </span>
                      </div>

                      {/* Coluna 3: Macros do Alimento e Ação de Remoção */}
                      <div className="w-full sm:w-32 md:w-36 shrink-0 flex items-center justify-between sm:justify-end gap-2 text-right">
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-800 block tabular-nums">
                            {snap.calories} kcal
                          </span>
                          <span className="text-[10px] text-slate-400 block tabular-nums">
                            P: {snap.protein}g • C: {snap.carbs}g • G: {snap.fat}g
                          </span>
                        </div>

                        {/* Remover Alimento */}
                        <button
                          type="button"
                          onClick={() => onRemoveFood(mealIndex, itemIdx)}
                          title="Remover alimento"
                          className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer transition-all shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>

                  {/* Bloco de Substituições Expansível */}
                  {isSubExpanded && (
                    <div className="mt-2.5 p-3 bg-slate-50/80 rounded-xl border border-teal-100 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-teal-800 flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 text-teal-600" /> Opções de Substituição
                        </span>
                      </div>

                      {hasSubs ? (
                        <div className="space-y-1.5">
                          {item.substitutions.map((sub, sIdx) => (
                            <div key={sub.id || sIdx} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                              <span className="font-medium text-slate-700">
                                <strong>OU:</strong> {sub.quantity} {sub.unit} de {sub.name}
                                {sub.nutrition_snapshot && ` (${sub.nutrition_snapshot.calories} kcal)`}
                              </span>
                              <button
                                type="button"
                                onClick={() => onRemoveSubstitution(mealIndex, itemIdx, sIdx)}
                                className="text-slate-400 hover:text-rose-500 p-1"
                                title="Remover substituição"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500">
                          Nenhum substituto adicionado ainda. Adicione equivalentes para dar flexibilidade ao paciente.
                        </p>
                      )}

                      <div className="pt-1 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const name = prompt('Nome do alimento substituto (ex: Batata doce cozida):');
                            if (!name) return;
                            const qty = prompt('Quantidade (ex: 100):', '100');
                            onAddSubstitution(mealIndex, itemIdx, { id: 'custom_sub_' + Date.now(), name }, Number(qty) || 100, 'g');
                          }}
                          className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-[10px] transition-all cursor-pointer"
                        >
                          + Adicionar Substituto Rápido
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>
      )}

        {/* Rodapé da Refeição: Adicionar Alimento & Observações */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => onOpenFoodSearch(mealIndex)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar Alimento
          </button>

          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{showNotes ? 'Ocultar observação' : '+ Observação da refeição'}</span>
          </button>
        </div>

        {/* Campo de Observação da Refeição */}
        {showNotes && (
          <div className="pt-2">
            <input
              type="text"
              value={meal.notes || ''}
              onChange={(e) => onUpdateMeal(mealIndex, { notes: e.target.value })}
              placeholder="Ex: Ingerir 30min antes do treino; pode temperar a salada com azeite e limão..."
              className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:border-emerald-500 focus:outline-hidden"
            />
          </div>
        )}

      </div>

    </div>
  );
}
