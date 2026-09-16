import React from 'react';
import logoPdf from '../../../assets/logo.png';

import signatureImg from '../../../assets/assinatura.png';
import { User, ShieldCheck } from 'lucide-react';

import { useAvaliacaoContext } from '../AvaliacaoContext.jsx';

export default function ComposicaoPage() {
const { extractedData, getFinalValue, nutritionist } = useAvaliacaoContext();
return (<>            {/* LAUDO FINAL DE NUTRIÇÃO - ESTILO A4 IMPRESSÃO (PÁGINA 2) */}
            <div className="bg-white border border-slate-300 rounded-none md:rounded-xl shadow-lg p-6 md:p-10 text-slate-800 max-w-4xl mx-auto space-y-6 print:space-y-3 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none mt-8 print:mt-0 a4-print-page">
              
              {/* CABEÇALHO DA PÁGINA 2 */}
              <div className="border-b-2 border-emerald-800 pb-5 print:pb-3">
                <div className="flex flex-col md:flex-row justify-between items-start print:flex-row">
                  <div className="flex items-center space-x-3.5">
                    <img src={logoPdf} alt="Logo" className="w-12 h-12 object-contain flex-shrink-0" />
                    <div>
                      <h1 className="text-2xl print:text-lg font-black tracking-tight text-emerald-950 uppercase whitespace-nowrap truncate">{nutritionist.name}</h1>
                      <p className="text-xs print:text-[10px] font-semibold text-emerald-700 uppercase tracking-wider whitespace-nowrap truncate">{nutritionist.title}</p>
                      <p className="text-[11px] print:text-[9px] text-slate-500 mt-0.5 whitespace-nowrap truncate">{nutritionist.crn} • {nutritionist.clinic}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="inline-block bg-emerald-900 text-white text-[10px] print:text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                      Laudo de Avaliação Física Integrada
                    </span>
                    <p className="text-xs print:text-[10px] text-slate-500 mt-2 whitespace-nowrap">Data da Avaliação: <strong className="text-slate-800">{extractedData.patient.date}</strong></p>
                  </div>
                </div>

                <div className="mt-5 print:mt-3 grid grid-cols-2 md:grid-cols-4 print:grid-cols-4 gap-3 print:gap-2 bg-slate-50 p-3 print:p-2 rounded-lg border border-slate-200 text-xs">
                  <div className="min-w-0">
                    <span className="text-slate-400 uppercase text-[9px] font-bold block whitespace-nowrap">Paciente</span>
                    <strong className="text-slate-900 text-sm print:text-xs font-bold block truncate whitespace-nowrap" title={extractedData.patient.name}>{extractedData.patient.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[9px] font-bold block">Idade / Gênero</span>
                    <span className="text-slate-800 font-medium">{extractedData.patient.age} • {extractedData.patient.gender}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[9px] font-bold block">Estatura / Peso</span>
                    <span className="text-slate-800 font-medium">{extractedData.patient.height} • {extractedData.patient.weight}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[9px] font-bold block">IMC Calculado</span>
                    <span className="text-slate-800 font-bold">
                      {getFinalValue(extractedData.metrics.find(m => m.key === 'bmi') || {})} kg/m²
                    </span>
                  </div>
                </div>
              </div>

              {/* DETALHAMENTO DE DOBRAS E CIRCUNFERÊNCIAS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-3 pt-1">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 border-b border-slate-200 pb-0.5">
                    Dobras Cutâneas (mm) • Antropometria
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs print:text-[9px]">
                    {extractedData.skinfolds.map((s, idx) => (
                      <div key={idx} className="flex justify-between py-1 print:py-0 border-b border-slate-100">
                        <span className="text-slate-600">{s.site}</span>
                        <strong className="text-slate-800">{s.value} mm</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 border-b border-slate-200 pb-0.5">
                    Circunferências Corporais (cm)
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs print:text-[9px]">
                    {extractedData.circumferences.map((c, idx) => (
                      <div key={idx} className="flex justify-between py-1 print:py-0 border-b border-slate-100">
                        <span className="text-slate-600">{c.site}</span>
                        <strong className="text-slate-800">{c.value} cm</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ANÁLISE VISUAL SEGMENTAR (ESTILO AVABIO COM LINHAS DE CONEXÃO) */}
              {(() => {
                const seg = extractedData.segmental || {};
                
                return (
                  <div className="bg-slate-50 p-4 print:p-2.5 rounded-xl border border-slate-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 print:mb-1 border-b border-slate-200 pb-1.5 gap-1">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center">
                          <User className="w-4 h-4 mr-1.5 text-emerald-700" />
                          Análise Segmentar de Massa Magra e Gordura
                        </h3>
                        <p className="text-[10px] print:text-[8.5px] text-slate-500">Distribuição quantitativa de tecido magro e adiposo por membro corporal</p>
                      </div>
                    </div>

                    <div className="relative flex flex-col md:flex-row print:flex-row items-center justify-between gap-3 print:gap-2 py-1 print:py-0">
                      
                      {/* COLUNA ESQUERDA: Braço Direito & Perna Direita */}
                      <div className="w-full md:w-5/12 print:w-5/12 space-y-3 print:space-y-1.5 z-10">
                        
                        {/* BRAÇO DIREITO */}
                        <div className="bg-white p-2.5 print:p-1.5 rounded-lg border-l-4 border-l-emerald-700 border border-slate-200 shadow-sm text-xs space-y-1 hover:shadow-md transition-shadow relative">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-0.5">
                            <strong className="text-emerald-950 font-bold uppercase text-[10px]">Braço Direito (BD)</strong>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-[10px] print:text-[9px]">
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                              <span className="text-[8.5px] uppercase font-bold text-emerald-800 block">Massa Magra</span>
                              <strong className="text-slate-900 text-sm print:text-xs">{seg?.rightArm?.leanMass ?? '—'} kg</strong>
                            </div>
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                              <span className="text-[8.5px] uppercase font-bold text-emerald-800 block">Gordura</span>
                              <strong className="text-slate-900 text-sm print:text-xs">{seg?.rightArm?.fatMass ?? '—'} kg</strong>
                            </div>
                          </div>
                        </div>

                        {/* PERNA DIREITA */}
                        <div className="bg-white p-2.5 print:p-1.5 rounded-lg border-l-4 border-l-emerald-700 border border-slate-200 shadow-sm text-xs space-y-1 hover:shadow-md transition-shadow relative">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-0.5">
                            <strong className="text-emerald-950 font-bold uppercase text-[10px]">Perna Direita (PD)</strong>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-[10px] print:text-[9px]">
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                              <span className="text-[8.5px] uppercase font-bold text-emerald-800 block">Massa Magra</span>
                              <strong className="text-slate-900 text-sm print:text-xs">{seg?.rightLeg?.leanMass ?? '—'} kg</strong>
                            </div>
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                              <span className="text-[8.5px] uppercase font-bold text-emerald-800 block">Gordura</span>
                              <strong className="text-slate-900 text-sm print:text-xs">{seg?.rightLeg?.fatMass ?? '—'} kg</strong>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* CENTRO: SILHUETA HUMANA COM LINHAS DE CONEXÃO E PONTOS DE APONTAMENTO */}
                      <div className="relative flex-shrink-0 flex items-center justify-center py-1 w-full md:w-2/12 print:w-2/12">
                        <div className="relative w-36 h-60 print:h-52 bg-gradient-to-b from-emerald-50/80 to-teal-50/50 rounded-2xl border border-emerald-200/80 flex items-center justify-center p-2 shadow-inner">
                          
                          {/* SVG Silhueta Humana com Linhas de Conexão Integradas */}
                          <svg className="w-full h-full text-emerald-800/80 drop-shadow-md relative z-10 overflow-visible" viewBox="0 0 100 200" fill="currentColor">
                            {/* Corpo Humano */}
                            <circle cx="50" cy="20" r="13" />
                            <rect x="46" y="32" width="8" height="8" rx="2" />
                            <path d="M 28 40 C 35 38, 65 38, 72 40 C 77 43, 76 75, 74 110 C 65 112, 35 112, 26 110 C 24 75, 23 43, 28 40 Z" />
                            <path d="M 24 42 C 20 52, 16 80, 14 108 C 12 114, 18 116, 21 110 C 23 88, 27 58, 28 48 Z" />
                            <path d="M 76 42 C 80 52, 84 80, 86 108 C 88 114, 82 116, 79 110 C 77 88, 73 58, 72 48 Z" />
                            <path d="M 28 112 C 32 112, 47 112, 47 140 L 45 185 C 44 192, 33 192, 34 185 L 31 140 C 29 125, 27 115, 28 112 Z" />
                            <path d="M 72 112 C 68 112, 53 112, 53 140 L 55 185 C 56 192, 67 192, 66 185 L 69 140 C 71 125, 73 115, 72 112 Z" />

                            {/* Linhas de Conexão Diretas (Ligando até o centro de cada membro) */}
                            <line x1="-25" y1="70" x2="20" y2="70" stroke="#059669" strokeWidth="1.5" strokeDasharray="3 2" />
                            <line x1="-25" y1="150" x2="38" y2="150" stroke="#059669" strokeWidth="1.5" strokeDasharray="3 2" />
                            <line x1="125" y1="45" x2="50" y2="75" stroke="#059669" strokeWidth="1.5" strokeDasharray="3 2" />
                            <line x1="125" y1="95" x2="80" y2="70" stroke="#059669" strokeWidth="1.5" strokeDasharray="3 2" />
                            <line x1="125" y1="150" x2="62" y2="150" stroke="#059669" strokeWidth="1.5" strokeDasharray="3 2" />

                            {/* Pontos de Apontamento nos membros */}
                            <circle cx="20" cy="70" r="4.5" className="fill-emerald-600 stroke-white stroke-2" />
                            <circle cx="80" cy="70" r="4.5" className="fill-emerald-600 stroke-white stroke-2" />
                            <circle cx="50" cy="75" r="5" className="fill-emerald-600 stroke-white stroke-2" />
                            <circle cx="38" cy="150" r="4.5" className="fill-emerald-600 stroke-white stroke-2" />
                            <circle cx="62" cy="150" r="4.5" className="fill-emerald-600 stroke-white stroke-2" />
                          </svg>
                        </div>
                      </div>

                      {/* COLUNA DIREITA: Tronco, Braço Esquerdo & Perna Esquerda */}
                      <div className="w-full md:w-5/12 print:w-5/12 space-y-3 print:space-y-1.5 z-10">
                        
                        {/* TRONCO */}
                        <div className="bg-white p-2.5 print:p-1.5 rounded-lg border-l-4 border-l-emerald-700 border border-slate-200 shadow-sm text-xs space-y-1 hover:shadow-md transition-shadow relative">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-0.5">
                            <strong className="text-emerald-950 font-bold uppercase text-[10px]">Tronco (TR)</strong>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-[10px] print:text-[9px]">
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                              <span className="text-[8.5px] uppercase font-bold text-emerald-800 block">Massa Magra</span>
                              <strong className="text-slate-900 text-sm print:text-xs">{seg?.trunk?.leanMass ?? '—'} kg</strong>
                            </div>
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                              <span className="text-[8.5px] uppercase font-bold text-emerald-800 block">Gordura</span>
                              <strong className="text-slate-900 text-sm print:text-xs">{seg?.trunk?.fatMass ?? '—'} kg</strong>
                            </div>
                          </div>
                        </div>

                        {/* BRAÇO ESQUERDO */}
                        <div className="bg-white p-2.5 print:p-1.5 rounded-lg border-l-4 border-l-emerald-700 border border-slate-200 shadow-sm text-xs space-y-1 hover:shadow-md transition-shadow relative">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-0.5">
                            <strong className="text-emerald-950 font-bold uppercase text-[10px]">Braço Esquerdo (BE)</strong>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-[10px] print:text-[9px]">
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                              <span className="text-[8.5px] uppercase font-bold text-emerald-800 block">Massa Magra</span>
                              <strong className="text-slate-900 text-sm print:text-xs">{seg?.leftArm?.leanMass ?? '—'} kg</strong>
                            </div>
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                              <span className="text-[8.5px] uppercase font-bold text-emerald-800 block">Gordura</span>
                              <strong className="text-slate-900 text-sm print:text-xs">{seg?.leftArm?.fatMass ?? '—'} kg</strong>
                            </div>
                          </div>
                        </div>

                        {/* PERNA ESQUERDA */}
                        <div className="bg-white p-2.5 print:p-1.5 rounded-lg border-l-4 border-l-emerald-700 border border-slate-200 shadow-sm text-xs space-y-1 hover:shadow-md transition-shadow relative">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-0.5">
                            <strong className="text-emerald-950 font-bold uppercase text-[10px]">Perna Esquerda (PE)</strong>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-[10px] print:text-[9px]">
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                              <span className="text-[8.5px] uppercase font-bold text-emerald-800 block">Massa Magra</span>
                              <strong className="text-slate-900 text-sm print:text-xs">{seg?.leftLeg?.leanMass ?? '—'} kg</strong>
                            </div>
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                              <span className="text-[8.5px] uppercase font-bold text-emerald-800 block">Gordura</span>
                              <strong className="text-slate-900 text-sm print:text-xs">{seg?.leftLeg?.fatMass ?? '—'} kg</strong>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* PARECER NUTRICIONAL DA DRA. ISABELA */}
              <div className="bg-slate-50 p-3 print:p-2 rounded-lg border border-slate-200 space-y-1 print:space-y-0.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-1 text-emerald-700" />
                  Diagnóstico e Parecer Nutricional Integrado
                </h4>
                <p className="text-xs print:text-[9.5px] text-slate-700 leading-relaxed italic">
                  "{extractedData.aiAnalysisText}"
                </p>
              </div>

              {/* RODAPÉ UNIFICADO DO LAUDO DA NUTRICIONISTA (PÁGINA 2) */}
              <div className="pt-8 print:pt-4 border-t border-slate-300 mt-8 print:mt-auto a4-print-footer">
                <div className="flex flex-col md:flex-row print:flex-row justify-between items-end text-center md:text-left print:text-left gap-4">
                  <div className="text-xs text-slate-500 space-y-0.5">
                    <p className="font-bold text-slate-800">{nutritionist.name}</p>
                    <p>{nutritionist.title} • {nutritionist.crn}</p>
                    <p>{nutritionist.address}</p>
                    <p>{nutritionist.phone} • {nutritionist.email}</p>
                  </div>
                  <div className="flex flex-col items-center md:items-end print:items-end space-y-1">
                    <div className="flex flex-col items-center md:items-end print:items-end">
                      <img 
                        src={signatureImg} 
                        alt="Assinatura da Nutricionista" 
                        className="h-18 md:h-20 w-auto object-contain drop-shadow-xs" 
                      />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-emerald-800">Página 2 de 4</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

</>);
}
