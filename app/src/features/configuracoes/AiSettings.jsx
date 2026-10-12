import { useEffect, useRef } from 'react';
import { Bot, RefreshCw, ServerCog, ShieldCheck, X } from 'lucide-react';

const handleBackdropClick = (event) => {
  if (event.target !== event.currentTarget) return;
  if ('closedBy' in HTMLDialogElement.prototype) return;

  const rect = event.currentTarget.getBoundingClientRect();
  const clickedInside = (
    event.clientX >= rect.left
    && event.clientX <= rect.right
    && event.clientY >= rect.top
    && event.clientY <= rect.bottom
  );

  if (!clickedInside) event.currentTarget.close();
};

const statusConfig = {
  online: { label: 'Online', dotClass: 'bg-emerald-500 animate-pulse', textClass: 'text-emerald-700' },
  configured: { label: 'Chave ativa', dotClass: 'bg-emerald-500', textClass: 'text-emerald-700' },
  testing: { label: 'Testando...', dotClass: 'bg-amber-500 animate-pulse', textClass: 'text-amber-700' },
  error: { label: 'Erro ou cota', dotClass: 'bg-rose-500', textClass: 'text-rose-700' },
  missing: { label: 'Sem chave', dotClass: 'bg-slate-400', textClass: 'text-slate-500' },
};

export default function AiSettings({ settings }) {
  const {
    availableModels,
    aiAccessToken,
    updateAiAccessToken,
    activeModal,
    setActiveModal,
    selectedModel,
    setSelectedModel,
    geminiStatus,
    aiProviders = { gemini: false, openai: false, deepseek: false },
    liveProviderStatus = null,
    apiTestDetails,
    testApiConnection,
  } = settings;
  const dialogRef = useRef(null);
  const isOpen = activeModal === 'ai';
  const currentStatus = statusConfig[geminiStatus] || statusConfig.missing;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  const closeDialog = () => dialogRef.current?.close();

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby="ai-settings-title"
      className="settings-dialog print:hidden"
      style={{ width: 'min(62rem, calc(100% - 2rem))' }}
      onClick={handleBackdropClick}
      onClose={() => setActiveModal(null)}
    >
      <div className="settings-dialog__panel">
        <header className="app-modal-header flex items-start justify-between gap-4 px-6 py-5 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-sm">
              <Bot className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="ai-settings-title" className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">
                Inteligência Artificial
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">
                Configure o acesso, selecione o modelo e monitore a redundância em tempo real.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeDialog}
            className="flex size-10 shrink-0 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fechar configurações de inteligência artificial"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="settings-dialog__body app-modal-body px-6 py-6 sm:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-start">
            {/* Coluna 1: Configuração do Cliente */}
            <div className="space-y-5">
              <div>
                <label htmlFor="ai-access" className="mb-1.5 block text-xs font-bold text-slate-700">
                  Código de acesso da clínica
                </label>
                <input
                  id="ai-access"
                  type="password"
                  autoComplete="off"
                  value={aiAccessToken}
                  onChange={(event) => updateAiAccessToken(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white/85 px-3.5 text-sm font-medium text-slate-800 outline-none transition hover:border-slate-300 focus:border-amber-400 focus:ring-4 focus:ring-amber-100/70"
                />
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                  O código fica armazenado com segurança apenas neste navegador.
                </p>
              </div>

              <div>
                <label htmlFor="ai-model" className="mb-1.5 block text-xs font-bold text-slate-700">
                  Modelo ativo preferencial
                </label>
                <select
                  id="ai-model"
                  value={selectedModel}
                  onChange={(event) => setSelectedModel(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white/85 px-3.5 text-sm font-semibold text-slate-800 outline-none transition hover:border-slate-300 focus:border-amber-400 focus:ring-4 focus:ring-amber-100/70"
                >
                  {availableModels.map((model) => <option key={model} value={model}>{model}</option>)}
                </select>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                  Modelo prioritário de leitura, transcrição e raciocínio clínico.
                </p>
              </div>

              {/* Card informativo de proteção */}
              <div className="rounded-2xl border border-amber-200/60 bg-amber-50/50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <ShieldCheck className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-800">Tolerância a Falhas Ativa</h4>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                      Caso o modelo principal sofra oscilações ou esgote cotas, o sistema redireciona automaticamente para o GPT-4o-mini e DeepSeek Flash sem interromper o atendimento da consulta.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna 2: Diagnóstico e Monitoramento */}
            <section className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5 space-y-4" aria-labelledby="provider-diagnostics-title">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 id="provider-diagnostics-title" className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-slate-700">
                    <ServerCog className="size-4 text-amber-600" /> Diagnóstico do Servidor
                  </h3>
                  <p className="mt-0.5 text-[10px] text-slate-500">Integração e disponibilidade</p>
                </div>
                <span className={`shrink-0 flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[10px] font-bold shadow-2xs ring-1 border border-slate-200/70 ${currentStatus.textClass}`}>
                  <span className={`size-2 rounded-full ${currentStatus.dotClass}`} />
                  {currentStatus.label}
                </span>
              </div>

              {/* Card Cadeia de Fallback */}
              <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Cadeia de Resiliência
                  </span>
                  <span className="text-[10px] text-slate-400">Ordem de execução</span>
                </div>
                
                <div className="space-y-2">
                  {/* 1º Gemini */}
                  <div className="flex items-center justify-between gap-2.5 rounded-lg bg-slate-50/90 px-3 py-2 border border-slate-100">
                    <div className="min-w-0 flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800">1º Gemini</span>
                      <span className="text-[10px] text-slate-400">(Titular)</span>
                    </div>
                    <div className="shrink-0">
                      {liveProviderStatus?.gemini ? (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${liveProviderStatus.gemini.online ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          <span className={`size-1.5 rounded-full ${liveProviderStatus.gemini.online ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          {liveProviderStatus.gemini.online ? `Online (${liveProviderStatus.gemini.latencyMs}ms)` : (liveProviderStatus.gemini.error || 'Falha')}
                        </span>
                      ) : (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${aiProviders.gemini ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                          {aiProviders.gemini ? 'Chave ativa' : 'Pendente'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 2º GPT-4o-mini */}
                  <div className="flex items-center justify-between gap-2.5 rounded-lg bg-slate-50/90 px-3 py-2 border border-slate-100">
                    <div className="min-w-0 flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800">2º GPT-4o-mini</span>
                      <span className="text-[10px] text-slate-400">(1º Fallback)</span>
                    </div>
                    <div className="shrink-0">
                      {liveProviderStatus?.openai ? (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${liveProviderStatus.openai.online ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          <span className={`size-1.5 rounded-full ${liveProviderStatus.openai.online ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          {liveProviderStatus.openai.online ? `Online (${liveProviderStatus.openai.latencyMs}ms)` : (liveProviderStatus.openai.error || 'Falha')}
                        </span>
                      ) : (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${aiProviders.openai ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                          {aiProviders.openai ? 'Chave ativa' : 'Opcional'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 3º DeepSeek */}
                  <div className="flex items-center justify-between gap-2.5 rounded-lg bg-slate-50/90 px-3 py-2 border border-slate-100">
                    <div className="min-w-0 flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800">3º DeepSeek Flash</span>
                      <span className="text-[10px] text-slate-400">(2º Fallback)</span>
                    </div>
                    <div className="shrink-0">
                      {liveProviderStatus?.deepseek ? (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${liveProviderStatus.deepseek.online ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          <span className={`size-1.5 rounded-full ${liveProviderStatus.deepseek.online ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          {liveProviderStatus.deepseek.online ? `Online (${liveProviderStatus.deepseek.latencyMs}ms)` : (liveProviderStatus.deepseek.error || 'Falha')}
                        </span>
                      ) : (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${aiProviders.deepseek ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                          {aiProviders.deepseek ? 'Chave ativa' : 'Opcional'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalhes do teste */}
              {apiTestDetails ? (
                <p className="rounded-xl border border-amber-100 bg-amber-50/80 p-3 text-[11px] leading-relaxed text-amber-900">
                  {apiTestDetails}
                </p>
              ) : null}

              {/* Botão de teste */}
              <button
                type="button"
                onClick={() => testApiConnection(true)}
                disabled={geminiStatus === 'testing'}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 hover:shadow disabled:cursor-wait disabled:opacity-60"
              >
                <RefreshCw className={`size-3.5 ${geminiStatus === 'testing' ? 'animate-spin' : ''}`} />
                {geminiStatus === 'testing' ? 'Testando as 3 IAs ao vivo...' : 'Testar conexão'}
              </button>
            </section>
          </div>
        </div>

        <footer className="app-modal-footer flex items-center justify-end gap-3 px-6 py-4 sm:px-8">
          <button
            type="button"
            onClick={closeDialog}
            className="min-h-11 rounded-xl bg-amber-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-amber-700 active:scale-[0.98]"
          >
            Concluir
          </button>
        </footer>
      </div>
    </dialog>
  );
}
