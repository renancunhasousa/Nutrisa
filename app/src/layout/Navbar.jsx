import React from 'react';

import logoPlatform from '../assets/logo_new.png';

import { Sparkles, Settings, Activity, Calendar, FileText, MessageSquare, Bell, FileSignature, CheckSquare, UtensilsCrossed } from 'lucide-react';

import NotificationPopover from '../features/notificacoes/NotificationPopover.jsx';
import { useTasks } from '../features/tarefas/hooks/useTasks.js';

export default function Navbar({ settings, appMode, setAppMode }) {
const { nutritionist, activeModal, setActiveModal, isNotificationOpen, setIsNotificationOpen, notificationsList, liveNotificationsEnabled, toggleLiveNotifications } = settings;
const { metrics: taskMetrics } = useTasks();

return (<>      {/* Top Navbar - Clean SaaS / CRM Style - Hidden on Print */}
      <header className="bg-white/85 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-40 print:hidden transition-all shadow-xs">
        <div className="max-w-[1560px] mx-auto px-3 sm:px-4 md:px-6 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4 md:gap-6">
          
          {/* 1. Left Section: Brand Logo + Navigation Tabs */}
          <div className="flex items-center gap-3 sm:gap-4 md:gap-5 min-w-0 flex-1">
            
            {/* Brand Logo */}
            <div className="flex items-center shrink-0 py-1">
              <img 
                src={logoPlatform} 
                alt="NutrIsa" 
                className="h-8 sm:h-9 w-auto object-contain transition-all hover:scale-105 drop-shadow-2xs" 
              />
            </div>

            {/* Navigation Tabs aligned to the left */}
            <nav className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 shadow-2xs gap-0.5 sm:gap-1 overflow-x-auto no-scrollbar">
              {[
                { id: 'laudo', label: 'Avaliação', icon: Activity },
                { id: 'anamnese', label: 'Anamnese', icon: FileText },
                { id: 'dietas', label: 'Dietas', icon: UtensilsCrossed },
                { id: 'dashboard', label: 'Atendimento', icon: MessageSquare },
                { id: 'agenda', label: 'Agenda', icon: Calendar },
                { id: 'tarefas', label: 'Tarefas', icon: CheckSquare },
                { id: 'contratos', label: 'Contratos', icon: FileSignature },
                { id: 'marketing', label: 'Marketing', icon: Sparkles },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = appMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAppMode(tab.id)}
                    title={tab.label}
                    aria-label={tab.label}
                    className={`relative shrink-0 h-8 sm:h-8.5 px-2 sm:px-2.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center cursor-pointer ${
                      isActive 
                        ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80 font-bold' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/70 border border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    
                    {/* Exibe o nome completo das 8 features em telas desktop (lg e acima) */}
                    <span className="ml-1.5 whitespace-nowrap hidden lg:inline-block">
                      {tab.label}
                    </span>

                    {/* Em telas menores (< lg), exibe o nome da aba ativa para economizar espaço */}
                    {isActive && (
                      <span className="ml-1.5 whitespace-nowrap inline-block lg:hidden font-bold">
                        {tab.label}
                      </span>
                    )}

                    {isActive && (
                      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-2.5 h-0.5 rounded-full bg-emerald-600" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* 2. Right Section: Quick Action Buttons & Simple User Profile */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0 relative z-10 pl-2 sm:pl-3 border-l border-slate-200/90">
            
            {/* Botão de Notificações com Popover Inteligente */}
            <div className="relative">
              <button 
                type="button"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                title="Notificações e Alertas do Consultório"
                className={`p-2 rounded-xl transition-all relative border cursor-pointer ${
                  isNotificationOpen 
                    ? 'bg-slate-100 text-slate-900 border-slate-300' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-transparent'
                }`}
              >
                <Bell className="w-4 h-4" />
                {(() => {
                  const totalNotifs = notificationsList.length + (taskMetrics.todayTotal > 0 ? 1 : 0);
                  if (totalNotifs === 0) return null;
                  return (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[9px] font-black rounded-full ring-2 ring-white flex items-center justify-center animate-pulse">
                      {totalNotifs}
                    </span>
                  );
                })()}
              </button>

              {/* Modal Dropdown de Notificações */}
              <NotificationPopover
                isOpen={isNotificationOpen}
                notifications={[
                  ...(taskMetrics.todayTotal > 0 ? [{
                    id: 'tasks_today',
                    title: `Você tem ${taskMetrics.todayTotal} demanda(s) pendente(s) hoje`,
                    description: 'Clique aqui para abrir a central de tarefas e organizar o follow-up de seus pacientes.',
                    timeAgo: 'Agora',
                    category: 'tasks',
                    targetMode: 'tarefas',
                  }] : []),
                  ...notificationsList
                ]}
                liveEnabled={liveNotificationsEnabled}
                onToggleLive={toggleLiveNotifications}
                onClose={() => setIsNotificationOpen(false)}
                onConfirmAppointment={settings.handleConfirmAppointment}
                onCancelAppointment={settings.handleCancelAppointment}
                onAction={(notif) => {
                  if (notif.targetMode) {
                    setAppMode(notif.targetMode);
                  }
                }}
              />
            </div>

            {/* Configuração de IA */}
            <button 
              onClick={() => setActiveModal(activeModal === 'ai' ? null : 'ai')}
              title="Configurações de Inteligência Artificial"
              className={`p-2 rounded-xl transition-all border ${
                activeModal === 'ai'
                  ? 'bg-amber-50 text-amber-700 border-amber-300 ring-2 ring-amber-300/40'
                  : 'text-slate-500 hover:text-amber-700 hover:bg-amber-50/80 border-transparent hover:border-amber-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* Configuração do Perfil */}
            <button 
              onClick={() => setActiveModal(activeModal === 'profile' ? null : 'profile')}
              title="Configurações da Clínica e Perfil"
              className={`p-2 rounded-xl transition-all border ${
                activeModal === 'profile'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-300/40'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-transparent'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Divisor Vertical */}
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

            {/* Simple User Profile: Apenas Nome e Foto */}
            <div 
              onClick={() => setActiveModal(activeModal === 'profile' ? null : 'profile')}
              className="flex items-center space-x-2.5 pl-1 py-1 pr-2 rounded-xl hover:bg-slate-100/80 cursor-pointer transition-all border border-transparent hover:border-slate-200/80"
              title="Perfil: Dra. Isabela Muñoz"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shadow-xs ring-2 ring-white shrink-0">
                IM
              </div>
              <span className="text-xs font-bold text-slate-800 hidden sm:inline">
                {nutritionist.name.split(' ')[0] + ' ' + (nutritionist.name.split(' ')[1] || '')}
              </span>
            </div>

          </div>

        </div>
      </header>

</>);
}
