import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';

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

export default function TransactionModal({ open, onClose, onSave, initialData }) {
  const dialogRef = useRef(null);
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
    } else {
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
  }, [initialData, open]);

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
        <header className="flex items-center justify-between gap-4 border-b border-slate-200/80 bg-white px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
              <DollarSign className="size-5 text-white" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-slate-900 truncate">
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
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={FIELD_CLASS}
                    required
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
