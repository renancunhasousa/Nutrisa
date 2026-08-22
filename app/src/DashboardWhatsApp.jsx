import React, { useState, useEffect, useMemo } from 'react';
import logo from './assets/logo.png';
import { 
  fetchConversations 
} from './supabase';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend 
} from 'recharts';
import { 
  MessageSquare, Clock, CheckCircle2, AlertCircle, Users, 
  RefreshCw, Search, Filter, Calendar, MessageCircle, 
  TrendingUp, Download, Eye, ArrowUpRight, ShieldCheck, 
  Phone, Sparkles, Smartphone, Laptop, UserCheck, Briefcase,
  Zap, Award, Timer, Activity, Printer, FileText, ArrowLeft, Check
} from 'lucide-react';

const COLORS = [
  '#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', 
  '#06B6D4', '#F97316', '#6366F1', '#14B8A6', '#84CC16'
];

const CATEGORY_COLORS = {
  'Agendamento e Horários': 'bg-blue-100 text-blue-800 border-blue-200',
  'Dúvida Plano Alimentar': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Dificuldades e Sintomas': 'bg-amber-100 text-amber-800 border-amber-200',
  'Exames e Documentos': 'bg-purple-100 text-purple-800 border-purple-200',
  'Suplementação e Receitas': 'bg-teal-100 text-teal-800 border-teal-200',
  'Pagamentos e Financeiro': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Planos e Pacotes': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Feedback e Motivação': 'bg-pink-100 text-pink-800 border-pink-200',
  'Outro': 'bg-slate-100 text-slate-700 border-slate-200'
};

// Helper para identificar o atendente que efetivamente respondeu
const getAttendantType = (item) => {
  const src = (item.source || '').toLowerCase();
  const resp = (item.resposta_secretaria || '').toLowerCase();
  
  // Dra. Isabela = Celular Primário ou Notebook Pessoal ou mensagem identificada como dela
  if (src === 'primario' || src === 'notebook' || resp.includes('dra isabela') || resp.includes('isabela muñoz')) {
    return 'isabela';
  }
  // Secretária = Celular Secundário conectado / Recepção
  if (src === 'secretaria' || item.categoria_secretaria) {
    return 'secretaria';
  }
  return 'outros';
};

// Helper para identificar o Papel / Responsável Esperado com base no assunto da mensagem do paciente
export const getExpectedRole = (item) => {
  const cat = item.categoria || '';
  
  // Administrativo / Recepção -> Responsabilidade da Secretária
  if (['Agendamento e Horários', 'Pagamentos e Financeiro', 'Planos e Pacotes'].includes(cat)) {
    return 'secretaria';
  }
  // Clínico / Técnico -> Responsabilidade da Nutricionista (Dra. Isabela)
  if (['Dúvida Plano Alimentar', 'Dificuldades e Sintomas', 'Exames e Documentos', 'Suplementação e Receitas'].includes(cat)) {
    return 'isabela';
  }
  return 'geral'; // Feedback e Motivação, Outro, etc.
};

// Expressões e palavras típicas de encerramento / cortesia / confirmação rápida
const COURTESY_PHRASES = [
  'obrigado', 'obrigada', 'obg', 'obgd', 'valeu', 'vlw', 'brigado', 'brigada',
  'ok', 'okk', 'blz', 'beleza', 'combinado', 'combinadissimo', 'ta bom', 'tá bom', 'tabom', 'certo',
  'sim', 'simm', 'nao', 'não', 'pode ser', 'pode sim', 'pode vir', 'perfeito', 'show', 'otimo', 'ótimo',
  'bom dia', 'boa tarde', 'boa noite', 'ola', 'olá', 'oii', 'oi', 'oie', 'ate mais', 'até mais', 'tchau'
];

// Helper para identificar se uma mensagem é apenas cortesia, encerramento ou reação curta
export const isClosingOrGreetingMessage = (item) => {
  const text = (item.mensagem_texto || '').trim().toLowerCase();
  
  // Mensagens vazias ou só pontuação/espaço
  if (!text || text.length === 0) return true;
  
  // Remove pontuações e emojis para checar a palavra raiz
  const clean = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?!👍🙏👏❤️😊🙌🏼💪🏻✨🎉✅🎯]/g, '').trim();
  
  // Se após remover pontuação/emoji não sobrar nada (ex: só mandou emoji/figurinha)
  if (!clean && text.length > 0) return true;

  // Mensagens com até 25 caracteres que coincidem com termos de cortesia
  if (clean.length <= 25) {
    if (COURTESY_PHRASES.includes(clean)) return true;
    if (COURTESY_PHRASES.some(p => clean === p || clean === `${p} ${p}` || clean.startsWith(`${p} `) && clean.length <= 15)) {
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
  const [period, setPeriod] = useState('30days'); // 'today', '7days', '30days', 'all'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'answered', 'pending'
  const [attendantFilter, setAttendantFilter] = useState('all'); // 'all', 'isabela', 'secretaria'
  const [ignoreCourtesy, setIgnoreCourtesy] = useState(true); // Ignora mensagens como "ok", "obrigado", emojis, etc.
  const [ignoreOthers, setIgnoreOthers] = useState(true); // Ignora mensagens da categoria "Outro" / "Outros" nas métricas de SLA
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false); // Modal de Simulação & Impressão de PDF para a Secretária

  // Estado da Análise com IA (Gemini)
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState(null);

  // --- INTEGRAÇÃO GEMINI COM CASCATA DE MODELOS ---
  const callGemini = async (prompt, isJson = false) => {
    const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      throw new Error("Chave VITE_GEMINI_API_KEY não configurada.");
    }
    const initialModel = localStorage.getItem('nutrisa_selected_model') || import.meta.env.VITE_GEMINI_MODEL || "gemini-3.7-flash";
    
    const fallbackChain = [
      "gemini-3.7-flash",
      "gemini-3.5-flash-lite",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite"
    ];
    const modelsToTry = [initialModel, ...fallbackChain.filter(m => m !== initialModel)];

    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3
      }
    };
    if (isJson) payload.generationConfig.responseMimeType = "application/json";

    let lastError = null;
    for (let i = 0; i < modelsToTry.length; i++) {
      const model = modelsToTry[i];
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errBody = await response.text();
          console.warn(`[Gemini Dashboard] Modelo ${model} retornou ${response.status}: ${errBody}`);
          lastError = new Error(`Erro ${response.status} no modelo ${model}`);
          continue;
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error("Falha ao comunicar com os modelos do Gemini.");
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchConversations({ limit: 3000 });
      setConversations(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'Erro ao carregar dados do Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtragem de dados com base nas seleções
  const filteredData = useMemo(() => {
    const now = new Date();

    return conversations.filter(item => {
      const itemDate = item.data_envio ? new Date(item.data_envio) : null;

      // Filtro de mensagens de cortesia / encerramento / reações rápidas
      if (ignoreCourtesy && isClosingOrGreetingMessage(item)) {
        return false;
      }

      // Filtro da categoria "Outro" / "Outros"
      if (ignoreOthers && selectedCategory === 'all') {
        const cat = (item.categoria || '').trim().toLowerCase();
        if (cat === 'outro' || cat === 'outros' || cat === '') {
          return false;
        }
      }

      // Filtro de período
      if (itemDate && period !== 'all') {
        if (period === 'today') {
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
          if (itemDate < todayStart) return false;
        } else if (period === 'this_week') {
          const day = now.getDay(); // 0 domingo, 1 segunda...
          const diffToMonday = day === 0 ? -6 : 1 - day;
          const mondayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday, 0, 0, 0);
          if (itemDate < mondayStart) return false;
        } else if (period === 'this_month') {
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
          if (itemDate < monthStart) return false;
        } else if (period.startsWith('month:')) {
          const [y, m] = period.replace('month:', '').split('-');
          const year = parseInt(y, 10);
          const month = parseInt(m, 10) - 1;
          if (itemDate.getFullYear() !== year || itemDate.getMonth() !== month) {
            return false;
          }
        }
      }

      // Filtro de categoria
      if (selectedCategory !== 'all' && item.categoria !== selectedCategory) {
        return false;
      }

      // Filtro de status
      if (statusFilter === 'answered' && !item.respondida) return false;
      if (statusFilter === 'pending' && item.respondida) return false;

      // Filtro por Atendente (Dra. Isabela vs Secretária)
      if (attendantFilter !== 'all') {
        const att = getAttendantType(item);
        if (attendantFilter === 'isabela' && att !== 'isabela') return false;
        if (attendantFilter === 'secretaria' && att !== 'secretaria') return false;
      }

      // Filtro de busca textual
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const nome = (item.nome_contato || '').toLowerCase();
        const texto = (item.mensagem_texto || '').toLowerCase();
        const resposta = (item.resposta_secretaria || '').toLowerCase();
        const jid = (item.contato_jid || '').toLowerCase();
        if (!nome.includes(term) && !texto.includes(term) && !resposta.includes(term) && !jid.includes(term)) {
          return false;
        }
      }

      return true;
    });
  }, [conversations, period, selectedCategory, statusFilter, attendantFilter, ignoreCourtesy, ignoreOthers, searchTerm]);

  // Estatísticas Globais
  const globalStats = useMemo(() => {
    const total = filteredData.length;
    const answeredCount = filteredData.filter(i => i.respondida).length;
    const pendingCount = total - answeredCount;
    const responseRate = total > 0 ? Math.round((answeredCount / total) * 100) : 0;
    const uniqueContacts = new Set(filteredData.map(i => i.contato_jid).filter(Boolean)).size;

    const validTimes = filteredData
      .filter(i => i.respondida && typeof i.tempo_espera_minutos === 'number' && i.tempo_espera_minutos >= 0)
      .map(i => Math.round(i.tempo_espera_minutos));

    const avgWaitMinutes = validTimes.length > 0
      ? Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length)
      : null;

    const minWaitMinutes = validTimes.length > 0 ? Math.min(...validTimes) : null;
    const maxWaitMinutes = validTimes.length > 0 ? Math.max(...validTimes) : null;

    const fastResponses = validTimes.filter(t => t <= 15).length;
    const fastRate = validTimes.length > 0 ? Math.round((fastResponses / validTimes.length) * 100) : 0;

    return {
      total,
      answeredCount,
      pendingCount,
      responseRate,
      uniqueContacts,
      avgWaitMinutes,
      minWaitMinutes,
      maxWaitMinutes,
      fastRate
    };
  }, [filteredData]);

  // Estatísticas Comparativas: Dra. Isabela vs Secretária
  const comparisonStats = useMemo(() => {
    const answeredList = filteredData.filter(i => i.respondida);
    const pendingList = filteredData.filter(i => !i.respondida);

    const isabelaItems = answeredList.filter(i => getAttendantType(i) === 'isabela');
    const secretariaItems = answeredList.filter(i => getAttendantType(i) === 'secretaria');

    // Mensagens de responsabilidade da Secretária que a Dra. Isabela precisou responder (Intervenções)
    const isabelaInterventions = isabelaItems.filter(i => getExpectedRole(i) === 'secretaria').length;

    // Mensagens pendentes classificadas por quem deveria responder
    const pendingIsabela = pendingList.filter(i => getExpectedRole(i) === 'isabela').length;
    const pendingSecretaria = pendingList.filter(i => getExpectedRole(i) === 'secretaria').length;
    const pendingGeral = pendingList.filter(i => getExpectedRole(i) === 'geral').length;

    const calcMetrics = (list, pendingCount) => {
      const total = list.length;
      const times = list
        .filter(i => typeof i.tempo_espera_minutos === 'number' && i.tempo_espera_minutos >= 0)
        .map(i => Math.round(i.tempo_espera_minutos));

      const avg = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;
      const min = times.length > 0 ? Math.min(...times) : null;
      const max = times.length > 0 ? Math.max(...times) : null;
      const fast = times.filter(t => t <= 15).length;
      const fastRate = times.length > 0 ? Math.round((fast / times.length) * 100) : 0;

      // Contagem de categorias respondidas
      const catCounts = {};
      list.forEach(i => {
        const cat = i.categoria || 'Geral';
        catCounts[cat] = (catCounts[cat] || 0) + 1;
      });

      const topCategories = Object.entries(catCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      return { total, avg, min, max, fastRate, topCategories, pendingCount };
    };

    return {
      isabela: calcMetrics(isabelaItems, pendingIsabela),
      secretaria: calcMetrics(secretariaItems, pendingSecretaria),
      pendingGeral,
      isabelaInterventions,
      totalAnswered: answeredList.length
    };
  }, [filteredData]);

  // Gráfico Comparativo de SLA / Tempos (Dra vs Secretária)
  const attendantComparisonBarData = useMemo(() => {
    if (!comparisonStats.isabela.avg && !comparisonStats.secretaria.avg) return [];

    return [
      {
        metrica: 'Tempo Médio',
        'Dra. Isabela': comparisonStats.isabela.avg || 0,
        'Secretária': comparisonStats.secretaria.avg || 0
      },
      {
        metrica: 'Tempo Mínimo',
        'Dra. Isabela': comparisonStats.isabela.min || 0,
        'Secretária': comparisonStats.secretaria.min || 0
      },
      {
        metrica: 'Tempo Máximo',
        'Dra. Isabela': comparisonStats.isabela.max || 0,
        'Secretária': comparisonStats.secretaria.max || 0
      }
    ];
  }, [comparisonStats]);

  // Gráfico de Categorias dos Pacientes (Geral)
  const categoryChartData = useMemo(() => {
    const counts = {};
    filteredData.forEach(item => {
      const cat = item.categoria || 'Não classificada';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // Gráfico de Categorias da Dra. Isabela vs Secretária
  const topCategoriesComparisonData = useMemo(() => {
    const categoriesSet = new Set();
    comparisonStats.isabela.topCategories.forEach(c => categoriesSet.add(c.name));
    comparisonStats.secretaria.topCategories.forEach(c => categoriesSet.add(c.name));

    const isabelaMap = Object.fromEntries(comparisonStats.isabela.topCategories.map(c => [c.name, c.count]));
    const secretariaMap = Object.fromEntries(comparisonStats.secretaria.topCategories.map(c => [c.name, c.count]));

    return Array.from(categoriesSet)
      .map(cat => ({
        categoria: cat,
        'Dra. Isabela': isabelaMap[cat] || 0,
        'Secretária': secretariaMap[cat] || 0,
        total: (isabelaMap[cat] || 0) + (secretariaMap[cat] || 0)
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [comparisonStats]);

  // Dados para Gráfico de Volume por Data (Linhas / Área)
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

  // Gráfico de Horários de Pico dos Pacientes (Volume por hora do dia)
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

  // Gráfico de Distribuição por Faixas de Tempo de Resposta da Secretária
  const slaResolutionBreakdownData = useMemo(() => {
    let ate15 = 0;
    let de15a30 = 0;
    let de30a60 = 0;
    let acima60 = 0;

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

  // Gráfico de Distribuição por Faixas de Tempo de Resposta da Dra. Isabela
  const slaResolutionDraData = useMemo(() => {
    let ate15 = 0;
    let de15a30 = 0;
    let de30a60 = 0;
    let acima60 = 0;

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

  const uniqueCategories = useMemo(() => {
    const cats = new Set(conversations.map(c => c.categoria).filter(Boolean));
    return Array.from(cats);
  }, [conversations]);

  // Lista dinâmica de meses disponíveis na base de dados
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
    const headers = ['ID', 'Data', 'Contato', 'JID', 'Origem Atendente', 'Categoria Paciente', 'Mensagem', 'Respondida', 'Tempo Espera (min)', 'Categoria Secretária', 'Resposta'];
    const rows = filteredData.map(c => [
      c.id_mensagem || '',
      c.data_envio ? new Date(c.data_envio).toLocaleString('pt-BR') : '',
      `"${(c.nome_contato || '').replace(/"/g, '""')}"`,
      c.contato_jid || '',
      getAttendantType(c) === 'isabela' ? 'Dra. Isabela' : (getAttendantType(c) === 'secretaria' ? 'Secretária' : 'Outros'),
      `"${(c.categoria || '').replace(/"/g, '""')}"`,
      `"${(c.mensagem_texto || '').replace(/"/g, '""')}"`,
      c.respondida ? 'Sim' : 'Não',
      c.tempo_espera_minutos ?? '',
      `"${(c.categoria_secretaria || '').replace(/"/g, '""')}"`,
      `"${(c.resposta_secretaria || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nutrisa_atendimento_comparativo_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função para gerar o parecer com Inteligência Artificial considerando as metas da clínica e individuais
  const generateAiAnalysis = async () => {
    setIsGeneratingAi(true);
    setAiError(null);
    try {
      // Top 3 assuntos mais frequentes dos pacientes
      const topPatientThemes = categoryChartData.slice(0, 3).map(c => `${c.name} (${c.value} msgs)`).join(', ');

      const prompt = `
Você é o Consultor Executivo e Estratégico de Operações da clínica de nutrição "NutrIsa", liderada pela Dra. Isabela Muñoz.
Sua missão é gerar um Parecer de Desempenho e Alinhamento de Atendimento WhatsApp para a equipe de recepção/secretária.
A secretária tem metas individuais atreladas a bônus financeiro em dinheiro, além das metas gerais da clínica.

### DADOS CONSOLIDADOS DO PERÍODO:
- Período Analisado: ${period === 'today' ? 'Hoje' : period === 'this_week' ? 'Semana Atual' : period === 'this_month' ? 'Mês Atual' : period}
- Total de Mensagens no Período: ${globalStats.total}
- Taxa Geral de Respostas: ${globalStats.responseRate}%
- Tempo Médio Geral de Espera: ${globalStats.avgWaitMinutes ? `${globalStats.avgWaitMinutes} min` : 'N/D'}

### PERFORMANCE DA SECRETÁRIA (ROXO):
- Total de Respostas Enviadas: ${comparisonStats.secretaria.total} msgs (${comparisonStats.totalAnswered > 0 ? Math.round((comparisonStats.secretaria.total / comparisonStats.totalAnswered) * 100) : 0}% do total)
- Tempo Médio de Resposta: ${comparisonStats.secretaria.avg ? `${comparisonStats.secretaria.avg} min` : 'N/D'}
- Menor Tempo: ${comparisonStats.secretaria.min ? `${comparisonStats.secretaria.min} min` : 'N/D'}
- Maior Tempo: ${comparisonStats.secretaria.max ? `${comparisonStats.secretaria.max} min` : 'N/D'}
- Respostas Rápidas (em até 15 min): ${comparisonStats.secretaria.fastRate}%
- Principais Assuntos que a Secretária Atendeu: ${comparisonStats.secretaria.topCategories.slice(0, 3).map(c => `${c.name} (${c.count})`).join(', ') || 'Nenhum'}
- Mensagens de Recepção Pendentes na Fila: ${comparisonStats.secretaria.pendingCount}

### PERFORMANCE DA DRA. ISABELA (VERDE TIFFANY):
- Total de Respostas Enviadas: ${comparisonStats.isabela.total} msgs
- Tempo Médio de Resposta: ${comparisonStats.isabela.avg ? `${comparisonStats.isabela.avg} min` : 'N/D'}
- Intervenções de Recepção da Dra. Isabela: ${comparisonStats.isabelaInterventions} (casos em que a Dra. precisou intervir em agendamentos/valores)

### PRINCIPAIS TEMAS GERAIS DOS PACIENTES:
${topPatientThemes || 'Geral'}

---

### METAS E DIRETRIZES DA CLÍNICA NUTRISA:
1. **Meta de SLA de Resposta:** Tempo médio menor que 30 minutos (Meta Ouro: até 15 minutos).
2. **Distribuição de Volume:** A Secretária deve ter um volume de mensagens enviadas MAIOR que a Dra. Isabela (para liberar a Dra. para focar 100% no atendimento clínico e dietas).
3. **Assuntos Foco da Secretária:** Deve priorizar "Agendamento e Horários", "Pagamentos e Financeiro" e "Feedback e Motivação".
4. **Intervenções da Dra. Isabela:** Meta de no máximo 2 a 3 intervenções por período. A meta é INTERVENÇÃO MÍNIMA (zero intervenções em agendamentos).
5. **Atenção da Clínica:** Destacar qual é o principal tema que os pacientes mais enviam e como a clínica deve atuar preventivamente.
6. **Bonificação Individual:** Destacar o atingimento das metas individuais da secretária que dão direito ao bônus em dinheiro.

---

### FORMATO DA RESPOSTA (Retorne em JSON estruturado):
Retorne estritamente um JSON com a seguinte estrutura:
{
  "statusGeral": "Excelente" | "Dentro da Meta" | "Requer Atenção" | "Crítico",
  "atingimentoBonusSecretaria": {
    "status": "Atingido" | "Parcialmente" | "Fora da Meta",
    "motivo": "Texto curto explicando o atingimento das metas individuais para o bônus em dinheiro"
  },
  "diagnosticoExecutivo": "Texto de 2 a 3 parágrafos claros, elegantes e motivadores com o balanço do período.",
  "avaliacaoMetas": [
    { "meta": "Tempo Médio", "atingido": true/false, "detalhe": "Detalhe da média da secretária" },
    { "meta": "Volume", "atingido": true/false, "detalhe": "Comparação de mensagens" },
    { "meta": "Intervenções", "atingido": true/false, "detalhe": "Intervenções registradas" },
    { "meta": "Pendências", "atingido": true/false, "detalhe": "Pendências atuais" }
  ],
  "temaPrincipalPacientes": {
    "tema": "Nome do principal tema",
    "recomendacao": "Orientação para a clínica/secretária atender com prioridade esse assunto"
  },
  "planoDeAcao": [
    "Ação 1 prática e direta para a secretária",
    "Ação 2 prática e direta para a secretária",
    "Ação 3 prática e direta para a secretária"
  ]
}
`;

      const responseText = await callGemini(prompt, true);
      const parsed = JSON.parse(responseText);
      setAiAnalysis(parsed);
    } catch (err) {
      console.error("Erro ao gerar análise de IA:", err);
      setAiError(err.message || "Erro ao conectar com o Gemini.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Carregar dados de Demonstração instantaneamente sem consumir cota da IA
  const loadDemoAiAnalysis = () => {
    const isFast = (comparisonStats.secretaria.avg || 0) <= 30;
    const isMoreVolume = comparisonStats.secretaria.total >= comparisonStats.isabela.total;
    const isBonusAtingido = isFast && isMoreVolume && comparisonStats.secretaria.pendingCount <= 5;

    setAiAnalysis({
      statusGeral: isBonusAtingido ? "Excelente" : "Dentro da Meta",
      atingimentoBonusSecretaria: {
        status: isBonusAtingido ? "Atingido" : isFast ? "Parcialmente" : "Fora da Meta",
        motivo: `Tempo médio de resposta de ${comparisonStats.secretaria.avg || 18} min (${comparisonStats.secretaria.fastRate || 85}% em até 15m) com ${comparisonStats.secretaria.total} atendimentos realizados e fila de pendências controlada.`
      },
      diagnosticoExecutivo: `No período analisado (${period === 'today' ? 'Hoje' : period === 'this_week' ? 'Semana Atual' : period === 'this_month' ? 'Mês Atual' : 'Período Selecionado'}), a equipe de recepção demonstrou alto engajamento operacional, absorvendo ${comparisonStats.totalAnswered > 0 ? Math.round((comparisonStats.secretaria.total / comparisonStats.totalAnswered) * 100) : 65}% do volume total de mensagens da clínica.\n\nA triagem rápida garantiu que os agendamentos e dúvidas financeiras fossem resolvidos com agilidade, mantendo o canal da Dra. Isabela preservado para condutas e alinhamentos clínicos com os pacientes.`,
      avaliacaoMetas: [
        { 
          meta: "Tempo Médio", 
          atingido: isFast, 
          detalhe: `${comparisonStats.secretaria.avg || 18} min (Meta < 30m)` 
        },
        { 
          meta: "Volume", 
          atingido: isMoreVolume, 
          detalhe: `${comparisonStats.secretaria.total} secretária vs ${comparisonStats.isabela.total} Dra.` 
        },
        { 
          meta: "Intervenções", 
          atingido: comparisonStats.isabelaInterventions <= 3, 
          detalhe: `${comparisonStats.isabelaInterventions} intervenções registradas` 
        },
        { 
          meta: "Pendências", 
          atingido: comparisonStats.secretaria.pendingCount <= 5, 
          detalhe: `${comparisonStats.secretaria.pendingCount} na fila de espera` 
        }
      ],
      temaPrincipalPacientes: {
        tema: categoryChartData[0]?.name || "Agendamento e Horários",
        recomendacao: "Manter templates de respostas rápidas para horários disponíveis e confirmação de consultas com antecedência de 24h."
      },
      planoDeAcao: [
        "Priorizar as primeiras respostas da manhã em até 15 minutos para zerar a fila acumulada da noite.",
        "Padronizar o envio de lembretes e links de confirmação de agendamento na véspera da consulta.",
        "Monitorar dúvidas sobre exames e encaminhar com contexto pronto caso exija validação da Dra. Isabela."
      ]
    });
  };

  const formatWaitTime = (mins) => {
    if (mins === null || mins === undefined) return '-';
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  // Se estiver visualizando a página do Relatório PDF (Igual ao Step 3 do Laudo Físico)
  if (showPdfModal) {
    return (
      <div className="animate-fadeIn pb-12 space-y-6">
        
        {/* Barra de Ações Superior (Idêntica ao Step 3 do Laudo) */}
        <div className="bg-white p-4 md:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto w-full print:hidden">
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
            <span className="text-xs font-extrabold text-slate-900 hidden sm:inline-block">
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
        <div className="bg-white border border-slate-300 rounded-none md:rounded-2xl shadow-lg p-6 md:p-10 text-slate-800 max-w-4xl mx-auto w-full space-y-6 print:space-y-4 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none a4-print-page print:break-after-page">
          
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
                    <p className="text-[11px] text-slate-600">
                      Avaliação integrada de tempo médio, distribuição de volume e autonomia de recepção.
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
                        <p className="text-[10px] text-slate-700 font-semibold">{m.detalhe}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Destaque: Principal Tema dos Pacientes & Plano de Ação */}
                <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-3 text-xs">
                  {aiAnalysis.temaPrincipalPacientes && (
                    <div className="p-3.5 bg-teal-50/50 border border-teal-200 rounded-2xl">
                      <span className="text-[10px] font-black text-teal-900 uppercase block mb-1">
                        📢 Tema Mais Frequente dos Pacientes: {aiAnalysis.temaPrincipalPacientes.tema}
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

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Top Header Banner - Clean Luxury SaaS Style */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-slate-200 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Painel de Produtividade & SLA WhatsApp
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Análise comparativa de volume, tempos de resposta (médio, mín., máx.) e categorias atendidas entre Dra. Isabela e Secretária.
            </p>
          </div>

          <div className="flex items-center space-x-3 flex-wrap gap-y-2">
            {lastUpdated && (
              <span className="text-xs text-slate-500 bg-slate-50 px-3.5 py-2 rounded-full border border-slate-200 flex items-center font-medium shadow-2xs">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                Atualizado às {lastUpdated.toLocaleTimeString('pt-BR')}
              </span>
            )}
            <button
              onClick={loadData}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-full transition-all shadow-xs flex items-center space-x-1.5 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Carregando...' : 'Atualizar'}</span>
            </button>
            <button
              onClick={exportToCSV}
              className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-full transition-all border border-slate-200 shadow-2xs flex items-center space-x-1.5 active:scale-95"
              title="Exportar dados filtrados para CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => setShowPdfModal(true)}
              className="bg-white hover:bg-slate-50 text-emerald-800 font-bold text-xs px-4 py-2.5 rounded-full transition-all border border-emerald-300 shadow-2xs flex items-center space-x-1.5 active:scale-95 hover:border-emerald-400"
              title="Visualizar simulação do relatório e imprimir em PDF para a secretária"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-600" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Barra de Filtros Completa - Layout Equilibrado em 4 Colunas com Fundo Branco */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            
            {/* 1. Período */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-extrabold text-slate-700 flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Período
                </label>
                {period.startsWith('month:') && (
                  <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Mês Ativo
                  </span>
                )}
              </div>

              {/* Botões Rápidos */}
              <div className="grid grid-cols-4 gap-1 text-[11px] font-semibold bg-slate-100/80 p-1 rounded-xl">
                {[
                  { id: 'today', label: 'Hoje' },
                  { id: 'this_week', label: 'Semana' },
                  { id: 'this_month', label: 'Mês' },
                  { id: 'all', label: 'Tudo' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setPeriod(item.id)}
                    className={`py-1.5 rounded-lg transition-all text-center whitespace-nowrap text-[11px] font-bold ${
                      period === item.id 
                        ? 'bg-white text-emerald-700 shadow-xs' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Select de Meses Passados */}
              <select
                value={period.startsWith('month:') ? period : ''}
                onChange={e => {
                  if (e.target.value) setPeriod(e.target.value);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
              >
                <option value="">🗓️ Meses anteriores ({availableMonths.length})...</option>
                {availableMonths.map(m => (
                  <option key={m.key} value={`month:${m.key}`}>
                    {m.label} ({m.count} msgs)
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Atendente */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-2.5">
              <label className="text-[10px] uppercase font-extrabold text-slate-700 flex items-center">
                <Users className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Origem / Atendente
              </label>
              <select
                value={attendantFilter}
                onChange={e => setAttendantFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
              >
                <option value="all">Todas as Origens (Dra + Secretária)</option>
                <option value="isabela">👩‍⚕️ Somente Dra. Isabela</option>
                <option value="secretaria">💼 Somente Secretária</option>
              </select>
              <div className="flex items-center space-x-3 text-[11px] text-slate-600 pt-1">
                <span className="flex items-center font-medium"><span className="w-2.5 h-2.5 rounded-full bg-teal-500 mr-1.5 inline-block"></span> Dra. Isabela</span>
                <span className="flex items-center font-medium"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 mr-1.5 inline-block"></span> Secretária</span>
              </div>
            </div>

            {/* 3. Categoria & Status com Toggle de Ignorar Outros */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-2.5">
              <div className="flex items-center justify-between gap-1.5">
                <label className="text-[10px] uppercase font-extrabold text-slate-700 flex items-center whitespace-nowrap">
                  <Filter className="w-3.5 h-3.5 mr-1 text-emerald-600 flex-shrink-0" /> Filtros
                </label>
                <button
                  onClick={() => setIgnoreOthers(!ignoreOthers)}
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold transition-all flex items-center border active:scale-95 whitespace-nowrap flex-shrink-0 ${
                    ignoreOthers
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                  title="Quando ativado, oculta a categoria 'Outros' das métricas de SLA e gráficos para focar nos atendimentos essenciais"
                >
                  <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600 flex-shrink-0" />
                  {ignoreOthers ? 'Filtro Outros ON' : 'Filtro Outros OFF'}
                </button>
              </div>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
              >
                <option value="all">Todas as Categorias ({uniqueCategories.length})</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
              >
                <option value="all">Todos os Status (Respondidas + Pendentes)</option>
                <option value="answered">Respondidas ✅</option>
                <option value="pending">Aguardando Resposta ⏳</option>
              </select>
            </div>

            {/* 4. Busca Paciente & Toggle Cortesia */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-extrabold text-slate-700 flex items-center">
                  <Search className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Buscar Paciente
                </label>
                <button
                  onClick={() => setIgnoreCourtesy(!ignoreCourtesy)}
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold transition-all flex items-center border active:scale-95 ${
                    ignoreCourtesy
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                  title="Quando ativado, ignora reações como 'ok', 'obrigado', emojis e figurinhas para não sujar o SLA e pendências"
                >
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  {ignoreCourtesy ? 'Filtro Cortesia ON' : 'Filtro Cortesia OFF'}
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Ex: Letícia, Creatina..."
                  className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2 pr-7 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-700"
                  >
                    ✕
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-500 truncate">
                {ignoreCourtesy ? '✨ Sem cortesia / emojis' : 'Exibindo cortesia'} • {ignoreOthers ? '🏷️ Sem categoria "Outros"' : 'Com "Outros"'}
              </p>
            </div>

          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center space-x-3 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO PRINCIPAL: COMPARATIVO DIRETO DRA. ISABELA (VERDE TIFFANY) vs SECRETÁRIA (ROXO) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CARD DRA. ISABELA (VERDE TIFFANY / TEAL - LUXURY CLEAN STYLE) */}
        <div className="bg-white rounded-3xl p-6 md:p-7 border border-teal-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-teal-100">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-extrabold text-2xl shadow-2xs">
                  👩‍⚕️
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">Dra. Isabela Muñoz</h3>
                  <span className="text-[11px] text-teal-800 bg-teal-50 px-3 py-0.5 rounded-full font-bold border border-teal-200/70 inline-block mt-0.5">
                    Atendimento Clínico • Primário & Web
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-teal-700 block">
                  {comparisonStats.isabela.total}
                </span>
                <span className="text-[10px] block text-slate-400 uppercase font-bold tracking-wider">
                  {comparisonStats.totalAnswered > 0 ? Math.round((comparisonStats.isabela.total / comparisonStats.totalAnswered) * 100) : 0}% das respostas
                </span>
              </div>
            </div>

            {/* Grid de Tempos SLA da Dra. Isabela */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              <div className="bg-teal-50/50 p-3.5 rounded-2xl border border-teal-100 text-center">
                <span className="text-[10px] font-extrabold uppercase text-teal-800 block flex items-center justify-center tracking-wider">
                  <Clock className="w-3 h-3 mr-1 text-teal-600" /> Média
                </span>
                <span className="text-xl font-black text-slate-900 mt-1 block">
                  {formatWaitTime(comparisonStats.isabela.avg)}
                </span>
                <span className="text-[9.5px] font-semibold text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded-full inline-block mt-1">
                  {comparisonStats.isabela.fastRate}% em até 15m
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] font-extrabold uppercase text-slate-600 block flex items-center justify-center tracking-wider">
                  <Zap className="w-3 h-3 mr-1 text-emerald-600" /> Mínimo
                </span>
                <span className="text-xl font-black text-slate-900 mt-1 block">
                  {formatWaitTime(comparisonStats.isabela.min)}
                </span>
                <span className="text-[9.5px] text-slate-500 font-medium block mt-1">Mais rápida</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] font-extrabold uppercase text-slate-600 block flex items-center justify-center tracking-wider">
                  <Timer className="w-3 h-3 mr-1 text-amber-600" /> Máximo
                </span>
                <span className="text-xl font-black text-slate-900 mt-1 block">
                  {formatWaitTime(comparisonStats.isabela.max)}
                </span>
                <span className="text-[9.5px] text-slate-500 font-medium block mt-1">Mais demorada</span>
              </div>
            </div>
          </div>

          {/* Top Categorias & Pendências da Dra. Isabela */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                Principais Assuntos:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {comparisonStats.isabela.topCategories.slice(0, 3).map(c => (
                  <span key={c.name} className="text-xs bg-slate-100 text-slate-800 font-medium border border-slate-200 px-2.5 py-1 rounded-xl">
                    {c.name}: <strong>{c.count}</strong>
                  </span>
                ))}
                {comparisonStats.isabela.topCategories.length === 0 && (
                  <span className="text-xs text-slate-400 italic">Nenhum registro no período</span>
                )}
              </div>
            </div>

            {/* Badges de Fila & Intervenções */}
            <div className="flex sm:flex-col gap-2 items-start sm:items-end">
              <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold border flex items-center shadow-2xs ${
                comparisonStats.isabela.pendingCount > 0 
                  ? 'bg-rose-50 text-rose-800 border-rose-200' 
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                ⏳ {comparisonStats.isabela.pendingCount} Clínicas na Fila
              </span>
              {comparisonStats.isabelaInterventions > 0 && (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200" title="Mensagens de agendamento/financeiro que a Dra. Isabela respondeu diretamente">
                  ⚡ {comparisonStats.isabelaInterventions} intervenções recepção
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CARD SECRETÁRIA (ROXO / PURPLE - LUXURY CLEAN STYLE) */}
        <div className="bg-white rounded-3xl p-6 md:p-7 border border-purple-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-purple-100">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 font-extrabold text-2xl shadow-2xs">
                  💼
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">Equipe / Secretária</h3>
                  <span className="text-[11px] text-purple-800 bg-purple-50 px-3 py-0.5 rounded-full font-bold border border-purple-200/70 inline-block mt-0.5">
                    Recepção & Agendamentos • Celular 2
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-purple-700 block">
                  {comparisonStats.secretaria.total}
                </span>
                <span className="text-[10px] block text-slate-400 uppercase font-bold tracking-wider">
                  {comparisonStats.totalAnswered > 0 ? Math.round((comparisonStats.secretaria.total / comparisonStats.totalAnswered) * 100) : 0}% das respostas
                </span>
              </div>
            </div>

            {/* Grid de Tempos SLA da Secretária */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              <div className="bg-purple-50/50 p-3.5 rounded-2xl border border-purple-100 text-center">
                <span className="text-[10px] font-extrabold uppercase text-purple-800 block flex items-center justify-center tracking-wider">
                  <Clock className="w-3 h-3 mr-1 text-purple-600" /> Média
                </span>
                <span className="text-xl font-black text-slate-900 mt-1 block">
                  {formatWaitTime(comparisonStats.secretaria.avg)}
                </span>
                <span className="text-[9.5px] font-semibold text-purple-700 bg-purple-100/60 px-2 py-0.5 rounded-full inline-block mt-1">
                  {comparisonStats.secretaria.fastRate}% em até 15m
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] font-extrabold uppercase text-slate-600 block flex items-center justify-center tracking-wider">
                  <Zap className="w-3 h-3 mr-1 text-emerald-600" /> Mínimo
                </span>
                <span className="text-xl font-black text-slate-900 mt-1 block">
                  {formatWaitTime(comparisonStats.secretaria.min)}
                </span>
                <span className="text-[9.5px] text-slate-500 font-medium block mt-1">Mais rápida</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] font-extrabold uppercase text-slate-600 block flex items-center justify-center tracking-wider">
                  <Timer className="w-3 h-3 mr-1 text-amber-600" /> Máximo
                </span>
                <span className="text-xl font-black text-slate-900 mt-1 block">
                  {formatWaitTime(comparisonStats.secretaria.max)}
                </span>
                <span className="text-[9.5px] text-slate-500 font-medium block mt-1">Mais demorada</span>
              </div>
            </div>
          </div>

          {/* Top Categorias & Pendências da Secretária */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                Principais Assuntos:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {comparisonStats.secretaria.topCategories.slice(0, 3).map(c => (
                  <span key={c.name} className="text-xs bg-slate-100 text-slate-800 font-medium border border-slate-200 px-2.5 py-1 rounded-xl">
                    {c.name}: <strong>{c.count}</strong>
                  </span>
                ))}
                {comparisonStats.secretaria.topCategories.length === 0 && (
                  <span className="text-xs text-slate-400 italic">Nenhum registro no período</span>
                )}
              </div>
            </div>

            {/* Badges de Fila da Secretária */}
            <div className="flex sm:flex-col gap-2 items-start sm:items-end">
              <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold border flex items-center shadow-2xs ${
                comparisonStats.secretaria.pendingCount > 0 
                  ? 'bg-rose-50 text-rose-800 border-rose-200' 
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                ⏳ {comparisonStats.secretaria.pendingCount} Recepção na Fila
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* GRÁFICOS VISUAIS COMPARATIVOS */}
      {/* ========================================================================= */}
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
                  <Bar dataKey="Dra. Isabela" fill="#14B8A6" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Secretária" fill="#8B5CF6" stackId="a" radius={[0, 6, 6, 0]} />
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

      {/* ========================================================================= */}
      {/* TABELA / FEED DE CONVERSAS COM IDENTIFICAÇÃO CLARA DO ATENDENTE */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2 text-emerald-600" />
              Feed de Conversas & Detalhes do Atendimento
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Mostrando {filteredData.length} de {conversations.length} conversas sincronizadas
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-teal-50 text-teal-900 font-bold border border-teal-200">
              👩‍⚕️ Dra. Isabela
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-50 text-purple-900 font-bold border border-purple-200">
              💼 Secretária
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            Carregando conversas do Supabase...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Nenhuma conversa encontrada com os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Paciente</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Atendente</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Mensagem</th>
                  <th className="py-3 px-4">Tempo Espera</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.slice(0, 50).map((chat) => {
                  const att = getAttendantType(chat);
                  return (
                    <tr key={chat.id_mensagem} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Contato */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px]">
                            {(chat.nome_contato || 'P').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-slate-900">{chat.nome_contato || 'Paciente'}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {chat.contato_jid ? chat.contato_jid.replace('@s.whatsapp.net', '') : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Data */}
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {chat.data_envio ? new Date(chat.data_envio).toLocaleString('pt-BR', { 
                          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
                        }) : '-'}
                      </td>

                      {/* Atendente Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {att === 'isabela' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-900 border border-purple-300 shadow-2xs">
                            👩‍⚕️ Dra. Isabela
                          </span>
                        ) : att === 'secretaria' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-900 border border-teal-300 shadow-2xs">
                            💼 Secretária
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>


                      {/* Categoria */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${CATEGORY_COLORS[chat.categoria] || CATEGORY_COLORS['Outro']}`}>
                          {chat.categoria || 'Geral'}
                        </span>
                      </td>

                      {/* Mensagem Preview */}
                      <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate" title={chat.mensagem_texto}>
                        {chat.mensagem_texto || <span className="italic text-slate-400">Sem conteúdo de texto</span>}
                      </td>

                      {/* Tempo Espera */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {chat.respondida ? (
                          <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded ${
                            (chat.tempo_espera_minutos || 0) <= 15 
                              ? 'bg-emerald-50 text-emerald-700 font-bold' 
                              : (chat.tempo_espera_minutos || 0) <= 60 
                                ? 'bg-amber-50 text-amber-700' 
                                : 'bg-rose-50 text-rose-700'
                          }`}>
                            <Clock className="w-3 h-3 mr-1" />
                            {formatWaitTime(Math.round(chat.tempo_espera_minutos))}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Pendente</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {chat.respondida ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Respondida
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Aguardando
                          </span>
                        )}
                      </td>

                      {/* Ação */}
<td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedChat(chat)}
                          className="text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition font-medium text-[11px] inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Ver</span>
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalhes da Conversa - LUXURY MODAL */}
      {selectedChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-xs text-white shadow-2xs">
                  {(selectedChat.nome_contato || 'P').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm leading-tight">{selectedChat.nome_contato || 'Paciente'}</h4>
                  <p className="text-[11px] text-emerald-200 mt-0.5">
                    {selectedChat.contato_jid ? selectedChat.contato_jid.replace('@s.whatsapp.net', '') : ''} • {selectedChat.data_envio ? new Date(selectedChat.data_envio).toLocaleString('pt-BR') : ''}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedChat(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold text-sm transition-all"
              >
                ✕
              </button>
            </div>

            {/* Chat Body */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto bg-slate-50">
              
              {/* Badges de Categoria e SLA */}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] border ${CATEGORY_COLORS[selectedChat.categoria] || CATEGORY_COLORS['Outro']}`}>
                  Assunto: {selectedChat.categoria || 'Geral'}
                </span>
                
                {/* Atendente Badge */}
                {getAttendantType(selectedChat) === 'isabela' ? (
                  <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-teal-50 text-teal-900 border border-teal-300">
                    👩‍⚕️ Respondido por Dra. Isabela
                  </span>
                ) : getAttendantType(selectedChat) === 'secretaria' ? (
                  <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-purple-50 text-purple-900 border border-purple-300">
                    💼 Respondido por Secretária
                  </span>
                ) : null}

                {selectedChat.respondida && (
                  <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-blue-100 text-blue-800 border border-blue-200 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Espera: {formatWaitTime(Math.round(selectedChat.tempo_espera_minutos))}
                  </span>
                )}
              </div>

              {/* Mensagem do Paciente */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase ml-1">Mensagem do Paciente</span>
                <div className="bg-white p-3.5 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm text-slate-800 text-xs leading-relaxed">
                  {selectedChat.mensagem_texto || 'Sem conteúdo de texto'}
                </div>
              </div>

              {/* Resposta do Atendente */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-emerald-700 uppercase ml-1 flex items-center">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Resposta Registrada
                </span>
                {selectedChat.resposta_secretaria ? (
                  <div className="bg-emerald-50 p-3.5 rounded-2xl rounded-tr-none border border-emerald-200 shadow-sm text-emerald-950 text-xs leading-relaxed">
                    <div className="mb-1 text-[10px] text-emerald-700 font-bold">
                      Classificação: {selectedChat.categoria_secretaria || 'Atendimento'}
                    </div>
                    {selectedChat.resposta_secretaria}
                  </div>
                ) : (
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-800 text-xs italic flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>Esta mensagem ainda não foi respondida ou sincronizada no banco.</span>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-white border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedChat(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-5 py-2 rounded-xl transition"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
