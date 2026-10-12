export function getOAuthRedirectUrl(location = window.location) {
  if (!location?.origin) {
    throw new Error('Não foi possível determinar a URL de retorno do login.');
  }

  const pathname = location.pathname || '/';
  return `${location.origin}${pathname}`;
}

export function getGoogleOAuthOptions(location = window.location) {
  return {
    provider: 'google',
    options: {
      redirectTo: getOAuthRedirectUrl(location),
    },
  };
}
