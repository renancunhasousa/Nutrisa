import React from 'react';
import { 
  Calendar, 
  Users, 
  Filter, 
  ShieldCheck, 
  Search 
} from 'lucide-react';

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
  ignoreOthers,
  setIgnoreOthers,
  searchTerm,
  setSearchTerm,
  ignoreCourtesy,
  setIgnoreCourtesy
}) {
  return (
    <div className="bg-slate-50/70 p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
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
          <select
            value={period.startsWith('month:') ? period : ''}
            onChange={e => {
              if (e.target.value) setPeriod(e.target.value);
            }}
            className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
          >
            <option value="">🗓️ Meses anteriores ({availableMonths.length})...</option>
            {availableMonths.map(m => (
              <option key={m.key} value={`month:${m.key}`}>
                {m.label} ({m.count} msgs)
              </option>
            ))}
          </select>
        </div>

        {/* 2. Atendente */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-2.5">
          <label className="text-[10px] uppercase font-extrabold text-slate-700 flex items-center">
            <Users className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Origem / Atendente
          </label>
          <select
            value={attendantFilter}
            onChange={e => setAttendantFilter(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
          >
            <option value="all">Todos os Atendentes (Visão Geral)</option>
            <option value="isabela">👩‍⚕️ Dra. Isabela Muñoz</option>
            <option value="secretaria">💼 Equipe / Secretária</option>
          </select>
          <div className="flex items-center space-x-3 text-[11px] text-slate-600 pt-1">
            <span className="flex items-center font-medium"><span className="w-2.5 h-2.5 rounded-full bg-teal-500 mr-1.5 inline-block"></span> Dra. Isabela</span>
            <span className="flex items-center font-medium"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 mr-1.5 inline-block"></span> Secretária</span>
          </div>
        </div>

        {/* 3. Categoria & Status com Toggle de Ignorar Outros */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between gap-1.5">
            <label className="text-[10px] uppercase font-extrabold text-slate-700 flex items-center whitespace-nowrap">
              <Filter className="w-3.5 h-3.5 mr-1 text-emerald-600 flex-shrink-0" /> Filtros
            </label>
            <button
              onClick={() => setIgnoreOthers(!ignoreOthers)}
              className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold transition-all flex items-center border active:scale-95 whitespace-nowrap flex-shrink-0 ${
                ignoreOthers
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
              title="Quando ativado, oculta a categoria 'Outros' das métricas de SLA e gráficos para focar nos atendimentos essenciais"
            >
              <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600 flex-shrink-0" />
              {ignoreOthers ? 'Filtro Outros ON' : 'Filtro Outros OFF'}
            </button>
          </div>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
          >
            <option value="all">Todas as Categorias ({uniqueCategories.length})</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
          >
            <option value="all">Todos os Status (Respondidas + Pendentes)</option>
            <option value="answered">Respondidas ✅</option>
            <option value="pending">Aguardando Resposta ⏳</option>
          </select>
        </div>

        {/* 4. Busca Paciente & Toggle Cortesia */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase font-extrabold text-slate-700 flex items-center">
              <Search className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Buscar Paciente
            </label>
            <button
              onClick={() => setIgnoreCourtesy(!ignoreCourtesy)}
              className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold transition-all flex items-center border active:scale-95 whitespace-nowrap flex-shrink-0 ${
                ignoreCourtesy
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
              title="Quando ativado, ignora reações como 'ok', 'obrigado', emojis e figurinhas para não sujar o SLA e pendências"
            >
              <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600 flex-shrink-0" />
              {ignoreCourtesy ? 'Filtro Cortesia ON' : 'Filtro Cortesia OFF'}
            </button>
          </div>
          <div className="relative">
            <input
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
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Resultados com filtro:</span>
            <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
              {/* O pai pode renderizar ou deixar genérico */}
              Filtrados
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
