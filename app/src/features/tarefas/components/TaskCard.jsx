import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2,
  Circle,
  Clock,
  MessageCircle,
  ExternalLink,
  Trash2,
  AlertTriangle,
  User,
  Send,
  X,
} from 'lucide-react';
import {
  TASK_CATEGORIES,
  WHATSAPP_TEMPLATES,
  buildWhatsAppUrl,
} from '../domain/taskTypes.js';

export function TaskCard({ task, todayStr, onToggleStatus, onDelete }) {
  const [showWhatsAppPicker, setShowWhatsAppPicker] = useState(false);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [customMessage, setCustomMessage] = useState('');

  const isCompleted = task.status === 'completed';
  const categoryConfig = TASK_CATEGORIES[task.category] || TASK_CATEGORIES.geral;

  // Status de prazo
  const isOverdue = !isCompleted && task.dueDate < todayStr;
  const isToday = !isCompleted && task.dueDate === todayStr;

  // Formatação de data
  const formatDueDate = (dateStr) => {
    if (!dateStr) return '';
    if (dateStr === todayStr) return 'Hoje';
    const [, m, d] = dateStr.split('-');
    return `${d}/${m}`;
  };

  // Abre o picker do WhatsApp com mensagem inicial sugerida
  const handleOpenWhatsApp = (e) => {
    e.stopPropagation();
    // Seleciona o template mais adequado baseado na categoria
    let initialIdx = 0;
    if (task.category === 'followup') initialIdx = 0; // Check-in adesão
    else if (task.category === 'dieta') initialIdx = 1; // Plano liberado
    else if (task.category === 'retorno') initialIdx = 2; // Retorno
    else initialIdx = 3; // Dúvidas/Exames

    setSelectedTemplateIndex(initialIdx);
    setCustomMessage(WHATSAPP_TEMPLATES[initialIdx].text(task.patientName));
    setShowWhatsAppPicker(true);
  };

  const handleSelectTemplate = (idx) => {
    setSelectedTemplateIndex(idx);
    setCustomMessage(WHATSAPP_TEMPLATES[idx].text(task.patientName));
  };

  const handleSendWhatsApp = () => {
    const url = buildWhatsAppUrl(task.patientPhone, customMessage);
    window.open(url, '_blank', 'noopener,noreferrer');
    setShowWhatsAppPicker(false);
  };

  // Atalho para navegar ao módulo correspondente
  const handleNavigateToModule = (e) => {
    e.stopPropagation();
    if (categoryConfig.defaultModule) {
      window.location.hash = categoryConfig.defaultModule;
    }
  };

  return (
    <div
      className={`group relative bg-white rounded-2xl border transition-all duration-200 shadow-2xs hover:shadow-md ${
        isCompleted
          ? 'border-slate-200/70 bg-slate-50/60 opacity-65'
          : isOverdue
          ? 'border-rose-200/90 hover:border-rose-300'
          : isToday
          ? 'border-amber-200/90 hover:border-amber-300'
          : 'border-slate-200 hover:border-emerald-300'
      } p-3.5 sm:p-4`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox redonda com microinteração */}
        <button
          type="button"
          onClick={() => onToggleStatus(task.id)}
          title={isCompleted ? 'Marcar como pendente' : 'Concluir tarefa'}
          className="mt-0.5 shrink-0 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
          ) : (
            <Circle className="w-5 h-5 text-slate-300 hover:text-emerald-500 hover:scale-110 transition-transform" />
          )}
        </button>

        {/* Conteúdo Principal */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            {/* Tag da Categoria */}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${categoryConfig.badgeBg}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${categoryConfig.dotBg}`} />
              {categoryConfig.label}
            </span>

            {/* Nome do Paciente */}
            {task.patientName && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/70">
                <User className="w-3 h-3 text-slate-400" />
                <strong className="font-bold text-slate-800">{task.patientName}</strong>
              </span>
            )}

            {/* Badge de Prazo */}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ml-auto ${
                isCompleted
                  ? 'bg-slate-100 text-slate-500 border-slate-200'
                  : isOverdue
                  ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                  : isToday
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              {isOverdue ? (
                <AlertTriangle className="w-3 h-3 text-rose-500" />
              ) : (
                <Clock className="w-3 h-3" />
              )}
              {isOverdue ? `Atrasada (${formatDueDate(task.dueDate)})` : formatDueDate(task.dueDate)}
            </span>
          </div>

          {/* Título da Demanda */}
          <h4
            className={`text-sm font-semibold tracking-tight transition-colors ${
              isCompleted ? 'line-through text-slate-400' : 'text-slate-800'
            }`}
          >
            {task.title}
          </h4>

          {/* Notas / Observações */}
          {task.notes && (
            <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed bg-slate-50/80 p-2 rounded-lg border border-slate-100">
              {task.notes}
            </p>
          )}

          {/* Barra de Ações Rápidas de 1 Clique */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {/* Botão de WhatsApp */}
              {task.patientName && (
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  title="Abrir WhatsApp com mensagem rápida"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition-colors shadow-2xs cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Chamar no Zap</span>
                </button>
              )}

              {/* Botão de Atalho para o Módulo Clínico (Anamnese, Avaliação, etc.) */}
              {categoryConfig.defaultModule && !isCompleted && (
                <button
                  type="button"
                  onClick={handleNavigateToModule}
                  title={`Abrir módulo de ${categoryConfig.label}`}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-200/70 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                  <span>Abrir {categoryConfig.label.split(' ')[0]}</span>
                </button>
              )}
            </div>

            {/* Ações Secundárias (Excluir / Editar) */}
            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => onDelete(task.id)}
                title="Excluir demanda"
                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal / Popover de Envio Rápido de WhatsApp */}
      {showWhatsAppPicker && createPortal(
        <div 
          className="fixed inset-0 z-[9999] w-screen h-screen flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowWhatsAppPicker(false);
          }}
        >
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-scaleIn">
            <div className="px-5 py-4 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <h3 className="text-sm font-bold">WhatsApp para {task.patientName || 'Paciente'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWhatsAppPicker(false)}
                className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Escolha um Modelo Rápido:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {WHATSAPP_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(idx)}
                      className={`p-2.5 text-left rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        selectedTemplateIndex === idx
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="block font-bold text-slate-900 mb-0.5">{tmpl.title}</span>
                      <span className="text-[11px] text-slate-500 line-clamp-1">
                        {tmpl.text(task.patientName)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mensagem que será enviada:
                </label>
                <textarea
                  rows={4}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full p-3 text-xs text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 font-sans"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  {task.patientPhone ? `Telefone: ${task.patientPhone}` : 'Telefone não cadastrado (abrirá contato livre)'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowWhatsAppPicker(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all hover:scale-102 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Abrir WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
