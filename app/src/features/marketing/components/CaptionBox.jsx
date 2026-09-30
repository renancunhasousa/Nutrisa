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
    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 p-5 shadow-xs transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-50 border border-teal-200/60 text-teal-700">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              Legenda do Instagram
            </h4>
            <p className="text-[11px] text-slate-500">
              Copy persuasivo com gancho, fundamentação clínica e chamada para agendamento.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onGenerateCaption && (
            <button
              type="button"
              onClick={onGenerateCaption}
              disabled={isGeneratingCaption}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
              title="Gerar legenda com IA com base no conteúdo e contexto de todos os posts/slides atuais"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGeneratingCaption ? 'animate-spin' : ''}`} />
              <span>{isGeneratingCaption ? 'Escrevendo...' : 'Gerar com IA'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              copied
                ? 'bg-emerald-600 text-white border border-emerald-700'
                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            {copied ? 'Copiado!' : 'Copiar Legenda'}
          </button>
        </div>
      </div>

      <textarea
        value={caption}
        onChange={(e) => onChangeCaption?.(e.target.value)}
        rows={6}
        className="w-full text-xs font-normal text-slate-700 bg-slate-50/70 rounded-xl p-3 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all resize-y leading-relaxed font-sans"
        placeholder="A legenda sugerida pela IA aparecerá aqui..."
      />

      <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
        <span>{(caption || '').length} caracteres</span>
        <span>Inclui hashtags estratégicas & CTA de consulta</span>
      </div>
    </div>
  );
}
