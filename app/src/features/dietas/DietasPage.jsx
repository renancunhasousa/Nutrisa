import React, { useState, useEffect, useRef } from 'react';
import { 
  UtensilsCrossed, Plus, BookOpen, Copy, Sparkles, 
  Target, Droplets, CheckCircle, Printer, MoreHorizontal, Save
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
import PageHeader from '../../shared/ui/PageHeader.jsx';
import PatientContextBar from '../pacientes/components/PatientContextBar.jsx';

export default function DietasPage({ settings = {} }) {
  const {
    hasActivePatient,
    activePatient,
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
  const actionsMenuRef = useRef(null);
  const [showFloatingFooter, setShowFloatingFooter] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);

  const closeActionsMenu = () => setIsActionsMenuOpen(false);

  const handleCreateNewPlan = () => {
    closeActionsMenu();
    if (confirm('Deseja iniciar um novo plano em branco? O rascunho atual continuará no histórico.')) {
      handleCreateNew();
    }
  };

  const handleLoadDemo = () => {
    closeActionsMenu();
    const hasItems = plan.meals?.some((meal) => meal.items?.length > 0);
    if (!hasItems || confirm('Deseja carregar o plano alimentar demonstrativo completo com 5 refeições, medidas caseiras e metas calculadas?')) {
      handleLoadDemoPlan();
    }
  };

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

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target)) {
        closeActionsMenu();
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeActionsMenu();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
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
    <div className="w-full min-w-0 space-y-6 pb-16">
      <PatientContextBar action="A dieta" recordType="dieta" />
      
      {/* Barra de Título Superior e Ações Globais */}
      <PageHeader
        category="Nutrição clínica"
        title="Montagem de dieta"
        description="Prescrição nutricional em tempo real com tabela TACO e medidas caseiras."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative" ref={actionsMenuRef}>
              <button
                type="button"
                onClick={() => setIsActionsMenuOpen((isOpen) => !isOpen)}
                aria-expanded={isActionsMenuOpen}
                aria-controls="diet-actions-menu"
                className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <MoreHorizontal className="w-4 h-4 text-slate-500" />
                <span>Mais ações</span>
              </button>

              {isActionsMenuOpen ? (
                <div
                  id="diet-actions-menu"
                  role="menu"
                  aria-label="Ações auxiliares da dieta"
                  className="absolute right-0 z-30 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl"
                >
                  <button type="button" role="menuitem" onClick={() => { closeActionsMenu(); handleSave(false); }} disabled={isSaving} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                    <Save className="h-4 w-4 text-slate-500" /> Salvar rascunho
                  </button>
                  <button type="button" role="menuitem" onClick={() => { closeActionsMenu(); setActiveTab('relatorio'); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    <Printer className="h-4 w-4 text-slate-500" /> Relatório PDF
                  </button>
                  <button type="button" role="menuitem" onClick={() => { closeActionsMenu(); setIsHistoryModalOpen(true); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    <BookOpen className="h-4 w-4 text-slate-500" /> Modelos e histórico
                  </button>
                  <button type="button" role="menuitem" onClick={() => { closeActionsMenu(); handleDuplicateCurrent(); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    <Copy className="h-4 w-4 text-slate-500" /> Duplicar dieta
                  </button>
                  <button type="button" role="menuitem" onClick={handleCreateNewPlan} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    <Plus className="h-4 w-4 text-emerald-600" /> Nova dieta
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button type="button" role="menuitem" onClick={handleLoadDemo} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-emerald-800 hover:bg-emerald-50">
                    <Sparkles className="h-4 w-4 text-emerald-600" /> Carregar dados demo
                  </button>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
            >
              {hasActivePatient ? <Save className="size-4" aria-hidden="true" /> : <CheckCircle className="size-4" aria-hidden="true" />}
              <span>{isSaving ? 'Salvando…' : hasActivePatient ? 'Salvar no prontuário' : 'Publicar dieta'}</span>
            </button>
            {saveStatus === 'saved' ? <span className="text-xs font-semibold text-emerald-700">{hasActivePatient ? 'Salvo no prontuário' : 'Dieta salva'}</span> : null}
            {saveStatus === 'error' ? <span className="text-xs font-semibold text-rose-700">Falha ao salvar</span> : null}
          </div>
        }
      />

      {/* Barra de Macronutrientes com Monitoramento ao Vivo */}
      <div ref={macrosBarRef}>
        <TargetMacrosBar
          totals={totals}
          targetComparison={targetComparison}
          saveStatus={saveStatus}
        />
      </div>

      {/* Abas de Navegação do Painel */}
      <div className="flex min-w-0 items-center gap-1 overflow-x-auto border-b border-slate-200 pb-2 no-scrollbar" aria-label="Seções da dieta">
        <button
          type="button"
          onClick={() => setActiveTab('refeicoes')}
          aria-current={activeTab === 'refeicoes' ? 'page' : undefined}
          className={`flex shrink-0 cursor-pointer items-center gap-2 px-4 py-2 text-xs transition-colors ${
            activeTab === 'refeicoes'
              ? 'font-extrabold text-emerald-700'
              : 'font-semibold text-slate-500 hover:text-emerald-700'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span className={activeTab === 'refeicoes' ? 'underline decoration-2 underline-offset-[6px]' : undefined}>Refeições & Alimentos</span>
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
            {plan.meals?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('metas')}
          aria-current={activeTab === 'metas' ? 'page' : undefined}
          className={`flex shrink-0 cursor-pointer items-center gap-2 px-4 py-2 text-xs transition-colors ${
            activeTab === 'metas'
              ? 'font-extrabold text-emerald-700'
              : 'font-semibold text-slate-500 hover:text-emerald-700'
          }`}
        >
          <Target className="w-4 h-4" />
          <span className={activeTab === 'metas' ? 'underline decoration-2 underline-offset-[6px]' : undefined}>Paciente & Metas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orientacoes')}
          aria-current={activeTab === 'orientacoes' ? 'page' : undefined}
          className={`flex shrink-0 cursor-pointer items-center gap-2 px-4 py-2 text-xs transition-colors ${
            activeTab === 'orientacoes'
              ? 'font-extrabold text-emerald-700'
              : 'font-semibold text-slate-500 hover:text-emerald-700'
          }`}
        >
          <Droplets className="w-4 h-4" />
          <span className={activeTab === 'orientacoes' ? 'underline decoration-2 underline-offset-[6px]' : undefined}>Recomendações & Recados</span>
        </button>
      </div>

      {/* Conteúdo Dinâmico por Aba */}
      {activeTab === 'refeicoes' && (
        <div className="space-y-4">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          activePatient={activePatient}
          hasActivePatient={hasActivePatient}
          showAppNotification={settings?.showAppNotification}
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
          setIsFoodModalOpen(false);
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
      />

    </div>
  );
}
