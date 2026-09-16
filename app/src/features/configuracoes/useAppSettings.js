import { getAiStatus, getAiAccessToken, setAiAccessToken } from '../../shared/services/aiClient.js';
import { useState, useEffect } from 'react';
import { DEFAULT_NUTRITIONIST } from './defaultProfile.js';
import { fetchConversations } from '../atendimento/services/conversations.js';
import {
  KEY_NUTRITIONIST,
  KEY_SELECTED_MODEL,
  KEY_LIVE_NOTIFS,
} from '../../config/storageKeys.js';
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

  // Efeito para checar alertas de Mensagens Pendentes e Virada de Mês
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

      // 2. Alerta de Mensagens Pendentes no Supabase (se o modo Ao Vivo estiver ativado)
      if (liveNotificationsEnabled) {
        try {
          const convs = await fetchConversations({ limit: 100 });
          if (Array.isArray(convs)) {
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
          console.warn('Não foi possível verificar mensagens pendentes para notificações:', err);
        }
      }

      setNotificationsList(items);
    }

    checkSystemNotifications();
    const interval = setInterval(checkSystemNotifications, 60000); // Recheca a cada 1 minuto
    return () => clearInterval(interval);
  }, [liveNotificationsEnabled]);

  const showAppNotification = (message, type = 'info', duration = 6000) => {
    setAppNotification({ message, type });
    if (duration > 0) {
      setTimeout(() => setAppNotification(null), duration);
    }
  };

return { availableModels, aiAccessToken, updateAiAccessToken, nutritionist, setNutritionist, activeModal, setActiveModal, selectedModel, setSelectedModel, geminiStatus, apiTestDetails, testApiConnection, isNotificationOpen, setIsNotificationOpen, notificationsList, liveNotificationsEnabled, toggleLiveNotifications, appNotification, setAppNotification, showAppNotification };
}
