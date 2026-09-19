import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  deleteMultipleTasks,
  toggleTaskStatus,
  syncTasksFromCloud,
  TASKS_UPDATED_EVENT,
} from '../services/taskStorage.js';
import { getPresetDate } from '../domain/taskTypes.js';
import { syncTasksFromCalendar } from '../services/agendaTaskSync.js';

export function useTasks() {
  const [tasks, setTasks] = useState(() => getTasks());
  const [filterTab, setFilterTab] = useState('today'); // 'today' | 'upcoming' | 'all' | 'completed'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Sincronização reativa com eventos locais e de outras abas
  const reloadTasks = useCallback(() => {
    setTasks(getTasks());
  }, []);

  useEffect(() => {
    // 1. Sincronização inicial com a nuvem no carregamento
    syncTasksFromCloud().catch(err => console.error(err));

    // 2. Ouvintes locais
    const handleUpdate = () => reloadTasks();
    window.addEventListener(TASKS_UPDATED_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(TASKS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [reloadTasks]);

  const todayStr = useMemo(() => getPresetDate(0), []);

  // Métricas para badges e resumos
  const metrics = useMemo(() => {
    let overdue = 0;
    let today = 0;
    let upcoming = 0;
    let completed = 0;
    let pending = 0;

    tasks.forEach(t => {
      if (t.status === 'completed') {
        completed++;
      } else {
        pending++;
        if (t.dueDate < todayStr) {
          overdue++;
        } else if (t.dueDate === todayStr) {
          today++;
        } else {
          upcoming++;
        }
      }
    });

    return {
      overdue,
      today,
      todayTotal: overdue + today, // Tudo que demanda atenção hoje
      upcoming,
      completed,
      pending,
      total: tasks.length,
    };
  }, [tasks, todayStr]);

  // Lista filtrada e ordenada
  const filteredTasks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return tasks.filter(task => {
      // Filtro de Busca
      if (q) {
        const matchTitle = (task.title || '').toLowerCase().includes(q);
        const matchPatient = (task.patientName || '').toLowerCase().includes(q);
        const matchNotes = (task.notes || '').toLowerCase().includes(q);
        if (!matchTitle && !matchPatient && !matchNotes) return false;
      }

      // Filtro de Categoria
      if (categoryFilter !== 'all' && task.category !== categoryFilter) {
        return false;
      }

      // Filtro por Aba Temporal
      if (filterTab === 'completed') {
        return task.status === 'completed';
      }

      // Nas abas ativas, apenas não-concluídas
      if (task.status === 'completed') return false;

      if (filterTab === 'today') {
        return task.dueDate <= todayStr; // Atrasadas e Hoje
      }

      if (filterTab === 'upcoming') {
        return task.dueDate > todayStr; // Próximos dias
      }

      // 'all'
      return true;
    }).sort((a, b) => {
      // Ordenação: primeiro prioridade alta se for o mesmo dia, depois por data
      const dateA = a.dueDate || '';
      const dateB = b.dueDate || '';
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }
      const priorityOrder = { alta: 1, media: 2, baixa: 3 };
      return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
    });
  }, [tasks, filterTab, categoryFilter, searchQuery, todayStr]);

  // Ações
  const handleCreateTask = useCallback((data) => {
    const created = createTask(data);
    reloadTasks();
    return created;
  }, [reloadTasks]);

  const handleUpdateTask = useCallback((taskId, updates) => {
    updateTask(taskId, updates);
    reloadTasks();
  }, [reloadTasks]);

  const handleDeleteTask = useCallback((taskId) => {
    deleteTask(taskId);
    reloadTasks();
  }, [reloadTasks]);

  const handleClearFilteredTasks = useCallback(() => {
    const ids = filteredTasks.map(t => t.id);
    if (ids.length > 0) {
      deleteMultipleTasks(ids);
      reloadTasks();
    }
  }, [filteredTasks, reloadTasks]);

  const handleToggleStatus = useCallback((taskId) => {
    toggleTaskStatus(taskId);
    reloadTasks();
  }, [reloadTasks]);

  const syncFromAgenda = useCallback(async (modeId = 'dieta') => {
    setIsSyncing(true);
    try {
      const result = await syncTasksFromCalendar(tasks, 7, modeId);
      if (result.newTasks.length > 0) {
        result.newTasks.forEach(t => createTask(t));
        reloadTasks();
      }
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [tasks, reloadTasks]);

  return {
    tasks,
    filteredTasks,
    metrics,
    todayStr,
    filterTab,
    setFilterTab,
    categoryFilter,
    setCategoryFilter,
    searchQuery,
    setSearchQuery,
    createTask: handleCreateTask,
    updateTask: handleUpdateTask,
    deleteTask: handleDeleteTask,
    clearFilteredTasks: handleClearFilteredTasks,
    toggleTaskStatus: handleToggleStatus,
    reloadTasks,
    syncFromAgenda,
    isSyncing,
  };
}
