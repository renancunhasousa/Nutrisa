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
      className="app-modal-overlay animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSyncing) onClose();
      }}
    >
      <div className="app-modal-panel max-w-xl animate-scaleIn">
        {/* Header */}
        <div className="app-modal-header flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
              <RefreshCw className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-xl font-black text-slate-900">
                Importar Demandas da Semana
              </h3>
              <p className="text-xs text-slate-500">
                Escolha a categoria e o prazo automático para os agendamentos da semana.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSyncing}
            className="flex size-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 cursor-pointer"
            aria-label="Fechar importação da agenda"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="app-modal-body space-y-5 bg-slate-50/70 p-4 sm:p-6">
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
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative bg-white ${
                      isSelected
                        ? theme.activeBorder
                        : 'border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`flex size-9 shrink-0 items-center justify-center ${theme.iconText}`}>
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
        </div>

        {/* Footer */}
        <div className="app-modal-footer flex items-center justify-end gap-2 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSyncing}
            className="min-h-11 px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSyncing}
            className="inline-flex min-h-11 items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Importando...' : 'Confirmar e Importar'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
