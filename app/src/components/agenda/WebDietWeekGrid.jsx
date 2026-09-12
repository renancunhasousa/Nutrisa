import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, Lock, Calendar, Clock, User, CheckCircle, X } from 'lucide-react';
import { colorMapper } from '../../utils/googleCalendarMapper';

const START_HOUR = 6;
const END_HOUR = 21;
const HOUR_HEIGHT = 60; // 60px por hora = 1px por minuto

export default function WebDietWeekGrid({
  currentDate,
  onDateChange,
  events = [],
  loading = false,
  onSelectEvent,
  blockedDates = [],
  onToggleBlockDate
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [viewMode, setViewMode] = useState('Semana'); // 'Mês', 'Semana', 'Lista'
  const [highlightedEventId, setHighlightedEventId] = useState(null);
  const searchContainerRef = useRef(null);

  // Fechar dropdown de resultados se clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Formato YYYY-MM-DD
  const formatYMD = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Calcular o início da semana (Domingo) da data selecionada
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const firstDay = new Date(curr);
    // 0 = Domingo
    firstDay.setDate(curr.getDate() - curr.getDay());
    firstDay.setHours(0, 0, 0, 0);

    const days = [];
    const dayNames = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(firstDay);
      d.setDate(firstDay.getDate() + i);
      const dayFormatted = String(d.getDate()).padStart(2, '0');
      const monthFormatted = String(d.getMonth() + 1).padStart(2, '0');
      const ymd = `${d.getFullYear()}-${monthFormatted}-${dayFormatted}`;
      const isBlocked = blockedDates.includes(ymd);

      days.push({
        date: d,
        ymd,
        label: `${dayNames[i]} ${dayFormatted}/${monthFormatted}`,
        dayOfWeek: i,
        isToday: d.toDateString() === new Date().toDateString(),
        isBlocked
      });
    }
    return days;
  }, [currentDate, blockedDates]);

  // Calcular matriz de dias do mês atual para a Visualização 'Mês'
  const monthMatrix = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Início na semana do primeiro dia (Domingo)
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // Fim na semana do último dia (Sábado)
    const endDate = new Date(lastDayOfMonth);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const days = [];
    const curr = new Date(startDate);

    while (curr <= endDate) {
      const dayDate = new Date(curr);
      const mFormatted = String(dayDate.getMonth() + 1).padStart(2, '0');
      const dFormatted = String(dayDate.getDate()).padStart(2, '0');
      const ymd = `${dayDate.getFullYear()}-${mFormatted}-${dFormatted}`;

      days.push({
        date: dayDate,
        dayNumber: dayDate.getDate(),
        ymd,
        isCurrentMonth: dayDate.getMonth() === month,
        isToday: dayDate.toDateString() === new Date().toDateString(),
        isBlocked: blockedDates.includes(ymd)
      });

      curr.setDate(curr.getDate() + 1);
    }
    return days;
  }, [currentDate, blockedDates]);

  // Eventos encontrados pela busca de paciente (para dropdown e salto)
  const searchResults = useMemo(() => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) return [];
    const term = searchTerm.toLowerCase();
    return events.filter(e => 
      (e.summary || '').toLowerCase().includes(term) ||
      (e.description || '').toLowerCase().includes(term)
    ).slice(0, 8);
  }, [events, searchTerm]);

  // Na grade da semana e mês, mantemos todos os eventos visíveis (para não sumir com o calendário ao digitar)
  // Mas na visualização 'Lista', filtramos pelo termo
  const filteredEvents = useMemo(() => {
    return events;
  }, [events]);

  // Lista ordenada de eventos para a Visualização 'Lista'
  const sortedListEvents = useMemo(() => {
    let list = [...events];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(e => 
        (e.summary || '').toLowerCase().includes(term) ||
        (e.description || '').toLowerCase().includes(term)
      );
    }
    return list.sort((a, b) => {
      const timeA = new Date(a.start?.dateTime || a.start?.date).getTime();
      const timeB = new Date(b.start?.dateTime || b.start?.date).getTime();
      return timeA - timeB;
    });
  }, [events, searchTerm]);

  // Função para saltar diretamente para a data do paciente na agenda (sem abrir modal indesejado)
  const handleJumpToEvent = (event) => {
    if (!event.start?.dateTime && !event.start?.date) return;
    const eventDate = new Date(event.start.dateTime || event.start.date);
    onDateChange(eventDate);
    setIsSearchFocused(false);
    
    // Destacar o card visualmente na grade para o usuário localizar na hora
    setHighlightedEventId(event.id);
    setTimeout(() => {
      setHighlightedEventId(null);
    }, 4000);
  };

  // Nome do Mês e Ano por extenso (ex: "Setembro de 2026")
  const monthYearLabel = useMemo(() => {
    const options = { month: 'long', year: 'numeric' };
    const label = currentDate.toLocaleDateString('pt-BR', options);
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [currentDate]);

  // Navegações de acordo com a visualização ativa
  const handlePrev = () => {
    const prev = new Date(currentDate);
    if (viewMode === 'Mês') {
      prev.setMonth(prev.getMonth() - 1);
    } else {
      prev.setDate(prev.getDate() - 7);
    }
    onDateChange(prev);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'Mês') {
      next.setMonth(next.getMonth() + 1);
    } else {
      next.setDate(next.getDate() + 7);
    }
    onDateChange(next);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  // Horas para a régua vertical
  const hoursList = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    hoursList.push(h);
  }

  // Helper para posicionar o evento na coluna do dia
  const getEventPosition = (event) => {
    const start = new Date(event.start?.dateTime || event.start?.date);
    const end = new Date(event.end?.dateTime || event.end?.date);

    let startHours = start.getHours();
    let startMinutes = start.getMinutes();

    // Se começar antes das 6h, fixa nas 6h
    if (startHours < START_HOUR) {
      startHours = START_HOUR;
      startMinutes = 0;
    }

    const top = ((startHours - START_HOUR) * 60 + startMinutes) * (HOUR_HEIGHT / 60);

    const durationMinutes = Math.max(25, (end.getTime() - start.getTime()) / (1000 * 60));
    const height = Math.min(
      durationMinutes * (HOUR_HEIGHT / 60), 
      ((END_HOUR - START_HOUR + 1) * HOUR_HEIGHT) - top
    );

    return { top, height };
  };

  return (
    <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
      
      {/* 1. Header do Calendário WebDiet */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
        
        {/* Mês/Ano & Navegação */}
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight mr-2">
            {monthYearLabel}
          </h2>

          <div className="flex items-center space-x-1">
            <button
              onClick={handleToday}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-emerald-600/20"
            >
              Hoje
            </button>
            <button
              onClick={handlePrev}
              className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Abas e Busca */}
        <div className="flex items-center space-x-3">
          
          {/* Segmented Control Mês / Semana / Lista */}
          <div className="flex rounded-lg overflow-hidden border border-emerald-600">
            {['Mês', 'Semana', 'Lista'].map((mode) => {
              const active = viewMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 text-xs font-bold transition-all ${
                    active 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-white text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  {mode}
                </button>
              );
            })}
          </div>

          {/* Campo de Busca Inteligente com Localização e Salto */}
          <div ref={searchContainerRef} className="relative flex items-center">
            <input
              type="text"
              placeholder="Buscar na agenda..."
              value={searchTerm}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsSearchFocused(true);
              }}
              className="pl-3 pr-8 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-36 sm:w-48 transition-all"
            />
            {searchTerm ? (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setIsSearchFocused(false);
                }}
                className="absolute right-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
            )}

            {/* Dropdown de Resultados da Busca */}
            {isSearchFocused && searchTerm.trim().length >= 2 && (
              <div className="absolute top-full right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-scale-up space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex justify-between items-center">
                  <span>Resultados Encontrados</span>
                  <span>{searchResults.length}</span>
                </div>

                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 font-medium">
                    Nenhum compromisso com "{searchTerm}".
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
                    {searchResults.map(ev => {
                      const category = colorMapper.getCategoryByEvent(ev);
                      const evDate = new Date(ev.start?.dateTime || ev.start?.date);
                      const formattedDate = evDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                      const timeStr = evDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                      return (
                        <div
                          key={ev.id}
                          onClick={() => handleJumpToEvent(ev)}
                          className="p-2 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200/80 transition-all flex items-center justify-between gap-2 text-left"
                        >
                          <div className="flex items-center space-x-2.5 overflow-hidden">
                            <span 
                              className="w-2.5 h-2.5 rounded-full shrink-0" 
                              style={{ backgroundColor: category.hexBg }}
                            />
                            <div className="truncate">
                              <span className="text-xs font-bold text-slate-800 block truncate">
                                {ev.summary || 'Consulta'}
                              </span>
                              <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                                <span>{formattedDate} às {timeStr}</span>
                                <span>•</span>
                                <span className="font-semibold text-slate-500">{category.label}</span>
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full shrink-0 border border-emerald-200">
                            Ir para dia →
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 2. Visualização Semanal (Padrão) */}
      {viewMode === 'Semana' && (
        <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[750px] relative">
          <div className="min-w-[850px] relative">
            
            {/* Linha de Cabeçalho dos Dias */}
            <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-slate-200 sticky top-0 bg-white z-20 shadow-xs text-xs font-bold text-slate-700">
              <div className="py-2.5 text-center text-slate-400 font-medium text-[11px] border-r border-slate-100 flex items-center justify-center">
                hora
              </div>
              {weekDays.map((day, idx) => (
                <div 
                  key={idx} 
                  className={`py-2.5 text-center border-r border-slate-100 last:border-r-0 flex items-center justify-center space-x-1 ${
                    day.isBlocked
                      ? 'bg-slate-800 text-white font-bold'
                      : day.isToday
                      ? 'bg-emerald-50 text-emerald-700'
                      : ''
                  }`}
                >
                  {day.isBlocked && <Lock className="w-3 h-3 text-rose-400 shrink-0 inline" />}
                  <span>{day.label}</span>
                  {day.isBlocked && <span className="text-[9px] uppercase tracking-wider bg-rose-500/30 text-rose-200 px-1 rounded ml-0.5">Bloqueado</span>}
                </div>
              ))}
            </div>

            {/* Grade Principal com Linhas de Horário */}
            <div className="relative grid grid-cols-[64px_repeat(7,1fr)]">
              
              {/* Coluna 0: Horários */}
              <div className="border-r border-slate-100 bg-white select-none">
                {hoursList.map((hour) => (
                  <div 
                    key={hour} 
                    style={{ height: `${HOUR_HEIGHT}px` }}
                    className="text-right pr-2 text-[11px] font-medium text-slate-400 -mt-2.5 first:mt-0 flex items-start justify-end"
                  >
                    {String(hour).padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Colunas 1 a 7: Dias da Semana */}
              {weekDays.map((day, dayIndex) => {
                // Filtrar eventos deste dia específico
                const dayEvents = filteredEvents.filter(e => {
                  if (!e.start?.dateTime && !e.start?.date) return false;
                  const evDate = new Date(e.start.dateTime || e.start.date);
                  return evDate.toDateString() === day.date.toDateString();
                });

                return (
                  <div 
                    key={dayIndex} 
                    className={`relative border-r border-slate-100 last:border-r-0 ${
                      day.isBlocked 
                        ? 'bg-slate-900/60' 
                        : day.isToday 
                        ? 'bg-emerald-500/[0.04]' 
                        : ''
                    }`}
                    style={{ height: `${hoursList.length * HOUR_HEIGHT}px` }}
                  >
                    {/* Linhas horizontais de hora */}
                    {hoursList.map((hour, idx) => (
                      <div 
                        key={idx}
                        style={{ height: `${HOUR_HEIGHT}px` }}
                        className={`border-b ${day.isBlocked ? 'border-slate-700/50' : 'border-slate-100/90 hover:bg-slate-50/50'} transition-colors`}
                      />
                    ))}

                    {/* Overlay Escurecido e Bloqueio de Interações */}
                    {day.isBlocked && (
                      <div className="absolute inset-0 bg-slate-950/40 backdrop-grayscale z-30 flex flex-col items-center justify-center p-2 text-center select-none cursor-not-allowed pointer-events-auto">
                        <div className="bg-slate-900/90 text-white/90 px-3 py-2 rounded-xl shadow-lg border border-slate-700 flex flex-col items-center space-y-1">
                          <Lock className="w-5 h-5 text-rose-400" />
                          <span className="text-[11px] font-bold tracking-wide uppercase text-rose-300">Data Bloqueada</span>
                          <span className="text-[10px] text-slate-400 leading-tight">Agendamentos suspensos neste dia</span>
                        </div>
                      </div>
                    )}

                    {/* Cards de Eventos Posicionados */}
                    {dayEvents.map((event) => {
                      const { top, height } = getEventPosition(event);
                      const category = colorMapper.getCategoryByEvent(event);
                      const status = colorMapper.getStatusByTitleOrDescription(event);
                      const isHighlighted = highlightedEventId === event.id;

                      const startTime = new Date(event.start?.dateTime || event.start?.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                      const endTime = new Date(event.end?.dateTime || event.end?.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                      return (
                        <div
                          key={event.id}
                          onClick={() => onSelectEvent && onSelectEvent(event)}
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            backgroundColor: category.hexBg,
                            borderColor: isHighlighted ? '#10b981' : status.hexBorder
                          }}
                          className={`absolute left-1 right-1 rounded-[6px] border-2 p-1.5 shadow-sm hover:shadow-md hover:brightness-105 cursor-pointer transition-all z-10 flex flex-col justify-start overflow-hidden group ${
                            isHighlighted ? 'ring-4 ring-emerald-400 z-40 scale-[1.03] shadow-lg animate-pulse' : ''
                          }`}
                        >
                          <div className="text-[11px] font-bold text-white leading-tight line-clamp-2 drop-shadow-xs flex items-center justify-between">
                            <span>{event.summary || 'Sem Título'}</span>
                            {isHighlighted && <span className="text-[9px] bg-white text-emerald-700 px-1 rounded font-black">AQUI</span>}
                          </div>
                          <div className="text-[10px] text-white/90 font-semibold mt-0.5 tracking-tight">
                            {startTime} - {endTime}
                          </div>
                        </div>
                      );
                    })}

                  </div>
                );
              })}

            </div>

          </div>
        </div>
      )}

      {/* 3. Visualização Mensal (Mês) */}
      {viewMode === 'Mês' && (
        <div className="flex-1 p-4 sm:p-5 flex flex-col overflow-y-auto max-h-[750px]">
          {/* Cabeçalho dos dias da semana */}
          <div className="grid grid-cols-7 text-center font-bold text-xs text-slate-500 mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d, i) => (
              <div key={i} className="py-1 uppercase tracking-wider text-[11px]">{d}</div>
            ))}
          </div>

          {/* Grade de 7 colunas */}
          <div className="grid grid-cols-7 gap-1.5 flex-1">
            {monthMatrix.map((dayItem, idx) => {
              const dayEvents = filteredEvents.filter(e => {
                if (!e.start?.dateTime && !e.start?.date) return false;
                const evDate = new Date(e.start.dateTime || e.start.date);
                return evDate.toDateString() === dayItem.date.toDateString();
              });

              return (
                <div
                  key={idx}
                  className={`min-h-[95px] p-1.5 rounded-xl border flex flex-col transition-all relative ${
                    dayItem.isBlocked
                      ? 'bg-slate-900 border-slate-700 text-slate-400'
                      : dayItem.isToday
                      ? 'bg-emerald-50 border-emerald-300 shadow-xs'
                      : dayItem.isCurrentMonth
                      ? 'bg-white border-slate-200/80 hover:border-slate-300'
                      : 'bg-slate-50/50 border-slate-100 text-slate-400 opacity-60'
                  }`}
                >
                  {/* Cabeçalho do dia */}
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold px-1 rounded ${
                      dayItem.isToday ? 'bg-emerald-600 text-white' : dayItem.isBlocked ? 'text-rose-300' : 'text-slate-700'
                    }`}>
                      {dayItem.dayNumber}
                    </span>
                    {dayItem.isBlocked && (
                      <span className="flex items-center space-x-0.5 text-[9px] text-rose-400 font-bold uppercase">
                        <Lock className="w-2.5 h-2.5 inline" />
                        <span>Bloq</span>
                      </span>
                    )}
                  </div>

                  {/* Lista de Eventos do dia */}
                  <div className="space-y-1 overflow-y-auto max-h-[70px] custom-scrollbar">
                    {dayEvents.map(event => {
                      const category = colorMapper.getCategoryByEvent(event);
                      const isHighlighted = highlightedEventId === event.id;
                      const startTime = new Date(event.start?.dateTime || event.start?.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                      return (
                        <div
                          key={event.id}
                          onClick={() => !dayItem.isBlocked && onSelectEvent && onSelectEvent(event)}
                          style={{ backgroundColor: category.hexBg }}
                          className={`text-[10px] text-white font-medium px-1.5 py-0.5 rounded leading-tight truncate shadow-2xs ${
                            isHighlighted ? 'ring-2 ring-emerald-300 ring-offset-1 scale-105 font-bold animate-pulse' : ''
                          } ${
                            dayItem.isBlocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:brightness-110'
                          }`}
                          title={`${event.summary || 'Consulta'} (${startTime})`}
                        >
                          <span className="opacity-80 mr-1 text-[9px]">{startTime}</span>
                          <span className="font-bold">{event.summary || 'Consulta'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Visualização em Lista */}
      {viewMode === 'Lista' && (
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-h-[750px] space-y-3">
          {sortedListEvents.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">Nenhum compromisso ou consulta encontrada neste período.</p>
            </div>
          ) : (
            sortedListEvents.map(event => {
              const category = colorMapper.getCategoryByEvent(event);
              const status = colorMapper.getStatusByTitleOrDescription(event);
              const startDate = new Date(event.start?.dateTime || event.start?.date);
              const endDate = new Date(event.end?.dateTime || event.end?.date);

              const dateFormatted = startDate.toLocaleDateString('pt-BR', {
                weekday: 'short',
                day: '2-digit',
                month: 'long'
              });
              const startTime = startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              const endTime = endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

              const ymd = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
              const isBlocked = blockedDates.includes(ymd);

              return (
                <div
                  key={event.id}
                  onClick={() => onSelectEvent && onSelectEvent(event)}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all cursor-pointer ${
                    isBlocked 
                      ? 'bg-slate-900 border-slate-800 text-slate-300' 
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div 
                      className="w-3.5 h-12 rounded-full shrink-0"
                      style={{ backgroundColor: category.hexBg }}
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span 
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider"
                          style={{ backgroundColor: category.hexBg }}
                        >
                          {category.label}
                        </span>
                        {isBlocked && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center space-x-1">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Data Bloqueada</span>
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm mt-1">
                        {event.summary || 'Consulta sem título'}
                      </h4>
                      {event.description && (
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-xs font-semibold text-slate-600 sm:text-right shrink-0">
                    <div>
                      <div className="flex items-center space-x-1 text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="capitalize">{dateFormatted}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-slate-400 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{startTime} às {endTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
}
