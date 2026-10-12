import React, { useState } from 'react';
import {
  Bell,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react';
import logoPlatform from '../assets/logo_new.png';
import NotificationPopover from '../features/notificacoes/NotificationPopover.jsx';
import { useTasks } from '../features/tarefas/hooks/useTasks.js';
import MobileNavigation from './MobileNavigation.jsx';
import { getModeLabel, NAV_ITEMS } from './navigationItems.js';
import { useAuth } from '../features/auth/useAuth.js';
import PatientSelector from '../features/pacientes/components/PatientSelector.jsx';
import TeamPermissionsModal from '../features/auth/components/TeamPermissionsModal.jsx';

const getNotificationDismissalKey = (notification) =>
  `${notification.id}|${notification.title}|${notification.description}`;

const getInitials = (name = '') => {
  const relevantNames = name
    .replace(/^(dra?\.?|nutri\.?)/i, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return relevantNames.slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'NI';
};

export default function Navbar({
  settings,
  appMode,
  setAppMode,
  isSidebarCollapsed = false,
  onToggleSidebar,
}) {
  const { signOut, isOwner, canAccessModule } = useAuth();
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const {
    nutritionist,
    activeModal,
    setActiveModal,
    isNotificationOpen,
    setIsNotificationOpen,
    notificationsList,
    liveNotificationsEnabled,
    toggleLiveNotifications,
  } = settings;
  const { metrics: taskMetrics } = useTasks();
  const [dismissedNotificationKeys, setDismissedNotificationKeys] = useState(() => new Set());

  const taskNotifications = taskMetrics.todayTotal > 0 ? [{
    id: 'tasks_today',
    title: `Você tem ${taskMetrics.todayTotal} demanda(s) pendente(s) hoje`,
    description: 'Clique aqui para abrir a central de tarefas e organizar o follow-up de seus pacientes.',
    timeAgo: 'Agora',
    category: 'tasks',
    targetMode: 'tarefas',
  }] : [];
  const allNotifications = [...taskNotifications, ...notificationsList];
  const visibleNotifications = allNotifications.filter(
    (notification) => !dismissedNotificationKeys.has(getNotificationDismissalKey(notification)),
  );
  const userFirstName = nutritionist.name?.replace(/^(dra?\.?\s*)/i, '').split(' ')[0] || 'Nutricionista';

  const dismissNotification = (notification) => {
    const dismissalKey = getNotificationDismissalKey(notification);
    setDismissedNotificationKeys((currentKeys) => {
      if (currentKeys.has(dismissalKey)) return currentKeys;
      const nextKeys = new Set(currentKeys);
      nextKeys.add(dismissalKey);
      return nextKeys;
    });
  };

  const navigateTo = (mode) => {
    setAppMode(mode);
    setIsNotificationOpen(false);
  };

  const openSettings = (modal) => {
    setActiveModal(activeModal === modal ? null : modal);
  };

  return (
    <>
      <aside className={`app-sidebar fixed inset-y-4 left-4 z-40 hidden flex-col overflow-hidden rounded-[1.75rem] border border-white/75 bg-white/70 shadow-[0_20px_55px_rgba(33,65,86,0.10)] backdrop-blur-2xl transition-[width] duration-300 ease-out md:flex print:hidden ${
        isSidebarCollapsed ? 'w-20' : 'w-[12.5rem] lg:w-[15rem]'
      }`}>
        <div className={`flex h-20 shrink-0 items-center border-b border-slate-200/55 ${
          isSidebarCollapsed ? 'justify-center px-2' : 'justify-between gap-2 px-4 lg:px-5'
        }`}>
          {isSidebarCollapsed ? null : (
            <img src={logoPlatform} alt="NutrIsa" className="h-11 lg:h-12 min-w-0 max-w-[9rem] lg:max-w-[10.5rem] object-contain object-left drop-shadow-2xs" />
          )}
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-controls="primary-sidebar-navigation"
            aria-expanded={!isSidebarCollapsed}
            aria-label={isSidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            title={isSidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
            className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200/70 bg-white/65 text-slate-500 transition-colors hover:border-emerald-200 hover:bg-white hover:text-emerald-700"
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
          </button>
        </div>

        <nav id="primary-sidebar-navigation" className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-5 no-scrollbar" aria-label="Navegação principal">
          {isSidebarCollapsed ? null : (
            <p className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Consultório</p>
          )}
          {NAV_ITEMS.filter((item) => canAccessModule(item.id)).map((item) => {
            const Icon = item.icon;
            const isActive = appMode === item.id;
            const badge = item.id === 'tarefas' && taskMetrics.todayTotal > 0 ? taskMetrics.todayTotal : null;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={isSidebarCollapsed ? `${item.label}${badge ? `, ${badge} tarefas pendentes` : ''}` : undefined}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`group relative flex min-h-11 w-full items-center rounded-2xl text-left text-sm font-semibold transition-all duration-200 ${
                  isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
                } ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50/80 text-emerald-800 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.14),0_6px_18px_rgba(16,185,129,0.08)]'
                    : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
                }`}
              >
                <span className={`flex size-8 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  isActive ? 'bg-white/85 text-emerald-700 shadow-2xs' : 'text-slate-500 group-hover:bg-white/80'
                }`}>
                  <Icon className="size-[18px]" strokeWidth={1.9} />
                </span>
                {isSidebarCollapsed ? null : <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                {badge ? (
                  <span className={`flex items-center justify-center rounded-full bg-rose-500 font-black text-white ${
                    isSidebarCollapsed
                      ? 'absolute right-0.5 top-0.5 min-w-4 px-1 text-[9px] leading-4 ring-2 ring-white/80'
                      : 'min-w-5 px-1.5 text-[10px] leading-5'
                  }`}>
                    {badge > 9 ? '9+' : badge}
                  </span>
                ) : null}
                {isActive ? <span className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-emerald-500" /> : null}
              </button>
            );
          })}
        </nav>

        <div className="shrink-0 space-y-1 border-t border-slate-200/55 p-3">
          <button
            type="button"
            onClick={() => openSettings('ai')}
            aria-pressed={activeModal === 'ai'}
            aria-label={isSidebarCollapsed ? 'Configurar inteligência artificial' : undefined}
            title={isSidebarCollapsed ? 'Configurar IA' : undefined}
            className={`flex min-h-11 w-full items-center rounded-2xl text-sm font-semibold transition-colors ${
              isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
            } ${
              activeModal === 'ai' ? 'bg-amber-50 text-amber-800' : 'text-slate-600 hover:bg-white/75 hover:text-slate-900'
            }`}
          >
            <span className="flex size-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><Sparkles className="size-[17px]" /></span>
            {isSidebarCollapsed ? null : <span>Configurar IA</span>}
          </button>
          <button
            type="button"
            onClick={() => openSettings('profile')}
            aria-pressed={activeModal === 'profile'}
            aria-label={isSidebarCollapsed ? 'Abrir configurações' : undefined}
            title={isSidebarCollapsed ? 'Configurações' : undefined}
            className={`flex min-h-11 w-full items-center rounded-2xl text-sm font-semibold transition-colors ${
              isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
            } ${
              activeModal === 'profile' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-white/75 hover:text-slate-900'
            }`}
          >
            <span className="flex size-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Settings className="size-[17px]" /></span>
            {isSidebarCollapsed ? null : <span>Configurações</span>}
          </button>
        </div>
      </aside>

      <header className={`sticky top-0 z-30 px-3 pt-3 transition-[margin] duration-300 ease-out md:px-5 md:pt-4 print:hidden ${
        isSidebarCollapsed ? 'md:ml-24' : 'md:ml-[13.5rem] lg:ml-64'
      }`}>
        <div className="flex h-16 min-w-0 items-center gap-2 rounded-2xl border border-white/80 bg-white/70 px-3 shadow-[0_12px_36px_rgba(33,65,86,0.07)] backdrop-blur-2xl sm:px-4 md:ml-auto md:w-fit md:border-transparent md:bg-transparent md:px-0 md:shadow-none md:backdrop-blur-none">
          <img src={logoPlatform} alt="NutrIsa" className="h-8 w-auto shrink-0 object-contain md:hidden" />
          <span className="min-w-0 flex-1 truncate px-1 text-center text-sm font-extrabold text-slate-800 sm:text-left md:hidden">{getModeLabel(appMode)}</span>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <PatientSelector />
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                title="Notificações e alertas do consultório"
                aria-label="Notificações e alertas do consultório"
                aria-expanded={isNotificationOpen}
                className={`relative flex size-11 items-center justify-center rounded-2xl border transition-all ${
                  isNotificationOpen
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200/65 bg-white/55 text-slate-600 hover:border-emerald-200 hover:bg-white/90 hover:text-emerald-700'
                }`}
              >
                <Bell className="size-[18px]" strokeWidth={1.9} />
                {visibleNotifications.length > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white ring-2 ring-white">
                    {visibleNotifications.length > 9 ? '9+' : visibleNotifications.length}
                  </span>
                ) : null}
              </button>

              <NotificationPopover
                isOpen={isNotificationOpen}
                notifications={visibleNotifications}
                liveEnabled={liveNotificationsEnabled}
                onToggleLive={toggleLiveNotifications}
                onClose={() => setIsNotificationOpen(false)}
                onDismiss={dismissNotification}
                onConfirmAppointment={settings.handleConfirmAppointment}
                onCancelAppointment={settings.handleCancelAppointment}
                onAction={(notification) => {
                  if (notification.targetMode) navigateTo(notification.targetMode);
                }}
              />
            </div>

            {isOwner ? (
              <button
                type="button"
                onClick={() => setIsTeamModalOpen(true)}
                className="flex size-11 items-center justify-center rounded-2xl border border-slate-200/65 bg-white/55 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                title="Equipe & Permissões da Clínica"
                aria-label="Equipe & Permissões da Clínica"
              >
                <Users className="size-[18px]" strokeWidth={1.9} />
              </button>
            ) : null}

            <button type="button" onClick={signOut} className="flex size-11 items-center justify-center rounded-2xl border border-slate-200/65 bg-white/55 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700" title="Sair do sistema" aria-label="Sair do sistema"><LogOut className="size-[18px]" /></button>

            <button
              type="button"
              onClick={() => openSettings('profile')}
              className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200/65 bg-white/55 p-1 pr-1.5 text-left transition hover:border-emerald-200 hover:bg-white/90 sm:pr-3"
              title={`Perfil conectado: ${nutritionist.name}`}
              aria-label={`Abrir perfil de ${nutritionist.name}`}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-[11px] font-extrabold text-white shadow-sm ring-1 ring-white/80">{getInitials(nutritionist.name)}</span>
              <span className="hidden min-w-0 sm:block">
                <span className="block max-w-28 truncate text-xs font-extrabold text-slate-800 lg:max-w-40">Dra. {userFirstName}</span>
                <span className="hidden max-w-40 truncate text-[10px] font-medium text-slate-500 lg:block">{nutritionist.crn || 'Nutricionista'}</span>
              </span>
              <ChevronDown className="hidden size-3.5 text-slate-400 sm:block" />
            </button>
          </div>
        </div>
      </header>

      <MobileNavigation
        appMode={appMode}
        setAppMode={setAppMode}
        activeModal={activeModal}
        setActiveModal={setActiveModal}
        taskCount={taskMetrics.todayTotal}
      />

      {isTeamModalOpen ? (
        <TeamPermissionsModal
          open={isTeamModalOpen}
          onClose={() => setIsTeamModalOpen(false)}
        />
      ) : null}
    </>
  );
}
