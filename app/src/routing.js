import { NAV_ITEMS } from './layout/navigationItems.js';

export const APP_MODES = NAV_ITEMS.map((item) => item.id);

export function readAppMode(location = window.location) {
  let hash = location.hash || '';
  if (hash.startsWith('#')) hash = hash.slice(1);

  try {
    hash = decodeURIComponent(hash);
  } catch {}

  hash = hash.split('?')[0].replace(/^\/+|\/+$/g, '').toLocaleLowerCase('pt-BR');
  if (!hash) return 'pacientes';
  if (hash.startsWith('sign-')) return hash;
  return APP_MODES.includes(hash) ? hash : 'pacientes';
}

export function writeAppMode(mode, { location = window.location, history = window.history } = {}) {
  if (!APP_MODES.includes(mode) && !mode.startsWith('sign-')) return null;
  const nextHash = `#${mode}`;
  if (location.hash !== nextHash) history.pushState(null, '', nextHash);
  return mode;
}
