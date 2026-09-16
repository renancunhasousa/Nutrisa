import { conversationsCsv } from './domain/conversations.js';
import { downloadText } from '../../shared/utils/download.js';
import { getAttendantType, isClosingOrGreetingMessage } from './domain/classification.js';
import React, { useState, useEffect, useMemo } from 'react';

import { fetchConversations } from './services/conversations.js';
import { MessageSquare, Clock, CheckCircle2, AlertCircle, RefreshCw, Download, Printer } from 'lucide-react';

import WhatsAppFilters from './components/WhatsAppFilters.jsx';
import WhatsAppAttendantCards from './components/WhatsAppAttendantCards.jsx';
import WhatsAppCharts from './components/WhatsAppCharts.jsx';
import WhatsAppFeedTable from './components/WhatsAppFeedTable.jsx';
import WhatsAppPdfReport from './report/WhatsAppPdfReport.jsx';

import { callGeminiWithFallback } from '../../shared/services/aiClient.js';
import { formatWaitTime } from '../../shared/utils/formatters.js';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function AtendimentoPage({ activeModel }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Filtros
  const [period, setPeriod] = useState('this_month');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [attendantFilter, setAttendantFilter] = useState('all');
  const [ignoreCourtesy, setIgnoreCourtesy] = useState(true);
  const [ignoreOthers, setIgnoreOthers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Análise com IA (Gemini)
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchConversations();
      setConversations(data || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Erro ao carregar dados do Supabase:', err);
      setError('Falha ao conectar com o banco de dados. Verifique a conexão.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // FILTRAGEM DOS DADOS
  const filteredData = useMemo(() => {
    return conversations.filter(item => {
      // 0. Filtro de Mensagens Técnicas / Atendimento Ativo (linhas criadas apenas como log de resposta)
      if (item.mensagem_texto === '[Atendimento Ativo]') {
        return false;
      }

      // 1. Filtro de Cortesia
      if (ignoreCourtesy && isClosingOrGreetingMessage(item)) {
        return false;
      }

      // 2. Filtro de Categoria "Outros"
      if (ignoreOthers && (item.categoria === 'Outro' || item.categoria === 'Outros' || item.categoria === 'Geral')) {
        return false;
      }

      // 3. Filtro de Período
      if (period !== 'all' && item.data_envio) {
        const itemDate = new Date(item.data_envio);
        // Usar como data de referência a data atual do sistema ou a data do registro mais recente
        const now = new Date();
        const latestDate = conversations[0]?.data_envio ? new Date(conversations[0].data_envio) : now;
        const refDate = latestDate > now ? latestDate : now;
        const endDay = new Date(refDate);
        endDay.setHours(23, 59, 59, 999);

        if (period === 'today') {
          const startToday = new Date(refDate);
          startToday.setHours(0, 0, 0, 0);
          if (itemDate < startToday || itemDate > endDay) return false;
        } else if (period === 'this_week') {
          const startWeek = new Date(refDate);
          const day = startWeek.getDay();
          const diff = startWeek.getDate() - day + (day === 0 ? -6 : 1);
          startWeek.setDate(diff);
          startWeek.setHours(0, 0, 0, 0);
          if (itemDate < startWeek || itemDate > endDay) return false;
        } else if (period === 'this_month') {
          const startMonth = new Date(refDate.getFullYear(), refDate.getMonth(), 1, 0, 0, 0);
          if (itemDate < startMonth || itemDate > endDay) return false;
        } else if (period.startsWith('month:')) {
          const [yr, mo] = period.replace('month:', '').split('-').map(Number);
          if (itemDate.getFullYear() !== yr || itemDate.getMonth() + 1 !== mo) return false;
        }
      }

      // 4. Filtro de Atendente
      if (attendantFilter !== 'all') {
        const attendant = getAttendantType(item);
        if (attendant !== attendantFilter) return false;
      }

      // 5. Filtro de Categoria
      if (selectedCategory !== 'all' && item.categoria !== selectedCategory) {
        return false;
      }

      // 6. Filtro de Status
      if (statusFilter === 'answered' && !item.respondida) return false;
      if (statusFilter === 'pending' && item.respondida) return false;

      // 7. Busca por Paciente / Telefone / Mensagem
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const nome = (item.nome_paciente || item.nome_contato || item.contato || '').toLowerCase();
        const fone = (item.telefone_paciente || item.contato_jid || item.telefone || '').toLowerCase();
        const msg = (item.conteudo_mensagem || item.mensagem_texto || item.mensagem || '').toLowerCase();
        if (!nome.includes(term) && !fone.includes(term) && !msg.includes(term)) return false;
      }

      return true;
    });
  }, [conversations, period, attendantFilter, selectedCategory, statusFilter, ignoreCourtesy, ignoreOthers, searchTerm]);

  // ESTATÍSTICAS GERAIS
  const globalStats = useMemo(() => {
    const total = filteredData.length;
    const answered = filteredData.filter(c => c.respondida).length;
    const pending = total - answered;
    const responseRate = total > 0 ? Math.round((answered / total) * 100) : 0;

    const waitTimes = filteredData
      .filter(c => c.respondida && c.tempo_espera_minutos !== null && c.tempo_espera_minutos !== undefined)
      .map(c => Number(c.tempo_espera_minutos));

    const avgWaitMinutes = waitTimes.length > 0 
      ? Math.round(waitTimes.reduce((acc, curr) => acc + curr, 0) / waitTimes.length) 
      : 0;

    return { total, answered, pending, responseRate, avgWaitMinutes };
  }, [filteredData]);

  // ESTATÍSTICAS COMPARATIVAS DRA. ISABELA vs SECRETÁRIA
  const comparisonStats = useMemo(() => {
    const isabelaConvs = filteredData.filter(c => getAttendantType(c) === 'isabela');
    const secretariaConvs = filteredData.filter(c => getAttendantType(c) === 'secretaria');

    const getStats = (list) => {
      const total = list.length;
      const answeredList = list.filter(c => c.respondida && c.tempo_espera_minutos !== null && c.tempo_espera_minutos !== undefined);
      const times = answeredList.map(c => Number(c.tempo_espera_minutos));
      const avg = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
      const min = times.length > 0 ? Math.min(...times) : 0;
      const max = times.length > 0 ? Math.max(...times) : 0;
      const fastCount = times.filter(t => t <= 15).length;
      const fastRate = times.length > 0 ? Math.round((fastCount / times.length) * 100) : 0;
      const pendingCount = list.filter(c => !c.respondida).length;

      const catCounts = {};
      list.forEach(c => {
        const cat = c.categoria || 'Outro';
        catCounts[cat] = (catCounts[cat] || 0) + 1;
      });
      const topCategories = Object.entries(catCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      return { total, answeredCount: answeredList.length, avg, min, max, fastRate, pendingCount, topCategories };
    };

    // Atribuição de mensagens pendentes (Clínicas vão para Dra. Isabela, Administrativas vão para Recepção)
    const isabelaPendingCount = filteredData.filter(c => !c.respondida && getAttendantType(c) === 'isabela').length;
    const secretariaPendingCount = filteredData.filter(c => !c.respondida && getAttendantType(c) === 'secretaria').length;

    const isabelaStats = { ...getStats(isabelaConvs), pendingCount: isabelaPendingCount };
    const secretariaStats = { ...getStats(secretariaConvs), pendingCount: secretariaPendingCount };
    const totalAnswered = isabelaStats.answeredCount + secretariaStats.answeredCount;

    // Contagem de intervenções da Dra. Isabela em agendamentos/financeiro
    const isabelaInterventions = isabelaConvs.filter(c => 
      ['Agendamento e Horários', 'Pagamentos e Financeiro', 'Planos e Pacotes'].includes(c.categoria)
    ).length;

    return {
      isabela: isabelaStats,
      secretaria: secretariaStats,
      totalAnswered,
      isabelaInterventions
    };
  }, [filteredData]);

  // DADOS PARA GRÁFICOS
  const attendantComparisonBarData = useMemo(() => {
    return [
      {
        metrica: 'Tempo Médio',
        'Dra. Isabela': comparisonStats.isabela.avg,
        'Secretária': comparisonStats.secretaria.avg
      },
      {
        metrica: 'Mais Rápida',
        'Dra. Isabela': comparisonStats.isabela.min,
        'Secretária': comparisonStats.secretaria.min
      },
      {
        metrica: 'Mais Demorada',
        'Dra. Isabela': comparisonStats.isabela.max,
        'Secretária': comparisonStats.secretaria.max
      }
    ];
  }, [comparisonStats]);

  const topCategoriesComparisonData = useMemo(() => {
    const catMap = {};
    filteredData.forEach(item => {
      const cat = item.categoria || 'Outro';
      if (!catMap[cat]) catMap[cat] = { categoria: cat, isabela: 0, secretaria: 0, total: 0 };
      const att = getAttendantType(item);
      if (att === 'isabela') catMap[cat].isabela += 1;
      if (att === 'secretaria') catMap[cat].secretaria += 1;
      catMap[cat].total += 1;
    });

    return Object.values(catMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [filteredData]);

  const timelineChartData = useMemo(() => {
    const dateMap = {};
    filteredData.forEach(item => {
      if (!item.data_envio) return;
      const d = new Date(item.data_envio);
      const key = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!dateMap[key]) {
        dateMap[key] = { data: key, total: 0, isabela: 0, secretaria: 0, sortKey: d.getTime() };
      }
      dateMap[key].total += 1;
      const att = getAttendantType(item);
      if (att === 'isabela') dateMap[key].isabela += 1;
      if (att === 'secretaria') dateMap[key].secretaria += 1;
    });

    return Object.values(dateMap)
      .sort((a, b) => a.sortKey - b.sortKey)
      .slice(-15);
  }, [filteredData]);

  const peakHoursChartData = useMemo(() => {
    const hoursCount = {};
    for (let h = 7; h <= 21; h++) {
      hoursCount[`${h}h`] = { hora: `${h}h`, total: 0, sortKey: h };
    }

    filteredData.forEach(item => {
      if (!item.data_envio) return;
      const d = new Date(item.data_envio);
      const h = d.getHours();
      if (h >= 7 && h <= 21) {
        hoursCount[`${h}h`].total += 1;
      }
    });

    return Object.values(hoursCount).sort((a, b) => a.sortKey - b.sortKey);
  }, [filteredData]);

  const slaResolutionBreakdownData = useMemo(() => {
    let ate15 = 0, de15a30 = 0, de30a60 = 0, acima60 = 0;

    filteredData.forEach(item => {
      if (!item.respondida || getAttendantType(item) !== 'secretaria' || item.tempo_espera_minutos === null || item.tempo_espera_minutos === undefined) return;
      const mins = Number(item.tempo_espera_minutos);
      if (mins <= 15) ate15 += 1;
      else if (mins <= 30) de15a30 += 1;
      else if (mins <= 60) de30a60 += 1;
      else acima60 += 1;
    });

    const total = ate15 + de15a30 + de30a60 + acima60;
    if (total === 0) return [];

    return [
      { faixa: 'Até 15m (Ouro)', count: ate15, pct: Math.round((ate15 / total) * 100), fill: '#10B981' },
      { faixa: '15m a 30m', count: de15a30, pct: Math.round((de15a30 / total) * 100), fill: '#3B82F6' },
      { faixa: '30m a 60m', count: de30a60, pct: Math.round((de30a60 / total) * 100), fill: '#F59E0B' },
      { faixa: '> 1 hora', count: acima60, pct: Math.round((acima60 / total) * 100), fill: '#EF4444' }
    ];
  }, [filteredData]);

  const slaResolutionDraData = useMemo(() => {
    let ate15 = 0, de15a30 = 0, de30a60 = 0, acima60 = 0;

    filteredData.forEach(item => {
      if (!item.respondida || getAttendantType(item) !== 'isabela' || item.tempo_espera_minutos === null || item.tempo_espera_minutos === undefined) return;
      const mins = Number(item.tempo_espera_minutos);
      if (mins <= 15) ate15 += 1;
      else if (mins <= 30) de15a30 += 1;
      else if (mins <= 60) de30a60 += 1;
      else acima60 += 1;
    });

    const total = ate15 + de15a30 + de30a60 + acima60;
    if (total === 0) return [];

    return [
      { faixa: 'Até 15m (Ouro)', count: ate15, pct: Math.round((ate15 / total) * 100), fill: '#14B8A6' },
      { faixa: '15m a 30m', count: de15a30, pct: Math.round((de15a30 / total) * 100), fill: '#0EA5E9' },
      { faixa: '30m a 60m', count: de30a60, pct: Math.round((de30a60 / total) * 100), fill: '#F59E0B' },
      { faixa: '> 1 hora', count: acima60, pct: Math.round((acima60 / total) * 100), fill: '#F43F5E' }
    ];
  }, [filteredData]);

  const categoryChartData = useMemo(() => {
    const counts = {};
    filteredData.forEach(c => {
      const cat = c.categoria || 'Outro';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set(conversations.map(c => c.categoria).filter(Boolean));
    return Array.from(cats);
  }, [conversations]);

  const availableMonths = useMemo(() => {
    const map = new Map();
    conversations.forEach(c => {
      if (!c.data_envio) return;
      const d = new Date(c.data_envio);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          year: d.getFullYear(),
          month: d.getMonth(),
          label: `${MONTH_NAMES[d.getMonth()]} de ${d.getFullYear()}`,
          count: 0
        });
      }
      map.get(key).count += 1;
    });

    return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [conversations]);

  const exportToCSV = () => {
    if (!filteredData.length) return;
    downloadText(conversationsCsv(filteredData, getAttendantType), 'nutrisa_whatsapp_' + new Date().toISOString().slice(0,10) + '.csv', 'text/csv;charset=utf-8');
  };

  // IA - GERAÇÃO COM GEMINI
  const generateAiAnalysis = async () => {
    setIsGeneratingAi(true);
    setAiError(null);
    try {
      const topPatientThemes = categoryChartData.slice(0, 3).map(c => `${c.name} (${c.value} msgs)`).join(', ');

      const prompt = `
Você é o Consultor Executivo e Estratégico de Operações da clínica de nutrição "NutrIsa", liderada pela Dra. Isabela Muñoz.
Gere um Parecer de Desempenho e Alinhamento de Atendimento WhatsApp para a secretária.

DADOS CONSOLIDADOS DO PERÍODO:
- Período: ${period}
- Total de Mensagens: ${globalStats.total}
- Taxa de Resposta: ${globalStats.responseRate}%
- Tempo Médio Geral: ${globalStats.avgWaitMinutes} min
- Secretária: ${comparisonStats.secretaria.total} respostas | Média: ${comparisonStats.secretaria.avg} min | Rápidas (<=15m): ${comparisonStats.secretaria.fastRate}% | Pendências: ${comparisonStats.secretaria.pendingCount}
- Dra. Isabela: ${comparisonStats.isabela.total} respostas | Intervenções de Recepção: ${comparisonStats.isabelaInterventions}
- Temas Mais Frequentes: ${topPatientThemes}

METAS E DIRETRIZES:
1. SLA < 30 min (Meta Ouro <= 15 min).
2. Secretária liderar o volume de mensagens.
3. Intervenções da Dra. em agendamentos <= 2.
4. Bônus Individual da Secretária atrelado ao cumprimento do SLA e absorção das mensagens.

REGRAS CRÍTICAS DE LIMITE DE CARACTERES (PARA NÃO QUEBRAR O LAYOUT DO PDF A4):
- "motivo" do atingimentoBonusSecretaria: MÁXIMO DE 250 CARACTERES.
- "statusGeralDescricao": MÁXIMO DE 250 CARACTERES.
- "diagnosticoExecutivo": MÁXIMO DE 400 CARACTERES (seja direto, conciso e objetivo).
- Cada "detalhe" em avaliacaoMetas: MÁXIMO DE 110 CARACTERES.
- "recomendacao" em temaPrincipalPacientes: MÁXIMO DE 300 CARACTERES.
- "planoDeAcao" (soma das 2 a 3 ações): MÁXIMO DE 300 CARACTERES TOTAL.

Responda OBRIGATORIAMENTE em JSON puro no seguinte formato exato:
{
  "statusGeral": "Excelente" | "Dentro da Meta" | "Atenção Necessária" | "Crítico",
  "statusGeralDescricao": "Texto de até 250 caracteres avaliando a operação integrada",
  "diagnosticoExecutivo": "Texto conciso de até 400 caracteres com avaliação geral da operação",
  "atingimentoBonusSecretaria": {
    "status": "Atingido" | "Parcialmente" | "Fora da Meta",
    "motivo": "Texto de até 250 caracteres justificando a apuração do bônus"
  },
  "avaliacaoMetas": [
    { "meta": "Tempo", "atingido": boolean, "detalhe": "Texto de até 110 caracteres (ex: Média de 12 min registrada)" },
    { "meta": "Volume", "atingido": boolean, "detalhe": "Texto de até 110 caracteres (ex: Secretária absorveu 75% do fluxo)" },
    { "meta": "Intervenção", "atingido": boolean, "detalhe": "Texto de até 110 caracteres (ex: 1 intervenção registrada)" },
    { "meta": "Pendências", "atingido": boolean, "detalhe": "Texto de até 110 caracteres (ex: Fila de atendimento zerada)" }
  ],
  "temaPrincipalPacientes": {
    "tema": "Nome do tema",
    "recomendacao": "Texto de até 300 caracteres com orientação para a recepção"
  },
  "planoDeAcao": [
    "Ação prática 1 concisa",
    "Ação prática 2 concisa",
    "Ação prática 3 concisa"
  ]
}
`;

      const result = await callGeminiWithFallback({
        prompt,
        model: activeModel,
        jsonMode: true,
        systemInstruction: "Você é um auditor executivo de SLA de saúde. Responda estritamente em JSON válido em português."
      });

      setAiAnalysis(result.json);
    } catch (err) {
      console.error("Erro ao gerar parecer de IA:", err);
      setAiError(err.message || "Erro na geração do parecer.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  useEffect(() => { if (aiError) setError(aiError); }, [aiError]);

  // IA - CARREGAR DEMO INSTANTÂNEO
  const loadDemoAiAnalysis = () => {
    setIsGeneratingAi(false);
    setAiError(null);

    const secAvg = comparisonStats.secretaria.avg || 14;
    const isSlaOk = secAvg <= 30;
    const isVolOk = comparisonStats.secretaria.total >= comparisonStats.isabela.total;
    const isIntervOk = comparisonStats.isabelaInterventions <= 3;
    const isBonusAtingido = isSlaOk && isVolOk && isIntervOk;

    setAiAnalysis({
      statusGeral: isBonusAtingido ? "Excelente" : (isSlaOk ? "Dentro da Meta" : "Atenção Necessária"),
      statusGeralDescricao: "Avaliação integrada de tempo médio, distribuição de volume e autonomia da recepção no período.",
      diagnosticoExecutivo: `No período avaliado, a recepção registrou tempo médio de resposta de ${secAvg} minutos (${comparisonStats.secretaria.fastRate}% das respostas em até 15 minutos). O volume de atendimento foi satisfatoriamente absorvido pela secretária, mantendo a Dra. Isabela concentrada na rotina clínica.`,
      atingimentoBonusSecretaria: {
        status: isBonusAtingido ? "Atingido" : (isSlaOk || isVolOk ? "Parcialmente" : "Fora da Meta"),
        motivo: isBonusAtingido 
          ? `Parabéns! Tempo médio de ${secAvg} min (abaixo de 30 min) e liderança no volume de atendimentos.`
          : `Tempo médio registrado em ${secAvg} min com pendências em observação.`
      },
      avaliacaoMetas: [
        { meta: "Tempo", atingido: isSlaOk, detalhe: `Média de ${secAvg} min (Meta Ouro <= 15 min)` },
        { meta: "Volume", atingido: isVolOk, detalhe: `Secretária: ${comparisonStats.secretaria.total} msgs vs Dra: ${comparisonStats.isabela.total} msgs` },
        { meta: "Intervenção", atingido: isIntervOk, detalhe: `${comparisonStats.isabelaInterventions} intervenções em agendamentos/valores` },
        { meta: "Pendências", atingido: comparisonStats.secretaria.pendingCount === 0, detalhe: `${comparisonStats.secretaria.pendingCount} mensagens aguardando retorno` }
      ],
      temaPrincipalPacientes: {
        tema: categoryChartData[0]?.name || "Agendamento e Horários",
        recomendacao: "Manter templates de respostas rápidas para dúvidas de horários e valores para agilizar o primeiro contato."
      },
      planoDeAcao: [
        "Priorizar retorno aos pacientes entre 08h e 10h (horário de pico).",
        "Encaminhar apenas dúvidas clínicas para o celular da Dra. Isabela.",
        "Zerar a fila de mensagens pendentes antes de encerrar o expediente."
      ]
    });
  };

  const getWaitStatusBadge = (minutes, respondida) => {
    if (!respondida) return <span className="text-rose-600 font-bold">Aguardando</span>;
    if (minutes === null || minutes === undefined) return <span className="text-slate-400">N/D</span>;
    const m = Number(minutes);
    if (m <= 15) return <span className="text-emerald-700 font-bold">⚡ Rápida (&lt;15m)</span>;
    if (m <= 30) return <span className="text-teal-700 font-bold">✓ No prazo (&lt;30m)</span>;
    if (m <= 60) return <span className="text-amber-700 font-bold">⚠️ Atenção (&lt;1h)</span>;
    return <span className="text-rose-700 font-bold">🚨 Demorada (&gt;1h)</span>;
  };

  // Se o modo PDF estiver ativo, exibe a página completa do laudo A4
  if (showPdfModal) {
    return (
      <WhatsAppPdfReport
        setShowPdfModal={setShowPdfModal}
        period={period}
        globalStats={globalStats}
        comparisonStats={comparisonStats}
        aiAnalysis={aiAnalysis}
        isGeneratingAi={isGeneratingAi}
        loadDemoAiAnalysis={loadDemoAiAnalysis}
        generateAiAnalysis={generateAiAnalysis}
        uniqueCategories={uniqueCategories}
        filteredData={filteredData}
        timelineChartData={timelineChartData}
        peakHoursChartData={peakHoursChartData}
        slaResolutionBreakdownData={slaResolutionBreakdownData}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* CABEÇALHO DO DASHBOARD - IDÊNTICO À IMAGEM DE REFERÊNCIA */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Painel de Produtividade & SLA WhatsApp
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1 max-w-2xl leading-relaxed">
            Análise comparativa de volume, tempos de resposta (médio, mín., máx.) e categorias atendidas entre Dra. Isabela e Secretária.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Badge: Atualizado às */}
          {lastUpdated && (
            <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Atualizado às {lastUpdated.toLocaleTimeString('pt-BR')}</span>
            </span>
          )}

          {/* Botão Atualizar (Verde Sólido) */}
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-full shadow-xs transition-all flex items-center space-x-1.5 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>

          {/* Botão CSV (Outline) */}
          <button
            type="button"
            onClick={exportToCSV}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-full border border-slate-300 shadow-2xs transition-all flex items-center space-x-1.5 active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>CSV</span>
          </button>

          {/* Botão PDF (Outline) */}
          <button
            type="button"
            onClick={() => setShowPdfModal(true)}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-full border border-slate-300 shadow-2xs transition-all flex items-center space-x-1.5 active:scale-95"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-600" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <WhatsAppFilters
        period={period}
        setPeriod={setPeriod}
        availableMonths={availableMonths}
        attendantFilter={attendantFilter}
        setAttendantFilter={setAttendantFilter}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        uniqueCategories={uniqueCategories}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        ignoreOthers={ignoreOthers}
        setIgnoreOthers={setIgnoreOthers}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        ignoreCourtesy={ignoreCourtesy}
        setIgnoreCourtesy={setIgnoreCourtesy}
      />

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center space-x-3 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* BARRA DE KPIS GERAIS CONSOLIDADOS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Total de Mensagens</span>
            <MessageSquare className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{globalStats.total}</div>
          <span className="text-[10px] text-slate-400 font-medium">No período filtrado</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Respondidas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{globalStats.answered}</div>
          <span className="text-[10px] text-emerald-600 font-bold">{globalStats.responseRate}% resolvidas</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Aguardando</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-700">{globalStats.pending}</div>
          <span className="text-[10px] text-slate-400 font-medium">Na fila de resposta</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Taxa de Resposta</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-teal-700">{globalStats.responseRate}%</div>
          <span className="text-[10px] text-teal-600 font-bold">Meta: &gt; 90%</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Tempo Médio Geral</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700">{formatWaitTime(globalStats.avgWaitMinutes)}</div>
          <span className="text-[10px] text-slate-400 font-medium">Espera média do paciente</span>
        </div>
      </div>

      {/* CARDS COMPARATIVOS: DRA. ISABELA vs SECRETÁRIA */}
      <WhatsAppAttendantCards comparisonStats={comparisonStats} />

      {/* GRÁFICOS ANALÍTICOS COMPARATIVOS */}
      <WhatsAppCharts
        attendantComparisonBarData={attendantComparisonBarData}
        topCategoriesComparisonData={topCategoriesComparisonData}
        timelineChartData={timelineChartData}
        peakHoursChartData={peakHoursChartData}
        slaResolutionBreakdownData={slaResolutionBreakdownData}
        slaResolutionDraData={slaResolutionDraData}
        comparisonStats={comparisonStats}
        categoryChartData={categoryChartData}
        globalStats={globalStats}
      />

      {/* TABELA / FEED DE CONVERSAS */}
      <WhatsAppFeedTable
        filteredData={filteredData}
        conversations={conversations}
        loading={loading}
        getAttendantType={getAttendantType}
        getAttendantLabel={(item) => getAttendantType(item) === 'isabela' ? 'Dra. Isabela' : 'Secretária'}
        getWaitStatusBadge={getWaitStatusBadge}
      />
    </div>
  );
}
