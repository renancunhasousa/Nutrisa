import React, { useState, useEffect, useMemo } from 'react';
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
  Zap, Award, Timer, Activity
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

// Helper para identificar o atendente responsável
// Helper para identificar o atendente responsável
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);

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
  }, [conversations, period, selectedCategory, statusFilter, attendantFilter, searchTerm]);

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

    const isabelaItems = answeredList.filter(i => getAttendantType(i) === 'isabela');
    const secretariaItems = answeredList.filter(i => getAttendantType(i) === 'secretaria');

    const calcMetrics = (list) => {
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

      return { total, avg, min, max, fastRate, topCategories };
    };

    return {
      isabela: calcMetrics(isabelaItems),
      secretaria: calcMetrics(secretariaItems),
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

  const formatWaitTime = (mins) => {
    if (mins === null || mins === undefined) return '-';
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 rounded-2xl p-6 text-white shadow-xl border border-emerald-800/60 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs uppercase tracking-widest mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Painel de Produtividade & SLA de Atendimento</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Métricas: Dra. Isabela vs Secretária
            </h2>
            <p className="text-sm text-emerald-100/80 mt-1">
              Análise comparativa de volume, tempos de resposta (médio, mín., máx.) e categorias atendidas.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {lastUpdated && (
              <span className="text-xs text-emerald-200/80 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-700/50 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                Atualizado às {lastUpdated.toLocaleTimeString('pt-BR')}
              </span>
            )}
            <button
              onClick={loadData}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-4 py-2 rounded-xl transition-all shadow-md flex items-center space-x-1.5 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Carregando...' : 'Atualizar'}</span>
            </button>
            <button
              onClick={exportToCSV}
              className="bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs px-4 py-2 rounded-xl transition-all border border-slate-700 shadow-md flex items-center space-x-1.5"
              title="Exportar dados filtrados para CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Barra de Filtros Completa - Layout Equilibrado em 4 Colunas */}
        <div className="mt-6 pt-5 border-t border-emerald-800/60">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            
            {/* 1. Período */}
            <div className="bg-emerald-950/90 p-3 rounded-xl border border-emerald-800/90 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-bold text-emerald-400 flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Período
                </label>
                {period.startsWith('month:') && (
                  <span className="text-[10px] text-amber-300 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60">
                    Mês Selecionado
                  </span>
                )}
              </div>

              {/* Botões Rápidos */}
              <div className="grid grid-cols-4 gap-1 text-[11px] font-semibold">
                {[
                  { id: 'today', label: 'Hoje' },
                  { id: 'this_week', label: 'Semana' },
                  { id: 'this_month', label: 'Mês Atual' },
                  { id: 'all', label: 'Tudo' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setPeriod(item.id)}
                    className={`py-1.5 rounded-lg transition-all text-center whitespace-nowrap text-[11px] ${
                      period === item.id 
                        ? 'bg-emerald-400 text-slate-950 font-bold shadow' 
                        : 'text-emerald-200 hover:bg-emerald-900/80'
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
                className="w-full bg-emerald-900/90 border border-emerald-700/80 rounded-lg text-xs text-emerald-100 p-2 focus:outline-none focus:border-emerald-400"
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
            <div className="bg-emerald-950/90 p-3 rounded-xl border border-emerald-800/90 flex flex-col justify-between space-y-2">
              <label className="text-[10px] uppercase font-bold text-emerald-400 flex items-center">
                <Users className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Origem / Atendente
              </label>
              <select
                value={attendantFilter}
                onChange={e => setAttendantFilter(e.target.value)}
                className="w-full bg-emerald-900/90 border border-emerald-700/80 rounded-lg text-xs text-emerald-100 p-2 focus:outline-none focus:border-emerald-400"
              >
                <option value="all">Todas as Origens (Dra + Secretária)</option>
                <option value="isabela">👩‍⚕️ Somente Dra. Isabela</option>
                <option value="secretaria">💼 Somente Secretária</option>
              </select>
              <div className="flex items-center space-x-3 text-[11px] text-emerald-200 pt-1">
                <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 mr-1.5 inline-block"></span> Dra. Isabela</span>
                <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-1.5 inline-block"></span> Secretária</span>
              </div>
            </div>

            {/* 3. Categoria & Status */}
            <div className="bg-emerald-950/90 p-3 rounded-xl border border-emerald-800/90 flex flex-col justify-between space-y-2">
              <label className="text-[10px] uppercase font-bold text-emerald-400 flex items-center">
                <Filter className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Filtros de Mensagem
              </label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full bg-emerald-900/90 border border-emerald-700/80 rounded-lg text-xs text-emerald-100 p-2 focus:outline-none focus:border-emerald-400"
              >
                <option value="all">Todas as Categorias ({uniqueCategories.length})</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full bg-emerald-900/90 border border-emerald-700/80 rounded-lg text-xs text-emerald-100 p-2 focus:outline-none focus:border-emerald-400"
              >
                <option value="all">Todos os Status (Respondidas + Pendentes)</option>
                <option value="answered">Respondidas ✅</option>
                <option value="pending">Aguardando Resposta ⏳</option>
              </select>
            </div>

            {/* 4. Busca Paciente */}
            <div className="bg-emerald-950/90 p-3 rounded-xl border border-emerald-800/90 flex flex-col justify-between space-y-2">
              <label className="text-[10px] uppercase font-bold text-emerald-400 flex items-center">
                <Search className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Buscar Paciente / Assunto
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Ex: Letícia, Creatina..."
                  className="w-full bg-emerald-900/90 border border-emerald-700/80 rounded-lg text-xs text-emerald-100 p-2 pr-7 placeholder:text-emerald-500/80 focus:outline-none focus:border-emerald-400"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-2 text-xs text-emerald-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
              <p className="text-[10px] text-emerald-300/70 truncate">
                {searchTerm ? `Filtrando por: "${searchTerm}"` : 'Busca por nome, telefone ou mensagem'}
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
      {/* SEÇÃO PRINCIPAL: COMPARATIVO DIRETO DRA. ISABELA (ROXO) vs SECRETÁRIA (AZUL) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CARD DRA. ISABELA (ROXO / PURPLE) */}
        <div className="bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white border-2 border-purple-500/50 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-purple-800/60">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 font-extrabold text-xl shadow-inner">
                👩‍⚕️
              </div>
              <div>
                <h3 className="font-black text-lg text-purple-100">Dra. Isabela Muñoz</h3>
                <span className="text-[11px] text-purple-200 bg-purple-900/80 px-2.5 py-0.5 rounded-full font-semibold border border-purple-700">
                  Atendimento Clínico • Celular Primário & Notebook
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-purple-300">
                {comparisonStats.isabela.total}
              </span>
              <span className="text-[10px] block text-purple-200/70 uppercase font-bold">
                {comparisonStats.totalAnswered > 0 ? Math.round((comparisonStats.isabela.total / comparisonStats.totalAnswered) * 100) : 0}% das respostas
              </span>
            </div>
          </div>

          {/* Grid de Tempos SLA da Dra. Isabela */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-purple-950/80 p-3 rounded-xl border border-purple-800/80 text-center">
              <span className="text-[10px] font-bold uppercase text-purple-300 block flex items-center justify-center">
                <Clock className="w-3 h-3 mr-1 text-purple-400" /> Média de Espera
              </span>
              <span className="text-xl font-extrabold text-white mt-1 block">
                {formatWaitTime(comparisonStats.isabela.avg)}
              </span>
              <span className="text-[9px] text-purple-300/80">{comparisonStats.isabela.fastRate}% em até 15m</span>
            </div>

            <div className="bg-purple-950/80 p-3 rounded-xl border border-purple-800/80 text-center">
              <span className="text-[10px] font-bold uppercase text-fuchsia-300 block flex items-center justify-center">
                <Zap className="w-3 h-3 mr-1 text-fuchsia-400" /> Menor Tempo
              </span>
              <span className="text-xl font-extrabold text-fuchsia-200 mt-1 block">
                {formatWaitTime(comparisonStats.isabela.min)}
              </span>
              <span className="text-[9px] text-fuchsia-300/70">Resposta mais rápida</span>
            </div>

            <div className="bg-purple-950/80 p-3 rounded-xl border border-purple-800/80 text-center">
              <span className="text-[10px] font-bold uppercase text-amber-300 block flex items-center justify-center">
                <Timer className="w-3 h-3 mr-1 text-amber-400" /> Maior Tempo
              </span>
              <span className="text-xl font-extrabold text-amber-200 mt-1 block">
                {formatWaitTime(comparisonStats.isabela.max)}
              </span>
              <span className="text-[9px] text-amber-300/70">Maior tempo registrado</span>
            </div>
          </div>

          {/* Top 3 Categorias mais respondidas pela Dra. Isabela */}
          <div className="mt-5 pt-3 border-t border-purple-800/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300 block mb-2">
              Principais Assuntos Atendidos:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {comparisonStats.isabela.topCategories.slice(0, 4).map(c => (
                <span key={c.name} className="text-xs bg-purple-900/90 text-purple-100 border border-purple-700/80 px-2.5 py-1 rounded-lg">
                  {c.name}: <strong>{c.count}</strong>
                </span>
              ))}
              {comparisonStats.isabela.topCategories.length === 0 && (
                <span className="text-xs text-purple-400/60 italic">Nenhum registro para o filtro</span>
              )}
            </div>
          </div>
        </div>

        {/* CARD SECRETÁRIA (AZUL / BLUE) */}
        <div className="bg-gradient-to-br from-blue-900/90 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white border-2 border-blue-500/50 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-blue-800/80">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 font-extrabold text-xl shadow-inner">
                💼
              </div>
              <div>
                <h3 className="font-black text-lg text-blue-100">Equipe / Secretária</h3>
                <span className="text-[11px] text-blue-300 bg-blue-900/80 px-2.5 py-0.5 rounded-full font-semibold border border-blue-700">
                  Recepção & Agendamentos • Celular Secundário
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-blue-300">
                {comparisonStats.secretaria.total}
              </span>
              <span className="text-[10px] block text-blue-200/70 uppercase font-bold">
                {comparisonStats.totalAnswered > 0 ? Math.round((comparisonStats.secretaria.total / comparisonStats.totalAnswered) * 100) : 0}% das respostas
              </span>
            </div>
          </div>

          {/* Grid de Tempos SLA da Secretária */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-slate-950/90 p-3 rounded-xl border border-blue-800/80 text-center">
              <span className="text-[10px] font-bold uppercase text-blue-400 block flex items-center justify-center">
                <Clock className="w-3 h-3 mr-1" /> Média de Espera
              </span>
              <span className="text-xl font-extrabold text-white mt-1 block">
                {formatWaitTime(comparisonStats.secretaria.avg)}
              </span>
              <span className="text-[9px] text-blue-300/80">{comparisonStats.secretaria.fastRate}% em até 15m</span>
            </div>

            <div className="bg-slate-950/90 p-3 rounded-xl border border-blue-800/80 text-center">
              <span className="text-[10px] font-bold uppercase text-cyan-400 block flex items-center justify-center">
                <Zap className="w-3 h-3 mr-1" /> Menor Tempo
              </span>
              <span className="text-xl font-extrabold text-cyan-300 mt-1 block">
                {formatWaitTime(comparisonStats.secretaria.min)}
              </span>
              <span className="text-[9px] text-cyan-200/70">Resposta mais rápida</span>
            </div>

            <div className="bg-slate-950/90 p-3 rounded-xl border border-blue-800/80 text-center">
              <span className="text-[10px] font-bold uppercase text-amber-400 block flex items-center justify-center">
                <Timer className="w-3 h-3 mr-1" /> Maior Tempo
              </span>
              <span className="text-xl font-extrabold text-amber-300 mt-1 block">
                {formatWaitTime(comparisonStats.secretaria.max)}
              </span>
              <span className="text-[9px] text-amber-200/70">Maior tempo registrado</span>
            </div>
          </div>

          {/* Top 3 Categorias mais respondidas pela Secretária */}
          <div className="mt-5 pt-3 border-t border-blue-800/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300 block mb-2">
              Principais Assuntos Atendidos:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {comparisonStats.secretaria.topCategories.slice(0, 4).map(c => (
                <span key={c.name} className="text-xs bg-blue-900/90 text-blue-100 border border-blue-700/80 px-2.5 py-1 rounded-lg">
                  {c.name}: <strong>{c.count}</strong>
                </span>
              ))}
              {comparisonStats.secretaria.topCategories.length === 0 && (
                <span className="text-xs text-blue-400/60 italic">Nenhum registro para o filtro</span>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* GRÁFICOS VISUAIS COMPARATIVOS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico 1: Comparativo Direto de Tempos (Médio, Mín., Máx.) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center">
                <Activity className="w-4 h-4 mr-2 text-purple-600" />
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
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar dataKey="Dra. Isabela" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Secretária" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Gráfico 2: Categorias Atendidas por Cada Atendente */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center">
                <MessageCircle className="w-4 h-4 mr-2 text-blue-600" />
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
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Dra. Isabela" fill="#8B5CF6" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Secretária" fill="#3B82F6" stackId="a" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Gráfico 3: Volume Diário de Atendimentos */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-purple-600" />
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
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="secretariaColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="data" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend 
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    formatter={(val) => <span className="text-xs text-slate-600">{val}</span>}
                  />
                  <Area type="monotone" dataKey="isabela" name="Dra. Isabela" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#isabelaColor)" />
                  <Area type="monotone" dataKey="secretaria" name="Secretária" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#secretariaColor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* TABELA / FEED DE CONVERSAS COM IDENTIFICAÇÃO CLARA DO ATENDENTE */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2 text-emerald-600" />
              Feed de Conversas & Detalhes do Atendimento
            </h3>
            <p className="text-xs text-slate-500">
              Mostrando {filteredData.length} de {conversations.length} conversas sincronizadas
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-100 text-purple-900 font-bold border border-purple-300">
              👩‍⚕️ Dra. Isabela
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 font-bold border border-blue-300">
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
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs">
                            👩‍⚕️ Dra. Isabela
                          </span>
                        ) : att === 'secretaria' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300 shadow-2xs">
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

      {/* Modal de Detalhes da Conversa */}
      {selectedChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Header Modal */}
            <div className="bg-emerald-900 text-white p-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-emerald-800 flex items-center justify-center font-bold text-xs text-white">
                  {(selectedChat.nome_contato || 'P').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-tight">{selectedChat.nome_contato || 'Paciente'}</h4>
                  <p className="text-[11px] text-emerald-200">
                    {selectedChat.contato_jid ? selectedChat.contato_jid.replace('@s.whatsapp.net', '') : ''} • {selectedChat.data_envio ? new Date(selectedChat.data_envio).toLocaleString('pt-BR') : ''}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedChat(null)}
                className="text-emerald-200 hover:text-white font-bold text-lg px-2"
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
                  <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300">
                    👩‍⚕️ Respondido por Dra. Isabela
                  </span>
                ) : getAttendantType(selectedChat) === 'secretaria' ? (
                  <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-blue-100 text-blue-900 border border-blue-300">
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
