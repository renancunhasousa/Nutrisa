import test from 'node:test';
import assert from 'node:assert/strict';

test('tasks are sorted chronologically from earliest to latest', () => {
  // Simula a ordenação idêntica à implementada no useTasks.js
  const sortTasks = (tasksList) => {
    return [...tasksList].sort((a, b) => {
      // 1. Data de vencimento: do dia mais cedo para o mais tarde
      const dateA = a.dueDate || '';
      const dateB = b.dueDate || '';
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }

      // 2. Horário da consulta: do mais cedo para o mais tarde
      const timeA = a.eventTime || (a.notes && a.notes.match(/às\s*(\d{2}:\d{2})/) ? a.notes.match(/às\s*(\d{2}:\d{2})/)[1] : null);
      const timeB = b.eventTime || (b.notes && b.notes.match(/às\s*(\d{2}:\d{2})/) ? b.notes.match(/às\s*(\d{2}:\d{2})/)[1] : null);

      if (timeA && timeB) {
        const timeDiff = timeA.localeCompare(timeB);
        if (timeDiff !== 0) return timeDiff;
      } else if (timeA && !timeB) {
        return -1;
      } else if (!timeA && timeB) {
        return 1;
      }

      // 3. Prioridade (alta > media > baixa)
      const priorityOrder = { alta: 1, media: 2, baixa: 3 };
      const prioDiff = (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
      if (prioDiff !== 0) return prioDiff;

      // 4. Desempate por nome do paciente
      return (a.patientName || a.title || '').localeCompare(b.patientName || b.title || '');
    });
  };

  const unsorted = [
    { id: '1', patientName: 'Carlos Tarde', dueDate: '2026-09-22', eventTime: '15:30', priority: 'alta' },
    { id: '2', patientName: 'Ana Manhã Cedo', dueDate: '2026-09-22', eventTime: '08:00', priority: 'alta' },
    { id: '3', patientName: 'Bruna Meio Dia', dueDate: '2026-09-22', eventTime: '11:15', priority: 'alta' },
    { id: '4', patientName: 'Daniel Véspera', dueDate: '2026-09-21', eventTime: '14:00', priority: 'alta' },
  ];

  const sorted = sortTasks(unsorted);

  assert.equal(sorted[0].id, '4', 'Vencimento anterior deve vir primeiro (21/09)');
  assert.equal(sorted[1].id, '2', 'No dia 22/09, o horário das 08:00 deve vir primeiro');
  assert.equal(sorted[2].id, '3', 'No dia 22/09, o horário das 11:15 deve vir em segundo');
  assert.equal(sorted[3].id, '1', 'No dia 22/09, o horário das 15:30 deve vir em terceiro');
});

test('tasks sorting extracts consultation time from notes as backwards compatibility fallback', () => {
  const sortTasks = (tasksList) => {
    return [...tasksList].sort((a, b) => {
      const dateA = a.dueDate || '';
      const dateB = b.dueDate || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);

      const timeA = a.eventTime || (a.notes && a.notes.match(/às\s*(\d{2}:\d{2})/) ? a.notes.match(/às\s*(\d{2}:\d{2})/)[1] : null);
      const timeB = b.eventTime || (b.notes && b.notes.match(/às\s*(\d{2}:\d{2})/) ? b.notes.match(/às\s*(\d{2}:\d{2})/)[1] : null);

      if (timeA && timeB) {
        const timeDiff = timeA.localeCompare(timeB);
        if (timeDiff !== 0) return timeDiff;
      } else if (timeA && !timeB) return -1;
      else if (!timeA && timeB) return 1;

      return (a.patientName || '').localeCompare(b.patientName || '');
    });
  };

  const tasks = [
    { id: 't-16h', patientName: 'Paciente 16h', dueDate: '2026-09-22', notes: 'Importado da agenda. Consulta: 21/09/2026 às 16:00.' },
    { id: 't-09h', patientName: 'Paciente 09h', dueDate: '2026-09-22', notes: 'Importado da agenda. Consulta: 21/09/2026 às 09:00.' },
  ];

  const sorted = sortTasks(tasks);
  assert.equal(sorted[0].id, 't-09h');
  assert.equal(sorted[1].id, 't-16h');
});

test('syncTasksFromCalendar throws friendly auth error when Google Calendar is disconnected', async () => {
  const originalLocalStorage = globalThis.localStorage;
  const storage = new Map();
  globalThis.localStorage = {
    getItem: (k) => storage.get(k) ?? null,
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
    clear: () => storage.clear(),
  };

  try {
    const { syncTasksFromCalendar } = await import('../../app/src/features/tarefas/services/agendaTaskSync.js');
    await assert.rejects(
      async () => syncTasksFromCalendar([]),
      (err) => {
        assert.equal(err.status, 401);
        assert.equal(err.isAuthError, true);
        assert.ok(err.message.includes('módulo "Agenda"'));
        return true;
      }
    );
  } finally {
    globalThis.localStorage = originalLocalStorage;
  }
});

test('syncTasksFromCalendar intercepts 401 response and instructs user to reconnect calendar', async () => {
  const originalLocalStorage = globalThis.localStorage;
  const storage = new Map();
  storage.set('nutriisa_google_token', JSON.stringify({ access_token: 'expired_token' }));
  globalThis.localStorage = {
    getItem: (k) => storage.get(k) ?? null,
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
    clear: () => storage.clear(),
  };

  try {
    const { syncTasksFromCalendar } = await import('../../app/src/features/tarefas/services/agendaTaskSync.js');
    const mockFetchCalendarPage401 = async () => {
      const err = new Error('Falha ao consultar a agenda (401).');
      err.status = 401;
      throw err;
    };

    await assert.rejects(
      async () => syncTasksFromCalendar([], 7, 'dieta', mockFetchCalendarPage401),
      (err) => {
        assert.equal(err.status, 401);
        assert.equal(err.isAuthError, true);
        assert.ok(err.message.includes('expirada') || err.message.includes('401'));
        assert.ok(err.message.includes('módulo "Agenda"'));
        return true;
      }
    );
  } finally {
    globalThis.localStorage = originalLocalStorage;
  }
});

test('isLikelyPatientAppointment filters out personal events like nazareno, unha, almoço and admits real patients', async () => {
  const { isLikelyPatientAppointment, extractPatientName } = await import('../../app/src/features/tarefas/services/agendaTaskSync.js');

  // Compromissos pessoais que devem ser descartados
  assert.equal(isLikelyPatientAppointment({ summary: 'Nazareno' }), false);
  assert.equal(isLikelyPatientAppointment({ summary: 'Culto Nazareno' }), false);
  assert.equal(isLikelyPatientAppointment({ summary: 'Igreja Nazareno' }), false);
  assert.equal(isLikelyPatientAppointment({ summary: 'Unha' }), false);
  assert.equal(isLikelyPatientAppointment({ summary: 'Fazer unhas e salão' }), false);
  assert.equal(isLikelyPatientAppointment({ summary: 'Manicure' }), false);
  assert.equal(isLikelyPatientAppointment({ summary: 'Almoço com família' }), false);
  assert.equal(isLikelyPatientAppointment({ summary: 'Dentista' }), false);
  assert.equal(isLikelyPatientAppointment({ summary: 'Pilates' }), false);
  assert.equal(isLikelyPatientAppointment({ summary: 'Bloqueio de agenda' }), false);
  assert.equal(isLikelyPatientAppointment({ summary: 'Mariana Silva', colorId: '9' }), false, 'colorId 9 (Pessoal) deve ser ignorado');
  assert.equal(isLikelyPatientAppointment({ summary: '[DESMARCADO] Carlos Eduardo' }), false, 'desmarcado deve ser ignorado');

  // Pacientes reais que devem ser aceitos
  assert.equal(isLikelyPatientAppointment({ summary: 'Mariana Silva' }), true);
  assert.equal(isLikelyPatientAppointment({ summary: '[CONFIRMADO] João Carlos' }), true);
  assert.equal(isLikelyPatientAppointment({ summary: 'Consulta - Carlos Roberto' }), true);
  assert.equal(isLikelyPatientAppointment({ summary: 'Retorno - Beatriz Souza' }), true);
  assert.equal(isLikelyPatientAppointment({ summary: 'Primeira Vez - Camila Lima' }), true);

  // Validação dos nomes limpos de pacientes
  assert.equal(extractPatientName('[CONFIRMADO] João Carlos'), 'João Carlos');
  assert.equal(extractPatientName('Consulta - Carlos Roberto'), 'Carlos Roberto');
  assert.equal(extractPatientName('Retorno - Beatriz Souza (Online)'), 'Beatriz Souza');
});

test('syncTasksFromCalendar imports only patient events and ignores personal events', async () => {
  const originalLocalStorage = globalThis.localStorage;
  const storage = new Map();
  storage.set('nutriisa_google_token', JSON.stringify({ access_token: 'valid_mock_token' }));
  globalThis.localStorage = {
    getItem: (k) => storage.get(k) ?? null,
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
    clear: () => storage.clear(),
  };

  try {
    const { syncTasksFromCalendar } = await import('../../app/src/features/tarefas/services/agendaTaskSync.js');

    const mockEvents = [
      { id: '1', summary: 'Nazareno', start: { dateTime: '2026-09-22T08:00:00-03:00' } },
      { id: '2', summary: '[CONFIRMADO] Mariana Silva', start: { dateTime: '2026-09-22T09:00:00-03:00' } },
      { id: '3', summary: 'Unha', start: { dateTime: '2026-09-22T11:00:00-03:00' } },
      { id: '4', summary: 'Almoço', start: { dateTime: '2026-09-22T12:00:00-03:00' } },
      { id: '5', summary: 'Consulta - Carlos Roberto', start: { dateTime: '2026-09-22T14:30:00-03:00' } },
      { id: '6', summary: 'Pilates', start: { dateTime: '2026-09-22T17:00:00-03:00' } },
    ];

    const mockFetchCalendarPage = async () => mockEvents;

    const result = await syncTasksFromCalendar([], 7, 'dieta', mockFetchCalendarPage);

    assert.equal(result.newTasksCreated, 2, 'Apenas 2 pacientes devem virar tarefas');
    assert.equal(result.personalEventsIgnored, 4, '4 compromissos pessoais devem ser desconsiderados');
    assert.equal(result.newTasks[0].patientName, 'Mariana Silva');
    assert.equal(result.newTasks[1].patientName, 'Carlos Roberto');
  } finally {
    globalThis.localStorage = originalLocalStorage;
  }
});

test('AI access token persists permanently in localStorage instead of being lost per session', async () => {
  const originalLocalStorage = globalThis.localStorage;
  const originalSessionStorage = globalThis.sessionStorage;
  const localMap = new Map();
  const sessionMap = new Map();

  globalThis.localStorage = {
    getItem: (k) => localMap.get(k) ?? null,
    setItem: (k, v) => localMap.set(k, String(v)),
    removeItem: (k) => localMap.delete(k),
  };
  globalThis.sessionStorage = {
    getItem: (k) => sessionMap.get(k) ?? null,
    setItem: (k, v) => sessionMap.set(k, String(v)),
    removeItem: (k) => sessionMap.delete(k),
  };

  try {
    const { getAiAccessToken, setAiAccessToken } = await import('../../app/src/shared/services/aiClient.js');

    // 1. Define o token de acesso
    setAiAccessToken('codigo-seguro-clinica-123');

    // 2. Garante que salvou no localStorage
    assert.equal(localMap.get('nutrisa_ai_access'), 'codigo-seguro-clinica-123');
    assert.equal(getAiAccessToken(), 'codigo-seguro-clinica-123');

    // 3. Simula fechamento do navegador (sessionStorage apagado)
    sessionMap.clear();

    // 4. Garante que o token continua salvo no localStorage após o fechamento da sessão
    assert.equal(getAiAccessToken(), 'codigo-seguro-clinica-123');

    // 5. Remoção
    setAiAccessToken('');
    assert.equal(getAiAccessToken(), '');
    assert.equal(localMap.has('nutrisa_ai_access'), false);
  } finally {
    globalThis.localStorage = originalLocalStorage;
    globalThis.sessionStorage = originalSessionStorage;
  }
});



