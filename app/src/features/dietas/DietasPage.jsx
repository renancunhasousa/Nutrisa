import React, { useState, useEffect, useRef } from 'react';
import { 
  UtensilsCrossed, Plus, BookOpen, Copy, Sparkles, 
  Target, Droplets, CheckCircle, Printer 
} from 'lucide-react';
import { useDietPlan } from './hooks/useDietPlan.js';
import { TargetMacrosBar } from './components/TargetMacrosBar.jsx';
import { FloatingMacrosFooter } from './components/FloatingMacrosFooter.jsx';
import { MealCard } from './components/MealCard.jsx';
import { FoodSearchModal } from './components/FoodSearchModal.jsx';
import { CustomFoodModal } from './components/CustomFoodModal.jsx';
import { DietHistoryModal } from './components/DietHistoryModal.jsx';
import { DietConfigSection } from './components/DietConfigSection.jsx';
import { NotesSection } from './components/NotesSection.jsx';
import { DietReport } from './report/DietReport.jsx';

export default function DietasPage({ settings = {} }) {
  const {
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
  } = useDietPlan();

  const macrosBarRef = useRef(null);
  const [showFloatingFooter, setShowFloatingFooter] = useState(false);

  // Monitora quando a barra de macronutrientes do topo sai da tela para ativar o rodapé flutuante
  useEffect(() => {
    const el = macrosBarRef.current;
    if (!el) return;

    const checkVisibility = () => {
      if (!macrosBarRef.current) return;
      const rect = macrosBarRef.current.getBoundingClientRect();
      // Ativa quando a barra superior estiver acima da tela (rolada para fora da visão)
      const isOut = rect.bottom < 100 || window.scrollY > 200;
      setShowFloatingFooter(isOut);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        const rect = entry.boundingClientRect;
        setShowFloatingFooter(!entry.isIntersecting && (rect.bottom < 100 || window.scrollY > 200));
      },
      {
        threshold: 0,
        rootMargin: '-60px 0px 0px 0px',
      }
    );

    observer.observe(el);
    window.addEventListener('scroll', checkVisibility, { passive: true });
    checkVisibility();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', checkVisibility);
    };
  }, []);

  // Se estiver na aba Relatório, exibe o relatório para impressão
  if (activeTab === 'relatorio') {
    return (
      <DietReport
        plan={plan}
        totals={totals}
        nutritionist={settings?.nutritionist}
        onBack={() => setActiveTab('refeicoes')}
      />
    );
  }

  return (
    <div className="space-y-6 pb-16">
      
      {/* Barra de Título Superior e Ações Globais */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Montagem de Dieta
          </h1>
          <p className="text-xs text-slate-500">
            Prescrição nutricional em tempo real com tabela TACO e medidas caseiras
          </p>
        </div>

        {/* Botões de Ação do Cabeçalho */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              const hasItems = plan.meals?.some(m => m.items?.length > 0);
              if (!hasItems || confirm('Deseja carregar o plano alimentar demonstrativo completo com 5 refeições, medidas caseiras e metas calculadas?')) {
                handleLoadDemoPlan();
              }
            }}
            title="Carregar plano alimentar demonstrativo completo para visualização"
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Carregar Dados Demo</span>
          </button>

          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>Modelos & Histórico</span>
          </button>

          <button
            type="button"
            onClick={handleDuplicateCurrent}
            title="Duplicar esta dieta para gerar uma nova versão"
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>Duplicar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm('Deseja iniciar um novo plano em branco? O rascunho atual continuará no histórico.')) {
                handleCreateNew();
              }
            }}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>Nova Dieta</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Publicar Dieta</span>
          </button>
        </div>
      </div>

      {/* Barra de Macronutrientes com Monitoramento ao Vivo */}
      <div ref={macrosBarRef}>
        <TargetMacrosBar
          plan={plan}
          totals={totals}
          targetComparison={targetComparison}
          onSave={handleSave}
          isSaving={isSaving}
          saveStatus={saveStatus}
          onViewReport={() => setActiveTab('relatorio')}
        />
      </div>

      {/* Abas de Navegação do Painel */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('refeicoes')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'refeicoes'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>Refeições & Alimentos</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            activeTab === 'refeicoes' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {plan.meals?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('metas')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'metas'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Paciente & Metas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orientacoes')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'orientacoes'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Droplets className="w-4 h-4" />
          <span>Hidratação & Recados</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('relatorio')}
          className="px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer text-slate-600 hover:bg-slate-100 hover:text-slate-900 ml-auto"
        >
          <Printer className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">Visualizar Laudo</span>
        </button>
      </div>

      {/* Conteúdo Dinâmico por Aba */}
      {activeTab === 'refeicoes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Cardápio Diário ({plan.meals?.length || 0} refeições prescritas)
            </span>
            <button
              type="button"
              onClick={() => addMeal()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Adicionar Refeição
            </button>
          </div>

          <div className="space-y-4">
            {(plan.meals || []).map((meal, idx) => (
              <MealCard
                key={meal.id || idx}
                meal={meal}
                mealIndex={idx}
                isFirst={idx === 0}
                isLast={idx === (plan.meals?.length || 1) - 1}
                onUpdateMeal={updateMeal}
                onDeleteMeal={deleteMeal}
                onDuplicateMeal={duplicateMeal}
                onMoveMeal={moveMeal}
                onOpenFoodSearch={openFoodSearchForMeal}
                onUpdateFood={updateFoodInMeal}
                onRemoveFood={removeFoodFromMeal}
                onAddSubstitution={addSubstitution}
                onRemoveSubstitution={removeSubstitution}
              />
            ))}
          </div>

          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={() => addMeal()}
              className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 border-2 border-dashed border-slate-300 hover:border-emerald-500 text-xs font-bold rounded-2xl transition-all shadow-2xs flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Adicionar Nova Refeição ao Cardápio</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'metas' && (
        <DietConfigSection
          plan={plan}
          onUpdateField={updatePlanField}
        />
      )}

      {activeTab === 'orientacoes' && (
        <NotesSection
          plan={plan}
          onUpdateField={updatePlanField}
        />
      )}

      {/* Modais Compartilhados */}
      <FoodSearchModal
        isOpen={isFoodModalOpen}
        onClose={() => setIsFoodModalOpen(false)}
        mealTitle={activeMealIndex !== null ? plan.meals?.[activeMealIndex]?.title : 'Refeição'}
        onSelectFood={(food, qty, unit) => {
          if (activeMealIndex !== null) {
            addFoodToMeal(activeMealIndex, food, qty, unit);
          }
        }}
        onOpenCreateCustom={() => setIsCustomFoodModalOpen(true)}
      />

      <CustomFoodModal
        isOpen={isCustomFoodModalOpen}
        onClose={() => setIsCustomFoodModalOpen(false)}
        onFoodCreated={(newFood) => {
          if (activeMealIndex !== null) {
            addFoodToMeal(activeMealIndex, newFood, 100, 'g');
          }
        }}
      />

      <DietHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onSelectPlan={handleLoadPlan}
        onDuplicateAndLoad={handleLoadPlan}
      />

      {/* Rodapé Flutuante de Monitoramento Contínuo dos Macros ao Rolar a Tela */}
      <FloatingMacrosFooter
        visible={showFloatingFooter && activeTab !== 'relatorio'}
        totals={totals}
        targetComparison={targetComparison}
        onSave={handleSave}
        isSaving={isSaving}
        saveStatus={saveStatus}
        onViewReport={() => setActiveTab('relatorio')}
      />

    </div>
  );
}
