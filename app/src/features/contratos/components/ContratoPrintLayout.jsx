import React from 'react';
import logoPdf from '../../../assets/logo.png';
import assinaturaDra from '../../../assets/assinatura.png';
import {
  DRA_ISABELA_PROFILE,
  EMPTY_CLINIC_PROFILE,
  isDraIsabelaProfile,
  isDraIsabelaOrganization
} from '../../configuracoes/defaultProfile';
import { replaceContractVariables } from '../domain/contractVariables';

const chunkText = (text, limit) => {
  if (!text) return [];
  const words = text.split(/(\s+)/);
  const chunks = [];
  let current = "";
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (current.length + word.length > limit && current.trim().length > 0) {
      chunks.push(current.trim());
      current = word.trimStart();
    } else {
      current += word;
    }
  }
  if (current.trim().length > 0) {
    chunks.push(current.trim());
  }
  return chunks;
};

export function ContratoPrintLayout({ paciente, plano, valor, formaPagamento, consultas, assinaturaBase64, pages, content, preview = false, nutritionist, organizationId }) {
  const dataAtual = new Date().toLocaleDateString('pt-BR');

  const currentNutritionist = nutritionist || (() => {
    try {
      const saved = localStorage.getItem('nutrisa_nutritionist_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  })();

  const isDra = isDraIsabelaProfile(currentNutritionist) || isDraIsabelaOrganization(currentNutritionist?.organization_id);
  const fallback = isDra ? DRA_ISABELA_PROFILE : EMPTY_CLINIC_PROFILE;

  const resolvedName = currentNutritionist?.name || (isDra ? fallback.name : 'Nutricionista Responsável');
  const resolvedTitle = currentNutritionist?.title || (isDra ? fallback.title : 'Nutricionista');
  const resolvedCrn = currentNutritionist?.crn || (isDra ? fallback.crn : '');
  const resolvedClinic = currentNutritionist?.clinic || fallback.clinic || 'Consultório de Nutrição';
  const resolvedAddress = currentNutritionist?.address || (isDra ? fallback.address : '');
  const resolvedPhone = currentNutritionist?.phone || (isDra ? fallback.phone : '');
  const resolvedEmail = currentNutritionist?.email || (isDra ? fallback.email : '');

  // Normaliza: se receber `pages` (array de HTML), usa diretamente.
  // Se receber `content` (string legada), divide via chunkText para retrocompatibilidade.
  let pageContents;
  if (pages && Array.isArray(pages) && pages.length > 0) {
    pageContents = pages;
  } else {
    const chunks = chunkText(content || '', 1800);
    if (chunks.length === 0) chunks.push('');
    pageContents = chunks;
  }

  return (
    <div className="w-full space-y-8 print:space-y-0">
      {pageContents.map((chunk, index) => {
        const isLastPage = index === pageContents.length - 1;
        const pageNumber = index + 1;
        const totalPages = pageContents.length;

        return (
          <div key={index} className={`
            a4-print-page font-sans text-[12px] leading-relaxed
            ${preview
              ? 'w-full bg-white border border-slate-300 rounded-none md:rounded-xl shadow-lg p-6 md:p-10 max-w-4xl mx-auto mb-8 min-h-[297mm] flex flex-col print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none'
              : 'hidden print:block print:bg-white'
            }
          `}>
      {/* Removido style local porque a4-print-page já lida com a página e margens */}
      
      {/* CABEÇALHO PRINCIPAL (Estilo Avaliação) - Repetido em todas as páginas */}
      <div className="border-b-2 border-emerald-800 pb-5 print:pb-3 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start print:flex-row">
          <div className="flex items-center space-x-3.5">
            <img src={currentNutritionist?.logoUrl || logoPdf} alt={resolvedClinic || 'Logo'} className="w-12 h-12 object-contain flex-shrink-0" />
            <div>
              <h1 className="text-2xl print:text-lg font-black tracking-tight text-emerald-950 uppercase whitespace-nowrap truncate">
                {resolvedName}
              </h1>
              <p className="text-xs print:text-[10px] font-semibold text-emerald-700 uppercase tracking-wider whitespace-nowrap truncate">
                {resolvedTitle}
              </p>
              <p className="text-[11px] print:text-[9px] text-slate-500 mt-0.5 whitespace-nowrap truncate">
                {resolvedCrn ? `${resolvedCrn} • ` : ''}{resolvedClinic}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0 mt-4 md:mt-0 print:mt-0">
            <span className="inline-block bg-emerald-900 text-white text-[10px] print:text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
              Termo de Adesão e Acordo
            </span>
            <p className="text-xs print:text-[10px] text-slate-500 mt-2 whitespace-nowrap">
              Data do Contrato: <strong className="text-slate-800">{dataAtual}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* CAIXA DE DADOS DO PACIENTE E PLANO (Apenas na 1ª página) */}
      {index === 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 grid grid-cols-4 gap-4">
          <div>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase mb-0.5">Paciente</p>
            <p className="text-slate-800 font-bold text-[12px] truncate">{paciente?.name || '___________________________'}</p>
          </div>
          <div>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase mb-0.5">Plano Contratado</p>
            <p className="text-slate-800 font-bold text-[12px] truncate">{plano?.toUpperCase() || '_____________'}</p>
          </div>
          <div>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase mb-0.5">Valor Total</p>
            <p className="text-slate-800 font-bold text-[12px]">R$ {valor || '0,00'}</p>
          </div>
          <div>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase mb-0.5">Pagamento</p>
            <p className="text-slate-800 font-bold text-[12px] truncate">{formaPagamento || '__________________'}</p>
          </div>
        </div>
      )}



      {/* CLÁUSULAS (Conteúdo Gerado/Editado) */}
      <div 
        className="space-y-4 text-justify text-[13px] text-slate-800 leading-relaxed mb-6 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-600 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-slate-900 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-extrabold [&_h3]:text-slate-900 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_li]:mb-1 [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic [&_u]:underline" 
        dangerouslySetInnerHTML={{ __html: replaceContractVariables(chunk, { paciente, plano, valor, formaPagamento, consultas, dataAtual, nutritionist: currentNutritionist, organizationId: currentNutritionist?.organization_id || organizationId }) }} 
      />

      {/* APENAS NA ÚLTIMA PÁGINA: CONSULTAS E ASSINATURAS */}
      {isLastPage && (
        <>
          {/* CONSULTAS PREVISTAS (Se houver) */}
          {consultas && consultas.length > 0 && consultas[0].data !== '' && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6">
              <p className="text-[10px] font-extrabold text-emerald-800 uppercase mb-2">Cronograma de Consultas Previstas</p>
              <div className="grid grid-cols-3 gap-2">
                {consultas.map((c, i) => (
                  <div key={i} className="text-[11px] text-emerald-900 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <strong>{i + 1}ª Consulta:</strong> {c.data ? new Date(c.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '___/___/___'} {c.horario ? `às ${c.horario}` : ''}
                  </div>
                ))}
              </div>
            </div>
          )}

      {/* BLOCO DE ASSINATURAS DO CONTRATO */}
      <div className="mt-16 pt-8 break-inside-avoid">
        <div className="flex justify-between items-end">
          <div className="w-1/2 text-center">
            {assinaturaBase64 ? (
              <img src={assinaturaBase64} alt="Assinatura Paciente" className="h-16 mx-auto mb-2 object-contain" />
            ) : (
              <div className="h-16 border-b border-black mb-2 mx-auto w-3/4"></div>
            )}
            <p className="border-t border-slate-300 pt-2 uppercase text-[9px] mx-auto w-3/4 text-slate-500">
              Assinatura do(a) Paciente<br />
              <strong className="text-slate-800 text-[10px] mt-0.5 block">{paciente?.name || '___________________________'}</strong>
            </p>
          </div>

          <div className="w-1/2 text-center">
            <div className="h-16 mb-2 flex items-center justify-center">
              {currentNutritionist?.signatureUrl ? (
                <img src={currentNutritionist.signatureUrl} alt="Assinatura da Nutricionista" className="h-20 w-auto object-contain drop-shadow-xs scale-110" />
              ) : isDra ? (
                <img src={assinaturaDra} alt="Assinatura" className="h-20 w-auto object-contain drop-shadow-xs scale-110" />
              ) : (
                <div className="h-14 border-b border-black mb-2 mx-auto w-3/4"></div>
              )}
            </div>
            <p className="border-t border-slate-300 pt-2 uppercase text-[9px] mx-auto w-3/4 text-slate-500">
              Assinatura da Nutricionista<br />
              <strong className="text-slate-800 text-[10px] mt-0.5 block">{resolvedName}</strong>
            </p>
          </div>
        </div>
      </div>
        </>
      )}

      {/* RODAPÉ PADRÃO - Repetido em todas as páginas */}
      <div className="pt-8 print:pt-4 border-t border-slate-300 mt-auto a4-print-footer">
        <div className="flex flex-col md:flex-row print:flex-row justify-between items-end text-center md:text-left print:text-left gap-4">
          <div className="text-xs text-slate-500 space-y-0.5">
            <p className="font-bold text-slate-800">{resolvedName}</p>
            <p>{resolvedTitle}{resolvedCrn ? ` • ${resolvedCrn}` : ''}</p>
            {resolvedAddress && <p>{resolvedAddress}</p>}
            {(resolvedPhone || resolvedEmail) && (
              <p>{[resolvedPhone, resolvedEmail].filter(Boolean).join(' • ')}</p>
            )}
          </div>
          <div className="flex flex-col items-center md:items-end print:items-end space-y-1">
            <div className="text-right">
              <p className="text-[10px] font-bold text-emerald-800">Página {pageNumber} de {totalPages}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  })}
  </div>
  );
}
