import { getAiStatus, getAiAccessToken, setAiAccessToken } from '../../shared/services/aiClient.js';
import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_NUTRITIONIST } from './defaultProfile.js';
import { fetchConversations } from '../atendimento/services/conversations.js';
import { fetchCalendarPage } from '../agenda/services/calendar.js';
import { 
  matchPatientNameToEvents, 
  detectConfirmationIntent, 
  detectCancellationIntent,
  confirmAppointmentEvent,
  cancelAppointmentEvent
} from '../agenda/services/appointmentMatcher.js';
import {
  KEY_NUTRITIONIST,
  KEY_SELECTED_MODEL,
  KEY_LIVE_NOTIFS,
  KEY_GOOGLE_TOKEN,
} from '../../config/storageKeys.js';
import { GOOGLE_CALENDAR_ID } from '../../config/env.js';

export function useAppSettings() {
  const [appNotification, setAppNotification] = useState(null);
  const [nutritionist, setNutritionist] = useState(() => {
    try {
      const saved = localStorage.getItem(KEY_NUTRITIONIST);
      return saved ? JSON.parse(saved) : DEFAULT_NUTRITIONIST;
    } catch { return DEFAULT_NUTRITIONIST;
    }
  });
  const [activeModal, setActiveModal] = useState(null); // null | 'profile' | 'ai'
  const [selectedModel, setSelectedModel] = useState(() => {
    try { return localStorage.getItem(KEY_SELECTED_MODEL) || ''; } catch { return ''; }
  });
  const [availableModels, setAvailableModels] = useState([]);
  const [aiAccessToken, setAccess] = useState(getAiAccessToken);
  const updateAiAccessToken = value => { setAccess(value); setAiAccessToken(value); };

  // Save profile and model changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(KEY_NUTRITIONIST, JSON.stringify(nutritionist));
    } catch (e) {
      console.error("Erro ao salvar perfil no localStorage", e);
    }
  }, [nutritionist]);

  useEffect(() => {
    try {
      localStorage.setItem(KEY_SELECTED_MODEL, selectedModel);
    } catch (e) {
      console.error("Erro ao salvar modelo de IA no localStorage", e);
    }
  }, [selectedModel]);
  
  const [geminiStatus, setGeminiStatus] = useState('missing');
  const [apiTestDetails, setApiTestDetails] = useState(null);
  const testApiConnection = async () => {
    setGeminiStatus('testing');
    try {
      const status = await getAiStatus();
      setAvailableModels(status.models);
      setSelectedModel(previous => status.models.includes(previous) ? previous : status.models[0]);
      setGeminiStatus(status.configured ? 'configured' : 'missing');
      setApiTestDetails(status.configured ? 'Servidor configurado. A disponibilidade do provedor será verificada ao gerar um documento.' : 'Configure GEMINI_API_KEY no servidor.');
    } catch (error) {
      setGeminiStatus('error');
      setApiTestDetails(error.message);
    }
  };
  useEffect(() => { testApiConnection(); }, []);

  // Sistema de Notificações Inteligentes
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const [liveNotificationsEnabled, setLiveNotificationsEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem(KEY_LIVE_NOTIFS);
      return saved !== null ? JSON.parse(saved) : true;
    } catch { return true;
    }
  });

  const toggleLiveNotifications = () => {
    setLiveNotificationsEnabled(prev => {
      const nextVal = !prev;
      try {
        localStorage.setItem(KEY_LIVE_NOTIFS, JSON.stringify(nextVal));
      } catch { }
      return nextVal;
    });
  };

  const showAppNotification = useCallback((message, type = 'info', duration = 6000) => {
    setAppNotification({ message, type });
    if (duration > 0) {
      setTimeout(() => setAppNotification(null), duration);
    }
  }, []);

  const handleConfirmAppointment = useCallback(async (event) => {
    try {
      const savedToken = localStorage.getItem(KEY_GOOGLE_TOKEN);
      const tokenInfo = savedToken ? JSON.parse(savedToken) : null;
      if (!tokenInfo?.access_token) {
        alert('Para confirmar este agendamento, acesse a aba "Agenda" e conecte sua conta Google Calendar.');
        return false;
      }
      await confirmAppointmentEvent(tokenInfo.access_token, GOOGLE_CALENDAR_ID, event);
      showAppNotification(`Consulta de ${event.summary} marcada como confirmada no Google Calendar!`, 'success');
      setNotificationsList(prev => prev.filter(n => n.event?.id !== event.id));
      return true;
    } catch (err) {
      alert('Erro ao confirmar evento na agenda: ' + err.message);
      return false;
    }
  }, [showAppNotification]);

  const handleCancelAppointment = useCallback(async (event) => {
    try {
      const savedToken = localStorage.getItem(KEY_GOOGLE_TOKEN);
      const tokenInfo = savedToken ? JSON.parse(savedToken) : null;
      if (!tokenInfo?.access_token) {
        alert('Para desmarcar este agendamento, acesse a aba "Agenda" e conecte sua conta Google Calendar.');
        return false;
      }
      await cancelAppointmentEvent(tokenInfo.access_token, GOOGLE_CALENDAR_ID, event);
      showAppNotification(`Consulta de ${event.summary} marcada como [DESMARCADO] no Google Calendar!`, 'warning');
      setNotificationsList(prev => prev.filter(n => n.event?.id !== event.id));
      return true;
    } catch (err) {
      alert('Erro ao desmarcar evento na agenda: ' + err.message);
      return false;
    }
  }, [showAppNotification]);

  // Efeito para checar alertas de Mensagens Pendentes, Confirmações/Desmarcações e Virada de Mês
  useEffect(() => {
    async function checkSystemNotifications() {
      const items = [];
      const now = new Date();
      const currentDay = now.getDate();
      const currentMonthName = now.toLocaleString('pt-BR', { month: 'long' });

      // 1. Alerta de Virada de Mês (ex: primeiros 5 dias do mês para gerar o relatório do mês anterior)
      if (currentDay <= 5) {
        items.push({
          id: 'month_close',
          category: 'month_close',
          type: 'warning',
          title: `Fechamento do Mês (${currentMonthName})`,
          description: `Novo mês iniciado! Lembre-se de emitir o Relatório Executivo de Metas & Bonificação da secretária.`,
          actionLabel: 'Abrir Dashboard e Gerar PDF',
          targetMode: 'dashboard',
          timeAgo: 'Lembrete do Mês'
        });
      }

      // 2. Alerta de Mensagens e Confirmações do WhatsApp
      if (liveNotificationsEnabled) {
        try {
          // Checar se há eventos da Google Agenda para cruzar
          let calendarEvents = [];
          const savedToken = localStorage.getItem(KEY_GOOGLE_TOKEN);
          let tokenInfo = null;
          try {
            tokenInfo = savedToken ? JSON.parse(savedToken) : null;
          } catch {}

          if (tokenInfo?.access_token && (!tokenInfo.expires_at || Date.now() < tokenInfo.expires_at)) {
            try {
              const startWindow = new Date();
              startWindow.setHours(0, 0, 0, 0);
              const endWindow = new Date(startWindow.getTime() + 8 * 24 * 60 * 60 * 1000);
              calendarEvents = await fetchCalendarPage(tokenInfo.access_token, GOOGLE_CALENDAR_ID, startWindow, endWindow);
            } catch (calErr) {
              console.warn('Não foi possível buscar eventos da agenda para notificações:', calErr);
            }
          }

          const convs = await fetchConversations({ limit: 40 });
          if (Array.isArray(convs)) {
            // A. Confirmações e Desmarcações de Agendamento detectadas
            if (calendarEvents.length > 0) {
              const processedEvtIds = new Set();
              for (const conv of convs) {
                const text = conv.mensagem_texto || '';
                const patientName = conv.nome_paciente || conv.nome_contato;

                // 1. Checar se é cancelamento / remarcação
                if (detectCancellationIntent(text)) {
                  const matchingEvt = matchPatientNameToEvents(patientName, calendarEvents, { allowConfirmed: true });
                  if (matchingEvt && !processedEvtIds.has(matchingEvt.id)) {
                    processedEvtIds.add(matchingEvt.id);
                    const evtDate = new Date(matchingEvt.start.dateTime || matchingEvt.start.date);
                    const formattedDate = !isNaN(evtDate.getTime()) 
                      ? evtDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                      : 'Data a definir';

                    items.push({
                      id: `cancel_${matchingEvt.id}`,
                      category: 'agenda_cancellation',
                      type: 'danger',
                      title: `Desmarcação: ${patientName}`,
                      description: `Paciente avisou no WhatsApp: "${text.length > 55 ? text.slice(0, 55) + '...' : text}". Consulta em ${formattedDate} (${matchingEvt.summary}) precisa ser liberada/remarcada.`,
                      actionLabel: 'Marcar Desmarcado (Vermelho)',
                      event: matchingEvt,
                      targetMode: 'agenda',
                      timeAgo: 'WhatsApp'
                    });
                  }
                }
                // 2. Checar se é confirmação afirmativa
                else if (detectConfirmationIntent(text)) {
                  const matchingEvt = matchPatientNameToEvents(patientName, calendarEvents, { allowConfirmed: false });
                  if (matchingEvt && !processedEvtIds.has(matchingEvt.id)) {
                    processedEvtIds.add(matchingEvt.id);
                    const evtDate = new Date(matchingEvt.start.dateTime || matchingEvt.start.date);
                    const formattedDate = !isNaN(evtDate.getTime()) 
                      ? evtDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                      : 'Data a definir';

                    items.push({
                      id: `confirm_${matchingEvt.id}`,
                      category: 'agenda_confirmation',
                      type: 'success',
                      title: `Confirmação: ${patientName}`,
                      description: `Paciente confirmou no WhatsApp: "${text.length > 55 ? text.slice(0, 55) + '...' : text}". Consulta em ${formattedDate} está à confirmar.`,
                      actionLabel: 'Confirmar na Agenda',
                      event: matchingEvt,
                      targetMode: 'agenda',
                      timeAgo: 'WhatsApp'
                    });
                  }
                }
              }
            }

            // B. Mensagens Pendentes no Supabase
            const pending = convs.filter(c => !c.respondida && c.categoria !== 'Cortesia / Encerramento');
            if (pending.length > 0) {
              items.push({
                id: 'pending_messages',
                category: 'whatsapp',
                type: pending.length >= 3 ? 'danger' : 'warning',
                title: `${pending.length} Mensagem(ns) Aguardando Resposta`,
                description: `Existem pacientes aguardando retorno no WhatsApp. Cheque a fila para manter a meta de SLA da clínica.`,
                actionLabel: 'Ver Conversas Pendentes',
                targetMode: 'dashboard',
                timeAgo: 'Ao Vivo'
              });
            }
          }
        } catch (err) {
          console.warn('Não foi possível verificar mensagens para notificações:', err);
        }
      }

      setNotificationsList(items);
    }

    checkSystemNotifications();
    const interval = setInterval(checkSystemNotifications, 60000); // Recheca a cada 1 minuto
    return () => clearInterval(interval);
  }, [liveNotificationsEnabled]);

  return {
    availableModels,
    aiAccessToken,
    updateAiAccessToken,
    nutritionist,
    setNutritionist,
    activeModal,
    setActiveModal,
    selectedModel,
    setSelectedModel,
    geminiStatus,
    apiTestDetails,
    testApiConnection,
    isNotificationOpen,
    setIsNotificationOpen,
    notificationsList,
    liveNotificationsEnabled,
    toggleLiveNotifications,
    appNotification,
    setAppNotification,
    showAppNotification,
    handleConfirmAppointment,
    handleCancelAppointment
  };
}
