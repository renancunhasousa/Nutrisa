import React, { useState } from 'react';
import { X, Lock, Unlock, Calendar } from 'lucide-react';

export default function BlockDatesModal({ isOpen, onClose, blockedDates = [], onToggleBlockDate }) {
  const [dateInput, setDateInput] = useState('');
  const [blockType, setBlockType] = useState('day');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');

  if (!isOpen) return null;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!dateInput) return;
    if (blockType !== 'day' && endTime <= startTime) return;
    onToggleBlockDate(blockType === 'day' ? dateInput : blockType === 'daily'
      ? { date: dateInput, start: startTime, end: endTime, recurrence: 'daily' }
      : { date: dateInput, start: startTime, end: endTime });
    setDateInput('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-scale-up">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Bloquear Datas na Grade</h3>
              <p className="text-[11px] text-slate-400">Dias bloqueados ficam escurecidos e desativados</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-900 text-[11px] leading-relaxed border border-amber-200">
            O bloqueio é aplicado somente nesta tela e neste navegador. Ele não altera nem bloqueia horários no Google Calendar.
          </div>
          <form onSubmit={handleAdd} className="flex gap-2">
            <input 
              type="date" 
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            />
            <button
              type="submit"
              disabled={!dateInput}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center space-x-1"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Bloquear</span>
            </button>
          </form>

          <div className="grid grid-cols-3 gap-2">
            {[['day', 'Dia inteiro'], ['period', 'Período em uma data'], ['daily', 'Todos os dias']].map(([value, label]) => (
              <button key={value} type="button" onClick={() => setBlockType(value)} className={`px-2 py-2 rounded-lg text-[11px] font-bold border ${blockType === value ? 'bg-rose-50 border-rose-300 text-rose-700' : 'border-slate-200 text-slate-500'}`}>{label}</button>
            ))}
          </div>
          {blockType !== 'day' && (
            <div className="flex gap-2 items-center">
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="flex-1 px-2 py-2 border border-slate-200 rounded-lg text-xs" />
              <span className="text-xs text-slate-400">até</span>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="flex-1 px-2 py-2 border border-slate-200 rounded-lg text-xs" />
            </div>
          )}

          {/* Lista de Datas Bloqueadas */}
          <div>
            <span className="text-xs font-bold text-slate-700 block mb-2">
              Datas Atualmente Bloqueadas ({blockedDates.length})
            </span>

            {blockedDates.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                Nenhuma data bloqueada no momento.
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {blockedDates.map((item) => {
                  const dateStr = typeof item === 'string' ? item : item.date;
                  const label = typeof item === 'string' ? 'Dia inteiro' : `${item.start}–${item.end}`;
                  const parts = dateStr.split('-');
                  const formatted = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
                  return (
                    <div 
                      key={dateStr}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700"
                    >
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-3.5 h-3.5 text-rose-500" />
                        <span className="font-semibold">{formatted} · {label}</span>
                      </div>
                      <button
                        onClick={() => onToggleBlockDate(item)}
                        className="text-xs text-slate-400 hover:text-rose-600 font-medium flex items-center space-x-1 transition-colors"
                        title="Desbloquear data"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Liberar</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition-all"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
