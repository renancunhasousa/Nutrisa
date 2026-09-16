/**
 * Funções de detecção e extração de variáveis {{ VAR }} dos templates de anamnese.
 * Sem dependências de React ou DOM.
 */

const VAR_REGEX = /\{\{\s*[\wÀ-ÿ0-9_\-\s]+\s*\}\}/g;

/**
 * Extrai e deduplica todas as variáveis {{ VAR }} encontradas em um texto de template.
 * @param {string} text
 * @returns {string[]} Array de strings no formato "{{ NOME }}"
 */
export function extractVariables(text) {
  const matches = text.match(VAR_REGEX) || [];
  const normalized = matches.map(v => {
    const inner = v.replace(/^\{\{\s*|\s*\}\}$/g, '').trim();
    return `{{ ${inner} }}`;
  });
  return [...new Set(normalized)];
}

/**
 * Extrai os nomes brutos das variáveis de um texto de template.
 * @param {string} text
 * @returns {string[]} Array de nomes de variáveis (sem {{ }})
 */
export function extractVariableNames(text) {
  const matches = text.match(VAR_REGEX) || [];
  return [...new Set(matches.map(v => v.replace(/\{\{|\}\}/g, '').trim()))];
}

/**
 * Substitui todas as ocorrências de {{ NOME }} em um template com o valor fornecido.
 * A busca é insensível a maiúsculas/minúsculas e espaços.
 * @param {string} template
 * @param {string} name — nome da variável
 * @param {string} value — valor substituto
 * @returns {string}
 */
export function replaceVariable(template, name, value) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\{\\{\\s*${escaped}\\s*\\}\\}`, 'gi');
  return template.replace(regex, String(value ?? 'Não informado').replace(/\*\*/g, '').trim());
}
