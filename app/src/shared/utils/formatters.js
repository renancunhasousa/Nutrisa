/**
 * Funções utilitárias de formatação e sanitização de dados
 */

export { formatDateBr, formatDateTimeBr } from './dates.js';

export const formatWaitTime = (minutes) => {
  if (minutes === null || minutes === undefined || isNaN(minutes)) return '--';
  const num = Math.round(Number(minutes));
  if (num < 60) return `${num}m`;
  const hrs = Math.floor(num / 60);
  const mins = num % 60;
  return `${hrs}h ${mins}m`;
};

export const sanitizeJsonString = (text) => {
  if (!text) return '';
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
};

export const cleanPhoneNumber = (phoneInput) => {
  if (!phoneInput) return '';
  // Remove @s.whatsapp.net, @c.us, @g.us, etc.
  let cleaned = String(phoneInput).replace(/@.*$/, '').trim();
  // Se for apenas números, remove caracteres inválidos
  return cleaned;
};
