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

/**
 * Normaliza uma string JSON corrigindo quebras de linha literais (CR/LF)
 * e caracteres de controle inválidos dentro de strings delimitadas por aspas duplas,
 * além de remover trailing commas.
 *
 * @param {string} raw
 * @returns {string}
 */
export function normalizeJsonString(raw) {
  if (!raw) return '';
  let inString = false;
  let escaped = false;
  let result = '';

  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];

    if (inString) {
      if (escaped) {
        result += char;
        escaped = false;
      } else if (char === '\\') {
        result += char;
        escaped = true;
      } else if (char === '"') {
        result += char;
        inString = false;
      } else if (char === '\n') {
        result += '\\n';
      } else if (char === '\r') {
        result += '\\r';
      } else if (char === '\t') {
        result += '\\t';
      } else {
        const code = char.charCodeAt(0);
        if (code < 32) {
          result += `\\u${code.toString(16).padStart(4, '0')}`;
        } else {
          result += char;
        }
      }
    } else {
      if (char === '"') {
        inString = true;
      }
      result += char;
    }
  }

  // Remove trailing commas antes de fechamento de objeto ou array
  return result.replace(/,\s*([}\]])/g, '$1');
}

/**
 * Tenta fechar estruturas JSON que foram truncadas por limite de tokens.
 *
 * @param {string} str
 * @param {boolean} isObject
 * @returns {string}
 */
export function closeTruncatedJson(str, isObject = true) {
  let cleaned = (str || '').trim();
  if (!cleaned) return isObject ? '{}' : '[]';

  if (cleaned.endsWith('\\')) {
    cleaned = cleaned.slice(0, -1);
  }

  let inString = false;
  let escaped = false;
  const stack = [];

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
    } else {
      if (char === '"') {
        inString = true;
      } else if (char === '{' || char === '[') {
        stack.push(char);
      } else if (char === '}' && stack[stack.length - 1] === '{') {
        stack.pop();
      } else if (char === ']' && stack[stack.length - 1] === '[') {
        stack.pop();
      }
    }
  }

  if (inString) {
    cleaned += '"';
  }

  cleaned = cleaned.replace(/,\s*$/, '');

  while (stack.length > 0) {
    const open = stack.pop();
    cleaned += open === '{' ? '}' : ']';
  }

  if (stack.length === 0 && !cleaned.endsWith('}') && !cleaned.endsWith(']')) {
    cleaned += isObject ? '}' : ']';
  }

  return cleaned;
}

/**
 * Extrai pares chave-valor de forma resiliente usando expressões regulares.
 *
 * @param {string} text
 * @returns {Record<string, string>}
 */
export function extractKeyValuePairs(text) {
  if (!text) return {};
  const result = {};

  const regex = /"([^"\\]+)"\s*:\s*"((?:[^"\\]|\\.)*)"/gs;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const key = match[1].trim();
    let val = match[2];
    try {
      val = JSON.parse(`"${val}"`);
    } catch {
      val = val.replace(/\\n/g, '\n').replace(/\\"/g, '"');
    }
    result[key] = val;
  }

  if (Object.keys(result).length === 0) {
    const looseRegex = /"([^"]+)"\s*:\s*([^,}\n]+)/g;
    while ((match = looseRegex.exec(text)) !== null) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, '');
      result[key] = val;
    }
  }

  return result;
}

/**
 * Faz parse inteligente e tolerante a falhas de saídas JSON geradas por IA.
 * Trata blocos de markdown, quebras de linha literais dentro de strings,
 * caracteres de controle e truncamentos de token.
 *
 * @param {string} text
 * @returns {any}
 */
export function parseAiJson(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Resposta de IA vazia ou inválida.');
  }

  let cleaned = sanitizeJsonString(text);

  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIdx = -1;
  let isObject = true;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    isObject = true;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    isObject = false;
  }

  if (startIdx !== -1) {
    const endChar = isObject ? '}' : ']';
    const lastIdx = cleaned.lastIndexOf(endChar);
    if (lastIdx > startIdx) {
      cleaned = cleaned.substring(startIdx, lastIdx + 1);
    } else {
      cleaned = cleaned.substring(startIdx);
    }
  }

  try {
    return JSON.parse(cleaned);
  } catch (initialErr) {
    const repaired = normalizeJsonString(cleaned);
    try {
      return JSON.parse(repaired);
    } catch {
      try {
        const closed = closeTruncatedJson(repaired, isObject);
        return JSON.parse(closed);
      } catch {
        const extracted = extractKeyValuePairs(text);
        if (extracted && Object.keys(extracted).length > 0) {
          return extracted;
        }
        throw initialErr;
      }
    }
  }
}


export const cleanPhoneNumber = (phoneInput) => {
  if (!phoneInput) return '';
  // Remove @s.whatsapp.net, @c.us, @g.us, etc.
  let cleaned = String(phoneInput).replace(/@.*$/, '').trim();
  // Se for apenas números, remove caracteres inválidos
  return cleaned;
};
