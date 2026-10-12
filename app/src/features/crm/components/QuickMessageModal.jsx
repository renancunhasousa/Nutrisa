import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  MessageCircle,
  Sparkles,
  X,
} from 'lucide-react';
import { buildWhatsAppUrl, getQuickTemplates } from '../domain/crmTemplates.js';

export default function QuickMessageModal({ patient, signals = [], onClose }) {
  const phone = patient?.whatsapp_phone || patient?.phone || '';
  const templates = useMemo(() => getQuickTemplates(patient, signals), [patient, signals]);

  const recommendedTemplate = useMemo(() => {
    return templates.find((t) => t.isRecommended) || templates[0];
  }, [templates]);

  const [selectedTemplateId, setSelectedTemplateId] = useState(recommendedTemplate?.id);
  const [messageText, setMessageText] = useState(recommendedTemplate?.text || '');
  const [copied, setCopied] = useState(false);

  // Fecha no ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSelectTemplate = (template) => {
    setSelectedTemplateId(template.id);
    setMessageText(template.text);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback simples caso clipboard falhe
      const input = document.createElement('textarea');
      input.value = messageText;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleOpenWhatsApp = () => {
    const url = buildWhatsAppUrl(phone, messageText);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-msg-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex flex-col w-full max-w-2xl max-h-[92vh] overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-emerald-50/70 via-white to-slate-50 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-sm font-black text-white shadow-xs">
              {patient?.full_name?.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="quick-msg-title" className="text-base font-black text-slate-900">
                  Mensagem rápida para {patient?.full_name}
                </h2>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <MessageCircle className="size-3.5 text-emerald-600" />
                {phone || 'Sem telefone registrado'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Corpo com scroll */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Modelos prontos
              </label>
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <Sparkles className="size-3 text-emerald-600" />
                Personalizado para o paciente
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {templates.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/20'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-emerald-50/50 hover:border-emerald-200'
                    }`}
                  >
                    <span>{tpl.title}</span>
                    {tpl.isRecommended ? (
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase ${
                        isSelected ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        Sugerido
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="message-text-editor" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Texto da mensagem
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                {messageText.length} caracteres
              </span>
            </div>
            <textarea
              id="message-text-editor"
              rows={5}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Digite a mensagem para o paciente..."
              className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-sm leading-relaxed text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-hidden focus:ring-3 focus:ring-emerald-500/20 transition-all"
            />
            <p className="mt-1.5 text-[11px] text-slate-400">
              Você pode editar o texto antes de enviar. O nome do paciente já foi incluído com carinho.
            </p>
          </div>
        </div>

        {/* Rodapé com ações */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 p-4 sm:p-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-h-10 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Fechar
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopy}
              className={`flex-1 sm:flex-initial inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-bold transition-all ${
                copied
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
              {copied ? 'Copiado!' : 'Copiar texto'}
            </button>

            <button
              type="button"
              onClick={handleOpenWhatsApp}
              disabled={!phone}
              className="flex-1 sm:flex-initial inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-black text-white shadow-sm hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <MessageCircle className="size-4" />
              <span>Abrir WhatsApp</span>
              <ExternalLink className="size-3.5 opacity-70" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
