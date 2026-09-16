import React from 'react';
import logoPdf from '../../../assets/logo.png';

import signatureImg from '../../../assets/assinatura.png';
import { Scale, Zap } from 'lucide-react';

import { useAvaliacaoContext } from '../AvaliacaoContext.jsx';

export default function ResumoPage() {
const { extractedData, biaEquipment, anthropometricMethod, getFinalValue, nutritionist } = useAvaliacaoContext();
return (<>            {/* LAUDO FINAL DE NUTRIÇÃO - ESTILO A4 IMPRESSÃO (PÁGINA 1) */}
            <div className="bg-white border border-slate-300 rounded-none md:rounded-xl shadow-lg p-6 md:p-10 text-slate-800 max-w-4xl mx-auto space-y-6 print:space-y-3 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none a4-print-page">
              
              {/* CABEÇALHO DO LAUDO */}
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

                {/* Patient Information & Methods Badge Header */}
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

                {/* MANDATORY REQUIREMENT: BIA Equipment & Anthropometric Method Banner */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-2 text-xs">
                  <div className="bg-teal-50/80 border border-teal-200 p-2.5 print:p-2 rounded-md flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-teal-700 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-teal-800 block leading-tight">Bioimpedância Utilizada:</span>
                        <strong className="text-teal-950 font-semibold">{biaEquipment}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50/80 border border-emerald-200 p-2.5 print:p-2 rounded-md flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Scale className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-800 block leading-tight">Método Antropométrico:</span>
                        <strong className="text-emerald-950 font-semibold">{anthropometricMethod}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* VISUAL BODY COMPOSITION SUMMARY (GRAPH & METRICS) - IPHONE GLASS TILES */}
              <div className="space-y-3 print:space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-l-2 border-emerald-600 pl-2">
                    Resumo da Composição Corporal Selecionada
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 print:hidden">
                    💎 Indicadores Chave
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 print:gap-2">
                  {/* 1. % Gordura Card */}
                  {(() => {
                    const m = extractedData.metrics.find(x => x.key === 'fatPercentage');
                    const val = m ? getFinalValue(m) : 0;
                    return (
                      <div className="bg-white p-3 print:p-2 rounded-2xl border border-slate-200 shadow-xs text-center transition-all hover:shadow-md">
                        <span className="text-[10px] print:text-[8.5px] uppercase font-extrabold text-emerald-800 block tracking-wider truncate">
                          % Gordura (%G)
                        </span>
                        <span className="text-2xl print:text-lg font-black text-emerald-900 block my-1">{val}%</span>
                        <span className="text-[10px] print:text-[8px] font-medium text-slate-500 bg-slate-50 py-0.5 px-2 rounded-full inline-block border border-slate-200/60">
                          Ideal: {m?.idealMin}% - {m?.idealMax}%
                        </span>
                      </div>
                    );
                  })()}

                  {/* 2. Massa Livre de Gordura (Massa Magra) Card */}
                  {(() => {
                    const m = extractedData.metrics.find(x => x.key === 'leanMass');
                    const val = m ? getFinalValue(m) : 0;
                    return (
                      <div className="bg-white p-3 print:p-2 rounded-2xl border border-slate-200 shadow-xs text-center transition-all hover:shadow-md">
                        <span className="text-[10px] print:text-[8.5px] uppercase font-extrabold text-slate-700 block tracking-wider truncate">
                          Massa Magra / Livre
                        </span>
                        <span className="text-2xl print:text-lg font-black text-slate-900 block my-1">{val} kg</span>
                        <span className="text-[10px] print:text-[8px] font-medium text-slate-500 bg-slate-50 py-0.5 px-2 rounded-full inline-block border border-slate-200/60">
                          Ideal: {m?.idealMin}kg - {m?.idealMax}kg
                        </span>
                      </div>
                    );
                  })()}

                  {/* 3. TMB Card */}
                  {(() => {
                    const m = extractedData.metrics.find(x => x.key === 'bmr');
                    const val = m ? getFinalValue(m) : 0;
                    return (
                      <div className="bg-white p-3 print:p-2 rounded-2xl border border-slate-200 shadow-xs text-center transition-all hover:shadow-md">
                        <span className="text-[10px] print:text-[8.5px] uppercase font-extrabold text-amber-800 block tracking-wider truncate">
                          Taxa Metabólica (TMB)
                        </span>
                        <span className="text-2xl print:text-lg font-black text-amber-900 block my-1">{val} kcal</span>
                        <span className="text-[10px] print:text-[8px] font-medium text-amber-800/80 bg-slate-50 py-0.5 px-2 rounded-full inline-block border border-slate-200/60">
                          Ideal: {m?.idealMin || 1200} - {m?.idealMax || 1500}
                        </span>
                      </div>
                    );
                  })()}

                  {/* 4. Idade Metabólica Card */}
                  {(() => {
                    const m = extractedData.metrics.find(x => x.key === 'metabolicAge');
                    const val = m ? getFinalValue(m) : (extractedData.patient?.age ? parseInt(extractedData.patient.age) : 31);
                    return (
                      <div className="bg-white p-3 print:p-2 rounded-2xl border border-slate-200 shadow-xs text-center transition-all hover:shadow-md">
                        <span className="text-[10px] print:text-[8.5px] uppercase font-extrabold text-indigo-800 block tracking-wider truncate">
                          Idade Metabólica
                        </span>
                        <span className="text-2xl print:text-lg font-black text-indigo-900 block my-1">{val} anos</span>
                        <span className="text-[10px] print:text-[8px] font-medium text-indigo-800/80 bg-slate-50 py-0.5 px-2 rounded-full inline-block border border-slate-200/60">
                          Cronológica: {extractedData.patient?.age || '31 anos'}
                        </span>
                      </div>
                    );
                  })()}

                  {/* 5. Gordura Visceral Card */}
                  {(() => {
                    const m = extractedData.metrics.find(x => x.key === 'visceralFatLevel');
                    const val = m ? getFinalValue(m) : 0;
                    return (
                      <div className="bg-white p-3 print:p-2 rounded-2xl border border-slate-200 shadow-xs text-center transition-all hover:shadow-md">
                        <span className="text-[10px] print:text-[8.5px] uppercase font-extrabold text-rose-800 block tracking-wider truncate">
                          Gordura Visceral
                        </span>
                        <span className="text-2xl print:text-lg font-black text-rose-900 block my-1">Nível {val}</span>
                        <span className="text-[10px] print:text-[8px] font-medium text-rose-800/80 bg-slate-50 py-0.5 px-2 rounded-full inline-block border border-slate-200/60">
                          Faixa Ideal: {m?.idealMin || 1} a {m?.idealMax || 9}
                        </span>
                      </div>
                    );
                  })()}

                  {/* 6. Água Corporal Total Card */}
                  {(() => {
                    const m = extractedData.metrics.find(x => x.key === 'totalBodyWater');
                    const val = m ? getFinalValue(m) : 0;
                    return (
                      <div className="bg-white p-3 print:p-2 rounded-2xl border border-slate-200 shadow-xs text-center transition-all hover:shadow-md">
                        <span className="text-[10px] print:text-[8.5px] uppercase font-extrabold text-cyan-800 block tracking-wider truncate">
                          Água Corporal (ACT)
                        </span>
                        <span className="text-2xl print:text-lg font-black text-cyan-900 block my-1">{val} L</span>
                        <span className="text-[10px] print:text-[8px] font-medium text-cyan-800/80 bg-slate-50 py-0.5 px-2 rounded-full inline-block border border-slate-200/60">
                          Ideal: {m?.idealMin}L - {m?.idealMax}L
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* TABELA DETALHADA UNIFICADA */}
              <div className="space-y-3 print:space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-l-2 border-emerald-700 pl-2">
                  Tabela Integrada de Parâmetros
                </h3>

                <table className="w-full text-xs print:text-[10px] text-left border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 uppercase text-[10px] print:text-[8px]">
                      <th className="p-2.5 print:py-1 print:px-1.5 font-bold border-r border-slate-200">Parâmetro Avaliado</th>
                      <th className="p-2.5 print:py-1 print:px-1.5 font-bold border-r border-slate-200 text-center">Fonte Selecionada</th>
                      <th className="p-2.5 print:py-1 print:px-1.5 font-bold border-r border-slate-200 text-center">Faixa de Referência</th>
                      <th className="p-2.5 print:py-1 print:px-1.5 font-bold text-right">Resultado Obtido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {extractedData.metrics.map((m) => {
                      const finalVal = getFinalValue(m);
                      const isAdipometry = m.selected === 'adipometry';
                      return (
                        <tr key={m.key} className="hover:bg-slate-50">
                          <td className="p-2.5 print:py-1 print:px-1.5 font-medium text-slate-800 border-r border-slate-200">
                            {m.title}
                          </td>
                          <td className="p-2.5 print:py-1 print:px-1.5 text-center border-r border-slate-200">
                            <span className={`text-[10px] print:text-[8px] font-semibold px-2 py-0.5 rounded ${
                              isAdipometry 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : m.selected === 'custom' 
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-teal-100 text-teal-800'
                            }`}>
                              {isAdipometry ? 'Adipometria' : m.selected === 'custom' ? 'Manual' : 'Bioimpedância'}
                            </span>
                          </td>
                          <td className="p-2.5 print:py-1 print:px-1.5 text-center text-slate-500 border-r border-slate-200">
                            {m.idealMin} - {m.idealMax} {m.unit}
                          </td>
                          <td className="p-2.5 print:py-1 print:px-1.5 text-right font-bold text-slate-900">
                            {finalVal} {m.unit}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* NOTA EXPLICATIVA SOBRE A ORIGEM DOS VALORES E METODOLOGIA INTEGRADA */}
              <div className="bg-slate-50/90 border border-slate-200/80 rounded-lg p-2 print:p-1.5 text-[9px] print:text-[7.5px] text-slate-600 leading-snug space-y-0.5">
                <p>
                  🔬 <strong>Metodologia e Cálculo do Laudo:</strong> Os resultados deste laudo integram medições diretas da <strong>Bioimpedância Octapolar AvaBio 380</strong> (que analisa a resistência e reatância celular para quantificar água, massa livre e taxa metabólica) combinadas à <strong>Adipometria Clínica</strong> pelo protocolo de <em>Jackson & Pollock (7 Dobras)</em>, que afere com precisão milimétrica a gordura subcutânea.
                </p>
                <p>
                  📚 <strong>Referências e Faixas Ideais:</strong> As faixas de normalidade são personalizadas para o gênero, idade e biotipo do paciente, baseadas nos consensos da <strong>OMS/WHO</strong> (classificação de IMC e risco cardiometabólico), <strong>ACSM</strong> (diretrizes de percentual de gordura) e equações científicas validadas contra o padrão-ouro DXA (Densitometria de Dupla Energia).
                </p>
              </div>

              {/* RODAPÉ UNIFICADO DO LAUDO DA NUTRICIONISTA (PÁGINA 1) */}
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
                      <p className="text-[10px] font-bold text-emerald-800">Página 1 de 4</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

</>);
}
