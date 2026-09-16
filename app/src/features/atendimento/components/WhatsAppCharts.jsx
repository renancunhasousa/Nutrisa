import React from 'react';
import { 
  Activity, 
  MessageCircle, 
  TrendingUp, 
  Clock, 
  Award, 
  MessageSquare 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

export default function WhatsAppCharts({
  attendantComparisonBarData,
  topCategoriesComparisonData,
  timelineChartData,
  peakHoursChartData,
  slaResolutionBreakdownData,
  slaResolutionDraData,
  comparisonStats,
  categoryChartData,
  globalStats
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Gráfico 1: Comparativo Direto de Tempos (Médio, Mín., Máx.) */}
      <div className="bg-white p-6 md:p-7 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-teal-600" />
              Comparativo de Tempos de Espera (minutos)
            </h3>
            <p className="text-xs text-slate-500">Média, Menor Tempo e Maior Tempo: Dra. Isabela vs Secretária</p>
          </div>
        </div>

        {attendantComparisonBarData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-xs text-slate-400">
            Sem dados suficientes no período para calcular o comparativo.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendantComparisonBarData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="metrica" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                <YAxis unit="m" tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  formatter={(val, name) => [`${val} min`, name]}
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderColor: '#e2e8f0', 
                    borderRadius: '16px', 
                    fontSize: '12px',
                    fontWeight: '700',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)' 
                  }}
                  labelStyle={{ color: '#0f172a', fontWeight: '800', marginBottom: '4px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="Dra. Isabela" fill="#14B8A6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Secretária" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Gráfico 2: Categorias Atendidas por Cada Atendente */}
      <div className="bg-white p-6 md:p-7 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center">
              <MessageCircle className="w-4 h-4 mr-2 text-teal-600" />
              Categorias Atendidas por Atendente
            </h3>
            <p className="text-xs text-slate-500">Distribuição dos temas respondidos por cada responsável</p>
          </div>
        </div>

        {topCategoriesComparisonData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-xs text-slate-400">
            Nenhuma categoria registrada no período.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={topCategoriesComparisonData}
                margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
              >
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis type="category" dataKey="categoria" width={110} tick={{ fontSize: 10, fill: '#334155' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderColor: '#e2e8f0', 
                    borderRadius: '16px', 
                    fontSize: '12px',
                    fontWeight: '700',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)' 
                  }}
                  labelStyle={{ color: '#0f172a', fontWeight: '800', marginBottom: '4px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="isabela" name="Dra. Isabela" fill="#14B8A6" radius={[0, 4, 4, 0]} />
                <Bar dataKey="secretaria" name="Secretária" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Gráfico 3: Volume Diário de Atendimentos */}
      <div className="bg-white p-6 md:p-7 rounded-3xl border border-slate-200 shadow-xs lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-teal-600" />
              Evolução Diária de Atendimentos: Dra. Isabela vs Secretária
            </h3>
            <p className="text-xs text-slate-500">Quantidade de intervenções realizadas por dia</p>
          </div>
        </div>

        {timelineChartData.length === 0 ? (
          <div className="h-60 flex items-center justify-center text-xs text-slate-400">
            Nenhuma mensagem registrada no período.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="isabelaColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="secretariaColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="data" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderColor: '#e2e8f0', 
                    borderRadius: '16px', 
                    fontSize: '12px',
                    fontWeight: '700',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)' 
                  }}
                  labelStyle={{ color: '#0f172a', fontWeight: '800', marginBottom: '4px' }}
                />
                <Legend 
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  formatter={(val) => <span className="text-xs text-slate-600 font-bold">{val}</span>}
                />
                <Area type="monotone" dataKey="isabela" name="Dra. Isabela" stroke="#14B8A6" strokeWidth={2.5} fillOpacity={1} fill="url(#isabelaColor)" />
                <Area type="monotone" dataKey="secretaria" name="Secretária" stroke="#8B5CF6" strokeWidth={2.5} fillOpacity={1} fill="url(#secretariaColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Gráfico 4: Horários de Maior Fluxo de Mensagens dos Pacientes */}
      <div className="bg-white p-6 md:p-7 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-emerald-600" />
              Horários de Maior Fluxo de Mensagens
            </h3>
            <p className="text-xs text-slate-500">Distribuição do volume de mensagens por hora do dia (7h às 21h)</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={peakHoursChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="hora" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip 
                formatter={(val) => [`${val} mensagens`, 'Volume']}
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderColor: '#e2e8f0', 
                  borderRadius: '16px', 
                  fontSize: '12px',
                  fontWeight: '700',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)' 
                }}
                labelStyle={{ color: '#0f172a', fontWeight: '800', marginBottom: '4px' }}
              />
              <Bar dataKey="total" fill="#0D9488" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico 5: Distribuição de Faixas de SLA (Secretária & Dra. Isabela) */}
      <div className="bg-white p-6 md:p-7 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center">
                <Award className="w-4 h-4 mr-2 text-purple-600" />
                Faixas de Resolução de SLA (Secretária vs Dra)
              </h3>
              <p className="text-xs text-slate-500">Tempo de resposta em faixas estratégicas (Meta: &lt; 15 min)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Painel Secretária */}
            <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 space-y-2.5">
              <div className="flex justify-between items-center border-b border-purple-200 pb-1.5">
                <span className="text-xs font-black text-purple-950 flex items-center">
                  💼 Secretária
                </span>
                <span className="text-[10px] font-extrabold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">
                  {comparisonStats.secretaria.total} respostas
                </span>
              </div>

              {slaResolutionBreakdownData.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">Sem registros</div>
              ) : (
                <div className="space-y-2">
                  {slaResolutionBreakdownData.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[10.5px] font-bold text-slate-700">
                        <span>{item.faixa}</span>
                        <span className="text-purple-900 font-extrabold">{item.count} ({item.pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${item.pct}%`, backgroundColor: item.fill }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Painel Dra. Isabela */}
            <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100 space-y-2.5">
              <div className="flex justify-between items-center border-b border-teal-200 pb-1.5">
                <span className="text-xs font-black text-teal-950 flex items-center">
                  👩‍⚕️ Dra. Isabela
                </span>
                <span className="text-[10px] font-extrabold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full">
                  {comparisonStats.isabela.total} respostas
                </span>
              </div>

              {slaResolutionDraData.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">Sem registros</div>
              ) : (
                <div className="space-y-2">
                  {slaResolutionDraData.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[10.5px] font-bold text-slate-700">
                        <span>{item.faixa}</span>
                        <span className="text-teal-900 font-extrabold">{item.count} ({item.pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${item.pct}%`, backgroundColor: item.fill }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Gráfico 6: Principais Demandas e Assuntos dos Pacientes (Geral) */}
      <div className="bg-white p-6 md:p-7 rounded-3xl border border-slate-200 shadow-xs lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2 text-emerald-600" />
              Volume Geral por Assuntos & Demandas dos Pacientes
            </h3>
            <p className="text-xs text-slate-500">Total de mensagens registradas em cada tema da clínica no período</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {categoryChartData.slice(0, 6).map((cat, idx) => (
            <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase truncate block">
                {cat.name}
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900">{cat.value}</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {globalStats.total > 0 ? Math.round((cat.value / globalStats.total) * 100) : 0}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
