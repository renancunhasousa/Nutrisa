import React, { useState } from 'react';
import { Copy, Check, MessageCircle, Sparkles } from 'lucide-react';

export function CaptionBox({
  caption,
  onChangeCaption,
  onGenerateCaption,
  isGeneratingCaption = false
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!caption) return;
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Erro ao copiar legenda:', err);
    }
  };

  return (
    <div className="bg-slate-50 rounded-3xl border border-slate-200/90 p-5 space-y-4 shadow-xs transition-all flex flex-col flex-1 min-h-0">
      {/* CABEÇALHO: TÍTULO E SUBTÍTULO */}
      <div className="space-y-1 pb-3 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2">
          {/* ÍCONE SEM FUNDO */}
          <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
            Legenda do Instagram
          </h4>
        </div>
        <p className="text-[11px] text-slate-500 leading-snug">
          Copy persuasivo com gancho de retenção, embasamento clínico e CTA para consulta.
        </p>
      </div>

      {/* BOTÕES DE AÇÃO: LINHA DEDICADA PARA NÃO ENCAVALAR */}
      <div className="flex items-center gap-2 pt-0.5 flex-wrap shrink-0">
        {onGenerateCaption && (
          <button
            type="button"
            onClick={onGenerateCaption}
            disabled={isGeneratingCaption}
            className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
            title="Gerar legenda com IA baseada nas lâminas do post"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGeneratingCaption ? 'animate-spin' : ''}`} />
            <span>{isGeneratingCaption ? 'Escrevendo...' : 'Gerar com IA'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleCopy}
          className={`flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
            copied
              ? 'bg-emerald-600 text-white border border-emerald-700'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300'
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
          <span>{copied ? 'Copiado!' : 'Copiar Legenda'}</span>
        </button>
      </div>

      {/* ÁREA DE TEXTO DA LEGENDA EXPANDIDA ATÉ A BASE */}
      <textarea
        value={caption}
        onChange={(e) => onChangeCaption?.(e.target.value)}
        className="w-full flex-1 min-h-[380px] text-xs font-normal text-slate-700 bg-white rounded-xl p-3.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-y leading-relaxed font-sans shadow-2xs"
        placeholder="A legenda estruturada pela IA aparecerá aqui..."
      />

      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 shrink-0">
        <span>{(caption || '').length} caracteres</span>
        <span>Hashtags estratégicas &amp; CTA inclusos</span>
      </div>
    </div>
  );
}
