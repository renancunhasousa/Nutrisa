import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../auth/useAuth.js';
import { usePatient } from '../pacientes/usePatient.js';
import PageHeader from '../../shared/ui/PageHeader.jsx';

export default function TarefasPage() {
  const { organizationId } = useAuth();
  const { selectedPatient } = usePatient();
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
    updateTask,
    deleteTask,
    toggleTaskStatus,
    syncFromAgenda,
    isSyncing,
    clearFilteredTasks,
    patientAvatars,
  } = useTasks({ organizationId });

  // Filtro de paciente ativo apenas quando explicitamente encaminhado pela tela de pacientes
  const [activePatientFilter, setActivePatientFilter] = useState(() => {
    try {
      const stored = sessionStorage.getItem('nutrisa_tasks_patient_filter');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.name) return parsed.name;
      }
    } catch {}
    return null;
  });

  useEffect(() => {
    if (activePatientFilter) {
      setSearchQuery(activePatientFilter);
    }
  }, [activePatientFilter, setSearchQuery]);

  const handleClearPatientFilter = () => {
    setActivePatientFilter(null);
    try {
      sessionStorage.removeItem('nutrisa_tasks_patient_filter');
    } catch {}
    setSearchQuery('');
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const handleOpenNew = () => {
    setEditingTask(selectedPatient ? {
      patientId: selectedPatient.id,
      patientName: selectedPatient.full_name,
      patientPhone: selectedPatient.whatsapp_phone || selectedPatient.phone || '',
    } : null);
    setIsModalOpen(true);
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveModal = (data) => {
    if (editingTask?.id) {
      updateTask(editingTask.id, data);
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
      const personalMsg = res.personalEventsIgnored > 0 ? `\nCompromissos pessoais desconsiderados: ${res.personalEventsIgnored}` : '';
      alert(
        `Sincronização concluída com sucesso!\n\nFormato: ${res.modeConfig?.title || 'Agenda'}\nNovas demandas de pacientes geradas: ${res.newTasksCreated}\nDemandas já existentes (ignoradas): ${res.tasksIgnored}${personalMsg}`
      );
    } catch (err) {
      const isAuthIssue =
        err.isAuthError ||
        err.status === 401 ||
        String(err.message).includes('401') ||
        String(err.message).toLowerCase().includes('conecte') ||
        String(err.message).toLowerCase().includes('agenda');

      if (isAuthIssue) {
        const goToAgenda = window.confirm(
          `📅 Atenção: Agenda do Google não conectada!\n\n${err.message}\n\nDeseja ir para o módulo "Agenda" agora para conectar sua conta?`
        );
        if (goToAgenda) {
          setIsSyncModalOpen(false);
          window.location.hash = 'agenda';
        }
        return;
      }

      alert(`Erro na sincronização: ${err.message}`);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-6 animate-fadeIn pb-12">
      {/* 1. Header do Módulo */}
      <PageHeader
        category="Rotina operacional"
        title="Minha Rotina & Tarefas"
        description="Não perca nenhuma anamnese, entrega de plano ou contato de pós-consulta."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleOpenSyncModal}
              disabled={isSyncing}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-500' : 'text-slate-500'}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Importar Semana'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenNew}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Demanda</span>
            </button>
          </div>
        }
      />

      {/* Cards de Métricas em Destaque */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs overflow-x-auto">
        <div className="grid grid-cols-5 gap-3 sm:gap-4 min-w-[680px] lg:min-w-0">
          {/* Atrasadas */}
          <div
            onClick={() => setFilterTab('today')}
            className={`min-w-0 p-4 rounded-2xl border transition-all cursor-pointer ${
              filterTab === 'today'
                ? 'bg-white border-slate-300 ring-2 ring-slate-400/20 shadow-xs'
                : 'bg-slate-50/80 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500 truncate">
                Atrasadas
              </span>
              <Flame className="w-4 h-4 text-rose-500 shrink-0" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-600">
                {metrics.overdue}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">Necessitam de atenção</p>
          </div>

          {/* Para Hoje */}
          <div
            onClick={() => setFilterTab('today')}
            className={`min-w-0 p-4 rounded-2xl border transition-all cursor-pointer ${
              filterTab === 'today'
                ? 'bg-white border-slate-300 ring-2 ring-slate-400/20 shadow-xs'
                : 'bg-slate-50/80 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500 truncate">
                Hoje
              </span>
              <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-500">
                {metrics.todayTotal}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">Demandas do dia</p>
          </div>

          {/* Próximas */}
          <div
            onClick={() => setFilterTab('upcoming')}
            className={`min-w-0 p-4 rounded-2xl border transition-all cursor-pointer ${
              filterTab === 'upcoming'
                ? 'bg-white border-slate-300 ring-2 ring-slate-400/20 shadow-xs'
                : 'bg-slate-50/80 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500 truncate">
                Próximas
              </span>
              <Calendar className="w-4 h-4 text-sky-500 shrink-0" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-sky-600">
                {metrics.upcoming}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">Programadas no radar</p>
          </div>

          {/* Total Ativo */}
          <div
            onClick={() => setFilterTab('all')}
            className={`min-w-0 p-4 rounded-2xl border transition-all cursor-pointer ${
              filterTab === 'all'
                ? 'bg-white border-slate-300 ring-2 ring-slate-400/20 shadow-xs'
                : 'bg-slate-50/80 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500 truncate">
                Total Pendente
              </span>
              <ListTodo className="w-4 h-4 text-slate-900 shrink-0" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {metrics.pending}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">Todas as pendências</p>
          </div>

          {/* Concluídas */}
          <div
            onClick={() => setFilterTab('completed')}
            className={`min-w-0 p-4 rounded-2xl border transition-all cursor-pointer ${
              filterTab === 'completed'
                ? 'bg-white border-slate-300 ring-2 ring-slate-400/20 shadow-xs'
                : 'bg-slate-50/80 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500 truncate">
                Concluídas
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600">
                {metrics.completed}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">Demandas finalizadas</p>
          </div>
        </div>
      </div>

      {/* 2. Barra de Ferramentas (Busca e Filtro por Categoria) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Campo de Busca Rápida e Filtro por Paciente Ativo */}
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por paciente ou demanda..."
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  if (activePatientFilter && val !== activePatientFilter) {
                    setActivePatientFilter(null);
                    try {
                      sessionStorage.removeItem('nutrisa_tasks_patient_filter');
                    } catch {}
                  }
                }}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 font-medium transition-all"
              />
            </div>
            {activePatientFilter ? (
              <button
                type="button"
                onClick={handleClearPatientFilter}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-emerald-600 text-white border-emerald-600 shadow-2xs hover:bg-emerald-700 cursor-pointer active:scale-95"
                title="Limpar filtro e exibir todas as demandas"
              >
                <span>Paciente: {activePatientFilter}</span>
                <span className="text-[10px] opacity-85">✕ Limpar</span>
              </button>
            ) : null}
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
        <div className="grid grid-cols-3 gap-1.5 border-t border-slate-100 pt-3 sm:grid-cols-5 xl:grid-cols-9">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`min-w-0 truncate rounded-lg px-2.5 py-1.5 text-center text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas
          </button>
          {Object.values(TASK_CATEGORIES).map((cat) => {
            const isSelected = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`flex min-w-0 items-center justify-center gap-1.5 truncate rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
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
                onLinkPatient={updateTask}
                patientAvatars={patientAvatars}
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
