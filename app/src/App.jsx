import { useEffect, useState, lazy, Suspense } from 'react';
import AppLayout from './layout/AppLayout.jsx';
import { useAppSettings } from './features/configuracoes/useAppSettings.js';
import { AuthProvider } from './features/auth/AuthContext.jsx';
import { useAuth } from './features/auth/useAuth.js';
import LoginPage from './features/auth/LoginPage.jsx';
import CreateClinicOnboarding from './features/auth/components/CreateClinicOnboarding.jsx';
import { PatientProvider } from './features/pacientes/PatientContext.jsx';
import { readAppMode, writeAppMode } from './routing.js';

const AvaliacaoPage = lazy(() => import('./features/avaliacao/AvaliacaoPage.jsx'));
const AnamnesePage = lazy(() => import('./features/anamnese/AnamnesePage.jsx'));
const AtendimentoPage = lazy(() => import('./features/atendimento/AtendimentoPage.jsx'));
const AgendaPage = lazy(() => import('./features/agenda/AgendaPage.jsx'));
const ContratosPage = lazy(() => import('./features/contratos/ContratosPage.jsx'));
const FinancasPage = lazy(() => import('./features/financas/FinancasPage.jsx'));
const TarefasPage = lazy(() => import('./features/tarefas/TarefasPage.jsx'));
const MarketingPage = lazy(() => import('./features/marketing/MarketingPage.jsx'));
const DietasPage = lazy(() => import('./features/dietas/DietasPage.jsx'));
const ProdutosPage = lazy(() => import('./features/produtos/ProdutosPage.jsx'));
const PublicSignaturePage = lazy(() => import('./features/contratos/PublicSignaturePage.jsx'));
const PacientesPage = lazy(() => import('./features/pacientes/PacientesPage.jsx'));
const CrmPage = lazy(() => import('./features/crm/CrmPage.jsx'));

export default function App() {
  return <AuthProvider><AppRouter /></AuthProvider>;
}

function AppRouter() {
  const [appMode, setMode] = useState(readAppMode);
  const { user, organizationId, loading, error } = useAuth();

  useEffect(() => {
    const navigate = () => setMode(readAppMode());
    window.addEventListener('hashchange', navigate);
    window.addEventListener('popstate', navigate);
    return () => {
      window.removeEventListener('hashchange', navigate);
      window.removeEventListener('popstate', navigate);
    };
  }, []);

  if (appMode.startsWith('sign-')) {
    const contractId = appMode.replace('sign-', '');
    return <Suspense fallback={<p className="p-8 text-center text-slate-500">Carregando...</p>}><PublicSignaturePage contractId={contractId} /></Suspense>;
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center text-sm font-semibold text-slate-500">Preparando seu consultório…</main>;
  if (!user) return <LoginPage />;
  if (!organizationId) return <CreateClinicOnboarding />;

  return <ClinicalApp appMode={appMode} setMode={setMode} />;
}

function ClinicalApp({ appMode, setMode }) {
  const settings = useAppSettings();
  const { canAccessModule } = useAuth();

  const setAppMode = (mode) => {
    const nextMode = writeAppMode(mode);
    if (nextMode) setMode(nextMode);
  };

  const pages = {
    pacientes: <PacientesPage onNavigate={setAppMode} activeModel={settings.selectedModel} />,
    crm: <CrmPage onNavigate={setAppMode} activeModel={settings.selectedModel} />,
    laudo: <AvaliacaoPage settings={settings} />,
    anamnese: <AnamnesePage activeModel={settings.selectedModel} />,
    dietas: <DietasPage settings={settings} />,
    produtos: <ProdutosPage />,
    dashboard: <AtendimentoPage activeModel={settings.selectedModel} onNavigate={setAppMode} nutritionist={settings.nutritionist} />,
    agenda: <AgendaPage />,
    tarefas: <TarefasPage />,
    contratos: <ContratosPage activeModel={settings.selectedModel} nutritionist={settings.nutritionist} />,
    financas: <FinancasPage />,
    marketing: <MarketingPage activeModel={settings.selectedModel} />,
  };

  return <PatientProvider>
    <AppLayout settings={settings} appMode={appMode} setAppMode={setAppMode}>
      <Suspense fallback={<p className="p-8 text-center">Carregando módulo…</p>}>
        <main className="app-main relative z-10 mx-auto w-full max-w-[1600px] min-w-0 px-3 pb-24 pt-4 sm:px-5 md:pb-8 md:pt-5 print:p-0">
          {canAccessModule(appMode) ? pages[appMode] : (
            <section role="alert" className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-900">
              Seu perfil não possui permissão para acessar este módulo.
            </section>
          )}
        </main>
      </Suspense>
    </AppLayout>
  </PatientProvider>;
}
