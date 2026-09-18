import React from 'react';

import logoPlatform from '../assets/logo_new.png';

import { Sparkles, Settings, Activity, Calendar, FileText, MessageSquare, Bell, FileSignature } from 'lucide-react';

import NotificationPopover from '../features/notificacoes/NotificationPopover.jsx';
export default function Navbar({ settings, appMode, setAppMode }) {
const { nutritionist, activeModal, setActiveModal, isNotificationOpen, setIsNotificationOpen, notificationsList, liveNotificationsEnabled, toggleLiveNotifications } = settings;
return (<>      {/* Top Navbar - Clean SaaS / CRM Style - Hidden on Print */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-teal-900/5 sticky top-0 z-40 print:hidden transition-all shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-6">
          
          {/* 1. Left Section: Bigger Brand Logo + Navigation Tabs */}
          <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6">
            
            {/* Brand Logo */}
            <div className="flex items-center shrink-0 py-1">
              <img 
                src={logoPlatform} 
                alt="NutrIsa" 
                className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto object-contain transition-all hover:scale-105 drop-shadow-2xs" 
              />
            </div>

            {/* Navigation Tabs aligned to the left */}
            <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 shadow-2xs gap-0.5 sm:gap-1">
              {[
                { id: 'laudo', label: 'Avaliação', icon: Activity },
                { id: 'anamnese', label: 'Anamnese', icon: FileText },
                { id: 'dashboard', label: 'Atendimento', icon: MessageSquare },
                { id: 'agenda', label: 'Agenda', icon: Calendar },
                { id: 'contratos', label: 'Contratos', icon: FileSignature },
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
                    className={`group relative px-2.5 py-1.5 lg:px-3.5 lg:py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ease-out flex items-center justify-center cursor-pointer ${
                      isActive 
                        ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/60' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4 lg:w-3.5 lg:h-3.5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                    <span className="inline-block max-w-0 opacity-0 overflow-hidden whitespace-nowrap transition-all duration-300 ease-out group-hover:max-w-28 group-hover:opacity-100 group-hover:ml-1.5 lg:max-w-none lg:opacity-100 lg:ml-1.5">
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Right Section: Quick Action Buttons & Simple User Profile */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            
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
                {notificationsList.length > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[9px] font-black rounded-full ring-2 ring-white flex items-center justify-center animate-pulse">
                    {notificationsList.length}
                  </span>
                )}
              </button>

              {/* Modal Dropdown de Notificações */}
              <NotificationPopover
                isOpen={isNotificationOpen}
                notifications={notificationsList}
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
