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

export const ANAMNESE_VARIABLES = [
  { id: 'NOME', label: 'Nome do Paciente', example: 'Ex: Mariana Santos Silva', group: 'paciente' },
  { id: 'IDADE', label: 'Idade', example: 'Ex: 34 anos', group: 'paciente' },
  { id: 'OBJETIVO', label: 'Objetivo Principal', example: 'Ex: Emagrecimento saudável e disposição', group: 'objetivo' },
  { id: 'ROTINA', label: 'Rotina e Atividades', example: 'Ex: Trabalho sedentário 8h/dia, treinos', group: 'rotina' },
  { id: 'ALIMENTACAO', label: 'Hábitos e Recordatório', example: 'Ex: Pula café, almoça fora, doces à tarde', group: 'alimentacao' },
  { id: 'INGESTAO_HIDRICA', label: 'Ingestão Hídrica', example: 'Ex: Cerca de 1.5L a 2L de água por dia', group: 'habitos' },
  { id: 'INTESTINO', label: 'Saúde Intestinal', example: 'Ex: Regular (1x/dia, Bristol 3-4)', group: 'habitos' },
  { id: 'SINTOMAS', label: 'Sintomas e Queixas', example: 'Ex: Fadiga vespertina, refluxo, ansiedade', group: 'clinico' },
  { id: 'HISTORICO_FAMILIAR', label: 'Histórico Familiar', example: 'Ex: Histórico de DM2 e hipertensão na família', group: 'clinico' },
  { id: 'SUPLEMENTACAO', label: 'Suplementação', example: 'Ex: Creatina 5g/dia, Magnésio Inositol', group: 'conduta' },
  { id: 'AVALIACAO_CLINICA', label: 'Parecer da Nutricionista', example: 'Ex: Conduta nutricional, metas e fracionamento', group: 'conduta' },
];

export function getAnamneseVariableBadgeHTML(variableName) {
  const cleanName = String(variableName || '').trim().toUpperCase();
  return `<span contenteditable="false" data-var="${cleanName}" class="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-xs px-2.5 py-0.5 rounded-full font-bold mx-1 shadow-2xs select-none align-middle">⚡ {{ ${cleanName} }}</span>&nbsp;`;
}

