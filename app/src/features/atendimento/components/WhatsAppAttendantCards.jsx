import React from 'react';
import { 
  Clock, 
  Zap, 
  Timer 
} from 'lucide-react';
import { formatWaitTime } from '../../../shared/utils/formatters.js';

export default function WhatsAppAttendantCards({ comparisonStats }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* CARD DRA. ISABELA (VERDE TIFFANY / TEAL) */}
      <div className="bg-white rounded-3xl p-6 md:p-7 border border-teal-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-teal-100">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-extrabold text-2xl shadow-2xs">
                👩‍⚕️
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">Dra. Isabela Muñoz</h3>
                <span className="text-[11px] text-teal-800 bg-teal-50 px-3 py-0.5 rounded-full font-bold border border-teal-200/70 inline-block mt-0.5">
                  Atendimento Clínico • Primário & Web
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-teal-700 block">
                {comparisonStats.isabela.total}
              </span>
              <span className="text-[10px] block text-slate-400 uppercase font-bold tracking-wider">
                {comparisonStats.totalAnswered > 0 ? Math.round((comparisonStats.isabela.total / comparisonStats.totalAnswered) * 100) : 0}% das respostas
              </span>
            </div>
          </div>

          {/* Grid de Tempos SLA da Dra. Isabela */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-teal-50/50 p-3.5 rounded-2xl border border-teal-100 text-center">
              <span className="text-[10px] font-extrabold uppercase text-teal-800 block flex items-center justify-center tracking-wider">
                <Clock className="w-3 h-3 mr-1 text-teal-600" /> Média
              </span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {formatWaitTime(comparisonStats.isabela.avg)}
              </span>
              <span className="text-[9.5px] font-semibold text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded-full inline-block mt-1">
                {comparisonStats.isabela.fastRate}% em até 15m
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
              <span className="text-[10px] font-extrabold uppercase text-slate-600 block flex items-center justify-center tracking-wider">
                <Zap className="w-3 h-3 mr-1 text-emerald-600" /> Mínimo
              </span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {formatWaitTime(comparisonStats.isabela.min)}
              </span>
              <span className="text-[9.5px] text-slate-500 font-medium block mt-1">Mais rápida</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
              <span className="text-[10px] font-extrabold uppercase text-slate-600 block flex items-center justify-center tracking-wider">
                <Timer className="w-3 h-3 mr-1 text-amber-600" /> Máximo
              </span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {formatWaitTime(comparisonStats.isabela.max)}
              </span>
              <span className="text-[9.5px] text-slate-500 font-medium block mt-1">Mais demorada</span>
            </div>
          </div>
        </div>

        {/* Top Categorias & Pendências da Dra. Isabela */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
              Principais Assuntos:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {comparisonStats.isabela.topCategories.slice(0, 3).map(c => (
                <span key={c.name} className="text-xs bg-slate-100 text-slate-800 font-medium border border-slate-200 px-2.5 py-1 rounded-xl">
                  {c.name}: <strong>{c.count}</strong>
                </span>
              ))}
              {comparisonStats.isabela.topCategories.length === 0 && (
                <span className="text-xs text-slate-400 italic">Nenhum registro no período</span>
              )}
            </div>
          </div>

          {/* Badges de Fila & Intervenções */}
          <div className="flex sm:flex-col gap-2 items-start sm:items-end">
            <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold border flex items-center shadow-2xs ${
              comparisonStats.isabela.pendingCount > 0 
                ? 'bg-rose-50 text-rose-800 border-rose-200' 
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              ⏳ {comparisonStats.isabela.pendingCount} Clínicas na Fila
            </span>
            {comparisonStats.isabelaInterventions > 0 && (
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200" title="Mensagens de agendamento/financeiro que a Dra. Isabela respondeu diretamente">
                ⚡ {comparisonStats.isabelaInterventions} intervenções recepção
              </span>
            )}
          </div>
        </div>
      </div>

      {/* CARD SECRETÁRIA (ROXO / PURPLE) */}
      <div className="bg-white rounded-3xl p-6 md:p-7 border border-purple-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-purple-100">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 font-extrabold text-2xl shadow-2xs">
                💼
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">Equipe / Secretária</h3>
                <span className="text-[11px] text-purple-800 bg-purple-50 px-3 py-0.5 rounded-full font-bold border border-purple-200/70 inline-block mt-0.5">
                  Recepção & Agendamentos • Celular 2
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-purple-700 block">
                {comparisonStats.secretaria.total}
              </span>
              <span className="text-[10px] block text-slate-400 uppercase font-bold tracking-wider">
                {comparisonStats.totalAnswered > 0 ? Math.round((comparisonStats.secretaria.total / comparisonStats.totalAnswered) * 100) : 0}% das respostas
              </span>
            </div>
          </div>

          {/* Grid de Tempos SLA da Secretária */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-purple-50/50 p-3.5 rounded-2xl border border-purple-100 text-center">
              <span className="text-[10px] font-extrabold uppercase text-purple-800 block flex items-center justify-center tracking-wider">
                <Clock className="w-3 h-3 mr-1 text-purple-600" /> Média
              </span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {formatWaitTime(comparisonStats.secretaria.avg)}
              </span>
              <span className="text-[9.5px] font-semibold text-purple-700 bg-purple-100/60 px-2 py-0.5 rounded-full inline-block mt-1">
                {comparisonStats.secretaria.fastRate}% em até 15m
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
              <span className="text-[10px] font-extrabold uppercase text-slate-600 block flex items-center justify-center tracking-wider">
                <Zap className="w-3 h-3 mr-1 text-emerald-600" /> Mínimo
              </span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {formatWaitTime(comparisonStats.secretaria.min)}
              </span>
              <span className="text-[9.5px] text-slate-500 font-medium block mt-1">Mais rápida</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
              <span className="text-[10px] font-extrabold uppercase text-slate-600 block flex items-center justify-center tracking-wider">
                <Timer className="w-3 h-3 mr-1 text-amber-600" /> Máximo
              </span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {formatWaitTime(comparisonStats.secretaria.max)}
              </span>
              <span className="text-[9.5px] text-slate-500 font-medium block mt-1">Mais demorada</span>
            </div>
          </div>
        </div>

        {/* Top Categorias & Pendências da Secretária */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
              Principais Assuntos:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {comparisonStats.secretaria.topCategories.slice(0, 3).map(c => (
                <span key={c.name} className="text-xs bg-slate-100 text-slate-800 font-medium border border-slate-200 px-2.5 py-1 rounded-xl">
                  {c.name}: <strong>{c.count}</strong>
                </span>
              ))}
              {comparisonStats.secretaria.topCategories.length === 0 && (
                <span className="text-xs text-slate-400 italic">Nenhum registro no período</span>
              )}
            </div>
          </div>

          {/* Badges de Fila da Secretária */}
          <div className="flex sm:flex-col gap-2 items-start sm:items-end">
            <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold border flex items-center shadow-2xs ${
              comparisonStats.secretaria.pendingCount > 0 
                ? 'bg-rose-50 text-rose-800 border-rose-200' 
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              ⏳ {comparisonStats.secretaria.pendingCount} Recepção na Fila
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
