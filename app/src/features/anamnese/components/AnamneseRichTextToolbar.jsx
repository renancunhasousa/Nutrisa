import React from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo2,
  Redo2,
  Eraser,
} from 'lucide-react';
import { getAnamneseVariableBadgeHTML } from '../domain/variables';

const TOOLS = [
  { command: 'bold', label: 'Negrito (Ctrl+B)', icon: Bold, group: 'style' },
  { command: 'italic', label: 'Itálico (Ctrl+I)', icon: Italic, group: 'style' },
  { command: 'underline', label: 'Sublinhado (Ctrl+U)', icon: Underline, group: 'style' },
  { command: 'insertUnorderedList', label: 'Lista com marcadores (Bullets)', icon: List, group: 'list' },
  { command: 'insertOrderedList', label: 'Lista numerada', icon: ListOrdered, group: 'list' },
  { command: 'justifyLeft', label: 'Alinhar à esquerda', icon: AlignLeft, group: 'align' },
  { command: 'justifyCenter', label: 'Centralizar', icon: AlignCenter, group: 'align' },
  { command: 'justifyRight', label: 'Alinhar à direita', icon: AlignRight, group: 'align' },
  { command: 'justifyFull', label: 'Justificar texto', icon: AlignJustify, group: 'align' },
  { command: 'undo', label: 'Desfazer (Ctrl+Z)', icon: Undo2, group: 'history' },
  { command: 'redo', label: 'Refazer (Ctrl+Y)', icon: Redo2, group: 'history' },
  { command: 'removeFormat', label: 'Limpar formatação', icon: Eraser, group: 'cleanup' },
];

export function AnamneseRichTextToolbar({ editorRef, onContentChange }) {
  const runCommand = (command, argument = null) => {
    if (!editorRef?.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, argument);
    onContentChange?.();
  };

  const handleApplyVariableBadge = () => {
    if (!editorRef?.current) return;

    let varName = '';
    const selection = window.getSelection();

    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const selectedText = selection.toString().trim();
      if (selectedText) {
        varName = selectedText
          .replace(/^\{\{\s*/, '')
          .replace(/\s*\}\}$/, '')
          .replace(/^\{+/, '')
          .replace(/\}+$/, '')
          .trim();
      }
    }

    if (!varName) {
      const input = prompt('Digite o nome da variável (ex: SINTOMAS, METAS):');
      if (!input?.trim()) return;
      varName = input
        .replace(/^\{\{\s*/, '')
        .replace(/\s*\}\}$/, '')
        .trim();
    }

    if (!varName) return;

    const cleanName = varName.toUpperCase();
    const badgeHTML = getAnamneseVariableBadgeHTML(cleanName);

    editorRef.current.focus();

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        range.deleteContents();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = badgeHTML;
        const frag = document.createDocumentFragment();
        let lastNode = null;
        while (tempDiv.firstChild) {
          lastNode = tempDiv.firstChild;
          frag.appendChild(lastNode);
        }
        range.insertNode(frag);
        if (lastNode) {
          range.setStartAfter(lastNode);
          range.setEndAfter(lastNode);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        onContentChange?.();
        return;
      }
    }

    document.execCommand('insertHTML', false, badgeHTML);
    onContentChange?.();
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50/90 px-3 py-2 shrink-0 select-none"
      role="toolbar"
      aria-label="Ferramentas de formatação de texto da anamnese"
    >
      {/* Estilo do Bloco / Parágrafo */}
      <select
        defaultValue="p"
        onChange={(event) => runCommand('formatBlock', event.target.value)}
        className="mr-1 h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-700 outline-none focus:border-emerald-500 shadow-2xs transition-colors cursor-pointer"
        aria-label="Estilo do bloco"
      >
        <option value="p">Texto normal</option>
        <option value="h2">Título da Seção</option>
        <option value="h3">Subtítulo</option>
        <option value="blockquote">Citação / Destaque</option>
      </select>

      <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />

      {/* Ferramentas de Estilo, Listas, Alinhamento e Histórico */}
      {TOOLS.map(({ command, label, icon: Icon }, index) => {
        const showSeparator =
          index === 3 || // antes das listas
          index === 5 || // antes dos alinhamentos
          index === 9 || // antes do histórico
          index === 11;  // antes da limpeza

        return (
          <React.Fragment key={command}>
            {showSeparator && <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />}
            <button
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                runCommand(command);
              }}
              className="inline-flex size-8 items-center justify-center rounded-lg text-slate-600 transition-all hover:bg-white hover:text-slate-900 hover:shadow-2xs active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-600"
              aria-label={label}
              title={label}
            >
              <Icon className="size-3.5" aria-hidden="true" />
            </button>
          </React.Fragment>
        );
      })}

      <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />

      {/* Botão de Marcar ou Inserir Variável com emoji de raio */}
      <button
        type="button"
        onMouseDown={(event) => {
          event.preventDefault();
          handleApplyVariableBadge();
        }}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/80 px-2.5 text-[11px] font-bold text-emerald-800 transition-all hover:bg-emerald-100 hover:border-emerald-300 hover:text-emerald-900 active:scale-95 shadow-2xs cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-600"
        title="Transformar texto selecionado em variável ou inserir nova (ex: {{ TESTE }})"
        aria-label="Marcar como variável"
      >
        <span className="text-xs select-none" aria-hidden="true">⚡</span>
        <span>Variável</span>
      </button>
    </div>
  );
}

export default AnamneseRichTextToolbar;
