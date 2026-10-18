import { useEffect, useState } from 'react';
import { User, Stethoscope, ArrowRight, ArrowLeft, Check, CheckCircle, ChevronDown, Copy, Download, RefreshCw, List, Bot, Sparkles, Save, MessageCircle, Upload, FileText, LayoutTemplate, Tag, Trash2 } from 'lucide-react';
import { useAnamnese } from './hooks/useAnamnese.js';
import { cleanMarkdownToHTML } from './domain/formatting.js';
import Toast from '../../shared/ui/Toast.jsx';
import PatientContextBar from '../pacientes/components/PatientContextBar.jsx';
import ReportRichTextEditor from './components/ReportRichTextEditor.jsx';
import AnamneseRichTextToolbar from './components/AnamneseRichTextToolbar.jsx';

export default function AnamnesePage({ activeModel }) {
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const {
    hasActivePatient,
    patientData, setPatientData,
    doctorData, setDoctorData,
    template,
    savedTemplates,
    selectedTemplateId,
    templateNameInput, setTemplateNameInput,
    result, setResult,
    patientTranslation,
    clinicInsights,
    activeResultView, setActiveResultView,
    detectedVars,
    activeTab, setActiveTab,
    notification,
    isGenerating,
    isSavingReport,
    isExtraLoading,
    isDeletingTemplate,
    editorRef,
    editorCharCount,
    generateReport,
    saveEditedReport,
    handleExtraAnalysis,
    copyToClipboard,
    cleanMarkdownToText,
    loadDemoData,
    saveTemplate,
    loadTemplate,
    deleteTemplate,
    handleEditorCommand,
    handleInsertBullet,
    handleInsertVariableBadge,
    syncEditorToTemplate,
    handleFileUpload,
  } = useAnamnese({ activeModel });

  const renderFormattedText = (text) => {
    if (!text) return null;
    return <div dangerouslySetInnerHTML={{ __html: cleanMarkdownToHTML(text) }} />;
  };

  useEffect(() => {
    if (!isTemplateMenuOpen) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('.anamnese-template-dropdown')) {
        setIsTemplateMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsTemplateMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTemplateMenuOpen]);

  return (
    <div className="animate-fadeIn mx-auto w-full min-w-0 max-w-7xl">
      <PatientContextBar action="A anamnese" recordType="anamnese" />
      {/* STEPPER PROGRESS BAR */}
      <div className="mx-auto my-6 flex w-full min-w-0 max-w-2xl items-center justify-center print:hidden">
        <div onClick={() => setActiveTab('input')} className={`flex shrink-0 items-center space-x-2.5 cursor-pointer group ${activeTab === 'input' ? '[&>span]:inline' : '[&>span]:hidden sm:[&>span]:inline'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
            activeTab === 'input'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 ring-4 ring-emerald-50'
              : activeTab === 'template' || activeTab === 'result'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-400 border border-slate-200'
          }`}>1</div>
          <span className={`text-xs uppercase tracking-wider font-extrabold transition-colors ${activeTab === 'input' ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>1. Coleta de Dados</span>
        </div>
        <div className={`mx-2 h-0.5 min-w-2 flex-1 transition-colors sm:mx-4 ${activeTab === 'template' || activeTab === 'result' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
        <div onClick={() => setActiveTab('template')} className={`flex shrink-0 items-center space-x-2.5 cursor-pointer group ${activeTab === 'template' ? '[&>span]:inline' : '[&>span]:hidden sm:[&>span]:inline'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
            activeTab === 'template'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 ring-4 ring-emerald-50'
              : activeTab === 'result'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-400 border border-slate-200'
          }`}>2</div>
          <span className={`text-xs uppercase tracking-wider font-extrabold transition-colors ${activeTab === 'template' ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>2. Estrutura Modelo</span>
        </div>
        <div className={`mx-2 h-0.5 min-w-2 flex-1 transition-colors sm:mx-4 ${activeTab === 'result' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
        <div onClick={() => result && setActiveTab('result')} className={`flex shrink-0 items-center space-x-2.5 ${activeTab === 'result' ? '[&>span]:inline' : '[&>span]:hidden sm:[&>span]:inline'} ${result ? 'cursor-pointer group' : 'cursor-not-allowed opacity-60'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
            activeTab === 'result'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 ring-4 ring-emerald-50'
              : 'bg-white text-slate-400 border border-slate-200'
          }`}>3</div>
          <span className={`text-xs uppercase tracking-wider font-extrabold transition-colors ${activeTab === 'result' ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>3. Relatório IA</span>
        </div>
      </div>

      {/* ABA 1: COLETA DE DADOS */}
      {activeTab === 'input' && (
        <div className="grid md:grid-cols-2 gap-6 animate-fadeIn max-w-5xl mx-auto">
          <div className="md:col-span-2 text-center space-y-2 pt-2 pb-4">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Análise Integrada de Prontuário</h2>
            <p className="text-slate-600 text-xs md:text-sm leading-relaxed max-w-2xl mx-auto font-normal">
              Colete os dados do questionário prévio e notas da consulta, escolha um modelo de documento e deixe a IA preencher a estrutura automaticamente.
            </p>
          </div>

          {[
            { title: 'Questionário do Paciente', icon: <User size={18} className="text-emerald-600"/>, val: patientData, set: setPatientData, ph: 'Introduza aqui o questionário respondido pelo paciente ou carregue um PDF...' },
            { title: 'Notas da Consulta', icon: <Stethoscope size={18} className="text-teal-600"/>, val: doctorData, set: setDoctorData, ph: 'Notas da consulta, avaliação qualitativa, queixas...' }
          ].map((field, idx) => (
            <div key={idx} className="bg-white rounded-3xl shadow-xs border border-slate-200 p-6 flex flex-col h-[400px]">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  {field.icon}
                  <h2 className="text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">{field.title}</h2>
                </div>
                <label className="cursor-pointer text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-full border border-slate-200 transition-all shadow-2xs flex items-center active:scale-95">
                  <Upload size={13} className="mr-1.5 text-slate-500" /> PDF / TXT
                  <input type="file" accept=".txt,.pdf" className="hidden" onChange={e => {
                    const file = e.target.files[0];
                    if (file) handleFileUpload(file, field.set);
                  }} />
                </label>
              </div>
              <textarea
                className="flex-1 w-full p-4 border border-slate-200 rounded-2xl bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none font-sans text-sm leading-relaxed transition-all shadow-2xs text-slate-800"
                placeholder={field.ph}
                value={field.val}
                onChange={e => field.set(e.target.value)}
              />
            </div>
          ))}

          <div className="md:col-span-2 bg-white backdrop-blur-md p-5 md:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 max-w-5xl mx-auto w-full mt-2">
            <div className="text-left space-y-1">
              <h4 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
                <Sparkles className="size-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                Assistente de Anamnese com IA
              </h4>
              <p className="text-xs text-slate-500 max-w-md">
                Insira ou carregue os dados do paciente e as notas da consulta. Depois, defina a estrutura modelo para a IA preencher.
              </p>
            </div>
            <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
              <button type="button" onClick={loadDemoData} className="px-4 py-2.5 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all flex items-center space-x-1.5 hover:bg-slate-100/80 rounded-full">
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Carregar Dados Demo</span>
              </button>
              <button type="button" onClick={() => setActiveTab('template')} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-full shadow-sm hover:shadow transition-all flex items-center space-x-2 active:scale-95">
                <span>Definir Estrutura</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: ESTRUTURA MODELO */}
      {activeTab === 'template' && (
        <div className="animate-fadeIn space-y-6">
          <div className="relative z-30 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full relative z-30 anamnese-template-dropdown">
              <label className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900 mb-1.5 ml-1">
                <LayoutTemplate className="size-3.5 text-emerald-600" aria-hidden="true" />
                <span>Meus Modelos</span>
              </label>

              <button
                type="button"
                onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
                className={`w-full min-h-11 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all cursor-pointer flex items-center justify-between shadow-2xs active:scale-[0.99] ${
                  isTemplateMenuOpen
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-white text-slate-900'
                    : selectedTemplateId
                    ? 'border-slate-300 bg-white text-slate-800'
                    : 'border-slate-300 bg-white text-slate-600'
                }`}
                aria-expanded={isTemplateMenuOpen}
                aria-haspopup="true"
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="text-base">{selectedTemplateId ? '📑' : '📄'}</span>
                  <span className="truncate font-semibold text-slate-800">
                    {savedTemplates.find(t => t.id === selectedTemplateId)?.name || '-- Novo / Em branco --'}
                  </span>
                </span>
                <ChevronDown className={`w-4 h-4 ml-2 opacity-70 shrink-0 transition-transform duration-200 ${isTemplateMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isTemplateMenuOpen && (
                <div
                  className="absolute left-0 right-0 top-full mt-2 max-h-64 overflow-y-auto app-solid-dropdown !bg-white bg-[#ffffff] rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-scale-up space-y-1"
                  style={{ backgroundColor: '#ffffff', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
                >
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Selecionar modelo de anamnese
                  </div>

                  <button
                    type="button"
                    onClick={() => { loadTemplate(''); setIsTemplateMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      !selectedTemplateId
                        ? 'bg-emerald-50 text-emerald-900 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <span className="flex items-center truncate">
                      <span className="mr-2 text-sm">📄</span>
                      <span className="truncate">-- Novo / Em branco --</span>
                    </span>
                    {!selectedTemplateId && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />}
                  </button>

                  {savedTemplates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => { loadTemplate(t.id); setIsTemplateMenuOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        selectedTemplateId === t.id
                          ? 'bg-emerald-50 text-emerald-900 font-bold'
                          : 'text-slate-700 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <span className="flex items-center truncate">
                        <span className="mr-2 text-sm">📑</span>
                        <span className="truncate">{t.name}</span>
                      </span>
                      {selectedTemplateId === t.id && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 w-full">
              <label className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900 mb-1.5 ml-1">
                <Tag className="size-3.5 text-emerald-600" aria-hidden="true" />
                <span>Nome do Modelo</span>
              </label>
              <input type="text" value={templateNameInput} onChange={e => setTemplateNameInput(e.target.value)} placeholder="Ex: Anamnese Esportiva" className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-medium outline-none shadow-2xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-slate-800" />
            </div>
            <div className="flex gap-2">
              <button onClick={saveTemplate} className="bg-emerald-600 text-white px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-xs hover:bg-emerald-500 transition-all active:scale-95"><Save size={15}/> Salvar</button>
              <button type="button" onClick={deleteTemplate} disabled={!selectedTemplateId || isDeletingTemplate} aria-label="Excluir modelo de anamnese selecionado" className="bg-rose-50 text-rose-700 px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 border border-rose-200 hover:bg-rose-100 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={15} aria-hidden="true"/> {isDeletingTemplate ? 'Excluindo...' : 'Excluir'}</button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 h-[550px] relative z-10">
            <div className="md:col-span-2 h-full flex flex-col bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              {/* BARRA DE FERRAMENTAS DE FORMATAÇÃO (NEGRITO, ITÁLICO, TÍTULOS, BULLETS, ALINHAMENTOS) */}
              <AnamneseRichTextToolbar
                editorRef={editorRef}
                onContentChange={syncEditorToTemplate}
              />

              {/* EDITOR DA ESTRUTURA MODELO */}
              <div
                ref={editorRef}
                contentEditable
                onInput={syncEditorToTemplate}
                onBlur={syncEditorToTemplate}
                className="w-full flex-1 p-8 outline-none font-sans text-[13px] leading-relaxed overflow-y-auto bg-white text-slate-800 focus:bg-slate-50/20 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-600 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-slate-900 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-extrabold [&_h3]:text-slate-900 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_li]:mb-1 [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic [&_u]:underline"
                placeholder="Monte a estrutura modelo da sua anamnese com os campos dinâmicos {{ VAR }}..."
              />

              {/* CONTADOR DE CARACTERES */}
              <div className="px-4 pt-2 pb-1 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                <span className="text-[10px] text-slate-400 font-medium">
                  {detectedVars.length > 0
                    ? `${detectedVars.length} ${detectedVars.length === 1 ? 'campo dinâmico detectado' : 'campos dinâmicos detectados'}`
                    : 'Nenhum campo dinâmico inserido'}
                </span>
                <span className={`text-[10px] font-bold ${
                  editorCharCount > 3000 ? 'text-red-600' : editorCharCount > 2400 ? 'text-amber-500' : 'text-slate-400'
                }`}>
                  {editorCharCount} caracteres
                </span>
              </div>

              {/* BOTÕES DE NAVEGAÇÃO INFERIOR */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('input')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center shadow-2xs active:scale-95 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Voltar aos Dados
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('result')}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-full shadow-sm hover:shadow transition-all flex items-center space-x-2 active:scale-95 cursor-pointer"
                >
                  <span>Ir para Geração IA</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col h-full overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/80">
                <h3 className="flex items-center justify-center gap-1.5 font-extrabold text-[10px] text-slate-900 uppercase text-center tracking-[0.06em]">
                  <List className="size-3.5 text-emerald-600" aria-hidden="true" />
                  Variáveis Detectadas
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {detectedVars.map((v, i) => (
                  <div key={i} className="text-xs bg-emerald-50 p-2.5 rounded-xl border border-emerald-200/60 font-mono text-emerald-800 font-bold flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-600 flex-shrink-0" />
                    <span className="truncate">{v}</span>
                  </div>
                ))}
                {detectedVars.length === 0 && (
                  <div className="text-center py-10 opacity-50">
                    <List className="mx-auto mb-2 text-slate-400" size={24}/>
                    <p className="text-xs font-medium text-slate-500">Insira tags como<br/><span className="text-emerald-600 font-mono">{"{{"}VAR{"}}"}</span><br/>no texto ao lado</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: RELATÓRIO IA */}
      {activeTab === 'result' && (
        <div className="animate-fadeIn pb-12">
          {isGenerating ? (
            <div className="h-[400px] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-xs animate-pulse max-w-4xl mx-auto">
              <div className="relative mb-6">
                <Bot size={60} className="text-emerald-500 animate-bounce" />
                <Sparkles size={24} className="text-teal-400 absolute -top-2 -right-2 animate-ping" />
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">Processando Documento...</h3>
            </div>
          ) : !result ? (
            <div className="h-[400px] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 text-center p-8 shadow-xs max-w-3xl mx-auto">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 text-emerald-600">
                <Bot size={32} />
              </div>
              <h2 className="text-xl font-black mb-2 text-slate-900">Preencher Estrutura com IA</h2>
              <p className="text-xs text-slate-500 mb-6 max-w-md">O motor de inteligência artificial analisará os dados do questionário e as notas para gerar o prontuário completo.</p>
              <button type="button" onClick={generateReport} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow active:scale-95">
                {hasActivePatient ? <Save className="size-4" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
                <span>{hasActivePatient ? 'Gerar e salvar no prontuário' : 'Gerar relatório de anamnese'}</span>
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-4 gap-6">
              <div className="md:col-span-3 space-y-6">
                <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
                  <div className="bg-white p-4 flex flex-wrap justify-between items-center border-b border-slate-200/80 gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button type="button" onClick={() => setActiveResultView('main')} aria-pressed={activeResultView === 'main'} className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900 transition-colors hover:text-emerald-800 focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"><FileText className="size-[18px] text-emerald-600" aria-hidden="true" /> Documento Finalizado</button>
                      {patientTranslation && (
                        <button onClick={() => setActiveResultView('patient')} className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border ${activeResultView === 'patient' ? 'bg-teal-600 text-white border-teal-600 shadow-xs' : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200'}`}><MessageCircle size={14} /> Tradução p/ Paciente</button>
                      )}
                      {clinicInsights && (
                        <button onClick={() => setActiveResultView('clinic')} className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border ${activeResultView === 'clinic' ? 'bg-amber-600 text-white border-amber-600 shadow-xs' : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200'}`}><Sparkles size={14} /> Insights de Retorno</button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { const t = activeResultView === 'main' ? result : activeResultView === 'patient' ? patientTranslation : clinicInsights; copyToClipboard(t); }} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95" title="Copiar relatório limpo sem asteriscos">
                        <Copy size={14}/> Copiar Relatório
                      </button>
                      {hasActivePatient ? (
                        <button type="button" onClick={saveEditedReport} disabled={isSavingReport} className="inline-flex size-8 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-2xs transition-all hover:bg-emerald-100 hover:text-emerald-900 active:scale-95 disabled:cursor-wait disabled:opacity-50" aria-label="Salvar texto editado no prontuário" title="Salvar texto editado no prontuário">
                          <Save className="size-[15px]" aria-hidden="true" />
                        </button>
                      ) : null}
                      <button onClick={() => {
                        const raw = activeResultView === 'main' ? result : activeResultView === 'patient' ? patientTranslation : clinicInsights;
                        const clean = cleanMarkdownToText(raw);
                        const name = activeResultView === 'main' ? 'Anamnese_Gerada.txt' : activeResultView === 'patient' ? 'Traducao_Paciente.txt' : 'Insights_Retorno.txt';
                        const el = document.createElement('a');
                        el.href = URL.createObjectURL(new Blob([clean], { type: 'text/plain;charset=utf-8' }));
                        el.download = name;
                        el.click();
                      }} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-all border border-slate-200 bg-white shadow-2xs active:scale-95" title="Baixar arquivo limpo (.txt)">
                        <Download size={15}/>
                      </button>
                    </div>
                  </div>
                  <div id="final-anamnese-report" className="min-h-[400px] bg-white">
                    {activeResultView === 'main' && <ReportRichTextEditor value={result} onChange={setResult} />}
                    {activeResultView === 'patient' && (
                      <div className="space-y-4 p-8 font-sans text-sm leading-relaxed text-slate-800">
                        <div className="p-3 bg-teal-50 border border-teal-200 text-teal-800 rounded-2xl text-xs font-semibold flex items-center gap-2"><MessageCircle size={16} /> Tradução simples e acolhedora pronta para o paciente:</div>
                        <div>{renderFormattedText(patientTranslation)}</div>
                      </div>
                    )}
                    {activeResultView === 'clinic' && (
                      <div className="space-y-4 p-8 font-sans text-sm leading-relaxed text-slate-800">
                        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs font-semibold flex items-center gap-2"><Sparkles size={16} /> Parecer e perguntas recomendadas para a consulta de retorno:</div>
                        <div>{renderFormattedText(clinicInsights)}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs sticky top-6">
                  <h4 className="text-[10px] font-extrabold uppercase text-slate-400 mb-4 text-center tracking-wider">Opções de IA</h4>
                  <button type="button" onClick={generateReport} disabled={isGenerating} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-200 active:scale-95 disabled:cursor-wait disabled:opacity-50"><RefreshCw className={`size-3.5 ${isGenerating ? 'animate-spin' : ''}`} aria-hidden="true" /> {isGenerating ? 'Gerando…' : 'Refazer Relatório'}</button>
                  <div className="mt-4 space-y-2">
                    <button onClick={() => handleExtraAnalysis('patient')} disabled={isExtraLoading} className={`w-full py-2.5 text-xs font-bold rounded-full flex items-center justify-center transition-all border active:scale-95 shadow-2xs ${patientTranslation ? 'bg-teal-100 text-teal-800 border-teal-300 hover:bg-teal-200' : 'bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-700'}`}>
                      {isExtraLoading ? 'Gerando...' : patientTranslation ? '✓ Refazer Tradução' : 'Traduzir p/ Paciente'}
                    </button>
                    <button onClick={() => handleExtraAnalysis('clinic')} disabled={isExtraLoading} className={`w-full py-2.5 text-xs font-bold rounded-full flex items-center justify-center transition-all border active:scale-95 shadow-2xs ${clinicInsights ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200' : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700'}`}>
                      {isExtraLoading ? 'Gerando...' : clinicInsights ? '✓ Refazer Insights' : 'Insights de Retorno'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {notification && <Toast message={notification.msg} type={notification.type} />}
    </div>
  );
}
