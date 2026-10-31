import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Check,
  ChevronDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Pencil,
  Trash2,
  Download,
  Stethoscope,
  ChevronRight,
  TrendingUp,
  User,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { exportPackagesToCSV, savePackage } from '../services/financeStorage.js';
import { usePatient } from '../../pacientes/usePatient.js';
import { useAuth } from '../../auth/useAuth.js';
import { normalizePatientPhone } from '../../pacientes/domain/phone.js';

const MISSING_SORT_OPTIONS = [
  { id: 'padrao', label: 'Ordem padrão' },
  { id: 'faltantes_desc', label: 'Mais consultas faltantes' },
  { id: 'faltantes_asc', label: 'Menos consultas faltantes' },
];

const STATUS_OPTIONS = [
  { id: 'todos', label: 'Todos os Status' },
  { id: 'ativos', label: 'Somente Ativos' },
  { id: 'concluidos', label: 'Concluídos' },
  { id: 'pausados', label: 'Pausados' },
  { id: 'cancelados', label: 'Cancelados' },
  { id: 'pendencias', label: 'Com Pendências' },
];

function PatientAvatar({ patient, name, onClick, isLinked = false }) {
  const [imgError, setImgError] = useState(false);
  const avatarUrl = patient?.avatar_url || patient?.photo_url;
  const initials = (name || patient?.full_name || 'PA').substring(0, 2).toUpperCase();

  return (
    <div className="relative inline-flex shrink-0">
      <button
        type="button"
        onClick={onClick}
        title={`Abrir prontuário de ${patient?.full_name || name}`}
        className="relative flex size-8 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-tr from-slate-100 to-emerald-50 text-emerald-800 font-extrabold text-[11px] border border-emerald-100/80 hover:scale-105 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs"
      >
        {avatarUrl && !imgError ? (
          <img
            src={avatarUrl}
            alt={name}
            className="size-full object-cover rounded-xl"
            onError={() => setImgError(true)}
          />
        ) : (
          <span>{initials}</span>
        )}
      </button>

      {isLinked && (
        <span
          className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs pointer-events-none"
          title="Paciente vinculado à base clínica"
        />
      )}
    </div>
  );
}

export default function PackagesTab({
  packages = [],
  onOpenNewPackage,
  onEditPackage,
  onDeletePackage,
  onQuickAddSession,
  onOpenSessionModal,
  patientFilter = null,
  onClearPatientFilter,
}) {
  const { organizationId } = useAuth();
  const { patients, selectPatient } = usePatient();
  const [searchTerm, setSearchTerm] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [missingSort, setMissingSort] = useState('padrao');
  const [expandedPackageId, setExpandedPackageId] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null); // 'partner' | 'status' | 'missing' | null

  // Fechar dropdowns ao clicar fora ou pressionar Escape
  useEffect(() => {
    if (!openDropdown) return undefined;
    const handleClickOutside = (e) => {
      if (!e.target.closest('.finance-dropdown-container')) {
        setOpenDropdown(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpenDropdown(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openDropdown]);

  // Função para encontrar paciente correspondente na base por ID, telefone ou nome
  const getLinkedPatient = (pkg) => {
    if (!patients || patients.length === 0) return null;
    if (pkg.patientId) {
      const byId = patients.find((p) => p.id === pkg.patientId);
      if (byId) return byId;
    }

    const normPkgPhone = normalizePatientPhone(pkg.patientPhone);
    const normPkgName = (pkg.patientName || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\(2º\)|\(1º\)/g, '')
      .trim();

    return patients.find((p) => {
      if (normPkgPhone) {
        const pPhone = normalizePatientPhone(p.whatsapp_phone || p.phone);
        if (pPhone && (pPhone === normPkgPhone || pPhone.endsWith(normPkgPhone) || normPkgPhone.endsWith(pPhone))) {
          return true;
        }
      }
      const pName = (p.full_name || p.name || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
      if (normPkgName && pName && (normPkgName === pName || pName.includes(normPkgName) || normPkgName.includes(pName))) {
        return true;
      }
      return false;
    }) || null;
  };

  // Auto-vínculo silencioso de pacotes que ainda não têm patient_id
  useEffect(() => {
    if (!patients || patients.length === 0 || !packages || packages.length === 0) return;
    packages.forEach((pkg) => {
      if (!pkg.patientId) {
        const matched = getLinkedPatient(pkg);
        if (matched) {
          savePackage({
            ...pkg,
            patientId: matched.id,
            patientPhone: pkg.patientPhone || matched.phone || matched.whatsapp_phone || null,
          }, organizationId);
        }
      }
    });
  }, [packages, patients, organizationId]);

  // Navegar para o prontuário com o paciente selecionado
  const handleGoToPatient = (pkg) => {
    const linked = getLinkedPatient(pkg);
    if (linked) {
      selectPatient(linked);
      if (!pkg.patientId && linked.id) {
        savePackage({
          ...pkg,
          patientId: linked.id,
          patientPhone: pkg.patientPhone || linked.phone || linked.whatsapp_phone || null,
        }, organizationId);
      }
    } else {
      selectPatient(null);
    }
    window.location.hash = '#pacientes';
  };

  // Lista única de parceiros cadastrados para o filtro
  const partnersList = useMemo(() => {
    const set = new Set();
    packages.forEach((pkg) => {
      if (pkg.partnerName) set.add(pkg.partnerName);
    });
    return Array.from(set);
  }, [packages]);

  // Filtragem
  const filteredPackages = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const result = packages.filter((pkg) => {
      const matchSearch =
        !term ||
        (pkg.patientName && pkg.patientName.toLowerCase().includes(term)) ||
        (pkg.planName && pkg.planName.toLowerCase().includes(term)) ||
        (pkg.notes && pkg.notes.toLowerCase().includes(term)) ||
        (pkg.partnerName && pkg.partnerName.toLowerCase().includes(term));

      const matchPartner = partnerFilter === 'todos' || pkg.partnerName === partnerFilter;

      let matchStatus = true;
      if (statusFilter === 'ativos') matchStatus = pkg.status === 'ativo';
      else if (statusFilter === 'concluidos') matchStatus = pkg.status === 'concluido';
      else if (statusFilter === 'pausados') matchStatus = pkg.status === 'pausado';
      else if (statusFilter === 'cancelados') matchStatus = pkg.status === 'cancelado';
      else if (statusFilter === 'pendencias') {
        const pendingSessions = (pkg.totalConsultations || 0) - (pkg.completedConsultations || 0);
        matchStatus = pendingSessions > 0 || pkg.paymentStatus !== 'pago' || Boolean(pkg.notes);
      }

      return matchSearch && matchPartner && matchStatus;
    });

    if (missingSort === 'padrao') return result;
    // Consultas faltantes = total contratadas - já realizadas (nunca negativo)
    const missingOf = (pkg) => Math.max(0, (pkg.totalConsultations || 0) - (pkg.completedConsultations || 0));
    const direction = missingSort === 'faltantes_asc' ? 1 : -1;
    return [...result].sort((a, b) => direction * (missingOf(a) - missingOf(b)));
  }, [packages, searchTerm, partnerFilter, statusFilter, missingSort]);

  const handleExport = () => {
    exportPackagesToCSV(filteredPackages);
  };

  return (
    <div className="space-y-4">
      {/* Barra de Filtros e Busca */}
      <div className="relative z-30 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Input de busca */}
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por paciente, plano ou nutrólogo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs font-medium placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          {/* Filtro de paciente vindo da tela de pacientes (mesmo padrão de Tarefas) */}
          {patientFilter ? (
            <button
              type="button"
              onClick={onClearPatientFilter}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-emerald-600 text-white border-emerald-600 shadow-2xs hover:bg-emerald-700 cursor-pointer active:scale-95"
              title="Limpar filtro e exibir todos os pacotes"
            >
              <span>Paciente: {patientFilter.name}</span>
              <span className="text-[10px] opacity-85">✕ Limpar</span>
            </button>
          ) : null}

          {/* Menu Dropdown de Parceiro */}
          <div className="relative finance-dropdown-container">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'partner' ? null : 'partner')}
              className={`inline-flex w-56 shrink-0 items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                partnerFilter !== 'todos'
                  ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-200'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="Filtrar pacotes por profissional parceiro"
              aria-expanded={openDropdown === 'partner'}
            >
              <span className="flex min-w-0 items-center gap-1.5 truncate">
                <Stethoscope className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {partnerFilter === 'todos' ? 'Parceiro' : partnerFilter}
                </span>
              </span>
              <ChevronDown className={`w-3 h-3 shrink-0 opacity-70 transition-transform duration-200 ${openDropdown === 'partner' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'partner' && (
              <div
                className="absolute left-0 mt-2 w-56 app-solid-dropdown !bg-white bg-[#ffffff] rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-scale-up space-y-1"
                style={{ backgroundColor: '#ffffff', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
              >
                <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Filtrar por parceiro
                </div>
                <button
                  type="button"
                  onClick={() => { setPartnerFilter('todos'); setOpenDropdown(null); }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    partnerFilter === 'todos'
                      ? 'bg-emerald-50 text-emerald-900 font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>Todos os Parceiros</span>
                  {partnerFilter === 'todos' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
                {partnersList.map((partner) => (
                  <button
                    key={partner}
                    type="button"
                    onClick={() => { setPartnerFilter(partner); setOpenDropdown(null); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      partnerFilter === partner
                        ? 'bg-emerald-50 text-emerald-900 font-bold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{partner}</span>
                    {partnerFilter === partner && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Menu Dropdown de Ordenação por Consultas Faltantes */}
          <div className="relative finance-dropdown-container">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'missing' ? null : 'missing')}
              className={`inline-flex w-56 shrink-0 items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                missingSort !== 'padrao'
                  ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-200'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="Ordenar pacotes por consultas faltantes"
              aria-expanded={openDropdown === 'missing'}
            >
              <span className="flex min-w-0 items-center gap-1.5 truncate">
                <Filter className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {MISSING_SORT_OPTIONS.find((opt) => opt.id === missingSort)?.label}
                </span>
              </span>
              <ChevronDown className={`w-3 h-3 shrink-0 opacity-70 transition-transform duration-200 ${openDropdown === 'missing' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'missing' && (
              <div
                className="absolute left-0 mt-2 w-56 app-solid-dropdown !bg-white bg-[#ffffff] rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-scale-up space-y-1"
                style={{ backgroundColor: '#ffffff', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
              >
                <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Ordenar por consultas faltantes
                </div>
                {MISSING_SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { setMissingSort(opt.id); setOpenDropdown(null); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      missingSort === opt.id
                        ? 'bg-emerald-50 text-emerald-900 font-bold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {missingSort === opt.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Menu Dropdown de Status */}
          <div className="relative finance-dropdown-container">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
              className={`inline-flex w-56 shrink-0 items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                statusFilter !== 'todos'
                  ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-200'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="Filtrar pacotes por status"
              aria-expanded={openDropdown === 'status'}
            >
              <span className="flex min-w-0 items-center gap-1.5 truncate">
                <Filter className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {STATUS_OPTIONS.find((opt) => opt.id === statusFilter)?.label || 'Status'}
                </span>
              </span>
              <ChevronDown className={`w-3 h-3 shrink-0 opacity-70 transition-transform duration-200 ${openDropdown === 'status' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'status' && (
              <div
                className="absolute left-0 mt-2 w-52 app-solid-dropdown !bg-white bg-[#ffffff] rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-scale-up space-y-1"
                style={{ backgroundColor: '#ffffff', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
              >
                <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Filtrar por status
                </div>
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { setStatusFilter(opt.id); setOpenDropdown(null); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      statusFilter === opt.id
                        ? 'bg-emerald-50 text-emerald-900 font-bold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {statusFilter === opt.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Botão de Ação da Barra */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExport}
            title="Exportar para planilha CSV"
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Download className="size-3.5 text-slate-500" />
            <span>Exportar Planilha</span>
          </button>
        </div>
      </div>

      {/* Tabela de Pacotes */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-xs">
        {filteredPackages.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-3">
              <Stethoscope className="size-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Nenhum pacote encontrado</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              {searchTerm || partnerFilter !== 'todos' || statusFilter !== 'todos'
                ? 'Nenhum resultado corresponde aos filtros selecionados. Tente ajustar a busca.'
                : 'Cadastre o primeiro pacote de parceria para gerenciar as consultas contratadas e pendências.'}
            </p>
            <button
              type="button"
              onClick={onOpenNewPackage}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-all shadow-xs"
            >
              <Plus className="size-4" />
              Cadastrar Primeiro Pacote
            </button>
          </div>
        ) : (
          <div className="max-h-[440px] overflow-auto overscroll-contain custom-scrollbar">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr className="border-b border-slate-200/70 bg-slate-50/75 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Paciente</th>
                  <th className="py-3 px-4">Progresso</th>
                  <th className="py-3 px-4 text-center">Financeiro</th>
                  <th className="py-3 px-2 sm:px-3 text-right">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPackages.map((pkg) => {
                  const total = pkg.totalConsultations || 1;
                  const completed = pkg.completedConsultations || 0;
                  const pending = Math.max(0, total - completed);
                  const percent = Math.min(100, Math.round((completed / total) * 100));
                  const isDone = completed >= total;

                  return (
                    <React.Fragment key={pkg.id}>
                    <tr
                      className={`group hover:bg-emerald-50/30 transition-colors ${expandedPackageId === pkg.id ? 'bg-emerald-50/20' : ''}`}
                    >
                      {/* Paciente com Avatar / Foto e quebra de linha permitida */}
                      <td className="py-3 px-4">
                        {(() => {
                          const linked = getLinkedPatient(pkg);
                          return (
                            <div className="flex items-center gap-2.5">
                              <PatientAvatar
                                patient={linked}
                                name={pkg.patientName}
                                onClick={() => handleGoToPatient(pkg)}
                                isLinked={Boolean(linked)}
                              />
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() => handleGoToPatient(pkg)}
                                  className="font-bold text-slate-800 text-xs sm:text-[13px] block leading-snug text-left hover:text-emerald-700 hover:underline transition-colors cursor-pointer"
                                  title={`Abrir prontuário de ${linked?.full_name || pkg.patientName}`}
                                >
                                  {pkg.patientName}
                                </button>
                                <p className="mt-0.5 max-w-[220px] truncate text-[11px] text-slate-500" title={`${pkg.planName || ''} · ${pkg.frequency || 'Mensal'}`}>
                                  {pkg.planName || 'Sem plano'} · {pkg.frequency || 'Mensal'}
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Progresso: consultas feitas, faltantes e incremento rápido +1 */}
                      <td className="py-3 px-3.5 sm:px-4 min-w-[200px]">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-extrabold text-slate-900 whitespace-nowrap">
                              {completed} <span className="font-normal text-slate-400">/ {total} feitas</span>
                            </span>
                            {isDone ? (
                              <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 whitespace-nowrap">
                                <CheckCircle2 className="size-3 shrink-0" />
                                Concluído
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-amber-700 whitespace-nowrap">
                                <Clock className="size-3 shrink-0" />
                                faltam {pending}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isDone ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>

                            {/* Botão de incremento rápido +1 */}
                            {!isDone && (
                              <button
                                type="button"
                                onClick={() => onQuickAddSession(pkg.id)}
                                title="Registrar +1 consulta feita agora"
                                className="flex size-6 items-center justify-center rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200/70 transition-colors shadow-2xs text-[11px] font-black cursor-pointer"
                              >
                                +1
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Financeiro (Sem traço, ícone na cor com tooltip e centralizado) */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          {pkg.packageValue ? (
                            <p className="font-bold text-slate-900 text-xs">
                              R$ {pkg.packageValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          ) : null}
                          {pkg.partnerShare ? (
                            <p className="text-[10px] text-slate-400">
                              Repasse: R$ {pkg.partnerShare.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          ) : null}
                          <div className="inline-flex items-center justify-center">
                            {pkg.paymentStatus === 'pago' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-xs whitespace-nowrap">
                                <CheckCircle2 className="size-3.5 shrink-0" />
                                <span>Pago</span>
                              </span>
                            ) : pkg.paymentStatus === 'parcial' ? (
                              <span className="inline-flex items-center gap-1 text-amber-600 font-medium text-xs whitespace-nowrap">
                                <Clock className="size-3.5 shrink-0" />
                                <span>Parcial</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-600 font-medium text-xs whitespace-nowrap">
                                <AlertCircle className="size-3.5 shrink-0" />
                                <span>Pendente</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status com Cores Solicitadas: Concluído (Verde), Ativo (Azul), Pausado (Amarelo), Cancelado (Vermelho) - Aproximado da coluna de ações */}
                      <td className="py-3 px-2 sm:px-3 text-right whitespace-nowrap">
                        {(() => {
                          const statusConfig = {
                            concluido: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                            ativo: 'bg-blue-50 text-blue-700 border-blue-200',
                            pausado: 'bg-amber-50 text-amber-700 border-amber-200',
                            cancelado: 'bg-rose-50 text-rose-700 border-rose-200',
                          };
                          const labelMap = {
                            concluido: 'Concluído',
                            ativo: 'Ativo',
                            pausado: 'Pausado',
                            cancelado: 'Cancelado',
                          };
                          const currentStatus = pkg.status || 'ativo';
                          const badgeClass = statusConfig[currentStatus] || statusConfig.ativo;
                          const label = labelMap[currentStatus] || 'Ativo';

                          return (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeClass} whitespace-nowrap`}>
                              {label}
                            </span>
                          );
                        })()}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setExpandedPackageId(expandedPackageId === pkg.id ? null : pkg.id)}
                            title={expandedPackageId === pkg.id ? 'Ocultar detalhes' : 'Ver detalhes e comentário'}
                            aria-expanded={expandedPackageId === pkg.id}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                          >
                            <ChevronDown className={`size-4 transition-transform duration-200 ${expandedPackageId === pkg.id ? 'rotate-180' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleGoToPatient(pkg)}
                            title={`Ir para o prontuário de ${pkg.patientName} em Pacientes`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                          >
                            <User className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenSessionModal(pkg)}
                            title="Ver histórico de sessões e registrar consultas"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          >
                            <FileText className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditPackage(pkg)}
                            title="Editar pacote"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja excluir o pacote de ${pkg.patientName}?`)) {
                                onDeletePackage(pkg.id);
                              }
                            }}
                            title="Excluir pacote"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedPackageId === pkg.id && (
                      <tr className="bg-slate-50/70">
                        <td colSpan={5} className="px-4 py-3">
                          <div className="grid gap-3 text-xs sm:grid-cols-3">
                            <div>
                              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Parceria</p>
                              <p className="mt-0.5 font-semibold text-slate-800">{pkg.partnerName || 'Parceria não informada'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Início</p>
                              <p className="mt-0.5 font-semibold text-slate-800">
                                {pkg.startDate ? pkg.startDate.split('-').reverse().join('/') : 'Não informado'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Repasse</p>
                              <p className="mt-0.5 font-semibold text-slate-800">
                                {pkg.partnerShare ? `R$ ${pkg.partnerShare.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Sem repasse'}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                            <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Comentário</p>
                            <p className="whitespace-pre-wrap text-xs text-slate-700">
                              {pkg.notes || 'Nenhum comentário registrado para este pacote.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
