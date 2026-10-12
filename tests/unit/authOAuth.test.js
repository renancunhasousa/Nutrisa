import test from 'node:test';
import assert from 'node:assert/strict';
import { getGoogleOAuthOptions, getOAuthRedirectUrl } from '../../app/src/features/auth/oauth.js';

test('monta o retorno OAuth sem carregar query ou hash da tela atual', () => {
  const redirectUrl = getOAuthRedirectUrl({
    origin: 'https://nutrisa.example',
    pathname: '/app/',
    search: '?error=temporario',
    hash: '#agenda',
  });

  assert.equal(redirectUrl, 'https://nutrisa.example/app/');
});

test('configura o login do Supabase com o provedor Google', () => {
  const options = getGoogleOAuthOptions({
    origin: 'http://localhost:5173',
    pathname: '/',
  });

  assert.deepEqual(options, {
    provider: 'google',
    options: {
      redirectTo: 'http://localhost:5173/',
    },
  });
});

test('falha claramente quando a origem do navegador não está disponível', () => {
  assert.throws(() => getOAuthRedirectUrl({ pathname: '/' }), /URL de retorno/);
});
