import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, MessageCircle, RefreshCw, Search, UserPlus } from 'lucide-react';
import { fetchConversations } from '../../atendimento/services/conversations.js';
import { listUnregisteredWhatsAppContacts } from '../../atendimento/domain/patientRegistration.js';
import { useAuth } from '../../auth/useAuth.js';
import { usePatient } from '../usePatient.js';

const ignoredContactsKey = (organizationId) => `nutrisa_ignored_whatsapp_contacts_${organizationId || 'default'}`;

const readIgnoredContacts = (organizationId) => {
  try {
    const storedIds = JSON.parse(localStorage.getItem(ignoredContactsKey(organizationId)) || '[]');
    return new Set(Array.isArray(storedIds) ? storedIds : []);
  } catch {
    return new Set();
  }
};

const formatLatestContact = (value) => {
  if (!value) return 'Data não informada';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Data não informada'
    : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
};

export default function WhatsAppPatientCandidates({ onRegister, onRegisterAll }) {
  const { organizationId } = useAuth();
  const { patients, loading: patientsLoading, error: patientsError } = usePatient();
  const [conversations, setConversations] = useState([]);
  const [ignoredContactIds, setIgnoredContactIds] = useState(() => readIgnoredContacts(organizationId));
  const [showIgnoredContacts, setShowIgnoredContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [isRegisteringAll, setIsRegisteringAll] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkError, setBulkError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadContacts = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      setConversations(await fetchConversations({ signal }));
    } catch (requestError) {
      if (requestError.name !== 'AbortError') setError(requestError.message || 'Não foi possível consultar as conversas.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadContacts(controller.signal);
    return () => controller.abort();
  }, [loadContacts]);

  useEffect(() => {
    setIgnoredContactIds(readIgnoredContacts(organizationId));
  }, [organizationId]);

  const allContacts = useMemo(
    () => listUnregisteredWhatsAppContacts(conversations, patients),
    [conversations, patients],
  );
  const ignoredContactsCount = allContacts.filter((contact) => ignoredContactIds.has(contact.id)).length;
  const contacts = showIgnoredContacts
    ? allContacts
    : allContacts.filter((contact) => !ignoredContactIds.has(contact.id));
  const normalizedSearch = contactSearch.trim().toLocaleLowerCase('pt-BR');
  const numericSearch = normalizedSearch.replace(/\D/g, '');
  const filteredContacts = contacts.filter((contact) => (
    !normalizedSearch
    || contact.name.toLocaleLowerCase('pt-BR').includes(normalizedSearch)
    || contact.phone.toLocaleLowerCase('pt-BR').includes(normalizedSearch)
    || (numericSearch && contact.phone.replace(/\D/g, '').includes(numericSearch))
  ));
  const isLoading = loading || patientsLoading;
  const visibleError = patientsError || error;

  const ignoreContact = (contact) => {
    if (!window.confirm(`Não mostrar “${contact.name}” novamente nesta lista?`)) return;
    setIgnoredContactIds((current) => {
      const next = new Set(current).add(contact.id);
      localStorage.setItem(ignoredContactsKey(organizationId), JSON.stringify([...next]));
      return next;
    });
  };

  const restoreContact = (contact) => {
    setIgnoredContactIds((current) => {
      const next = new Set(current);
      next.delete(contact.id);
      localStorage.setItem(ignoredContactsKey(organizationId), JSON.stringify([...next]));
      return next;
    });
  };

  const registerAllContacts = async () => {
    if (!filteredContacts.length || !onRegisterAll) return;
    if (!window.confirm(`Cadastrar ${filteredContacts.length} contato(s) visível(is) como paciente(s)?`)) return;

    setIsRegisteringAll(true);
    setBulkMessage('');
    setBulkError(false);
    try {
      const { created, skipped } = await onRegisterAll(filteredContacts);
      setBulkMessage(`${created} paciente(s) cadastrado(s)${skipped ? ` e ${skipped} já existente(s)` : ''}.`);
    } catch (registerError) {
      setBulkMessage(registerError.message || 'Não foi possível cadastrar a lista de contatos.');
      setBulkError(true);
    } finally {
      setIsRegisteringAll(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm" aria-labelledby="whatsapp-candidates-title">
      <div className="border-b border-slate-100 bg-slate-50 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="whatsapp-candidates-title" className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900"><MessageCircle className="size-[18px] text-emerald-600" aria-hidden="true" /> Contatos do WhatsApp não cadastrados</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">Conversas com telefone identificado que ainda não possuem cadastro de paciente.</p>
        </div>
        <div className="flex flex-nowrap items-center gap-2">
          <button type="button" onClick={registerAllContacts} disabled={!filteredContacts.length || isRegisteringAll} aria-label={`Cadastrar lista de ${filteredContacts.length} contatos`} title="Cadastrar lista" className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 p-0 text-[11px] font-bold text-emerald-800 shadow-xs transition-colors hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-wait disabled:opacity-50 lg:h-auto lg:w-40 lg:px-3 lg:py-2">
            <UserPlus className="size-3 lg:mr-1 text-emerald-600 shrink-0" aria-hidden="true" />
            <span className="hidden lg:inline">{isRegisteringAll ? 'Cadastrando…' : `Cadastrar lista (${filteredContacts.length})`}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowIgnoredContacts((current) => !current)}
            disabled={!ignoredContactsCount}
            aria-pressed={showIgnoredContacts}
            aria-label={`Contatos ignorados ${showIgnoredContacts ? 'visíveis' : 'ocultos'}: ${ignoredContactsCount}`}
            className={`flex size-9 shrink-0 items-center justify-center rounded-xl border p-0 text-[11px] font-bold shadow-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-40 lg:h-auto lg:w-40 lg:px-3 lg:py-2 ${
              showIgnoredContacts
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
            title="Mostra ou oculta os contatos marcados para não aparecer novamente"
          >
            <EyeOff className="size-3 lg:mr-1 text-emerald-600 shrink-0" aria-hidden="true" />
            <span className="hidden lg:inline">Ignorados {showIgnoredContacts ? 'ON' : 'OFF'} ({ignoredContactsCount})</span>
          </button>
          <button type="button" onClick={() => loadContacts()} disabled={isLoading} aria-label="Atualizar lista de contatos" title="Atualizar lista" className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-0 text-[11px] font-bold text-slate-600 shadow-xs transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-wait disabled:opacity-60 lg:h-auto lg:w-40 lg:px-3 lg:py-2">
            <RefreshCw className={`size-3 lg:mr-1 text-emerald-600 shrink-0 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" /> <span className="hidden lg:inline">Atualizar lista</span>
          </button>
        </div>
      </div>
      </div>

      <div className="p-5 sm:p-6">
      <form role="search" className="relative w-full pr-1 sm:w-[calc((100%-0.5rem)/2)] xl:w-[calc((100%-1rem)/3)]" onSubmit={(event) => event.preventDefault()}>
        <label htmlFor="whatsapp-contact-search" className="sr-only">Buscar contato por nome ou número</label>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input id="whatsapp-contact-search" type="search" autoComplete="off" spellCheck="false" value={contactSearch} onChange={(event) => setContactSearch(event.target.value)} placeholder="Buscar por nome ou número" className="min-h-9 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none" />
      </form>

      {bulkMessage ? <p role={bulkError ? 'alert' : 'status'} className={`mt-3 rounded-xl px-3 py-2 text-xs font-semibold ${bulkError ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-800'}`}>{bulkMessage}</p> : null}

      {isLoading ? (
        <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Consultando conversas…</p>
      ) : visibleError ? (
        <p role="alert" className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-700">{visibleError}</p>
      ) : filteredContacts.length ? (
        <ul className="mt-4 grid max-h-80 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
          {filteredContacts.map((contact) => {
            const isIgnored = ignoredContactIds.has(contact.id);
            return (
            <li key={contact.id} className={`flex min-w-0 items-center gap-3 rounded-2xl border p-3 transition-colors ${isIgnored ? 'border-slate-200 bg-slate-50 opacity-75' : 'border-slate-200 bg-slate-50/70 hover:border-emerald-300 hover:bg-emerald-50/40'}`}>
              <ContactAvatar contact={contact} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black text-slate-900">{contact.name}</span>
                {isIgnored ? <span className="text-[0.625rem] font-bold uppercase tracking-wide text-slate-500">Ignorado</span> : null}
                <span className="block truncate font-mono text-[11px] text-slate-500">{contact.phone}</span>
                <span className="block text-[10px] text-slate-400">{contact.messageCount} {contact.messageCount === 1 ? 'mensagem' : 'mensagens'} · {formatLatestContact(contact.latestAt)}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={() => onRegister(contact.draft)} className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600" aria-label={`Cadastrar ${contact.name}`} title="Cadastrar paciente">
                  <UserPlus className="size-3.5" aria-hidden="true" />
                </button>
                {isIgnored ? (
                  <button type="button" onClick={() => restoreContact(contact)} className="inline-flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600" aria-label={`Voltar a mostrar ${contact.name}`} title="Voltar a mostrar">
                    <Eye className="size-3.5" aria-hidden="true" />
                  </button>
                ) : (
                  <button type="button" onClick={() => ignoreContact(contact)} className="inline-flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600" aria-label={`Não mostrar ${contact.name} novamente`} title="Não mostrar novamente">
                    <EyeOff className="size-3.5" aria-hidden="true" />
                  </button>
                )}
              </span>
            </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">
          {normalizedSearch ? `Nenhum contato encontrado para “${contactSearch.trim()}”.` : ignoredContactsCount ? `${ignoredContactsCount} contato(s) está(ão) oculto(s). Use “Ignorados ON” para visualizar.` : 'Todos os contatos com telefone já possuem cadastro.'}
        </p>
      )}
      </div>
    </section>
  );
}

function ContactAvatar({ contact }) {
  const [failedImageUrl, setFailedImageUrl] = useState('');
  const showImage = contact.photoUrl && contact.photoUrl !== failedImageUrl;

  return (
    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-100 text-xs font-black text-emerald-800" aria-hidden="true">
      {showImage ? (
        <img
          src={contact.photoUrl}
          alt=""
          width="40"
          height="40"
          loading="lazy"
          referrerPolicy="no-referrer"
          className="size-full object-cover"
          onError={() => setFailedImageUrl(contact.photoUrl)}
        />
      ) : contact.name.slice(0, 2).toUpperCase()}
    </span>
  );
}
