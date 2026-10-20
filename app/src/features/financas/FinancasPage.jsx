import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Stethoscope,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  Layers,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import PageHeader from '../../shared/ui/PageHeader.jsx';
import PackagesTab from './components/PackagesTab.jsx';
import PackageModal from './components/PackageModal.jsx';
import PackageSessionModal from './components/PackageSessionModal.jsx';
import TransactionsTab from './components/TransactionsTab.jsx';
import TransactionModal from './components/TransactionModal.jsx';
import { useAuth } from '../auth/useAuth.js';
import { usePatient } from '../pacientes/usePatient.js';
import { readFinancePatientFilter, readFinanceQuickAction } from './services/financeQuickAction.js';
import {
  getPackages,
  savePackage,
  deletePackage,
  recordPackageConsultation,
  getTransactions,
  saveTransaction,
  deleteTransaction,
  syncFinanceFromCloud,
  FINANCE_UPDATED_EVENT,
} from './services/financeStorage.js';

export default function FinancasPage() {
  const { organizationId } = useAuth();
  const { selectedPatient } = usePatient();
  const [activeTab, setActiveTab] = useState('pacotes'); // 'pacotes' | 'fluxo'
  const [packages, setPackages] = useState([]);
  const [transactions, setTransactions] = useState([]);
  // Paciente ativo quando o modal foi aberto por um atalho da feature de pacientes
  const [defaultPatient, setDefaultPatient] = useState(null);
  // Filtro de paciente recebido pelo atalho "Financeiro" da feature de pacientes
  const [patientFilter, setPatientFilter] = useState(readFinancePatientFilter);

  const visiblePackages = useMemo(
    () => (patientFilter ? packages.filter((pkg) => pkg.patientId === patientFilter.id) : packages),
    [packages, patientFilter],
  );
  const visibleTransactions = useMemo(
    () => (patientFilter ? transactions.filter((tx) => tx.patientId === patientFilter.id) : transactions),
    [transactions, patientFilter],
  );
  const cashTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    visibleTransactions.forEach((tx) => {
      if (tx.type === 'receita') income += Number(tx.amount || 0);
      else if (tx.type === 'despesa') expense += Number(tx.amount || 0);
    });
    return { income, expense, balance: income - expense };
  }, [visibleTransactions]);

  // Modais de pacotes
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [selectedPackageForSession, setSelectedPackageForSession] = useState(null);

  // Modais de transações
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const reloadData = useCallback(() => {
    setPackages(getPackages());
    setTransactions(getTransactions());
  }, []);

  useEffect(() => {
    const quickAction = readFinanceQuickAction();
    if (quickAction === 'package') {
      setDefaultPatient(selectedPatient);
      setEditingPackage(null);
      setPackageModalOpen(true);
    } else if (quickAction === 'transaction') {
      setDefaultPatient(selectedPatient);
      setEditingTransaction(null);
      setTransactionModalOpen(true);
    }
  }, [selectedPatient]);

  useEffect(() => {
    reloadData();
    if (organizationId) {
      syncFinanceFromCloud(organizationId);
    }
    const handleUpdate = () => reloadData();
    window.addEventListener(FINANCE_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(FINANCE_UPDATED_EVENT, handleUpdate);
  }, [reloadData, organizationId]);

  // Cálculos de Métricas Globais dos Pacotes
  const metrics = useMemo(() => {
    const activePackages = visiblePackages.filter((p) => p.status === 'ativo');
    let totalConsultations = 0;
    let completedConsultations = 0;
    let totalPackageVolume = 0;
    let totalPartnerShare = 0;

    activePackages.forEach((pkg) => {
      totalConsultations += Number(pkg.totalConsultations || 0);
      completedConsultations += Number(pkg.completedConsultations || 0);
      totalPackageVolume += Number(pkg.packageValue || 0);
      totalPartnerShare += Number(pkg.partnerShare || 0);
    });

    const pendingConsultations = Math.max(0, totalConsultations - completedConsultations);
    const overallProgress = totalConsultations > 0 ? Math.round((completedConsultations / totalConsultations) * 100) : 0;

    return {
      activeCount: activePackages.length,
      totalCount: visiblePackages.length,
      totalConsultations,
      completedConsultations,
      pendingConsultations,
      overallProgress,
      totalPackageVolume,
      totalPartnerShare,
    };
  }, [visiblePackages]);

  // Handlers de Pacotes
  const handleOpenNewPackage = () => {
    setEditingPackage(null);
    setPackageModalOpen(true);
  };

  const handleEditPackage = (pkg) => {
    setEditingPackage(pkg);
    setPackageModalOpen(true);
  };

  const handleSavePackage = (data) => {
    savePackage(data, organizationId);
    reloadData();
  };

  const handleDeletePackage = (id) => {
    deletePackage(id);
    reloadData();
  };

  const handleQuickAddSession = (packageId) => {
    recordPackageConsultation(packageId);
    reloadData();
  };

  const handleOpenSessionModal = (pkg) => {
    setSelectedPackageForSession(pkg);
    setSessionModalOpen(true);
  };

  const handleAddDetailedSession = (packageId, sessionNotes, sessionDate) => {
    recordPackageConsultation(packageId, sessionNotes, sessionDate);
    reloadData();
    // Atualiza o pacote selecionado no modal aberto
    const updatedList = getPackages();
    const updatedPkg = updatedList.find((p) => p.id === packageId);
    if (updatedPkg) setSelectedPackageForSession(updatedPkg);
  };

  // Handlers de Transações
  const handleOpenNewTransaction = () => {
    setEditingTransaction(null);
    setTransactionModalOpen(true);
  };

  const handleEditTransaction = (tx) => {
    setEditingTransaction(tx);
    setTransactionModalOpen(true);
  };

  const handleSaveTransaction = (data) => {
    saveTransaction(data, organizationId);
    reloadData();
  };

  const handleDeleteTransaction = (id) => {
    deleteTransaction(id);
    reloadData();
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <PageHeader
        category="Consultório & Gestão"
        title="Finanças & Parcerias"
        description="Acompanhe pacotes integrados com nutrólogos e parceiros, frequência de atendimento, consultas realizadas, pendências e fluxo de caixa."
        actions={
          <div className="flex items-center gap-2">
            {activeTab === 'pacotes' ? (
              <button
                type="button"
                onClick={handleOpenNewPackage}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="size-4" />
                <span>Cadastrar Pacote</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenNewTransaction}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="size-4" />
                <span>Novo Lançamento</span>
              </button>
            )}
          </div>
        }
      />

      {/* KPI Cards: pacotes ou caixa, conforme a aba (mesma faixa, sem mover as abas) */}
      {activeTab === 'pacotes' ? (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Pacotes Ativos */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/70 shadow-xs relative overflow-hidden group hover:border-emerald-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Pacotes Ativos
            </span>
            <Stethoscope className="size-5 text-emerald-600 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {metrics.activeCount}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              de {metrics.totalCount} no histórico
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">
            Parcerias em andamento
          </p>
        </div>

        {/* Card 2: Consultas Realizadas */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/70 shadow-xs relative overflow-hidden group hover:border-teal-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Consultas Feitas
            </span>
            <CheckCircle2 className="size-5 text-teal-600 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {metrics.completedConsultations}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              de {metrics.totalConsultations} contratadas
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full"
                style={{ width: `${metrics.overallProgress}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-teal-700">
              {metrics.overallProgress}%
            </span>
          </div>
        </div>

        {/* Card 3: Consultas Pendentes */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/70 shadow-xs relative overflow-hidden group hover:border-amber-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Consultas Pendentes
            </span>
            <Clock className="size-5 text-amber-500 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-700">
              {metrics.pendingConsultations}
            </span>
            <span className="text-xs font-semibold text-slate-400">a realizar</span>
          </div>
          <p className="text-[11px] text-amber-600 font-semibold mt-1">
            Sessões a agendar / acompanhar
          </p>
        </div>

        {/* Card 4: Volume & Repasses */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/70 shadow-xs relative overflow-hidden group hover:border-indigo-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Volume em Pacotes
            </span>
            <DollarSign className="size-5 text-indigo-600 shrink-0" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 block truncate">
              R$ {metrics.totalPackageVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
            Repasses estimados: R$ {metrics.totalPartnerShare.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
      ) : (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {/* Card 1: Total Receitas */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/70 shadow-xs relative overflow-hidden group hover:border-emerald-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Total Receitas
            </span>
            <ArrowDownLeft className="size-5 text-emerald-600 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">
              R$ {cashTotals.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">
            Entradas e consultas recebidas
          </p>
        </div>

        {/* Card 2: Total Despesas */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/70 shadow-xs relative overflow-hidden group hover:border-rose-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Total Despesas
            </span>
            <ArrowUpRight className="size-5 text-rose-600 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-600">
              R$ {cashTotals.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-rose-700 font-semibold mt-1">
            Repasses e custos operacionais
          </p>
        </div>

        {/* Card 3: Saldo Geral */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/70 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Saldo Geral
            </span>
            <DollarSign className={`size-5 shrink-0 ${cashTotals.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black ${cashTotals.balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              R$ {cashTotals.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className={`text-[11px] font-semibold mt-1 ${cashTotals.balance >= 0 ? 'text-slate-500' : 'text-rose-600'}`}>
            Resultado líquido do período
          </p>
        </div>
      </div>
      )}

      {/* Navegação por Abas */}
      <div className="flex items-center border-b border-slate-200/80 gap-2 sm:gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('pacotes')}
          className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'pacotes'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Stethoscope className="size-4" />
          Pacotes & Parcerias
          <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
            {metrics.activeCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('fluxo')}
          className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'fluxo'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="size-4" />
          Fluxo de Caixa & Lançamentos
        </button>
      </div>

      {/* Conteúdo da Aba Ativa */}
      {activeTab === 'pacotes' ? (
        <PackagesTab
          packages={visiblePackages}
          patientFilter={patientFilter}
          onClearPatientFilter={() => setPatientFilter(null)}
          onOpenNewPackage={handleOpenNewPackage}
          onEditPackage={handleEditPackage}
          onDeletePackage={handleDeletePackage}
          onQuickAddSession={handleQuickAddSession}
          onOpenSessionModal={handleOpenSessionModal}
        />
      ) : (
        <TransactionsTab
          transactions={visibleTransactions}
          patientFilter={patientFilter}
          onClearPatientFilter={() => setPatientFilter(null)}
          onOpenNewTransaction={handleOpenNewTransaction}
          onEditTransaction={handleEditTransaction}
          onDeleteTransaction={handleDeleteTransaction}
        />
      )}

      {/* Modais */}
      <PackageModal
        open={packageModalOpen}
        onClose={() => { setPackageModalOpen(false); setDefaultPatient(null); }}
        onSave={handleSavePackage}
        initialData={editingPackage}
        defaultPatient={defaultPatient}
      />

      <PackageSessionModal
        open={sessionModalOpen}
        onClose={() => setSessionModalOpen(false)}
        pkg={selectedPackageForSession}
        onAddSession={handleAddDetailedSession}
      />

      <TransactionModal
        open={transactionModalOpen}
        onClose={() => { setTransactionModalOpen(false); setDefaultPatient(null); }}
        onSave={handleSaveTransaction}
        initialData={editingTransaction}
        defaultPatient={defaultPatient}
      />
    </div>
  );
}
