import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchCalendarPage } from '../../agenda/services/calendar.js';
import { KEY_GOOGLE_TOKEN } from '../../../config/storageKeys.js';
import { GOOGLE_CALENDAR_ID } from '../../../config/env.js';
import { applyAppointmentDates, deriveAppointmentDates, resolveCalendarLinks } from '../domain/calendarLinks.js';
import { listCalendarLinks, removeCalendarLink, saveCalendarLink, saveCalendarLinksBulk } from '../services/calendarLinks.js';

const DAY = 86_400_000;

function readToken() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY_GOOGLE_TOKEN) || 'null');
    if (!parsed?.access_token) return null;
    if (parsed.expires_at && parsed.expires_at < Date.now()) return null;
    return parsed.access_token;
  } catch {
    return null;
  }
}

/**
 * Lê a agenda do Google (mesmo token da tela Agenda), liga eventos a pacientes por nome
 * e devolve os pacientes enriquecidos com última consulta e próxima consulta.
 */
export function useCalendarPatientLinks({ patients, organizationId }) {
  const [events, setEvents] = useState([]);
  const [manualLinks, setManualLinks] = useState(() => new Map());
  const [state, setState] = useState('idle'); // idle | no_token | loading | ready | error
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    const token = readToken();
    if (!token) { setState('no_token'); setEvents([]); return; }
    setState('loading');
    setError('');
    try {
      const now = Date.now();
      const [items, links] = await Promise.all([
        fetchCalendarPage(token, GOOGLE_CALENDAR_ID, new Date(now - 180 * DAY), new Date(now + 120 * DAY)),
        listCalendarLinks(organizationId).catch(() => new Map()),
      ]);
      setEvents(items);
      setManualLinks(links);
      setState('ready');
    } catch (requestError) {
      if (requestError.status === 401) {
        setState('no_token');
        return;
      }
      setError(requestError.message || 'Não foi possível ler a agenda.');
      setState('error');
    }
  }, [organizationId]);

  useEffect(() => { refresh(); }, [refresh]);

  const groups = useMemo(
    () => resolveCalendarLinks(events, patients, manualLinks, GOOGLE_CALENDAR_ID),
    [events, patients, manualLinks],
  );
  const enrichedPatients = useMemo(
    () => applyAppointmentDates(patients, deriveAppointmentDates(groups)),
    [patients, groups],
  );

  const link = async (nameKey, patientId) => {
    await saveCalendarLink({ organizationId, nameKey, patientId });
    setManualLinks((prev) => new Map(prev).set(nameKey, { patient_id: patientId, ignored: false }));
  };
  const linkMany = async (items) => {
    await saveCalendarLinksBulk({ organizationId, links: items });
    setManualLinks((prev) => {
      const next = new Map(prev);
      items.forEach(({ nameKey, patientId }) => next.set(nameKey, { patient_id: patientId, ignored: false }));
      return next;
    });
  };
  const ignore = async (nameKey) => {
    await saveCalendarLink({ organizationId, nameKey, ignored: true });
    setManualLinks((prev) => new Map(prev).set(nameKey, { patient_id: null, ignored: true }));
  };
  const unlink = async (nameKey) => {
    await removeCalendarLink({ organizationId, nameKey });
    setManualLinks((prev) => { const next = new Map(prev); next.delete(nameKey); return next; });
  };

  return { state, error, groups, enrichedPatients, refresh, link, linkMany, ignore, unlink };
}
