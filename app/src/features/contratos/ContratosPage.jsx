import React, { useEffect, useState } from 'react';
import { useContratos } from './hooks/useContratos';
import { SignaturePad } from './components/SignaturePad';
import { ContratoPrintLayout } from './components/ContratoPrintLayout';
import { ContratoRichTextToolbar } from './components/ContratoRichTextToolbar';
import PatientContextBar from '../pacientes/components/PatientContextBar.jsx';
import {
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Save,
  FileSignature,
  Link as LinkIcon,
  Sparkles,
  Bot,
  FileText,
  X,
  FilePlus,
  Printer,
  RotateCcw,
  PlusCircle,
  RefreshCw,
  User,
  Calendar,
  Clock,
  DollarSign,
  CreditCard,
  LayoutTemplate,
  Tag,
  Check,
  ChevronDown,
  List,
  CheckCircle,
  Settings,
} from 'lucide-react';
import { CONTRACT_VARIABLES } from './domain/contractVariables';
import { ContractPlansModal } from './components/ContractPlansModal';

const PLAN_OPTIONS = [
  { id: 'essence', label: 'Essence', icon: '🌿' },
  { id: 'premium', label: 'Premium', icon: '⭐' },
  { id: 'legacy', label: 'Legacy', icon: '👑' },
  { id: 'online', label: 'Consultoria Online', icon: '💻' },
];

function formatIsoDateToBr(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return dateStr;
}

function getFutureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DATE_SHORTCUTS = [
  { label: 'Hoje', days: 0 },
  { label: 'Em 15 dias', days: 15 },
  { label: 'Em 30 dias (1 mês)', days: 30 },
  { label: 'Em 45 dias', days: 45 },
  { label: 'Em 60 dias (2 meses)', days: 60 },
  { label: 'Em 90 dias (3 meses)', days: 90 },
];

const TIME_OPTIONS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00',
];

export default function ContratosPage({ activeModel, nutritionist }) {
  const ctx = useContratos(activeModel, nutritionist);
  const { activeTab, setActiveTab } = ctx;
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const [isPlanMenuOpen, setIsPlanMenuOpen] = useState(false);
  const [isPaymentMenuOpen, setIsPaymentMenuOpen] = useState(false);
  const [openConsultaDropdown, setOpenConsultaDropdown] = useState(null); // { index, type: 'date' | 'time' } | null

  useEffect(() => {
    if (!isTemplateMenuOpen && !isPlanMenuOpen && !isPaymentMenuOpen && !openConsultaDropdown) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('.contratos-template-dropdown')) {
        setIsTemplateMenuOpen(false);
      }
      if (!e.target.closest('.contratos-plan-dropdown')) {
        setIsPlanMenuOpen(false);
      }
      if (!e.target.closest('.contratos-payment-dropdown')) {
        setIsPaymentMenuOpen(false);
      }
      if (!e.target.closest('.consulta-dropdown-container')) {
        setOpenConsultaDropdown(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsTemplateMenuOpen(false);
        setIsPlanMenuOpen(false);
        setIsPaymentMenuOpen(false);
        setOpenConsultaDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTemplateMenuOpen, isPlanMenuOpen, isPaymentMenuOpen, openConsultaDropdown]);

  return (
    <>
    <div className="animate-fadeIn mx-auto w-full min-w-0 max-w-7xl print:hidden">
      <PatientContextBar action="O contrato" recordType="contrato" />
      {/* STEPPER PROGRESS BAR */}
      <div className="mx-auto my-6 flex w-full min-w-0 max-w-4xl items-center justify-center print:hidden">
        <div onClick={() => setActiveTab('input')} className={`flex shrink-0 items-center space-x-2.5 cursor-pointer group ${activeTab === 'input' ? '[&>span]:inline' : '[&>span]:hidden sm:[&>span]:inline'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
            activeTab === 'input'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 ring-4 ring-emerald-50'
              : 'bg-emerald-600 text-white shadow-xs'
          }`}>1</div>
          <span className={`text-[10px] sm:text-xs uppercase tracking-wider font-extrabold transition-colors ${activeTab === 'input' ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>1. Dados Base</span>
        </div>
        <div className={`mx-1.5 h-0.5 min-w-1 flex-1 transition-colors sm:mx-4 ${activeTab !== 'input' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
        <div onClick={() => setActiveTab('template')} className={`flex shrink-0 items-center space-x-2.5 cursor-pointer group ${activeTab === 'template' ? '[&>span]:inline' : '[&>span]:hidden sm:[&>span]:inline'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
            activeTab === 'template'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 ring-4 ring-emerald-50'
              : activeTab === 'signature' || activeTab === 'result'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-400 border border-slate-200'
          }`}>2</div>
          <span className={`text-[10px] sm:text-xs uppercase tracking-wider font-extrabold transition-colors ${activeTab === 'template' ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>2. Cláusulas</span>
        </div>
        <div className={`mx-1.5 h-0.5 min-w-1 flex-1 transition-colors sm:mx-4 ${activeTab === 'signature' || activeTab === 'result' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
        <div onClick={() => setActiveTab('signature')} className={`flex shrink-0 items-center space-x-2.5 cursor-pointer group ${activeTab === 'signature' ? '[&>span]:inline' : '[&>span]:hidden sm:[&>span]:inline'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
            activeTab === 'signature'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 ring-4 ring-emerald-50'
              : activeTab === 'result'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-400 border border-slate-200'
          }`}>3</div>
          <span className={`text-[10px] sm:text-xs uppercase tracking-wider font-extrabold transition-colors ${activeTab === 'signature' ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>3. Assinatura</span>
        </div>
        <div className={`mx-1.5 h-0.5 min-w-1 flex-1 transition-colors sm:mx-4 ${activeTab === 'result' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
        <div onClick={() => setActiveTab('result')} className={`flex shrink-0 items-center space-x-2.5 cursor-pointer group ${activeTab === 'result' ? '[&>span]:inline' : '[&>span]:hidden sm:[&>span]:inline'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
            activeTab === 'result'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 ring-4 ring-emerald-50'
              : 'bg-white text-slate-400 border border-slate-200'
          }`}>4</div>
          <span className={`text-[10px] sm:text-xs uppercase tracking-wider font-extrabold transition-colors ${activeTab === 'result' ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>4. Contrato Final</span>
        </div>
      </div>

      {activeTab === 'input' && (
        <div className="text-center space-y-2 mb-6 print:hidden">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Emissão de Contratos</h2>
          <p className="text-slate-600 text-xs md:text-sm">Gere contratos e termos de adesão padronizados.</p>
        </div>
      )}

      {/* ABA 1: DADOS BASE */}
      {activeTab === 'input' && (() => {
        const availablePlans = (ctx.contractPlans && ctx.contractPlans.length > 0)
          ? ctx.contractPlans
          : PLAN_OPTIONS;
        const currentPlan = availablePlans.find(
          (opt) => opt.id === ctx.selectedPlan || opt.name?.toLowerCase() === ctx.selectedPlan?.toLowerCase()
        ) || availablePlans[0];

        const planPaymentMethods = (Array.isArray(currentPlan?.paymentMethods) && currentPlan.paymentMethods.length > 0)
          ? currentPlan.paymentMethods
          : (currentPlan?.defaultPrice || currentPlan?.defaultPaymentMethod)
            ? [{
                id: 'default',
                name: currentPlan.defaultPaymentMethod || 'Pix à vista',
                price: typeof currentPlan.defaultPrice === 'number'
                  ? currentPlan.defaultPrice
                  : parseFloat(String(currentPlan.defaultPrice).replace(/\./g, '').replace(',', '.')) || 0,
                feePercentage: 0,
              }]
            : [];

        return (
        <div className="bg-slate-50 p-4 sm:p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xs max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900 mb-1.5 ml-1">
                <User className="size-3.5 text-emerald-600" aria-hidden="true" />
                <span>Paciente</span>
              </label>
              <input type="text" value={ctx.patientData.name} onChange={(e) => ctx.setPatientData((current) => ({ ...current, name: e.target.value }))} className="w-full bg-white border border-slate-200 rounded-xl text-sm text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium" />
            </div>
            
            <div className="relative z-20 contratos-plan-dropdown">
              <div className="flex items-center justify-between mb-1.5 ml-1">
                <label className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
                  <FileText className="size-3.5 text-emerald-600" aria-hidden="true" />
                  <span>Plano Escolhido</span>
                </label>
                <button
                  type="button"
                  onClick={() => ctx.setIsPlansModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                  title="Configurar planos e valores da clínica"
                >
                  <Settings className="size-3.5 text-emerald-600" />
                  <span>Gerenciar Planos</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsPlanMenuOpen(!isPlanMenuOpen);
                  setIsTemplateMenuOpen(false);
                  setIsPaymentMenuOpen(false);
                  setOpenConsultaDropdown(null);
                }}
                className={`w-full min-h-11 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer flex items-center justify-between shadow-2xs active:scale-[0.99] ${
                  isPlanMenuOpen
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-white text-slate-900'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                }`}
                aria-expanded={isPlanMenuOpen}
                aria-haspopup="true"
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="text-base leading-none">
                    {currentPlan?.icon || '📋'}
                  </span>
                  <span className="truncate font-semibold text-slate-800">
                    {currentPlan?.label || currentPlan?.name || 'Selecione um plano'}
                  </span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 ml-2 opacity-70 shrink-0 transition-transform duration-200 ${
                    isPlanMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isPlanMenuOpen && (
                <div
                  className="absolute left-0 right-0 mt-2 app-solid-dropdown !bg-white bg-[#ffffff] rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50 animate-scale-up space-y-1"
                  style={{ backgroundColor: '#ffffff', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
                >
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Selecionar plano
                  </div>

                  {availablePlans.map((opt) => {
                    const isSelected = ctx.selectedPlan === opt.id || ctx.selectedPlan === opt.name?.toLowerCase();
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          ctx.setSelectedPlan(opt.id);
                          setIsPlanMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-900 font-bold'
                            : 'text-slate-700 hover:bg-slate-50 font-medium'
                        }`}
                      >
                        <span className="flex items-center truncate">
                          <span className="mr-2 text-base leading-none">{opt.icon || '📋'}</span>
                          <span className="truncate text-xs sm:text-sm font-semibold">{opt.label || opt.name}</span>
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />}
                      </button>
                    );
                  })}

                  <div className="pt-1.5 mt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPlanMenuOpen(false);
                        ctx.setIsPlansModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2 text-emerald-700 hover:bg-emerald-50 font-bold transition-colors cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Configurar planos e valores...</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <label className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900 mb-1.5 ml-1">
                <DollarSign className="size-3.5 text-emerald-600" aria-hidden="true" />
                <span>Valor Total (R$)</span>
              </label>
              <input
                type="text"
                placeholder="Ex: 1.500,00"
                value={ctx.valor}
                onChange={(e) => ctx.handleSetValor(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl text-sm text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
              />
            </div>
            
            <div className="relative z-10 contratos-payment-dropdown">
              <label className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900 mb-1.5 ml-1">
                <CreditCard className="size-3.5 text-emerald-600" aria-hidden="true" />
                <span>Forma de Pagamento</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ex: À vista via Pix ou Cartão"
                  value={ctx.formaPagamento}
                  onChange={(e) => ctx.setFormaPagamento(e.target.value)}
                  onClick={() => {
                    if (planPaymentMethods.length > 0) {
                      setIsPaymentMenuOpen(true);
                      setIsPlanMenuOpen(false);
                      setIsTemplateMenuOpen(false);
                      setOpenConsultaDropdown(null);
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl text-sm text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium pr-9"
                />
                {planPaymentMethods.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsPaymentMenuOpen(!isPaymentMenuOpen);
                      setIsPlanMenuOpen(false);
                      setIsTemplateMenuOpen(false);
                      setOpenConsultaDropdown(null);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title="Ver formas de pagamento do plano"
                  >
                    <ChevronDown className={`size-4 transition-transform duration-200 ${isPaymentMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                )}

                {isPaymentMenuOpen && planPaymentMethods.length > 0 && (
                  <div
                    className="absolute left-0 right-0 mt-2 app-solid-dropdown !bg-white bg-[#ffffff] rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50 animate-scale-up space-y-1"
                    style={{ backgroundColor: '#ffffff', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
                  >
                    <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Formas cadastradas no plano
                    </div>
                    {planPaymentMethods.map((pm, idx) => {
                      const isSelected = ctx.formaPagamento?.trim().toLowerCase() === pm.name?.trim().toLowerCase();
                      const priceFormatted = Number(pm.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      return (
                        <button
                          key={pm.id || idx}
                          type="button"
                          onClick={() => {
                            ctx.setFormaPagamento(pm.name);
                            if (pm.price != null && Number(pm.price) > 0) {
                              ctx.setValor(priceFormatted);
                            }
                            setIsPaymentMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-900 font-bold'
                              : 'text-slate-700 hover:bg-slate-50 font-medium'
                          }`}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <span className="truncate">{pm.name}</span>
                            {Number(pm.feePercentage) > 0 && (
                              <span className="text-[10px] font-normal text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/50 shrink-0">
                                {pm.feePercentage}% taxa
                              </span>
                            )}
                          </span>
                          <span className="text-emerald-700 font-bold ml-2 shrink-0">
                            R$ {priceFormatted}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 mt-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900 ml-1">
                  <Calendar className="size-3.5 text-emerald-600" aria-hidden="true" />
                  <span>Previsão de Consultas</span>
                </label>
                <p className="text-[10px] text-slate-400 ml-1">Opcional. Adicione as datas previstas de retorno.</p>
              </div>
              <button
                type="button"
                onClick={() => ctx.setConsultas([...ctx.consultas, { data: '', horario: '' }])}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
              >
                <Plus className="size-3.5 text-emerald-600" />
                <span>Adicionar Consulta</span>
              </button>
            </div>
            <div className="space-y-3">
              {ctx.consultas.map((c, index) => {
                const isDateOpen = openConsultaDropdown?.index === index && openConsultaDropdown?.type === 'date';
                const isTimeOpen = openConsultaDropdown?.index === index && openConsultaDropdown?.type === 'time';

                return (
                  <div key={index} className={`grid min-w-0 grid-cols-[1fr_auto] gap-2 sm:flex sm:items-center sm:gap-3 ${isDateOpen || isTimeOpen ? 'relative z-30' : 'relative z-10'}`}>
                    <span className="col-span-2 text-xs font-bold text-slate-400 sm:w-20 sm:shrink-0">
                      Consulta {index + 1}:
                    </span>

                    {/* LISTA SUSPENSA DE DATA (SEM EMOJIS) */}
                    <div className="relative min-w-0 sm:flex-1 consulta-dropdown-container">
                      <button
                        type="button"
                        onClick={() => {
                          setOpenConsultaDropdown(isDateOpen ? null : { index, type: 'date' });
                          setIsPlanMenuOpen(false);
                          setIsTemplateMenuOpen(false);
                        }}
                        className={`w-full min-h-11 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer flex items-center justify-between shadow-2xs active:scale-[0.99] ${
                          isDateOpen
                            ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-white text-slate-900'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                        }`}
                        aria-expanded={isDateOpen}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <Calendar className="size-4 text-emerald-600 shrink-0" aria-hidden="true" />
                          <span className={`truncate ${c.data ? 'font-semibold text-slate-800' : 'text-slate-400'}`}>
                            {c.data ? formatIsoDateToBr(c.data) : 'Definir data'}
                          </span>
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 ml-2 opacity-70 shrink-0 transition-transform duration-200 ${
                            isDateOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {isDateOpen && (
                        <div
                          className="absolute left-0 mt-2 w-72 sm:w-80 app-solid-dropdown !bg-white bg-[#ffffff] rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50 animate-scale-up space-y-1"
                          style={{ backgroundColor: '#ffffff', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
                        >
                          <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            Selecionar data da consulta
                          </div>

                          <div className="max-h-52 overflow-y-auto space-y-0.5">
                            {DATE_SHORTCUTS.map((sc) => {
                              const scDate = getFutureDate(sc.days);
                              const isSelected = c.data === scDate;
                              return (
                                <button
                                  key={sc.label}
                                  type="button"
                                  onClick={() => {
                                    const nc = [...ctx.consultas];
                                    nc[index].data = scDate;
                                    ctx.setConsultas(nc);
                                    setOpenConsultaDropdown(null);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-emerald-50 text-emerald-900 font-bold'
                                      : 'text-slate-700 hover:bg-slate-50 font-medium'
                                  }`}
                                >
                                  <span className="truncate">{sc.label}</span>
                                  <div className="flex items-center gap-2 ml-2 shrink-0">
                                    <span className="text-[11px] text-slate-400">{formatIsoDateToBr(scDate)}</span>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          <div className="border-t border-slate-100 pt-2 mt-1 px-2">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Ou escolher no calendário
                            </div>
                            <input
                              type="date"
                              value={c.data}
                              onChange={(e) => {
                                const nc = [...ctx.consultas];
                                nc[index].data = e.target.value;
                                ctx.setConsultas(nc);
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* LISTA SUSPENSA DE HORÁRIO (SEM EMOJIS) */}
                    <div className="relative w-36 min-w-0 consulta-dropdown-container">
                      <button
                        type="button"
                        onClick={() => {
                          setOpenConsultaDropdown(isTimeOpen ? null : { index, type: 'time' });
                          setIsPlanMenuOpen(false);
                          setIsTemplateMenuOpen(false);
                        }}
                        className={`w-full min-h-11 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer flex items-center justify-between shadow-2xs active:scale-[0.99] ${
                          isTimeOpen
                            ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-white text-slate-900'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                        }`}
                        aria-expanded={isTimeOpen}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <Clock className="size-4 text-emerald-600 shrink-0" aria-hidden="true" />
                          <span className={`truncate ${c.horario ? 'font-semibold text-slate-800' : 'text-slate-400'}`}>
                            {c.horario || 'Horário'}
                          </span>
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 ml-1 opacity-70 shrink-0 transition-transform duration-200 ${
                            isTimeOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {isTimeOpen && (
                        <div
                          className="absolute right-0 sm:left-0 mt-2 w-48 app-solid-dropdown !bg-white bg-[#ffffff] rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50 animate-scale-up space-y-1"
                          style={{ backgroundColor: '#ffffff', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
                        >
                          <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            Selecionar horário
                          </div>

                          <div className="max-h-52 overflow-y-auto space-y-0.5">
                            {TIME_OPTIONS.map((time) => {
                              const isSelected = c.horario === time;
                              return (
                                <button
                                  key={time}
                                  type="button"
                                  onClick={() => {
                                    const nc = [...ctx.consultas];
                                    nc[index].horario = time;
                                    ctx.setConsultas(nc);
                                    setOpenConsultaDropdown(null);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-emerald-50 text-emerald-900 font-bold'
                                      : 'text-slate-700 hover:bg-slate-50 font-medium'
                                  }`}
                                >
                                  <span className="font-medium text-slate-800">{time}</span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                                </button>
                              );
                            })}
                          </div>

                          <div className="border-t border-slate-100 pt-2 mt-1 px-2">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Horário livre
                            </div>
                            <input
                              type="time"
                              value={c.horario}
                              onChange={(e) => {
                                const nc = [...ctx.consultas];
                                nc[index].horario = e.target.value;
                                ctx.setConsultas(nc);
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const nc = [...ctx.consultas];
                        nc.splice(index, 1);
                        ctx.setConsultas(nc);
                      }}
                      className="col-span-2 flex min-h-11 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 sm:col-span-1 sm:size-11"
                      aria-label={`Remover consulta ${index + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button 
              onClick={() => setActiveTab('template')} 
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-full shadow-sm hover:shadow transition-all flex items-center space-x-2 active:scale-95 cursor-pointer"
            >
              <span>Avançar para Modelos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ); })()}

      {/* ABA 2: MODELOS */}
      <div className={activeTab === 'template' ? "animate-fadeIn space-y-6 block" : "hidden"}>
          <div className="relative z-20 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full relative z-20 contratos-template-dropdown">
              <label className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900 mb-1.5 ml-1">
                <LayoutTemplate className="size-3.5 text-emerald-600" aria-hidden="true" />
                <span>Meus Modelos</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setIsTemplateMenuOpen(!isTemplateMenuOpen);
                  setIsPlanMenuOpen(false);
                }}
                className={`w-full min-h-11 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all cursor-pointer flex items-center justify-between shadow-2xs active:scale-[0.99] ${
                  isTemplateMenuOpen
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-white text-slate-900'
                    : ctx.selectedTemplateId
                    ? 'border-slate-300 bg-white text-slate-800'
                    : 'border-slate-300 bg-white text-slate-600'
                }`}
                aria-expanded={isTemplateMenuOpen}
                aria-haspopup="true"
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="text-base">{ctx.selectedTemplateId ? '📑' : '📄'}</span>
                  <span className="truncate font-semibold text-slate-800">
                    {ctx.savedTemplates.find(t => t.id === ctx.selectedTemplateId)?.name || '-- Novo / Em branco --'}
                  </span>
                </span>
                <ChevronDown className={`w-4 h-4 ml-2 opacity-70 shrink-0 transition-transform duration-200 ${isTemplateMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isTemplateMenuOpen && (
                <div
                  className="absolute left-0 right-0 mt-2 max-h-64 overflow-y-auto app-solid-dropdown !bg-white bg-[#ffffff] rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-scale-up space-y-1"
                  style={{ backgroundColor: '#ffffff', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
                >
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Selecionar modelo de contrato
                  </div>

                  <button
                    type="button"
                    onClick={() => { ctx.loadTemplate(''); setIsTemplateMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      !ctx.selectedTemplateId
                        ? 'bg-emerald-50 text-emerald-900 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <span className="flex items-center truncate">
                      <span className="mr-2 text-sm">📄</span>
                      <span className="truncate">-- Novo / Em branco --</span>
                    </span>
                    {!ctx.selectedTemplateId && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />}
                  </button>

                  {ctx.savedTemplates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => { ctx.loadTemplate(t.id); setIsTemplateMenuOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        ctx.selectedTemplateId === t.id
                          ? 'bg-emerald-50 text-emerald-900 font-bold'
                          : 'text-slate-700 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <span className="flex items-center truncate">
                        <span className="mr-2 text-sm">📑</span>
                        <span className="truncate">{t.name}</span>
                      </span>
                      {ctx.selectedTemplateId === t.id && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 w-full">
              <label className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900 mb-1.5 ml-1">
                <Tag className="size-3.5 text-emerald-600" aria-hidden="true" />
                <span>Nome do Modelo</span>
              </label>
              <input type="text" value={ctx.templateNameInput} onChange={e => ctx.setTemplateNameInput(e.target.value)} placeholder="Ex: Contrato Padrão Premium" className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-medium outline-none shadow-2xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-slate-800" />
            </div>
            <div className="flex gap-2">
              <button onClick={ctx.saveTemplate} className="bg-emerald-600 text-white px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-xs hover:bg-emerald-500 transition-all active:scale-95"><Save size={15}/> Salvar</button>
              <button type="button" onClick={ctx.deleteTemplate} disabled={!ctx.selectedTemplateId || ctx.isDeletingTemplate} aria-label="Excluir modelo de contrato selecionado" className="bg-rose-50 text-rose-700 px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 border border-rose-200 hover:bg-rose-100 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={15} aria-hidden="true"/> {ctx.isDeletingTemplate ? 'Excluindo...' : 'Excluir'}</button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 h-[600px] relative z-10">
            <div className="md:col-span-2 h-full flex flex-col bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              {/* NOVO ASSISTENTE DE IA PARA CLÁUSULAS */}
            <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
                  <Bot className="size-3.5 text-emerald-600" aria-hidden="true" /> Assistente Jurídico (IA)
                </label>

                {/* Seletores de Modo: Adicionar vs Atualizar */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => ctx.setAiMode('append')}
                    className={`text-[11px] sm:text-xs px-3 py-1 rounded-full font-bold transition-all flex items-center border active:scale-95 whitespace-nowrap cursor-pointer ${
                      ctx.aiMode === 'append'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
                    }`}
                    title="Cria uma nova cláusula e adiciona ao final da página sem mexer no texto existente"
                  >
                    <PlusCircle className={`w-3.5 h-3.5 mr-1.5 flex-shrink-0 ${ctx.aiMode === 'append' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>Adicionar ao final</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => ctx.setAiMode('replace')}
                    className={`text-[11px] sm:text-xs px-3 py-1 rounded-full font-bold transition-all flex items-center border active:scale-95 whitespace-nowrap cursor-pointer ${
                      ctx.aiMode === 'replace'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
                    }`}
                    title="A IA lê o conteúdo da página, preserva as cláusulas não mencionadas e atualiza o que você pedir"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 flex-shrink-0 ${ctx.aiMode === 'replace' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>Atualizar / Reescrever</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-2.5 items-center">
                <textarea 
                  value={ctx.aiPrompt} 
                  onChange={e => ctx.setAiPrompt(e.target.value)}
                  placeholder={
                    ctx.aiMode === 'append'
                      ? "Ex: Crie uma cláusula informando que faltas sem aviso prévio de 24h serão cobradas integralmente..."
                      : "Ex: Atualize a cláusula de tolerância para 15 minutos e mantenha todas as demais cláusulas..."
                  }
                  className="flex-1 bg-white border border-slate-200 rounded-xl text-[11px] sm:text-xs placeholder:text-[11px] sm:placeholder:text-xs placeholder:text-slate-400 p-2 sm:p-2.5 focus:outline-none focus:border-emerald-500 resize-none shadow-2xs h-12 font-medium text-slate-700 leading-relaxed"
                ></textarea>
                
                <div className="flex flex-col sm:flex-row gap-1.5 shrink-0">
                  {ctx.lastAiBackup !== null && (
                    <button
                      type="button"
                      onClick={ctx.handleUndoAi}
                      title="Desfazer a última alteração feita pela IA"
                      className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center transition-all cursor-pointer active:scale-95"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      <span>Desfazer IA</span>
                    </button>
                  )}

                  <button 
                    onClick={ctx.handleGenerateAI}
                    disabled={ctx.isGeneratingAi}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 sm:py-2.5 rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center justify-center whitespace-nowrap active:scale-95 cursor-pointer"
                  >
                    {ctx.isGeneratingAi ? (
                      <span className="flex items-center"><Sparkles className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Processando...</span>
                    ) : (
                      <span className="flex items-center">
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                        {ctx.aiMode === 'append' ? 'Adicionar Cláusula' : 'Atualizar com IA'}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* BARRA DE ABAS DE PÁGINAS */}
            <div className="flex items-center gap-1 px-4 pt-3 pb-0 bg-slate-50 border-b border-slate-200 shrink-0 overflow-x-auto">
              {ctx.pages.map((page, index) => (
                <div
                  key={page.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-[11px] font-bold cursor-pointer transition-all border border-b-0 shrink-0 ${
                    index === ctx.activePageIndex
                      ? 'bg-white border-slate-200 text-emerald-700 shadow-sm'
                      : 'bg-slate-100 border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-200'
                  }`}
                  onClick={() => ctx.switchPage(index)}
                >
                  <FileText className="w-3 h-3" />
                  <span>{page.label}</span>
                  {ctx.pages.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); ctx.removePage(index); }}
                      className="ml-1 text-slate-300 hover:text-red-500 transition-colors rounded"
                      title="Remover página"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={ctx.addPage}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-t-lg text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 transition-colors shrink-0 border border-transparent"
                title="Adicionar nova página"
              >
                <FilePlus className="w-3.5 h-3.5" />
                <span>Nova página</span>
              </button>
            </div>

            {/* BARRA DE FERRAMENTAS DE FORMATAÇÃO (NEGRITO, ITÁLICO, BULLETS, ETC.) */}
            <ContratoRichTextToolbar
              editorRef={ctx.editorRef}
              onContentChange={ctx.syncEditorToTemplate}
              onInsertVariable={ctx.handleInsertVariableBadge}
            />

            {/* EDITOR DE CLÁUSULAS */}
            <div 
              ref={ctx.editorRef} 
              contentEditable 
              onInput={ctx.syncEditorToTemplate} 
              onBlur={ctx.syncEditorToTemplate} 
              className="w-full flex-1 p-8 outline-none font-sans text-[13px] leading-relaxed overflow-y-auto bg-white text-slate-800 focus:bg-slate-50/20 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-600 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-slate-900 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-extrabold [&_h3]:text-slate-900 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_li]:mb-1 [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic [&_u]:underline" 
              placeholder="Cole ou digite o texto das cláusulas aqui..." 
            />

            {/* CONTADOR DE CARACTERES E VARIÁVEIS */}
            <div className="px-4 pt-2 pb-1 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
              <span className="text-[10px] text-slate-400 font-medium">
                {ctx.detectedVars?.length > 0
                  ? `${ctx.detectedVars.length} ${ctx.detectedVars.length === 1 ? 'campo dinâmico detectado' : 'campos dinâmicos detectados'}`
                  : 'Nenhum campo dinâmico inserido'}
                {ctx.pages.length > 1 ? ` • Página ${ctx.activePageIndex + 1} de ${ctx.pages.length}` : ''}
              </span>
              <span className={`text-[10px] font-bold ${
                ctx.editorCharCount > 1800 ? 'text-red-600' : ctx.editorCharCount > 1440 ? 'text-amber-500' : 'text-slate-400'
              }`}>
                {ctx.editorCharCount} / 1800 caracteres{ctx.editorCharCount > 1800 ? ' — excedido, considere criar nova página' : ''}
              </span>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <button 
                onClick={() => setActiveTab('input')} 
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center shadow-2xs active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Voltar aos Dados
              </button>
              <button 
                onClick={() => setActiveTab('signature')} 
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-full shadow-sm hover:shadow transition-all flex items-center space-x-2 active:scale-95 cursor-pointer"
              >
                <span>Ir para Assinatura</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* PAINEL LATERAL DIREITO: VARIÁVEIS INCLUÍDAS NO CONTRATO */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/80">
              <h3 className="flex items-center justify-center gap-1.5 font-extrabold text-[10px] text-slate-900 uppercase text-center tracking-[0.06em]">
                <List className="size-3.5 text-emerald-600" aria-hidden="true" />
                Variáveis no Contrato
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {(ctx.detectedVars || []).map((v, i) => {
                const def = CONTRACT_VARIABLES.find(cv => cv.id.toLowerCase() === v.toLowerCase());
                return (
                  <div key={i} className="text-xs bg-emerald-50 p-2.5 rounded-xl border border-emerald-200/60 font-mono text-emerald-800 font-bold flex items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2 truncate">
                      <CheckCircle size={14} className="text-emerald-600 flex-shrink-0" />
                      <span className="truncate">{def?.label || v}</span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300 px-1.5 py-0.5 rounded font-mono shrink-0">
                      {"{{" + v + "}}"}
                    </span>
                  </div>
                );
              })}
              {(!ctx.detectedVars || ctx.detectedVars.length === 0) && (
                <div className="text-center py-10 opacity-50">
                  <List className="mx-auto mb-2 text-slate-400" size={24}/>
                  <p className="text-xs font-medium text-slate-500">
                    Nenhuma variável inserida.<br/>
                    Insira tags como <span className="text-emerald-600 font-mono">{"{{"}paciente{"}}"}</span> ou use o menu acima.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* ABA 3: COLETA DE ASSINATURA */}
      {activeTab === 'signature' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-1 mb-6">
            <h3 className="font-black text-slate-800 text-xl">Coleta de Assinatura</h3>
            <p className="text-slate-500 text-xs">Colete a assinatura do paciente presencialmente ou gere um link remoto.</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-1.5 mb-2">
              <FileSignature className="size-3.5 text-emerald-600" aria-hidden="true" />
              <h4 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
                <span>Assinatura Digital</span>
              </h4>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-500">Peça ao paciente para assinar abaixo utilizando o dedo ou o mouse, ou envie um link.</p>
              <SignaturePad 
                onSave={(base64) => ctx.setAssinaturaBase64(base64)} 
              />
              
              {ctx.assinaturaBase64 && (
                <div className="bg-emerald-50 text-emerald-700 text-[10px] p-2 text-center rounded border border-emerald-100 animate-fadeIn">
                  Assinatura digital capturada (pronta para impressão).
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex justify-center">
                <button type="button" onClick={ctx.handleGerarLink} disabled={ctx.isGenerating} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-50 active:scale-95">
                  {ctx.hasActivePatient ? <Save className="size-4" aria-hidden="true" /> : <LinkIcon className="size-4" aria-hidden="true" />}
                  <span>{ctx.isGenerating ? 'Salvando…' : ctx.hasActivePatient ? 'Salvar no prontuário e gerar link' : 'Gerar link de assinatura'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button 
              onClick={() => setActiveTab('template')} 
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center shadow-2xs active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Voltar às Cláusulas
            </button>
            <button 
              onClick={() => setActiveTab('result')} 
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-full shadow-sm hover:shadow transition-all flex items-center space-x-2 active:scale-95 cursor-pointer"
            >
              <span>Gerar Contrato Final</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ABA 4: PRÉVIA E IMPRESSÃO */}
      {activeTab === 'result' && (
        <div className="animate-fadeIn max-w-4xl mx-auto space-y-6">
          {/* Top Toolbar (Hidden on Print) - CLEAN LUXURY SAAS STYLE */}
          <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap justify-between items-center gap-4 print:hidden max-w-4xl mx-auto mb-6">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setActiveTab('signature')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center shadow-2xs active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Editar Contrato
              </button>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Contrato estruturado e pronto para envio ao paciente ou impressão em PDF.
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={ctx.handleGerarPDF}
                disabled={ctx.isGenerating}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-full shadow-sm hover:shadow transition-all flex items-center space-x-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                <span>{ctx.isGenerating ? 'Gerando...' : 'Imprimir / Salvar em PDF'}</span>
              </button>
            </div>
          </div>

          {(() => {
            const selectedPlanObj = (ctx.contractPlans || PLAN_OPTIONS).find(
              (p) => p.id === ctx.selectedPlan || p.name?.toLowerCase() === ctx.selectedPlan?.toLowerCase()
            );
            const displayPlanName = selectedPlanObj?.label || selectedPlanObj?.name || ctx.selectedPlan;

            return (
              <div className="print:hidden w-full">
                <ContratoPrintLayout 
                  paciente={ctx.patientData}
                  plano={displayPlanName}
                  valor={ctx.valor}
                  formaPagamento={ctx.formaPagamento}
                  consultas={ctx.consultas}
                  assinaturaBase64={ctx.assinaturaBase64}
                  pages={ctx.getAllPagesHTML()}
                  preview={true}
                  nutritionist={nutritionist}
                  organizationId={ctx.organizationId}
                />
              </div>
            );
          })()}
        </div>
      )}

    </div>{/* fim print:hidden */}

    {/* Componente de impressão — invisível na tela, visível apenas no print */}
    <div className="hidden print:block">
      {(() => {
        const selectedPlanObj = (ctx.contractPlans || PLAN_OPTIONS).find(
          (p) => p.id === ctx.selectedPlan || p.name?.toLowerCase() === ctx.selectedPlan?.toLowerCase()
        );
        const displayPlanName = selectedPlanObj?.label || selectedPlanObj?.name || ctx.selectedPlan;

        return (
          <ContratoPrintLayout 
            paciente={ctx.patientData}
            plano={displayPlanName}
            valor={ctx.valor}
            formaPagamento={ctx.formaPagamento}
            consultas={ctx.consultas}
            assinaturaBase64={ctx.assinaturaBase64}
            pages={ctx.getAllPagesHTML()}
            nutritionist={nutritionist}
            organizationId={ctx.organizationId}
          />
        );
      })()}
    </div>

    {/* Modal de Gestão de Planos e Valores da Clínica */}
    <ContractPlansModal
      isOpen={ctx.isPlansModalOpen}
      onClose={() => ctx.setIsPlansModalOpen(false)}
      plans={ctx.contractPlans}
      onSavePlan={ctx.handleSavePlan}
      onDeletePlan={ctx.handleDeletePlan}
    />
    </>
  );
}
