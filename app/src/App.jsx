import { useEffect, useState, lazy, Suspense } from 'react';
import AppLayout from './layout/AppLayout.jsx';
import { useAppSettings } from './features/configuracoes/useAppSettings.js';
const AvaliacaoPage = lazy(() => import('./features/avaliacao/AvaliacaoPage.jsx'));
const AnamnesePage = lazy(() => import('./features/anamnese/AnamnesePage.jsx'));
const AtendimentoPage = lazy(() => import('./features/atendimento/AtendimentoPage.jsx'));
const AgendaPage = lazy(() => import('./features/agenda/AgendaPage.jsx'));
const ContratosPage = lazy(() => import('./features/contratos/ContratosPage.jsx'));
const TarefasPage = lazy(() => import('./features/tarefas/TarefasPage.jsx'));
const PublicSignaturePage = lazy(() => import('./features/contratos/PublicSignaturePage.jsx'));
const MODES = ['laudo', 'anamnese', 'dashboard', 'agenda', 'tarefas', 'contratos'];
const readMode = () => {
  let hash = window.location.hash;
  if (hash.startsWith('#')) hash = hash.slice(1);
  
  // Limpa trailing slashes e parâmetros extras para segurança
  hash = hash.split('?')[0].replace(/\/$/, '');
  
  if (!hash) return 'laudo';
  if (hash.startsWith('sign-')) return hash;
  return MODES.includes(hash) ? hash : 'laudo';
};

export default function App() {
  const settings = useAppSettings();
  const [appMode, setMode] = useState(readMode);

  useEffect(() => {
    const navigate = () => {
      const mode = readMode();
      setMode(mode);
    };
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);

  const setAppMode = mode => {
    if (!MODES.includes(mode) && !mode.startsWith('sign-')) return;
    if (window.location.hash !== `#${mode}`) {
      window.location.hash = mode;
    }
    setMode(mode);
  };
  const pages = {
    laudo: <AvaliacaoPage settings={settings} />,
    anamnese: <AnamnesePage activeModel={settings.selectedModel} />,
    dashboard: <AtendimentoPage activeModel={settings.selectedModel} />,
    agenda: <AgendaPage />,
    tarefas: <TarefasPage />,
    contratos: <ContratosPage activeModel={settings.selectedModel} />,
  };

  // Rota Pública (Assinatura)
  if (appMode.startsWith('sign-')) {
    const contractId = appMode.replace('sign-', '');
    return (
      <Suspense fallback={<p className="p-8 text-center text-slate-500">Carregando...</p>}>
        <PublicSignaturePage contractId={contractId} />
      </Suspense>
    );
  }

  return <AppLayout settings={settings} appMode={appMode} setAppMode={setAppMode}>
    <Suspense fallback={<p className="p-8 text-center">Carregando módulo…</p>}>
    <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 relative z-10 print:p-0">
      {pages[appMode]}
    </main>
    </Suspense>
  </AppLayout>;
}
