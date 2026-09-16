import React from 'react';
import { 
  ArrowLeft, 
  Printer, 
  Sparkles, 
  AlertCircle, 
  Award, 
  Clock 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer 
} from 'recharts';
import logo from '../../../assets/logo.png';
import { formatWaitTime } from '../../../shared/utils/formatters.js';

export default function WhatsAppPdfReport({
  setShowPdfModal,
  period,
  globalStats,
  comparisonStats,
  aiAnalysis,
  isGeneratingAi,
  loadDemoAiAnalysis,
  generateAiAnalysis,
  uniqueCategories,
  filteredData,
  timelineChartData,
  peakHoursChartData,
  slaResolutionBreakdownData
}) {
  return (
    <div className="bg-transparent min-h-screen p-0 md:py-4 print:p-0 print:bg-white animate-fade-in font-sans">
      {/* BARRA SUPERIOR DE AÇÕES (VOLTAR / IMPRIMIR) - OCULTA NO PRINT */}
      <div className="max-w-4xl mx-auto mb-4 p-4 bg-white md:rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden sticky top-2 z-50">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setShowPdfModal(false)}
            className="px-4 py-2 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all flex items-center space-x-1.5 hover:bg-slate-100 rounded-full border border-slate-200/80 active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Dashboard</span>
          </button>
          <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Relatório Executivo de Atendimento WhatsApp
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-full shadow-sm hover:shadow transition-all flex items-center space-x-2 active:scale-95"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            <span>Imprimir / Salvar em PDF</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PÁGINA 1: CABEÇALHO, COMPARATIVO DE ATENDIMENTO E PARECER DE METAS IA */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-300 rounded-none md:rounded-2xl shadow-lg p-6 md:p-10 text-slate-800 max-w-4xl mx-auto w-full space-y-6 print:space-y-4 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none a4-print-page">
        
        {/* CABEÇALHO DA CLÍNICA */}
        <div className="border-b-2 border-emerald-800 pb-5 print:pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start print:flex-row gap-4">
            <div className="flex items-center space-x-4">
              <img src={logo} alt="Logo" className="w-14 h-14 object-contain flex-shrink-0" />
              <div>
                <h1 className="text-2xl print:text-lg font-black tracking-tight text-slate-900 uppercase">
                  NutrIsa • Nutrição Avançada
                </h1>
                <p className="text-xs print:text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  Relatório Executivo de Atendimento & SLA WhatsApp
                </p>
                <p className="text-[11px] print:text-[9px] text-slate-500 mt-0.5">
                  Dra. Isabela Muñoz • Desempenho e Produtividade da Recepção
                </p>
              </div>
            </div>
            <div className="sm:text-right flex-shrink-0">
              <span className="inline-block bg-emerald-900 text-white text-[10px] print:text-[9px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider">
                Documento Oficial de Alinhamento
              </span>
              <p className="text-xs print:text-[10px] text-slate-500 mt-2">
                Emissão: <strong className="text-slate-900">{new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</strong>
              </p>
            </div>
          </div>

          {/* Informações do Período Filtrado */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 uppercase text-[9px] font-bold block">Filtro de Período</span>
              <strong className="text-slate-900 text-xs font-bold block">
                {period === 'today' ? 'Hoje' : period === 'this_week' ? 'Semana Atual' : period === 'this_month' ? 'Mês Atual' : period.startsWith('month:') ? period.replace('month:', '') : 'Geral / Completo'}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[9px] font-bold block">Total de Conversas</span>
              <span className="text-slate-900 font-bold">{globalStats.total} mensagens</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[9px] font-bold block">Taxa de Resposta</span>
              <span className="text-emerald-700 font-extrabold">{globalStats.responseRate}% respondidas</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[9px] font-bold block">Tempo Médio Geral</span>
              <span className="text-slate-900 font-bold">{formatWaitTime(globalStats.avgWaitMinutes)}</span>
            </div>
          </div>
        </div>

        {/* SEÇÃO 1: COMPARATIVO DIRETO DE PERFORMANCE (DRA. ISABELA vs SECRETÁRIA) */}
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 border-l-3 border-emerald-600 pl-2">
            1. Comparativo de Atendimento (Dra. Isabela vs Secretária)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4">
            
            {/* Bloco Dra. Isabela (Verde Tiffany) */}
            <div className="bg-teal-50/40 p-4 rounded-2xl border border-teal-200/80 space-y-3">
              <div className="flex items-center justify-between border-b border-teal-200 pb-2">
                <span className="font-black text-sm text-teal-950 flex items-center">
                  👩‍⚕️ Dra. Isabela Muñoz
                </span>
                <span className="text-xs font-black text-teal-800 bg-teal-100/80 px-2.5 py-0.5 rounded-full">
                  {comparisonStats.isabela.total} respostas ({comparisonStats.totalAnswered > 0 ? Math.round((comparisonStats.isabela.total / comparisonStats.totalAnswered) * 100) : 0}%)
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white p-2 rounded-xl border border-teal-100">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Média</span>
                  <strong className="text-slate-900 text-sm">{formatWaitTime(comparisonStats.isabela.avg)}</strong>
                </div>
                <div className="bg-white p-2 rounded-xl border border-teal-100">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Mais Rápida</span>
                  <strong className="text-emerald-700 text-sm">{formatWaitTime(comparisonStats.isabela.min)}</strong>
                </div>
                <div className="bg-white p-2 rounded-xl border border-teal-100">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Mais Demorada</span>
                  <strong className="text-amber-700 text-sm">{formatWaitTime(comparisonStats.isabela.max)}</strong>
                </div>
              </div>
              <p className="text-[10.5px] text-teal-900 font-medium">
                ⚡ {comparisonStats.isabela.fastRate}% das dúvidas clínicas foram respondidas em até 15 minutos.
              </p>
            </div>

            {/* Bloco Secretária (Roxo) */}
            <div className="bg-purple-50/40 p-4 rounded-2xl border border-purple-200/80 space-y-3">
              <div className="flex items-center justify-between border-b border-purple-200 pb-2">
                <span className="font-black text-sm text-purple-950 flex items-center">
                  💼 Equipe / Secretária
                </span>
                <span className="text-xs font-black text-purple-800 bg-purple-100/80 px-2.5 py-0.5 rounded-full">
                  {comparisonStats.secretaria.total} respostas ({comparisonStats.totalAnswered > 0 ? Math.round((comparisonStats.secretaria.total / comparisonStats.totalAnswered) * 100) : 0}%)
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white p-2 rounded-xl border border-purple-100">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Média</span>
                  <strong className="text-slate-900 text-sm">{formatWaitTime(comparisonStats.secretaria.avg)}</strong>
                </div>
                <div className="bg-white p-2 rounded-xl border border-purple-100">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Mais Rápida</span>
                  <strong className="text-emerald-700 text-sm">{formatWaitTime(comparisonStats.secretaria.min)}</strong>
                </div>
                <div className="bg-white p-2 rounded-xl border border-purple-100">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Mais Demorada</span>
                  <strong className="text-amber-700 text-sm">{formatWaitTime(comparisonStats.secretaria.max)}</strong>
                </div>
              </div>
              <p className="text-[10.5px] text-purple-900 font-medium">
                ⚡ {comparisonStats.secretaria.fastRate}% dos agendamentos e recepção foram respondidos em até 15 minutos.
              </p>
            </div>

          </div>
        </div>

        {/* SEÇÃO 2: PARECER EXECUTIVO & METAS COM IA (DIRETRIZES & BÔNUS INDIVIDUAL) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 border-l-3 border-emerald-600 pl-2">
              2. Parecer Executivo de Metas & SLA com Inteligência Artificial
            </h3>
            <div className="flex items-center space-x-2 print:hidden">
              <button
                type="button"
                onClick={loadDemoAiAnalysis}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-full border border-slate-300 transition-all flex items-center space-x-1.5 active:scale-95 shadow-2xs"
                title="Preencher instantaneamente com dados simulados sem consumir cota de IA"
              >
                <span>⚡ Demo</span>
              </button>
              <button
                type="button"
                onClick={generateAiAnalysis}
                disabled={isGeneratingAi}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-full shadow-2xs transition-all flex items-center space-x-1.5 active:scale-95 disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                <span>{isGeneratingAi ? 'Analisando Metas...' : aiAnalysis ? 'Atualizar Parecer IA' : 'Gerar Parecer IA'}</span>
              </button>
            </div>
          </div>

          {isGeneratingAi ? (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2 animate-pulse">
              <Sparkles className="w-6 h-6 text-emerald-600 mx-auto animate-bounce" />
              <p className="text-xs font-bold text-slate-800">IA Analisando Métricas, Metas da Clínica e Bônus da Secretária...</p>
              <p className="text-[10px] text-slate-500">Calculando tempos de resposta, volume relativo e assuntos prioritários.</p>
            </div>
          ) : aiAnalysis ? (
            <div className="space-y-3.5">
              
              {/* Banner de Bônus da Secretária & Status Geral */}
              <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-3">
                <div className={`p-3.5 rounded-2xl border ${
                  (aiAnalysis.atingimentoBonusSecretaria?.status || '').toLowerCase().includes('atingido') && !(aiAnalysis.atingimentoBonusSecretaria?.status || '').toLowerCase().includes('não') && !(aiAnalysis.atingimentoBonusSecretaria?.status || '').toLowerCase().includes('fora') && !(aiAnalysis.atingimentoBonusSecretaria?.status || '').toLowerCase().includes('parcial')
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : (aiAnalysis.atingimentoBonusSecretaria?.status || '').toLowerCase().includes('parcial')
                      ? 'bg-amber-50 border-amber-300 text-amber-950'
                      : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">💰 Bônus Individual Secretária:</span>
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-white/90 border border-current shadow-2xs">
                      {aiAnalysis.atingimentoBonusSecretaria?.status || 'Avaliado'}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium leading-snug">
                    {aiAnalysis.atingimentoBonusSecretaria?.motivo}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold uppercase text-slate-500">🎯 Status Geral da Operação:</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      aiAnalysis.statusGeral === 'Excelente' || aiAnalysis.statusGeral === 'Dentro da Meta'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}>
                      {aiAnalysis.statusGeral}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium leading-snug">
                    {aiAnalysis.statusGeralDescricao || 'Avaliação integrada de tempo médio, distribuição de volume e autonomia de recepção.'}
                  </p>
                </div>
              </div>

              {/* Diagnóstico Textual da IA */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-wider mb-1.5 flex items-center">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 mr-1.5" /> Diagnóstico Estratégico do Período:
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {aiAnalysis.diagnosticoExecutivo}
                </p>
              </div>

              {/* Grid de Metas Avaliadas */}
              {aiAnalysis.avaliacaoMetas && (
                <div className="grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-2 text-xs">
                  {aiAnalysis.avaliacaoMetas.map((m, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-extrabold text-slate-500 uppercase truncate">{m.meta}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                          m.atingido ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {m.atingido ? '✓ Meta' : '✕ Fora'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-700 font-semibold leading-tight">{m.detalhe}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Destaque: Principal Tema dos Pacientes & Plano de Ação */}
              <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-3 text-xs">
                {aiAnalysis.temaPrincipalPacientes && (
                  <div className="p-3.5 bg-teal-50/50 border border-teal-200 rounded-2xl">
                    <span className="text-[10px] font-black text-teal-900 uppercase block mb-1">
                      📢 Tema Mais Frequente: {aiAnalysis.temaPrincipalPacientes.tema}
                    </span>
                    <p className="text-[11px] text-teal-950 font-medium leading-relaxed">
                      {aiAnalysis.temaPrincipalPacientes.recomendacao}
                    </p>
                  </div>
                )}

                {aiAnalysis.planoDeAcao && (
                  <div className="p-3.5 bg-purple-50/50 border border-purple-200 rounded-2xl">
                    <span className="text-[10px] font-black text-purple-900 uppercase block mb-1">
                      🚀 Próximas Ações Recomendadas:
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-purple-950">
                      {aiAnalysis.planoDeAcao.map((act, i) => (
                        <li key={i}>{act}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* Fallback padrão quando ainda não gerou IA */
            <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 text-xs space-y-2 text-slate-800">
              <div className="flex items-center space-x-2 font-bold text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Diretrizes e Recomendações de SLA (Geral):</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 ml-1 leading-relaxed">
                <li><strong>Meta de Resposta Rápida:</strong> Manter tempo de primeira resposta para agendamentos e dúvidas em até <strong>15 a 30 minutos</strong> (elegível para bônus individual).</li>
                <li><strong>Distribuição de Volume:</strong> A secretária deve liderar o volume de respostas ({comparisonStats.secretaria.total} enviadas vs {comparisonStats.isabela.total} da Dra).</li>
                <li><strong>Intervenções Clínicas ({comparisonStats.isabelaInterventions}):</strong> Meta de intervenção mínima da Dra. Isabela em assuntos administrativos.</li>
                <li><strong>Fila Atual de Pendências:</strong> Atualmente constam <strong>{comparisonStats.secretaria.pendingCount} mensagens administrativas</strong> aguardando retorno.</li>
              </ul>
            </div>
          )}
        </div>

        {/* RODAPÉ E ASSINATURA PÁGINA 1 */}
        <div className="border-t border-slate-200 pt-5 mt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <div>
            <p className="font-semibold text-slate-700">NutrIsa • Gestão Integrada de Consultório</p>
            <p className="text-[10px]">Relatório gerado automaticamente através da Inteligência Artificial NutrIsa. • <strong className="text-emerald-700">Página 1 de 2</strong></p>
          </div>
          <div className="text-center sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto">
            <div className="w-48 border-b border-slate-400 mb-1 mx-auto sm:ml-auto"></div>
            <span className="text-[11px] font-bold text-slate-700 uppercase block">Dra. Isabela Muñoz</span>
            <span className="text-[10px] text-slate-400 block">Nutricionista Clínica & Esportiva</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PÁGINA 2: DISTRIBUIÇÃO DE ASSUNTOS, EVOLUÇÃO DIÁRIA E ASSINATURA */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-300 rounded-none md:rounded-2xl shadow-lg p-6 md:p-10 text-slate-800 max-w-4xl mx-auto w-full space-y-6 print:space-y-4 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none a4-print-page">
        
        {/* CABEÇALHO OFICIAL DA CLÍNICA (IDÊNTICO À PÁGINA 1) */}
        <div className="border-b-2 border-emerald-800 pb-5 print:pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start print:flex-row gap-4">
            <div className="flex items-center space-x-4">
              <img src={logo} alt="Logo" className="w-14 h-14 object-contain flex-shrink-0" />
              <div>
                <h1 className="text-2xl print:text-lg font-black tracking-tight text-slate-900 uppercase">
                  NutrIsa • Nutrição Avançada
                </h1>
                <p className="text-xs print:text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  Relatório Executivo de Atendimento & SLA WhatsApp
                </p>
                <p className="text-[11px] print:text-[9px] text-slate-500 mt-0.5">
                  Dra. Isabela Muñoz • Desempenho e Produtividade da Recepção
                </p>
              </div>
            </div>
            <div className="sm:text-right flex-shrink-0">
              <span className="inline-block bg-emerald-900 text-white text-[10px] print:text-[9px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider">
                Documento Oficial de Alinhamento
              </span>
              <p className="text-xs print:text-[10px] text-slate-500 mt-2">
                Emissão: <strong className="text-slate-900">{new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</strong>
              </p>
            </div>
          </div>

          {/* Informações do Período Filtrado */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 uppercase text-[9px] font-bold block">Filtro de Período</span>
              <strong className="text-slate-900 text-xs font-bold block">
                {period === 'today' ? 'Hoje' : period === 'this_week' ? 'Semana Atual' : period === 'this_month' ? 'Mês Atual' : period.startsWith('month:') ? period.replace('month:', '') : 'Geral / Completo'}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[9px] font-bold block">Total de Conversas</span>
              <span className="text-slate-900 font-bold">{globalStats.total} mensagens</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[9px] font-bold block">Taxa de Resposta</span>
              <span className="text-emerald-700 font-extrabold">{globalStats.responseRate}% respondidas</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[9px] font-bold block">Tempo Médio Geral</span>
              <span className="text-slate-900 font-bold">{formatWaitTime(globalStats.avgWaitMinutes)}</span>
            </div>
          </div>
        </div>

        {/* SEÇÃO 3: TOP ASSUNTOS ATENDIDOS */}
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 border-l-3 border-emerald-600 pl-2">
            3. Distribuição dos Assuntos Mais Frequentes no Período
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 print:grid-cols-3 gap-2.5 text-xs">
            {uniqueCategories.slice(0, 6).map(cat => {
              const totalCat = filteredData.filter(c => c.categoria === cat).length;
              return (
                <div key={cat} className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">{cat}</span>
                  <strong className="text-sm font-black text-slate-900 mt-1 block">{totalCat} mensagens</strong>
                </div>
              );
            })}
          </div>
        </div>

        {/* SEÇÃO 4: PAINEL DE GRÁFICOS ANALÍTICOS (EVOLUÇÃO TEMPORAL, HORÁRIOS DE PICO E FAIXAS DE SLA) */}
        <div className="space-y-4">
          
          {/* Gráfico 1: Evolução Diária de Atendimentos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 border-l-3 border-emerald-600 pl-2">
                4. Evolução Temporal de Mensagens (Dra. Isabela vs Secretária)
              </h3>
              <div className="flex items-center space-x-3 text-[10px]">
                <span className="flex items-center font-bold text-teal-800"><span className="w-2.5 h-2.5 rounded-full bg-teal-500 mr-1"></span> Dra. Isabela</span>
                <span className="flex items-center font-bold text-purple-800"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 mr-1"></span> Secretária</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 overflow-hidden">
              {timelineChartData.length === 0 ? (
                <div className="h-36 flex items-center justify-center text-xs text-slate-400">
                  Sem dados diários no período selecionado.
                </div>
              ) : (
                <div className="h-36 w-full">
                  <ResponsiveContainer width="99%" height="100%">
                    <AreaChart data={timelineChartData} margin={{ top: 5, right: 15, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="pdfIsabelaColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.35}/>
                          <stop offset="95%" stopColor="#14B8A6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="pdfSecretariaColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.35}/>
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="data" tick={{ fontSize: 9, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
                      <Area type="monotone" dataKey="isabela" name="Dra. Isabela" stroke="#14B8A6" strokeWidth={2} fillOpacity={1} fill="url(#pdfIsabelaColor)" />
                      <Area type="monotone" dataKey="secretaria" name="Secretária" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#pdfSecretariaColor)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Grid 2 Gráficos Lado a Lado: Horários de Pico + Resolução por Faixas de Tempo */}
          <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-3.5">
            
            {/* Gráfico 2: Horários de Pico dos Pacientes */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col justify-between overflow-hidden">
              <div className="mb-2">
                <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center">
                  <Clock className="w-3 h-3 mr-1 text-emerald-600" /> Horários de Maior Fluxo de Mensagens
                </span>
                <span className="text-[9.5px] text-slate-500">Volume por hora (7h às 21h)</span>
              </div>
              <div className="h-32 w-full">
                <ResponsiveContainer width="99%" height="100%">
                  <BarChart data={peakHoursChartData} margin={{ top: 5, right: 10, left: -30, bottom: 0 }}>
                    <XAxis dataKey="hora" tick={{ fontSize: 8.5, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 8.5, fill: '#64748b' }} />
                    <Bar dataKey="total" fill="#0D9488" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico 3: Faixas de Resolução da Secretária */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div className="mb-2">
                <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center">
                  <Award className="w-3 h-3 mr-1 text-purple-600" /> Faixas de SLA da Secretária
                </span>
                <span className="text-[9.5px] text-slate-500">Distribuição do tempo de resposta</span>
              </div>

              {slaResolutionBreakdownData.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-xs text-slate-400">
                  Sem atendimentos registrados no período.
                </div>
              ) : (
                <div className="space-y-2 my-auto">
                  {slaResolutionBreakdownData.map((item, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex justify-between text-[9.5px] font-bold text-slate-700">
                        <span>{item.faixa}</span>
                        <span className="text-slate-900 font-extrabold">{item.count} msgs ({item.pct}%)</span>
                      </div>
                      {/* Barra de Progresso com cor de fundo forçada para Print */}
                      <div className="w-full bg-slate-200 border border-slate-300 h-2.5 rounded-full overflow-hidden flex">
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${Math.max(item.pct, 2)}%`, 
                            backgroundColor: item.fill,
                            minWidth: item.count > 0 ? '6px' : '0px'
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* SEÇÃO 5: DIRETRIZES DE CONTINUIDADE & BONIFICAÇÃO */}
        <div className="bg-teal-50/40 p-3.5 rounded-2xl border border-teal-200/80 text-xs space-y-1 text-slate-700">
          <h4 className="text-[11px] font-black text-teal-950 uppercase tracking-wider flex items-center">
            <Award className="w-3.5 h-3.5 text-teal-700 mr-1.5" /> Termo de Alinhamento de Metas & Bonificação
          </h4>
          <p className="text-[10.5px] leading-relaxed">
            O presente relatório consolida as métricas operacionais para apuração do bônus individual da recepção. O cumprimento contínuo das metas de SLA (tempo médio &lt; 30 min, volume absorvido e intervenção clínica reduzida) valida a excelência do padrão NutrIsa de atendimento ao paciente.
          </p>
        </div>

        {/* RODAPÉ E ASSINATURA PÁGINA 2 */}
        <div className="border-t border-slate-200 pt-5 mt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <div>
            <p className="font-semibold text-slate-700">NutrIsa • Gestão Integrada de Consultório</p>
            <p className="text-[10px]">Relatório gerado automaticamente através da Inteligência Artificial NutrIsa. • <strong className="text-emerald-700">Página 2 de 2</strong></p>
          </div>
          <div className="text-center sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto">
            <div className="w-48 border-b border-slate-400 mb-1 mx-auto sm:ml-auto"></div>
            <span className="text-[11px] font-bold text-slate-700 uppercase block">Dra. Isabela Muñoz</span>
            <span className="text-[10px] text-slate-400 block">Nutricionista Clínica & Esportiva</span>
          </div>
        </div>

      </div>
    </div>
  );
}
