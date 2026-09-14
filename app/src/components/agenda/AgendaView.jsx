import React, { useState, useEffect } from 'react';
import { useGoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { Calendar as CalendarIcon, RefreshCw, LogIn, X, Clock, User, Phone, CheckCircle, Video, MessageCircle } from 'lucide-react';
import WebDietSidebar from './WebDietSidebar';
import WebDietWeekGrid from './WebDietWeekGrid';
import BlockDatesModal from './BlockDatesModal';
import EventDetailModal from './EventDetailModal';
import { colorMapper } from '../../utils/googleCalendarMapper';

const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

function AgendaViewContent() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('nutriisa_google_token');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validar se tem access_token e se não expirou (expires_at)
        if (parsed?.access_token && parsed?.expires_at && Date.now() < parsed.expires_at) {
          return parsed;
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!tokenInfo?.access_token);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Link do Google Meet reutilizado para todos os pacientes (persistido no localStorage)
  const [meetLink, setMeetLink] = useState(() => {
    try {
      return localStorage.getItem('nutriisa_google_meet_link') || 'https://meet.google.com/bela-consultas';
    } catch (e) {
      return 'https://meet.google.com/bela-consultas';
    }
  });

  const handleSaveMeetLink = (newLink) => {
    setMeetLink(newLink);
    try {
      localStorage.setItem('nutriisa_google_meet_link', newLink);
    } catch (e) {}
  };

  // Datas bloqueadas (persistidas no localStorage)
  const [blockedDates, setBlockedDates] = useState(() => {
    try {
      const saved = localStorage.getItem('nutriisa_blocked_dates');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

  const toggleBlockDate = (dateStr) => {
    setBlockedDates(prev => {
      const next = prev.includes(dateStr) 
        ? prev.filter(d => d !== dateStr) 
        : [...prev, dateStr];
      try {
        localStorage.setItem('nutriisa_blocked_dates', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Atualizar dados de um evento (status, data, horário, resumo ou descrição)
  const handleUpdateEvent = async (updatedEvent, newStatusKey) => {
    setEvents(prev => prev.map(e => (e.id === updatedEvent.id ? updatedEvent : e)));
    setSelectedEvent(updatedEvent);
  };

  const calendarId = import.meta.env.VITE_GOOGLE_CALENDAR_ID || 'bela.munoz99@gmail.com';

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      // Calcular validade: expires_in (geralmente 3599s = 1 hora)
      const expiresInSec = tokenResponse.expires_in || 3600;
      const enhancedToken = {
        ...tokenResponse,
        expires_at: Date.now() + (expiresInSec * 1000)
      };
      setTokenInfo(enhancedToken);
      setIsAuthenticated(true);
      try {
        localStorage.setItem('nutriisa_google_token', JSON.stringify(enhancedToken));
      } catch (e) {}
      fetchCalendarEvents(enhancedToken.access_token, currentDate);
    },
    scope: SCOPES,
    onError: (error) => console.log('Login falhou:', error)
  });

  // Restaurar eventos automaticamente ao montar ou trocar de aba caso a sessão esteja salva
  useEffect(() => {
    if (tokenInfo?.access_token) {
      fetchCalendarEvents(tokenInfo.access_token, currentDate);
    }
  }, []);

  // Buscar eventos da semana selecionada
  const fetchCalendarEvents = async (accessToken, targetDate) => {
    setLoading(true);
    try {
      // Calcular intervalo do mês (com margem de 7 dias antes e depois para cobrir semanas cruzadas)
      const curr = new Date(targetDate);
      const firstDay = new Date(curr.getFullYear(), curr.getMonth(), 1);
      firstDay.setDate(firstDay.getDate() - 7);
      firstDay.setHours(0, 0, 0, 0);

      const lastDay = new Date(curr.getFullYear(), curr.getMonth() + 1, 0);
      lastDay.setDate(lastDay.getDate() + 7);
      lastDay.setHours(23, 59, 59, 999);

      const targetId = encodeURIComponent(calendarId);
      let response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${targetId}/events?timeMin=${firstDay.toISOString()}&timeMax=${lastDay.toISOString()}&singleEvents=true&orderBy=startTime`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Fallback para 'primary' se a agenda específica não for encontrada ou não tiver compartilhamento
      if (!response.ok && (response.status === 404 || response.status === 403)) {
        console.warn(`Tentando fallback para 'primary' após status ${response.status} na agenda ${calendarId}`);
        const fallbackResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${firstDay.toISOString()}&timeMax=${lastDay.toISOString()}&singleEvents=true&orderBy=startTime`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        if (fallbackResponse.ok) {
          response = fallbackResponse;
        }
      }

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Falha ao buscar eventos da agenda');
      }

      const data = await response.json();
      setEvents(data.items || []);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      alert(`Atenção ao sincronizar a agenda (${calendarId}):\n\n${error.message}\n\nSe você estiver logando com a conta da secretária, certifique-se de que a Dra. (${calendarId}) compartilhou a agenda dela com seu e-mail no Google Calendar.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (newDate) => {
    setCurrentDate(newDate);
    if (tokenInfo?.access_token) {
      fetchCalendarEvents(tokenInfo.access_token, newDate);
    }
  };

  const handleRefresh = () => {
    if (tokenInfo?.access_token) {
      fetchCalendarEvents(tokenInfo.access_token, currentDate);
    }
  };

  const handleDisconnect = () => {
    setTokenInfo(null);
    setIsAuthenticated(false);
    setEvents([]);
    try {
      localStorage.removeItem('nutriisa_google_token');
    } catch (e) {}
  };

  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-6 animate-fade-in">
      
      {/* Header Superior da Aplicação - Mesmo Padrão do Módulo WhatsApp */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Agenda Inteligente
            </h1>
            <span className="px-3 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              Dra. Isabela ({calendarId})
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1 max-w-2xl leading-relaxed">
            Visualização padrão WebDiet integrada em tempo real com Google Calendar para acompanhamento de consultas presenciais e online.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-full border border-slate-300 shadow-2xs transition-all flex items-center space-x-1.5 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${loading ? 'animate-spin' : ''}`} />
              <span>Sincronizar</span>
            </button>
          ) : (
            <button 
              onClick={() => login()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-full shadow-xs transition-all flex items-center space-x-1.5 active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Conectar Google Agenda</span>
            </button>
          )}
        </div>
      </div>

      {/* Não Autenticado */}
      {!isAuthenticated ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 md:p-12 text-center shadow-xs max-w-xl mx-auto my-8 space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs border border-emerald-100">
            <CalendarIcon className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mb-2">
              Conecte a Agenda da Dra. Isabela
            </h2>
            <p className="text-xs text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
              Visualize a grade de consultas com o padrão WebDiet em tempo real, sincronização com o WhatsApp e bloqueio rápido de datas.
            </p>
          </div>
          <button 
            onClick={() => login()}
            className="inline-flex items-center px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-full transition-all shadow-sm active:scale-95"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Fazer login com o Google
          </button>
        </div>
      ) : (
        /* Layout Idêntico ao WebDiet: Sidebar + Grade Semanal */
        <div className="flex flex-col lg:flex-row items-start gap-6">
          
          {/* Barra Lateral WebDiet */}
          <WebDietSidebar 
            calendarName="Calendário Principal"
            onDisconnect={handleDisconnect}
            onNewEvent={() => alert('Para agendar nova consulta, utilize a conversa da NutriIsa ou adicione no Google Calendar.')}
            blockedDates={blockedDates}
            onOpenBlockModal={() => setIsBlockModalOpen(true)}
            events={events}
            currentDate={currentDate}
          />

          {/* Grade Semanal WebDiet */}
          <WebDietWeekGrid 
            currentDate={currentDate}
            onDateChange={handleDateChange}
            events={events}
            loading={loading}
            onSelectEvent={(event) => setSelectedEvent(event)}
            blockedDates={blockedDates}
            onToggleBlockDate={toggleBlockDate}
          />

        </div>
      )}

      {/* Modal de Bloqueio de Datas */}
      <BlockDatesModal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        blockedDates={blockedDates}
        onToggleBlockDate={toggleBlockDate}
      />

      {/* Modal de Detalhes do Evento WebDiet com Edição, Status e Google Meet */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onUpdateEvent={handleUpdateEvent}
          meetLink={meetLink}
          onSaveMeetLink={handleSaveMeetLink}
        />
      )}

    </div>
  );
}

export default function AgendaView() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId || clientId.includes('COLOQUE_SEU_CLIENT_ID')) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-8 bg-amber-900/20 border border-amber-600/40 rounded-2xl text-amber-200">
        <h3 className="text-lg font-bold text-amber-300 mb-2">Configuração do Google Calendar Pendente</h3>
        <p className="text-sm leading-relaxed mb-4">
          A variável de ambiente <code>VITE_GOOGLE_CLIENT_ID</code> não foi encontrada ou não está configurada no seu ambiente de produção (Vercel).
        </p>
        <div className="bg-stone-900/80 p-4 rounded-xl text-xs space-y-2 text-stone-300 border border-stone-800">
          <p><strong>Como resolver:</strong></p>
          <ol className="list-decimal list-inside space-y-1 text-stone-400">
            <li>Acesse o painel da <strong>Vercel</strong> &rarr; Seu Projeto &rarr; <strong>Settings</strong> &rarr; <strong>Environment Variables</strong>.</li>
            <li>Adicione a variável <code>VITE_GOOGLE_CLIENT_ID</code> com o Client ID gerado no Google Cloud Console.</li>
            <li>No Google Cloud Console (APIs &amp; Services &rarr; Credentials &rarr; OAuth 2.0 Client IDs), certifique-se de adicionar a URL da sua aplicação em produção (ex: <code>https://seu-dominio.vercel.app</code>) em <strong>Origens JavaScript autorizadas</strong>.</li>
            <li>Faça um <strong>Redeploy</strong> na Vercel para aplicar as variáveis.</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AgendaViewContent />
    </GoogleOAuthProvider>
  );
}
