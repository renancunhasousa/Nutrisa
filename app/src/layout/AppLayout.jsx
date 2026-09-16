import Navbar from './Navbar.jsx';
import ProfileSettings from '../features/configuracoes/ProfileSettings.jsx';
import AiSettings from '../features/configuracoes/AiSettings.jsx';
import React from 'react';

import { AlertTriangle } from 'lucide-react';

export default function AppLayout({ children, settings, appMode, setAppMode }) {
const { appNotification, setAppNotification } = settings;
return (<div className="min-h-screen bg-gradient-to-br from-[#f0fbf9] via-white to-[#faf8f2] text-slate-800 flex flex-col font-sans relative overflow-x-hidden print:bg-white print:p-0">
      {/* Background Luxury Ambient Glows (Tiffany, Dourado Suave & Branco) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 print:hidden">
        {/* Orbe Tiffany Superior Esquerdo */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-teal-200/25 rounded-full blur-3xl"></div>
        {/* Orbe Dourado Suave Superior Direito */}
        <div className="absolute top-10 -right-20 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl"></div>
        {/* Orbe Tiffany/Esmeralda Médio Central */}
        <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl"></div>
        {/* Orbe Dourado/Champagne Inferior Direito */}
        <div className="absolute -bottom-20 right-10 w-96 h-96 bg-yellow-100/30 rounded-full blur-3xl"></div>
      </div>
      
      <Navbar settings={settings} appMode={appMode} setAppMode={setAppMode} />
      <ProfileSettings settings={settings} />
      <AiSettings settings={settings} />
      {/* Global Fallback & Notification Banner */}
      {appNotification && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 shadow-md flex items-center justify-between text-xs font-semibold animate-fade-in print:hidden border-b border-amber-600">
          <div className="max-w-7xl mx-auto w-full flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-slate-950 flex-shrink-0 animate-bounce" />
            <span>{appNotification.message}</span>
          </div>
          <button 
            onClick={() => setAppNotification(null)}
            className="text-slate-900 hover:text-black font-bold text-sm px-2"
          >
            ✕
          </button>
        </div>
      )}

{children}
</div>);
}
