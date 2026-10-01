import React from 'react';
import { ArrowLeft, Printer, Droplets, Flame, Beef, Wheat, ShieldCheck } from 'lucide-react';
import logoPdf from '../../../assets/logo.png';
import signatureImg from '../../../assets/assinatura.png';
import { calculateMealTotals } from '../domain/nutritionCalculations.js';

export function DietReport({ plan, totals, nutritionist, onBack }) {
  const nut = nutritionist || {
    name: 'Dra. Isabela Muñoz',
    title: 'Nutricionista Clínica & Funcional',
    crn: 'CRN-3 12345/P',
    clinic: 'NutrIsa Clínica Integrada',
  };

  const formattedDate = new Date(plan.created_at || Date.now()).toLocaleDateString('pt-BR');

  return (
    <div className="space-y-6">
      
      {/* Top Toolbar (Oculta na Impressão) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap justify-between items-center gap-4 print:hidden max-w-4xl mx-auto">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center shadow-2xs active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Voltar ao Editor
          </button>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Plano alimentar diagramado para impressão e entrega ao paciente em PDF.
          </span>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-full shadow-sm hover:shadow transition-all flex items-center space-x-2 active:scale-95 cursor-pointer"
        >
          <Printer className="w-4 h-4 mr-1.5" />
          <span>Imprimir / Salvar em PDF</span>
        </button>
      </div>

      {/* PLANO ALIMENTAR FINAL - ESTILO A4 IMPRESSÃO */}
      <div className="bg-white border border-slate-300 rounded-none md:rounded-2xl shadow-xl p-6 sm:p-10 text-slate-800 max-w-4xl mx-auto space-y-6 print:space-y-4 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none">
        
        {/* CABEÇALHO CLÍNICO */}
        <div className="border-b-2 border-emerald-800 pb-5 print:pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start print:flex-row gap-4">
            <div className="flex items-center space-x-3.5">
              <img src={logoPdf} alt="Logo" className="w-12 h-12 object-contain shrink-0" />
              <div>
                <h1 className="text-xl sm:text-2xl print:text-lg font-black tracking-tight text-emerald-950 uppercase whitespace-nowrap">
                  {nut.name}
                </h1>
                <p className="text-xs print:text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">
                  {nut.title}
                </p>
                <p className="text-[11px] print:text-[9px] text-slate-500 mt-0.5">
                  {nut.crn} • {nut.clinic}
                </p>
              </div>
            </div>

            <div className="sm:text-right shrink-0">
              <span className="inline-block bg-emerald-900 text-white text-[10px] print:text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Plano Alimentar Individualizado
              </span>
              <p className="text-xs print:text-[10px] text-slate-500 mt-1.5">
                Emissão: <strong className="text-slate-800">{formattedDate}</strong>
              </p>
            </div>
          </div>

          {/* Dados do Paciente e Metas */}
          <div className="mt-5 print:mt-3 grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-3 print:gap-2 bg-slate-50 p-3 print:p-2 rounded-xl border border-slate-200 text-xs">
            <div className="min-w-0">
              <span className="text-slate-400 uppercase text-[9px] font-bold block">Paciente</span>
              <strong className="text-slate-900 text-sm print:text-xs font-bold block truncate">
                {plan.patient_name || 'Paciente'}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[9px] font-bold block">Objetivo</span>
              <span className="text-slate-800 font-semibold">{plan.objective || 'Emagrecimento'}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[9px] font-bold block">Meta Calórica</span>
              <span className="text-slate-800 font-bold">{plan.target_calories} kcal</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[9px] font-bold block">Meta de Água</span>
              <span className="text-teal-700 font-bold flex items-center gap-1">
                <Droplets className="w-3 h-3" /> {plan.water_intake_ml || 2500} ml/dia
              </span>
            </div>
          </div>

          {/* Resumo de Macronutrientes Realizados */}
          <div className="mt-3 p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex flex-wrap items-center justify-between text-xs text-emerald-950 font-semibold gap-2">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-emerald-700" />
              <span>Total Diário Calculado: <strong>{totals.calories} kcal</strong></span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span>Proteínas: <strong>{totals.protein}g</strong> ({totals.percentages?.protein || 0}%)</span>
              <span>•</span>
              <span>Carboidratos: <strong>{totals.carbs}g</strong> ({totals.percentages?.carbs || 0}%)</span>
              <span>•</span>
              <span>Gorduras: <strong>{totals.fat}g</strong> ({totals.percentages?.fat || 0}%)</span>
            </div>
          </div>
        </div>

        {/* LISTAGEM DAS REFEIÇÕES */}
        <div className="space-y-4 print:space-y-3">
          {(plan.meals || []).map((meal, idx) => {
            const mTotals = calculateMealTotals(meal.items || []);
            return (
              <div 
                key={meal.id || idx}
                className="border border-slate-200 rounded-xl overflow-hidden print:border-slate-300 break-inside-avoid"
              >
                {/* Cabeçalho da refeição */}
                <div className="bg-slate-100/80 px-4 py-2 flex items-center justify-between border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-700 text-white text-[11px] font-black px-2 py-0.5 rounded-md">
                      {meal.time || '08:00'}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      {meal.title}
                    </h3>
                  </div>

                  <div className="text-[11px] font-semibold text-slate-500">
                    {mTotals.calories} kcal • P: {mTotals.protein}g • C: {mTotals.carbs}g • G: {mTotals.fat}g
                  </div>
                </div>

                {/* Itens e alimentos */}
                <div className="p-3 sm:p-4 space-y-2.5">
                  {meal.items && meal.items.length > 0 ? (
                    <ul className="space-y-1.5 text-xs">
                      {meal.items.map((item, itemIdx) => (
                        <li key={item.id || itemIdx} className="border-b border-slate-100 pb-1.5 last:border-b-0 last:pb-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-semibold text-slate-900">
                              • {item.quantity} {item.unit !== 'g' && item.unit !== 'ml' ? item.unit : ''} {item.name}
                              {item.unit !== 'g' && item.nutrition_snapshot?.grams ? ` (${item.nutrition_snapshot.grams}g)` : (item.unit === 'g' ? 'g' : '')}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium shrink-0">
                              {item.nutrition_snapshot?.calories} kcal
                            </span>
                          </div>

                          {/* Substituições disponíveis */}
                          {item.substitutions && item.substitutions.length > 0 && (
                            <div className="ml-4 mt-0.5 space-y-0.5 text-[11px] text-teal-800">
                              {item.substitutions.map((sub, sIdx) => (
                                <div key={sIdx} className="italic">
                                  ↳ <em>Substituição:</em> {sub.quantity} {sub.unit} de {sub.name}
                                </div>
                              ))}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Nenhum alimento prescrito para este horário.</p>
                  )}

                  {/* Observação específica da refeição */}
                  {meal.notes && (
                    <div className="mt-2 p-2 bg-amber-50/60 rounded-lg border border-amber-100 text-[11px] text-amber-900">
                      <strong>Orientação do horário:</strong> {meal.notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ORIENTAÇÕES GERAIS E RECADOS */}
        {plan.general_notes && (
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 break-inside-avoid space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              Orientações Complementares e Estilo de Vida
            </h4>
            <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
              {plan.general_notes}
            </p>
          </div>
        )}

        {/* RODAPÉ DO LAUDO COM ASSINATURA */}
        <div className="pt-6 border-t-2 border-slate-200 flex flex-col sm:flex-row justify-between items-center break-inside-avoid gap-4">
          <div className="text-xs text-slate-500">
            <p className="font-semibold text-slate-700">{nut.clinic}</p>
            <p className="text-[10px]">NutrIsa Platform • Documento emitido eletronicamente</p>
          </div>

          <div className="flex flex-col items-center">
            <img src={signatureImg} alt="Assinatura" className="h-12 object-contain" />
            <span className="text-xs font-bold text-slate-800">{nut.name}</span>
            <span className="text-[10px] text-slate-500 font-semibold">{nut.crn}</span>
          </div>
        </div>

      </div>

    </div>
  );
}
