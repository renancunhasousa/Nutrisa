import React, { useState, useEffect, useMemo } from 'react';
import logo from './assets/logo_new.png';
import { fetchConversations } from './supabase';
import { 
  MessageSquare, Clock, CheckCircle2, AlertCircle, 
  RefreshCw, Download, FileText
} from 'lucide-react';

import WhatsAppFilters from './components/whatsapp/WhatsAppFilters';
import WhatsAppAttendantCards from './components/whatsapp/WhatsAppAttendantCards';
import WhatsAppCharts from './components/whatsapp/WhatsAppCharts';
import WhatsAppFeedTable from './components/whatsapp/WhatsAppFeedTable';
import WhatsAppPdfReport from './components/whatsapp/WhatsAppPdfReport';

import { callGeminiWithFallback } from './services/gemini';
import { formatWaitTime } from './utils/formatters';

// Helper para identificar o atendente que efetivamente respondeu
export const getAttendantType = (item) => {
  const src = (item.source || '').toLowerCase();
  const resp = (item.resposta_secretaria || '').toLowerCase();
  
  if (src === 'primario' || src === 'notebook' || resp.includes('dra isabela') || resp.includes('isabela muñoz')) {
    return 'isabela';
  }
  if (src === 'secretaria' || item.categoria_secretaria) {
    return 'secretaria';
  }
  return 'outros';
};

// Expressões e palavras típicas de encerramento / cortesia / confirmação rápida
const COURTESY_PHRASES = [
  'obrigado', 'obrigada', 'obg', 'obgd', 'valeu', 'vlw', 'brigado', 'brigada',
  'ok', 'okk', 'blz', 'beleza', 'combinado', 'combinadissimo', 'ta bom', 'tá bom', 'tabom', 'certo',
  'sim', 'simm', 'nao', 'não', 'pode ser', 'pode sim', 'pode vir', 'perfeito', 'show', 'otimo', 'ótimo',
  'bom dia', 'boa tarde', 'boa noite', 'ola', 'olá', 'oii', 'oi', 'oie', 'ate mais', 'até mais', 'tchau'
];

export const isClosingOrGreetingMessage = (item) => {
  const text = (item.mensagem_texto || '').trim().toLowerCase();
  if (!text || text.length === 0) return true;
  const clean = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?!👍🙏👏❤️😊🙌🏼💪🏻✨🎉✅🎯]/g, '').trim();
  if (!clean && text.length > 0) return true;

  if (clean.length <= 25) {
    if (COURTESY_PHRASES.includes(clean)) return true;
    if (COURTESY_PHRASES.some(p => clean === p || clean === `${p} ${p}` || (clean.startsWith(`${p} `) && clean.length <= 15))) {
      return true;
    }
  }
  return false;
};

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function DashboardWhatsApp() {
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
        const now = new Date();
        now.setHours(23, 59, 59, 999);

        if (period === 'today') {
          const startToday = new Date();
          startToday.setHours(0, 0, 0, 0);
          if (itemDate < startToday || itemDate > now) return false;
        } else if (period === 'this_week') {
          const startWeek = new Date();
          const day = startWeek.getDay();
          const diff = startWeek.getDate() - day + (day === 0 ? -6 : 1);
          startWeek.setDate(diff);
          startWeek.setHours(0, 0, 0, 0);
          if (itemDate < startWeek || itemDate > now) return false;
        } else if (period === 'this_month') {
          const startMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
          if (itemDate < startMonth || itemDate > now) return false;
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
        const nome = (item.nome_paciente || '').toLowerCase();
        const fone = (item.telefone_paciente || '').toLowerCase();
        const msg = (item.conteudo_mensagem || '').toLowerCase();
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

    const isabelaStats = getStats(isabelaConvs);
    const secretariaStats = getStats(secretariaConvs);
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
    if (filteredData.length === 0) return;
    const headers = ['ID', 'Data', 'Contato', 'Telefone', 'Origem Atendente', 'Categoria', 'Mensagem', 'Respondida', 'Tempo Espera (min)'];
    const rows = filteredData.map(c => [
      c.id || '',
      c.data_envio ? new Date(c.data_envio).toLocaleString('pt-BR') : '',
      `"${(c.nome_paciente || '').replace(/"/g, '""')}"`,
      c.telefone_paciente || '',
      getAttendantType(c) === 'isabela' ? 'Dra. Isabela' : 'Secretária',
      `"${(c.categoria || '').replace(/"/g, '""')}"`,
      `"${(c.conteudo_mensagem || '').replace(/"/g, '""')}"`,
      c.respondida ? 'Sim' : 'Não',
      c.tempo_espera_minutos ?? ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nutrisa_whatsapp_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

METAS:
1. SLA < 30 min (Meta Ouro <= 15 min).
2. Secretária liderar o volume de mensagens.
3. Intervenções da Dra. em agendamentos <= 2.
4. Bônus Individual da Secretária atrelado ao cumprimento do SLA e absorção das mensagens.

Responda OBRIGATORIAMENTE em JSON puro no formato:
{
  "statusGeral": "Excelente" | "Dentro da Meta" | "Atenção Necessária" | "Crítico",
  "diagnosticoExecutivo": "Texto claro com avaliação geral",
  "atingimentoBonusSecretaria": {
    "status": "Atingido" | "Parcialmente" | "Fora da Meta",
    "motivo": "Justificativa clara sobre o atingimento do bônus"
  },
  "avaliacaoMetas": [
    { "meta": "Tempo de Resposta (< 30 min)", "atingido": boolean, "detalhe": "ex: Média de 12 min registrada" },
    { "meta": "Volume de Mensagens (Secretária > Dra)", "atingido": boolean, "detalhe": "ex: Secretária absorveu 75% do fluxo" },
    { "meta": "Intervenção da Dra. Isabela (Mínima)", "atingido": boolean, "detalhe": "ex: 1 intervenção registrada" },
    { "meta": "Fila de Pendências Zerada", "atingido": boolean, "detalhe": "ex: Nenhuma mensagem atrasada" }
  ],
  "temaPrincipalPacientes": {
    "tema": "Nome do tema",
    "recomendacao": "Orientação para a recepção"
  },
  "planoDeAcao": [
    "Ação prática 1",
    "Ação prática 2",
    "Ação prática 3"
  ]
}
`;

      const result = await callGeminiWithFallback({
        prompt,
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
      diagnosticoExecutivo: `No período avaliado, a recepção registrou tempo médio de resposta de ${secAvg} minutos (${comparisonStats.secretaria.fastRate}% das respostas em até 15 minutos). O volume de atendimento foi satisfatoriamente absorvido pela secretária, mantendo a Dra. Isabela concentrada na rotina clínica.`,
      atingimentoBonusSecretaria: {
        status: isBonusAtingido ? "Atingido" : (isSlaOk || isVolOk ? "Parcialmente" : "Fora da Meta"),
        motivo: isBonusAtingido 
          ? `Parabéns! Tempo médio de ${secAvg} min (abaixo de 30 min) e liderança no volume de atendimentos.`
          : `Tempo médio registrado em ${secAvg} min com pendências em observação.`
      },
      avaliacaoMetas: [
        { meta: "Tempo de Resposta (< 30 min)", atingido: isSlaOk, detalhe: `Média de ${secAvg} min (Meta Ouro <= 15 min)` },
        { meta: "Volume (Secretária > Dra)", atingido: isVolOk, detalhe: `Secretária: ${comparisonStats.secretaria.total} msgs vs Dra: ${comparisonStats.isabela.total} msgs` },
        { meta: "Intervenção Dra. Isabela (<= 2)", atingido: isIntervOk, detalhe: `${comparisonStats.isabelaInterventions} intervenções em agendamentos/valores` },
        { meta: "Fila de Recepção Zerada", atingido: comparisonStats.secretaria.pendingCount === 0, detalhe: `${comparisonStats.secretaria.pendingCount} mensagens aguardando retorno` }
      ],
      temaPrincipalPacientes: {
        tema: categoryChartData[0]?.name || "Agendamento e Horários",
        recomendacao: "Manter templates de respostas rápidas para dúvidas de horários e valores para agilizar o primeiro contato."
      },
      planoDeAcao: [
        "Priorizar retorno aos pacientes que enviarem mensagens entre 08h e 10h (horário de pico).",
        "Encaminhar apenas dúvidas técnicas/clínicas complexas para o celular da Dra. Isabela.",
        "Checar e zerar a fila de mensagens pendentes antes do encerramento do expediente."
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
