import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Stethoscope, 
  ArrowRight, 
  CheckCircle, 
  Copy, 
  Download, 
  RefreshCw,
  AlertCircle,
  List,
  BrainCircuit,
  Sparkles,
  Save,
  Plus,
  MessageCircle,
  HelpCircle,
  X,
  Upload,
  FileText
} from 'lucide-react';

export default function Anamnese({ activeModel }) {
  // Estados de Dados
  const [patientData, setPatientData] = useState('');
  const [doctorData, setDoctorData] = useState('');
  const [template, setTemplate] = useState('');
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templateNameInput, setTemplateNameInput] = useState('');
  const [result, setResult] = useState('');
  const [patientTranslation, setPatientTranslation] = useState('');
  const [clinicInsights, setClinicInsights] = useState('');
  const [activeResultView, setActiveResultView] = useState('main'); // 'main' | 'patient' | 'clinic'
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Interface
  const [activeTab, setActiveTab] = useState('input');
  const [notification, setNotification] = useState(null);
  const [detectedVars, setDetectedVars] = useState([]);
  const [isExtraLoading, setIsExtraLoading] = useState(false);

  // --- FUNÇÕES DE NOTIFICAÇÃO ---
  const showNotification = (msg, type) => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const cleanMarkdownToHTML = (text) => {
    if (!text) return '';
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([\s\S]*?)\*/g, '<em>$1</em>')
      .replace(/\r\n/g, '<br>')
      .replace(/\n/g, '<br>');
    return html;
  };

  const cleanMarkdownToText = (text) => {
    if (!text) return '';
    return text
      .replace(/\*\*([\s\S]*?)\*\*/g, '$1')
      .replace(/\*([\s\S]*?)\*/g, '$1');
  };

  // Renderiza texto formatado visualmente em HTML na Aba de Resultado
  const renderFormattedText = (text) => {
    if (!text) return null;
    return <div dangerouslySetInnerHTML={{ __html: cleanMarkdownToHTML(text) }} />;
  };

  const generateWebDietHTML = (text) => {
    if (!text) return '';
    return text
      .replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([\s\S]*?)\*/g, '<em>$1</em>')
      .replace(/\r\n/g, '\n')
      .replace(/\n/g, '<br>');
  };

  const copyToClipboardAdvanced = async (text, mode = 'clean') => {
    if (!text) return;
    
    const cleanText = cleanMarkdownToText(text);

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(cleanText);
        showNotification("Copiado limpo sem asteriscos! Cole com Ctrl+V no WebDiet.", "success");
        return;
      }
    } catch (e) {
      console.warn("writeText falhou, tentando fallback:", e);
    }

    try {
      const container = document.createElement('textarea');
      container.value = cleanText;
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      document.body.appendChild(container);
      container.select();
      document.execCommand('copy');
      document.body.removeChild(container);
      showNotification("Copiado com sucesso p/ WebDiet!", "success");
    } catch (err) {
      showNotification("Erro ao copiar.", "error");
    }
  };

  const selectReportContent = () => {
    const reportEl = document.getElementById('final-anamnese-report');
    if (!reportEl) return;
    
    const range = document.createRange();
    range.selectNodeContents(reportEl);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    
    showNotification("Relatório selecionado! Pressione Ctrl+C para copiar com formatação nativa.", "info");
  };

  const downloadHTMLReport = (text, fileName) => {
    const htmlContent = cleanMarkdownToHTML(text);
    const fullDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Anamnese Nutricional</title></head><body style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">${htmlContent}</body></html>`;
    const element = document.createElement("a");
    const file = new Blob([fullDoc], {type: 'text/html;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = fileName.replace('.txt', '.html');
    element.click();
  };

  const copyToClipboard = (text) => copyToClipboardAdvanced(text, 'tinymce');

  // --- PERSISTÊNCIA LOCAL ---
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nutrisa_anamnese_templates');
      if (saved) {
        setSavedTemplates(JSON.parse(saved));
      }
      const draft = localStorage.getItem('nutrisa_anamnese_draft');
      if (draft) {
        setTemplate(draft);
      }
    } catch (e) { console.error("Erro ao carregar dados", e); }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('nutrisa_anamnese_draft', template);
    }, 1500);
    return () => clearTimeout(timeoutId);
  }, [template]);

  useEffect(() => {
    localStorage.setItem('nutrisa_anamnese_templates', JSON.stringify(savedTemplates));
  }, [savedTemplates]);

  // --- INTEGRAÇÃO GEMINI ---
  const callGemini = async (prompt, isJson = false) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      showNotification("Chave API não configurada no ambiente (.env).", "error");
      throw new Error("Chave não configurada.");
    }
    let modelToUse = activeModel || localStorage.getItem('nutrisa_selected_model') || import.meta.env.VITE_GEMINI_MODEL || "gemini-2.0-flash";
    if (modelToUse.includes('2.5')) {
      modelToUse = 'gemini-2.0-flash';
    }
    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3
      }
    };
    if (isJson) payload.generationConfig.responseMimeType = "application/json";

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`Erro ${response.status}`);
      }
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error("Erro Gemini:", error);
      throw error;
    }
  };

  // --- LÓGICA DE GERAÇÃO ---
  const generateReport = async () => {
    setIsGenerating(true);
    setPatientTranslation('');
    setClinicInsights('');
    setActiveResultView('main');
    setActiveTab('result'); 
    try {
      let finalReport = template;
      const tags = template.match(/\{\{\s*[\wÀ-ÿ0-9_\-\s]+\s*\}\}/g) || [];
      if (tags.length === 0) {
        setResult(template);
        setIsGenerating(false);
        return;
      }
      const variableNames = [...new Set(tags.map(v => v.replace(/\{\{|\}\}/g, '').trim()))];
      
      const prompt = `Você é um assistente nutricional/médico altamente qualificado especializado em síntese de dados de prontuário e anamnese.
Analise criteriosamente os dois conjuntos de dados abaixo:

[DADOS PREENCHIDOS PELO PACIENTE (QUESTIONÁRIO)]
${patientData || 'Nenhum dado informado pelo paciente.'}

[NOTAS E AVALIAÇÃO DA CONSULTA (NUTRICIONISTA/MÉDICO)]
${doctorData || 'Nenhuma nota médica informada.'}

TAREFA:
Extraia e interprete as seguintes variáveis requeridas no modelo:
${variableNames.map(v => `- "${v}"`).join('\n')}

DIRETRIZES ESTRITAS:
1. Retorne ESTRITAMENTE um objeto JSON válido cujas chaves sejam EXATAMENTE o nome das variáveis listadas acima.
2. Interpole e sintetize as informações das duas fontes. Se as notas da consulta complementarem o questionário do paciente, una-as de forma coesa.
3. Se a variável solicitar síntese ou parecer, faça um resumo clínico profissional focado em nutrição e saúde com boa estruturação.
4. Caso uma variável esteja totalmente ausente em ambas as fontes, preencha o valor como "Não informado".
5. Retorne os valores em texto simples e limpo. JAMAIS inclua asteriscos de negrito (** **) nos valores do JSON.
6. Preserve quebras de linha com \n sempre que listar múltiplos itens, condutas ou recomendações no texto.
7. Responda APENAS em formato JSON sem texto adicional.`;

      const responseText = await callGemini(prompt, true);
      
      // Limpeza de potenciais blocos markdown em JSON
      const cleanJsonStr = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const aiData = JSON.parse(cleanJsonStr);
      
      variableNames.forEach(name => {
        const regex = new RegExp(`\\{\\{\\s*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\}\\}`, 'g');
        
        // Busca insensível a maiúsculas/minúsculas no objeto JSON
        const matchedKey = Object.keys(aiData).find(k => k.trim().toLowerCase() === name.toLowerCase()) || name;
        const val = aiData[matchedKey] !== undefined ? aiData[matchedKey] : "Não informado";
        
        // Limpa asteriscos residuais do valor preenchido pela IA para evitar **** duplicados
        const cleanVal = String(val).replace(/\*\*/g, '').trim();
        finalReport = finalReport.replace(regex, cleanVal);
      });
      
      setResult(finalReport);
      showNotification(`Anamnese processada e preenchida com sucesso!`, "success");
    } catch (error) { 
      showNotification(`Erro no processamento: ${error.message}`, "error");
      setResult(`Erro na geração: ${error.message}`);
    } finally { setIsGenerating(false); }
  };

  const handleExtraAnalysis = async (type) => {
    if (!result) return;
    setIsExtraLoading(true);
    try {
      const prompt = type === 'patient' 
        ? `Explique este relatório médico de anamnese de forma simples, leiga e acolhedora para o paciente ler e entender: ${result}`
        : `Atue como um mentor clínico. Indique quais lacunas existem e quais perguntas importantes o nutricionista deve fazer no seguimento clínico baseado nestes dados: ${patientData} ${doctorData} ${result}`;
      const text = await callGemini(prompt);
      if (type === 'patient') {
        setPatientTranslation(text);
        setActiveResultView('patient');
        showNotification("Tradução para o paciente criada com sucesso!", "success");
      } else {
        setClinicInsights(text);
        setActiveResultView('clinic');
        showNotification("Insights de retorno criados com sucesso!", "success");
      }
    } catch (e) { showNotification("Erro na análise secundária.", "error"); }
    finally { setIsExtraLoading(false); }
  };

  // --- PDF (Injetado) ---
  useEffect(() => {
    if (!window.pdfjsLib) {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.async = true;
      script.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
        }
      };
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    const matches = template.match(/\{\{\s*[\wÀ-ÿ0-9_\-\s]+\s*\}\}/g) || [];
    const cleanVars = matches.map(v => {
      const inner = v.replace(/^\{\{\s*|\s*\}\}$/g, '').trim();
      return `{{ ${inner} }}`;
    });
    setDetectedVars([...new Set(cleanVars)]);
  }, [template]);

  const editorRef = useRef(null);

  // Converte Markdown e tags {{ VAR }} em HTML com pílulas e negritos visuais
  const formatTemplateToHTML = (text) => {
    if (!text) return '';
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\{\{\s*([\wÀ-ÿ0-9_\-\s]+)\s*\}\}/g, (match, varName) => {
        const name = varName.trim();
        return `<span contenteditable="false" data-var="${name}" class="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-xs px-2 py-0.5 rounded-md font-bold mx-1 shadow-sm select-none">⚡ {{ ${name} }}</span>`;
      })
      .replace(/\n/g, '<br>');
    return html;
  };

  // Converte HTML do editor visual de volta para string de template com tags
  const syncEditorToTemplate = () => {
    if (!editorRef.current) return;
    let html = editorRef.current.innerHTML;

    // Converte os spans de variáveis de volta para {{ NOME }}
    html = html.replace(/<span[^>]*data-var="([^"]+)"[^>]*>[\s\S]*?<\/span>/gi, '{{ $1 }}');
    // Converte <strong> e <b> para **texto**
    html = html.replace(/<(?:strong|b)[^>]*>(.*?)<\/(?:strong|b)>/gi, '**$1**');
    // Converte <em> e <i> para *texto*
    html = html.replace(/<(?:em|i)[^>]*>(.*?)<\/(?:em|i)>/gi, '*$1*');
    // Converte <br> e <div> em quebras de linha
    html = html.replace(/<br\s*\/?>/gi, '\n');
    html = html.replace(/<div><br\s*\/?><\/div>/gi, '\n');
    html = html.replace(/<div>(.*?)<\/div>/gi, '\n$1');

    // Extrai texto limpo com suporte a quebras de linha
    const tmp = document.createElement('textarea');
    tmp.innerHTML = html;
    let cleanText = tmp.value
      .replace(/<[^>]+>/g, '')
      .replace(/\n\s*\n\s*\n/g, '\n\n');

    setTemplate(cleanText);
  };

  // Sincroniza o HTML do editor visual quando o estado template muda externamente
  useEffect(() => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.innerHTML = formatTemplateToHTML(template);
    }
  }, [template, activeTab]);

  // Executa comandos de formatação ricos no editor
  const handleEditorCommand = (command, arg = null) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, arg);
    syncEditorToTemplate();
  };

  // Inserir pílula de variável visual no cursor
  const handleInsertVariableBadge = () => {
    const varName = prompt("Digite o nome da nova variável (ex: SINTOMAS, OBJETIVO):");
    if (!varName || !varName.trim()) return;
    const cleanName = varName.trim().toUpperCase();
    const badgeHTML = `<span contenteditable="false" data-var="${cleanName}" class="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-xs px-2 py-0.5 rounded-md font-bold mx-1 shadow-sm select-none">⚡ {{ ${cleanName} }}</span>&nbsp;`;
    
    handleEditorCommand('insertHTML', badgeHTML);
  };

  // --- DADOS DEMO PARA TESTE ---
  const loadDemoData = () => {
    setPatientData(
`NOME: Mariana Santos Silva
IDADE: 34 anos
OBJETIVO: Emagrecimento saudável e melhora da disposição nos treinos.
ROTINA: Trabalho de escritório (sedentária 8h/dia), treina musculação 3x na semana à noite.
ALIMENTAÇÃO: Pula o café da manhã, almoça PF em restaurante self-service (prato grande, pouca salada), sente muita vontade de doces no final da tarde (16h-17h).
INTESTINO: Preso (evacua a cada 2 ou 3 dias).
INGESTÃO HÍDRICA: Cerca de 1 litro de água por dia.
HISTÓRICO FAMILIAR: Mãe diabética tipo 2, Pai hipertenso.`
    );
    setDoctorData(
`AVALIAÇÃO CLÍNICA E NUTRICIONAL:
Paciente consciente e motivada. Queixa-se de fadiga tensional à tarde e episódios de compulsão por doces associados ao estresse do trabalho.
Prescrevo plano alimentar com fracionamento de refeições (introduzir lanche da tarde proteico com frutas e sementes).
Aumentar meta hídrica para 2.5L/dia.
Suplementação sugerida: Creatina 5g/dia, Magnésio Inositol à noite para melhora do sono e ansiedade.
Reavaliação em 30 dias.`
    );
    if (!template) {
      setTemplate(
`**ANAMNESE NUTRICIONAL COMPLETA**

**DADOS DO PACIENTE:**
• **Nome:** {{ NOME }}
• **Idade:** {{ IDADE }}
• **Objetivo Principal:** {{ OBJETIVO }}

**DIAGNÓSTICO E HÁBITOS:**
• **Rotina Alimentar e Hídrica:** {{ INGESTÃO HÍDRICA }}
• **Funcionamento Intestinal:** {{ INTESTINO }}

**PARECER E CONDUTA DA NUTRICIONISTA:**
• **Síntese da Consulta:** {{ AVALIAÇÃO CLÍNICA E NUTRICIONAL }}
• **Suplementação Indicada:** {{ SUPLEMENTAÇÃO }}`
      );
    }
    showNotification("Dados de demonstração carregados com modelo formatado!", "success");
  };

  return (
    <div className="animate-fadeIn max-w-7xl mx-auto">
      {/* ABAS DO MÓDULO ANAMNESE */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 overflow-x-auto">
        {['input', 'template', 'result'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 font-bold text-xs uppercase tracking-wide rounded-t-lg transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-emerald-700 border-x border-t border-slate-200 shadow-sm' : 'text-slate-400 hover:text-emerald-600'}`}>
            {tab === 'input' ? '1. Coleta de Dados' : tab === 'template' ? '2. Estrutura Modelo' : '3. Relatório IA'}
          </button>
        ))}
      </div>

      {/* Título da Seção apenas na Aba 1 */}
      {activeTab === 'input' && (
        <div className="text-center space-y-3 pt-2 pb-6">
          <span className="inline-block px-3.5 py-1 bg-emerald-100/80 text-emerald-800 text-xs font-semibold rounded-full uppercase tracking-wider border border-emerald-200/50">
            Módulo de Anamnese com IA
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
            Análise Integrada de Prontuário
          </h2>
          <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
            Colete os dados do questionário prévio e notas da consulta, escolha um modelo de documento e deixe a IA preencher a estrutura automaticamente.
          </p>
        </div>
      )}

      {activeTab === 'input' && (
        <div className="grid md:grid-cols-2 gap-6 animate-fadeIn">
          {[
            { title: 'Questionário do Paciente', icon: <User size={18}/>, val: patientData, set: setPatientData, ph: "Introduza aqui o questionário respondido pelo paciente ou carregue um PDF..." },
            { title: 'Notas da Consulta', icon: <Stethoscope size={18}/>, val: doctorData, set: setDoctorData, ph: "Notas da consulta, avaliação qualitativa, queixas..." }
          ].map((field, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col h-[380px]">
              <div className="flex justify-between items-center mb-4 text-emerald-800 font-bold uppercase">
                <div className="flex items-center gap-2">{field.icon} <h2 className="text-sm">{field.title}</h2></div>
                <label className="cursor-pointer text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 transition-all shadow-sm flex items-center">
                  <Upload size={12} className="mr-1.5" /> PDF / TXT
                  <input type="file" accept=".txt, .pdf" className="hidden" onChange={(e) => {
                     const file = e.target.files[0];
                     if (!file) return;
                     if (file.type === 'application/pdf') {
                       const reader = new FileReader();
                       reader.onload = async (ev) => {
                         const arrayBuffer = ev.target.result;
                         const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                         let fullText = "";
                         for (let i = 1; i <= pdf.numPages; i++) {
                           const page = await pdf.getPage(i);
                           const content = await page.getTextContent();
                           fullText += content.items.map(item => item.str).join(' ') + "\n";
                         }
                         field.set(fullText);
                         showNotification("PDF extraído!", "success");
                       };
                       reader.readAsArrayBuffer(file);
                     } else {
                       const reader = new FileReader();
                       reader.onload = (ev) => { field.set(ev.target.result); showNotification("Arquivo carregado!", "success"); };
                       reader.readAsText(file);
                     }
                  }} />
                </label>
              </div>
              <textarea className="flex-1 w-full p-4 border border-slate-100 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none font-sans text-sm leading-relaxed transition-all" placeholder={field.ph} value={field.val} onChange={(e) => field.set(e.target.value)} />
            </div>
          ))}
          
          {/* Actions Bar (Igual ao do Laudo) */}
          <div className="md:col-span-2 bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-left space-y-1.5 max-w-md">
              <h4 className="font-bold text-slate-800 text-base flex items-center">
                <Sparkles className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0" /> Assistente de Anamnese com IA
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Insira ou carregue os dados do paciente e as notas da consulta. Depois, defina a estrutura modelo para a IA preencher.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:w-auto min-w-[360px] sm:min-w-[440px]">
              <button
                type="button"
                onClick={loadDemoData}
                className="w-full h-11 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center justify-center border border-slate-200 shadow-sm hover:shadow"
              >
                <RefreshCw className="w-4 h-4 mr-2 text-slate-500" />
                Usar Dados de Exemplo (Demo)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('template')}
                className="w-full h-11 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center"
              >
                Definir Estrutura <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'template' && (
        <div className="animate-fadeIn space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase ml-1">Meus Modelos</label>
              <select value={selectedTemplateId} onChange={(e) => { 
                  const t = savedTemplates.find(tem => tem.id === e.target.value); 
                  if (t) { setSelectedTemplateId(t.id); setTemplate(t.content); } 
                  else { setSelectedTemplateId(''); setTemplate(''); } 
                }} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 font-medium outline-none shadow-sm focus:ring-2 focus:ring-emerald-500">
                <option value="">-- Novo / Em branco --</option>
                {savedTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase ml-1">Nome do Modelo</label>
              <input type="text" value={templateNameInput} onChange={(e) => setTemplateNameInput(e.target.value)} placeholder="Ex: Anamnese Esportiva" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-medium outline-none shadow-sm focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => {
                if (!template.trim()) return;
                try {
                  if (selectedTemplateId) {
                    setSavedTemplates(prev => prev.map(t => t.id === selectedTemplateId ? { ...t, content: template, name: templateNameInput || t.name } : t));
                  } else {
                    if (!templateNameInput.trim()) return showNotification("Informe um nome para o modelo!", "error");
                    const newId = 'tmp_' + Date.now();
                    setSavedTemplates(prev => [...prev, { id: newId, name: templateNameInput, content: template }]);
                    setSelectedTemplateId(newId);
                  }
                  showNotification("Modelo salvo localmente!", "success");
                } catch (e) { showNotification("Erro ao salvar.", "error"); }
              }} className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase flex items-center gap-2 shadow hover:bg-emerald-700 transition-all"><Save size={16}/> Salvar</button>
              <button onClick={() => {setSelectedTemplateId(''); setTemplate(''); setTemplateNameInput('');}} className="bg-slate-100 text-slate-600 px-5 py-2.5 rounded-lg text-xs font-bold uppercase flex items-center gap-2 hover:bg-slate-200 border border-slate-200 transition-all"><Plus size={16}/> Limpar</button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 h-[500px]">
            <div className="md:col-span-2 h-full flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Barra de Ferramentas de Formatação Visual */}
              <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 uppercase px-1">Editor Visual:</span>
                  
                  <button 
                    type="button" 
                    onClick={() => handleEditorCommand('bold')} 
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-all shadow-sm flex items-center gap-1"
                    title="Negrito Visual (Ctrl+B)"
                  >
                    <strong>B</strong> Negrito
                  </button>

                  <button 
                    type="button" 
                    onClick={() => handleEditorCommand('italic')} 
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs italic font-medium text-slate-700 transition-all shadow-sm flex items-center gap-1"
                    title="Itálico Visual (Ctrl+I)"
                  >
                    <em>I</em> Itálico
                  </button>

                  <button 
                    type="button" 
                    onClick={() => handleEditorCommand('insertUnorderedList')} 
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-all shadow-sm flex items-center gap-1"
                    title="Inserir Lista com Marcadores"
                  >
                    • Tópicos
                  </button>

                  <button 
                    type="button" 
                    onClick={handleInsertVariableBadge} 
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-700 transition-all shadow-sm flex items-center gap-1"
                    title="Inserir Pílula de Variável"
                  >
                    ⚡ Variável
                  </button>
                </div>

                <span className="text-[11px] text-slate-500 font-medium px-2 hidden lg:inline">
                  ✨ Formatação visual ativa! Os <strong>negritos</strong> colam formatados no <strong>WebDiet</strong>.
                </span>
              </div>

              {/* Editor Rico Interativo (contentEditable) */}
              <div 
                ref={editorRef}
                contentEditable
                onInput={syncEditorToTemplate}
                onBlur={syncEditorToTemplate}
                className="w-full flex-1 p-6 outline-none font-sans text-sm leading-relaxed overflow-y-auto bg-white text-slate-800 focus:bg-slate-50/20 whitespace-pre-wrap"
              />
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-xs text-slate-600 uppercase text-center">Variáveis Detectadas</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {detectedVars.map((v, i) => (
                  <div key={i} className="text-xs bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 font-mono text-emerald-800 font-semibold flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-500 flex-shrink-0"/> 
                    <span className="truncate">{v}</span>
                  </div>
                ))}
                {detectedVars.length === 0 && (
                  <div className="text-center py-10 opacity-50">
                    <List className="mx-auto mb-2 text-slate-400" size={24}/>
                    <p className="text-xs font-medium text-slate-500">Insira tags como<br/><span className="text-emerald-600 font-mono">{"{{"} VAR {"}}"}</span><br/>no texto ao lado</p>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-slate-100 bg-slate-50">
                <button onClick={() => setActiveTab('result')} className="w-full py-3 rounded-lg font-bold text-xs uppercase text-white bg-emerald-600 flex items-center justify-center gap-2 hover:bg-emerald-700 shadow transition-all">Ir para Geração <ArrowRight size={14}/></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'result' && (
        <div className="animate-fadeIn pb-12">
          {isGenerating ? (
            <div className="h-[400px] flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 shadow-sm animate-pulse">
              <div className="relative mb-6">
                <BrainCircuit size={60} className="text-emerald-500 animate-bounce" />
                <Sparkles size={24} className="text-teal-400 absolute -top-2 -right-2 animate-ping" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 uppercase">Processando Documento...</h3>
            </div>
          ) : !result ? (
            <div className="h-[400px] flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 text-center p-8 shadow-sm">
              <Sparkles size={50} className="text-emerald-200 mb-6" />
              <h2 className="text-xl font-bold mb-4 text-slate-700">Preencher Estrutura com IA</h2>
              <button onClick={generateReport} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm uppercase flex items-center gap-3 transition-all shadow-md">
                <BrainCircuit size={18} /> Gerar Relatório
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-4 gap-6">
              <div className="md:col-span-3 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 p-3 md:p-4 flex flex-wrap justify-between items-center border-b border-slate-200 gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button 
                        onClick={() => setActiveResultView('main')} 
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          activeResultView === 'main' 
                            ? 'bg-emerald-600 text-white shadow-sm' 
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <FileText size={14} /> Documento Finalizado
                      </button>

                      {patientTranslation && (
                        <button 
                          onClick={() => setActiveResultView('patient')} 
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                            activeResultView === 'patient' 
                              ? 'bg-teal-600 text-white border-teal-600 shadow-sm' 
                              : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200'
                          }`}
                        >
                          <MessageCircle size={14} /> Tradução p/ Paciente
                        </button>
                      )}

                      {clinicInsights && (
                        <button 
                          onClick={() => setActiveResultView('clinic')} 
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                            activeResultView === 'clinic' 
                              ? 'bg-amber-600 text-white border-amber-600 shadow-sm' 
                              : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200'
                          }`}
                        >
                          <Sparkles size={14} /> Insights de Retorno
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          const textToCopy = activeResultView === 'main' ? result : activeResultView === 'patient' ? patientTranslation : clinicInsights;
                          copyToClipboardAdvanced(textToCopy);
                        }} 
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center gap-1.5" 
                        title="Copiar relatório limpo e formatado sem asteriscos"
                      >
                        <Copy size={14}/> Copiar Relatório
                      </button>

                      <button 
                        onClick={() => {
                          const textToDownload = activeResultView === 'main' ? result : activeResultView === 'patient' ? patientTranslation : clinicInsights;
                          const cleanText = cleanMarkdownToText(textToDownload);
                          const fileName = activeResultView === 'main' ? "Anamnese_Gerada.txt" : activeResultView === 'patient' ? "Traducao_Paciente.txt" : "Insights_Retorno.txt";
                          const element = document.createElement("a");
                          const file = new Blob([cleanText], {type: 'text/plain;charset=utf-8'});
                          element.href = URL.createObjectURL(file);
                          element.download = fileName;
                          element.click();
                        }} 
                        className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-all border border-slate-200 bg-white" 
                        title="Baixar arquivo limpo (.txt)"
                      >
                        <Download size={16}/>
                      </button>
                    </div>
                  </div>

                  <div id="final-anamnese-report" className="p-8 font-sans leading-relaxed text-sm text-slate-800 min-h-[400px]">
                    {activeResultView === 'main' && renderFormattedText(result)}
                    {activeResultView === 'patient' && (
                      <div className="space-y-4">
                        <div className="p-3 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                          <MessageCircle size={16} /> Tradução simples e acolhedora pronta para o paciente:
                        </div>
                        <div>{renderFormattedText(patientTranslation)}</div>
                      </div>
                    )}
                    {activeResultView === 'clinic' && (
                      <div className="space-y-4">
                        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                          <Sparkles size={16} /> Parecer e perguntas recomendadas para a consulta de retorno:
                        </div>
                        <div>{renderFormattedText(clinicInsights)}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm sticky top-6">
                  <h4 className="text-[10px] font-bold uppercase text-slate-400 mb-4 text-center">Opções de IA</h4>
                  <button onClick={generateReport} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all">
                    <RefreshCw size={14}/> Refazer Relatório
                  </button>
                  <div className="mt-4 space-y-2">
                    <button 
                      onClick={() => handleExtraAnalysis('patient')} 
                      disabled={isExtraLoading} 
                      className={`w-full py-3 text-xs font-bold rounded-lg flex items-center justify-center transition-all border ${
                        patientTranslation 
                          ? 'bg-teal-100 text-teal-800 border-teal-300 hover:bg-teal-200' 
                          : 'bg-teal-50 hover:bg-teal-100 border-teal-100 text-teal-700'
                      }`}
                    >
                      {isExtraLoading ? "Gerando..." : patientTranslation ? "✓ Refazer Tradução" : "Traduzir p/ Paciente"}
                    </button>

                    <button 
                      onClick={() => handleExtraAnalysis('clinic')} 
                      disabled={isExtraLoading} 
                      className={`w-full py-3 text-xs font-bold rounded-lg flex items-center justify-center transition-all border ${
                        clinicInsights 
                          ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200' 
                          : 'bg-amber-50 hover:bg-amber-100 border-amber-100 text-amber-700'
                      }`}
                    >
                      {isExtraLoading ? "Gerando..." : clinicInsights ? "✓ Refazer Insights" : "Insights de Retorno"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {notification && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-white flex items-center gap-3 animate-bounce-in z-50 ${notification.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span className="text-xs font-bold">{notification.msg}</span>
        </div>
      )}
    </div>
  );
}
