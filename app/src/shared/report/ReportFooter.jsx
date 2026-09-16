import React from 'react';
import assinaturaImg from '../../assets/assinatura.png';

/**
 * Rodapé padrão de laudo com assinatura e endereço da clínica.
 *
 * @param {{ nutritionist: object, pageLabel?: string }} props
 */
export default function ReportFooter({ nutritionist, pageLabel = '' }) {
  return (
    <div className="a4-print-footer pt-2 border-t border-slate-200 mt-auto">
      <div className="flex items-end justify-between">
        <div className="text-[8px] text-slate-400 leading-relaxed">
          <p>{nutritionist?.clinic || ''}</p>
          <p>{nutritionist?.address || ''}</p>
          <p>{nutritionist?.email || ''}</p>
          {nutritionist?.instagram && <p>{nutritionist.instagram}</p>}
        </div>

        <div className="text-center">
          <img
            src={assinaturaImg}
            alt="Assinatura"
            className="h-10 w-auto object-contain mx-auto mb-0.5"
          />
          <div className="w-36 border-t border-slate-400 mx-auto" />
          <p className="text-[8px] text-slate-600 font-semibold mt-0.5">{nutritionist?.name || ''}</p>
          <p className="text-[7px] text-slate-500">{nutritionist?.crn || ''}</p>
        </div>

        {pageLabel && (
          <p className="text-[8px] text-slate-400 self-end">{pageLabel}</p>
        )}
      </div>
    </div>
  );
}
