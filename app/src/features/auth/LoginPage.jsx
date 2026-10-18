import { useState } from 'react';
import {
  Building2,
  KeyRound,
  LockKeyhole,
  Mail,
  User,
  Sparkles,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from './useAuth.js';
import logoNew from '../../assets/logo_new.png';

export default function LoginPage() {
  const {
    configured,
    loading,
    error: authError,
    signIn,
    signUp,
    signInWithGoogle,
    sendMagicLink,
  } = useAuth();

  const [activeTab, setActiveTab] = useState('signin'); // 'signin' | 'signup'

  // Campos de Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState(() => {
    try {
      return localStorage.getItem('nutrisa_pending_invite_code') || '';
    } catch {
      return '';
    }
  });
  const [showInviteField, setShowInviteField] = useState(() => {
    try {
      return Boolean(localStorage.getItem('nutrisa_pending_invite_code'));
    } catch {
      return false;
    }
  });

  // Campos de Cadastro de Novo Consultório
  const [signupName, setSignupName] = useState('');
  const [signupClinic, setSignupClinic] = useState('');
  const [signupCrn, setSignupCrn] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const [message, setMessage] = useState('');
  const [pendingAction, setPendingAction] = useState('');
  const submitting = Boolean(pendingAction);

  const savePendingCode = () => {
    try {
      if (inviteCode.trim()) {
        localStorage.setItem('nutrisa_pending_invite_code', inviteCode.trim().toUpperCase());
      } else {
        localStorage.removeItem('nutrisa_pending_invite_code');
      }
    } catch {}
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    savePendingCode();
    setPendingAction('password');
    setMessage('');
    try {
      await signIn(email.trim(), password);
    } catch (error) {
      const errLower = (error?.message || '').toLowerCase();
      if (errLower.includes('email not confirmed')) {
        setMessage('E-mail ainda não confirmado. Por favor, confirme seu e-mail ou utilize o acesso por link.');
      } else if (errLower.includes('invalid login credentials')) {
        setMessage('E-mail ou senha incorretos. Verifique suas credenciais.');
      } else {
        setMessage(error.message || 'Não foi possível entrar.');
      }
    } finally {
      setPendingAction('');
    }
  };

  const handleSignUp = async (event) => {
    event.preventDefault();
    if (!signupClinic.trim()) {
      setMessage('Informe o nome do seu consultório ou clínica.');
      return;
    }
    setPendingAction('signup');
    setMessage('');
    try {
      const result = await signUp(signupEmail.trim(), signupPassword, {
        fullName: signupName.trim(),
        clinicName: signupClinic.trim(),
        crn: signupCrn.trim(),
      });

      if (result?.session) {
        setMessage('Consultório criado com sucesso! Entrando na plataforma...');
        return;
      }

      if (result?.user && Array.isArray(result.user.identities) && result.user.identities.length === 0) {
        setMessage('Este e-mail já está cadastrado. Alterne para a aba "Entrar" com sua senha.');
        return;
      }

      // Tenta login automático direto caso o usuário já tenha sido confirmado no banco
      try {
        await signIn(signupEmail.trim(), signupPassword);
        setMessage('Consultório criado com sucesso! Entrando...');
      } catch {
        setMessage('Consultório cadastrado com sucesso! Caso necessário, confirme o link enviado ao seu e-mail para acessar.');
      }
    } catch (error) {
      setMessage(error.message || 'Não foi possível cadastrar a clínica.');
    } finally {
      setPendingAction('');
    }
  };

  const continueWithGoogle = async () => {
    savePendingCode();
    setPendingAction('google');
    setMessage('');
    try {
      if (activeTab === 'signup' && signupClinic.trim()) {
        await signInWithGoogle({
          clinicName: signupClinic.trim(),
          professionalName: signupName.trim(),
          crn: signupCrn.trim(),
        });
      } else {
        await signInWithGoogle();
      }
    } catch (error) {
      setMessage(error.message || 'Não foi possível entrar com o Google.');
      setPendingAction('');
    }
  };

  const requestLink = async () => {
    const targetEmail = activeTab === 'signin' ? email : signupEmail;
    if (!targetEmail.trim()) {
      setMessage('Informe seu e-mail primeiro.');
      return;
    }
    savePendingCode();
    setPendingAction('magic-link');
    setMessage('');
    try {
      await sendMagicLink(targetEmail.trim());
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

      <section
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/80 bg-white/90 p-6 shadow-[0_20px_55px_rgba(33,65,86,0.12)] backdrop-blur-2xl sm:p-8 transition-all"
        aria-labelledby="login-title"
      >
        <div className="mb-6 flex flex-col items-center justify-center text-center">
          <img
            src={logoNew}
            alt="NutrIsa - Plataforma Clínica"
            className="h-12 sm:h-14 w-auto max-w-[220px] object-contain drop-shadow-xs"
          />
          <h1 id="login-title" className="sr-only">Acesso à Plataforma Clínica</h1>
        </div>

        {/* Abas Entrar / Criar Consultório */}
        <div className="mb-6 flex rounded-2xl bg-slate-100 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('signin');
              setMessage('');
            }}
            className={`flex-1 rounded-xl py-2.5 transition cursor-pointer text-center ${
              activeTab === 'signin'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setMessage('');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 transition cursor-pointer text-center ${
              activeTab === 'signup'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="size-3.5 text-emerald-600" />
            <span>Criar consultório</span>
          </button>
        </div>

        {!configured ? (
          <p role="alert" className="rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            Configure as variáveis do Supabase para liberar o acesso clínico.
          </p>
        ) : activeTab === 'signin' ? (
          /* Formulário de Login */
          <form className="space-y-4" onSubmit={handleSignIn}>
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-xs font-bold text-slate-700">
                E-mail
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  spellCheck="false"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100/60"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="current-password" className="mb-1.5 block text-xs font-bold text-slate-700">
                Senha
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="current-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100/60"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Inserir Código de Convite da Clínica */}
            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3.5 transition">
              <button
                type="button"
                onClick={() => setShowInviteField((prev) => !prev)}
                className="flex w-full items-center justify-between text-left text-xs font-bold text-slate-700 hover:text-emerald-700 cursor-pointer"
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
                <div className="mt-3 space-y-1.5 animate-fadeIn">
                  <label htmlFor="login-invite-code" className="block text-xs font-semibold text-slate-600">
                    Código de Convite da Clínica
                  </label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="login-invite-code"
                      type="text"
                      placeholder="Ex: CODIGO-2026 ou CLINICA-XYZ"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      className="min-h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-mono font-bold tracking-wider uppercase text-slate-800 placeholder:normal-case placeholder:font-normal placeholder:tracking-normal focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Fornecido pela responsável da clínica para liberar os seus acessos de atendimento ou financeiro.
                  </p>
                </div>
              )}
            </div>

            {(message || authError) && (
              <p role="status" aria-live="polite" className="rounded-xl bg-slate-100 p-3 text-xs font-semibold text-slate-700">
                {message || authError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || loading}
              className="min-h-12 w-full rounded-2xl bg-emerald-600 px-4 font-bold text-white shadow-sm hover:bg-emerald-700 transition active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              {pendingAction === 'password' || loading ? 'Entrando…' : 'Entrar com e-mail e senha'}
            </button>

            <button
              type="button"
              onClick={requestLink}
              disabled={submitting}
              className="min-h-11 w-full rounded-2xl text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition disabled:opacity-60 cursor-pointer"
            >
              Receber link de acesso por e-mail
            </button>

            <div className="flex items-center gap-3 pt-1" aria-hidden="true">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">ou</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={continueWithGoogle}
              disabled={submitting || loading}
              className="flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 font-bold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              <GoogleMark />
              {pendingAction === 'google' ? 'Abrindo o Google…' : 'Entrar com o Google'}
            </button>
          </form>
        ) : (
          /* Formulário de Criação de Novo Consultório */
          <form className="space-y-3.5" onSubmit={handleSignUp}>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 text-xs text-emerald-900 flex items-start gap-2">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Crie seu consultório independente com gestão completa de pacientes, agenda, dietas e equipe.
              </span>
            </div>

            <div>
              <label htmlFor="signup-name" className="mb-1 block text-xs font-bold text-slate-700">
                Seu nome completo <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="signup-name"
                  type="text"
                  required
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100/60"
                  placeholder="Ex: Dra. Camila Santos"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-clinic" className="mb-1 block text-xs font-bold text-slate-700">
                Nome do Consultório / Clínica <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="signup-clinic"
                  type="text"
                  required
                  value={signupClinic}
                  onChange={(e) => setSignupClinic(e.target.value)}
                  className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100/60"
                  placeholder="Ex: Clínica Camila Nutrição"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-crn" className="mb-1 block text-xs font-bold text-slate-700">
                CRN / Registro profissional <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <div className="relative">
                <Award className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="signup-crn"
                  type="text"
                  value={signupCrn}
                  onChange={(e) => setSignupCrn(e.target.value)}
                  className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100/60"
                  placeholder="Ex: CRN-3 / 12.345"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-email" className="mb-1 block text-xs font-bold text-slate-700">
                E-mail profissional <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100/60"
                  placeholder="camila@seusite.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-password" className="mb-1 block text-xs font-bold text-slate-700">
                Crie uma senha segura <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="signup-password"
                  type="password"
                  required
                  minLength={6}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100/60"
                  placeholder="Mínimo de 6 caracteres"
                />
              </div>
            </div>

            {(message || authError) && (
              <p role="status" aria-live="polite" className="rounded-xl bg-slate-100 p-3 text-xs font-semibold text-slate-700">
                {message || authError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || loading}
              className="min-h-12 w-full rounded-2xl bg-emerald-600 px-4 font-bold text-white shadow-sm hover:bg-emerald-700 transition active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              {pendingAction === 'signup' || loading ? 'Criando seu consultório…' : 'Criar meu consultório grátis'}
            </button>

            <div className="flex items-center gap-3 pt-1" aria-hidden="true">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">ou</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={continueWithGoogle}
              disabled={submitting || loading}
              className="flex min-h-11 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              <GoogleMark />
              <span>Cadastrar com o Google</span>
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0" focusable="false">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.36l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.93A6.02 6.02 0 0 1 6.07 12c0-.67.11-1.32.32-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.55l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z" />
    </svg>
  );
}
