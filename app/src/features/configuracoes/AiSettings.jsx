import React from 'react';

import { Zap, RefreshCw } from 'lucide-react';

export default function AiSettings({ settings }) {
const { availableModels, aiAccessToken, updateAiAccessToken, activeModal, setActiveModal, selectedModel, setSelectedModel, geminiStatus, apiTestDetails, testApiConnection } = settings;
return (<>      {/* PANEL 2: AI ENGINE & MODEL CONFIGURATION MODAL */}
      {activeModal === 'ai' && (
        <div className="bg-slate-900 text-slate-100 p-4 border-b border-amber-500/30 print:hidden transition-all shadow-inner">
          <div className="max-w-7xl mx-auto space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm flex items-center text-amber-300">
                <Zap className="w-4 h-4 mr-1.5 text-amber-400" /> Configuração do Motor de IA
              </h3>
              <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded">Integração pelo servidor</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="md:col-span-2 space-y-2">
                <label className="block text-amber-200 font-bold" htmlFor="ai-access">Código de acesso da clínica</label>
                <input id="ai-access" type="password" autoComplete="off" value={aiAccessToken}
                  onChange={e => updateAiAccessToken(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5" />
                <p className="text-slate-400">Mantido apenas nesta sessão do navegador. Após informar, clique em Testar Conexão.</p>
                <label className="block text-amber-200 font-bold">Modelo Ativo de Leitura e Interpretação</label>
                <select
                  value={selectedModel}
                  onChange={e => setSelectedModel(e.target.value)}
                  className="w-full bg-slate-950 border border-amber-500/50 rounded-lg p-2.5 text-white font-medium focus:ring-2 focus:ring-amber-400 outline-none"
                >
                  {availableModels.map(model => <option key={model} value={model}>{model}</option>)}
                </select>
                <p className="text-[10.5px] text-slate-400 leading-relaxed">
                  Em caso de cota ou indisponibilidade, o servidor tenta os modelos alternativos configurados.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-amber-400 block">Diagnóstico de Provedores</span>
                  <button
                    onClick={testApiConnection}
                    disabled={geminiStatus === 'testing'}
                    className="flex items-center gap-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-amber-300 px-2 py-0.5 rounded border border-slate-700 transition"
                  >
                    <RefreshCw className={`w-3 h-3 ${geminiStatus === 'testing' ? 'animate-spin' : ''}`} />
                    <span>Testar Conexão</span>
                  </button>
                </div>

                {/* Gemini Status */}
                <div className="flex items-center justify-between text-[11px] border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-300 font-medium">Google Gemini:</span>
                  <div className="flex items-center gap-1.5">
                    {geminiStatus === 'online' && (
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Online
                      </span>
                    )}
                    {geminiStatus === 'configured' && (
                      <span className="flex items-center gap-1 text-emerald-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Chave Ativa
                      </span>
                    )}
                    {geminiStatus === 'testing' && (
                      <span className="text-amber-400 animate-pulse">Testando...</span>
                    )}
                    {geminiStatus === 'error' && (
                      <span className="flex items-center gap-1 text-rose-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span> Erro / Cota
                      </span>
                    )}
                    {geminiStatus === 'missing' && (
                      <span className="flex items-center gap-1 text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-slate-600"></span> Sem Chave
                      </span>
                    )}
                  </div>
                </div>

                {apiTestDetails && (
                  <p className="text-[9.5px] text-amber-200/80 bg-slate-900 p-1 rounded border border-slate-800 font-mono">
                    {apiTestDetails}
                  </p>
                )}

                <p className="text-[10px] text-slate-400 pt-0.5">
                  Modelo Ativo: <strong className="text-amber-300">{selectedModel}</strong>
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-1 border-t border-slate-800">
              <button 
                onClick={() => setActiveModal(null)}
                className="bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs px-5 py-1.5 rounded transition shadow"
              >
                Salvar Modelo
              </button>
            </div>
          </div>
        </div>
      )}

</>);
}
