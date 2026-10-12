import React, { useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import {
  CheckCircle2,
  Circle,
  Clock,
  CalendarDays,
  MessageCircle,
  MessagesSquare,
  ExternalLink,
  Trash2,
  AlertTriangle,
  User,
  Phone,
  Send,
  Search,
  LayoutGrid,
  X,
  Edit3,
} from 'lucide-react';
import {
  TASK_CATEGORIES,
  WHATSAPP_TEMPLATES,
  buildWhatsAppUrl,
} from '../domain/taskTypes.js';
import { matchPatientAvatar } from '../services/patientAvatarService.js';
import { usePatient } from '../../pacientes/usePatient.js';
import { writePatientHandoff } from '../../pacientes/services/patientHandoff.js';

const normalizePatientName = (value) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .replace(/\s+/g, ' ')
  .toLocaleLowerCase('pt-BR');

const normalizePhone = (value) => String(value ?? '').replace(/\D/g, '').slice(-11);

function findTaskPatient(task, patients) {
  if (task.patientId) {
    const patientById = patients.find((item) => item.id === task.patientId);
    if (patientById) return patientById;
  }

  const taskPhone = normalizePhone(task.patientPhone);
  if (taskPhone) {
    const patientByPhone = patients.find(
      (item) => normalizePhone(item.whatsapp_phone || item.phone) === taskPhone,
    );
    if (patientByPhone) return patientByPhone;
  }

  const taskName = normalizePatientName(task.patientName);
  if (!taskName) return null;
  return patients.find((item) => [item.full_name, item.preferred_name, item.name]
    .some((name) => normalizePatientName(name) === taskName)) || null;
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_GRADIENTS = [
  'from-emerald-500 to-teal-600',
  'from-sky-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-indigo-500 to-cyan-600',
];

function getGradientByName(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

export function TaskCard({ task, todayStr, onToggleStatus, onDelete, onEdit, onLinkPatient, patientAvatars }) {
  const { patients, setSelectedPatientId, refreshPatients } = usePatient();
  const [showWhatsAppPicker, setShowWhatsAppPicker] = useState(false);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [customMessage, setCustomMessage] = useState('');
  const [imgError, setImgError] = useState(false);
  const [showPatientPicker, setShowPatientPicker] = useState(false);
  const [patientQuery, setPatientQuery] = useState('');
  const [patientPickerDestination, setPatientPickerDestination] = useState('dietas');

  const isCompleted = task.status === 'completed';
  const categoryConfig = TASK_CATEGORIES[task.category] || TASK_CATEGORIES.geral;
  const hasLinkedPatient = Boolean(task.patientId);
  const hasPatientPhone = Boolean(normalizePhone(task.patientPhone));

  // Busca a URL da foto do paciente (prioriza campos diretos ou faz matching com log_conversas)
  const avatarUrl =
    task.patientAvatar ||
    task.photoUrl ||
    matchPatientAvatar(patientAvatars, task.patientName, task.patientPhone);

  // Horário da consulta (se importado da agenda ou anotado nas notas)
  const eventTime = task.eventTime || (task.notes && task.notes.match(/às\s*(\d{2}:\d{2})/) ? task.notes.match(/às\s*(\d{2}:\d{2})/)[1] : null);

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

  const formatConsultationDate = (dateStr) => {
    if (!dateStr) return '';
    const [, month, day] = dateStr.split('-');
    return day && month ? `${day}/${month}` : dateStr;
  };

  // Abre o picker do WhatsApp com mensagem inicial sugerida
  const handleOpenWhatsApp = (e) => {
    e.stopPropagation();
    // Seleciona o template mais adequado baseado na categoria
    let initialIdx = 0;
    if (task.category === 'followup') initialIdx = 0; // Check-in adesão
    else if (task.category === 'dieta') initialIdx = 1; // Plano liberado
    else if (task.category === 'retorno') initialIdx = 2; // Retorno
    else if (task.category === 'exames') initialIdx = 3; // Acompanhamento de Exames
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

  const handleChoosePatient = (patient, destination = patientPickerDestination) => {
    onLinkPatient?.(task.id, {
      patientId: patient.id,
      patientPhone: patient.whatsapp_phone || patient.phone || task.patientPhone || '',
    });
    flushSync(() => setSelectedPatientId(patient.id));
    setShowPatientPicker(false);
    setPatientQuery('');
    if (destination === 'dietas') {
      window.location.hash = 'dietas';
    } else {
      setShowWhatsAppPicker(true);
    }
  };

  const handleLinkPatientFromWhatsApp = () => {
    setPatientPickerDestination('whatsapp');
    setShowWhatsAppPicker(false);
    setShowPatientPicker(true);
  };

  const handleGoToConversations = async () => {
    const availablePatients = patients.length ? patients : await refreshPatients();
    const patient = findTaskPatient(task, availablePatients);
    if (!patient) {
      setPatientPickerDestination('whatsapp');
      setShowWhatsAppPicker(false);
      setShowPatientPicker(true);
      return;
    }

    flushSync(() => setSelectedPatientId(patient.id));
    writePatientHandoff('dashboard', patient);
    setShowWhatsAppPicker(false);
    window.location.hash = 'dashboard';
  };

  // Atalho para navegar ao módulo correspondente
  const handleNavigateToModule = async (e) => {
    e.stopPropagation();
    if (categoryConfig.defaultModule) {
      if (task.category === 'dieta' && task.patientName) {
        const availablePatients = patients.length ? patients : await refreshPatients();
        const patient = findTaskPatient(task, availablePatients);

        if (!patient) {
          setPatientPickerDestination('dietas');
          setShowPatientPicker(true);
          return;
        }

        handleChoosePatient(patient, 'dietas');
        return;
      }
      window.location.hash = categoryConfig.defaultModule;
    }
  };

  const normalizedPatientQuery = normalizePatientName(patientQuery);
  const patientOptions = patients.filter((patient) => {
    if (!normalizedPatientQuery) return true;
    const phoneQuery = normalizePhone(patientQuery);
    return [patient.full_name, patient.preferred_name]
      .some((name) => normalizePatientName(name).includes(normalizedPatientQuery))
      || Boolean(phoneQuery && normalizePhone(patient.whatsapp_phone || patient.phone).includes(phoneQuery));
  }).slice(0, 12);

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
      <div className="flex items-start gap-3 sm:gap-3.5">
        {/* Checkbox redonda com microinteração */}
        <button
          type="button"
          onClick={() => onToggleStatus(task.id)}
          title={isCompleted ? 'Marcar como pendente' : 'Concluir tarefa'}
          className="mt-1 shrink-0 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
          ) : (
            <Circle className="w-5 h-5 text-slate-300 hover:text-emerald-500 hover:scale-110 transition-transform" />
          )}
        </button>

        {/* Avatar / Foto de Perfil do Paciente */}
        {task.patientName ? (
          <div
            className="relative shrink-0 select-none group/avatar"
            title={task.patientPhone ? `${task.patientName} (${task.patientPhone}) - Clique para WhatsApp` : task.patientName}
            onClick={(e) => {
              if (task.patientPhone) {
                handleOpenWhatsApp(e);
              }
            }}
          >
            <div
              className={`w-11 h-11 rounded-2xl overflow-hidden border-2 border-white shadow-xs transition-all duration-200 group-hover:scale-105 ${
                avatarUrl && !imgError
                  ? 'ring-2 ring-slate-200/90 group-hover:ring-emerald-500/70 bg-slate-100'
                  : `bg-gradient-to-br ${getGradientByName(task.patientName)} text-white flex items-center justify-center font-bold text-xs ring-2 ring-slate-100`
              } ${task.patientPhone ? 'cursor-pointer hover:shadow-md' : ''}`}
            >
              {avatarUrl && !imgError ? (
                <img
                  src={avatarUrl}
                  alt={task.patientName}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="tracking-wider text-xs font-black drop-shadow-2xs">
                  {getInitials(task.patientName)}
                </span>
              )}
            </div>

            {/* Micro badge WhatsApp na foto quando houver telefone */}
            {task.patientPhone && (
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center shadow-xs"
                title="WhatsApp vinculado"
              >
                <span className="w-1.5 h-1.5 bg-white rounded-full" />
              </span>
            )}
          </div>
        ) : null}

        {/* Conteúdo Principal */}
        <div className="flex-1 min-w-0">
          <div className="mb-1.5 flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${categoryConfig.badgeBg}`}>
                <span className={`size-1.5 rounded-full ${categoryConfig.dotBg}`} />
                {categoryConfig.label}
              </span>

              {task.patientName && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200/70 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                  <User className="size-3 shrink-0 text-slate-400" aria-hidden="true" />
                  <strong className="font-bold text-slate-800">{task.patientName}</strong>
                </span>
              )}

              {task.patientPhone && (
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                  <Phone className="size-3 shrink-0 text-emerald-600" aria-hidden="true" />
                  {task.patientPhone}
                </span>
              )}

              {eventTime && (
                <span className="inline-flex items-center gap-1 rounded-md border border-amber-200/80 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 shadow-2xs" title={`Horário da consulta: ${eventTime}`}>
                  <Clock className="size-3 shrink-0 text-amber-600" aria-hidden="true" />
                  <span>Horário da consulta:</span>
                  {eventTime}
                </span>
              )}

              {task.eventDate && (
                <span className="inline-flex items-center gap-1 rounded-md border border-sky-200/80 bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-800" title="Data da consulta">
                  <CalendarDays className="size-3 shrink-0 text-sky-600" aria-hidden="true" />
                  <span>Data da consulta:</span>
                  {formatConsultationDate(task.eventDate)}
                </span>
              )}
            </div>

            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                isCompleted
                  ? 'bg-slate-100 text-slate-500 border-slate-200'
                  : isOverdue
                  ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                  : isToday
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              {isOverdue ? <AlertTriangle className="size-3 text-rose-500" /> : <Clock className="size-3" />}
              <span>Prazo:</span>
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
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Atalhos">
              <span className="mr-0.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                Atalhos
              </span>
              {/* Botão de WhatsApp */}
              {task.patientName && (
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  title="Abrir WhatsApp com mensagem rápida"
                  className="inline-flex min-h-9 w-36 items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 text-[11px] font-bold text-slate-700 shadow-2xs transition-colors hover:border-emerald-200 hover:bg-emerald-50/40 cursor-pointer"
                >
                  <MessageCircle className="size-3.5 text-emerald-600" />
                  <span>Chamar no Zap</span>
                </button>
              )}

              {/* Botão de Atalho para o Módulo Clínico (Anamnese, Avaliação, etc.) */}
              {categoryConfig.defaultModule && !isCompleted && (
                <button
                  type="button"
                  onClick={handleNavigateToModule}
                  title={`Abrir módulo de ${categoryConfig.label}`}
                  className="inline-flex min-h-9 w-36 items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 text-[11px] font-bold text-slate-700 shadow-2xs transition-colors hover:border-emerald-200 hover:bg-emerald-50/40 hover:text-slate-900 cursor-pointer"
                >
                  <ExternalLink className="size-3.5 text-emerald-600" />
                  <span>Abrir {categoryConfig.label.split(' ')[0]}</span>
                </button>
              )}
            </div>

            {/* Ações Secundárias (Editar / Excluir) */}
            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(task)}
                  title="Editar demanda"
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
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

      {showPatientPicker && createPortal(
        <div
          className="app-modal-overlay animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`link-patient-title-${task.id}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) setShowPatientPicker(false);
          }}
        >
          <div className="app-modal-panel max-w-2xl animate-scaleIn">
            <header className="app-modal-header flex items-start justify-between gap-4 px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
                  <User className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 id={`link-patient-title-${task.id}`} className="text-base font-black text-slate-900">Vincular paciente da agenda</h3>
                  <p className="mt-1 text-xs text-slate-500">Selecione quem corresponde a <strong>{task.patientName}</strong>. Esse vínculo será salvo para os próximos acessos.</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowPatientPicker(false)} className="app-modal-close flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Fechar seleção de paciente">
                <X className="size-5" />
              </button>
            </header>

            <div className="app-modal-body p-4 sm:p-5">
              <label className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100">
                <Search className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
                <span className="sr-only">Buscar paciente por nome ou telefone</span>
                <input
                  autoFocus
                  value={patientQuery}
                  onChange={(event) => setPatientQuery(event.target.value)}
                  placeholder="Buscar por nome ou telefone"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </label>

              <div className="mt-3 space-y-1">
                {!patientOptions.length ? <p className="p-4 text-center text-xs text-slate-500">Nenhum paciente encontrado.</p> : null}
                {patientOptions.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => handleChoosePatient(patient)}
                    className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-600"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[10px] font-black text-slate-600">{getInitials(patient.full_name)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-slate-800">{patient.full_name}</span>
                      <span className="block truncate text-[11px] text-slate-500">{patient.whatsapp_phone || patient.phone || 'Sem telefone cadastrado'}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* Modal / Popover de Envio Rápido de WhatsApp */}
      {showWhatsAppPicker && createPortal(
        <div 
          className="app-modal-overlay animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`whatsapp-modal-title-${task.id}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowWhatsAppPicker(false);
          }}
        >
          <div className="app-modal-panel max-w-3xl animate-scaleIn">
            <header className="app-modal-header flex items-start justify-between gap-4 px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
                  <MessageCircle className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 id={`whatsapp-modal-title-${task.id}`} className="truncate text-lg font-black text-slate-900">Chamar {task.patientName || 'paciente'} no WhatsApp</h3>
                  <p className="mt-0.5 text-xs text-slate-500">Escolha um modelo ou personalize a mensagem antes de enviar.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWhatsAppPicker(false)}
                className="app-modal-close flex shrink-0 items-center justify-center text-slate-400 transition-colors hover:bg-white/80 hover:text-slate-700 cursor-pointer"
                aria-label="Fechar envio pelo WhatsApp"
              >
                <X className="size-5" />
              </button>
            </header>

            <div className="app-modal-body space-y-5 bg-[#f7f9f8] p-4 sm:p-6">
              <section aria-labelledby={`whatsapp-templates-title-${task.id}`}>
                <h4 id={`whatsapp-templates-title-${task.id}`} className="mb-2.5 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.08em] text-slate-800">
                  <LayoutGrid className="size-3.5 text-emerald-600" aria-hidden="true" />
                  Modelo de mensagem
                </h4>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {WHATSAPP_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(idx)}
                      aria-pressed={selectedTemplateIndex === idx}
                      className={`min-h-18 rounded-xl border px-3.5 py-3 text-left text-xs font-semibold transition-all cursor-pointer ${
                        selectedTemplateIndex === idx
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-xs ring-1 ring-emerald-500/15'
                          : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/30'
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
              </section>

              <section aria-labelledby={`whatsapp-message-title-${task.id}`}>
                <label id={`whatsapp-message-title-${task.id}`} htmlFor={`whatsapp-message-${task.id}`} className="mb-2.5 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.08em] text-slate-800">
                  <MessagesSquare className="size-3.5 text-emerald-600" aria-hidden="true" />
                  Mensagem que será enviada
                </label>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4">
                  <textarea
                    id={`whatsapp-message-${task.id}`}
                    name="whatsapp-message"
                    rows={5}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="w-full resize-y rounded-xl border border-slate-200 bg-white p-4 font-sans text-sm leading-relaxed text-slate-700 shadow-2xs transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-500">Revise a mensagem antes de abrir o WhatsApp. Você ainda poderá editá-la no aplicativo.</p>
                </div>
              </section>

            </div>

            <footer className="app-modal-footer flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <span className="text-[11px] font-medium text-slate-500">
                {hasPatientPhone
                  ? `Telefone vinculado: ${task.patientPhone}`
                  : hasLinkedPatient
                    ? 'Paciente vinculado, mas sem telefone cadastrado.'
                    : 'Vincule esta tarefa a um paciente para acessar os canais de contato.'}
              </span>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWhatsAppPicker(false)}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                {!hasLinkedPatient ? (
                  <button
                    type="button"
                    onClick={handleLinkPatientFromWhatsApp}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 cursor-pointer"
                  >
                    <User className="size-4" aria-hidden="true" />
                    <span>Vincular paciente</span>
                  </button>
                ) : null}
                {hasLinkedPatient ? (
                  <button
                    type="button"
                    onClick={handleGoToConversations}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-50 cursor-pointer"
                  >
                    <MessagesSquare className="size-4" aria-hidden="true" />
                    <span>Ir para conversas</span>
                  </button>
                ) : null}
                {hasPatientPhone ? (
                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 cursor-pointer"
                  >
                    <Send className="size-4" aria-hidden="true" />
                    <span>Abrir WhatsApp</span>
                  </button>
                ) : null}
              </div>
            </footer>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
