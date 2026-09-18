import React from 'react';
import { useContratos } from './hooks/useContratos';
import { SignaturePad } from './components/SignaturePad';
import { ContratoPrintLayout } from './components/ContratoPrintLayout';
import { Plus, Trash2, ArrowRight, ArrowLeft, Save, FileSignature, Link as LinkIcon, Sparkles, Bot, FileText, X, FilePlus, Printer, RotateCcw, PlusCircle, RefreshCw } from 'lucide-react';

const PLAN_OPTIONS = [
  { id: 'essence', label: 'Essence' },
  { id: 'premium', label: 'Premium' },
  { id: 'legacy', label: 'Legacy' },
  { id: 'online', label: 'Consultoria Online' },
];

export default function ContratosPage({ activeModel }) {
  const ctx = useContratos(activeModel);
  const { activeTab, setActiveTab } = ctx;

  return (
    <>
    <div className="animate-fadeIn max-w-7xl mx-auto print:hidden">
      {/* STEPPER PROGRESS BAR */}
      <div className="flex items-center justify-center max-w-4xl mx-auto my-6 print:hidden">
        <div onClick={() => setActiveTab('input')} className="flex items-center space-x-2.5 cursor-pointer group">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
            activeTab === 'input'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 ring-4 ring-emerald-50'
              : 'bg-emerald-600 text-white shadow-xs'
          }`}>1</div>
          <span className={`text-[10px] sm:text-xs uppercase tracking-wider font-extrabold transition-colors ${activeTab === 'input' ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>1. Dados Base</span>
        </div>
        <div className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-colors ${activeTab !== 'input' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
        <div onClick={() => setActiveTab('template')} className="flex items-center space-x-2.5 cursor-pointer group">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
            activeTab === 'template'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 ring-4 ring-emerald-50'
              : activeTab === 'signature' || activeTab === 'result'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-400 border border-slate-200'
          }`}>2</div>
          <span className={`text-[10px] sm:text-xs uppercase tracking-wider font-extrabold transition-colors ${activeTab === 'template' ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>2. Cláusulas</span>
        </div>
        <div className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-colors ${activeTab === 'signature' || activeTab === 'result' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
        <div onClick={() => setActiveTab('signature')} className="flex items-center space-x-2.5 cursor-pointer group">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
            activeTab === 'signature'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 ring-4 ring-emerald-50'
              : activeTab === 'result'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-400 border border-slate-200'
          }`}>3</div>
          <span className={`text-[10px] sm:text-xs uppercase tracking-wider font-extrabold transition-colors ${activeTab === 'signature' ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>3. Assinatura</span>
        </div>
        <div className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-colors ${activeTab === 'result' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
        <div onClick={() => setActiveTab('result')} className="flex items-center space-x-2.5 cursor-pointer group">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
            activeTab === 'result'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 ring-4 ring-emerald-50'
              : 'bg-white text-slate-400 border border-slate-200'
          }`}>4</div>
          <span className={`text-[10px] sm:text-xs uppercase tracking-wider font-extrabold transition-colors ${activeTab === 'result' ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>4. Contrato Final</span>
        </div>
      </div>

      {activeTab === 'input' && (
        <div className="text-center space-y-2 mb-6 print:hidden">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Emissão de Contratos</h2>
          <p className="text-slate-600 text-xs md:text-sm">Gere contratos e termos de adesão padronizados.</p>
        </div>
      )}

      {/* ABA 1: DADOS BASE */}
      {activeTab === 'input' && (
        <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xs max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1.5 ml-1">Paciente</label>
              <input type="text" value={ctx.patientData.name} onChange={(e) => ctx.setPatientData({name: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl text-sm text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium" />
            </div>
            
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1.5 ml-1">Plano Escolhido</label>
              <select value={ctx.selectedPlan} onChange={(e) => ctx.setSelectedPlan(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl text-sm text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium">
                {PLAN_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1.5 ml-1">Valor Total (R$)</label>
              <input type="text" placeholder="Ex: 1.500,00" value={ctx.valor} onChange={(e) => ctx.handleSetValor(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl text-sm text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium" />
            </div>
            
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1.5 ml-1">Forma de Pagamento</label>
              <input type="text" placeholder="Ex: À vista via Pix ou Cartão" value={ctx.formaPagamento} onChange={(e) => ctx.setFormaPagamento(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl text-sm text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium" />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <label className="block text-xs font-extrabold uppercase text-slate-500 ml-1">Previsão de Consultas</label>
                <p className="text-[10px] text-slate-400 ml-1">Opcional. Adicione as datas previstas de retorno.</p>
              </div>
              <button type="button" onClick={() => ctx.setConsultas([...ctx.consultas, { data: '', horario: '' }])} className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold px-3 py-1.5 rounded-lg flex items-center transition-colors">
                <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Consulta
              </button>
            </div>
            <div className="space-y-3">
              {ctx.consultas.map((c, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <span className="text-xs font-bold text-slate-400 w-20">Consulta {index+1}:</span>
                  <input type="date" value={c.data} onChange={(e) => { const nc = [...ctx.consultas]; nc[index].data = e.target.value; ctx.setConsultas(nc); }} className="flex-1 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium" />
                  <input type="time" value={c.horario} onChange={(e) => { const nc = [...ctx.consultas]; nc[index].horario = e.target.value; ctx.setConsultas(nc); }} className="w-32 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium" />
                  <button type="button" onClick={() => { const nc = [...ctx.consultas]; nc.splice(index, 1); ctx.setConsultas(nc); }} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button 
              onClick={() => setActiveTab('template')} 
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-full shadow-sm hover:shadow transition-all flex items-center space-x-2 active:scale-95 cursor-pointer"
            >
              <span>Avançar para Modelos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ABA 2: MODELOS */}
      <div className={activeTab === 'template' ? "animate-fadeIn space-y-6 block" : "hidden"}>
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-end max-w-5xl mx-auto">
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase ml-1">Meus Modelos</label>
              <select value={ctx.selectedTemplateId} onChange={e => ctx.loadTemplate(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white font-medium outline-none shadow-2xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800">
                <option value="">-- Novo / Em branco --</option>
                {ctx.savedTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase ml-1">Nome do Modelo</label>
              <input type="text" value={ctx.templateNameInput} onChange={e => ctx.setTemplateNameInput(e.target.value)} placeholder="Ex: Contrato Padrão Premium" className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-medium outline-none shadow-2xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-slate-800" />
            </div>
            <div className="flex gap-2">
              <button onClick={ctx.saveTemplate} className="bg-emerald-600 text-white px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-xs hover:bg-emerald-500 transition-all active:scale-95"><Save size={15}/> Salvar</button>
            </div>
          </div>

          <div className="flex flex-col h-[600px] max-w-5xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            {/* NOVO ASSISTENTE DE IA PARA CLÁUSULAS */}
            <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center text-slate-800 font-extrabold text-[11px] uppercase tracking-wider">
                  <Bot className="w-4 h-4 mr-1.5 text-emerald-600" /> Assistente Jurídico (IA)
                </label>

                {/* Seletores de Modo: Adicionar vs Atualizar */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => ctx.setAiMode('append')}
                    className={`text-[11px] sm:text-xs px-3 py-1 rounded-full font-bold transition-all flex items-center border active:scale-95 whitespace-nowrap cursor-pointer ${
                      ctx.aiMode === 'append'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
                    }`}
                    title="Cria uma nova cláusula e adiciona ao final da página sem mexer no texto existente"
                  >
                    <PlusCircle className={`w-3.5 h-3.5 mr-1.5 flex-shrink-0 ${ctx.aiMode === 'append' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>Adicionar ao final</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => ctx.setAiMode('replace')}
                    className={`text-[11px] sm:text-xs px-3 py-1 rounded-full font-bold transition-all flex items-center border active:scale-95 whitespace-nowrap cursor-pointer ${
                      ctx.aiMode === 'replace'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
                    }`}
                    title="A IA lê o conteúdo da página, preserva as cláusulas não mencionadas e atualiza o que você pedir"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 flex-shrink-0 ${ctx.aiMode === 'replace' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>Atualizar / Reescrever</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-2.5 items-center">
                <textarea 
                  value={ctx.aiPrompt} 
                  onChange={e => ctx.setAiPrompt(e.target.value)}
                  placeholder={
                    ctx.aiMode === 'append'
                      ? "Ex: Crie uma cláusula informando que faltas sem aviso prévio de 24h serão cobradas integralmente..."
                      : "Ex: Atualize a cláusula de tolerância para 15 minutos e mantenha todas as demais cláusulas..."
                  }
                  className="flex-1 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm p-2.5 focus:outline-none focus:border-emerald-500 resize-none shadow-2xs h-12 font-medium text-slate-700"
                ></textarea>
                
                <div className="flex flex-col sm:flex-row gap-1.5 shrink-0">
                  {ctx.lastAiBackup !== null && (
                    <button
                      type="button"
                      onClick={ctx.handleUndoAi}
                      title="Desfazer a última alteração feita pela IA"
                      className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center transition-all cursor-pointer active:scale-95"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      <span>Desfazer IA</span>
                    </button>
                  )}

                  <button 
                    onClick={ctx.handleGenerateAI}
                    disabled={ctx.isGeneratingAi}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 sm:py-2.5 rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center justify-center whitespace-nowrap active:scale-95 cursor-pointer"
                  >
                    {ctx.isGeneratingAi ? (
                      <span className="flex items-center"><Sparkles className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Processando...</span>
                    ) : (
                      <span className="flex items-center">
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                        {ctx.aiMode === 'append' ? 'Adicionar Cláusula' : 'Atualizar com IA'}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* BARRA DE ABAS DE PÁGINAS */}
            <div className="flex items-center gap-1 px-4 pt-3 pb-0 bg-slate-50 border-b border-slate-200 shrink-0 overflow-x-auto">
              {ctx.pages.map((page, index) => (
                <div
                  key={page.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-[11px] font-bold cursor-pointer transition-all border border-b-0 shrink-0 ${
                    index === ctx.activePageIndex
                      ? 'bg-white border-slate-200 text-emerald-700 shadow-sm'
                      : 'bg-slate-100 border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-200'
                  }`}
                  onClick={() => ctx.switchPage(index)}
                >
                  <FileText className="w-3 h-3" />
                  <span>{page.label}</span>
                  {ctx.pages.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); ctx.removePage(index); }}
                      className="ml-1 text-slate-300 hover:text-red-500 transition-colors rounded"
                      title="Remover página"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={ctx.addPage}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-t-lg text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 transition-colors shrink-0 border border-transparent"
                title="Adicionar nova página"
              >
                <FilePlus className="w-3.5 h-3.5" />
                <span>Nova página</span>
              </button>
            </div>

            {/* EDITOR DE CLÁUSULAS */}
            <div 
              ref={ctx.editorRef} 
              contentEditable 
              onInput={ctx.syncEditorToTemplate} 
              onBlur={ctx.syncEditorToTemplate} 
              className="w-full flex-1 p-8 outline-none font-sans text-[13px] leading-relaxed overflow-y-auto bg-white text-slate-800 focus:bg-slate-50/30 whitespace-pre-wrap" 
              placeholder="Cole ou digite o texto das cláusulas aqui..." 
            />

            {/* CONTADOR DE CARACTERES */}
            <div className="px-4 pt-2 pb-1 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
              <span className="text-[10px] text-slate-300 font-medium">
                {ctx.pages.length > 1 ? `Página ${ctx.activePageIndex + 1} de ${ctx.pages.length}` : ''}
              </span>
              <span className={`text-[10px] font-bold ${
                ctx.editorCharCount > 1800 ? 'text-red-600' : ctx.editorCharCount > 1440 ? 'text-amber-500' : 'text-slate-400'
              }`}>
                {ctx.editorCharCount} / 1800 caracteres{ctx.editorCharCount > 1800 ? ' — excedido, considere criar nova página' : ''}
              </span>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <button 
                onClick={() => setActiveTab('input')} 
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center shadow-2xs active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Voltar aos Dados
              </button>
              <button 
                onClick={() => setActiveTab('signature')} 
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-full shadow-sm hover:shadow transition-all flex items-center space-x-2 active:scale-95 cursor-pointer"
              >
                <span>Ir para Assinatura</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>


      {/* ABA 3: COLETA DE ASSINATURA */}
      {activeTab === 'signature' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-1 mb-6">
            <h3 className="font-black text-slate-800 text-xl">Coleta de Assinatura</h3>
            <p className="text-slate-500 text-xs">Colete a assinatura do paciente presencialmente ou gere um link remoto.</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <FileSignature className="text-emerald-600 w-5 h-5" />
              <h4 className="font-bold text-slate-800 text-sm">Assinatura Digital</h4>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-500">Peça ao paciente para assinar abaixo utilizando o dedo ou o mouse, ou envie um link.</p>
              <SignaturePad 
                onSave={(base64) => ctx.setAssinaturaBase64(base64)} 
              />
              
              {ctx.assinaturaBase64 && (
                <div className="bg-emerald-50 text-emerald-700 text-[10px] p-2 text-center rounded border border-emerald-100 animate-fadeIn">
                  Assinatura digital capturada (pronta para impressão).
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex justify-center">
                <button type="button" onClick={ctx.handleGerarLink} disabled={ctx.isGenerating} className="bg-[#25D366] text-white shadow-sm hover:bg-[#20b858] text-xs px-4 py-2 rounded-full font-bold flex items-center transition-colors disabled:opacity-50">
                  <LinkIcon className="w-3.5 h-3.5 mr-1.5" /> {ctx.isGenerating ? 'Gerando...' : 'Gerar Link WhatsApp'}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button 
              onClick={() => setActiveTab('template')} 
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center shadow-2xs active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Voltar às Cláusulas
            </button>
            <button 
              onClick={() => setActiveTab('result')} 
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-full shadow-sm hover:shadow transition-all flex items-center space-x-2 active:scale-95 cursor-pointer"
            >
              <span>Gerar Contrato Final</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ABA 4: PRÉVIA E IMPRESSÃO */}
      {activeTab === 'result' && (
        <div className="animate-fadeIn max-w-4xl mx-auto space-y-6">
          {/* Top Toolbar (Hidden on Print) - CLEAN LUXURY SAAS STYLE */}
          <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap justify-between items-center gap-4 print:hidden max-w-4xl mx-auto mb-6">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setActiveTab('signature')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center shadow-2xs active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Editar Contrato
              </button>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Contrato estruturado e pronto para envio ao paciente ou impressão em PDF.
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={ctx.handleGerarPDF}
                disabled={ctx.isGenerating}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-full shadow-sm hover:shadow transition-all flex items-center space-x-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                <span>{ctx.isGenerating ? 'Gerando...' : 'Imprimir / Salvar em PDF'}</span>
              </button>
            </div>
          </div>

          <div className="print:hidden w-full">
            <ContratoPrintLayout 
              paciente={ctx.patientData}
              plano={ctx.selectedPlan}
              valor={ctx.valor}
              formaPagamento={ctx.formaPagamento}
              consultas={ctx.consultas}
              assinaturaBase64={ctx.assinaturaBase64}
              pages={ctx.getAllPagesHTML()}
              preview={true}
            />
          </div>
        </div>
      )}

    </div>{/* fim print:hidden */}

    {/* Componente de impressão — invisível na tela, visível apenas no print */}
    <div className="hidden print:block">
      <ContratoPrintLayout 
        paciente={ctx.patientData}
        plano={ctx.selectedPlan}
        valor={ctx.valor}
        formaPagamento={ctx.formaPagamento}
        consultas={ctx.consultas}
        assinaturaBase64={ctx.assinaturaBase64}
        pages={ctx.getAllPagesHTML()}
      />
    </div>
    </>
  );
}
