import React, { useMemo } from 'react';
import { Plus, Calendar, Share2, LogOut, Users, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { colorMapper } from '../../utils/googleCalendarMapper';

export default function WebDietSidebar({ 
  calendarName = 'Calendário Principal', 
  onDisconnect, 
  onNewEvent,
  blockedDates = [],
  onOpenBlockModal,
  events = [],
  currentDate
}) {
  const hiddenFromLegend = ['Amigo', 'Encaixe', 'Teste', 'Em grupo'];
  const categoriesList = Object.values(colorMapper.categories).filter((c, idx, arr) => 
    arr.findIndex(x => x.label === c.label) === idx && c.label !== 'Consulta' && !hiddenFromLegend.includes(c.label)
  );

  const statusesList = Object.values(colorMapper.statuses);

  // Calcular métricas da semana atual
  const weekMetrics = useMemo(() => {
    const ref = currentDate ? new Date(currentDate) : new Date();
    const weekStart = new Date(ref);
    weekStart.setDate(ref.getDate() - ref.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    weekEnd.setHours(0, 0, 0, 0);

    const weekEvents = events.filter(ev => {
      const start = ev.start?.dateTime || ev.start?.date;
      if (!start) return false;
      const d = new Date(start);
      return d >= weekStart && d < weekEnd;
    });

    // Total de consultas
    const total = weekEvents.length;

    // Confirmadas
    const confirmed = weekEvents.filter(ev => {
      const status = colorMapper.getStatusByTitleOrDescription(ev);
      return status?.hexBorder === colorMapper.statuses?.confirmado?.hexBorder;
    }).length;

    // Pendentes (sem status definido / colorId nulo)
    const pending = weekEvents.filter(ev => !ev.colorId).length;

    // Dias com evento
    const daysSet = new Set(weekEvents.map(ev => {
      const start = ev.start?.dateTime || ev.start?.date;
      return start ? new Date(start).toDateString() : null;
    }).filter(Boolean));

    // Próximo evento hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayEvents = weekEvents.filter(ev => {
      const start = ev.start?.dateTime || ev.start?.date;
      if (!start) return false;
      const d = new Date(start);
      return d >= today && d < tomorrow;
    });

    return {
      total,
      confirmed,
      pending,
      activeDays: daysSet.size,
      todayCount: todayEvents.length,
    };
  }, [events, currentDate]);

  return (
    <div className="w-full lg:w-64 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col space-y-6 text-slate-700 select-none">
      
      {/* 1. Métricas da Semana */}
      <div>
        <div className="mb-3">
          <h3 className="font-bold text-slate-800 text-sm">Semana atual</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Resumo de consultas</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Total */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span className="text-[10px] font-semibold text-emerald-700">Total</span>
            </div>
            <span className="text-2xl font-black text-emerald-700 leading-none">{weekMetrics.total}</span>
            <span className="text-[9px] text-emerald-600/70">consultas</span>
          </div>

          {/* Hoje */}
          <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
              <span className="text-[10px] font-semibold text-sky-700">Hoje</span>
            </div>
            <span className="text-2xl font-black text-sky-700 leading-none">{weekMetrics.todayCount}</span>
            <span className="text-[9px] text-sky-600/70">agendamentos</span>
          </div>

          {/* Confirmadas */}
          <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-violet-600 flex-shrink-0" />
              <span className="text-[10px] font-semibold text-violet-700">Confirmadas</span>
            </div>
            <span className="text-2xl font-black text-violet-700 leading-none">{weekMetrics.confirmed}</span>
            <span className="text-[9px] text-violet-600/70">confirmadas</span>
          </div>

          {/* Dias ativos */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span className="text-[10px] font-semibold text-amber-700">Dias ativos</span>
            </div>
            <span className="text-2xl font-black text-amber-700 leading-none">{weekMetrics.activeDays}</span>
            <span className="text-[9px] text-amber-600/70">dias com agenda</span>
          </div>
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
