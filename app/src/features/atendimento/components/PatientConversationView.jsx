import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, ExternalLink, LoaderCircle, MessageCircle, RefreshCw, Search, Send, Tag, UserRound } from 'lucide-react';
import PageHeader from '../../../shared/ui/PageHeader.jsx';
import { fetchPatientConversations, subscribeToPatientConversations } from '../services/conversations.js';
import { parseWhatsAppFormatting } from '../domain/whatsappFormatting.js';
import { formatWaitTime } from '../../../shared/utils/formatters.js';
import { getAttendantType, getResponderLabel, getResponderType } from '../domain/classification.js';
import { sendWhatsAppMessage } from '../services/whatsappSender.js';
import { useAuth } from '../../auth/useAuth.js';

const normalizePhone = (value) => String(value || '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDay = (value) => {
  const date = parseDate(value);
  if (!date) return 'Data não informada';
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

const formatTime = (value) => {
  const date = parseDate(value);
  return date ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date) : null;
};

const responseTime = (sentAt, waitMinutes) => {
  const date = parseDate(sentAt);
  const minutes = Number(waitMinutes);
  if (!date || !Number.isFinite(minutes)) return null;
  return new Date(date.getTime() + minutes * 60_000);
};

function WhatsAppText({ children }) {
  return parseWhatsAppFormatting(children).map((token, index) => {
    const key = `${token.type}-${index}`;
    if (token.type === 'bold') return <strong key={key} className="font-extrabold">{token.value}</strong>;
    if (token.type === 'italic') return <em key={key}>{token.value}</em>;
    if (token.type === 'strike') return <s key={key}>{token.value}</s>;
    if (token.type === 'code') return <code key={key} className="rounded-md bg-slate-900/8 px-1 py-0.5 font-mono text-[0.92em]">{token.value}</code>;
    return token.value;
  });
}

const PAGE_SIZE = 50;
const AUTO_REFRESH_INTERVAL_MS = 30_000;

export default function PatientConversationView({ patient, onBack }) {
  const { user, organizationId, currentMember } = useAuth();
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const scrollRef = useRef(null);
  const initialScrollDone = useRef(false);
  const restoreScrollRef = useRef(null);

  const loadLatest = useCallback(async ({ preservePosition = false } = {}) => {
    if (!patient?.id) return;
    if (!preservePosition) setLoading(true);
    setError('');
    try {
      const result = await fetchPatientConversations({ patientId: patient.id, page: 0, pageSize: PAGE_SIZE });
      if (preservePosition) {
        const viewport = scrollRef.current;
        const shouldFollowLatest = viewport ? viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 96 : false;
        setMessages((current) => {
          const merged = new Map(current.map((item) => [item.id || item.id_mensagem, item]));
          result.items.forEach((item) => merged.set(item.id || item.id_mensagem, item));
          return [...merged.values()].sort((a, b) => new Date(a.data_envio || 0) - new Date(b.data_envio || 0));
        });
        if (shouldFollowLatest) requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; });
      } else {
        setMessages(result.items);
        setHasMore(result.hasMore);
        setPage(0);
        initialScrollDone.current = false;
      }
      setLastUpdated(new Date());
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível carregar a conversa.');
    } finally {
      setLoading(false);
    }
  }, [patient?.id]);

  useEffect(() => { loadLatest(); }, [loadLatest]);

  useEffect(() => subscribeToPatientConversations(patient?.id, () => loadLatest({ preservePosition: true })), [patient?.id, loadLatest]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') loadLatest({ preservePosition: true });
    };
    const intervalId = window.setInterval(refreshWhenVisible, AUTO_REFRESH_INTERVAL_MS);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [loadLatest]);

  useEffect(() => {
    const viewport = scrollRef.current;
    if (!viewport || loading || initialScrollDone.current) return;
    viewport.scrollTop = viewport.scrollHeight;
    initialScrollDone.current = true;
  }, [loading, messages]);

  useEffect(() => {
    const viewport = scrollRef.current;
    const previous = restoreScrollRef.current;
    if (!viewport || !previous) return;
    viewport.scrollTop = viewport.scrollHeight - previous.scrollHeight + previous.scrollTop;
    restoreScrollRef.current = null;
  }, [messages]);

  const loadOlder = async () => {
    if (!hasMore || loadingOlder) return;
    const viewport = scrollRef.current;
    if (viewport) restoreScrollRef.current = { scrollHeight: viewport.scrollHeight, scrollTop: viewport.scrollTop };
    setLoadingOlder(true);
    setError('');
    try {
      const nextPage = page + 1;
      const result = await fetchPatientConversations({ patientId: patient.id, page: nextPage, pageSize: PAGE_SIZE });
      setMessages((current) => [...result.items, ...current]);
      setHasMore(result.hasMore);
      setPage(nextPage);
    } catch (requestError) {
      restoreScrollRef.current = null;
      setError(requestError.message || 'Não foi possível carregar mensagens anteriores.');
    } finally {
      setLoadingOlder(false);
    }
  };

  const visibleMessages = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return messages.filter((item) => {
        if (!term) return true;
        return [item.mensagem_texto, item.conteudo_mensagem, item.resposta_secretaria, item.resposta, item.categoria]
          .some((value) => String(value || '').toLocaleLowerCase('pt-BR').includes(term));
      });
  }, [messages, search]);

  const openWhatsApp = () => {
    const phone = normalizePhone(patient?.phone);
    const internationalPhone = phone.startsWith('55') ? phone : `55${phone}`;
    if (!phone || !draft.trim()) return;
    window.open(`https://wa.me/${internationalPhone}?text=${encodeURIComponent(draft.trim())}`, '_blank', 'noopener,noreferrer');
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    if (sending) return;
    const message = draft.trim();
    setSendError('');
    setSendSuccess('');
    setSending(true);
    try {
      await sendWhatsAppMessage({
        phone: patient?.phone,
        message,
        patientId: patient?.id,
        requestedBy: user?.id,
        organizationId,
        responderName: currentMember?.name || currentMember?.display_name || user?.user_metadata?.full_name || user?.email,
        responderRole: currentMember?.role,
        responderType: getResponderType({
          role: currentMember?.role,
          name: currentMember?.name || currentMember?.display_name || user?.user_metadata?.full_name,
          email: currentMember?.email || user?.email,
        }),
      });
      setDraft('');
      setSendSuccess('Mensagem enviada pelo WhatsApp.');
      window.setTimeout(() => loadLatest({ preservePosition: true }), 1200);
    } catch (requestError) {
      setSendError(requestError.message || 'Não foi possível enviar a mensagem.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="animate-fadeIn flex h-[calc(100dvh-7rem)] min-h-0 flex-col gap-5 overflow-hidden">
      <div className="shrink-0">
        <PageHeader
          category="Atendimento"
          title="Conversa do paciente"
          description="Histórico de mensagens do WhatsApp vinculado ao cadastro selecionado."
          actions={<button type="button" onClick={onBack} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"><ArrowLeft className="size-4" /> Atendimento geral</button>}
        />
      </div>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm" aria-labelledby="patient-chat-title">
        <header className="flex shrink-0 flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 text-sm font-black text-emerald-800">
              {patient?.avatar_url ? <img src={patient.avatar_url} alt="" className="size-full object-cover" /> : <UserRound className="size-5" />}
            </div>
            <div className="min-w-0">
              <h2 id="patient-chat-title" className="truncate text-lg font-black text-slate-900">{patient?.name || 'Paciente'}</h2>
              <p className="truncate text-xs font-medium text-slate-500">{patient?.phone || 'WhatsApp não informado'} · {messages.length} mensagens carregadas</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
            <label className="relative min-w-0 flex-1 sm:w-64">
              <span className="sr-only">Buscar no histórico</span>
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar na conversa" className="min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
            </label>
            {lastUpdated ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-600" title={lastUpdated.toLocaleString('pt-BR')}>
                <Clock3 aria-hidden="true" className="size-3.5 text-emerald-600" />
                Atualizado às {lastUpdated.toLocaleTimeString('pt-BR')}
              </span>
            ) : null}
            <button type="button" onClick={() => loadLatest()} disabled={loading} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-500 active:scale-95 disabled:cursor-wait disabled:opacity-50">
              <RefreshCw aria-hidden="true" className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </header>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50/70 p-4 [scrollbar-gutter:stable] sm:p-6">
          {error ? <p role="alert" className="rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</p> : null}
          {loading && !messages.length ? <p className="py-16 text-center text-sm text-slate-500">Carregando histórico…</p> : null}
          {!loading && !error && !visibleMessages.length ? (
            <div className="flex min-h-80 flex-col items-center justify-center text-center">
              <MessageCircle className="mb-3 size-10 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">Nenhuma conversa encontrada</p>
              <p className="mt-1 max-w-md text-xs text-slate-500">As próximas mensagens vinculadas a este número aparecerão aqui.</p>
            </div>
          ) : null}
          <ol className="mx-auto max-w-4xl space-y-5" aria-label="Histórico da conversa">
            {hasMore && !search ? <li className="flex justify-center"><button type="button" onClick={loadOlder} disabled={loadingOlder} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 shadow-2xs hover:bg-slate-50 disabled:opacity-60">{loadingOlder ? <LoaderCircle className="size-3.5 animate-spin" /> : null}{loadingOlder ? 'Carregando…' : 'Carregar mensagens anteriores'}</button></li> : null}
            {visibleMessages.map((item) => {
              const received = item.conteudo_mensagem || item.mensagem_texto || item.mensagem;
              const response = item.resposta_secretaria || item.resposta || item.observacao;
              const responseCategory = item.categoria_secretaria || item.categoria;
              const responseMinutes = item.tempo_espera_minutos ?? item.tempo_espera;
              const receivedAt = item.data_envio;
              const answeredAt = responseTime(receivedAt, responseMinutes);
              const attendantType = getAttendantType(item);
              const isIsabela = attendantType === 'isabela';
              const responseBubble = isIsabela
                ? 'border-teal-200 bg-teal-50'
                : 'border-purple-200 bg-purple-50';
              const responseMeta = isIsabela ? 'text-teal-800' : 'text-purple-800';
              const responseBadge = isIsabela
                ? 'border-teal-200 bg-white/70'
                : 'border-purple-200 bg-white/70';
              const attendantLabel = getResponderLabel(item);
              return (
                <li key={item.id || item.id_mensagem} className="space-y-2.5">
                  <div className="flex justify-center"><span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold capitalize text-slate-400 shadow-2xs"><CalendarDays className="size-3" /> {formatDay(receivedAt)}</span></div>
                  {received ? <div className="flex justify-start"><div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 shadow-2xs"><p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800"><WhatsAppText>{received}</WhatsAppText></p><div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-slate-500"><span>Mensagem do paciente</span>{formatTime(receivedAt) ? <span className="inline-flex items-center gap-1"><Clock3 className="size-3" />{formatTime(receivedAt)}</span> : null}<span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5"><Tag className="size-3" />{item.categoria || 'Geral'}</span></div></div></div> : null}
                  {response ? <div className="flex justify-end"><div className={`max-w-[85%] rounded-2xl rounded-tr-sm border px-4 py-3 shadow-2xs ${responseBubble}`}><p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800"><WhatsAppText>{response}</WhatsAppText></p><div className={`mt-2 flex flex-wrap items-center justify-end gap-1.5 text-[10px] font-semibold ${responseMeta}`}><span>Resposta · {attendantLabel}</span>{answeredAt ? <span className="inline-flex items-center gap-1"><Clock3 className="size-3" />{formatTime(answeredAt)}</span> : null}{responseCategory ? <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${responseBadge}`}><Tag className="size-3" />{responseCategory}</span> : null}{responseMinutes !== null && responseMinutes !== undefined ? <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${responseBadge}`}><Clock3 className="size-3" />Tempo de resposta: {formatWaitTime(responseMinutes)}</span> : null}</div></div></div> : null}
                </li>
              );
            })}
          </ol>
        </div>

        <footer className="shrink-0 border-t border-slate-100 bg-white p-4 sm:p-5">
          <form method="POST" action="#" onSubmit={sendMessage} className="mx-auto max-w-4xl" aria-describedby="patient-message-status">
            <label htmlFor="patient-whatsapp-message" className="sr-only">Mensagem para o paciente</label>
            <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100">
              <textarea id="patient-whatsapp-message" name="message" rows="1" required maxLength="4096" value={draft} onChange={(event) => { setDraft(event.target.value); setSendError(''); setSendSuccess(''); }} placeholder="Escreva uma mensagem" className="min-h-12 flex-1 resize-y bg-transparent px-2 py-3 text-base text-slate-700 outline-none sm:text-sm" />
              <button type="button" onClick={openWhatsApp} disabled={!draft.trim() || !normalizePhone(patient?.phone) || sending} className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Abrir mensagem no WhatsApp" title="Abrir no WhatsApp como alternativa"><ExternalLink className="size-4" /></button>
              <button type="submit" disabled={!draft.trim() || !normalizePhone(patient?.phone) || sending} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400" aria-label="Enviar mensagem pelo WhatsApp">
                {sending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
                <span className="hidden sm:inline">{sending ? 'Enviando…' : 'Enviar'}</span>
              </button>
            </div>
            <div id="patient-message-status" aria-live="polite" className="mt-2 min-h-4 text-xs">
              {sendError ? <p role="alert" className="font-semibold text-rose-700">{sendError} O texto foi preservado para tentar novamente.</p> : null}
              {sendSuccess ? <p className="inline-flex items-center gap-1.5 font-semibold text-emerald-700"><CheckCircle2 className="size-3.5" />{sendSuccess}</p> : null}
              {!sendError && !sendSuccess ? <p className="text-slate-400">Envio direto pela conexão WhatsApp da NutrIsa. Use o botão externo como alternativa.</p> : null}
            </div>
          </form>
        </footer>
      </section>
    </div>
  );
}
