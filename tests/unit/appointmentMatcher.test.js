import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  detectConfirmationIntent, 
  detectCancellationIntent,
  normalizeName, 
  matchPatientNameToEvents, 
  confirmAppointmentEvent,
  cancelAppointmentEvent
} from '../../app/src/features/agenda/services/appointmentMatcher.js';

test('detectConfirmationIntent identifies affirmative confirmation phrases', () => {
  assert.equal(detectConfirmationIntent('Sim!'), true);
  assert.equal(detectConfirmationIntent('Sim, confirmo minha consulta'), true);
  assert.equal(detectConfirmationIntent('Confirmo'), true);
  assert.equal(detectConfirmationIntent('Confirmado, obrigada'), true);
  assert.equal(detectConfirmationIntent('Pode confirmar sim'), true);
  assert.equal(detectConfirmationIntent('Estarei lá com certeza!'), true);
  assert.equal(detectConfirmationIntent('Vou sim'), true);
  assert.equal(detectConfirmationIntent('Confirmadíssimo!'), true);
});

test('detectConfirmationIntent rejects non-confirmations, doubts, and cancellations', () => {
  assert.equal(detectConfirmationIntent('Não vou conseguir ir'), false);
  assert.equal(detectConfirmationIntent('Preciso remarcar para quinta'), false);
  assert.equal(detectConfirmationIntent('Tive um imprevisto, posso trocar?'), false);
  assert.equal(detectConfirmationIntent('Quanto custa a consulta?'), false);
  assert.equal(detectConfirmationIntent('Boa tarde, tudo bem?'), false);
  assert.equal(detectConfirmationIntent('Obrigada'), false);
});

test('detectCancellationIntent identifies cancellation and reschedule requests', () => {
  assert.equal(detectCancellationIntent('Não vou conseguir ir amanhã'), true);
  assert.equal(detectCancellationIntent('Preciso remarcar minha consulta'), true);
  assert.equal(detectCancellationIntent('Pode desmarcar por favor?'), true);
  assert.equal(detectCancellationIntent('Tive um imprevisto'), true);
  assert.equal(detectCancellationIntent('Não poderei comparecer'), true);
  assert.equal(detectCancellationIntent('Não vai dar pra ir'), true);
  assert.equal(detectCancellationIntent('Gostaria de remarcar'), true);
  assert.equal(detectCancellationIntent('Sim, confirmo!'), false);
  assert.equal(detectCancellationIntent('Bom dia'), false);
});

test('normalizeName correctly strips accents, spaces, and punctuation', () => {
  assert.equal(normalizeName('Dra. Isabela Muñoz!'), 'dra isabela munoz');
  assert.equal(normalizeName('  João   da   Silva  '), 'joao da silva');
});

test('matchPatientNameToEvents finds the correct upcoming event including allowConfirmed', () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);

  const mockEvents = [
    {
      id: 'evt-1',
      summary: 'Mariana Silva - Retorno',
      start: { dateTime: tomorrow.toISOString() },
      statusKey: 'a_confirmar'
    },
    {
      id: 'evt-2',
      summary: '[CONFIRMADO] Lucas Ferreira',
      start: { dateTime: tomorrow.toISOString() },
      statusKey: 'confirmado'
    }
  ];

  const matched = matchPatientNameToEvents('Mariana Silva', mockEvents);
  assert.ok(matched);
  assert.equal(matched.id, 'evt-1');

  // Should find confirmed event if allowConfirmed is true
  const matchedConfirmed = matchPatientNameToEvents('Lucas Ferreira', mockEvents, { allowConfirmed: true });
  assert.ok(matchedConfirmed);
  assert.equal(matchedConfirmed.id, 'evt-2');

  // Should not match someone not on calendar
  assert.equal(matchPatientNameToEvents('Carlos Eduardo', mockEvents), null);
});

test('confirmAppointmentEvent prepends [CONFIRMADO] and calls updateCalendarEvent', async () => {
  let patchBody = null;
  const mockFetch = async (url, opts) => {
    patchBody = JSON.parse(opts.body);
    return {
      ok: true,
      json: async () => ({ ...patchBody, id: 'evt-1' })
    };
  };

  const event = {
    id: 'evt-1',
    summary: 'Mariana Silva - Retorno',
    description: 'Consulta WebDiet',
    start: { dateTime: '2026-09-20T14:00:00Z' },
    end: { dateTime: '2026-09-20T15:00:00Z' }
  };

  const result = await confirmAppointmentEvent('fake-token', 'primary', event, mockFetch);
  assert.equal(result.summary, '[CONFIRMADO] Mariana Silva - Retorno');
  assert.equal(patchBody.summary, '[CONFIRMADO] Mariana Silva - Retorno');
  assert.equal(result.statusKey, 'confirmado');
});

test('cancelAppointmentEvent prepends [DESMARCADO] and calls updateCalendarEvent', async () => {
  let patchBody = null;
  const mockFetch = async (url, opts) => {
    patchBody = JSON.parse(opts.body);
    return {
      ok: true,
      json: async () => ({ ...patchBody, id: 'evt-1' })
    };
  };

  const event = {
    id: 'evt-1',
    summary: '[CONFIRMADO] Mariana Silva - Retorno',
    description: 'Consulta WebDiet',
    start: { dateTime: '2026-09-20T14:00:00Z' },
    end: { dateTime: '2026-09-20T15:00:00Z' }
  };

  const result = await cancelAppointmentEvent('fake-token', 'primary', event, mockFetch);
  assert.equal(result.summary, '[DESMARCADO] Mariana Silva - Retorno');
  assert.equal(patchBody.summary, '[DESMARCADO] Mariana Silva - Retorno');
  assert.equal(result.statusKey, 'desmarcado');
});
