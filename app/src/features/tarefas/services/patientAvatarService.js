import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../config/env.js';

let avatarsCache = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos de cache em memória

/**
 * Normaliza nomes para comparação insensível a acentos, pontuação e espaços.
 */
export function normalizeName(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Limpa números de telefone para comparação de dígitos.
 */
export function cleanPhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  return phone.replace(/\D/g, '');
}

/**
 * Busca todas as fotos de perfil disponíveis na tabela log_conversas.
 */
export async function fetchPatientAvatars({ url = SUPABASE_URL, key = SUPABASE_ANON_KEY, force = false } = {}) {
  const now = Date.now();
  if (!force && avatarsCache && (now - cacheTimestamp < CACHE_TTL_MS)) {
    return avatarsCache;
  }

  if (!url || !key) return { byPhone: {}, byName: {}, rawList: [] };

  try {
    const res = await fetch(
      `${url}/rest/v1/log_conversas?select=nome_contato,contato_jid,foto_perfil&foto_perfil=not.is.null&foto_perfil=neq.&order=data_envio.desc&limit=500`,
      {
        headers: { apikey: key, Authorization: 'Bearer ' + key }
      }
    );

    if (!res.ok) {
      console.warn('Não foi possível carregar avatares de pacientes:', res.status);
      return avatarsCache || { byPhone: {}, byName: {}, rawList: [] };
    }

    const rows = await res.json();
    if (!Array.isArray(rows)) return { byPhone: {}, byName: {}, rawList: [] };

    const byPhone = {};
    const byName = {};
    const rawList = [];

    rows.forEach(r => {
      const photo = r.foto_perfil;
      if (!photo) return;

      // Index por telefone
      if (r.contato_jid) {
        const rawDigits = cleanPhone(r.contato_jid);
        if (rawDigits.length >= 8) {
          byPhone[rawDigits] = photo;
          // Sem o código de país 55
          if (rawDigits.startsWith('55') && rawDigits.length >= 10) {
            byPhone[rawDigits.slice(2)] = photo;
          }
        }
      }

      // Index por nome
      if (r.nome_contato) {
        const norm = normalizeName(r.nome_contato);
        if (norm && norm.length >= 2) {
          if (!byName[norm]) byName[norm] = photo;

          const tokens = norm.split(' ').filter(t => t.length > 1);
          if (tokens.length >= 2) {
            const firstLast = `${tokens[0]} ${tokens[tokens.length - 1]}`;
            if (!byName[firstLast]) byName[firstLast] = photo;

            const firstTwo = `${tokens[0]} ${tokens[1]}`;
            if (!byName[firstTwo]) byName[firstTwo] = photo;
          }

          rawList.push({ norm, tokens, photo, rawName: r.nome_contato });
        }
      }
    });

    avatarsCache = { byPhone, byName, rawList };
    cacheTimestamp = now;
    return avatarsCache;
  } catch (err) {
    console.warn('Erro ao carregar avatares de pacientes:', err);
    return avatarsCache || { byPhone: {}, byName: {}, rawList: [] };
  }
}

/**
 * Encontra a foto de perfil mais adequada para um paciente da tarefa.
 */
export function matchPatientAvatar(avatarsData, patientName, patientPhone) {
  if (!avatarsData) return null;
  const { byPhone = {}, byName = {}, rawList = [] } = avatarsData;

  // 1. Tentar por telefone
  if (patientPhone) {
    const digits = cleanPhone(patientPhone);
    if (byPhone[digits]) return byPhone[digits];
    if (digits.startsWith('55') && byPhone[digits.slice(2)]) {
      return byPhone[digits.slice(2)];
    }
  }

  // 2. Tentar por nome direto
  if (!patientName) return null;
  const norm = normalizeName(patientName);
  if (!norm) return null;

  if (byName[norm]) return byName[norm];

  const tokens = norm.split(' ').filter(t => t.length > 1);
  if (tokens.length >= 2) {
    const firstLast = `${tokens[0]} ${tokens[tokens.length - 1]}`;
    if (byName[firstLast]) return byName[firstLast];

    const firstTwo = `${tokens[0]} ${tokens[1]}`;
    if (byName[firstTwo]) return byName[firstTwo];
  }

  // 3. Busca por correspondência parcial na lista
  for (const item of rawList) {
    if (item.norm === norm) return item.photo;

    // Se todos os tokens do contato do WhatsApp estão presentes no nome do paciente
    // (ex: "Flavia Takatori" no WhatsApp casa com "Flavia Pierozzi Takatori")
    if (item.tokens.length >= 2 && item.tokens.every(t => norm.includes(t))) {
      return item.photo;
    }

    // Se todos os tokens do paciente da tarefa estão no WhatsApp
    if (tokens.length >= 2 && tokens.every(t => item.norm.includes(t))) {
      return item.photo;
    }

    // Primeiro nome e último sobrenome coincidem
    if (tokens.length >= 2 && item.tokens.length >= 2) {
      if (tokens[0] === item.tokens[0] && tokens[tokens.length - 1] === item.tokens[item.tokens.length - 1]) {
        return item.photo;
      }
    }
  }

  return null;
}
