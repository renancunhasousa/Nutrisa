import React from 'react';
import { 
  MessageCircle, 
  MessageSquare, 
  Calendar, 
  ChevronRight, 
  AlertTriangle 
} from 'lucide-react';

export default function NotificationPopover({
  notifications = [],
  isOpen,
  onClose,
  onAction,
  liveEnabled = true,
  onToggleLive
}) {
  if (!isOpen) return null;

  const totalCount = notifications.length;
  const unreadCount = notifications.length;

  return (
    <div className="absolute right-0 top-12 w-80 sm:w-[350px] bg-white rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-slate-100/80 z-50 animate-scale-up overflow-hidden text-slate-800 font-sans">
      
      {/* 1. CABEÇALHO MINIMALISTA COM TOGGLE AO VIVO */}
      <div className="pt-6 px-6 pb-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-black text-sm tracking-tight text-slate-900 uppercase">
            NOTIFICAÇÕES
          </h3>
          <p className="text-[10px] font-bold tracking-tight text-slate-400 mt-0.5">
            {unreadCount} NÃO LIDAS • {totalCount} TOTAL
          </p>
        </div>

        {/* Toggle Ao Vivo */}
        {onToggleLive && (
          <button
            type="button"
            onClick={onToggleLive}
            title={liveEnabled ? "Desativar alertas ao vivo de mensagens pendentes" : "Ativar alertas ao vivo de mensagens pendentes"}
            className={`px-3 py-1 rounded-full text-[10px] font-black tracking-tight transition-all flex items-center space-x-1.5 border active:scale-95 cursor-pointer ${
              liveEnabled 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs' 
                : 'bg-slate-100 text-slate-400 border-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${liveEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
            <span>{liveEnabled ? 'Ao Vivo ON' : 'Ao Vivo OFF'}</span>
          </button>
        )}
      </div>

      {/* 2. CORPO / LISTA DE NOTIFICAÇÕES */}
      <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100/70 p-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
        {notifications.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3">
            {/* Ícone de Balão de Chat Circular e Suave */}
            <div className="w-14 h-14 mx-auto rounded-full bg-slate-50/80 border border-slate-100 flex items-center justify-center text-slate-300">
              <MessageCircle className="w-7 h-7 stroke-[1.5]" />
            </div>
            
            <div className="space-y-0.5">
              <h4 className="text-[11px] font-black tracking-tight uppercase text-slate-500">
                SILÊNCIO POR AQUI...
              </h4>
              <p className="text-[11px] text-slate-400 font-medium">
                Nenhuma notificação encontrada
              </p>
            </div>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                if (onAction) onAction(notif);
                onClose();
              }}
              className={`p-3.5 rounded-2xl transition-all cursor-pointer flex items-start space-x-3 hover:bg-slate-50/90 border ${
                notif.type === 'danger'
                  ? 'bg-rose-50/30 border-rose-100/80 hover:border-rose-200'
                  : notif.type === 'warning'
                    ? 'bg-amber-50/30 border-amber-100/80 hover:border-amber-200'
                    : 'bg-emerald-50/30 border-emerald-100/80 hover:border-emerald-200'
              }`}
            >
              {/* Ícone Categoria */}
              <div className="shrink-0 mt-0.5">
                {notif.category === 'whatsapp' ? (
                  <div className="w-8 h-8 rounded-xl bg-purple-100/70 text-purple-800 flex items-center justify-center font-bold text-xs shadow-2xs">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                ) : notif.category === 'month_close' ? (
                  <div className="w-8 h-8 rounded-xl bg-amber-100/70 text-amber-800 flex items-center justify-center font-bold text-xs shadow-2xs">
                    <Calendar className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center font-bold text-xs shadow-2xs">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Informações da Notificação */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-xs text-slate-900 tracking-tight truncate leading-tight">{notif.title}</h4>
                  <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap ml-1">{notif.timeAgo || 'Hoje'}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug font-normal">
                  {notif.description}
                </p>
                {notif.actionLabel && (
                  <div className="pt-1 flex items-center text-[10.5px] font-bold text-emerald-700 hover:text-emerald-900">
                    <span>{notif.actionLabel}</span>
                    <ChevronRight className="w-3 h-3 ml-0.5" />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. RODAPÉ SUTIL */}
      <div className="py-3.5 border-t border-slate-100 text-center bg-white">
        <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
          FIM DAS NOTIFICAÇÕES
        </span>
      </div>

    </div>
  );
}
