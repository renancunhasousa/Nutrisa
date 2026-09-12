import React from 'react';
import { Calendar, Clock, Video, MapPin, User, MessageSquare, AlertCircle } from 'lucide-react';
import { colorMapper } from '../../utils/googleCalendarMapper';

export default function AgendaEventCard({ event }) {
  const categoryInfo = colorMapper.getCategoryByEvent(event);
  const statusInfo = colorMapper.getStatusByTitleOrDescription(event);

  // Formatar Horários
  const startTime = event.start?.dateTime ? new Date(event.start.dateTime) : null;
  const endTime = event.end?.dateTime ? new Date(event.end.dateTime) : null;
  
  const timeString = startTime && endTime
    ? `${startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    : 'Horário não definido';

  const isOnline = categoryInfo.label === 'Online';
  const isCanceled = statusInfo.status === 'Desmarcado';

  return (
    <div className={`p-4 rounded-xl border-l-4 ${statusInfo.borderColor} ${categoryInfo.bgColor} shadow-sm relative group overflow-hidden transition-all hover:shadow-md`}>
      
      {/* Background Icon (Watermark) */}
      <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
        {isOnline ? <Video size={100} /> : <User size={100} />}
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className={`font-bold text-sm ${categoryInfo.textColor} line-clamp-1`}>
              {event.summary || 'Sem Título'}
            </h4>
            <div className="flex items-center text-xs text-slate-600 mt-1 font-medium space-x-2">
              <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {timeString}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${categoryInfo.textColor} bg-white/50`}>
                {categoryInfo.label}
              </span>
            </div>
          </div>
          
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusInfo.badgeColor} border ${statusInfo.borderColor} flex-shrink-0`}>
            {statusInfo.status}
          </span>
        </div>

        {event.description && (
          <p className="text-xs text-slate-700/80 line-clamp-2 mt-1 italic">
            {event.description}
          </p>
        )}

        <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between">
          <div className="flex space-x-2">
            {isOnline && (
              <a 
                href={event.hangoutLink || '#'} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center text-[10px] font-bold text-blue-600 bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded transition-colors"
                title="Abrir Google Meet"
              >
                <Video className="w-3 h-3 mr-1" /> Meet
              </a>
            )}
            {!isOnline && event.location && (
              <span className="flex items-center text-[10px] font-medium text-slate-600 bg-white/50 px-2 py-1 rounded">
                <MapPin className="w-3 h-3 mr-1" /> Presencial
              </span>
            )}
          </div>

          <div className="flex space-x-1">
            {isCanceled ? (
              <button 
                title="Avisar Lista de Espera"
                className="p-1.5 bg-rose-100 text-rose-600 hover:bg-rose-200 rounded-md transition-colors"
              >
                <AlertCircle className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button 
                title="Conversar no WhatsApp"
                className="p-1.5 bg-emerald-100 text-emerald-600 hover:bg-emerald-200 rounded-md transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
