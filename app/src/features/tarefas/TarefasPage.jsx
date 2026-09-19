import React, { useState } from 'react';
import {
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  Flame,
  ListTodo,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useTasks } from './hooks/useTasks.js';
import { TaskCard } from './components/TaskCard.jsx';
import { TaskModal } from './components/TaskModal.jsx';
import { SyncAgendaModal } from './components/SyncAgendaModal.jsx';
import { TASK_CATEGORIES } from './domain/taskTypes.js';

export default function TarefasPage() {
  const {
    filteredTasks,
    metrics,
    todayStr,
    filterTab,
    setFilterTab,
    categoryFilter,
    setCategoryFilter,
    searchQuery,
    setSearchQuery,
    createTask,
    deleteTask,
    toggleTaskStatus,
    syncFromAgenda,
    isSyncing,
    clearFilteredTasks,
  } = useTasks();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const handleOpenNew = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveModal = (data) => {
    if (editingTask) {
      // Edição
      createTask(data); // simplificado ou update
    } else {
      createTask(data);
    }
  };

  const handleOpenSyncModal = () => {
    setIsSyncModalOpen(true);
  };

  const handleConfirmSync = async (modeId) => {
    try {
      const res = await syncFromAgenda(modeId);
      setIsSyncModalOpen(false);
      alert(
        `Sincronização concluída com sucesso!\n\nFormato: ${res.modeConfig?.title || 'Agenda'}\nNovas demandas geradas: ${res.newTasksCreated}\nDemandas já existentes (ignoradas): ${res.tasksIgnored}`
      );
    } catch (err) {
      alert(`Erro na sincronização: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header do Módulo & Métricas Principais */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Minha Rotina & Pacientes
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1 max-w-2xl leading-relaxed">
              Substitua o bloco de notas do celular: não perca nenhuma anamnese, entrega de plano ou contato de pós-consulta.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleOpenSyncModal}
              disabled={isSyncing}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-emerald-500' : 'text-slate-400'}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Importar Semana'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenNew}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all hover:scale-102 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Demanda</span>
          </button>
          </div>
        </div>

        {/* Cards de Métricas em Destaque */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-100">
          {/* Hoje / Atrasadas */}
          <div
            onClick={() => setFilterTab('today')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              filterTab === 'today'
                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
                : 'bg-slate-50/70 border-slate-200/60 hover:bg-amber-50/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                Atenção Hoje
              </span>
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{metrics.todayTotal}</span>
              {metrics.overdue > 0 && (
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200">
                  {metrics.overdue} atrasada{metrics.overdue > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Vencem hoje ou pendentes</p>
          </div>

          {/* Próximas */}
          <div
            onClick={() => setFilterTab('upcoming')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              filterTab === 'upcoming'
                ? 'bg-sky-50/70 border-sky-300 ring-2 ring-sky-500/20 shadow-xs'
                : 'bg-slate-50/70 border-slate-200/60 hover:bg-sky-50/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-sky-900 uppercase tracking-wider">
                Próximos Dias
              </span>
              <Calendar className="w-4 h-4 text-sky-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{metrics.upcoming}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Programadas no radar</p>
          </div>

          {/* Total Ativo */}
          <div
            onClick={() => setFilterTab('all')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              filterTab === 'all'
                ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                : 'bg-slate-50/70 border-slate-200/60 hover:bg-emerald-50/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                Total Pendente
              </span>
              <ListTodo className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{metrics.pending}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Todas as pendências ativas</p>
          </div>

          {/* Concluídas */}
          <div
            onClick={() => setFilterTab('completed')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              filterTab === 'completed'
                ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-500/20 shadow-xs'
                : 'bg-slate-50/70 border-slate-200/60 hover:bg-purple-50/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                Concluídas
              </span>
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{metrics.completed}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Demandas finalizadas</p>
          </div>
        </div>
      </div>

      {/* 2. Barra de Ferramentas (Busca e Filtro por Categoria) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Campo de Busca Rápida */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por paciente ou demanda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 font-medium transition-all"
            />
          </div>

          {/* Contador de Demandas Filtradas */}
          <div className="flex items-center gap-4 self-end sm:self-auto">
            <span className="text-xs text-slate-500 font-medium">
              Exibindo <strong className="text-slate-800 font-bold">{filteredTasks.length}</strong> {filteredTasks.length === 1 ? 'demanda' : 'demandas'}
            </span>
            {filteredTasks.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Tem certeza que deseja limpar todas as demandas listadas abaixo? Essa ação não pode ser desfeita.')) {
                    clearFilteredTasks();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 text-[11px] font-bold rounded-lg transition-all border border-rose-100 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Chips de Categoria */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100 no-scrollbar">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas as Categorias
          </button>
          {Object.values(TASK_CATEGORIES).map((cat) => {
            const isSelected = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap border transition-all cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? `${cat.badgeBg} ring-1 ring-emerald-500 shadow-2xs`
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${cat.dotBg}`} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Lista de Demandas */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          /* Estado Vazio Motivador */
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200/80 shadow-xs max-w-lg mx-auto">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {filterTab === 'today'
                ? 'Tudo em dia por hoje, Dra.!'
                : 'Nenhuma demanda encontrada'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              {filterTab === 'today'
                ? 'Você zerou as pendências previstas para hoje. Aproveite o tempo livre ou planeje as próximas demandas!'
                : 'Não há tarefas correspondentes ao filtro selecionado.'}
            </p>
            <button
              type="button"
              onClick={handleOpenNew}
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Demanda</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                todayStr={todayStr}
                onToggleStatus={toggleTaskStatus}
                onDelete={deleteTask}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>

      {/* 4. Modal de Criação / Edição */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        initialData={editingTask}
      />

      {/* 5. Modal de Confirmação e Modo de Importação da Agenda */}
      <SyncAgendaModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onConfirm={handleConfirmSync}
        isSyncing={isSyncing}
      />
    </div>
  );
}
