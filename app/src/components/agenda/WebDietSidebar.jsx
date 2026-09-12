import React from 'react';
import { Plus, Calendar, Share2, LogOut } from 'lucide-react';
import { colorMapper } from '../../utils/googleCalendarMapper';

export default function WebDietSidebar({ 
  calendarName = 'Calendário Principal', 
  onDisconnect, 
  onNewEvent,
  blockedDates = [],
  onOpenBlockModal
}) {
  const categoriesList = Object.values(colorMapper.categories).filter((c, idx, arr) => 
    arr.findIndex(x => x.label === c.label) === idx && c.label !== 'Consulta'
  );

  const statusesList = Object.values(colorMapper.statuses);

  return (
    <div className="w-full lg:w-64 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col space-y-6 text-slate-700 select-none">
      
      {/* 1. Meus Calendários */}
      <div>
        <div className="mb-2">
          <h3 className="font-bold text-slate-800 text-sm">Meus calendários</h3>
        </div>

        <div className="space-y-2">
          <button className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
            </svg>
            <span>{calendarName}</span>
          </button>

          <button 
            onClick={onNewEvent}
            className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 bg-white border border-emerald-600 text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-bold transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ novo calendário</span>
          </button>
        </div>
      </div>

      {/* 2. Configurações */}
      <div className="border-t border-slate-100 pt-4">
        <div className="mb-3">
          <h3 className="font-bold text-slate-800 text-sm">Configurações</h3>
        </div>

        <div className="space-y-2.5 text-xs text-slate-600 font-medium">
          {onDisconnect && (
            <button 
              onClick={onDisconnect}
              className="flex items-center space-x-2.5 hover:text-rose-600 transition-colors w-full text-left cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              <span>Desvincular Google</span>
            </button>
          )}

          {/* Bloquear Datas perfeitamente alinhado e sem bordas */}
          <button
            onClick={onOpenBlockModal}
            className="flex items-center justify-between hover:text-slate-900 transition-colors w-full text-left cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <Calendar className={`w-3.5 h-3.5 ${blockedDates.length > 0 ? 'text-rose-500' : 'text-slate-400'}`} />
              <span className={blockedDates.length > 0 ? 'text-rose-600 font-semibold' : ''}>
                Bloquear datas
              </span>
            </div>
            {blockedDates.length > 0 && (
              <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded-full font-bold">
                {blockedDates.length}
              </span>
            )}
          </button>

          <div className="flex items-center justify-between text-slate-400 select-none w-full">
            <div className="flex items-center space-x-2.5">
              <Share2 className="w-3.5 h-3.5 text-slate-300" />
              <span>Exportar</span>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
              em breve
            </span>
          </div>
        </div>
      </div>

      {/* 3. Legendas */}
      <div className="border-t border-slate-100 pt-4 space-y-4">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Legendas</h3>
        </div>

        {/* Cor de Fundo */}
        <div>
          <p className="text-xs font-bold text-slate-800 mb-2.5">Cor de fundo:</p>
          <div className="space-y-2">
            {categoriesList.map((cat, idx) => (
              <div key={idx} className="flex items-center space-x-2.5 text-xs text-slate-700">
                <span 
                  className="w-5 h-3.5 rounded-[4px] shadow-sm flex-shrink-0"
                  style={{ backgroundColor: cat.hexBg }}
                />
                <span className="truncate">{cat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cor da Borda */}
        <div className="pt-2">
          <p className="text-xs font-bold text-slate-800 mb-2.5">Cor da borda:</p>
          <div className="space-y-2">
            {statusesList.map((st, idx) => (
              <div key={idx} className="flex items-center space-x-2.5 text-xs text-slate-700">
                <span 
                  className="w-5 h-3.5 rounded-[4px] bg-white border-2 flex-shrink-0"
                  style={{ borderColor: st.hexBorder }}
                />
                <span className="truncate">{st.label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
