import React from 'react';
import logoPdf from '../../../assets/logo.png';

import signatureImg from '../../../assets/assinatura.png';
import { Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';

import { useAvaliacaoContext } from '../AvaliacaoContext.jsx';

export default function EvolucaoPage() {
const { extractedData, getFinalValue, buildComparativeData, nutritionist } = useAvaliacaoContext();
return (<>            {/* PÁGINA 3: HISTÓRICO DE EVOLUÇÃO E GRÁFICO COMPARATIVO */}
            <div className="bg-white border border-slate-300 rounded-none md:rounded-xl shadow-lg p-6 md:p-10 text-slate-800 max-w-4xl mx-auto space-y-5 print:space-y-2.5 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none mt-8 print:mt-0 a4-print-page">

              {/* CABEÇALHO DA PÁGINA 3 (IGUAL ÀS DEMAIS PÁGINAS) */}
              <div className="border-b-2 border-emerald-800 pb-4 print:pb-2">
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

                {/* Patient Info Header */}
                <div className="mt-4 print:mt-2 grid grid-cols-2 md:grid-cols-4 print:grid-cols-4 gap-3 print:gap-2 bg-slate-50 p-3 print:p-2 rounded-lg border border-slate-200 text-xs">
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

              {/* SEÇÃO 1: TABELA COMPARATIVA DE HISTÓRICO DE AVALIAÇÕES */}
              {(() => {
                const comparative = buildComparativeData();
                const pastCols = comparative.pastDates;
                const hasPastHistory = pastCols.length > 0;

                // Preparação dos dados do gráfico SVG dinâmico
                const pts = comparative.chartPoints;
                // Calculamos max e min para escala vertical inteligente
                const allValues = pts.flatMap(p => [p.weight, p.leanMass, p.fatMass]).filter(v => v > 0);
                const maxVal = allValues.length > 0 ? Math.max(...allValues) : 70;
                const minVal = allValues.length > 0 ? Math.min(...allValues) : 15;
                const topScale = Math.ceil(maxVal / 5) * 5 + 5;
                const bottomScale = Math.max(0, Math.floor(minVal / 5) * 5 - 5);
                const scaleRange = topScale - bottomScale || 1;

                // Dimensões SVG: largura 600, altura 160. Área útil y: 20 (topo) a 130 (base).
                const getY = (val) => {
                  if (!val || isNaN(val)) return 130;
                  const ratio = (val - bottomScale) / scaleRange;
                  const clampedRatio = Math.max(0, Math.min(1, ratio));
                  return 130 - clampedRatio * 105; // 25 a 130
                };

                // Posições horizontais X distribuídas
                const getX = (idx, total) => {
                  if (total === 1) return 300;
                  const startX = 90;
                  const endX = 540;
                  return startX + (idx / (total - 1)) * (endX - startX);
                };

                const weightPoints = pts.map((p, idx) => ({ x: getX(idx, pts.length), y: getY(p.weight), val: p.weight, date: p.date }));
                const leanPoints = pts.map((p, idx) => ({ x: getX(idx, pts.length), y: getY(p.leanMass), val: p.leanMass, date: p.date }));
                const fatPoints = pts.map((p, idx) => ({ x: getX(idx, pts.length), y: getY(p.fatMass), val: p.fatMass, date: p.date }));


                return (
                  <>
                    <div className="space-y-3 print:space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-l-2 border-emerald-700 pl-2">
                          Histórico Comparativo de Avaliações Físicas
                        </h3>
                        <span className="text-[10px] text-slate-500">
                          {hasPastHistory 
                            ? `Últimas ${pastCols.length + 1} Consultas • Variação Absoluta (Δ)` 
                            : "Consulta Atual • Variação Absoluta (Δ)"}
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs print:text-[10px] text-left border-collapse border border-slate-200">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 uppercase text-[10px] print:text-[8px]">
                              <th className="p-2 print:py-1 print:px-1.5 font-bold border-r border-slate-200">Parâmetro Avaliado</th>
                              {pastCols.map((d, i) => (
                                <th key={i} className="p-2 print:py-1 print:px-1.5 font-bold border-r border-slate-200 text-center">
                                  {d}
                                </th>
                              ))}
                              <th className="p-2 print:py-1 print:px-1.5 font-bold border-r border-slate-200 text-center text-emerald-950 bg-emerald-50/80">
                                {extractedData.patient?.date || "Atual"} (Atual)
                              </th>
                              <th className="p-2 print:py-1 print:px-1.5 font-bold text-center">Variação (Δ)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            {comparative.rows.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-1.5 print:py-1 print:px-1.5 font-medium text-slate-800 border-r border-slate-200">
                                  {row.param}
                                </td>
                                {row.pastFormatted.map((val, pIdx) => (
                                  <td key={pIdx} className="p-1.5 print:py-1 print:px-1.5 text-center text-slate-500 border-r border-slate-200">
                                    {val}
                                  </td>
                                ))}
                                <td className="p-1.5 print:py-1 print:px-1.5 text-center font-bold text-slate-900 bg-emerald-50/50 border-r border-slate-200">
                                  {row.current}
                                </td>
                                <td className="p-1.5 print:py-1 print:px-1.5 text-center font-bold">
                                  {row.hasHistory ? (
                                    <span className={`font-bold text-xs ${
                                      row.isDown
                                        ? row.isGood
                                          ? "text-emerald-700"
                                          : "text-amber-700"
                                        : row.isGood
                                          ? "text-blue-700"
                                          : "text-rose-700"
                                    }`}>
                                      {row.isDown ? "↓ " : "↑ "}{row.diff}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-[10px] font-medium italic">
                                      {row.diff}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Legenda Indicativa de Cores da Variação */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[9px] print:text-[8px] pt-1 border-t border-slate-200/60 text-slate-500">
                        <span className="font-semibold uppercase text-[8px] mr-1">Legenda Δ:</span>
                        <span className="text-emerald-700 font-semibold">↓ Gordura/Medidas</span>
                        <span className="text-blue-700 font-semibold">↑ Massa Magra</span>
                        <span className="text-rose-700 font-semibold">↑ Gordura/Medidas</span>
                        <span className="text-amber-700 font-semibold">↓ Massa Magra</span>
                      </div>
                    </div>

                    {/* SEÇÃO 2: GRÁFICO COMPARATIVO ÚNICO DE EVOLUÇÃO TEMPORAL */}
                    <div className="bg-slate-50/70 p-4 print:p-2 rounded-2xl border border-slate-200/80 space-y-2">
                      <div className="flex flex-col md:flex-row print:flex-row justify-between items-start md:items-center print:items-center gap-2 border-b border-slate-200/60 pb-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center">
                          <Activity className="w-4 h-4 mr-1.5 text-teal-600" />
                          Evolução da Composição Corporal
                        </h3>
                        
                        {/* Legenda com círculos coloridos */}
                        <div className="flex items-center space-x-4 text-[11px] font-bold">
                          <span className="flex items-center text-slate-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-800 mr-1.5 inline-block"></span> Peso Total
                          </span>
                          <span className="flex items-center text-teal-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#14B8A6] mr-1.5 inline-block"></span> Massa Magra
                          </span>
                          <span className="flex items-center text-purple-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] mr-1.5 inline-block"></span> Massa Gorda
                          </span>
                        </div>
                      </div>

                      {/* GRÁFICO RECHARTS — visível apenas na tela, oculto na impressão */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs print:hidden">
                        <div className="h-48 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart 
                              data={pts} 
                              margin={{ top: 20, right: 25, left: 10, bottom: 5 }}
                            >
                              <defs>
                                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#334155" stopOpacity={0.22}/>
                                  <stop offset="95%" stopColor="#334155" stopOpacity={0.01}/>
                                </linearGradient>
                                <linearGradient id="leanGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.35}/>
                                  <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.01}/>
                                </linearGradient>
                                <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.35}/>
                                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.01}/>
                                </linearGradient>
                              </defs>
                              <XAxis 
                                dataKey="date" 
                                padding={{ left: 35, right: 25 }}
                                tickLine={false}
                                axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} 
                              />
                              <YAxis 
                                domain={[bottomScale, topScale]}
                                tickLine={false}
                                axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                                tick={{ fontSize: 10, fill: '#94a3b8' }}
                                unit=" kg"
                              />
                              <Area 
                                isAnimationActive={false}
                                type="monotone" 
                                dataKey="weight" 
                                name="Peso Total" 
                                stroke="#1e293b" 
                                strokeWidth={2.5} 
                                fillOpacity={1} 
                                fill="url(#weightGrad)" 
                                dot={{ r: 4, fill: "#1e293b", strokeWidth: 1.5, stroke: "#ffffff" }}
                                activeDot={false}
                                label={({ x, y, value }) => (
                                  <text x={x} y={y - 8} fill="#0f172a" fontSize={9.5} fontWeight={800} textAnchor="middle">
                                    {value ? `${value}kg` : ""}
                                  </text>
                                )}
                              />
                              <Area 
                                isAnimationActive={false}
                                type="monotone" 
                                dataKey="leanMass" 
                                name="Massa Magra" 
                                stroke="#14B8A6" 
                                strokeWidth={2.5} 
                                fillOpacity={1} 
                                fill="url(#leanGrad)" 
                                dot={{ r: 4, fill: "#14B8A6", strokeWidth: 1.5, stroke: "#ffffff" }}
                                activeDot={false}
                                label={({ x, y, value }) => (
                                  <text x={x} y={y - 8} fill="#0f766e" fontSize={9.5} fontWeight={800} textAnchor="middle">
                                    {value ? `${value}kg` : ""}
                                  </text>
                                )}
                              />
                              <Area 
                                isAnimationActive={false}
                                type="monotone" 
                                dataKey="fatMass" 
                                name="Massa Gorda" 
                                stroke="#8B5CF6" 
                                strokeWidth={2.5} 
                                fillOpacity={1} 
                                fill="url(#fatGrad)" 
                                dot={{ r: 4, fill: "#8B5CF6", strokeWidth: 1.5, stroke: "#ffffff" }}
                                activeDot={false}
                                label={({ x, y, value }) => (
                                  <text x={x} y={y + 16} fill="#7c3aed" fontSize={9.5} fontWeight={800} textAnchor="middle">
                                    {value ? `${value}kg` : ""}
                                  </text>
                                )}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* GRÁFICO SVG PURO — visível apenas na impressão/PDF, oculto na tela */}
                      <div className="hidden print:block bg-white p-2 rounded-xl border border-slate-200/70">
                        <svg
                          viewBox="0 0 600 160"
                          width="100%"
                          height="160"
                          xmlns="http://www.w3.org/2000/svg"
                          style={{ display: 'block', overflow: 'visible' }}
                        >
                          <defs>
                            <linearGradient id="svgWeightGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#334155" stopOpacity="0.20"/>
                              <stop offset="95%" stopColor="#334155" stopOpacity="0.01"/>
                            </linearGradient>
                            <linearGradient id="svgLeanGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#14B8A6" stopOpacity="0.30"/>
                              <stop offset="95%" stopColor="#14B8A6" stopOpacity="0.01"/>
                            </linearGradient>
                            <linearGradient id="svgFatGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8B5CF6" stopOpacity="0.30"/>
                              <stop offset="95%" stopColor="#8B5CF6" stopOpacity="0.01"/>
                            </linearGradient>
                          </defs>

                          {/* Eixo Y — linhas de grade horizontais */}
                          {[0, 25, 50, 75, 100].map(pct => {
                            const yPos = 20 + (pct / 100) * 110;
                            const val = Math.round(topScale - (pct / 100) * scaleRange);
                            return (
                              <g key={pct}>
                                <line x1="60" y1={yPos} x2="580" y2={yPos} stroke="#e2e8f0" strokeWidth="0.8"/>
                                <text x="55" y={yPos + 4} fill="#94a3b8" fontSize="9" textAnchor="end" fontFamily="sans-serif">{val} kg</text>
                              </g>
                            );
                          })}

                          {/* Eixo X — datas */}
                          {pts.map((p, idx) => (
                            <text
                              key={idx}
                              x={getX(idx, pts.length)}
                              y="148"
                              fill="#64748b"
                              fontSize="9"
                              fontWeight="600"
                              textAnchor="middle"
                              fontFamily="sans-serif"
                            >{p.date}</text>
                          ))}

                          {/* Área preenchida — Peso Total */}
                          {weightPoints.length > 1 && (
                            <polygon
                              points={[
                                ...weightPoints.map(p => `${p.x},${p.y}`),
                                `${weightPoints[weightPoints.length-1].x},130`,
                                `${weightPoints[0].x},130`
                              ].join(' ')}
                              fill="url(#svgWeightGrad)"
                            />
                          )}
                          {/* Área preenchida — Massa Magra */}
                          {leanPoints.length > 1 && (
                            <polygon
                              points={[
                                ...leanPoints.map(p => `${p.x},${p.y}`),
                                `${leanPoints[leanPoints.length-1].x},130`,
                                `${leanPoints[0].x},130`
                              ].join(' ')}
                              fill="url(#svgLeanGrad)"
                            />
                          )}
                          {/* Área preenchida — Massa Gorda */}
                          {fatPoints.length > 1 && (
                            <polygon
                              points={[
                                ...fatPoints.map(p => `${p.x},${p.y}`),
                                `${fatPoints[fatPoints.length-1].x},130`,
                                `${fatPoints[0].x},130`
                              ].join(' ')}
                              fill="url(#svgFatGrad)"
                            />
                          )}

                          {/* Linha — Peso Total */}
                          <polyline
                            points={weightPoints.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke="#1e293b"
                            strokeWidth="2"
                            strokeLinejoin="round"
                          />
                          {/* Linha — Massa Magra */}
                          <polyline
                            points={leanPoints.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke="#14B8A6"
                            strokeWidth="2"
                            strokeLinejoin="round"
                          />
                          {/* Linha — Massa Gorda */}
                          <polyline
                            points={fatPoints.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke="#8B5CF6"
                            strokeWidth="2"
                            strokeLinejoin="round"
                          />

                          {/* Pontos e valores — Peso Total */}
                          {weightPoints.map((p, idx) => (
                            <g key={idx}>
                              <circle cx={p.x} cy={p.y} r="4" fill="#1e293b" stroke="#fff" strokeWidth="1.5"/>
                              <text x={p.x} y={p.y - 8} fill="#0f172a" fontSize="8.5" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
                                {p.val ? `${p.val}kg` : ""}
                              </text>
                            </g>
                          ))}
                          {/* Pontos e valores — Massa Magra */}
                          {leanPoints.map((p, idx) => (
                            <g key={idx}>
                              <circle cx={p.x} cy={p.y} r="4" fill="#14B8A6" stroke="#fff" strokeWidth="1.5"/>
                              <text x={p.x} y={p.y - 8} fill="#0f766e" fontSize="8.5" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
                                {p.val ? `${p.val}kg` : ""}
                              </text>
                            </g>
                          ))}
                          {/* Pontos e valores — Massa Gorda */}
                          {fatPoints.map((p, idx) => (
                            <g key={idx}>
                              <circle cx={p.x} cy={p.y} r="4" fill="#8B5CF6" stroke="#fff" strokeWidth="1.5"/>
                              <text x={p.x} y={p.y + 16} fill="#7c3aed" fontSize="8.5" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
                                {p.val ? `${p.val}kg` : ""}
                              </text>
                            </g>
                          ))}
                        </svg>
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* RODAPÉ UNIFICADO DO LAUDO DA NUTRICIONISTA (PÁGINA 3) */}
              <div className="pt-6 print:pt-3 border-t border-slate-300 mt-6 print:mt-auto a4-print-footer">
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
                      <p className="text-[10px] font-bold text-emerald-800">Página 3 de 4</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

</>);
}
