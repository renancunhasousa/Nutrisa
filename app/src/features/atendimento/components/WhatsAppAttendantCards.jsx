import React from 'react';
import { 
  Clock, 
  CheckCircle2,
  XCircle,
  Timer,
  Stethoscope,
  Headset,
} from 'lucide-react';
import { formatWaitTime } from '../../../shared/utils/formatters.js';
import { evaluateSecretaryGoals } from '../domain/metrics.js';
import { getOwnerShortLabel, formatDoctorShortName } from '../../configuracoes/services/clinicProfileService.js';

function GoalStatusGrid({ goals }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {goals.map((goal) => (
        <div
          key={goal.meta}
          className="flex min-w-0 flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4"
        >
          <span className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            {goal.meta}
          </span>
          <p className="mt-2 text-[10.5px] font-medium leading-snug text-slate-600">
            {goal.detalhe}
          </p>
          <div className="mt-3 flex items-center justify-between gap-2">
            {goal.atingido ? (
              <CheckCircle2 className="size-6 shrink-0 text-emerald-600" aria-hidden="true" />
            ) : (
              <XCircle className="size-6 shrink-0 text-rose-600" aria-hidden="true" />
            )}
            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold whitespace-nowrap ${
              goal.atingido
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}>
              {goal.atingido ? 'Dentro da meta' : 'Fora da meta'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function QueueSummary({ count }) {
  return (
    <div className="mt-6 border-t border-slate-100 pt-4">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Clock className="size-4 shrink-0 text-slate-500" aria-hidden="true" />
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
            Itens na fila
          </span>
        </div>
        <span className={`text-2xl font-black ${count > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
          {count}
        </span>
      </div>
    </div>
  );
}

export default function WhatsAppAttendantCards({ comparisonStats }) {
  const secretaryGoals = evaluateSecretaryGoals(comparisonStats).avaliacaoMetas;
  const ownerLabel = getOwnerShortLabel();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* CARD DRA. ISABELA */}
      <div className="bg-white rounded-3xl p-6 md:p-7 border border-slate-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <Stethoscope className="size-6 shrink-0 text-teal-600" aria-hidden="true" />
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">{ownerLabel}</h3>
                <span className="text-xs font-semibold text-teal-600 block mt-0.5">
                  Atendimento Clínico • Primário & Web
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-teal-600 block">
                {comparisonStats.isabela.total}
              </span>
              <span className="text-[10px] block text-slate-400 uppercase font-bold tracking-wider">
                {comparisonStats.totalAnswered > 0 ? Math.round((comparisonStats.isabela.total / comparisonStats.totalAnswered) * 100) : 0}% das respostas
              </span>
            </div>
          </div>

          {/* Grid de Tempos SLA da Dra. Isabela */}
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 block flex items-center justify-center tracking-wider">
                <Clock className="w-3 h-3 mr-1 text-slate-400" /> Média
              </span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {formatWaitTime(comparisonStats.isabela.avg)}
              </span>
              <span className="text-[9.5px] font-semibold text-slate-600 bg-slate-200/60 px-2 py-0.5 rounded-full inline-block mt-1">
                {comparisonStats.isabela.fastRate}% em até 15m
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 block flex items-center justify-center tracking-wider">
                <Timer className="w-3 h-3 mr-1 text-slate-400" /> Máximo
              </span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {formatWaitTime(comparisonStats.isabela.max)}
              </span>
              <span className="text-[9.5px] text-slate-500 font-medium block mt-1">Mais demorada</span>
            </div>
          </div>

        </div>

        <QueueSummary count={comparisonStats.isabela.pendingCount} />
      </div>

      {/* CARD SECRETÁRIA */}
      <div className="bg-white rounded-3xl p-6 md:p-7 border border-slate-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <Headset className="size-6 shrink-0 text-purple-600" aria-hidden="true" />
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">Equipe / Secretária</h3>
                <span className="text-xs font-semibold text-purple-600 block mt-0.5">
                  Recepção & Agendamentos • Celular 2
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-purple-600 block">
                {comparisonStats.secretaria.total}
              </span>
              <span className="text-[10px] block text-slate-400 uppercase font-bold tracking-wider">
                {comparisonStats.totalAnswered > 0 ? Math.round((comparisonStats.secretaria.total / comparisonStats.totalAnswered) * 100) : 0}% das respostas
              </span>
            </div>
          </div>

          {/* Grid de Tempos SLA da Secretária */}
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 block flex items-center justify-center tracking-wider">
                <Clock className="w-3 h-3 mr-1 text-slate-400" /> Média
              </span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {formatWaitTime(comparisonStats.secretaria.avg)}
              </span>
              <span className="text-[9.5px] font-semibold text-slate-600 bg-slate-200/60 px-2 py-0.5 rounded-full inline-block mt-1">
                {comparisonStats.secretaria.fastRate}% em até 15m
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 block flex items-center justify-center tracking-wider">
                <Timer className="w-3 h-3 mr-1 text-slate-400" /> Máximo
              </span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {formatWaitTime(comparisonStats.secretaria.max)}
              </span>
              <span className="text-[9.5px] text-slate-500 font-medium block mt-1">Mais demorada</span>
            </div>
          </div>

        </div>

        <QueueSummary count={comparisonStats.secretaria.pendingCount} />
      </div>
      </div>

      {comparisonStats.responderBreakdown?.length ? (
        <section aria-labelledby="identified-responders-title" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs md:p-7">
          <h3 id="identified-responders-title" className="text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">Respostas identificadas por usuário</h3>
          <p className="mt-1 text-xs text-slate-500">Mensagens enviadas diretamente pela NutrIsa, separadas pelo usuário autenticado.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {comparisonStats.responderBreakdown.map((responder) => (
              <li key={responder.userId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <strong className="block truncate text-sm text-slate-900">
                  {responder.type === 'isabela' || responder.role === 'owner' ? formatDoctorShortName(responder.name) : responder.name}
                </strong>
                <span className="mt-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">{responder.type}</span>
                <span className="mt-3 block text-2xl font-black text-emerald-700">{responder.total}</span>
                <span className="text-[10px] text-slate-500">respostas no período</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="indicator-status-title" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs md:p-7">
        <h3 id="indicator-status-title" className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
          <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden="true" />
          Status dos indicadores
        </h3>
        <p className="text-xs text-slate-500">Acompanhamento consolidado em relação às metas definidas</p>
        <GoalStatusGrid goals={secretaryGoals} />
      </section>
    </div>
  );
}
