import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquare, 
  RefreshCw, 
  Clock, 
  Eye, 
  X, 
  ShieldCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  ArrowUpDown,
  Check,
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import { formatWaitTime, cleanPhoneNumber } from '../../../shared/utils/formatters.js';
import { fetchCalendarPage } from '../../agenda/services/calendar.js';
import { 
  matchPatientNameToEvents, 
  detectConfirmationIntent, 
  detectCancellationIntent,
  confirmAppointmentEvent,
  cancelAppointmentEvent
} from '../../agenda/services/appointmentMatcher.js';
import { KEY_GOOGLE_TOKEN } from '../../../config/storageKeys.js';
import { GOOGLE_CALENDAR_ID } from '../../../config/env.js';

const CATEGORY_STYLES = {
  'Agendamento e Horários': 'bg-blue-50 text-blue-700 border-blue-200',
  'Dúvida Plano Alimentar': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Dificuldades e Sintomas': 'bg-amber-50 text-amber-700 border-amber-200',
  'Exames e Documentos': 'bg-purple-50 text-purple-700 border-purple-200',
  'Suplementação e Receitas': 'bg-teal-50 text-teal-700 border-teal-200',
  'Pagamentos e Financeiro': 'bg-yellow-50 text-yellow-800 border-yellow-200',
  'Planos e Pacotes': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Feedback e Motivação': 'bg-pink-50 text-pink-700 border-pink-200',
  'Outro': 'bg-slate-50 text-slate-700 border-slate-200'
};

export default function WhatsAppFeedTable({
  filteredData,
  conversations,
  loading,
  getAttendantType
}) {
  const [selectedChat, setSelectedChat] = useState(null);
  const [matchedEvent, setMatchedEvent] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [eventConfirmed, setEventConfirmed] = useState(false);
  const [eventCanceled, setEventCanceled] = useState(false);

  // Estados de Filtro e Ordenação rápida da tabela
  const [feedFilter, setFeedFilter] = useState('all'); // 'all' | 'pending' | 'responded' | 'isabela' | 'secretaria' | 'agendamento' | 'confirmations' | 'cancellations'
  const [feedSort, setFeedSort] = useState('date_desc'); // 'date_desc' | 'date_asc' | 'wait_desc' | 'name_asc' | 'name_desc'
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Fechar menus ao clicar fora
  useEffect(() => {
    if (!isFilterOpen && !isSortOpen) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('.feed-filter-menu') && !e.target.closest('.feed-sort-menu')) {
        setIsFilterOpen(false);
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterOpen, isSortOpen]);

  // Dados processados com filtro e ordenação
  const processedData = useMemo(() => {
    let result = [...filteredData];

    // Aplicar Filtro local
    if (feedFilter === 'pending') {
      result = result.filter(c => !(c.respondida === true || c.respondida === 'true' || c.status === 'respondida'));
    } else if (feedFilter === 'responded') {
      result = result.filter(c => (c.respondida === true || c.respondida === 'true' || c.status === 'respondida'));
    } else if (feedFilter === 'isabela') {
      result = result.filter(c => getAttendantType(c) === 'isabela');
    } else if (feedFilter === 'secretaria') {
      result = result.filter(c => getAttendantType(c) === 'secretaria');
    } else if (feedFilter === 'agendamento') {
      result = result.filter(c => (c.categoria || '').toLowerCase().includes('agendamento'));
    } else if (feedFilter === 'confirmations') {
      result = result.filter(c => detectConfirmationIntent(c.conteudo_mensagem || c.mensagem_texto || c.mensagem || ''));
    } else if (feedFilter === 'cancellations') {
      result = result.filter(c => detectCancellationIntent(c.conteudo_mensagem || c.mensagem_texto || c.mensagem || ''));
    }

    // Aplicar Ordenação
    result.sort((a, b) => {
      if (feedSort === 'date_desc') {
        const da = new Date(a.data_envio || a.created_at || a.data || 0).getTime();
        const db = new Date(b.data_envio || b.created_at || b.data || 0).getTime();
        return db - da;
      }
      if (feedSort === 'date_asc') {
        const da = new Date(a.data_envio || a.created_at || a.data || 0).getTime();
        const db = new Date(b.data_envio || b.created_at || b.data || 0).getTime();
        return da - db;
      }
      if (feedSort === 'wait_desc') {
        const wa = Number(a.tempo_espera_minutos ?? a.tempo_espera ?? 0);
        const wb = Number(b.tempo_espera_minutos ?? b.tempo_espera ?? 0);
        return wb - wa;
      }
      if (feedSort === 'name_asc') {
        const na = (a.nome_paciente || a.nome_contato || '').toLowerCase();
        const nb = (b.nome_paciente || b.nome_contato || '').toLowerCase();
        return na.localeCompare(nb, 'pt-BR');
      }
      if (feedSort === 'name_desc') {
        const na = (a.nome_paciente || a.nome_contato || '').toLowerCase();
        const nb = (b.nome_paciente || b.nome_contato || '').toLowerCase();
        return nb.localeCompare(na, 'pt-BR');
      }
      return 0;
    });

    return result;
  }, [filteredData, feedFilter, feedSort, getAttendantType]);

  useEffect(() => {
    if (!selectedChat) {
      setMatchedEvent(null);
      setEventConfirmed(false);
      setEventCanceled(false);
      return;
    }

    const pacienteNome = selectedChat.nome_paciente || selectedChat.nome_contato || selectedChat.contato;
    if (!pacienteNome) return;

    let isMounted = true;
    async function loadMatchingAppointment() {
      setLoadingEvent(true);
      try {
        const savedToken = localStorage.getItem(KEY_GOOGLE_TOKEN);
        const tokenInfo = savedToken ? JSON.parse(savedToken) : null;
        if (tokenInfo?.access_token && (!tokenInfo.expires_at || Date.now() < tokenInfo.expires_at)) {
          const startWindow = new Date();
          startWindow.setHours(0, 0, 0, 0);
          const endWindow = new Date(startWindow.getTime() + 8 * 24 * 60 * 60 * 1000);
          const events = await fetchCalendarPage(tokenInfo.access_token, GOOGLE_CALENDAR_ID, startWindow, endWindow);
          if (isMounted) {
            const found = matchPatientNameToEvents(pacienteNome, events, { allowConfirmed: true });
            setMatchedEvent(found);
            setEventConfirmed(false);
            setEventCanceled(false);
          }
        }
      } catch (err) {
        console.warn('Erro ao cruzar agendamento do paciente:', err);
      } finally {
        if (isMounted) setLoadingEvent(false);
      }
    }

    loadMatchingAppointment();
    return () => { isMounted = false; };
  }, [selectedChat]);

  const handleConfirmAppointmentModal = async () => {
    if (!matchedEvent) return;
    setIsConfirming(true);
    try {
      const savedToken = localStorage.getItem(KEY_GOOGLE_TOKEN);
      const tokenInfo = savedToken ? JSON.parse(savedToken) : null;
      if (!tokenInfo?.access_token) {
        alert('Para confirmar este agendamento, acesse a aba "Agenda" e conecte sua conta Google Calendar.');
        return;
      }
      await confirmAppointmentEvent(tokenInfo.access_token, GOOGLE_CALENDAR_ID, matchedEvent);
      setEventConfirmed(true);
      setEventCanceled(false);
    } catch (err) {
      alert('Erro ao confirmar agendamento: ' + err.message);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancelAppointmentModal = async () => {
    if (!matchedEvent) return;
    setIsCanceling(true);
    try {
      const savedToken = localStorage.getItem(KEY_GOOGLE_TOKEN);
      const tokenInfo = savedToken ? JSON.parse(savedToken) : null;
      if (!tokenInfo?.access_token) {
        alert('Para desmarcar este agendamento, acesse a aba "Agenda" e conecte sua conta Google Calendar.');
        return;
      }
      await cancelAppointmentEvent(tokenInfo.access_token, GOOGLE_CALENDAR_ID, matchedEvent);
      setEventCanceled(true);
      setEventConfirmed(false);
    } catch (err) {
      alert('Erro ao desmarcar agendamento: ' + err.message);
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* CABEÇALHO DO FEED */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white">
          <div>
            <h3 className="font-black text-base text-slate-900 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2 text-emerald-600" />
              Feed de Conversas & Detalhes do Atendimento
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium flex items-center gap-1.5">
              <span>Mostrando {processedData.length} de {conversations.length} conversas</span>
              {(feedFilter !== 'all' || feedSort !== 'date_desc') && (
                <span className="inline-flex items-center px-2 py-0.2 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Filtro/Ordem Ativo
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* BOTÃO DE FILTRO DA TABELA */}
            <div className="relative feed-filter-menu">
              <button
                type="button"
                onClick={() => { setIsFilterOpen(!isFilterOpen); setIsSortOpen(false); }}
                className={`inline-flex items-center px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                  feedFilter !== 'all'
                    ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-200'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title="Filtrar mensagens na tabela"
              >
                <Filter className="w-3.5 h-3.5 mr-1.5" />
                <span>
                  {feedFilter === 'all' ? 'Filtrar' : 
                   feedFilter === 'pending' ? 'Aguardando' :
                   feedFilter === 'responded' ? 'Respondidas' :
                   feedFilter === 'isabela' ? 'Dra. Isabela' :
                   feedFilter === 'secretaria' ? 'Secretária' :
                   feedFilter === 'agendamento' ? 'Agendamento' :
                   feedFilter === 'confirmations' ? 'Confirmações' :
                   feedFilter === 'cancellations' ? 'Desmarcações' : 'Filtrar'}
                </span>
                <ChevronDown className="w-3 h-3 ml-1 opacity-70" />
              </button>

              {/* Menu Dropdown de Filtros */}
              {isFilterOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 z-30 animate-scale-up space-y-1">
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Filtrar tabela por
                  </div>
                  {[
                    { id: 'all', label: 'Todas as Conversas', icon: '🌐' },
                    { id: 'pending', label: 'Apenas Aguardando Resposta', icon: '⏳' },
                    { id: 'responded', label: 'Apenas Respondidas', icon: '✅' },
                    { id: 'isabela', label: 'Apenas Dra. Isabela', icon: '👩‍⚕️' },
                    { id: 'secretaria', label: 'Apenas Secretária', icon: '💼' },
                    { id: 'agendamento', label: 'Agendamento & Horários', icon: '📅' },
                    { id: 'confirmations', label: 'Confirmações Detectadas', icon: '💬' },
                    { id: 'cancellations', label: 'Desmarcações / Remarcações', icon: '❌' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => { setFeedFilter(opt.id); setIsFilterOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        feedFilter === opt.id 
                          ? 'bg-emerald-50 text-emerald-900 font-bold' 
                          : 'text-slate-700 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <span className="flex items-center truncate">
                        <span className="mr-2 text-sm">{opt.icon}</span>
                        <span className="truncate">{opt.label}</span>
                      </span>
                      {feedFilter === opt.id && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* BOTÃO DE ORDENAÇÃO DA TABELA */}
            <div className="relative feed-sort-menu">
              <button
                type="button"
                onClick={() => { setIsSortOpen(!isSortOpen); setIsFilterOpen(false); }}
                className={`inline-flex items-center px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                  feedSort !== 'date_desc'
                    ? 'bg-slate-900 text-white border-black ring-2 ring-slate-200'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title="Ordenar tabela de conversas"
              >
                <ArrowUpDown className="w-3.5 h-3.5 mr-1.5" />
                <span>
                  {feedSort === 'date_desc' ? 'Ordenar' : 
                   feedSort === 'date_asc' ? 'Mais Antigas' :
                   feedSort === 'wait_desc' ? 'Maior Espera' :
                   feedSort === 'name_asc' ? 'Paciente (A-Z)' :
                   feedSort === 'name_desc' ? 'Paciente (Z-A)' : 'Ordenar'}
                </span>
                <ChevronDown className="w-3 h-3 ml-1 opacity-70" />
              </button>

              {/* Menu Dropdown de Ordenação */}
              {isSortOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 z-30 animate-scale-up space-y-1">
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Ordenar tabela por
                  </div>
                  {[
                    { id: 'date_desc', label: 'Mais Recentes Primeiro', icon: '🕒' },
                    { id: 'date_asc', label: 'Mais Antigas Primeiro', icon: '⌛' },
                    { id: 'wait_desc', label: 'Maior Tempo de Espera', icon: '⚡' },
                    { id: 'name_asc', label: 'Nome do Paciente (A-Z)', icon: '🔤' },
                    { id: 'name_desc', label: 'Nome do Paciente (Z-A)', icon: '🔡' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => { setFeedSort(opt.id); setIsSortOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        feedSort === opt.id 
                          ? 'bg-slate-100 text-slate-900 font-bold' 
                          : 'text-slate-700 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <span className="flex items-center truncate">
                        <span className="mr-2 text-sm">{opt.icon}</span>
                        <span className="truncate">{opt.label}</span>
                      </span>
                      {feedSort === opt.id && <Check className="w-3.5 h-3.5 text-slate-800 shrink-0 ml-1" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RESET SE FILTRO OU ORDEM ATIVA */}
            {(feedFilter !== 'all' || feedSort !== 'date_desc') && (
              <button
                type="button"
                onClick={() => { setFeedFilter('all'); setFeedSort('date_desc'); }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer border border-transparent hover:border-slate-200"
                title="Limpar filtro e ordenação da tabela"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            Carregando conversas do Supabase...
          </div>
        ) : processedData.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs space-y-2">
            <p>Nenhuma conversa encontrada com os filtros selecionados.</p>
            {(feedFilter !== 'all' || feedSort !== 'date_desc') && (
              <button
                type="button"
                onClick={() => { setFeedFilter('all'); setFeedSort('date_desc'); }}
                className="text-emerald-700 font-bold hover:underline cursor-pointer"
              >
                Restaurar exibição padrão
              </button>
            )}
          </div>
        ) : (
          <div className="w-full max-h-[620px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <table className="w-full text-left text-xs table-fixed">
              <thead className="bg-slate-50/95 backdrop-blur-xs border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-10 shadow-2xs">
                <tr>
                  <th className="py-3 px-3 w-[18%]">PACIENTE</th>
                  <th className="py-3 px-2 w-[10%]">DATA</th>
                  <th className="py-3 px-2 w-[12%]">ATENDENTE</th>
                  <th className="py-3 px-2 w-[14%]">CATEGORIA</th>
                  <th className="py-3 px-3 w-[26%]">MENSAGEM</th>
                  <th className="py-3 px-2 w-[9%] text-center">TEMPO</th>
                  <th className="py-3 px-2 w-[8%] text-center">STATUS</th>
                  <th className="py-3 px-3 w-[5%] text-right">AÇÃO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {processedData.map((conv, idx) => {
                  const attendantType = getAttendantType(conv);
                  const isIsabela = attendantType === 'isabela';

                  const pacienteNome = conv.nome_paciente || conv.nome_contato || conv.contato || 'Paciente Sem Nome';
                  const rawPhone = conv.telefone_paciente || conv.contato_jid || conv.telefone || '';
                  const pacienteTelefone = cleanPhoneNumber(rawPhone);
                  const mensagemTexto = conv.conteudo_mensagem || conv.mensagem_texto || conv.mensagem || '--';
                  const dataEnvio = conv.data_envio || conv.created_at || conv.data;
                  const categoria = conv.categoria || conv.categoria_paciente || 'Geral';
                  const tempoEspera = conv.tempo_espera_minutos ?? conv.tempo_espera ?? null;
                  const isRespondida = conv.respondida === true || conv.respondida === 'true' || conv.status === 'respondida';

                  const pacienteFoto = conv.foto_perfil || null;

                  const initial = pacienteNome.charAt(0).toUpperCase() || 'P';

                  let dataFormatada = '--';
                  if (dataEnvio) {
                    const d = new Date(dataEnvio);
                    if (!isNaN(d.getTime())) {
                      const dia = d.getDate().toString().padStart(2, '0');
                      const mes = (d.getMonth() + 1).toString().padStart(2, '0');
                      const hora = d.getHours().toString().padStart(2, '0');
                      const min = d.getMinutes().toString().padStart(2, '0');
                      dataFormatada = `${dia}/${mes}, ${hora}:${min}`;
                    }
                  }

                  const catClass = CATEGORY_STYLES[categoria] || 'bg-slate-50 text-slate-700 border-slate-200';

                  return (
                    <tr key={conv.id || conv.id_mensagem || idx} className="hover:bg-slate-50/70 transition-colors">
                      {/* 1. PACIENTE */}
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          {pacienteFoto ? (
                            <img 
                              src={pacienteFoto} 
                              alt={pacienteNome}
                              referrerPolicy="no-referrer"
                              className="w-7 h-7 rounded-full object-cover border border-emerald-200/80 flex-shrink-0 shadow-2xs"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-7 h-7 rounded-full bg-emerald-100/80 text-emerald-800 font-black text-[11px] flex items-center justify-center flex-shrink-0 ${pacienteFoto ? 'hidden' : ''}`}>
                            {initial}
                          </div>
                          <div className="min-w-0 truncate">
                            <div className="font-extrabold text-slate-900 leading-tight truncate text-[11.5px]" title={pacienteNome}>
                              {pacienteNome}
                            </div>
                            {pacienteTelefone && (
                              <div className="text-[10px] text-slate-400 font-mono leading-tight mt-0.5 truncate">{pacienteTelefone}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. DATA */}
                      <td className="py-3 px-2 text-slate-500 font-medium text-[11px] truncate">
                        {dataFormatada}
                      </td>

                      {/* 3. ATENDENTE */}
                      <td className="py-3 px-2">
                        {isIsabela ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-teal-50/80 text-teal-800 border border-teal-300 shadow-2xs truncate">
                            👩‍⚕️ Dra. Isabela
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-purple-50 text-purple-900 border border-purple-200 shadow-2xs truncate">
                            💼 Secretária
                          </span>
                        )}
                      </td>

                      {/* 4. CATEGORIA */}
                      <td className="py-3 px-2">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border shadow-2xs truncate max-w-full ${catClass}`} title={categoria}>
                          {categoria}
                        </span>
                      </td>

                      {/* 5. MENSAGEM */}
                      <td className="py-3 px-3 text-slate-600 font-normal text-[11.5px] truncate" title={mensagemTexto}>
                        {mensagemTexto}
                      </td>

                      {/* 6. TEMPO DE ESPERA */}
                      <td className="py-3 px-2 text-center">
                        {tempoEspera === null || tempoEspera === undefined || isNaN(Number(tempoEspera)) ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-slate-100 text-slate-400 border border-slate-200">
                            --
                          </span>
                        ) : (() => {
                          const m = Number(tempoEspera);
                          if (m < 30) {
                            return (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                                <Clock className="w-3 h-3 mr-0.5 text-emerald-600" />
                                {formatWaitTime(m)}
                              </span>
                            );
                          } else if (m <= 60) {
                            return (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                                <Clock className="w-3 h-3 mr-0.5 text-amber-600" />
                                {formatWaitTime(m)}
                              </span>
                            );
                          } else {
                            return (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                                <Clock className="w-3 h-3 mr-0.5 text-rose-600" />
                                {formatWaitTime(m)}
                              </span>
                            );
                          }
                        })()}
                      </td>

                      {/* 7. STATUS */}
                      <td className="py-3 px-2 text-center">
                        {isRespondida ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Respondida
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                            Aguardando
                          </span>
                        )}
                      </td>

                      {/* 8. AÇÃO */}
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedChat(conv)}
                          className="inline-flex items-center text-[11.5px] font-bold text-slate-800 hover:text-black transition-colors active:scale-95 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1 text-slate-800" />
                          Ver
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

      {selectedChat && (() => {
        const attendantType = getAttendantType(selectedChat);
        const isIsabela = attendantType === 'isabela';
        const pacienteNome = selectedChat.nome_paciente || selectedChat.nome_contato || selectedChat.contato || 'Paciente Sem Nome';
        const rawModalPhone = selectedChat.telefone_paciente || selectedChat.contato_jid || selectedChat.telefone || '';
        const pacienteTelefone = cleanPhoneNumber(rawModalPhone);
        const dataEnvio = selectedChat.data_envio || selectedChat.created_at || selectedChat.data;
        const categoria = selectedChat.categoria || selectedChat.categoria_paciente || 'Geral';
        const tempoEspera = selectedChat.tempo_espera_minutos ?? selectedChat.tempo_espera ?? null;
        const mensagemTexto = selectedChat.conteudo_mensagem || selectedChat.mensagem_texto || selectedChat.mensagem || '--';
        const respostaSecretaria = selectedChat.resposta_secretaria || selectedChat.resposta || selectedChat.observacao || null;
        const categoriaSecretaria = selectedChat.categoria_secretaria || categoria;
        const initial = pacienteNome.charAt(0).toUpperCase() || 'P';

        let dataCompleta = '--';
        if (dataEnvio) {
          const d = new Date(dataEnvio);
          if (!isNaN(d.getTime())) {
            dataCompleta = `${d.toLocaleDateString('pt-BR')} • ${d.toLocaleTimeString('pt-BR')}`;
          }
        }

        const modalFoto = selectedChat.foto_perfil || null;

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-scale-up">
              <div className="bg-[#005B48] p-5 text-white flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  {modalFoto ? (
                    <img 
                      src={modalFoto} 
                      alt={pacienteNome}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-full object-cover border border-white/30 flex-shrink-0 shadow-sm"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-11 h-11 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white font-black text-sm flex-shrink-0 ${modalFoto ? 'hidden' : ''}`}>
                    {initial}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base tracking-tight leading-tight text-white">{pacienteNome}</h3>
                    <p className="text-[11px] text-emerald-100/90 font-mono mt-0.5">
                      {pacienteTelefone} • {dataCompleta}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedChat(null)}
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* CORPO DO MODAL */}
              <div className="p-6 space-y-5 bg-white">
                
                {/* BADGES SUPERIORES */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3.5 py-1 bg-[#EEF4FF] text-[#3568D4] font-bold text-[11px] rounded-full border border-[#D0E0FC]">
                    Assunto: {categoria}
                  </span>

                  <span className="px-3.5 py-1 bg-[#E6F8F3] text-[#007A5A] font-bold text-[11px] rounded-full border border-[#B3EBDC] flex items-center shadow-2xs">
                    {respostaSecretaria 
                      ? `👩‍⚕️ Respondido por ${isIsabela ? 'Dra. Isabela' : 'Secretária'}` 
                      : `⏳ Atribuído para ${isIsabela ? 'Dra. Isabela' : 'Secretária'}`}
                  </span>

                  {tempoEspera !== null && tempoEspera !== undefined && (
                    <span className="px-3.5 py-1 bg-[#EEF4FF] text-[#3568D4] font-bold text-[11px] rounded-full border border-[#D0E0FC] flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-[#3568D4]" />
                      Espera: {formatWaitTime(tempoEspera)}
                    </span>
                  )}
                </div>

                {/* CARD DE IDENTIFICAÇÃO E CONFIRMAÇÃO / DESMARCAÇÃO NA AGENDA */}
                {eventCanceled ? (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-900 shadow-2xs animate-fade-in">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <XCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black">Consulta Desmarcada na Google Agenda!</h4>
                        <p className="text-[11px] text-rose-700">O evento foi atualizado com [DESMARCADO] (borda vermelha na agenda). Horário liberado para remarcação.</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-200 text-rose-900 uppercase tracking-wider">
                      Desmarcado
                    </span>
                  </div>
                ) : eventConfirmed ? (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-900 shadow-2xs animate-fade-in">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black">Consulta Confirmada com Sucesso!</h4>
                        <p className="text-[11px] text-emerald-700">O status foi atualizado para [CONFIRMADO] no Google Calendar e na agenda.</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-200 text-emerald-900 uppercase tracking-wider">
                      Confirmado
                    </span>
                  </div>
                ) : matchedEvent ? (() => {
                  const isCancelDetected = detectCancellationIntent(mensagemTexto);
                  const isConfirmDetected = detectConfirmationIntent(mensagemTexto);

                  return (
                    <div className={`p-4 rounded-2xl shadow-xs space-y-2.5 animate-fade-in border ${
                      isCancelDetected 
                        ? 'bg-gradient-to-br from-rose-50/90 via-orange-50/40 to-white border-rose-200' 
                        : 'bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white border-emerald-200'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2.5">
                          <div className={`w-8 h-8 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs ${
                            isCancelDetected ? 'bg-rose-600' : 'bg-emerald-600'
                          }`}>
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-black text-slate-900">
                                {isCancelDetected ? 'Solicitação de Desmarcação / Remarcação' : 'Agendamento Localizado na Agenda'}
                              </span>
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                                matchedEvent.statusKey === 'confirmado'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}>
                                {matchedEvent.statusKey === 'confirmado' ? 'Confirmado' : 'À Confirmar'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium mt-0.5 capitalize">
                              {new Date(matchedEvent.start.dateTime || matchedEvent.start.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })} • {matchedEvent.summary}
                            </p>
                          </div>
                        </div>
                      </div>

                      {isCancelDetected ? (
                        <div className="text-[11.5px] text-rose-900 bg-rose-100/90 px-3 py-1.5 rounded-xl font-medium flex items-center space-x-2 border border-rose-300/60">
                          <XCircle className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                          <span>Paciente informou que não poderá comparecer ou solicitou remarcação!</span>
                        </div>
                      ) : isConfirmDetected ? (
                        <div className="text-[11.5px] text-emerald-900 bg-emerald-100/90 px-3 py-1.5 rounded-xl font-medium flex items-center space-x-2 border border-emerald-300/60">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>Mensagem com intenção de confirmação de presença detectada!</span>
                        </div>
                      ) : null}

                      {isCancelDetected ? (
                        <button
                          type="button"
                          onClick={handleCancelAppointmentModal}
                          disabled={isCanceling}
                          className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-black text-xs shadow-xs hover:shadow transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>{isCanceling ? 'Atualizando Google Calendar...' : 'Marcar como Desmarcado na Agenda (Borda Vermelha)'}</span>
                        </button>
                      ) : (
                        <div className="flex items-center space-x-2 pt-1">
                          <button
                            type="button"
                            onClick={handleConfirmAppointmentModal}
                            disabled={isConfirming}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-xs shadow-xs hover:shadow transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{isConfirming ? 'Atualizando...' : 'Confirmar Presença (Verde)'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelAppointmentModal}
                            disabled={isCanceling}
                            className="py-2.5 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs transition-all active:scale-[0.99] flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                            title="Desmarcar consulta no Google Calendar (Borda Vermelha)"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Desmarcar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })() : null}

                {/* 1. MENSAGEM DO PACIENTE (BALÃO COM PONTA PUXADA NO CANTO SUPERIOR ESQUERDO) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block pl-1">
                    MENSAGEM DO PACIENTE
                  </label>
                  <div className="relative p-4 bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs shadow-2xs">
                    <p className="text-slate-800 text-[13px] leading-relaxed font-normal">
                      {mensagemTexto}
                    </p>
                  </div>
                </div>

                {/* 2. RESPOSTA REGISTRADA (BALÃO COM PONTA PUXADA NO CANTO SUPERIOR ESQUERDO E FUNDO VERDE PASTEL) */}
                {respostaSecretaria ? (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#006C4E] flex items-center pl-1">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#008964]" />
                      RESPOSTA REGISTRADA
                    </label>
                    <div className="relative p-4 bg-[#F0FAF6] border border-[#BDE8D9] rounded-2xl rounded-tl-xs space-y-1.5 shadow-2xs">
                      {categoriaSecretaria && (
                        <div className="text-[11px] font-bold text-[#007050]">
                          Classificação: {categoriaSecretaria}
                        </div>
                      )}
                      <p className="text-slate-800 text-[12.5px] leading-relaxed font-normal">
                        {respostaSecretaria}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl rounded-tl-xs text-xs text-amber-900 flex items-center justify-between">
                    <span>⏳ Esta mensagem ainda está aguardando retorno da equipe.</span>
                  </div>
                )}

              </div>

              {/* RODAPÉ DO MODAL */}
              <div className="p-4 bg-white border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedChat(null)}
                  className="px-6 py-2 bg-[#111827] hover:bg-black text-white font-bold text-xs rounded-full shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
