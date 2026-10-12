import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Navbar from './Navbar.jsx';
import ProfileSettings from '../features/configuracoes/ProfileSettings.jsx';
import AiSettings from '../features/configuracoes/AiSettings.jsx';

const SIDEBAR_COLLAPSED_KEY = 'nutrisa_sidebar_collapsed';

export default function AppLayout({ children, settings, appMode, setAppMode }) {
  const { appNotification, setAppNotification } = settings;
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isSidebarCollapsed));
    } catch {}
  }, [isSidebarCollapsed]);

  return (
    <div
      className="app-shell relative min-h-screen min-w-0 overflow-x-clip bg-[var(--color-app-background)] font-sans text-slate-800 print:bg-white print:p-0"
      data-sidebar-collapsed={isSidebarCollapsed ? 'true' : 'false'}
    >
      <div className="app-ambient fixed inset-0 z-0 overflow-hidden pointer-events-none print:hidden" aria-hidden="true">
        <span className="app-ambient__orb app-ambient__orb--mint" />
        <span className="app-ambient__orb app-ambient__orb--blue" />
        <span className="app-ambient__orb app-ambient__orb--peach" />
      </div>

      <Navbar
        settings={settings}
        appMode={appMode}
        setAppMode={setAppMode}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed((current) => !current)}
      />
      <ProfileSettings settings={settings} />
      <AiSettings settings={settings} />

      <div className={`relative z-10 transition-[margin] duration-300 ease-out ${
        isSidebarCollapsed ? 'md:ml-24' : 'md:ml-[13.5rem] lg:ml-64'
      }`}>
        {appNotification ? (
          <div className="mx-3 mt-3 flex items-center justify-between gap-2 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-3 py-2.5 text-xs font-semibold text-amber-950 shadow-sm backdrop-blur-xl sm:mx-5 print:hidden">
            <div className="mx-auto flex w-full max-w-7xl min-w-0 items-start gap-2 sm:items-center">
              <AlertTriangle className="size-4 shrink-0 text-amber-700" />
              <span>{appNotification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setAppNotification(null)}
              className="flex size-9 shrink-0 items-center justify-center rounded-xl font-bold text-amber-800 hover:bg-amber-100 hover:text-amber-950"
              aria-label="Fechar aviso"
            >
              ×
            </button>
          </div>
        ) : null}

        {children}
      </div>
    </div>
  );
}
