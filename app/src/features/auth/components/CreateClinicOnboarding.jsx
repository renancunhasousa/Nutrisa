import { useState } from 'react';
import { Building2, Sparkles, User, Award, CheckCircle2, LogOut } from 'lucide-react';
import { useAuth } from '../useAuth.js';
import logoNew from '../../../assets/logo_new.png';

export default function CreateClinicOnboarding() {
  const { user, createClinic, signOut } = useAuth();
  const defaultProfName = user?.user_metadata?.full_name || '';

  const [clinicName, setClinicName] = useState('');
  const [professionalName, setProfessionalName] = useState(defaultProfName);
  const [crn, setCrn] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!clinicName.trim()) {
      setErrorMessage('Informe o nome do seu consultório ou clínica.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      await createClinic({
        clinicName: clinicName.trim(),
        professionalName: professionalName.trim(),
        crn: crn.trim(),
      });
    } catch (err) {
      console.error('Erro ao criar consultório:', err);
      setErrorMessage(err?.message || 'Não foi possível inicializar seu consultório.');
      setSubmitting(false);
    }
  };

  return (
    <main className="app-shell relative min-h-screen min-w-0 overflow-x-clip bg-[var(--color-app-background)] font-sans text-slate-800 flex items-center justify-center p-4">
      <div className="app-ambient fixed inset-0 z-0 overflow-hidden pointer-events-none print:hidden" aria-hidden="true">
        <span className="app-ambient__orb app-ambient__orb--mint" />
        <span className="app-ambient__orb app-ambient__orb--blue" />
        <span className="app-ambient__orb app-ambient__orb--peach" />
      </div>

      <section className="relative z-10 w-full max-w-lg rounded-3xl border border-white/80 bg-white/90 p-6 shadow-[0_20px_55px_rgba(33,65,86,0.12)] backdrop-blur-2xl sm:p-8">
        <div className="mb-6 flex flex-col items-center justify-center text-center">
          <img
            src={logoNew}
            alt="NutrIsa - Área Clínica"
            className="h-12 sm:h-14 w-auto max-w-[220px] object-contain drop-shadow-xs"
          />
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-bold text-emerald-800">
            <Sparkles className="size-3.5 text-emerald-600" />
            <span>Bem-vinda à sua nova área clínica</span>
          </div>
          <h1 className="mt-2 text-xl font-black text-slate-900 sm:text-2xl">
            Configure seu consultório
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Dê um nome ao seu consultório para liberar a gestão de pacientes, dietas e prontuários.
          </p>
        </div>

        {errorMessage && (
          <div role="alert" className="mb-4 rounded-2xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs font-semibold text-rose-800">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="onboarding-clinic" className="mb-1 block text-xs font-bold text-slate-700">
              Nome da Clínica / Consultório <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                id="onboarding-clinic"
                type="text"
                required
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="Ex: Consultório Dra. Camila Santos"
                className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100/60"
              />
            </div>
          </div>

          <div>
            <label htmlFor="onboarding-prof" className="mb-1 block text-xs font-bold text-slate-700">
              Seu nome completo profissional
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                id="onboarding-prof"
                type="text"
                value={professionalName}
                onChange={(e) => setProfessionalName(e.target.value)}
                placeholder="Ex: Dra. Camila Santos"
                className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100/60"
              />
            </div>
          </div>

          <div>
            <label htmlFor="onboarding-crn" className="mb-1 block text-xs font-bold text-slate-700">
              CRN / Registro profissional <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <Award className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                id="onboarding-crn"
                type="text"
                value={crn}
                onChange={(e) => setCrn(e.target.value)}
                placeholder="Ex: CRN-3 / 12.345"
                className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100/60"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 min-h-12 w-full rounded-2xl bg-emerald-600 px-4 font-bold text-white shadow-sm hover:bg-emerald-700 transition active:scale-[0.98] disabled:opacity-60 cursor-pointer"
          >
            {submitting ? 'Inicializando seu consultório…' : 'Iniciar no meu consultório'}
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <LogOut className="size-3.5" />
              <span>Sair da conta ({user?.email})</span>
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
