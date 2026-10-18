import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  User,
  Stethoscope,
  SlidersHorizontal,
  ChevronDown,
  Check,
  BadgeCheck,
  Link2,
  Unlink,
  Search,
  AlertCircle,
  ArrowRight,
  Plus,
  Trash2,
  CreditCard,
} from 'lucide-react';
import { usePatient } from '../../pacientes/usePatient.js';

const FREQUENCY_OPTIONS = [
  { value: 'Semanal', label: 'Semanal', icon: '🗓️' },
  { value: 'Quinzenal', label: 'Quinzenal', icon: '🗓️' },
  { value: 'Mensal', label: 'Mensal', icon: '📅' },
  { value: 'Bimestral', label: 'Bimestral', icon: '📅' },
  { value: 'Trimestral', label: 'Trimestral', icon: '📅' },
  { value: 'Personalizada', label: 'Personalizada', icon: '⚙️' },
];

const PAYMENT_OPTIONS = [
  { value: 'pago', label: 'Pago Integral', icon: '🟢' },
  { value: 'parcial', label: 'Parcialmente Pago', icon: '🟡' },
  { value: 'pendente', label: 'Pendente de Pagamento', icon: '🔴' },
];

const STATUS_OPTIONS = [
  { value: 'ativo', label: 'Ativo', icon: '🟢' },
  { value: 'concluido', label: 'Concluído', icon: '🏁' },
  { value: 'pausado', label: 'Pausado', icon: '⏸️' },
  { value: 'cancelado', label: 'Cancelado', icon: '❌' },
];

const PARTNER_SUGGESTIONS = [
  'Dr. Nutrólogo',
  'Dr. Lucas (Nutrologia)',
  'Dra. Camila (Endocrinologia)',
  'Clínica Integrada',
];

const SECTION_CLASS = 'rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5';
const FIELD_CLASS = 'mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-normal shadow-2xs outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 sm:text-sm';

export default function PackageModal({ open, onClose, onSave, initialData }) {
  const dialogRef = useRef(null);
  const { patients } = usePatient();

  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientId, setPatientId] = useState('');
  const [partnerName, setPartnerName] = useState('Dr. Nutrólogo');
  const [planName, setPlanName] = useState('');
  const [frequency, setFrequency] = useState('Mensal');
  const [totalConsultations, setTotalConsultations] = useState(6);
  const [completedConsultations, setCompletedConsultations] = useState(0);
  const [packageValue, setPackageValue] = useState('');
  const [partnerShare, setPartnerShare] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState('pago');
  const [status, setStatus] = useState('ativo');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const [patientQuery, setPatientQuery] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null); // 'frequency' | 'payment' | 'status' | null

  // Estado para o painel "Vincular a cadastro existente"
  const [isLinkingOpen, setIsLinkingOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) {
      dialog.close();
      setActiveDropdown(null);
      setIsLinkingOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!activeDropdown && !isPatientDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-select-container')) {
        setActiveDropdown(null);
        setIsPatientDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
        setIsPatientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeDropdown, isPatientDropdownOpen]);

  useEffect(() => {
    if (initialData) {
      setPatientName(initialData.patientName || '');
      setPatientPhone(initialData.patientPhone || '');
      setPatientId(initialData.patientId || '');
      setPartnerName(initialData.partnerName || 'Dr. Nutrólogo');
      setPlanName(initialData.planName || '');
      setFrequency(initialData.frequency || 'Mensal');
      setTotalConsultations(initialData.totalConsultations ?? 6);
      setCompletedConsultations(initialData.completedConsultations ?? 0);
      setPackageValue(initialData.packageValue ? String(initialData.packageValue) : '');
      setPartnerShare(initialData.partnerShare ? String(initialData.partnerShare) : '');
      setPaymentMethods(
        Array.isArray(initialData.paymentMethods)
          ? initialData.paymentMethods
          : initialData.packageValue
            ? [{ id: '1', name: 'Valor Principal', feePercentage: 0, price: Number(initialData.packageValue) }]
            : []
      );
      setPaymentStatus(initialData.paymentStatus || 'pago');
      setStatus(initialData.status || 'ativo');
      setStartDate(initialData.startDate || new Date().toISOString().split('T')[0]);
      setNotes(initialData.notes || '');
      setPatientQuery(initialData.patientName || '');
    } else {
      setPatientName('');
      setPatientPhone('');
      setPatientId('');
      setPartnerName('Dr. Nutrólogo');
      setPlanName('Protocolo Integrado (Nutro + Nutri)');
      setFrequency('Mensal');
      setTotalConsultations(6);
      setCompletedConsultations(0);
      setPackageValue('');
      setPartnerShare('');
      setPaymentMethods([]);
      setPaymentStatus('pago');
      setStatus('ativo');
      setStartDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setPatientQuery('');
    }
    setIsPatientDropdownOpen(false);
    setActiveDropdown(null);
    setIsLinkingOpen(false);
    setPatientSearch('');
  }, [initialData, open]);

  const handleAddPaymentMethod = () => {
    const baseVal = Number(packageValue) || 0;
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
      const baseVal = Number(packageValue) || 0;

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

  // Paciente cadastrado vinculado
  const linkedPatient = useMemo(() => {
    if (!patientId) return null;
    return (patients || []).find((p) => p.id === patientId) || null;
  }, [patients, patientId]);

  // Sugestões inteligentes com base no nome digitado caso não esteja vinculado
  const candidateSuggestions = useMemo(() => {
    if (linkedPatient || !patientName?.trim()) return [];
    const query = patientName.trim().toLowerCase();
    return (patients || [])
      .filter((p) => {
        const pName = (p.full_name || p.name || '').toLowerCase();
        return pName && (pName.includes(query) || query.includes(pName));
      })
      .slice(0, 3);
  }, [patients, linkedPatient, patientName]);

  // Busca do painel "Vincular a cadastro existente"
  const filteredCandidates = useMemo(() => {
    if (!patientSearch.trim()) return (patients || []).slice(0, 10);
    const q = patientSearch.toLowerCase().trim();
    return (patients || []).filter((p) => {
      const name = (p.full_name || p.name || '').toLowerCase();
      const phone = (p.whatsapp_phone || p.phone || '').toLowerCase();
      const cpf = (p.cpf || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || cpf.includes(q);
    });
  }, [patients, patientSearch]);

  const handleLinkPatient = (patient) => {
    const pName = patient.full_name || patient.name || '';
    const pPhone = patient.whatsapp_phone || patient.phone || '';
    setPatientId(patient.id);
    setPatientName(pName);
    setPatientPhone(pPhone);
    setPatientQuery(pName);
    setIsLinkingOpen(false);
    setIsPatientDropdownOpen(false);
  };

  const handleUnlinkPatient = () => {
    setPatientId('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!patientName.trim()) {
      alert('Por favor, informe o nome do paciente.');
      return;
    }
    if (!planName.trim()) {
      alert('Por favor, informe o nome do plano/pacote.');
      return;
    }

    const payload = {
      ...(initialData || {}),
      patientId: patientId || null,
      patientName: patientName.trim(),
      patientPhone: patientPhone.trim(),
      partnerName: partnerName.trim(),
      planName: planName.trim(),
      frequency,
      totalConsultations: Math.max(1, Number(totalConsultations) || 1),
      completedConsultations: Math.max(0, Number(completedConsultations) || 0),
      packageValue: packageValue ? Number(packageValue) : 0,
      partnerShare: partnerShare ? Number(partnerShare) : 0,
      paymentMethods: paymentMethods.map((pm) => ({
        id: pm.id,
        name: String(pm.name || '').trim(),
        feePercentage: Number(pm.feePercentage) || 0,
        price: Number(pm.price) || 0,
      })),
      paymentStatus,
      status,
      startDate,
      notes: notes.trim(),
    };

    onSave(payload);
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
              <Stethoscope className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-slate-900 truncate">
                {initialData ? 'Editar Pacote de Parceria' : 'Cadastrar Pacote de Parceria'}
              </h2>
              <p className="text-xs text-slate-500">
                Controle sessões, consultas feitas, pendências e repasses da parceria.
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

        {/* Corpo com Scroll interno */}
        <div className="settings-dialog__body space-y-5 bg-slate-50/70 p-4 sm:p-6">
          {/* Seção 1: Identificação & Vínculo do Paciente */}
          <fieldset className={`${SECTION_CLASS} relative ${isLinkingOpen ? 'z-50' : 'z-40'}`}>
            <legend className="mb-3 flex items-center justify-between text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900 w-full">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-3.5 text-emerald-600" aria-hidden="true" />
                <span>PRONTUÁRIO & CADASTRO DO PACIENTE</span>
              </div>
              {linkedPatient && (
                <button
                  type="button"
                  onClick={handleUnlinkPatient}
                  className="text-[10px] font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Desvincular paciente deste pacote"
                >
                  <Unlink className="size-3" />
                  <span>Desvincular</span>
                </button>
              )}
            </legend>

            <div className="space-y-3">
              {/* Card de Vínculo com Cadastro Existente (Padrão idêntico ao da imagem) */}
              {linkedPatient ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="size-9 shrink-0 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-xs shadow-2xs">
                      {(linkedPatient.full_name || linkedPatient.name || 'PA').slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <strong className="block text-sm font-bold text-slate-900 truncate">
                          {linkedPatient.full_name || linkedPatient.name}
                        </strong>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-emerald-200/80 text-emerald-800">
                          Vinculado
                        </span>
                      </div>
                      <span className="block text-[11px] text-emerald-700 font-semibold truncate">
                        {linkedPatient.whatsapp_phone || linkedPatient.phone || 'Sem telefone cadastrado'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setIsLinkingOpen(true);
                        setPatientSearch('');
                      }}
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
                      Nenhum paciente vinculado a este agendamento.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLinkingOpen(true);
                      setPatientSearch(patientName || '');
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-2xs cursor-pointer shrink-0"
                  >
                    <Link2 className="size-3.5" />
                    <span>Vincular a cadastro existente</span>
                  </button>
                </div>
              )}

              {/* Sugestões automáticas se houver pacientes com nome compatível */}
              {!linkedPatient && candidateSuggestions.length > 0 && !isLinkingOpen && (
                <div className="pt-0.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400">Sugeridos:</span>
                  {candidateSuggestions.map((candidate) => (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => handleLinkPatient(candidate)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-[11px] font-semibold text-emerald-800 transition-colors cursor-pointer"
                    >
                      <span>{candidate.full_name || candidate.name}</span>
                      <ArrowRight className="size-2.5" />
                    </button>
                  ))}
                </div>
              )}

              {/* Painel de busca e seleção de paciente */}
              {isLinkingOpen && (
                <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 animate-fade-in shadow-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <span className="text-[11px] font-extrabold text-slate-700">
                      Selecione o paciente cadastrado:
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsLinkingOpen(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>

                  <div className="max-h-44 overflow-y-auto space-y-1 custom-scrollbar">
                    {filteredCandidates.length === 0 ? (
                      <p className="text-[11px] text-slate-400 text-center py-2">
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
                            <strong className="block text-xs font-bold text-slate-800 truncate group-hover:text-emerald-900">
                              {p.full_name || p.name}
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

              {/* Campo Nome do Paciente */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Nome do Paciente <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 size-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Digite o nome do paciente..."
                    value={patientName}
                    onChange={(e) => {
                      setPatientName(e.target.value);
                      setPatientQuery(e.target.value);
                    }}
                    className={`${FIELD_CLASS} pl-10 pr-9`}
                    required
                  />
                  {patientName && (
                    <button
                      type="button"
                      onClick={() => {
                        setPatientName('');
                        setPatientId('');
                        setPatientPhone('');
                        setPatientQuery('');
                      }}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      title="Limpar paciente"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Telefone e Data de Início */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="(11) 90000-0000"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className={FIELD_CLASS}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Data de Início</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={FIELD_CLASS}
                  />
                </div>
              </div>
            </div>
          </fieldset>

          {/* Seção 2: Plano & Consultas */}
          <fieldset className={`${SECTION_CLASS} relative ${activeDropdown === 'partner' || activeDropdown === 'frequency' ? 'z-50' : 'z-30'}`}>
            <legend className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
              <SlidersHorizontal className="size-3.5 text-emerald-600" aria-hidden="true" />
              PLANO & PARCERIA
            </legend>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={`relative dropdown-select-container ${activeDropdown === 'partner' ? 'z-[60]' : 'z-10'}`}>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Profissional Parceiro (Ex: Nutrólogo) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="Ex: Dr. Lucas (Nutrologia)"
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      onFocus={() => setActiveDropdown('partner')}
                      className={`${FIELD_CLASS} pr-9`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setActiveDropdown(activeDropdown === 'partner' ? null : 'partner')}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      title="Ver parceiros sugeridos"
                    >
                      <ChevronDown className={`size-3.5 transition-transform ${activeDropdown === 'partner' ? 'rotate-180 text-emerald-600' : ''}`} />
                    </button>
                  </div>

                  {activeDropdown === 'partner' && (
                    <div
                      className="absolute mt-2 left-0 right-0 app-solid-dropdown !bg-white bg-[#ffffff] rounded-2xl shadow-2xl border border-slate-200/90 p-2 z-[70] animate-scale-up space-y-1"
                      style={{ backgroundColor: '#ffffff', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
                    >
                      <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Parceiros Sugeridos
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar">
                        {PARTNER_SUGGESTIONS.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => {
                              setPartnerName(item);
                              setActiveDropdown(null);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              partnerName === item
                                ? 'bg-emerald-50 text-emerald-900 font-bold'
                                : 'text-slate-700 hover:bg-slate-50 font-medium'
                            }`}
                          >
                            <span>{item}</span>
                            {partnerName === item && <Check className="size-3.5 text-emerald-600 shrink-0 ml-1" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Nome do Plano / Protocolo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Protocolo Integrado 6M"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    className={FIELD_CLASS}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Frequência</label>
                  <DropdownSelect
                    id="package-frequency"
                    value={frequency}
                    onChange={(val) => setFrequency(val)}
                    options={FREQUENCY_OPTIONS}
                    header="Frequência das Consultas"
                    isOpen={activeDropdown === 'frequency'}
                    onToggle={() => setActiveDropdown(activeDropdown === 'frequency' ? null : 'frequency')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Total de Consultas
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={totalConsultations}
                    onChange={(e) => setTotalConsultations(Number(e.target.value))}
                    className={`${FIELD_CLASS} font-bold`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Consultas Feitas
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={totalConsultations}
                    value={completedConsultations}
                    onChange={(e) => setCompletedConsultations(Number(e.target.value))}
                    className={`${FIELD_CLASS} font-bold text-emerald-700 bg-emerald-50/50`}
                  />
                </div>
              </div>
            </div>
          </fieldset>

          {/* Seção 3: Financeiro & Repasse */}
          <fieldset className={`${SECTION_CLASS} relative ${activeDropdown === 'payment' ? 'z-50' : 'z-20'}`}>
            <legend className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
              <SlidersHorizontal className="size-3.5 text-emerald-600" aria-hidden="true" />
              FINANCEIRO & REPASSE
            </legend>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Valor do Pacote (R$)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={packageValue}
                    onChange={(e) => setPackageValue(e.target.value)}
                    className={`${FIELD_CLASS} pl-9 font-semibold`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Repasse Parceiro (R$)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={partnerShare}
                    onChange={(e) => setPartnerShare(e.target.value)}
                    className={`${FIELD_CLASS} pl-9 font-semibold`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Pagamento</label>
                <DropdownSelect
                  id="package-payment-status"
                  value={paymentStatus}
                  onChange={(val) => setPaymentStatus(val)}
                  options={PAYMENT_OPTIONS}
                  header="Status de Pagamento"
                  align="right"
                  isOpen={activeDropdown === 'payment'}
                  onToggle={() => setActiveDropdown(activeDropdown === 'payment' ? null : 'payment')}
                />
              </div>
            </div>

            {/* Formas de Pagamento & Taxas do Pacote */}
            <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-2.5">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <CreditCard className="size-3.5 text-emerald-600" />
                    <span>Formas de Pagamento Aceitas & Taxas</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Defina valores específicos por forma de pagamento (Pix, Cartão 3x, etc.) aplicando % de taxa da maquininha.
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

              <div className="space-y-2">
                {paymentMethods.map((pm, idx) => (
                  <div
                    key={pm.id || idx}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-2xs hover:border-slate-300 transition-colors"
                  >
                    <div className="sm:col-span-5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                        Forma / Condição
                      </label>
                      <input
                        type="text"
                        value={pm.name}
                        onChange={(e) => handleUpdatePaymentMethod(idx, 'name', e.target.value)}
                        placeholder="Ex: Cartão 3x..."
                        className="w-full min-h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-800 shadow-2xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
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
                          className="w-full min-h-9 rounded-lg border border-slate-200 bg-white pl-2.5 pr-6 text-xs font-bold text-slate-800 shadow-2xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
                        />
                        <span className="absolute right-2 text-xs font-bold text-slate-400 pointer-events-none">%</span>
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                        Valor (R$)
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-2.5 text-xs font-bold text-slate-400 pointer-events-none">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={pm.price}
                          onChange={(e) => handleUpdatePaymentMethod(idx, 'price', e.target.value)}
                          placeholder="0.00"
                          className="w-full min-h-9 rounded-lg border border-emerald-200 bg-emerald-50/50 pl-7 pr-2 text-xs font-black text-emerald-950 shadow-2xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-1 flex justify-end pb-0.5">
                      <button
                        type="button"
                        onClick={() => handleRemovePaymentMethod(idx)}
                        className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Remover forma"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {paymentMethods.length === 0 && (
                  <p className="text-[11px] text-slate-400 text-center py-1">
                    Nenhuma forma de pagamento extra cadastrada com taxa.
                  </p>
                )}
              </div>
            </div>
          </fieldset>

          {/* Seção 4: Pendências e Status */}
          <fieldset className={`${SECTION_CLASS} relative ${activeDropdown === 'status' ? 'z-50' : 'z-10'}`}>
            <legend className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
              <SlidersHorizontal className="size-3.5 text-emerald-600" aria-hidden="true" />
              PENDÊNCIAS & STATUS
            </legend>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Status do Pacote</label>
                  <DropdownSelect
                    id="package-status"
                    value={status}
                    onChange={(val) => setStatus(val)}
                    options={STATUS_OPTIONS}
                    header="Status do Pacote"
                    isOpen={activeDropdown === 'status'}
                    onToggle={() => setActiveDropdown(activeDropdown === 'status' ? null : 'status')}
                  />
                </div>
                <div className="hidden sm:block text-xs text-slate-400 pb-3">
                  Defina o andamento geral deste protocolo na clínica.
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Observações e Pendências</label>
                <textarea
                  rows={3}
                  placeholder="Descreva pendências clínicas ou administrativas (ex: aguardando retorno dos exames de sangue do nutrólogo, agendar 3ª consulta em novembro...)"
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
            <span className="font-bold text-slate-700">Dica:</span> confira o total de consultas contratadas e o repasse.
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
              <span>{initialData ? 'Salvar Alterações' : 'Cadastrar Pacote'}</span>
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
