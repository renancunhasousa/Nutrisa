import React, { useState } from 'react';
import { X, Lock, Unlock, Calendar, AlertCircle } from 'lucide-react';

export default function BlockDatesModal({ isOpen, onClose, blockedDates = [], onToggleBlockDate }) {
  const [dateInput, setDateInput] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!dateInput) return;
    if (!blockedDates.includes(dateInput)) {
      onToggleBlockDate(dateInput);
    }
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
                {blockedDates.map((dateStr) => {
                  const parts = dateStr.split('-');
                  const formatted = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
                  return (
                    <div 
                      key={dateStr}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700"
                    >
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-3.5 h-3.5 text-rose-500" />
                        <span className="font-semibold">{formatted}</span>
                      </div>
                      <button
                        onClick={() => onToggleBlockDate(dateStr)}
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
