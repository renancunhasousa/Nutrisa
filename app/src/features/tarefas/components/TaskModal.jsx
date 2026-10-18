import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Plus,
  Calendar,
  User,
  Phone,
  ClipboardList,
  MessageSquareText,
  Tag,
  SlidersHorizontal,
  AlignLeft,
  Salad,
  FileText,
  MessageSquare,
  Sparkles,
  CheckSquare,
  UserCheck,
  AlertCircle,
  Link2,
  Unlink,
  Search,
  Check,
} from 'lucide-react';
import {
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  DATE_PRESETS,
  getPresetDate,
} from '../domain/taskTypes.js';
import { usePatient } from '../../pacientes/usePatient.js';

const SECTION_CLASS = 'rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5';
const CATEGORY_ICONS = {
  dieta: Salad,
  exames: ClipboardList,
  anamnese: FileText,
  whatsapp: MessageSquare,
  followup: Sparkles,
  retorno: Calendar,
  relacionamento: Sparkles,
  geral: CheckSquare,
};

export function TaskModal({ isOpen, onClose, onSave, initialData = null }) {
  const { patients = [] } = usePatient() || {};
  const [patientId, setPatientId] = useState(null);
  const [linkedPatient, setLinkedPatient] = useState(null);
  const [isLinkingOpen, setIsLinkingOpen] = useState(false);
  const [isManualInput, setIsManualInput] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [title, setTitle] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [category, setCategory] = useState('dieta');
  const [priority, setPriority] = useState('media');
  const [dueDate, setDueDate] = useState(() => getPresetDate(0));
  const [notes, setNotes] = useState('');
  const titleInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setIsLinkingOpen(false);
      setPatientSearch('');

      if (initialData) {
        setTitle(initialData.title || '');
        setCategory(initialData.category || 'dieta');
        setPriority(initialData.priority || 'media');
        setDueDate(initialData.dueDate || getPresetDate(0));
        setNotes(initialData.notes || '');

        let found = null;
        if (initialData.patientId) {
          found = patients.find((p) => p.id === initialData.patientId);
        }
        if (!found && initialData.patientName) {
          found = patients.find(
            (p) => (p.full_name || '').toLowerCase().trim() === initialData.patientName.toLowerCase().trim()
          );
        }

        if (found) {
          setLinkedPatient(found);
          setPatientId(found.id);
          setPatientName(found.full_name || '');
          setPatientPhone(found.whatsapp_phone || found.phone || '');
          setIsManualInput(false);
        } else {
          setLinkedPatient(null);
          setPatientId(null);
          setPatientName(initialData.patientName || '');
          setPatientPhone(initialData.patientPhone || '');
          setIsManualInput(Boolean(initialData.patientName || initialData.patientPhone));
        }
      } else {
        setLinkedPatient(null);
        setPatientId(null);
        setTitle('');
        setPatientName('');
        setPatientPhone('');
        setIsManualInput(false);
        setCategory('dieta');
        setPriority('media');
        setDueDate(getPresetDate(0));
        setNotes('');
      }

      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialData, patients]);

  const filteredCandidates = useMemo(() => {
    const list = patients || [];
    if (!patientSearch.trim()) return list.slice(0, 8);
    const q = patientSearch.toLowerCase().trim();
    return list
      .filter((p) => {
        const name = (p.full_name || '').toLowerCase();
        const phone = (p.whatsapp_phone || p.phone || '').replace(/\D/g, '');
        const cpf = (p.cpf || '').replace(/\D/g, '');
        return name.includes(q) || phone.includes(q) || cpf.includes(q);
      })
      .slice(0, 10);
  }, [patients, patientSearch]);

  const handleLinkPatient = (p) => {
    setLinkedPatient(p);
    setPatientId(p.id);
    setPatientName(p.full_name || '');
    setPatientPhone(p.whatsapp_phone || p.phone || '');
    setIsLinkingOpen(false);
    setIsManualInput(false);
    setPatientSearch('');
  };

  const handleUnlinkPatient = () => {
    setLinkedPatient(null);
    setPatientId(null);
    setPatientName('');
    setPatientPhone('');
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      patientId,
      title: title.trim(),
      patientName: patientName.trim(),
      patientPhone: patientPhone.trim(),
      patientAvatar: linkedPatient?.photo_url || null,
      category,
      priority,
      dueDate,
      notes: notes.trim(),
    });

    onClose();
  };

  return createPortal(
    <div 
      className="app-modal-overlay animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="app-modal-panel max-w-3xl animate-scaleIn">
        {/* Header */}
        <div className="app-modal-header flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
              <ClipboardList className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-xl font-black text-slate-900">
                {initialData ? 'Editar Demanda' : 'Nova Demanda Clínica'}
              </h3>
              <p className="text-xs text-slate-500">
                Organize a demanda, o paciente e o prazo de entrega.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="app-modal-close flex size-11 items-center justify-center border border-emerald-600 bg-white p-0 text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer"
            aria-label="Fechar demanda"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="app-modal-body space-y-5 bg-slate-50/70 p-4 sm:p-6">
          <fieldset className={SECTION_CLASS}>
            <legend className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-800">
              <Tag className="size-4 text-emerald-600" aria-hidden="true" />
              Identificação
            </legend>

            {/* O que precisa ser feito */}
            <div className="mb-4">
              <label htmlFor="task-title" className="block text-sm font-semibold text-slate-700 mb-2">
                O que precisa ser feito? <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <ClipboardList aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                <input
                  id="task-title"
                  name="title"
                  ref={titleInputRef}
                  type="text"
                  required
                  placeholder="Ex: Elaborar plano alimentar, responder dúvida sobre creatina..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
                />
              </div>
            </div>

            {/* Vínculo com Prontuário do Paciente */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <UserCheck className="size-3.5 text-emerald-600" />
                  <span>Prontuário & Atalhos do Paciente</span>
                </span>

                {linkedPatient ? (
                  <button
                    type="button"
                    onClick={handleUnlinkPatient}
                    className="text-[10px] font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Desvincular paciente desta demanda"
                  >
                    <Unlink className="size-3" />
                    <span>Desvincular</span>
                  </button>
                ) : null}
              </div>

              {linkedPatient ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="size-9 shrink-0 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-xs shadow-2xs">
                      {linkedPatient.full_name?.slice(0, 2).toUpperCase() || 'PA'}
                    </span>
                    <div className="min-w-0">
                      <strong className="block text-sm font-bold text-slate-900 truncate">
                        {linkedPatient.full_name}
                      </strong>
                      <span className="block text-[11px] text-emerald-700 font-semibold truncate">
                        {linkedPatient.whatsapp_phone || linkedPatient.phone || 'Sem telefone'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsLinkingOpen(true)}
                      className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-white hover:bg-emerald-100/70 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                    >
                      Trocar paciente
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="size-4 text-amber-500 shrink-0" />
                    <span className="text-[11px] text-slate-600 font-medium">
                      Nenhum paciente vinculado a esta demanda.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLinkingOpen(true)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-2xs cursor-pointer shrink-0"
                  >
                    <Link2 className="size-3.5" />
                    <span>Vincular a cadastro existente</span>
                  </button>
                </div>
              )}

              {/* Painel de busca e seleção de paciente */}
              {isLinkingOpen && (
                <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <span className="text-[11px] font-extrabold text-slate-700">
                      Selecione o paciente cadastrado:
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsLinkingOpen(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="search"
                      autoFocus
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      placeholder="Buscar paciente por nome, WhatsApp ou CPF..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="max-h-44 overflow-y-auto space-y-1 custom-scrollbar">
                    {filteredCandidates.length === 0 ? (
                      <p className="text-[11px] text-slate-400 text-center py-3">
                        Nenhum paciente cadastrado encontrado.
                      </p>
                    ) : (
                      filteredCandidates.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleLinkPatient(p)}
                          className="w-full text-left p-2 rounded-lg hover:bg-emerald-50 flex items-center justify-between transition-colors cursor-pointer group"
                        >
                          <div className="min-w-0">
                            <strong className="block text-xs font-bold text-slate-800 group-hover:text-emerald-900 truncate">
                              {p.full_name}
                            </strong>
                            <span className="block text-[10px] text-slate-500 truncate">
                              {p.whatsapp_phone || p.phone || 'Sem contato'} {p.cpf ? `· CPF ${p.cpf}` : ''}
                            </span>
                          </div>
                          <Check className="size-3.5 text-emerald-600 shrink-0 ml-2" />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Opção para alternar preenchimento avulso/manual se necessário */}
              {!linkedPatient && !isLinkingOpen && (
                <div className="pt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsManualInput(!isManualInput)}
                    className="text-[11px] text-slate-400 hover:text-emerald-700 font-medium underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    {isManualInput ? 'Ocultar campos manuais' : 'Ou preencher paciente avulso sem cadastro'}
                  </button>
                </div>
              )}

              {/* Campos manuais caso o usuário opte por avulso */}
              {isManualInput && !linkedPatient && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label htmlFor="task-patient-name" className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Nome do Paciente Avulso
                    </label>
                    <div className="relative">
                      <User aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="task-patient-name"
                        name="patientName"
                        type="text"
                        placeholder="Ex: Mariana Silva"
                        value={patientName}
                        onChange={(e) => {
                          setPatientName(e.target.value);
                          setPatientId(null);
                        }}
                        className="min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="task-patient-phone" className="block text-xs font-semibold text-slate-600 mb-1.5">
                      WhatsApp Avulso (opcional)
                    </label>
                    <div className="relative">
                      <Phone aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="task-patient-phone"
                        name="patientPhone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="11999998888"
                        value={patientPhone}
                        onChange={(e) => {
                          setPatientPhone(e.target.value);
                          setPatientId(null);
                        }}
                        className="min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </fieldset>

          {/* Categoria em Chips */}
          <fieldset className={SECTION_CLASS}>
            <legend className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-800">
              <SlidersHorizontal className="size-4 text-emerald-600" aria-hidden="true" />
              Organização
            </legend>
            <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Tipo da Demanda
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Object.values(TASK_CATEGORIES).map((cat) => {
                const isSelected = category === cat.id;
                const CategoryIcon = CATEGORY_ICONS[cat.id] || CheckSquare;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    aria-pressed={isSelected}
                    className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border px-3 py-2 text-center text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-600/10'
                        : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/40'
                    }`}
                  >
                    <CategoryIcon className="size-5" aria-hidden="true" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prazo com Atalhos Rápidos */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Para quando?
            </label>
            <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {DATE_PRESETS.map((preset) => {
                const presetDateVal = getPresetDate(preset.daysOffset);
                const isSelected = dueDate === presetDateVal;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setDueDate(presetDateVal)}
                    className={`min-h-10 w-full rounded-lg px-2 py-1.5 text-center text-sm font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <Calendar aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
              <input
                id="task-due-date"
                name="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                aria-label="Data de vencimento"
                className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>
          </div>

          {/* Prioridade */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Prioridade
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(TASK_PRIORITIES).map((p) => {
                const isSelected = priority === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPriority(p.id)}
                    aria-pressed={isSelected}
                    className={`min-h-11 px-3 py-2 text-center rounded-xl text-sm font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? `${p.badgeBg} shadow-xs ring-2 font-bold`
                        : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/40'
                    }`}
                  >
                    <span className={`size-2 rounded-full ${isSelected ? p.dot : 'bg-slate-300'}`} />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
            </div>
          </fieldset>

          {/* Notas / Observações */}
          <fieldset className={SECTION_CLASS}>
            <legend className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-800">
              <AlignLeft className="size-4 text-emerald-600" aria-hidden="true" />
              Detalhes
            </legend>
          <div>
            <label htmlFor="task-notes" className="block text-sm font-semibold text-slate-700 mb-2">
              Notas ou Detalhes Rápidos
            </label>
            <div className="relative">
              <MessageSquareText aria-hidden="true" className="pointer-events-none absolute left-3.5 top-3.5 h-[18px] w-[18px] text-slate-400" />
              <textarea
                id="task-notes"
                name="notes"
                rows={3}
                placeholder="Ex: Paciente relatou que não tolera leite pela manhã..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>
          </div>
          </fieldset>

          {/* Botões do Rodapé */}
          <div className="app-modal-footer -mx-4 -mb-4 flex items-center justify-end gap-2 px-4 py-4 sm:-mx-6 sm:-mb-6 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all hover:scale-102 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{initialData ? 'Salvar Alterações' : 'Adicionar Demanda'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
