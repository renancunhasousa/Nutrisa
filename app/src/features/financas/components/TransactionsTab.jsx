import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  Check,
  ChevronDown,
  Calendar,
  Pencil,
  Trash2,
  Download,
  CreditCard,
  Tag,
  TrendingUp,
} from 'lucide-react';
import { exportTransactionsToCSV } from '../services/financeStorage.js';

const DATE_SORT_OPTIONS = [
  { id: 'date_desc', label: 'Mais recentes primeiro' },
  { id: 'date_asc', label: 'Mais antigas primeiro' },
];

const TYPE_OPTIONS = [
  { id: 'todos', label: 'Todos os Tipos' },
  { id: 'receita', label: 'Somente Receitas' },
  { id: 'despesa', label: 'Somente Despesas' },
];

export default function TransactionsTab({
  transactions = [],
  onOpenNewTransaction,
  onEditTransaction,
  onDeleteTransaction,
  patientFilter = null,
  onClearPatientFilter,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [dateSort, setDateSort] = useState('date_desc');
  const [openDropdown, setOpenDropdown] = useState(null); // 'type' | 'category' | 'sort' | null

  // Fechar dropdowns ao clicar fora ou com Escape
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

  // Lista dinâmica de categorias existentes
  const categoriesList = useMemo(() => {
    const set = new Set();
    transactions.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [transactions]);

  // Filtragem
  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const result = transactions.filter((t) => {
      const matchSearch =
        !term ||
        (t.description && t.description.toLowerCase().includes(term)) ||
        (t.category && t.category.toLowerCase().includes(term)) ||
        (t.notes && t.notes.toLowerCase().includes(term));

      const matchType = typeFilter === 'todos' || t.type === typeFilter;
      const matchCategory = categoryFilter === 'todos' || t.category === categoryFilter;

      return matchSearch && matchType && matchCategory;
    });

    // Ordenação por data do lançamento (datas no formato AAAA-MM-DD ordenam corretamente como texto)
    const direction = dateSort === 'date_asc' ? 1 : -1;
    return result.sort((a, b) => direction * (a.date || '').localeCompare(b.date || ''));
  }, [transactions, searchTerm, typeFilter, categoryFilter, dateSort]);

  const handleExport = () => {
    exportTransactionsToCSV(filtered);
  };

  return (
    <div className="space-y-4">
      {/* Barra de Busca e Filtros (Layout idêntico à seção de Pacotes) */}
      <div className="relative z-30 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Input de busca */}
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar lançamento, categoria ou observação..."
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
              title="Limpar filtro e exibir todos os lançamentos"
            >
              <span>Paciente: {patientFilter.name}</span>
              <span className="text-[10px] opacity-85">✕ Limpar</span>
            </button>
          ) : null}

          {/* Menu Dropdown de Tipo */}
          <div className="relative finance-dropdown-container">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
              className={`inline-flex w-56 shrink-0 items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                typeFilter !== 'todos'
                  ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-200'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="Filtrar por tipo de lançamento"
              aria-expanded={openDropdown === 'type'}
            >
              <span className="flex min-w-0 items-center gap-1.5 truncate">
                <Filter className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {typeFilter === 'todos'
                    ? 'Tipo'
                    : typeFilter === 'receita'
                    ? 'Receitas'
                    : 'Despesas'}
                </span>
              </span>
              <ChevronDown className={`w-3 h-3 shrink-0 opacity-70 transition-transform duration-200 ${openDropdown === 'type' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'type' && (
              <div
                className="absolute left-0 mt-2 min-w-[12rem] app-solid-dropdown !bg-white bg-[#ffffff] rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-scale-up space-y-1"
                style={{ backgroundColor: '#ffffff', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
              >
                <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Tipo de Lançamento
                </div>
                {TYPE_OPTIONS.map((opt) => {
                  const isSelected = typeFilter === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setTypeFilter(opt.id);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-900 font-bold'
                          : 'text-slate-700 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Menu Dropdown de Categoria */}
          {categoriesList.length > 0 && (
            <div className="relative finance-dropdown-container">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'category' ? null : 'category')}
                className={`inline-flex w-56 shrink-0 items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                  categoryFilter !== 'todos'
                    ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-200'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title="Filtrar por categoria"
                aria-expanded={openDropdown === 'category'}
              >
                <span className="flex min-w-0 items-center gap-1.5 truncate">
                  <Tag className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {categoryFilter === 'todos' ? 'Categoria' : categoryFilter}
                  </span>
                </span>
                <ChevronDown className={`w-3 h-3 shrink-0 opacity-70 transition-transform duration-200 ${openDropdown === 'category' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdown === 'category' && (
                <div
                  className="absolute left-0 mt-2 min-w-[13rem] app-solid-dropdown !bg-white bg-[#ffffff] rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-scale-up space-y-1"
                  style={{ backgroundColor: '#ffffff', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
                >
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Filtrar por Categoria
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter('todos');
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      categoryFilter === 'todos'
                        ? 'bg-emerald-50 text-emerald-900 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <span>Todas as Categorias</span>
                    {categoryFilter === 'todos' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>

                  <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar pt-1 border-t border-slate-100">
                    {categoriesList.map((cat) => {
                      const isSelected = categoryFilter === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setCategoryFilter(cat);
                            setOpenDropdown(null);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-900 font-bold'
                              : 'text-slate-700 hover:bg-slate-50 font-medium'
                          }`}
                        >
                          <span className="truncate">{cat}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Menu Dropdown de Ordenação por Data */}
          <div className="relative finance-dropdown-container">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
              className={`inline-flex w-56 shrink-0 items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                dateSort !== 'date_desc'
                  ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-200'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="Ordenar lançamentos por data"
              aria-expanded={openDropdown === 'sort'}
            >
              <span className="flex min-w-0 items-center gap-1.5 truncate">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {DATE_SORT_OPTIONS.find((opt) => opt.id === dateSort)?.label}
                </span>
              </span>
              <ChevronDown className={`w-3 h-3 shrink-0 opacity-70 transition-transform duration-200 ${openDropdown === 'sort' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'sort' && (
              <div
                className="absolute left-0 mt-2 w-56 app-solid-dropdown !bg-white bg-[#ffffff] rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-scale-up space-y-1"
                style={{ backgroundColor: '#ffffff', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
              >
                <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Ordenar por data
                </div>
                {DATE_SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { setDateSort(opt.id); setOpenDropdown(null); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      dateSort === opt.id
                        ? 'bg-emerald-50 text-emerald-900 font-bold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {dateSort === opt.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botão de Limpar Filtros se houver filtro ativo */}
          {(searchTerm || typeFilter !== 'todos' || categoryFilter !== 'todos') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('todos');
                setCategoryFilter('todos');
              }}
              className="inline-flex min-h-10 items-center px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              Limpar filtros
            </button>
          )}

          {/* Botão de Exportar Planilha CSV (No mesmo local do PackagesTab) */}
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex min-h-10 items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ml-auto"
            title="Exportar lançamentos para planilha Excel / CSV"
          >
            <Download className="size-3.5 text-slate-500" />
            <span className="hidden sm:inline">Exportar Planilha</span>
          </button>
        </div>
      </div>

      {/* Tabela de Lançamentos */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-xs">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs sm:text-sm">
            Nenhum lançamento financeiro encontrado com os filtros atuais.
          </div>
        ) : (
          <div className="max-h-[440px] overflow-auto overscroll-contain custom-scrollbar">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr className="border-b border-slate-200/70 bg-slate-50/75 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Pagamento</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((tx) => {
                  const isIncome = tx.type === 'receita';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">
                        {tx.date ? new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {tx.description}
                        {tx.notes && <p className="text-[11px] text-slate-400 font-normal">{tx.notes}</p>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold">
                          {tx.category || 'Geral'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="flex items-center gap-1">
                          <CreditCard className="size-3 text-slate-400" />
                          {tx.paymentMethod || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className={`font-black text-sm ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isIncome ? '+ ' : '- '}
                          R$ {Number(tx.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onEditTransaction(tx)}
                            title="Editar lançamento"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Excluir este lançamento financeiro?')) {
                                onDeleteTransaction(tx.id);
                              }
                            }}
                            title="Excluir lançamento"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
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
