import React, { useState } from 'react';
import {
  Activity, Flame, Loader2, Check, Calendar, Droplets,
  TrendingDown, TrendingUp, Target, AlertCircle, X
} from 'lucide-react';
import { getLatestPatientEvaluation } from '../../avaliacao/services/evaluations.js';
import { extractEvaluationEnergy } from '../domain/evaluationIntegration.js';

export function EvaluationEnergyImporter({
  activePatient,
  hasActivePatient,
  onApplyCalories,
  onApplyWater,
  onEvaluationWeight,
  showAppNotification,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [evaluationData, setEvaluationData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [appliedCalories, setAppliedCalories] = useState(null);
  const [appliedWater, setAppliedWater] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (!hasActivePatient || !activePatient) {
    return null;
  }

  const patientName = activePatient.name || activePatient.full_name || 'Paciente selecionado';

  const handleFetchEvaluation = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setIsDismissed(false);

    try {
      const evaluation = await getLatestPatientEvaluation(activePatient.id);

      if (!evaluation) {
        const msg = `Nenhuma avaliação física encontrada no prontuário de ${patientName}.`;
        setErrorMessage(msg);
        showAppNotification?.(msg, 'warning');
        return;
      }

      const extracted = extractEvaluationEnergy(evaluation);

      if (!extracted || !extracted.tmb) {
        const msg = `A avaliação mais recente de ${patientName} (${evaluation.evaluation_date || 'sem data'}) não possui registro de Taxa Metabólica Basal (TMB).`;
        setErrorMessage(msg);
        showAppNotification?.(msg, 'warning');
        return;
      }

      setEvaluationData(extracted);
      if (extracted.weight) onEvaluationWeight?.(extracted.weight);
      setAppliedCalories(null);
      setAppliedWater(false);

      // Aplica a TMB como meta calórica inicial automaticamente
      onApplyCalories(extracted.tmb);
      setAppliedCalories(extracted.tmb);

      // Notificação de sucesso
      showAppNotification?.(
        `Avaliação de ${extracted.evaluationDate} carregada! Meta definida para ${extracted.tmb} kcal (TMB).`,
        'success'
      );
    } catch (err) {
      console.error('Erro ao buscar avaliação:', err);
      const msg = err.message || 'Falha ao consultar a avaliação do paciente.';
      setErrorMessage(msg);
      showAppNotification?.(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCalories = (calories) => {
    onApplyCalories(calories);
    setAppliedCalories(calories);
    showAppNotification?.(`Meta calórica ajustada para ${calories} kcal.`, 'success');
  };

  const handleSelectWater = (waterMl) => {
    if (onApplyWater && waterMl) {
      onApplyWater(waterMl);
      setAppliedWater(true);
      showAppNotification?.(`Meta de hidratação atualizada para ${waterMl} ml.`, 'success');
    }
  };

  // Se o card de dados estiver fechado manualmente, mostra o botão compacto de reabrir
  if (isDismissed) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-900">
        <span className="flex items-center gap-1.5 font-medium">
          <Activity className="size-4 text-emerald-600" />
          Avaliação de {evaluationData?.evaluationDate} vinculada (TMB: {evaluationData?.tmb} kcal)
        </span>
        <button
          type="button"
          onClick={() => setIsDismissed(false)}
          className="font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer underline"
        >
          Ver opções de calorias
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Botão de Puxar Dados quando ainda não foi carregado */}
      {!evaluationData && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-white p-3.5 shadow-2xs">
          <div>
            <span className="text-xs font-bold text-slate-800">
              Avaliação Física de {patientName}
            </span>
            <p className="text-[11px] text-slate-500">
              Puxe a Taxa Metabólica Basal (TMB), peso e hidratação da última avaliação para calibrar as metas.
            </p>
          </div>

          <button
            type="button"
            onClick={handleFetchEvaluation}
            disabled={isLoading}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:from-emerald-700 hover:to-teal-700 active:scale-98 transition-all cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Buscando avaliação…</span>
              </>
            ) : (
              <>
                <Flame className="size-4 text-amber-300 fill-amber-300/40" />
                <span>Puxar da Avaliação Mais Recente</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Mensagem de Erro / Não encontrado */}
      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{errorMessage}</p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              Você pode realizar ou registrar uma nova avaliação física para este paciente na aba <strong>Avaliação</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-amber-500 hover:text-amber-800 cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Painel Inteligente de Dados da Avaliação Carregada */}
      {evaluationData && (
        <div className="overflow-hidden rounded-2xl border border-emerald-200/90 bg-gradient-to-b from-emerald-50/80 via-white to-slate-50/60 p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                <Flame className="size-4.5 text-amber-300" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-950">
                  Dados da Última Avaliação Física
                </h4>
                <p className="text-[11px] text-slate-500">
                  Selecione o cenário calórico desejado para aplicar à meta da prescrição:
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100/90 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                <Calendar className="size-3" aria-hidden="true" />
                Última avaliação: {evaluationData.evaluationDate}
              </span>
              <button
                type="button"
                onClick={handleFetchEvaluation}
                disabled={isLoading}
                title="Recarregar dados da avaliação"
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                {isLoading ? <Loader2 className="size-3 animate-spin" /> : <Activity className="size-3 text-emerald-600" />}
                <span>Atualizar</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                title="Ocultar detalhes"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Cards com Métricas Corporais da Avaliação */}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-2.5 text-center shadow-2xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">TMB (Basal)</span>
              <strong className="text-base font-black text-slate-800">{evaluationData.tmb}</strong>
              <span className="text-[10px] font-bold text-slate-500"> kcal</span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-2.5 text-center shadow-2xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Peso Corporal</span>
              <strong className="text-base font-black text-slate-800">{evaluationData.weight || '—'}</strong>
              <span className="text-[10px] font-bold text-slate-500"> kg</span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-2.5 text-center shadow-2xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">% Gordura</span>
              <strong className="text-base font-black text-slate-800">{evaluationData.bodyFat ? `${evaluationData.bodyFat}%` : '—'}</strong>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-2.5 text-center shadow-2xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Massa Magra</span>
              <strong className="text-base font-black text-slate-800">{evaluationData.leanMass || '—'}</strong>
              <span className="text-[10px] font-bold text-slate-500"> kg</span>
            </div>
          </div>

          {/* Opções de Aplicação de Calorias na Meta */}
          <div className="mt-3 space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Calibrar Calorias da Meta em 1 Clique:
            </span>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {/* Opção 1: Manutenção / TMB pura */}
              <button
                type="button"
                onClick={() => handleSelectCalories(evaluationData.suggestedScenarios.maintenance)}
                className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                  appliedCalories === evaluationData.suggestedScenarios.maintenance
                    ? 'border-emerald-500 bg-emerald-500 text-white shadow-xs'
                    : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-800'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className={`text-[11px] font-bold ${appliedCalories === evaluationData.suggestedScenarios.maintenance ? 'text-white' : 'text-slate-700'}`}>
                    <span className="inline-flex items-center gap-1.5">
                      <Target className="size-3.5" aria-hidden="true" />
                      Manutenção (TMB)
                    </span>
                  </span>
                  {appliedCalories === evaluationData.suggestedScenarios.maintenance && (
                    <Check className="size-3.5 text-white" />
                  )}
                </div>
                <strong className={`text-base font-black mt-0.5 ${appliedCalories === evaluationData.suggestedScenarios.maintenance ? 'text-white' : 'text-emerald-700'}`}>
                  {evaluationData.suggestedScenarios.maintenance} kcal
                </strong>
                <span className={`text-[10px] mt-0.5 ${appliedCalories === evaluationData.suggestedScenarios.maintenance ? 'text-emerald-100' : 'text-slate-400'}`}>
                  Gasto basal em repouso
                </span>
              </button>

              {/* Opção 2: Déficit Calórico (-350 kcal) */}
              <button
                type="button"
                onClick={() => handleSelectCalories(evaluationData.suggestedScenarios.deficitModerate)}
                className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                  appliedCalories === evaluationData.suggestedScenarios.deficitModerate
                    ? 'border-rose-500 bg-rose-600 text-white shadow-xs'
                    : 'border-slate-200 bg-white hover:border-rose-300 hover:bg-rose-50/50 text-slate-800'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className={`text-[11px] font-bold ${appliedCalories === evaluationData.suggestedScenarios.deficitModerate ? 'text-white' : 'text-slate-700'}`}>
                    <span className="inline-flex items-center gap-1.5">
                      <TrendingDown className="size-3.5" aria-hidden="true" />
                      Déficit Moderado (-350)
                    </span>
                  </span>
                  {appliedCalories === evaluationData.suggestedScenarios.deficitModerate && (
                    <Check className="size-3.5 text-white" />
                  )}
                </div>
                <strong className={`text-base font-black mt-0.5 ${appliedCalories === evaluationData.suggestedScenarios.deficitModerate ? 'text-white' : 'text-rose-600'}`}>
                  {evaluationData.suggestedScenarios.deficitModerate} kcal
                </strong>
                <span className={`text-[10px] mt-0.5 ${appliedCalories === evaluationData.suggestedScenarios.deficitModerate ? 'text-rose-100' : 'text-slate-400'}`}>
                  Ideal p/ perda de gordura
                </span>
              </button>

              {/* Opção 3: Superávit Calórico (+350 kcal) */}
              <button
                type="button"
                onClick={() => handleSelectCalories(evaluationData.suggestedScenarios.surplusModerate)}
                className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                  appliedCalories === evaluationData.suggestedScenarios.surplusModerate
                    ? 'border-amber-500 bg-amber-600 text-white shadow-xs'
                    : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/50 text-slate-800'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className={`text-[11px] font-bold ${appliedCalories === evaluationData.suggestedScenarios.surplusModerate ? 'text-white' : 'text-slate-700'}`}>
                    <span className="inline-flex items-center gap-1.5">
                      <TrendingUp className="size-3.5" aria-hidden="true" />
                      Superávit (+350)
                    </span>
                  </span>
                  {appliedCalories === evaluationData.suggestedScenarios.surplusModerate && (
                    <Check className="size-3.5 text-white" />
                  )}
                </div>
                <strong className={`text-base font-black mt-0.5 ${appliedCalories === evaluationData.suggestedScenarios.surplusModerate ? 'text-white' : 'text-amber-600'}`}>
                  {evaluationData.suggestedScenarios.surplusModerate} kcal
                </strong>
                <span className={`text-[10px] mt-0.5 ${appliedCalories === evaluationData.suggestedScenarios.surplusModerate ? 'text-amber-100' : 'text-slate-400'}`}>
                  Ideal p/ ganho de massa
                </span>
              </button>
            </div>
          </div>

          {/* Ação Auxiliar: Hidratação Calculada */}
          {evaluationData.waterRecommended && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-200 bg-sky-50/70 px-3 py-2 text-xs text-sky-950">
              <span className="flex items-center gap-1.5 font-medium">
                <Droplets className="size-4 text-sky-600" />
                <span>
                  Hidratação recomendada para {evaluationData.weight ? `${evaluationData.weight} kg` : 'o paciente'}: <strong>{evaluationData.waterRecommended} ml/dia</strong> (35 ml/kg)
                </span>
              </span>
              <button
                type="button"
                onClick={() => handleSelectWater(evaluationData.waterRecommended)}
                disabled={appliedWater}
                className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-sky-700 transition-colors cursor-pointer disabled:bg-sky-400 disabled:cursor-default"
              >
                {appliedWater ? <Check className="size-3" /> : null}
                <span>{appliedWater ? 'Hidratação Aplicada' : 'Aplicar Meta de Água'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
