import React, { useEffect, useRef, useState } from 'react';
import { getOwnerShortLabel } from '../../configuracoes/services/clinicProfileService.js';
import { 
  Calendar, 
  Users, 
  Filter, 
  Search,
  ChevronDown,
  SlidersHorizontal,
  Check,
  CheckCircle2,
  Clock,
  Headset,
  Stethoscope
} from 'lucide-react';

function FilterDropdown({ value, onChange, options, ariaLabel, menuTitle }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selectedOption = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!dropdownRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs font-medium shadow-2xs transition-all ${
          value && value !== 'all'
            ? 'border-emerald-300 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-100'
            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selectedOption?.icon}
          <span className="truncate" title={selectedOption?.fullLabel || selectedOption?.label}>{selectedOption?.label}</span>
        </span>
        <ChevronDown className={`size-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="absolute left-0 z-50 mt-2 max-h-64 w-64 max-w-[calc(100vw-2rem)] isolate space-y-1 overflow-y-auto rounded-2xl border border-slate-200 bg-[#fff] p-2 opacity-100 shadow-xl ring-1 ring-slate-900/5 animate-scale-up">
          <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            {menuTitle}
          </div>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={value === option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                value === option.value
                  ? 'bg-emerald-50 font-bold text-emerald-900'
                  : 'font-medium text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex min-w-0 items-center gap-2">
                {option.icon}
                <span className="truncate" title={option.fullLabel || option.label}>{option.label}</span>
              </span>
              {value === option.value ? <Check className="size-3.5 shrink-0 text-emerald-600" aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function WhatsAppFilters({
  period,
  setPeriod,
  availableMonths,
  attendantFilter,
  setAttendantFilter,
  selectedCategory,
  setSelectedCategory,
  uniqueCategories,
  statusFilter,
  setStatusFilter,
  searchTerm,
  setSearchTerm
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const ownerLabel = getOwnerShortLabel();

  return (
    <div className="relative z-40 space-y-4 rounded-3xl border border-slate-200/80 bg-slate-50/70 p-5 shadow-2xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
            <SlidersHorizontal className="size-3.5 text-emerald-600" /> Filtros e busca
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">Ajuste período, equipe, categoria e status quando necessário.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded((expanded) => !expanded)}
          aria-expanded={isExpanded}
          aria-controls="atendimento-advanced-filters"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100"
        >
          {isExpanded ? 'Ocultar filtros' : 'Mostrar filtros'}
          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isExpanded ? <div id="atendimento-advanced-filters" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Período */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase font-extrabold text-slate-700 flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Período
            </label>
            {period.startsWith('month:') && (
              <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Mês Ativo
              </span>
            )}
          </div>

          {/* Botões Rápidos */}
          <div className="grid grid-cols-4 gap-1 text-[11px] font-semibold bg-slate-100/80 p-1 rounded-xl">
            {[
              { id: 'today', label: 'Hoje' },
              { id: 'this_week', label: 'Semana' },
              { id: 'this_month', label: 'Mês' },
              { id: 'all', label: 'Tudo' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setPeriod(item.id)}
                className={`py-1.5 rounded-lg transition-all text-center whitespace-nowrap text-[11px] font-bold ${
                  period === item.id 
                    ? 'bg-white text-emerald-700 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Select de Meses Passados */}
          <FilterDropdown
            value={period.startsWith('month:') ? period : ''}
            onChange={(nextPeriod) => {
              if (nextPeriod) setPeriod(nextPeriod);
            }}
            ariaLabel="Selecionar mês anterior"
            menuTitle="Selecionar período"
            options={[
              { value: '', label: `Meses (${availableMonths.length})`, fullLabel: 'Meses anteriores', icon: <Calendar className="size-3.5 shrink-0 text-emerald-600" aria-hidden="true" /> },
              ...availableMonths.map((month) => ({
                value: `month:${month.key}`,
                label: `${month.label.slice(0, 3).toLowerCase()}/${String(month.year).slice(-2)} · ${month.count}`,
                fullLabel: `${month.label} (${month.count} mensagens)`,
                icon: <Calendar className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />,
              })),
            ]}
          />
        </div>

        {/* 2. Atendente */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-2.5">
          <label className="text-[10px] uppercase font-extrabold text-slate-700 flex items-center">
            <Users className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Origem / Atendente
          </label>
          <FilterDropdown
            value={attendantFilter}
            onChange={setAttendantFilter}
            ariaLabel="Filtrar por atendente"
            menuTitle="Filtrar por atendente"
            options={[
              { value: 'all', label: 'Todos', fullLabel: 'Todos os atendentes', icon: <Users className="size-3.5 shrink-0 text-emerald-600" aria-hidden="true" /> },
              { value: 'isabela', label: ownerLabel, fullLabel: ownerLabel, icon: <Stethoscope className="size-3.5 shrink-0 text-teal-600" aria-hidden="true" /> },
              { value: 'secretaria', label: 'Secretária', fullLabel: 'Equipe / Secretária', icon: <Headset className="size-3.5 shrink-0 text-purple-600" aria-hidden="true" /> },
            ]}
          />
          <div className="flex items-center space-x-3 text-[11px] text-slate-600 pt-1">
            <span className="flex items-center font-medium"><span className="w-2.5 h-2.5 rounded-full bg-teal-500 mr-1.5 inline-block"></span> {ownerLabel}</span>
            <span className="flex items-center font-medium"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 mr-1.5 inline-block"></span> Secretária</span>
          </div>
        </div>

        {/* 3. Categoria & Status com Toggle de Ignorar Outros */}
        <div className="relative z-20 flex flex-col justify-between space-y-2.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <label className="flex items-center whitespace-nowrap text-[10px] font-extrabold uppercase text-slate-700">
            <Filter className="mr-1 size-3.5 shrink-0 text-emerald-600" /> Categoria / Status
          </label>
          <FilterDropdown
            value={selectedCategory}
            onChange={setSelectedCategory}
            ariaLabel="Filtrar por categoria"
            menuTitle="Filtrar por categoria"
            options={[
              { value: 'all', label: `Todas (${uniqueCategories.length})`, fullLabel: `Todas as categorias (${uniqueCategories.length})`, icon: <Filter className="size-3.5 shrink-0 text-emerald-600" aria-hidden="true" /> },
              ...uniqueCategories.map((category) => ({
                value: category,
                label: category,
                icon: <Filter className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />,
              })),
            ]}
          />
          <FilterDropdown
            value={statusFilter}
            onChange={setStatusFilter}
            ariaLabel="Filtrar por status"
            menuTitle="Filtrar por status"
            options={[
              { value: 'all', label: 'Todos', fullLabel: 'Todos os status', icon: <Filter className="size-3.5 shrink-0 text-emerald-600" aria-hidden="true" /> },
              { value: 'answered', label: 'Respondidas', icon: <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" aria-hidden="true" /> },
              { value: 'pending', label: 'Aguardando', fullLabel: 'Aguardando resposta', icon: <Clock className="size-3.5 shrink-0 text-amber-600" aria-hidden="true" /> },
            ]}
          />
        </div>

        {/* 4. Busca Paciente & Toggle Cortesia */}
        <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <label htmlFor="atendimento-patient-search" className="flex items-center text-[10px] font-extrabold uppercase text-slate-700">
            <Search className="mr-1 size-3.5 text-emerald-600" /> Buscar Paciente
          </label>
          <div className="relative">
            <input
              id="atendimento-patient-search"
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Ex: Letícia, Creatina..."
              className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2 pr-7 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            )}
          </div>
        </div>

      </div> : null}
    </div>
  );
}
