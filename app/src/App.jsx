import { useEffect, useState, lazy, Suspense } from 'react';
import AppLayout from './layout/AppLayout.jsx';
import { useAppSettings } from './features/configuracoes/useAppSettings.js';
const AvaliacaoPage = lazy(() => import('./features/avaliacao/AvaliacaoPage.jsx'));
const AnamnesePage = lazy(() => import('./features/anamnese/AnamnesePage.jsx'));
const AtendimentoPage = lazy(() => import('./features/atendimento/AtendimentoPage.jsx'));
const AgendaPage = lazy(() => import('./features/agenda/AgendaPage.jsx'));
const MODES = ['laudo', 'anamnese', 'dashboard', 'agenda'];
const readMode = () => MODES.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'laudo';
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
    if (!MODES.includes(mode)) return;
    location.hash = mode;
    setMode(mode);
  };
  const pages = {
    laudo: <AvaliacaoPage settings={settings} />,
    anamnese: <AnamnesePage activeModel={settings.selectedModel} />,
    dashboard: <AtendimentoPage activeModel={settings.selectedModel} />,
    agenda: <AgendaPage />,
  };
  return <AppLayout settings={settings} appMode={appMode} setAppMode={setAppMode}>
    <Suspense fallback={<p className="p-8 text-center">Carregando módulo…</p>}>
    <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 relative z-10 print:p-0">
      {pages[appMode]}
    </main>
    </Suspense>
  </AppLayout>;
}
