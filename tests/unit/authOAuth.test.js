import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanAuthTokensFromUrl, extractAuthErrorFromHash, getGoogleOAuthOptions, getOAuthRedirectUrl } from '../../app/src/features/auth/oauth.js';

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

test('extrai mensagem de erro de autenticacao do hash do supabase', () => {
  assert.equal(extractAuthErrorFromHash('#error=access_denied&error_description=Acesso+negado'), 'Acesso negado');
  assert.equal(extractAuthErrorFromHash('#error=server_error'), 'server_error');
  assert.equal(extractAuthErrorFromHash('#access_token=token123'), null);
  assert.equal(extractAuthErrorFromHash(''), null);
});

test('remove tokens de acesso da URL apos login com sucesso', () => {
  let replacedUrl = null;
  const mockLocation = {
    pathname: '/',
    search: '',
    hash: '#access_token=jwt_token&refresh_token=refresh_token&token_type=bearer',
  };
  const mockHistory = {
    replaceState: (_state, _title, url) => {
      replacedUrl = url;
    },
  };

  cleanAuthTokensFromUrl(mockLocation, mockHistory);
  assert.equal(replacedUrl, '/#pacientes');
});

test('preserva rota de assinatura publica ao limpar hash de tokens', () => {
  let replacedUrl = null;
  const mockLocation = {
    pathname: '/',
    search: '',
    hash: '#sign-contract-123',
  };
  const mockHistory = {
    replaceState: (_state, _title, url) => {
      replacedUrl = url;
    },
  };

  cleanAuthTokensFromUrl(mockLocation, mockHistory);
  assert.equal(replacedUrl, null);
});
