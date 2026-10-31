/**
 * Funções de formatação de texto usadas no editor e na exibição
 * da Anamnese. Sem dependências de React.
 */

/**
 * Converte Markdown simples em HTML seguro para exibição de resultados.
 * Escapa HTML, converte **negrito**, *itálico* e quebras de linha.
 */
export function cleanMarkdownToHTML(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([\s\S]*?)\*/g, '<em>$1</em>')
    .replace(/\r\n/g, '<br>')
    .replace(/\n/g, '<br>');
}

/**
 * Remove marcações Markdown (**negrito**, *itálico*) de um texto.
 * Usado ao copiar para o clipboard no formato limpo.
 */
export function cleanMarkdownToText(text) {
  if (!text) return '';
  const cleaned = text
    .replace(/\*\*([\s\S]*?)\*\*/g, '$1')
    .replace(/\*([\s\S]*?)\*/g, '$1')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|h[1-6]|li|blockquote)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '');
  if (typeof document === 'undefined') return cleaned.replace(/⚡\s*/g, '');
  const decoder = document.createElement('textarea');
  decoder.innerHTML = cleaned;
  return decoder.value.replace(/⚡\s*/g, '').replace(/\n{3,}/g, '\n\n').trim();
}

const isHtml = (value) => /<\/?(?:div|p|br|strong|b|em|i|u|s|ul|ol|li|h[1-3]|blockquote|span)\b/i.test(value || '');

/**
 * Converte o texto do template (com HTML rico ou Markdown e {{ VAR }}) em HTML
 * com pílulas visuais para as variáveis, para exibição no editor contentEditable.
 */
export function formatTemplateToHTML(text) {
  if (!text) return '';
  let html = text;

  // Se for texto simples / markdown legado sem tags HTML estruturadas
  if (!isHtml(text)) {
    html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  // Converte tags {{ VAR }} em badges visuais (spans verdes contenteditable=false)
  return html.replace(/\{\{\s*([\wÀ-ÿ0-9_\-\s]+)\s*\}\}/g, (_match, varName) => {
    const name = varName.trim().toUpperCase();
    return `<span contenteditable="false" data-var="${name}" class="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-xs px-2.5 py-0.5 rounded-full font-bold mx-1 shadow-2xs select-none align-middle">⚡ {{ ${name} }}</span>&nbsp;`;
  });
}

/**
 * Converte o innerHTML do editor contentEditable de volta para string
 * de template preservando a formatação HTML rica e convertendo os spans
 * de variáveis de volta para tags {{ VAR }}.
 */
export function syncHTMLToTemplate(html) {
  if (!html) return '';
  return html.replace(/<span[^>]*data-var=["']?([^"']+)["']?[^>]*>[\s\S]*?<\/span>(?:&nbsp;)?/gi, (_match, varName) => {
    const cleanName = varName.trim().toUpperCase();
    return `{{ ${cleanName} }}`;
  });
}

