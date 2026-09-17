import React from 'react';
import { useContratos } from './hooks/useContratos';
import { SignaturePad } from './components/SignaturePad';
import { ContratoPrintLayout } from './components/ContratoPrintLayout';
import { Plus, Trash2, CheckCircle, List, ArrowRight, ArrowLeft, Save, FileSignature, Link as LinkIcon, Download, Sparkles, Bot, FileText, ChevronRight, PenTool, Hash, Edit3, X, FilePlus } from 'lucide-react';

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
    <div className="animate-fadeIn max-w-7xl mx-auto py-6 print:hidden">
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
            <button onClick={() => setActiveTab('template')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-full font-bold text-xs tracking-wider flex items-center gap-2 shadow-sm transition-all active:scale-95">
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
            <div className="bg-emerald-50 border-b border-emerald-100 p-4 shrink-0">
              <label className="flex items-center text-emerald-800 font-extrabold text-[11px] uppercase tracking-wider mb-2">
                <Bot className="w-4 h-4 mr-1.5" /> Assistente Jurídico (IA)
              </label>
              <div className="flex gap-3">
                <textarea 
                  value={ctx.aiPrompt} 
                  onChange={e => ctx.setAiPrompt(e.target.value)}
                  placeholder="Ex: Crie uma cláusula informando que faltas sem aviso prévio de 24h serão cobradas integralmente..."
                  className="flex-1 bg-white border border-emerald-200 rounded-xl text-sm p-3 focus:outline-none focus:border-emerald-500 resize-none shadow-sm h-14 font-medium text-slate-700"
                ></textarea>
                <button 
                  onClick={ctx.handleGenerateAI}
                  disabled={ctx.isGeneratingAi}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center whitespace-nowrap active:scale-95"
                >
                  {ctx.isGeneratingAi ? (
                    <span className="flex items-center"><Sparkles className="w-4 h-4 mr-1.5 animate-spin" /> Gerando...</span>
                  ) : (
                    <span className="flex items-center"><Sparkles className="w-4 h-4 mr-1.5" /> Gerar Cláusulas</span>
                  )}
                </button>
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

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setActiveTab('signature')} className="px-8 py-3 rounded-full font-bold text-xs text-white bg-emerald-600 flex items-center justify-center gap-2 hover:bg-emerald-500 shadow-sm transition-all active:scale-95">
                Ir para Assinatura <ArrowRight size={14}/>
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

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button onClick={() => setActiveTab('result')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-full font-bold text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95">
              <span>Gerar Contrato Final</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ABA 4: PRÉVIA E IMPRESSÃO */}
      {activeTab === 'result' && (
        <div className="animate-fadeIn max-w-[210mm] mx-auto space-y-6">
          <div className="flex justify-between items-center mb-6 print:hidden">
            <button onClick={() => setActiveTab('signature')} className="bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 px-6 py-2.5 rounded-full font-bold text-xs flex items-center shadow-sm transition-all active:scale-95">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Editar Contrato
            </button>
            <button onClick={ctx.handleGerarPDF} disabled={ctx.isGenerating} className="bg-emerald-600 text-white hover:bg-emerald-500 px-8 py-2.5 rounded-full font-bold text-xs flex items-center shadow-sm transition-all active:scale-95 disabled:opacity-50">
              <Download className="w-4 h-4 mr-2" /> {ctx.isGenerating ? 'Gerando...' : 'Imprimir / Salvar PDF'}
            </button>
          </div>

          <div className="print:hidden">
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
