import { lazy, Suspense } from 'react';
import { AvaliacaoContext } from './AvaliacaoContext.jsx';
import { useAvaliacao } from './hooks/useAvaliacao.js';
import ProgressSteps from './components/ProgressSteps.jsx';
import UploadExames from './components/UploadExames.jsx';
import SelecaoMetricas from './components/SelecaoMetricas.jsx';
const LaudoReport = lazy(() => import('./report/LaudoReport.jsx'));
export default function AvaliacaoPage({ settings }) {
 const evaluation = useAvaliacao(settings);
 return <AvaliacaoContext.Provider value={{ ...evaluation, nutritionist: settings.nutritionist }}><ProgressSteps /><UploadExames /><SelecaoMetricas />{evaluation.currentStep === 3 && <Suspense fallback={<p>Preparando laudo…</p>}><LaudoReport /></Suspense>}</AvaliacaoContext.Provider>;
}
