import { useState } from 'react';
import { Building2, KeyRound, LockKeyhole, Mail } from 'lucide-react';
import { useAuth } from './useAuth.js';
import logoNew from '../../assets/logo_new.png';

export default function LoginPage() {
  const { configured, loading, error: authError, signIn, signInWithGoogle, sendMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState(() => {
    return localStorage.getItem('nutrisa_pending_invite_code') || '';
  });
  const [showInviteField, setShowInviteField] = useState(() => {
    return Boolean(localStorage.getItem('nutrisa_pending_invite_code'));
  });
  const [message, setMessage] = useState('');
  const [pendingAction, setPendingAction] = useState('');
  const submitting = Boolean(pendingAction);

  const savePendingCode = () => {
    if (inviteCode.trim()) {
      localStorage.setItem('nutrisa_pending_invite_code', inviteCode.trim().toUpperCase());
    } else {
      localStorage.removeItem('nutrisa_pending_invite_code');
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    savePendingCode();
    setPendingAction('password');
    setMessage('');
    try {
      await signIn(email.trim(), password);
    } catch (error) {
      setMessage(error.message || 'Não foi possível entrar.');
    } finally {
      setPendingAction('');
    }
  };

  const continueWithGoogle = async () => {
    savePendingCode();
    setPendingAction('google');
    setMessage('');
    try {
      await signInWithGoogle();
    } catch (error) {
      setMessage(error.message || 'Não foi possível entrar com o Google.');
      setPendingAction('');
    }
  };

  const requestLink = async () => {
    if (!email.trim()) {
      setMessage('Informe seu e-mail primeiro.');
      return;
    }
    savePendingCode();
    setPendingAction('magic-link');
    setMessage('');
    try {
      await sendMagicLink(email.trim());
      setMessage('Link de acesso enviado. Confira seu e-mail.');
    } catch (error) {
      setMessage(error.message || 'Não foi possível enviar o link.');
    } finally {
      setPendingAction('');
    }
  };

  return (
    <main className="app-shell relative min-h-screen min-w-0 overflow-x-clip bg-[var(--color-app-background)] font-sans text-slate-800 flex items-center justify-center p-4">
      <div className="app-ambient fixed inset-0 z-0 overflow-hidden pointer-events-none print:hidden" aria-hidden="true">
        <span className="app-ambient__orb app-ambient__orb--mint" />
        <span className="app-ambient__orb app-ambient__orb--blue" />
        <span className="app-ambient__orb app-ambient__orb--peach" />
      </div>

      <section className="relative z-10 w-full max-w-md rounded-3xl border border-white/80 bg-white/85 p-6 shadow-[0_20px_55px_rgba(33,65,86,0.12)] backdrop-blur-2xl sm:p-8" aria-labelledby="login-title">
        <div className="mb-7 flex flex-col items-center justify-center text-center">
          <img
            src={logoNew}
            alt="NutrIsa - Área clínica da Dra. Isabela"
            className="h-14 sm:h-16 w-auto max-w-[240px] object-contain drop-shadow-xs"
          />
          <h1 id="login-title" className="sr-only">Acesso NutrIsa - Área clínica da Dra. Isabela</h1>
        </div>

        {!configured ? (
          <p role="alert" className="rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            Configure as variáveis do Supabase para liberar o acesso clínico.
          </p>
        ) : (
          <form className="space-y-4" onSubmit={submit}>
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-sm font-bold text-slate-700">E-mail</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input id="login-email" name="email" type="email" autoComplete="username" spellCheck="false" required value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm" />
              </div>
            </div>
            <div>
              <label htmlFor="current-password" className="mb-1.5 block text-sm font-bold text-slate-700">Senha</label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input id="current-password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm" />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3.5 transition">
              <button
                type="button"
                onClick={() => setShowInviteField((prev) => !prev)}
                className="flex w-full items-center justify-between text-left text-xs font-bold text-slate-700 hover:text-emerald-700"
              >
                <span className="flex items-center gap-2">
                  <Building2 className="size-4 text-emerald-600" />
                  Membro de equipe / Secretária?
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 underline underline-offset-2">
                  {showInviteField ? 'Ocultar código' : 'Inserir código da clínica'}
                </span>
              </button>

              {showInviteField && (
                <div className="mt-3 space-y-1.5">
                  <label htmlFor="login-invite-code" className="block text-xs font-semibold text-slate-600">
                    Código de Convite da Clínica
                  </label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="login-invite-code"
                      type="text"
                      placeholder="Ex: ISABELA-2026"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      className="min-h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-mono font-bold tracking-wider uppercase text-slate-800 placeholder:normal-case placeholder:font-normal placeholder:tracking-normal focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Fornecido pela Dra. para liberar seus acessos de recepção ou administrativo.
                  </p>
                </div>
              )}
            </div>

            {(message || authError) ? <p role="status" aria-live="polite" className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700">{message || authError}</p> : null}

            <button type="submit" disabled={submitting || loading} className="min-h-12 w-full rounded-2xl bg-emerald-600 px-4 font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
              {pendingAction === 'password' || loading ? 'Entrando…' : 'Entrar com e-mail e senha'}
            </button>
            <button type="button" onClick={requestLink} disabled={submitting} className="min-h-11 w-full rounded-2xl text-sm font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60">
              Receber link de acesso por e-mail
            </button>

            <div className="flex items-center gap-3 pt-1" aria-hidden="true">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">ou</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <button type="button" onClick={continueWithGoogle} disabled={submitting || loading} className="flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 font-bold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
              <GoogleMark />
              {pendingAction === 'google' ? 'Abrindo o Google…' : 'Entrar com o Google'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" focusable="false">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.36l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.93A6.02 6.02 0 0 1 6.07 12c0-.67.11-1.32.32-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.55l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z" />
    </svg>
  );
}
