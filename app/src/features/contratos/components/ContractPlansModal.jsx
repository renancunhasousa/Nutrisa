import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  Sparkles, 
  DollarSign, 
  CreditCard, 
  Calendar, 
  Tag, 
  FileText,
  AlignLeft
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth.js';

const COMMON_ICONS = ['🌿', '⭐', '👑', '💻', '💎', '🚀', '🎯', '🍎', '✨', '🥗', '🏆', '🩺'];

const SECTION_CLASS = 'rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5';
const INPUT_CLASS = 'min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 px-3.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/15 transition-all';

export function ContractPlansModal({
  isOpen,
  onClose,
  plans = [],
  onSavePlan,
  onDeletePlan,
  organizationId: propOrgId,
}) {
  const { organizationId: authOrgId } = useAuth();
  const effectiveOrgId = propOrgId || authOrgId;

  const [editingPlan, setEditingPlan] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Campos do formulário
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🌿');
  const [priceStr, setPriceStr] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [description, setDescription] = useState('');
  const [consultasCount, setConsultasCount] = useState(2);

  // Fechar no Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePriceInput = (val) => {
    const nums = val.replace(/\D/g, '');
    if (!nums) {
      setPriceStr('');
      return '';
    }
    const floatVal = (parseInt(nums, 10) / 100).toFixed(2);
    const formatted = floatVal
      .replace('.', ',')
      .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    setPriceStr(formatted);
    return formatted;
  };

  const parsePrice = (str) => {
    if (!str) return 0;
    const clean = String(str).replace(/\./g, '').replace(',', '.');
    return Number(clean) || 0;
  };

  const handleStartCreate = () => {
    setEditingPlan(null);
    setName('');
    setIcon('🌿');
    setPriceStr('');
    setPaymentMethods([
      { id: '1', name: 'Pix à vista', feePercentage: 0, price: 0 },
    ]);
    setDescription('');
    setConsultasCount(2);
    setErrorMsg('');
    setIsCreating(true);
  };

  const handleStartEdit = (p) => {
    setIsCreating(false);
    setEditingPlan(p);
    setName(p.name || '');
    setIcon(p.icon || '🌿');
    const formattedPrice = p.defaultPrice
      ? p.defaultPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '';
    setPriceStr(formattedPrice);

    const methods = Array.isArray(p.paymentMethods) && p.paymentMethods.length > 0
      ? p.paymentMethods.map((pm, idx) => ({
          id: pm.id || `pm-${idx}`,
          name: pm.name || 'Forma',
          feePercentage: pm.feePercentage != null ? pm.feePercentage : 0,
          price: pm.price != null ? pm.price : (p.defaultPrice || 0),
        }))
      : [{ id: '1', name: p.defaultPaymentMethod || 'Pix à vista', feePercentage: 0, price: p.defaultPrice || 0 }];

    setPaymentMethods(methods);
    setDescription(p.description || '');
    setConsultasCount(p.consultasCount || 1);
    setErrorMsg('');
  };

  const handleCancelForm = () => {
    setIsCreating(false);
    setEditingPlan(null);
    setErrorMsg('');
  };

  const handleBasePriceChange = (val) => {
    handlePriceInput(val);
    const baseVal = parsePrice(val);
    setPaymentMethods((prev) =>
      prev.map((pm) => {
        const fee = Number(pm.feePercentage) || 0;
        const calculated = baseVal > 0 ? Math.round(baseVal * (1 + fee / 100) * 100) / 100 : pm.price;
        return { ...pm, price: calculated };
      })
    );
  };

  const handleAddPaymentMethod = () => {
    const baseVal = parsePrice(priceStr) || 0;
    const defaultSuggestions = ['Pix à vista', 'Cartão à vista (1x)', 'Cartão 3x', 'Cartão 6x', 'Cartão 12x', 'Boleto'];
    const usedNames = paymentMethods.map((pm) => pm.name.toLowerCase());
    const nextName = defaultSuggestions.find((s) => !usedNames.includes(s.toLowerCase())) || `Forma ${paymentMethods.length + 1}`;

    let fee = 0;
    if (nextName.includes('3x')) fee = 4.0;
    else if (nextName.includes('6x')) fee = 8.0;
    else if (nextName.includes('12x')) fee = 14.0;
    else if (nextName.includes('1x') || nextName.includes('à vista') || nextName.includes('pix')) fee = 0;

    const calcPrice = baseVal > 0 ? Math.round(baseVal * (1 + fee / 100) * 100) / 100 : baseVal;

    setPaymentMethods((prev) => [
      ...prev,
      {
        id: `pm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: nextName,
        feePercentage: fee,
        price: calcPrice,
      },
    ]);
  };

  const handleUpdatePaymentMethod = (index, field, value) => {
    setPaymentMethods((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };
      const baseVal = parsePrice(priceStr) || 0;

      if (field === 'feePercentage') {
        const fee = Number(value) || 0;
        item.feePercentage = value;
        if (baseVal > 0) {
          item.price = Math.round(baseVal * (1 + fee / 100) * 100) / 100;
        }
      } else if (field === 'price') {
        const pr = Number(value) || 0;
        item.price = value;
        if (baseVal > 0 && pr >= baseVal) {
          item.feePercentage = Number((((pr - baseVal) / baseVal) * 100).toFixed(2));
        }
      } else {
        item[field] = value;
      }

      updated[index] = item;
      return updated;
    });
  };

  const handleRemovePaymentMethod = (index) => {
    setPaymentMethods((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Informe o nome do plano.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    try {
      const primaryMethod = paymentMethods[0];
      const finalPrice = primaryMethod?.price != null ? Number(primaryMethod.price) : parsePrice(priceStr);
      const finalMethodName = primaryMethod?.name ? String(primaryMethod.name).trim() : 'Pix à vista';

      await onSavePlan({
        id: editingPlan?.id || null,
        organizationId: effectiveOrgId,
        name: name.trim(),
        icon: icon || '📋',
        defaultPrice: finalPrice,
        defaultPaymentMethod: finalMethodName,
        paymentMethods: paymentMethods.map((pm) => ({
          id: pm.id,
          name: String(pm.name || '').trim(),
          feePercentage: Number(pm.feePercentage) || 0,
          price: Number(pm.price) || 0,
        })),
        description: description.trim(),
        consultasCount: Number(consultasCount) || 1,
        displayOrder: editingPlan?.displayOrder || plans.length + 1,
      });
      setIsCreating(false);
      setEditingPlan(null);
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao salvar plano no Supabase.');
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div
      className="app-modal-overlay animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="contract-plans-title"
    >
      <div className="app-modal-panel max-w-2xl sm:max-w-3xl animate-scaleIn">
        {/* CABEÇALHO DO MODAL */}
        <div className="app-modal-header flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
              <Sparkles className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 id="contract-plans-title" className="truncate text-xl font-black text-slate-900">
                Planos e Valores da Clínica
              </h3>
              <p className="text-xs text-slate-500">
                Gerencie os planos da clínica, valores sugeridos e condições que se refletem na emissão de contratos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="Fechar janela de planos"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* CORPO DO MODAL */}
        <div className="app-modal-body space-y-5 bg-slate-50/70 p-4 sm:p-6">
          {errorMsg && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-800">
              {errorMsg}
            </div>
          )}

          {/* FORMULÁRIO DE CRIAÇÃO / EDIÇÃO */}
          {(isCreating || editingPlan) ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <fieldset className={SECTION_CLASS}>
                <legend className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
                  <Tag className="size-3.5 text-emerald-600" aria-hidden="true" />
                  <span>{isCreating ? 'Dados do Novo Plano' : `Editar: ${editingPlan.name}`}</span>
                </legend>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nome do Plano <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Essence, Diamond, Trimestral..."
                      className={INPUT_CLASS}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Ícone / Emoji
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={4}
                        value={icon}
                        onChange={(e) => setIcon(e.target.value)}
                        className="min-h-11 w-14 rounded-xl border border-slate-200 bg-slate-50/60 text-center text-xl font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/15 transition-all"
                      />
                      <div className="flex items-center gap-1 overflow-x-auto py-1">
                        {COMMON_ICONS.slice(0, 5).map((ic) => (
                          <button
                            key={ic}
                            type="button"
                            onClick={() => setIcon(ic)}
                            className="size-8 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 text-base flex items-center justify-center transition-all cursor-pointer border border-transparent hover:border-emerald-200"
                          >
                            {ic}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                      <DollarSign className="size-3.5 text-emerald-600" />
                      <span>Valor Base do Plano (R$)</span>
                    </label>
                    <input
                      type="text"
                      value={priceStr}
                      onChange={(e) => handleBasePriceChange(e.target.value)}
                      placeholder="Ex: 1.500,00"
                      className={INPUT_CLASS}
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Valor de referência usado para calcular automaticamente as taxas das formas de pagamento.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                      <Calendar className="size-3.5 text-emerald-600" />
                      <span>Consultas Previstas</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={consultasCount}
                      onChange={(e) => setConsultasCount(e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>

                {/* BLOCO: FORMAS DE PAGAMENTO & TAXAS */}
                <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-3 mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <CreditCard className="size-3.5 text-emerald-600" />
                        <span>Formas de Pagamento & Taxas</span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Cadastre opções (ex: Pix, Cartão 3x, 6x). Digite a % da taxa para calcular o valor automaticamente.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddPaymentMethod}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer shrink-0"
                    >
                      <Plus className="size-3.5" />
                      <span>Adicionar forma de pagamento</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {paymentMethods.map((pm, idx) => (
                      <div
                        key={pm.id || idx}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs transition-colors hover:border-slate-300"
                      >
                        {/* Forma de Pagamento */}
                        <div className="sm:col-span-5">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Forma / Condição
                          </label>
                          <input
                            type="text"
                            value={pm.name}
                            onChange={(e) => handleUpdatePaymentMethod(idx, 'name', e.target.value)}
                            placeholder="Ex: Pix à vista, Cartão 3x..."
                            className="w-full min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 shadow-2xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15"
                          />
                        </div>

                        {/* Taxa % */}
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Taxa (%)
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={pm.feePercentage}
                              onChange={(e) => handleUpdatePaymentMethod(idx, 'feePercentage', e.target.value)}
                              placeholder="0"
                              className="w-full min-h-10 rounded-xl border border-slate-200 bg-white pl-3 pr-7 text-xs font-bold text-slate-800 shadow-2xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15"
                            />
                            <span className="absolute right-2.5 text-xs font-bold text-slate-400 pointer-events-none">%</span>
                          </div>
                        </div>

                        {/* Valor Calculado (R$) */}
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Valor Final (R$)
                          </label>
                          <div className="relative flex items-center">
                            <span className="absolute left-3 text-xs font-bold text-slate-400 pointer-events-none">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={pm.price}
                              onChange={(e) => handleUpdatePaymentMethod(idx, 'price', e.target.value)}
                              placeholder="0.00"
                              className="w-full min-h-10 rounded-xl border border-emerald-200 bg-emerald-50/50 pl-8 pr-2.5 text-xs font-black text-emerald-950 shadow-2xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15"
                            />
                          </div>
                        </div>

                        {/* Remover */}
                        <div className="sm:col-span-1 flex justify-end pb-1">
                          <button
                            type="button"
                            onClick={() => handleRemovePaymentMethod(idx)}
                            className="flex size-9 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remover esta forma de pagamento"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {paymentMethods.length === 0 && (
                      <div className="text-center py-4 bg-white rounded-xl border border-dashed border-slate-200">
                        <p className="text-xs text-slate-400">Nenhuma forma de pagamento específica adicionada.</p>
                        <button
                          type="button"
                          onClick={handleAddPaymentMethod}
                          className="text-xs font-bold text-emerald-600 hover:underline mt-1.5 cursor-pointer"
                        >
                          + Adicionar primeira forma de pagamento
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                    <AlignLeft className="size-3.5 text-emerald-600" />
                    <span>Descrição / Inclusões (Opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Acompanhamento quinzenal com bioimpedância e suporte contínuo..."
                    className={INPUT_CLASS}
                  />
                </div>
              </fieldset>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancelar Edição
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="size-4" />
                  <span>{isSaving ? 'Salvando no Supabase...' : 'Salvar Plano'}</span>
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* TOPO COM AÇÃO DE NOVO PLANO */}
              <div className="flex items-center justify-between pb-1">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                    Planos Ativos da Clínica ({plans.length})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleStartCreate}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 cursor-pointer"
                >
                  <Plus className="size-4" />
                  <span>Novo Plano</span>
                </button>
              </div>

              {/* LISTAGEM DOS PLANOS CADASTRADOS */}
              <div className="space-y-3">
                {plans.map((p) => {
                  const planMethods = Array.isArray(p.paymentMethods) && p.paymentMethods.length > 0
                    ? p.paymentMethods
                    : [{ name: p.defaultPaymentMethod || 'Pix à vista', feePercentage: 0, price: p.defaultPrice }];

                  return (
                    <div
                      key={p.id}
                      className="group flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3.5">
                          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100 text-2xl shadow-2xs">
                            {p.icon || '📋'}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-black text-slate-900 truncate">
                                {p.name}
                              </h4>
                              {p.consultasCount > 1 && (
                                <span className="text-[11px] font-medium text-slate-500">
                                  • {p.consultasCount} consultas inclusas
                                </span>
                              )}
                            </div>
                            {p.description ? (
                              <p className="mt-0.5 text-xs text-slate-500 truncate">
                                {p.description}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(p)}
                            className="flex size-9 items-center justify-center rounded-xl text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 transition cursor-pointer"
                            title="Editar plano"
                            aria-label={`Editar plano ${p.name}`}
                          >
                            <Edit2 className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Tem certeza que deseja excluir o plano "${p.name}"?`)) {
                                onDeletePlan(p.id);
                              }
                            }}
                            className="flex size-9 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer"
                            title="Excluir plano"
                            aria-label={`Excluir plano ${p.name}`}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>

                      {/* Formas de Pagamento Cadastradas do Plano */}
                      <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2.5">
                        <span className="text-xs font-normal text-slate-400 mr-0.5">
                          Condições:
                        </span>
                        {planMethods.map((pm, pidx) => (
                          <span
                            key={pm.id || pidx}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/60 bg-transparent px-2.5 py-1 text-xs font-normal text-slate-600"
                          >
                            <span>{pm.name}:</span>
                            <span className="text-emerald-600 font-semibold">
                              R$ {Number(pm.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            {Number(pm.feePercentage) > 0 && (
                              <span className="text-[10px] font-normal text-amber-700 bg-amber-50/70 px-1.5 py-0.5 rounded border border-amber-200/50">
                                {pm.feePercentage}% taxa
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {plans.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                    <FileText className="mx-auto size-9 text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">Nenhum plano configurado no momento.</p>
                    <button
                      type="button"
                      onClick={handleStartCreate}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                    >
                      <Plus className="size-3.5" />
                      <span>Cadastrar primeiro plano agora</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* RODAPÉ DO MODAL */}
        <div className="app-modal-footer flex items-center justify-between gap-3 border-t border-slate-200/80 bg-white p-4 sm:px-6">
          <p className="text-xs text-slate-400 font-medium">
            Os planos cadastrados ficam salvos no Supabase da sua clínica.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ContractPlansModal;
