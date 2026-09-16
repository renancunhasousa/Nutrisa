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
  return text
    .replace(/\*\*([\s\S]*?)\*\*/g, '$1')
    .replace(/\*([\s\S]*?)\*/g, '$1');
}

/**
 * Converte o texto do template (com Markdown e {{ VAR }}) em HTML rico
 * com pílulas visuais para as variáveis, para exibição no editor contentEditable.
 */
export function formatTemplateToHTML(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\{\{\s*([\wÀ-ÿ0-9_\-\s]+)\s*\}\}/g, (_match, varName) => {
      const name = varName.trim();
      return `<span contenteditable="false" data-var="${name}" class="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-xs px-2 py-0.5 rounded-md font-bold mx-1 shadow-sm select-none">⚡ {{ ${name} }}</span>`;
    })
    .replace(/\n/g, '<br>');
}

/**
 * Converte o innerHTML do editor contentEditable de volta para string
 * de template com tags {{ VAR }}, Markdown e quebras de linha.
 */
export function syncHTMLToTemplate(html) {
  let result = html;
  // Spans de variáveis → {{ NOME }}
  result = result.replace(/<span[^>]*data-var="([^"]+)"[^>]*>[\s\S]*?<\/span>/gi, '{{ $1 }}');
  // <li> → bullet
  result = result.replace(/<li[^>]*>(.*?)<\/li>/gi, '\n• $1');
  // <strong>/<b> → **texto**
  result = result.replace(/<(?:strong|b)[^>]*>(.*?)<\/(?:strong|b)>/gi, '**$1**');
  // <em>/<i> → *texto*
  result = result.replace(/<(?:em|i)[^>]*>(.*?)<\/(?:em|i)>/gi, '*$1*');
  // <br> e <div> → quebras de linha
  result = result.replace(/<br\s*\/?>/gi, '\n');
  result = result.replace(/<div><br\s*\/?><\/div>/gi, '\n');
  result = result.replace(/<div>(.*?)<\/div>/gi, '\n$1');

  // Extrai texto limpo preservando quebras de linha
  const tmp = document.createElement('textarea');
  tmp.innerHTML = result;
  return tmp.value
    .replace(/<[^>]+>/g, '')
    .replace(/\n\s*\n\s*\n/g, '\n\n');
}
