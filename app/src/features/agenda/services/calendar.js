export async function fetchCalendarPage(accessToken, calendarId, firstDay, lastDay, fetchImpl = fetch) {
  const items = [];
  let pageToken;
  const visited = new Set();
  do {
    const query = new URLSearchParams({ timeMin: firstDay.toISOString(), timeMax: lastDay.toISOString(), singleEvents: 'true', orderBy: 'startTime', maxResults: '2500' });
    if (pageToken) query.set('pageToken', pageToken);
    const response = await fetchImpl('https://www.googleapis.com/calendar/v3/calendars/' + encodeURIComponent(calendarId) + '/events?' + query, { headers: { Authorization: 'Bearer ' + accessToken } });
    if (!response.ok) throw Object.assign(new Error('Falha ao consultar a agenda (' + response.status + ').'), { status: response.status });
    const data = await response.json();
    items.push(...(data.items || []));
    pageToken = data.nextPageToken;
    if (pageToken && visited.has(pageToken)) throw new Error('Paginação inválida da agenda.');
    visited.add(pageToken);
  } while (pageToken);
  return items;
}

export function mergeLocalEvents(events, edits) {
  return events.map(event => edits[event.id] ? { ...event, ...edits[event.id], localOnly: true } : event);
}

export async function updateCalendarEvent(accessToken, calendarId, eventId, event, fetchImpl = fetch) {
  const response = await fetchImpl('https://www.googleapis.com/calendar/v3/calendars/' + encodeURIComponent(calendarId) + '/events/' + encodeURIComponent(eventId), {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({ summary: event.summary || '', description: event.description || '', start: event.start, end: event.end, colorId: event.colorId }),
  });
  if (!response.ok) throw Object.assign(new Error('Falha ao atualizar o evento no Google Calendar (' + response.status + ').'), { status: response.status });
  return response.json();
}
