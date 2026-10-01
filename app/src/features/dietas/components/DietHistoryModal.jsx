import React, { useState, useEffect } from 'react';
import { X, Search, User, Copy, Trash2, ArrowRight, BookOpen } from 'lucide-react';
import { listDietPlans, deleteDietPlan, duplicateDietPlan } from '../services/dietStorageService.js';

export function DietHistoryModal({ isOpen, onClose, onSelectPlan, onDuplicateAndLoad }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    loadList();
  }, [isOpen]);

  const loadList = async () => {
    setLoading(true);
    try {
      const data = await listDietPlans();
      setPlans(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Deseja realmente excluir este plano alimentar?')) return;
    await deleteDietPlan(id);
    setPlans(prev => prev.filter(p => p.id !== id));
  };

  const handleDuplicate = (plan, e) => {
    e.stopPropagation();
    const cloned = duplicateDietPlan(plan);
    onDuplicateAndLoad(cloned);
    onClose();
  };

  if (!isOpen) return null;

  const filtered = plans.filter(p => {
    const text = `${p.title} ${p.patient_name || ''} ${p.objective || ''}`.toLowerCase();
    return text.includes(filter.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              Histórico de Dietas e Modelos
            </h3>
            <p className="text-xs text-slate-500">Planos salvos no consultório e sincronizados com a nuvem</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Campo de Busca */}
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Buscar por paciente ou título do plano..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:border-emerald-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {loading ? (
            <p className="text-center py-8 text-xs text-slate-400 font-medium">Carregando dietas...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <p className="text-xs text-slate-500">Nenhum plano alimentar salvo encontrado.</p>
            </div>
          ) : (
            filtered.map((plan) => (
              <div
                key={plan.id}
                onClick={() => {
                  onSelectPlan(plan);
                  onClose();
                }}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {plan.title || 'Plano Sem Título'}
                    </h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      plan.status === 'publicada' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {plan.status === 'publicada' ? 'Publicada' : 'Rascunho'}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {plan.patient_name && (
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400" /> {plan.patient_name}
                      </span>
                    )}
                    <span>{plan.target_calories} kcal</span>
                    <span>• {plan.meals?.length || 0} refeições</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(plan.updated_at || plan.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={(e) => handleDuplicate(plan, e)}
                    title="Duplicar como novo modelo"
                    className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(plan.id, e)}
                    title="Excluir do histórico"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <span>Carregar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
