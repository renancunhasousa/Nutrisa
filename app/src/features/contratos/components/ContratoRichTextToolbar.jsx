import React, { useState, useRef, useEffect } from 'react';
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
  ChevronDown,
} from 'lucide-react';
import { CONTRACT_VARIABLES, getContractVariableBadgeHTML } from '../domain/contractVariables';

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

export function ContratoRichTextToolbar({ editorRef, onContentChange, onInsertVariable }) {
  const [isVariablesMenuOpen, setIsVariablesMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isVariablesMenuOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsVariablesMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsVariablesMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVariablesMenuOpen]);

  const runCommand = (command, argument = null) => {
    if (!editorRef?.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, argument);
    onContentChange?.();
  };

  const handleSelectVariable = (variableName) => {
    if (!editorRef?.current) {
      onInsertVariable?.(variableName);
      setIsVariablesMenuOpen(false);
      return;
    }

    editorRef.current.focus();
    const badgeHTML = getContractVariableBadgeHTML(variableName);

    const selection = window.getSelection();
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
        setIsVariablesMenuOpen(false);
        return;
      }
    }

    if (onInsertVariable) {
      onInsertVariable(variableName);
    } else {
      document.execCommand('insertHTML', false, badgeHTML);
      onContentChange?.();
    }
    setIsVariablesMenuOpen(false);
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50/90 px-3 py-2 shrink-0 select-none"
      role="toolbar"
      aria-label="Ferramentas de formatação de texto do contrato"
    >
      {/* Estilo do Bloco / Parágrafo */}
      <select
        defaultValue="p"
        onChange={(event) => runCommand('formatBlock', event.target.value)}
        className="mr-1 h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-700 outline-none focus:border-emerald-500 shadow-2xs transition-colors cursor-pointer"
        aria-label="Estilo do bloco"
      >
        <option value="p">Texto normal</option>
        <option value="h2">Título da Cláusula</option>
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

      <span className="mx-1.5 h-5 w-px bg-slate-200" aria-hidden="true" />

      {/* Botão de Variável com emoji de raio e lista suspensa baseada na Etapa 1 */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsVariablesMenuOpen(!isVariablesMenuOpen)}
          className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-bold transition-all active:scale-95 shadow-2xs cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-600 ${
            isVariablesMenuOpen
              ? 'bg-emerald-100 text-emerald-900 border-emerald-300 ring-2 ring-emerald-500/20'
              : 'border-emerald-200 bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300 hover:text-emerald-900'
          }`}
          title="Inserir campos dinâmicos preenchidos com os dados base do contrato (Etapa 1)"
          aria-expanded={isVariablesMenuOpen}
          aria-haspopup="true"
        >
          <span className="text-xs select-none" aria-hidden="true">⚡</span>
          <span>Variável</span>
          <ChevronDown
            className={`size-3 text-emerald-700 transition-transform duration-200 ${
              isVariablesMenuOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isVariablesMenuOpen && (
          <div
            className="absolute left-0 sm:right-0 sm:left-auto mt-1.5 w-72 max-h-80 overflow-y-auto app-solid-dropdown !bg-white bg-[#ffffff] rounded-2xl shadow-xl border border-slate-200/90 p-2 z-50 animate-scale-up space-y-1"
            style={{ backgroundColor: '#ffffff', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
          >
            <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Campos da Etapa 1 (Dados Base)
            </div>
            {CONTRACT_VARIABLES.map((item) => (
              <button
                key={item.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectVariable(item.id);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs flex flex-col transition-colors cursor-pointer hover:bg-emerald-50 group"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-slate-800 group-hover:text-emerald-900">{item.label}</span>
                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0">
                    ⚡ {item.id}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5">{item.example}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ContratoRichTextToolbar;
