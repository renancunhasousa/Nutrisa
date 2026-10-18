import React, { useState, useEffect } from 'react';
import { defaultClauses } from '../domain/defaultClauses';
import { SignaturePad } from './SignaturePad';
import { ContratoPrintLayout } from './ContratoPrintLayout';
import { KEY_CONTRACTS_CONFIG, KEY_CONTRACTS_PLAN_HISTORY } from '../../../config/storageKeys';
import { FileSignature, Link as LinkIcon, X, Plus, Trash2, Printer, Check, ChevronDown } from 'lucide-react';

const PLAN_OPTIONS = [
  { id: 'essence', label: 'Essence', icon: '🌿' },
  { id: 'premium', label: 'Premium', icon: '⭐' },
  { id: 'legacy', label: 'Legacy', icon: '👑' },
  { id: 'custom', label: 'Personalizado', icon: '🏷️' },
];

export function ContratoGenerator({ paciente, onClose, onGenerated }) {
  const [selectedPlan, setSelectedPlan] = useState('essence');
  const [isPlanMenuOpen, setIsPlanMenuOpen] = useState(false);
  const [valor, setValor] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('Pix');
  const [consultas, setConsultas] = useState([{ data: '', horario: '' }]);
  const [observacoes, setObservacoes] = useState('');
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [assinaturaBase64, setAssinaturaBase64] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Carregar último valor usado para o plano selecionado
  useEffect(() => {
    try {
      const historyStr = localStorage.getItem(KEY_CONTRACTS_PLAN_HISTORY);
      if (historyStr) {
        const history = JSON.parse(historyStr);
        if (history[selectedPlan]) {
          setValor(history[selectedPlan].valor || '');
          setFormaPagamento(history[selectedPlan].formaPagamento || 'Pix');
        } else {
          setValor('');
        }
      }
    } catch (e) {
      console.error('Erro ao carregar histórico de contratos:', e);
    }
  }, [selectedPlan]);

  useEffect(() => {
    if (!isPlanMenuOpen) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('.contratos-modal-plan-dropdown')) {
        setIsPlanMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsPlanMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlanMenuOpen]);

  const handleSalvarPreco = () => {
    try {
      const historyStr = localStorage.getItem(KEY_CONTRACTS_PLAN_HISTORY);
      const history = historyStr ? JSON.parse(historyStr) : {};
      history[selectedPlan] = { valor, formaPagamento };
      localStorage.setItem(KEY_CONTRACTS_PLAN_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error('Erro ao salvar histórico de contratos:', e);
    }
  };

  const handleAddConsulta = () => {
    setConsultas([...consultas, { data: '', horario: '' }]);
  };

  const handleRemoveConsulta = (index) => {
    const novasConsultas = [...consultas];
    novasConsultas.splice(index, 1);
    setConsultas(novasConsultas);
  };

  const handleConsultaChange = (index, field, value) => {
    const novasConsultas = [...consultas];
    novasConsultas[index][field] = value;
    setConsultas(novasConsultas);
  };

  const handleGerarLink = async () => {
    handleSalvarPreco();
    // TODO: Implementar geração de link público (via API)
    alert('Funcionalidade de geração de link em desenvolvimento. Copiaria o link para a área de transferência.');
  };

  const handleGerarPDF = async () => {
    handleSalvarPreco();
    setIsGenerating(true);
    // Dá um pequeno tempo para o state atualizar antes de abrir o diálogo de impressão
    setTimeout(() => {
      window.print();
      setIsGenerating(false);
      if (onGenerated) onGenerated();
      if (onClose) onClose();
    }, 300);
  };

  return (
    <>
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden print:hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center">
            <FileSignature className="w-5 h-5 mr-2 text-emerald-600" />
            Gerar Contrato
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Paciente: <span className="font-medium text-slate-700">{paciente?.name || 'Não selecionado'}</span>
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-6">
        
        {/* Seção 1: Informações do Plano */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">Detalhes do Plano</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative contratos-modal-plan-dropdown">
              <label className="block text-xs font-medium text-slate-500 mb-1">Plano Escolhido</label>
              <button
                type="button"
                onClick={() => setIsPlanMenuOpen(!isPlanMenuOpen)}
                className={`w-full min-h-10 px-3 py-2 rounded-xl border text-sm font-medium transition-all cursor-pointer flex items-center justify-between shadow-2xs active:scale-[0.99] ${
                  isPlanMenuOpen
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-white text-slate-900'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                }`}
                aria-expanded={isPlanMenuOpen}
                aria-haspopup="true"
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="text-base leading-none">
                    {PLAN_OPTIONS.find((opt) => opt.id === selectedPlan)?.icon || '📋'}
                  </span>
                  <span className="truncate font-semibold text-slate-800">
                    {PLAN_OPTIONS.find((opt) => opt.id === selectedPlan)?.label || 'Selecione um plano'}
                  </span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 ml-2 opacity-70 shrink-0 transition-transform duration-200 ${
                    isPlanMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isPlanMenuOpen && (
                <div
                  className="absolute left-0 right-0 mt-2 app-solid-dropdown !bg-white bg-[#ffffff] rounded-2xl shadow-xl border border-slate-200/80 p-2 z-30 animate-scale-up space-y-1"
                  style={{ backgroundColor: '#ffffff', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
                >
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Selecionar plano
                  </div>

                  {PLAN_OPTIONS.map((opt) => {
                    const isSelected = selectedPlan === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSelectedPlan(opt.id);
                          setIsPlanMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-900 font-bold'
                            : 'text-slate-700 hover:bg-slate-50 font-medium'
                        }`}
                      >
                        <span className="flex items-center truncate">
                          <span className="mr-2 text-base leading-none">{opt.icon}</span>
                          <span className="truncate text-xs sm:text-sm">{opt.label}</span>
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Valor Total (R$)</label>
              <input 
                type="text" 
                placeholder="Ex: 1.500,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full text-sm border-slate-200 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Forma e Condições de Pagamento</label>
              <input 
                type="text" 
                placeholder="Ex: À vista via Pix ou em até 3x no Cartão"
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
                className="w-full text-sm border-slate-200 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
          </div>
        </section>

        {/* Seção 2: Previsão de Consultas */}
        <section className="space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-700">Previsão de Consultas <span className="font-normal text-slate-400">(Opcional)</span></h3>
            <button 
              type="button"
              onClick={handleAddConsulta}
              className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
            >
              <Plus className="size-3.5 text-emerald-600" />
              <span>Adicionar Consulta</span>
            </button>
          </div>
          
          <div className="space-y-2">
            {consultas.map((c, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="w-1/2">
                  <input 
                    type="date"
                    value={c.data}
                    onChange={(e) => handleConsultaChange(index, 'data', e.target.value)}
                    className="w-full text-sm border-slate-200 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div className="w-[40%]">
                  <input 
                    type="time"
                    value={c.horario}
                    onChange={(e) => handleConsultaChange(index, 'horario', e.target.value)}
                    className="w-full text-sm border-slate-200 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <button 
                  type="button"
                  onClick={() => handleRemoveConsulta(index)}
                  className="p-2 text-slate-400 hover:text-rose-500 rounded-md hover:bg-rose-50 mt-1 transition-colors"
                  title="Remover Consulta"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {consultas.length === 0 && (
              <p className="text-xs text-slate-400 italic py-2">Nenhuma consulta prevista informada. O contrato será gerado sem essa seção.</p>
            )}
          </div>
        </section>

        {/* Seção 3: Observações */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">Observações Extras</h3>
          <textarea 
            placeholder="Algum acordo específico com este paciente que foge do padrão?"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={2}
            className="w-full text-sm border-slate-200 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500 resize-none"
          />
        </section>

        {/* Seção 4: Assinatura */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <FileSignature className="size-3.5 text-emerald-600" aria-hidden="true" />
            <h3 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
              <span>Assinatura Digital</span>
            </h3>
          </div>
          {assinaturaBase64 ? (
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-center relative">
              <p className="text-xs font-bold text-emerald-800 mb-2">Assinatura Coletada com Sucesso!</p>
              <img src={assinaturaBase64} alt="Assinatura" className="max-h-24 mx-auto bg-white border border-slate-200 rounded p-1 mb-3" />
              <button 
                onClick={() => setAssinaturaBase64(null)}
                className="text-xs text-rose-600 font-medium hover:underline absolute top-2 right-3"
              >
                Refazer
              </button>
            </div>
          ) : showSignaturePad ? (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h4 className="text-sm font-bold text-slate-700 mb-2">Assinar na Tela</h4>
              <p className="text-xs text-slate-500 mb-4">Peça ao paciente para assinar abaixo utilizando o dedo ou o mouse.</p>
              <SignaturePad 
                onSave={(base64) => {
                  setAssinaturaBase64(base64);
                  setShowSignaturePad(false);
                }} 
                onCancel={() => setShowSignaturePad(false)} 
              />
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-lg p-5 text-center flex flex-col items-center">
              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center mb-3">
                <FileSignature className="w-5 h-5 text-slate-500" />
              </div>
              <h4 className="text-sm font-bold text-slate-700 mb-1">Como o paciente irá assinar?</h4>
              <p className="text-xs text-slate-500 mb-4 max-w-sm">
                Você pode coletar a assinatura agora mesmo neste dispositivo, ou gerar um link para enviar no WhatsApp.
              </p>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowSignaturePad(true)}
                  className="bg-white border border-slate-300 shadow-sm text-slate-700 hover:bg-slate-50 text-xs px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Assinar na Hora
                </button>
                <button 
                  type="button"
                  onClick={handleGerarLink}
                  className="bg-[#25D366] text-white shadow-sm hover:bg-[#20b858] text-xs px-4 py-2 rounded-md font-medium flex items-center transition-colors"
                >
                  <LinkIcon className="w-3.5 h-3.5 mr-1.5" />
                  Gerar Link (WhatsApp)
                </button>
              </div>
            </div>
          )}
        </section>

      </div>

      {/* Footer / Actions */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end items-center gap-3 rounded-b-xl">
        <button 
          onClick={onClose}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center shadow-2xs active:scale-95 cursor-pointer"
        >
          Cancelar
        </button>
        <button 
          onClick={handleGerarPDF}
          disabled={isGenerating || (!assinaturaBase64 && !showSignaturePad)}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-full shadow-sm hover:shadow transition-all flex items-center space-x-2 active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {isGenerating ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Gerando PDF...
            </span>
          ) : (
            <>
              <Printer className="w-4 h-4 mr-1.5" />
              <span>Imprimir / Salvar em PDF</span>
            </>
          )}
        </button>
      </div>
    </div>

    {/* O componente de impressão (visível apenas na impressão) */}
    <ContratoPrintLayout 
      paciente={paciente}
      plano={selectedPlan}
      valor={valor}
      formaPagamento={formaPagamento}
      consultas={consultas}
      observacoes={observacoes}
      assinaturaBase64={assinaturaBase64}
    />
    </>
  );
}
