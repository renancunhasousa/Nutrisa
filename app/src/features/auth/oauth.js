export function getOAuthRedirectUrl(location = window.location) {
  if (!location?.origin) {
    throw new Error('Não foi possível determinar a URL de retorno do login.');
  }

  const pathname = location.pathname || '/';
  return `${location.origin}${pathname}`;
}

export function extractAuthErrorFromHash(hash = '') {
  if (!hash || !hash.includes('error=')) return null;
  const cleanHash = hash.replace(/^[#?]/, '');
  const params = new URLSearchParams(cleanHash);
  return params.get('error_description') || params.get('error') || null;
}

export function cleanAuthTokensFromUrl(location = (typeof window !== 'undefined' ? window.location : null), history = (typeof window !== 'undefined' ? window.history : null)) {
  if (!location || !history) return;
  const hash = location.hash || '';
  if (hash.includes('access_token=') || hash.includes('refresh_token=')) {
    const cleanHash = hash.startsWith('#sign-') ? hash : '#pacientes';
    const cleanUrl = `${location.pathname || '/'}${location.search || ''}${cleanHash}`;
    history.replaceState(null, '', cleanUrl);
  }
}

export function getGoogleOAuthOptions(location = window.location) {
  return {
    provider: 'google',
    options: {
      redirectTo: getOAuthRedirectUrl(location),
    },
  };
}
