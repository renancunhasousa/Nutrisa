import React from 'react';
import { 
  TrendingUp, 
  Clock, 
  Award, 
  MessageSquare,
  Stethoscope,
  Headset,
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
import { getOwnerShortLabel } from '../../configuracoes/services/clinicProfileService.js';

export default function WhatsAppCharts({
  topCategoriesComparisonData,
  timelineChartData,
  peakHoursChartData,
  slaResolutionBreakdownData,
  slaResolutionDraData,
  comparisonStats
}) {
  const ownerLabel = getOwnerShortLabel();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* Gráfico 3: Volume Diário de Atendimentos */}
      <div className="bg-white p-6 md:p-7 rounded-3xl border border-slate-200 shadow-xs lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
              <TrendingUp className="size-3.5 text-teal-600" />
              Evolução Diária de Atendimentos: {ownerLabel} vs Secretária
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
                <Area type="monotone" dataKey="isabela" name={ownerLabel}stroke="#14B8A6" strokeWidth={2.5} fillOpacity={1} fill="url(#isabelaColor)" />
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
            <h3 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
              <Clock className="size-3.5 text-emerald-600" />
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
              <h3 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
                <Award className="size-3.5 text-emerald-600" />
                Faixas de Resolução de SLA (Secretária vs {ownerLabel})
              </h3>
              <p className="text-xs text-slate-500">Tempo de resposta em faixas estratégicas (Meta: &lt; 15 min)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Painel Secretária */}
            <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 space-y-2.5">
              <div className="flex justify-between items-center border-b border-purple-200 pb-1.5">
                <span className="flex items-center gap-1.5 text-xs font-black text-purple-950">
                  <Headset className="size-3.5 text-purple-600" aria-hidden="true" />
                  Secretária
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
                <span className="flex items-center gap-1.5 text-xs font-black text-teal-950">
                  <Stethoscope className="size-3.5 text-teal-600" aria-hidden="true" />
                  {ownerLabel}
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
            <h3 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
              <MessageSquare className="size-3.5 text-emerald-600" />
              Volume Geral por Assuntos & Demandas dos Pacientes
            </h3>
            <p className="text-xs text-slate-500">Total de mensagens registradas em cada tema da clínica no período</p>
          </div>
        </div>

        {topCategoriesComparisonData.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Nenhuma categoria registrada no período.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {topCategoriesComparisonData.map((cat) => {
            const isabelaPct = cat.total > 0 ? Math.round((cat.isabela / cat.total) * 100) : 0;
            const secretariaPct = cat.total > 0 ? 100 - isabelaPct : 0;

            return (
            <div key={cat.categoria} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex min-w-0 flex-col justify-between">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase truncate block">
                {cat.categoria}
              </span>
              <span className="mt-2 text-2xl font-black text-slate-900">{cat.total}</span>
              <div className="mt-3 flex flex-wrap gap-1">
                <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                  {ownerLabel} {isabelaPct}%
                </span>
                <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                  Secretária {secretariaPct}%
                </span>
              </div>
            </div>
            );
          })}
          </div>
        )}
      </div>

    </div>
  );
}
