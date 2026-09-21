import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Salad,
  ClipboardList,
  FileText,
  Calendar,
  CheckSquare,
  AlertCircle,
  RefreshCw,
  Check,
} from 'lucide-react';
import { AGENDA_SYNC_MODES } from '../services/agendaTaskSync.js';
import { KEY_GOOGLE_TOKEN } from '../../../config/storageKeys.js';

const MODE_ICONS = {
  dieta: Salad,
  exames: ClipboardList,
  anamnese: FileText,
  retorno: Calendar,
  geral: CheckSquare,
};

export function SyncAgendaModal({ isOpen, onClose, onConfirm, isSyncing }) {
  const [selectedMode, setSelectedMode] = useState('dieta');

  const isCalendarConnected = useMemo(() => {
    if (!isOpen || typeof window === 'undefined') return true;
    try {
      const raw = localStorage.getItem(KEY_GOOGLE_TOKEN);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return Boolean(parsed?.access_token);
    } catch {
      return false;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentMode = AGENDA_SYNC_MODES[selectedMode] || AGENDA_SYNC_MODES.dieta;

  const handleConfirm = () => {
    onConfirm(selectedMode);
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] w-screen h-screen flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSyncing) onClose();
      }}
    >
      <div 
        className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative space-y-6 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-xs">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Importar Demandas da Semana
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Escolha a categoria e o prazo automático para os agendamentos da semana
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSyncing}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aviso prévio se a agenda não estiver conectada */}
        {!isCalendarConnected && (
          <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-950">Agenda do Google não conectada</h4>
                <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                  Para importar os atendimentos da semana, conecte seu Google Calendar no módulo Agenda.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                window.location.hash = 'agenda';
              }}
              className="shrink-0 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer w-full sm:w-auto text-center"
            >
              Conectar Agenda
            </button>
          </div>
        )}

        {/* Opções de Importação */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Selecione o formato de importação:
          </label>

          <div className="grid grid-cols-1 gap-2.5">
            {Object.values(AGENDA_SYNC_MODES).map((mode) => {
              const isSelected = selectedMode === mode.id;
              const IconComponent = MODE_ICONS[mode.id] || Calendar;
              const theme = mode.colorTheme;

              return (
                <div
                  key={mode.id}
                  onClick={() => !isSyncing && setSelectedMode(mode.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative ${
                    isSelected
                      ? theme.activeBorder
                      : 'border-slate-200/80 hover:bg-slate-50/80'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${theme.iconBg}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-black text-slate-900">
                        {mode.title}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${theme.badge}`}>
                        {mode.offsetBadge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {mode.description}
                    </p>
                  </div>

                  {isSelected && (
                    <div className="absolute right-3.5 top-3.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Box de Aviso Explicativo da Regra Selecionada */}
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/70 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-900 block">
              Regra de Data & Vencimento:
            </span>
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              {currentMode.offsetNotice}
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSyncing}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-bold transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Importando...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Confirmar e Importar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
