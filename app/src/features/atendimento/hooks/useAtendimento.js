import { useState, useEffect, useMemo } from 'react';
import { fetchConversations } from '../services/conversations.js';
import { getAttendantType, isClosingOrGreetingMessage } from '../domain/classification.js';
import { calculateComparisonStats } from '../domain/metrics.js';
import { conversationsCsv } from '../domain/conversations.js';
import { callGeminiWithFallback } from '../../../shared/services/aiClient.js';
import { downloadText } from '../../../shared/utils/download.js';
import { formatWaitTime } from '../../../shared/utils/formatters.js';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/**
 * Hook que encapsula todo o estado, filtragem, estatísticas e geração de IA
 * da tela de Atendimento (Dashboard WhatsApp).
 * @param {{ activeModel: string }} props
 */
export function useAtendimento({ activeModel }) {
  // ── Dados ────────────────────────────────────────────────
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // ── Filtros ──────────────────────────────────────────────
  const [period, setPeriod] = useState('this_month');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [attendantFilter, setAttendantFilter] = useState('all');
  const [ignoreCourtesy, setIgnoreCourtesy] = useState(true);
  const [ignoreOthers, setIgnoreOthers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPdfModal, setShowPdfModal] = useState(false);

  // ── IA ───────────────────────────────────────────────────
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState(null);

  // ── Carregamento ─────────────────────────────────────────
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

  useEffect(() => { loadData(); }, []);

  // ── Filtragem ─────────────────────────────────────────────
  const filteredData = useMemo(() => {
    return conversations.filter(item => {
      if (item.mensagem_texto === '[Atendimento Ativo]') return false;
      if (ignoreCourtesy && isClosingOrGreetingMessage(item)) return false;
      if (ignoreOthers && (item.categoria === 'Outro' || item.categoria === 'Outros' || item.categoria === 'Geral')) return false;

      if (period !== 'all' && item.data_envio) {
        const itemDate = new Date(item.data_envio);
        const now = new Date();
        const latestDate = conversations[0]?.data_envio ? new Date(conversations[0].data_envio) : now;
        const refDate = latestDate > now ? latestDate : now;
        const endDay = new Date(refDate);
        endDay.setHours(23, 59, 59, 999);
        if (period === 'today') {
          const startToday = new Date(refDate); startToday.setHours(0, 0, 0, 0);
          if (itemDate < startToday || itemDate > endDay) return false;
        } else if (period === 'this_week') {
          const startWeek = new Date(refDate);
          const day = startWeek.getDay();
          startWeek.setDate(startWeek.getDate() - day + (day === 0 ? -6 : 1));
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

      if (attendantFilter !== 'all' && getAttendantType(item) !== attendantFilter) return false;
      if (selectedCategory !== 'all' && item.categoria !== selectedCategory) return false;
      if (statusFilter === 'answered' && !item.respondida) return false;
      if (statusFilter === 'pending' && item.respondida) return false;
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

  // ── Estatísticas ─────────────────────────────────────────
  const globalStats = useMemo(() => {
    const total = filteredData.length;
    const answered = filteredData.filter(c => c.respondida).length;
    const pending = total - answered;
    const responseRate = total > 0 ? Math.round((answered / total) * 100) : 0;
    const waitTimes = filteredData
      .filter(c => c.respondida && c.tempo_espera_minutos != null)
      .map(c => Number(c.tempo_espera_minutos));
    const avgWaitMinutes = waitTimes.length > 0
      ? Math.round(waitTimes.reduce((acc, v) => acc + v, 0) / waitTimes.length)
      : 0;
    return { total, answered, pending, responseRate, avgWaitMinutes };
  }, [filteredData]);

  const comparisonStats = useMemo(() => {
    return calculateComparisonStats(filteredData, getAttendantType);
  }, [filteredData]);

  const categoryChartData = useMemo(() => {
    const counts = {};
    filteredData.forEach(c => { const cat = c.categoria || 'Outro'; counts[cat] = (counts[cat] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredData]);

  const attendantComparisonBarData = useMemo(() => ([
    { metrica: 'Tempo Médio', 'Dra. Isabela': comparisonStats.isabela.avg, 'Secretária': comparisonStats.secretaria.avg },
    { metrica: 'Mais Rápida', 'Dra. Isabela': comparisonStats.isabela.min, 'Secretária': comparisonStats.secretaria.min },
    { metrica: 'Mais Demorada', 'Dra. Isabela': comparisonStats.isabela.max, 'Secretária': comparisonStats.secretaria.max },
  ]), [comparisonStats]);

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
    return Object.values(catMap).sort((a, b) => b.total - a.total).slice(0, 6);
  }, [filteredData]);

  const timelineChartData = useMemo(() => {
    const dateMap = {};
    filteredData.forEach(item => {
      if (!item.data_envio) return;
      const d = new Date(item.data_envio);
      const key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!dateMap[key]) dateMap[key] = { data: key, total: 0, isabela: 0, secretaria: 0, sortKey: d.getTime() };
      dateMap[key].total += 1;
      const att = getAttendantType(item);
      if (att === 'isabela') dateMap[key].isabela += 1;
      if (att === 'secretaria') dateMap[key].secretaria += 1;
    });
    return Object.values(dateMap).sort((a, b) => a.sortKey - b.sortKey).slice(-15);
  }, [filteredData]);

  const peakHoursChartData = useMemo(() => {
    const hoursCount = {};
    for (let h = 7; h <= 21; h++) hoursCount[`${h}h`] = { hora: `${h}h`, total: 0, sortKey: h };
    filteredData.forEach(item => {
      if (!item.data_envio) return;
      const h = new Date(item.data_envio).getHours();
      if (h >= 7 && h <= 21) hoursCount[`${h}h`].total += 1;
    });
    return Object.values(hoursCount).sort((a, b) => a.sortKey - b.sortKey);
  }, [filteredData]);

  const makeSlaBreakdown = (filterFn, colors) => {
    let [ate15, de15a30, de30a60, acima60] = [0, 0, 0, 0];
    filteredData.filter(filterFn).forEach(item => {
      const mins = Number(item.tempo_espera_minutos);
      if (mins <= 15) ate15++; else if (mins <= 30) de15a30++; else if (mins <= 60) de30a60++; else acima60++;
    });
    const total = ate15 + de15a30 + de30a60 + acima60;
    if (!total) return [];
    return [
      { faixa: 'Até 15m (Ouro)', count: ate15, pct: Math.round((ate15 / total) * 100), fill: colors[0] },
      { faixa: '15m a 30m', count: de15a30, pct: Math.round((de15a30 / total) * 100), fill: colors[1] },
      { faixa: '30m a 60m', count: de30a60, pct: Math.round((de30a60 / total) * 100), fill: colors[2] },
      { faixa: '> 1 hora', count: acima60, pct: Math.round((acima60 / total) * 100), fill: colors[3] },
    ];
  };

  const slaResolutionBreakdownData = useMemo(() =>
    makeSlaBreakdown(
      item => item.respondida && getAttendantType(item) === 'secretaria' && item.tempo_espera_minutos != null,
      ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'],
    ),
  [filteredData]);

  const slaResolutionDraData = useMemo(() =>
    makeSlaBreakdown(
      item => item.respondida && getAttendantType(item) === 'isabela' && item.tempo_espera_minutos != null,
      ['#14B8A6', '#0EA5E9', '#F59E0B', '#F43F5E'],
    ),
  [filteredData]);

  const uniqueCategories = useMemo(() => Array.from(new Set(conversations.map(c => c.categoria).filter(Boolean))), [conversations]);

  const availableMonths = useMemo(() => {
    const map = new Map();
    conversations.forEach(c => {
      if (!c.data_envio) return;
      const d = new Date(c.data_envio);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map.has(key)) map.set(key, { key, year: d.getFullYear(), month: d.getMonth(), label: `${MONTH_NAMES[d.getMonth()]} de ${d.getFullYear()}`, count: 0 });
      map.get(key).count += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [conversations]);

  const exportToCSV = () => {
    if (!filteredData.length) return;
    downloadText(
      conversationsCsv(filteredData, getAttendantType),
      'nutrisa_whatsapp_' + new Date().toISOString().slice(0, 10) + '.csv',
      'text/csv;charset=utf-8',
    );
  };

  // ── Geração de IA ─────────────────────────────────────────
  const generateAiAnalysis = async () => {
    setIsGeneratingAi(true);
    setAiError(null);
    try {
      const topPatientThemes = categoryChartData.slice(0, 3).map(c => `${c.name} (${c.value} msgs)`).join(', ');
      const intervPct = comparisonStats.isabelaInterventionsPct ?? 0;
      const secAgendamentoPct = comparisonStats.secretariaAgendamentoPct ?? 0;
      const secAgendamentoCount = comparisonStats.secretariaAgendamentoCount ?? 0;

      const prompt = `
Você é o Consultor Executivo e Estratégico de Operações da clínica de nutrição "NutrIsa", liderada pela Dra. Isabela Muñoz.
Gere um Parecer de Desempenho e Alinhamento de Atendimento WhatsApp para a secretária.

DADOS CONSOLIDADOS DO PERÍODO:
- Período: ${period}
- Total de Mensagens: ${globalStats.total}
- Taxa de Resposta: ${globalStats.responseRate}%
- Tempo Médio Geral: ${globalStats.avgWaitMinutes} min
- Secretária: ${comparisonStats.secretaria.total} respostas | Média: ${comparisonStats.secretaria.avg} min | Rápidas (<=15m): ${comparisonStats.secretaria.fastRate}% | Agendamento e Horários: ${secAgendamentoCount} msgs (${secAgendamentoPct}% do total da secretária)
- Dra. Isabela: ${comparisonStats.isabela.total} respostas | Intervenções de Recepção: ${comparisonStats.isabelaInterventions} (${intervPct}% do total de mensagens)
- Temas Mais Frequentes: ${topPatientThemes}

METAS E DIRETRIZES:
1. Tempo: SLA < 30 min (Meta Ouro <= 15 min).
2. Volume: Secretária liderar o volume de mensagens (absorver a maior parte das conversas).
3. Intervenção: Intervenções da Dra. Isabela em agendamentos/recepção no máximo 25% do total de mensagens (atualmente em ${intervPct}%).
4. Categorização: Espera-se que a principal categoria de mensagens enviada pela secretária seja em relação a "Agendamento e Horários" (atualmente em ${secAgendamentoPct}%).
5. Bônus Individual da Secretária atrelado ao cumprimento destas 4 metas (Tempo, Volume, Intervenção <= 25% e Categorização em Agendamentos).

REGRAS CRÍTICAS DE LIMITE DE CARACTERES:
- "motivo" do atingimentoBonusSecretaria: MÁXIMO DE 250 CARACTERES.
- "statusGeralDescricao": MÁXIMO DE 250 CARACTERES.
- "diagnosticoExecutivo": MÁXIMO DE 400 CARACTERES.
- Cada "detalhe" em avaliacaoMetas: MÁXIMO DE 110 CARACTERES.
- "recomendacao" em temaPrincipalPacientes: MÁXIMO DE 300 CARACTERES.
- "planoDeAcao" (soma das 2 a 3 ações): MÁXIMO DE 300 CARACTERES TOTAL.

Responda OBRIGATORIAMENTE em JSON puro no seguinte formato exato:
{
  "statusGeral": "Excelente" | "Dentro da Meta" | "Atenção Necessária" | "Crítico",
  "statusGeralDescricao": "...",
  "diagnosticoExecutivo": "...",
  "atingimentoBonusSecretaria": { "status": "Atingido" | "Parcialmente" | "Fora da Meta", "motivo": "..." },
  "avaliacaoMetas": [
    { "meta": "Tempo", "atingido": boolean, "detalhe": "..." },
    { "meta": "Volume", "atingido": boolean, "detalhe": "..." },
    { "meta": "Intervenção", "atingido": boolean, "detalhe": "..." },
    { "meta": "Categorização", "atingido": boolean, "detalhe": "..." }
  ],
  "temaPrincipalPacientes": { "tema": "...", "recomendacao": "..." },
  "planoDeAcao": ["Ação 1", "Ação 2", "Ação 3"]
}`;

      const { text } = await callGeminiWithFallback({ prompt, jsonMode: true, model: activeModel });
      const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      setAiAnalysis(JSON.parse(clean));
    } catch (err) {
      setAiError('Erro ao gerar análise: ' + err.message);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return {
    // Dados e estado
    conversations, loading, error, lastUpdated, loadData,
    // Filtros
    period, setPeriod,
    selectedCategory, setSelectedCategory,
    statusFilter, setStatusFilter,
    attendantFilter, setAttendantFilter,
    ignoreCourtesy, setIgnoreCourtesy,
    ignoreOthers, setIgnoreOthers,
    searchTerm, setSearchTerm,
    showPdfModal, setShowPdfModal,
    // Dados processados
    filteredData,
    globalStats,
    comparisonStats,
    categoryChartData,
    attendantComparisonBarData,
    topCategoriesComparisonData,
    timelineChartData,
    peakHoursChartData,
    slaResolutionBreakdownData,
    slaResolutionDraData,
    uniqueCategories,
    availableMonths,
    // Ações
    exportToCSV,
    // IA
    aiAnalysis, isGeneratingAi, aiError, generateAiAnalysis,
    // Utilitários de formatação
    formatWaitTime,
    getAttendantType,
  };
}
