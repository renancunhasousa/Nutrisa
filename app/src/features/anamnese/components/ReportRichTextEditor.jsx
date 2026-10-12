import { useEffect, useRef } from 'react';
import { AlignCenter, AlignLeft, AlignRight, Bold, Eraser, Italic, List, ListOrdered, Redo2, Underline, Undo2 } from 'lucide-react';
import { cleanMarkdownToHTML } from '../domain/formatting.js';

const TOOLS = [
  { command: 'bold', label: 'Negrito', icon: Bold },
  { command: 'italic', label: 'Itálico', icon: Italic },
  { command: 'underline', label: 'Sublinhado', icon: Underline },
  { command: 'insertUnorderedList', label: 'Lista com marcadores', icon: List },
  { command: 'insertOrderedList', label: 'Lista numerada', icon: ListOrdered },
  { command: 'justifyLeft', label: 'Alinhar à esquerda', icon: AlignLeft },
  { command: 'justifyCenter', label: 'Centralizar', icon: AlignCenter },
  { command: 'justifyRight', label: 'Alinhar à direita', icon: AlignRight },
  { command: 'undo', label: 'Desfazer', icon: Undo2 },
  { command: 'redo', label: 'Refazer', icon: Redo2 },
  { command: 'removeFormat', label: 'Limpar formatação', icon: Eraser },
];

const isHtml = (value) => /<\/?(?:div|p|br|strong|b|em|i|u|s|ul|ol|li|h[1-3]|blockquote)\b/i.test(value || '');

export default function ReportRichTextEditor({ value, onChange }) {
  const editorRef = useRef(null);
  const lastEmittedValueRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current || value === lastEmittedValueRef.current) return;
    const nextHtml = isHtml(value) ? value : cleanMarkdownToHTML(value || '');
    editorRef.current.innerHTML = nextHtml;
    lastEmittedValueRef.current = nextHtml;
    if (nextHtml !== value) onChange(nextHtml);
  }, [onChange, value]);

  const runCommand = (command, argument = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, argument);
    const nextHtml = editorRef.current?.innerHTML || '';
    lastEmittedValueRef.current = nextHtml;
    onChange(nextHtml);
  };

  return (
    <div className="bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-3 py-2" role="toolbar" aria-label="Formatação do relatório">
        <select defaultValue="p" onChange={(event) => runCommand('formatBlock', event.target.value)} className="mr-1 h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-bold text-slate-700 outline-none focus:border-emerald-500" aria-label="Estilo do parágrafo">
          <option value="p">Texto normal</option>
          <option value="h2">Título</option>
          <option value="h3">Subtítulo</option>
          <option value="blockquote">Citação</option>
        </select>
        {TOOLS.map(({ command, label, icon: Icon }, index) => (
          <span key={command} className="contents">
            {(index === 3 || index === 5 || index === 8) ? <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" /> : null}
            <button type="button" onMouseDown={(event) => { event.preventDefault(); runCommand(command); }} className="inline-flex size-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-white hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-600" aria-label={label} title={label}>
              <Icon className="size-3.5" aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Editor do relatório de anamnese"
        onInput={(event) => { lastEmittedValueRef.current = event.currentTarget.innerHTML; onChange(event.currentTarget.innerHTML); }}
        className="min-h-[420px] p-8 font-sans text-sm leading-relaxed text-slate-800 outline-none focus:bg-emerald-50/10 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-300 [&_blockquote]:pl-4 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-black [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-extrabold [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-6"
      />
    </div>
  );
}
