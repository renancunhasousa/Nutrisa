import React from 'react';
import logoImg from '../../assets/logo_new.png';

/**
 * Cabeçalho padrão de laudo com logo e dados da nutricionista.
 *
 * @param {{ nutritionist: object, subtitle?: string }} props
 */
export default function ReportHeader({ nutritionist, subtitle = 'Laudo de Avaliação Física e Composição Corporal' }) {
  return (
    <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-teal-600 print:border-teal-700">
      <div className="flex items-center gap-3">
        <img src={logoImg} alt="NutrIsa" className="h-12 w-auto object-contain" />
        <div>
          <p className="text-[10px] font-bold text-teal-700 uppercase tracking-widest">{subtitle}</p>
          <p className="text-[9px] text-slate-500 mt-0.5">{nutritionist?.clinic || ''}</p>
        </div>
      </div>
      <div className="text-right text-[9px] text-slate-500 leading-relaxed">
        <p className="font-bold text-slate-700">{nutritionist?.name || ''}</p>
        <p>{nutritionist?.title || ''}</p>
        <p>{nutritionist?.crn || ''}</p>
        <p>{nutritionist?.phone || ''}</p>
      </div>
    </div>
  );
}
