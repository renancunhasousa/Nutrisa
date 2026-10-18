import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  Check,
  ChevronDown,
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  Calendar,
  Pencil,
  Trash2,
  Download,
  CreditCard,
  Tag,
  TrendingUp,
} from 'lucide-react';
import { exportTransactionsToCSV } from '../services/financeStorage.js';

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
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [openDropdown, setOpenDropdown] = useState(null); // 'type' | 'category' | null

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
    return transactions.filter((t) => {
      const matchSearch =
        !term ||
        (t.description && t.description.toLowerCase().includes(term)) ||
        (t.category && t.category.toLowerCase().includes(term)) ||
        (t.notes && t.notes.toLowerCase().includes(term));

      const matchType = typeFilter === 'todos' || t.type === typeFilter;
      const matchCategory = categoryFilter === 'todos' || t.category === categoryFilter;

      return matchSearch && matchType && matchCategory;
    });
  }, [transactions, searchTerm, typeFilter, categoryFilter]);

  // Métricas do Caixa
  const { totalIncome, totalExpense, balance } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    transactions.forEach((t) => {
      if (t.type === 'receita') inc += Number(t.amount || 0);
      else if (t.type === 'despesa') exp += Number(t.amount || 0);
    });
    return { totalIncome: inc, totalExpense: exp, balance: inc - exp };
  }, [transactions]);

  const handleExport = () => {
    exportTransactionsToCSV(filtered);
  };

  return (
    <div className="space-y-4">
      {/* Cards de Resumo Rápido do Caixa (Ícones sem fundo conforme solicitado) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
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
              R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
              R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
            <DollarSign className={`size-5 shrink-0 ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black ${balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className={`text-[11px] font-semibold mt-1 ${balance >= 0 ? 'text-slate-500' : 'text-rose-600'}`}>
            Resultado líquido do período
          </p>
        </div>
      </div>

      {/* Barra de Busca e Filtros (Layout idêntico à seção de Pacotes) */}
      <div className="relative z-30 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white/70 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-slate-200/60 shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Input de busca */}
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar lançamento, categoria ou observação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Menu Dropdown de Tipo */}
          <div className="relative finance-dropdown-container">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
              className={`inline-flex min-h-10 items-center justify-between gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                typeFilter !== 'todos'
                  ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-200'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="Filtrar por tipo de lançamento"
              aria-expanded={openDropdown === 'type'}
            >
              <span className="flex items-center gap-1.5 truncate max-w-[150px]">
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
                className={`inline-flex min-h-10 items-center justify-between gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                  categoryFilter !== 'todos'
                    ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-200'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title="Filtrar por categoria"
                aria-expanded={openDropdown === 'category'}
              >
                <span className="flex items-center gap-1.5 truncate max-w-[150px]">
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
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
