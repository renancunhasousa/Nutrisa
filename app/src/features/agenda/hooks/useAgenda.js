import { useState, useEffect, useCallback } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { fetchCalendarPage, mergeLocalEvents } from '../services/calendar.js';
import { KEY_GOOGLE_TOKEN, KEY_GOOGLE_MEET } from '../../../config/storageKeys.js';
import { GOOGLE_CALENDAR_ID } from '../../../config/env.js';

const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';
const KEY_BLOCKED_DATES = 'nutriisa_blocked_dates';

/**
 * Hook que encapsula todo o estado, autenticação e busca de eventos
 * da tela de Agenda (Google Calendar).
 */
export function useAgenda() {
  const calendarId = GOOGLE_CALENDAR_ID;
  const editsKey = 'nutrisa_agenda_edits:' + calendarId;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [tokenInfo, setTokenInfo] = useState(() => {
    try {
      const saved = localStorage.getItem(KEY_GOOGLE_TOKEN);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.access_token && parsed?.expires_at && Date.now() < parsed.expires_at) return parsed;
      }
      return null;
    } catch { return null; }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!tokenInfo?.access_token);

  const [meetLink, setMeetLink] = useState(() => {
    try { return localStorage.getItem(KEY_GOOGLE_MEET) || 'https://meet.google.com/bela-consultas'; }
    catch { return 'https://meet.google.com/bela-consultas'; }
  });

  const [blockedDates, setBlockedDates] = useState(() => {
    try { const saved = localStorage.getItem(KEY_BLOCKED_DATES); return saved ? JSON.parse(saved) : []; }
    catch { return []; }
  });
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

  const handleSaveMeetLink = (newLink) => {
    setMeetLink(newLink);
    try { localStorage.setItem(KEY_GOOGLE_MEET, newLink); } catch {}
  };

  const toggleBlockDate = (dateStr) => {
    setBlockedDates(prev => {
      const next = prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr];
      try { localStorage.setItem(KEY_BLOCKED_DATES, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleUpdateEvent = async (updatedEvent) => {
    let edits = {};
    try { edits = JSON.parse(localStorage.getItem(editsKey) || '{}'); } catch {}
    edits[updatedEvent.id] = updatedEvent;
    localStorage.setItem(editsKey, JSON.stringify(edits));
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? { ...updatedEvent, localOnly: true } : e));
    setSelectedEvent(updatedEvent);
  };

  const fetchCalendarEvents = useCallback(async (accessToken, targetDate) => {
    setLoading(true);
    try {
      const curr = new Date(targetDate);
      const firstDay = new Date(curr.getFullYear(), curr.getMonth(), 1);
      firstDay.setDate(firstDay.getDate() - 7);
      firstDay.setHours(0, 0, 0, 0);
      const lastDay = new Date(curr.getFullYear(), curr.getMonth() + 1, 0);
      lastDay.setDate(lastDay.getDate() + 7);
      lastDay.setHours(23, 59, 59, 999);
      const items = await fetchCalendarPage(accessToken, calendarId, firstDay, lastDay);
      let edits = {};
      try { edits = JSON.parse(localStorage.getItem(editsKey) || '{}'); } catch {}
      setEvents(mergeLocalEvents(items, edits));
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      alert(`Atenção ao sincronizar a agenda (${calendarId}):\n\n${error.message}\n\nSe você estiver logando com a conta da secretária, certifique-se de que a Dra. (${calendarId}) compartilhou a agenda dela com seu e-mail no Google Calendar.`);
    } finally {
      setLoading(false);
    }
  }, [calendarId, editsKey]);

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      const expiresInSec = tokenResponse.expires_in || 3600;
      const enhanced = { ...tokenResponse, expires_at: Date.now() + expiresInSec * 1000 };
      setTokenInfo(enhanced);
      setIsAuthenticated(true);
      try { localStorage.setItem(KEY_GOOGLE_TOKEN, JSON.stringify(enhanced)); } catch {}
    },
    scope: SCOPES,
    onError: (error) => console.log('Login falhou:', error),
  });

  const handleDisconnect = () => {
    setTokenInfo(null);
    setIsAuthenticated(false);
    setEvents([]);
    try { localStorage.removeItem(KEY_GOOGLE_TOKEN); } catch {}
  };

  const handleRefresh = () => {
    if (tokenInfo?.access_token) fetchCalendarEvents(tokenInfo.access_token, currentDate);
  };

  useEffect(() => {
    if (tokenInfo?.access_token) fetchCalendarEvents(tokenInfo.access_token, currentDate);
  }, [tokenInfo?.access_token, currentDate, fetchCalendarEvents]);

  return {
    calendarId, events, loading,
    tokenInfo, isAuthenticated,
    currentDate, setCurrentDate,
    selectedEvent, setSelectedEvent,
    meetLink, handleSaveMeetLink,
    blockedDates, toggleBlockDate,
    isBlockModalOpen, setIsBlockModalOpen,
    login, handleRefresh, handleDisconnect, handleUpdateEvent,
  };
}
