import { useEffect, useRef, useState } from 'react';
import {
  User,
  X,
  ChevronDown,
  Check,
  Plus,
  Phone,
  Mail,
  Calendar,
  SlidersHorizontal,
  FileText,
  ShieldCheck,
  MessageCircle,
  Mars,
  Venus,
  VenusAndMars,
} from 'lucide-react';

const EMPTY_FORM = {
  full_name: '',
  preferred_name: '',
  birth_date: '',
  sex: '',
  cpf: '',
  email: '',
  phone: '',
  whatsapp_phone: '',
  acquisition_source: '',
  lifecycle_stage: 'lead',
  notes: '',
  consent_health_data: false,
  consent_communications: false,
};

const FIELD_CLASS =
  'mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-normal shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 sm:text-sm';
const SECTION_CLASS = 'rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5';

const SEX_OPTIONS = [
  { value: '', label: 'Não informado', icon: <User className="size-4 text-slate-400" /> },
  { value: 'female', label: 'Feminino', icon: <Venus className="size-4 text-pink-500" strokeWidth={2.5} /> },
  { value: 'male', label: 'Masculino', icon: <Mars className="size-4 text-blue-500" strokeWidth={2.5} /> },
  { value: 'other', label: 'Outro', icon: <VenusAndMars className="size-4 text-purple-500" strokeWidth={2.2} /> },
];

const LIFECYCLE_OPTIONS = [
  { value: 'lead', label: 'Lead / Contato Inicial', icon: '🌱' },
  { value: 'scheduled', label: 'Agendado', icon: '📅' },
  { value: 'active', label: 'Em acompanhamento', icon: '⭐' },
  { value: 'at_risk', label: 'Atenção / Em risco', icon: '⚠️' },
  { value: 'inactive', label: 'Inativo', icon: '⏸️' },
  { value: 'churned', label: 'Encerrado', icon: '🏁' },
];

const ACQUISITION_SOURCE_OPTIONS = [
  { value: 'Instagram', label: 'Instagram', icon: '📸' },
  { value: 'Indicação', label: 'Indicação de Paciente / Amigo', icon: '🤝' },
  { value: 'Google', label: 'Google / Busca Online', icon: '🌐' },
  { value: 'Médico Parceiro', label: 'Médico Parceiro', icon: '🩺' },
  { value: 'WhatsApp', label: 'WhatsApp / Contato Direto', icon: '💬' },
  { value: 'Consultório', label: 'Consultório / Presencial', icon: '🏢' },
  { value: 'Outro', label: 'Outro canal...', icon: '✨' },
];

export default function PatientFormDialog({ open, patient, initialValues, onClose, onSave }) {
  const dialogRef = useRef(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    setForm(
      patient
        ? {
            ...EMPTY_FORM,
            ...patient,
            birth_date: patient.birth_date || '',
            consent_health_data: Boolean(patient.consent_health_data_at),
            consent_communications: Boolean(patient.consent_communications_at),
          }
        : { ...EMPTY_FORM, ...(initialValues || {}) }
    );
    setError('');
    setActiveDropdown(null);
  }, [patient, initialValues, open]);

  useEffect(() => {
    if (!activeDropdown) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-select-container')) {
        setActiveDropdown(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveDropdown(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeDropdown]);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch (saveError) {
      setError(saveError.message || 'Não foi possível salvar o paciente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      onClose={onClose}
      className="settings-dialog patient-form-dialog product-form-dialog"
    >
      <form
        method="dialog"
        onSubmit={submit}
        className="settings-dialog__panel"
        aria-labelledby="patient-form-title"
      >
        <header className="flex items-center justify-between gap-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-white px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
              <User className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="patient-form-title" className="text-xl font-black text-slate-900">
                {patient ? 'Editar paciente' : 'Novo paciente'}
              </h2>
              <p className="text-xs text-slate-500">
                Organize os dados cadastrais, informações de contato e prontuário.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="settings-dialog__body space-y-5 bg-slate-50/70 p-4 sm:p-6 pb-28 custom-scrollbar">
          {/* 1. Dados Pessoais */}
          <fieldset
            className={`${SECTION_CLASS} ${
              activeDropdown === 'sex' || activeDropdown === 'birth_date' ? 'relative z-40' : 'relative z-20'
            }`}
          >
            <legend className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
              <User className="size-3.5 text-emerald-600" aria-hidden="true" />
              Identificação & Dados Pessoais
            </legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field
                  label="Nome completo"
                  name="patient-full-name"
                  required
                  placeholder="Ex.: Mariana Silva"
                  value={form.full_name}
                  onChange={(value) => setField('full_name', value)}
                />
              </div>

              <Field
                label="Nome preferido / social"
                name="patient-preferred-name"
                placeholder="Como prefere ser chamado(a)"
                value={form.preferred_name}
                onChange={(value) => setField('preferred_name', value)}
              />

              <div className="min-w-0">
                <label htmlFor="patient-birth-date" className="block text-sm font-bold text-slate-700">
                  Data de nascimento
                </label>
                <DateDropdownSelect
                  id="patient-birth-date"
                  value={form.birth_date}
                  onChange={(val) => setField('birth_date', val)}
                  header="Data de nascimento do paciente"
                  isOpen={activeDropdown === 'birth_date'}
                  onToggle={() => setActiveDropdown(activeDropdown === 'birth_date' ? null : 'birth_date')}
                />
              </div>

              <div className="min-w-0">
                <label htmlFor="patient-sex" className="block text-sm font-bold text-slate-700">
                  Sexo biológico
                </label>
                <DropdownSelect
                  id="patient-sex"
                  value={form.sex}
                  onChange={(val) => setField('sex', val)}
                  options={SEX_OPTIONS}
                  header="Selecione o sexo"
                  isOpen={activeDropdown === 'sex'}
                  onToggle={() => setActiveDropdown(activeDropdown === 'sex' ? null : 'sex')}
                />
              </div>

              <Field
                label="CPF"
                name="patient-cpf"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={form.cpf}
                onChange={(value) => setField('cpf', value)}
              />
            </div>
          </fieldset>

          {/* 2. Contatos & Comunicação */}
          <fieldset className={`${SECTION_CLASS} relative z-10`}>
            <legend className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
              <Phone className="size-3.5 text-emerald-600" aria-hidden="true" />
              Contatos & Comunicação
            </legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    WhatsApp principal
                    <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                      <MessageCircle className="size-2.5" /> Recomendado
                    </span>
                  </span>
                  <input
                    id="patient-whatsapp"
                    name="patient-whatsapp"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="Ex.: (11) 99999-8888"
                    value={form.whatsapp_phone || ''}
                    onChange={(event) => setField('whatsapp_phone', event.target.value)}
                    className={FIELD_CLASS}
                  />
                </label>
              </div>

              <Field
                label="Telefone alternativo"
                name="patient-phone"
                type="tel"
                inputMode="tel"
                placeholder="Ex.: (11) 3333-4444"
                value={form.phone}
                onChange={(value) => setField('phone', value)}
              />

              <div className="sm:col-span-2">
                <Field
                  label="E-mail"
                  name="patient-email"
                  type="email"
                  placeholder="Ex.: mariana@exemplo.com"
                  value={form.email}
                  onChange={(value) => setField('email', value)}
                />
              </div>
            </div>
          </fieldset>

          {/* 3. Acompanhamento & Origem */}
          <fieldset
            className={`${SECTION_CLASS} ${
              activeDropdown === 'lifecycle' || activeDropdown === 'acquisition' ? 'relative z-40' : 'relative z-10'
            }`}
          >
            <legend className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
              <SlidersHorizontal className="size-3.5 text-emerald-600" aria-hidden="true" />
              Acompanhamento & Origem
            </legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <label htmlFor="patient-lifecycle-stage" className="block text-sm font-bold text-slate-700">
                  Etapa do acompanhamento
                </label>
                <DropdownSelect
                  id="patient-lifecycle-stage"
                  value={form.lifecycle_stage || 'lead'}
                  onChange={(val) => setField('lifecycle_stage', val)}
                  options={LIFECYCLE_OPTIONS}
                  header="Status no consultório"
                  isOpen={activeDropdown === 'lifecycle'}
                  onToggle={() => setActiveDropdown(activeDropdown === 'lifecycle' ? null : 'lifecycle')}
                />
              </div>

              <div className="min-w-0">
                <label htmlFor="patient-acquisition-source" className="block text-sm font-bold text-slate-700">
                  Origem do paciente
                </label>
                <DropdownSelect
                  id="patient-acquisition-source"
                  value={form.acquisition_source}
                  onChange={(val) => setField('acquisition_source', val)}
                  options={ACQUISITION_SOURCE_OPTIONS}
                  header="Canal de entrada"
                  placeholder="Selecione ou digite..."
                  allowCustom={true}
                  align="right"
                  isOpen={activeDropdown === 'acquisition'}
                  onToggle={() => setActiveDropdown(activeDropdown === 'acquisition' ? null : 'acquisition')}
                />
              </div>
            </div>
          </fieldset>

          {/* 4. Observações Clínicas */}
          <fieldset className={`${SECTION_CLASS} relative z-0`}>
            <legend className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
              <FileText className="size-3.5 text-emerald-600" aria-hidden="true" />
              Observações Clínicas
            </legend>
            <label className="text-sm font-bold text-slate-700">
              <span className="block mb-1 text-slate-700">Notas e histórico clínico inicial</span>
              <textarea
                name="patient-notes"
                rows={3}
                placeholder="Anotações gerais, objetivo da consulta, histórico médico ou particularidades da conduta..."
                value={form.notes || ''}
                onChange={(event) => setField('notes', event.target.value)}
                className={`${FIELD_CLASS} py-3`}
              />
            </label>
          </fieldset>

          {/* 5. Consentimentos & LGPD */}
          <fieldset className={SECTION_CLASS}>
            <legend className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
              <ShieldCheck className="size-3.5 text-emerald-600" aria-hidden="true" />
              Consentimentos & Privacidade (LGPD)
            </legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50/40 hover:border-emerald-200 transition-colors cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.consent_health_data}
                  onChange={(event) => setField('consent_health_data', event.target.checked)}
                  className="mt-0.5 size-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <span className="block font-bold text-slate-800">Dados de saúde</span>
                  <span className="block text-[11px] font-normal leading-relaxed text-slate-500">
                    Autoriza a coleta e processamento de informações clínicas para o planejamento nutricional.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50/40 hover:border-emerald-200 transition-colors cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.consent_communications}
                  onChange={(event) => setField('consent_communications', event.target.checked)}
                  className="mt-0.5 size-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <span className="block font-bold text-slate-800">Comunicações & Follow-up</span>
                  <span className="block text-[11px] font-normal leading-relaxed text-slate-500">
                    Autoriza o envio de planos, lembretes de retorno e orientações via WhatsApp ou e-mail.
                  </span>
                </div>
              </label>
            </div>
          </fieldset>

          {error ? (
            <div role="alert" className="rounded-xl bg-rose-50 p-4 text-xs font-bold text-rose-700 border border-rose-200">
              {error}
            </div>
          ) : null}
        </div>

        <footer className="app-modal-footer flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200/80 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl px-4 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || !form.full_name?.trim()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-all hover:scale-102 disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
          >
            {saving ? 'Salvando…' : 'Salvar paciente'}
          </button>
        </footer>
      </form>
    </dialog>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
  inputMode,
  placeholder,
}) {
  return (
    <label className="text-sm font-bold text-slate-700">
      <span className="block">
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </span>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        inputMode={inputMode}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className={FIELD_CLASS}
      />
    </label>
  );
}

function DropdownSelect({
  id,
  value,
  onChange,
  options,
  placeholder = 'Selecione…',
  header,
  align = 'left',
  isOpen = false,
  onToggle,
  allowCustom = false,
}) {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState('');

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : (value || placeholder);
  const displayIcon = selectedOption ? selectedOption.icon : (value ? '✨' : null);

  return (
    <div className={`relative dropdown-select-container ${isOpen ? 'z-50' : 'z-10'}`}>
      <button
        type="button"
        id={id}
        onClick={onToggle}
        className="mt-1.5 flex min-h-11 w-full items-center justify-between gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs font-bold text-slate-800 shadow-2xs transition-all hover:border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 cursor-pointer active:scale-[0.99]"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 truncate">
          {displayIcon && <span className="text-sm shrink-0 inline-flex items-center justify-center">{displayIcon}</span>}
          <span className="truncate">{displayLabel}</span>
        </span>
        <ChevronDown
          className={`size-3.5 shrink-0 opacity-70 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-600' : 'text-slate-400'}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute mt-2 min-w-[13rem] w-full app-solid-dropdown !bg-white bg-[#ffffff] rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-scale-up space-y-1 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          style={{ backgroundColor: '#ffffff', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
        >
          {header && (
            <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              {header}
            </div>
          )}

          <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar">
            {options.map((opt) => {
              const isSelected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    onToggle();
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-900 font-bold'
                      : 'text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <span className="flex items-center truncate">
                    {opt.icon && <span className="mr-2 text-sm shrink-0 inline-flex items-center justify-center">{opt.icon}</span>}
                    <span className="truncate">{opt.label}</span>
                  </span>
                  {isSelected && <Check className="size-3.5 text-emerald-600 shrink-0 ml-1" />}
                </button>
              );
            })}

            {allowCustom && (
              <div className="border-t border-slate-100 pt-1.5 mt-1">
                {!isCustomMode ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCustomMode(true);
                      setCustomInput(value || '');
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-xl text-xs text-emerald-700 font-bold hover:bg-emerald-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                    <span>Outro canal...</span>
                  </button>
                ) : (
                  <div className="p-1 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      autoFocus
                      placeholder="Ex: TikTok, Parceria..."
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (customInput.trim()) {
                            onChange(customInput.trim());
                            setIsCustomMode(false);
                            onToggle();
                          }
                        }
                      }}
                      className="w-full rounded-lg border border-emerald-300 px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setIsCustomMode(false)}
                        className="px-2 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (customInput.trim()) {
                            onChange(customInput.trim());
                            setIsCustomMode(false);
                            onToggle();
                          }
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 text-white rounded-md hover:bg-emerald-700 shadow-2xs cursor-pointer"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatIsoDateToBr(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function calculateAge(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = String(dateStr).split('-').map(Number);
  if (!y || !m || !d) return null;
  const birth = new Date(y, m - 1, d);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 && age < 130 ? age : null;
}

function DateDropdownSelect({
  id,
  value,
  onChange,
  header = 'Data de nascimento',
  placeholder = 'Selecione a data de nascimento…',
  isOpen = false,
  onToggle,
}) {
  const age = calculateAge(value);
  const formattedDate = formatIsoDateToBr(value);
  const displayLabel = formattedDate
    ? `${formattedDate}${age !== null ? ` (${age} anos)` : ''}`
    : placeholder;

  return (
    <div className={`relative dropdown-select-container ${isOpen ? 'z-50' : 'z-10'}`}>
      <button
        type="button"
        id={id}
        onClick={onToggle}
        className="mt-1.5 flex min-h-11 w-full items-center justify-between gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs font-bold text-slate-800 shadow-2xs transition-all hover:border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 cursor-pointer active:scale-[0.99]"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 truncate">
          <Calendar className="size-4 text-emerald-600 shrink-0" aria-hidden="true" />
          <span className={`truncate ${value ? 'text-slate-800 font-bold' : 'text-slate-400 font-medium'}`}>
            {displayLabel}
          </span>
        </span>
        <ChevronDown
          className={`size-3.5 shrink-0 opacity-70 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-600' : 'text-slate-400'
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 mt-2 w-72 sm:w-80 app-solid-dropdown !bg-white bg-[#ffffff] rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-scale-up space-y-2.5"
          style={{ backgroundColor: '#ffffff', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              {header}
            </span>
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                }}
                className="text-[10px] font-bold text-rose-500 hover:text-rose-700 cursor-pointer"
              >
                Limpar data
              </button>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Escolha a data no calendário:
            </label>
            <input
              type="date"
              autoFocus
              value={value || ''}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                onChange(e.target.value);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer"
            />
          </div>

          {value && (
            <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/80 p-2.5 flex items-center justify-between text-xs">
              <span className="text-emerald-800 font-medium">
                Data: <strong>{formatIsoDateToBr(value)}</strong>
              </span>
              {age !== null && (
                <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-2xs">
                  {age} anos
                </span>
              )}
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={onToggle}
              className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
            >
              Concluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

