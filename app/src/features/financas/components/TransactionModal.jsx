import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  DollarSign,
  Calendar,
  Tag,
  ArrowUpRight,
  ArrowDownLeft,
  SlidersHorizontal,
  ChevronDown,
  Check,
  CreditCard,
  BadgeCheck,
  Link2,
  Unlink,
  Search,
  User,
} from 'lucide-react';
import { usePatient } from '../../pacientes/usePatient.js';

const CATEGORIES_INCOME = [
  { value: 'Consulta Avulsa', label: 'Consulta Avulsa', icon: '🩺' },
  { value: 'Pacote Clínico', label: 'Pacote Clínico', icon: '📦' },
  { value: 'Parceria Nutrologia', label: 'Parceria Nutrologia', icon: '🤝' },
  { value: 'Consultoria Online', label: 'Consultoria Online', icon: '💻' },
  { value: 'Outras Receitas', label: 'Outras Receitas', icon: '🏷️' },
];

const CATEGORIES_EXPENSE = [
  { value: 'Repasse Parceiros', label: 'Repasse Parceiros', icon: '🤝' },
  { value: 'Aluguel / Consultório', label: 'Aluguel / Consultório', icon: '🏢' },
  { value: 'Softwares & Ferramentas', label: 'Softwares & Ferramentas', icon: '💻' },
  { value: 'Materiais / Bioimpedância', label: 'Materiais / Bioimpedância', icon: '⚖️' },
  { value: 'Marketing & Tráfego', label: 'Marketing & Tráfego', icon: '📱' },
  { value: 'Outras Despesas', label: 'Outras Despesas', icon: '🏷️' },
];

const PAYMENT_METHODS = [
  { value: 'Pix', label: 'Pix', icon: '⚡' },
  { value: 'Cartão de Crédito', label: 'Cartão de Crédito', icon: '💳' },
  { value: 'Cartão de Débito', label: 'Cartão de Débito', icon: '💳' },
  { value: 'Transferência', label: 'Transferência Bancária', icon: '🏦' },
  { value: 'Dinheiro', label: 'Dinheiro', icon: '💵' },
  { value: 'Boleto', label: 'Boleto', icon: '📄' },
];

const SECTION_CLASS = 'rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5';
const FIELD_CLASS = 'mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-normal shadow-2xs outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 sm:text-sm';

export default function TransactionModal({ open, onClose, onSave, initialData, defaultPatient }) {
  const dialogRef = useRef(null);
  const { patients } = usePatient();
  const [patientId, setPatientId] = useState('');
  const [isLinkingOpen, setIsLinkingOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('receita'); // 'receita' | 'despesa'
  const [category, setCategory] = useState(CATEGORIES_INCOME[0].value);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [status, setStatus] = useState('pago');
  const [notes, setNotes] = useState('');

  const [activeDropdown, setActiveDropdown] = useState(null); // 'category' | 'method' | null

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) {
      dialog.close();
      setActiveDropdown(null);
    }
  }, [open]);

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

  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description || '');
      setType(initialData.type || 'receita');
      setCategory(initialData.category || CATEGORIES_INCOME[0].value);
      setAmount(initialData.amount ? String(initialData.amount) : '');
      setDate(initialData.date || new Date().toISOString().split('T')[0]);
      setPaymentMethod(initialData.paymentMethod || 'Pix');
      setStatus(initialData.status || 'pago');
      setNotes(initialData.notes || '');
      setPatientId(initialData.patientId || '');
    } else {
      setPatientId(defaultPatient?.id || '');
      setDescription('');
      setType('receita');
      setCategory(CATEGORIES_INCOME[0].value);
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('Pix');
      setStatus('pago');
      setNotes('');
    }
    setActiveDropdown(null);
    setIsLinkingOpen(false);
    setPatientSearch('');
  }, [initialData, open, defaultPatient]);

  // Paciente cadastrado vinculado ao lançamento
  const linkedPatient = useMemo(() => {
    if (!patientId) return null;
    return (patients || []).find((p) => p.id === patientId) || null;
  }, [patients, patientId]);

  const filteredPatients = useMemo(() => {
    const q = patientSearch.toLowerCase().trim();
    const list = patients || [];
    if (!q) return list.slice(0, 10);
    return list.filter((p) => {
      const name = (p.full_name || p.name || '').toLowerCase();
      const phone = (p.whatsapp_phone || p.phone || '').toLowerCase();
      const cpf = (p.cpf || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || cpf.includes(q);
    });
  }, [patients, patientSearch]);

  const handleLinkPatient = (patient) => {
    setPatientId(patient.id);
    setIsLinkingOpen(false);
    setPatientSearch('');
  };

  useEffect(() => {
    if (!initialData) {
      setCategory(type === 'receita' ? CATEGORIES_INCOME[0].value : CATEGORIES_EXPENSE[0].value);
    }
  }, [type, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Informe a descrição do lançamento.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      alert('Informe um valor válido.');
      return;
    }

    onSave({
      ...(initialData || {}),
      description: description.trim(),
      type,
      category,
      amount: Number(amount),
      date,
      patientId: patientId || null,
      paymentMethod,
      status,
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      onClose={onClose}
      className="settings-dialog"
    >
      <form
        method="dialog"
        onSubmit={handleSubmit}
        className="settings-dialog__panel"
      >
        {/* Header no Padrão do Sistema */}
        <header className="flex items-center justify-between gap-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-white px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
              <DollarSign className="size-5 text-white" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-black text-slate-900 truncate">
                {initialData ? 'Editar Lançamento' : 'Novo Lançamento Financeiro'}
              </h2>
              <p className="text-xs text-slate-500">
                Registre receitas, consultas e despesas do consultório.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="Fechar janela"
          >
            <X className="size-4" />
          </button>
        </header>

        {/* Corpo do formulário */}
        <div className="settings-dialog__body space-y-5 bg-slate-50/70 p-4 sm:p-6">
          <fieldset className={SECTION_CLASS}>
            <legend className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
              <SlidersHorizontal className="size-3.5 text-emerald-600" aria-hidden="true" />
              DETALHES DO LANÇAMENTO
            </legend>

            {/* Tipo: Receita ou Despesa */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-4">
              <button
                type="button"
                onClick={() => setType('receita')}
                className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  type === 'receita'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownLeft className="size-4" />
                Receita (Entrada)
              </button>
              <button
                type="button"
                onClick={() => setType('despesa')}
                className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  type === 'despesa'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="size-4" />
                Despesa (Saída)
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Descrição <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Consulta Avulsa, Repasse Nutrologia, Aluguel..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={FIELD_CLASS}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Valor (R$) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`${FIELD_CLASS} font-bold text-slate-900`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Data <span className="text-rose-500">*</span>
                  </label>
                  <FinanceDateSelect
                    id="transaction-date"
                    value={date}
                    onChange={(val) => setDate(val)}
                    isOpen={activeDropdown === 'date'}
                    onToggle={() => setActiveDropdown(activeDropdown === 'date' ? null : 'date')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Categoria</label>
                  <DropdownSelect
                    id="transaction-category"
                    value={category}
                    onChange={(val) => setCategory(val)}
                    options={type === 'receita' ? CATEGORIES_INCOME : CATEGORIES_EXPENSE}
                    header="Categoria do Lançamento"
                    isOpen={activeDropdown === 'category'}
                    onToggle={() => setActiveDropdown(activeDropdown === 'category' ? null : 'category')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Forma de Pagamento</label>
                  <DropdownSelect
                    id="transaction-payment-method"
                    value={paymentMethod}
                    onChange={(val) => setPaymentMethod(val)}
                    options={PAYMENT_METHODS}
                    header="Forma de Pagamento"
                    align="right"
                    isOpen={activeDropdown === 'method'}
                    onToggle={() => setActiveDropdown(activeDropdown === 'method' ? null : 'method')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Observações (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Detalhes ou anotações..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 outline-none transition-all"
                />
              </div>
            </div>
          </fieldset>

          {/* Paciente vinculado (opcional) */}
          <fieldset className={`${SECTION_CLASS} relative ${isLinkingOpen ? 'z-50' : 'z-40'}`}>
            <legend className="mb-3 flex w-full items-center justify-between text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
              <div className="flex items-center gap-2">
                <User className="size-3.5 text-emerald-600" aria-hidden="true" />
                <span>PACIENTE (OPCIONAL)</span>
              </div>
              {patientId && (
                <button
                  type="button"
                  onClick={() => setPatientId('')}
                  className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Desvincular paciente deste lançamento"
                >
                  <Unlink className="size-3" />
                  <span>Desvincular</span>
                </button>
              )}
            </legend>

            <div className="space-y-3">
              {linkedPatient ? (
                <div className="flex flex-col gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-xs font-extrabold text-white shadow-2xs">
                      {(linkedPatient.full_name || linkedPatient.name || 'PA').slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <strong className="block truncate text-sm font-bold text-slate-900">
                          {linkedPatient.full_name || linkedPatient.name}
                        </strong>
                        <span className="rounded bg-emerald-200/80 px-1.5 text-[9px] font-extrabold uppercase text-emerald-800">
                          Vinculado
                        </span>
                      </div>
                      <span className="block truncate text-[11px] font-semibold text-emerald-700">
                        {linkedPatient.whatsapp_phone || linkedPatient.phone || 'Sem telefone cadastrado'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLinkingOpen(true);
                      setPatientSearch('');
                    }}
                    className="shrink-0 cursor-pointer rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-[11px] font-bold text-emerald-800 transition-colors hover:bg-emerald-100/70"
                  >
                    Trocar paciente
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-[11px] font-medium text-slate-600">
                    Nenhum paciente vinculado a este lançamento.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLinkingOpen(true);
                      setPatientSearch('');
                    }}
                    className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition-all hover:bg-emerald-500"
                  >
                    <Link2 className="size-3.5" />
                    <span>Vincular a cadastro existente</span>
                  </button>
                </div>
              )}

              {isLinkingOpen && (
                <div className="animate-fade-in space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <span className="text-[11px] font-extrabold text-slate-700">Selecione o paciente cadastrado:</span>
                    <button
                      type="button"
                      onClick={() => setIsLinkingOpen(false)}
                      className="cursor-pointer rounded-lg p-1 text-slate-400 hover:text-slate-600"
                      aria-label="Fechar seleção de paciente"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      autoFocus
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      placeholder="Buscar paciente por nome, WhatsApp ou CPF..."
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="custom-scrollbar max-h-44 space-y-1 overflow-y-auto">
                    {filteredPatients.length === 0 ? (
                      <p className="py-2 text-center text-[11px] text-slate-400">Nenhum paciente cadastrado encontrado.</p>
                    ) : (
                      filteredPatients.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleLinkPatient(p)}
                          className="group flex w-full cursor-pointer items-center justify-between rounded-lg p-2 text-left transition-colors hover:bg-emerald-50"
                        >
                          <div className="min-w-0">
                            <strong className="block truncate text-xs font-bold text-slate-800 group-hover:text-emerald-900">
                              {p.full_name || p.name}
                            </strong>
                            <span className="block truncate text-[10px] text-slate-500">
                              {p.whatsapp_phone || p.phone || 'Sem contato'} {p.cpf ? `· CPF ${p.cpf}` : ''}
                            </span>
                          </div>
                          <Check className="ml-2 size-3.5 shrink-0 text-emerald-600" />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </fieldset>
        </div>

        {/* Footer no Padrão do Sistema */}
        <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
          <p className="hidden text-xs text-slate-500 sm:block">
            <span className="font-bold text-slate-700">Dica:</span> confira a categoria e o valor antes de salvar.
          </p>
          <div className="flex flex-1 justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-xl px-4 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
            >
              <BadgeCheck className="size-4" />
              <span>Salvar Lançamento</span>
            </button>
          </div>
        </footer>
      </form>
    </dialog>
  );
}

function formatIsoDateToBr(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Seletor de data no padrão da plataforma (mesmo usado no cadastro de paciente)
function FinanceDateSelect({ id, value, onChange, isOpen = false, onToggle }) {
  const formattedDate = formatIsoDateToBr(value);

  return (
    <div className={`relative dropdown-select-container ${isOpen ? 'z-[60]' : 'z-10'}`}>
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
            {formattedDate || 'Selecione a data'}
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
          className="absolute left-0 mt-2 w-72 sm:w-80 app-solid-dropdown !bg-white bg-[#ffffff] rounded-2xl shadow-xl border border-slate-200 p-3 z-[70] animate-scale-up space-y-2.5"
          style={{ backgroundColor: '#ffffff', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Data do lançamento</span>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Escolha a data no calendário:</label>
            <input
              type="date"
              autoFocus
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer"
            />
          </div>

          {value && (
            <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/80 p-2.5 text-xs">
              <span className="text-emerald-800 font-medium">
                Data: <strong>{formattedDate}</strong>
              </span>
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

function DropdownSelect({
  id,
  value,
  onChange,
  options = [],
  placeholder = 'Selecione',
  header = 'Selecionar opção',
  align = 'left',
  isOpen = false,
  onToggle,
}) {
  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : (value || placeholder);
  const displayIcon = selectedOption ? selectedOption.icon : null;

  return (
    <div className={`relative dropdown-select-container ${isOpen ? 'z-[60]' : 'z-10'}`}>
      <button
        type="button"
        id={id}
        onClick={onToggle}
        className="flex min-h-11 w-full items-center justify-between gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs font-bold text-slate-800 shadow-2xs transition-all hover:border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 cursor-pointer active:scale-[0.99]"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-1.5 truncate">
          {displayIcon && <span className="text-sm shrink-0">{displayIcon}</span>}
          <span className="truncate">{displayLabel}</span>
        </span>
        <ChevronDown
          className={`size-3.5 shrink-0 opacity-70 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-600' : 'text-slate-400'}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute mt-2 min-w-[12rem] w-full app-solid-dropdown !bg-white bg-[#ffffff] rounded-2xl shadow-2xl border border-slate-200/90 p-2 z-[70] animate-scale-up space-y-1 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          style={{ backgroundColor: '#ffffff', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
        >
          {header && (
            <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              {header}
            </div>
          )}

          <div className="max-h-52 overflow-y-auto space-y-0.5 custom-scrollbar">
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
                    {opt.icon && <span className="mr-2 text-sm">{opt.icon}</span>}
                    <span className="truncate">{opt.label}</span>
                  </span>
                  {isSelected && <Check className="size-3.5 text-emerald-600 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
