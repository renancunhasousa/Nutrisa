import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeName, cleanPhone, matchPatientAvatar } from '../../app/src/features/tarefas/services/patientAvatarService.js';

test('normalizeName cleans spaces, accents, and casing', () => {
  assert.equal(normalizeName('  Flávia  TAKATORI '), 'flavia takatori');
  assert.equal(normalizeName('Dr. Caio-Lima!'), 'dr caio lima');
});

test('cleanPhone extracts only numeric digits', () => {
  assert.equal(cleanPhone('+55 (19) 99750-7104'), '5519997507104');
  assert.equal(cleanPhone('19997507104@s.whatsapp.net'), '19997507104');
});

test('matchPatientAvatar matches by phone directly or without country code', () => {
  const avatarsData = {
    byPhone: {
      '5519999991111': 'https://example.com/photo1.jpg',
      '19999991111': 'https://example.com/photo1.jpg',
    },
    byName: {},
    rawList: [],
  };

  assert.equal(
    matchPatientAvatar(avatarsData, 'Paciente Teste', '5519999991111'),
    'https://example.com/photo1.jpg'
  );
  assert.equal(
    matchPatientAvatar(avatarsData, 'Paciente Teste', '+55 (19) 99999-1111'),
    'https://example.com/photo1.jpg'
  );
});

test('matchPatientAvatar matches by direct or partial name', () => {
  const avatarsData = {
    byPhone: {},
    byName: {
      'flavia takatori': 'https://example.com/flavia.jpg',
    },
    rawList: [
      {
        norm: 'flavia takatori',
        tokens: ['flavia', 'takatori'],
        photo: 'https://example.com/flavia.jpg',
      },
      {
        norm: 'gabriel zanelato de oliveira',
        tokens: ['gabriel', 'zanelato', 'de', 'oliveira'],
        photo: 'https://example.com/gabriel.jpg',
      }
    ],
  };

  // Match exato
  assert.equal(
    matchPatientAvatar(avatarsData, 'Flávia Takatori', null),
    'https://example.com/flavia.jpg'
  );

  // Match cruzado quando o nome na agenda tem sobrenomes adicionais
  assert.equal(
    matchPatientAvatar(avatarsData, 'Flavia Pierozzi Takatori', null),
    'https://example.com/flavia.jpg'
  );

  // Match quando a agenda tem apenas primeiro e último nome
  assert.equal(
    matchPatientAvatar(avatarsData, 'Gabriel Zanelato', null),
    'https://example.com/gabriel.jpg'
  );
});
