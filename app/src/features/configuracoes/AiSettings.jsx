import { useEffect, useRef, useState } from 'react';
import {
  Bot,
  RefreshCw,
  ServerCog,
  ShieldCheck,
  X,
  MessageSquare,
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Unlink,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../auth/useAuth.js';
import { getDefaultWhatsAppInstanceName, isDraIsabelaOrganization } from './defaultProfile.js';
import {
  getWhatsAppConnectionStatus,
  requestWhatsAppQrCode,
  disconnectWhatsAppInstance,
} from './services/whatsappAutomationService.js';

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
    availableModels = [],
    aiAccessToken = '',
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
    nutritionist,
    saveProfile,
  } = settings;

  const { organizationId, user } = useAuth();
  const dialogRef = useRef(null);
  const isOpen = activeModal === 'ai';
  const currentStatus = statusConfig[geminiStatus] || statusConfig.missing;

  // Abas do Modal: 'ia' ou 'whatsapp'
  const [activeTab, setActiveTab] = useState('ia');

  // Estados de WhatsApp & QR Code
  const [loadingQr, setLoadingQr] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [qrCountdown, setQrCountdown] = useState(60);
  const [whatsappStatus, setWhatsappStatus] = useState({
    connected: false,
    status: 'close',
    instanceName: 'IsaNutri',
    phone: '',
    isDraIsabela: false,
  });

  const [connectSuccess, setConnectSuccess] = useState(false);
  const isDra = isDraIsabelaOrganization(organizationId);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  // Sincroniza status do WhatsApp ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      getWhatsAppConnectionStatus(organizationId, nutritionist).then((res) => {
        setWhatsappStatus(res);
      });
    }
  }, [isOpen, organizationId, nutritionist]);

  // Polling automático para detectar quando o QR Code foi escaneado no celular
  useEffect(() => {
    if (!qrCodeData || whatsappStatus.connected) return;

    let mounted = true;
    const fallbackInst = nutritionist?.whatsappInstanceName || getDefaultWhatsAppInstanceName(organizationId);
    const pollInterval = setInterval(async () => {
      try {
        const statusRes = await getWhatsAppConnectionStatus(organizationId, {
          ...nutritionist,
          whatsappInstanceName: nutritionist?.whatsappInstanceName || whatsappStatus.instanceName || fallbackInst,
        });

        if (!mounted) return;

        if (statusRes.connected || statusRes.status === 'open') {
          setWhatsappStatus(statusRes);
          setQrCodeData(null);
          setConnectSuccess(true);
          if (typeof saveProfile === 'function') {
            saveProfile({
              ...nutritionist,
              whatsappInstanceName: statusRes.instanceName || fallbackInst,
              whatsappPhone: statusRes.phone || nutritionist?.whatsappPhone || '',
            });
          }
          setTimeout(() => setConnectSuccess(false), 6000);
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.warn('Erro ao verificar status do WhatsApp:', err);
      }
    }, 2500);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
    };
  }, [qrCodeData, whatsappStatus.connected, organizationId, nutritionist, isDra]);

  // Temporizador de expiração do QR Code
  useEffect(() => {
    if (!qrCodeData) return;
    setQrCountdown(60);
    const timer = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [qrCodeData]);

  const closeDialog = () => dialogRef.current?.close();

  const handleGenerateQr = async () => {
    setLoadingQr(true);
    setQrCodeData(null);
    const fallbackInst = nutritionist?.whatsappInstanceName || getDefaultWhatsAppInstanceName(organizationId);
    try {
      const res = await requestWhatsAppQrCode({
        organizationId,
        clinicName: nutritionist?.clinic || nutritionist?.name,
        instanceName: nutritionist?.whatsappInstanceName || whatsappStatus.instanceName || fallbackInst,
        webhookUrl: nutritionist?.whatsappWebhookUrl || '',
      });

      if (res?.connected || res?.status === 'open') {
        setWhatsappStatus((prev) => ({
          ...prev,
          connected: true,
          status: 'open',
          instanceName: res.instanceName || prev.instanceName || fallbackInst,
          phone: prev.phone || nutritionist?.whatsappPhone || '',
        }));
        setQrCodeData(null);
        return;
      }

      if (res?.base64) {
        setWhatsappStatus((prev) => ({
          ...prev,
          connected: false,
          status: 'qrcode_ready',
          instanceName: res.instanceName || prev.instanceName || fallbackInst,
        }));
        setQrCodeData(res);
        if (typeof saveProfile === 'function' && res.instanceName && res.instanceName !== nutritionist?.whatsappInstanceName) {
          saveProfile({
            ...nutritionist,
            whatsappInstanceName: res.instanceName,
          });
        }
      } else if (res?.error) {
        alert(res.message || 'Falha ao conectar à VPS. Tente novamente.');
      } else {
        setQrCodeData(res);
      }
    } catch (err) {
      console.warn('Erro ao requisitar QR code:', err);
    } finally {
      setLoadingQr(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Deseja realmente desconectar o WhatsApp desta clínica?')) return;
    try {
      await disconnectWhatsAppInstance({
        organizationId,
        currentProfile: nutritionist,
        userId: user?.id,
        webhookUrl: nutritionist?.whatsappWebhookUrl || '',
      });
      setWhatsappStatus((prev) => ({ ...prev, connected: false, phone: '', status: 'close' }));
      setQrCodeData(null);
    } catch (err) {
      alert('Falha ao desconectar instância: ' + err.message);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby="ai-settings-title"
      className="settings-dialog print:hidden"
      style={{ width: 'min(64rem, calc(100% - 2rem))' }}
      onClick={handleBackdropClick}
      onClose={() => setActiveModal(null)}
    >
      <div className="settings-dialog__panel flex flex-col h-[min(720px,calc(100dvh-2.5rem))] max-h-[92vh]">
        {/* Cabeçalho do Modal com Abas */}
        <header
          className="app-modal-header shrink-0 border-b px-6 py-5 sm:px-8"
          style={{
            background: 'linear-gradient(90deg, #fef3c7 0%, #fff7ed 25%, #ffffff 55%, #ffffff 100%)',
            borderBottomColor: 'rgba(253, 230, 138, 0.7)',
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-md"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                }}
              >
                {activeTab === 'ia' ? (
                  <Bot className="size-5 text-white stroke-[2.2]" aria-hidden="true" />
                ) : (
                  <MessageSquare className="size-5 text-white stroke-[2.2]" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0">
                <h2 id="ai-settings-title" className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">
                  Automações & Inteligência Artificial
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Gerencie os modelos clínicos de IA e a conexão do WhatsApp com a VPS Evolution API.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeDialog}
              className="flex size-10 shrink-0 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              aria-label="Fechar modal"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Seletor de Abas */}
          <div className="mt-5 flex items-center gap-2 border-b border-slate-200/80 pb-px">
            <button
              type="button"
              onClick={() => setActiveTab('ia')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ia'
                  ? 'border-amber-500 text-slate-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Bot className="size-4 text-amber-500 shrink-0" />
              <span>Inteligência Artificial</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('whatsapp')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'whatsapp'
                  ? 'border-amber-500 text-slate-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <MessageSquare className="size-4 text-amber-500 shrink-0" />
              <span>Whatsapp & Automação</span>
              <span className={`size-2 rounded-full ${whatsappStatus.connected ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            </button>
          </div>
        </header>

        {/* Corpo do Modal */}
        <div className="settings-dialog__body app-modal-body flex-1 min-h-0 overflow-y-auto px-6 py-6 sm:px-8 custom-scrollbar">
          {/* ================= ABA 1: INTELIGÊNCIA ARTIFICIAL ================= */}
          {activeTab === 'ia' && (
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
                    {availableModels.map((model) => (
                      <option key={model} value={model}>{model}</option>
                    ))}
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
                        Caso o modelo principal sofra oscilações ou esgote cotas, o sistema redireciona automaticamente para o GPT-6 Luna e DeepSeek Flash sem interromper o atendimento da consulta.
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

                    {/* 2º GPT-6 Luna */}
                    <div className="flex items-center justify-between gap-2.5 rounded-lg bg-slate-50/90 px-3 py-2 border border-slate-100">
                      <div className="min-w-0 flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800">2º GPT-6 Luna</span>
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
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.25)',
                  }}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-xs font-extrabold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60 cursor-pointer"
                >
                  <RefreshCw className={`size-3.5 text-white stroke-[2.2] ${geminiStatus === 'testing' ? 'animate-spin' : ''}`} />
                  <span className="text-white">{geminiStatus === 'testing' ? 'Testando as 3 IAs ao vivo...' : 'Testar conexão'}</span>
                </button>
              </section>
            </div>
          )}

          {/* ================= ABA 2: WHATSAPP & EVOLUTION API ================= */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-6">
              {connectSuccess && (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50/90 p-4 shadow-sm animate-fadeIn">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-xs">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-emerald-950">WhatsApp Conectado com Sucesso!</h4>
                    <p className="mt-0.5 text-[11px] font-medium text-emerald-800">
                      O pareamento foi concluído na VPS. O consultório já está habilitado para disparos e lembretes automáticos.
                    </p>
                  </div>
                </div>
              )}

              {/* Card de Status do WhatsApp */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex shrink-0 items-center justify-center text-orange-500">
                      <Smartphone className="size-7 text-orange-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                          {isDra ? 'WhatsApp Oficial NutrIsa' : 'WhatsApp da Clínica'}
                        </h3>
                        {whatsappStatus.connected ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Conectado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-800">
                            <span className="size-1.5 rounded-full bg-amber-500" /> Aguardando Conexão
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {whatsappStatus.connected
                          ? `Instância ativa: ${whatsappStatus.instanceName} • Número: ${whatsappStatus.phone || 'Cadastrado'}`
                          : 'Conecte o WhatsApp do consultório para disparo de lembretes e relatórios.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {whatsappStatus.connected ? (
                      <button
                        type="button"
                        onClick={handleDisconnect}
                        className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                      >
                        <Unlink className="size-3.5" />
                        <span>Desconectar Aparelho</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleGenerateQr}
                        disabled={loadingQr}
                        className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all hover:scale-102 cursor-pointer disabled:opacity-60"
                      >
                        {loadingQr ? (
                          <>
                            <RefreshCw className="size-3.5 animate-spin" />
                            <span>Gerando QR Code…</span>
                          </>
                        ) : (
                          <>
                            <QrCode className="size-4" />
                            <span>Conectar WhatsApp (QR Code)</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Área de Leitura do QR Code */}
                {qrCodeData && !whatsappStatus.connected && (
                  <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/40 p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                        {qrCodeData.base64 ? (
                          <img
                            src={qrCodeData.base64.startsWith('data:') ? qrCodeData.base64 : `data:image/png;base64,${qrCodeData.base64}`}
                            alt="QR Code do WhatsApp"
                            className="size-48 object-contain"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center size-48 text-center text-slate-400">
                            <QrCode className="size-16 text-slate-300 mb-2 animate-pulse" />
                            <span className="text-xs font-bold text-slate-700">Carregando QR Code</span>
                            <span className="text-[10px] text-slate-400">Conectando à Evolution API...</span>
                          </div>
                        )}

                        <div className="mt-3 flex items-center justify-between w-full px-2 text-[11px] text-slate-500">
                          <span>Expira em: <strong className="text-emerald-700">{qrCountdown}s</strong></span>
                          <button
                            type="button"
                            onClick={handleGenerateQr}
                            className="text-emerald-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className="size-3" /> Atualizar
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <CheckCircle2 className="size-4 text-emerald-600" />
                          Como conectar seu WhatsApp:
                        </h4>
                        <ol className="space-y-2 text-xs text-slate-600 list-decimal list-inside leading-relaxed">
                          <li>Abra o <strong>WhatsApp</strong> no celular do consultório.</li>
                          <li>Toque nos <strong>três pontinhos</strong> (Android) ou em <strong>Aparelhos Conectados</strong> (iPhone).</li>
                          <li>Toque no botão <strong>Conectar um aparelho</strong>.</li>
                          <li>Aponte a câmera do celular para o <strong>QR Code ao lado</strong>.</li>
                        </ol>

                        <div className="rounded-lg border border-slate-200 bg-white p-3 text-[11px] text-slate-500">
                          🔒 <strong>Isolamento Multi-Tenant:</strong> Sua instância na VPS é exclusiva da sua clínica. Suas mensagens e conversas não são compartilhadas com outras organizações.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <footer className="app-modal-footer shrink-0 flex items-center justify-end gap-3 border-t border-slate-200/80 bg-white px-6 py-4 sm:px-8">
          <button
            type="button"
            onClick={closeDialog}
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.25)',
            }}
            className="min-h-11 rounded-xl px-7 text-sm font-extrabold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] cursor-pointer"
          >
            Concluir
          </button>
        </footer>
      </div>
    </dialog>
  );
}
