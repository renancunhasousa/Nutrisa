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

  // --- INTEGRAÇÃO GEMINI COM CASCATA DE FALLBACK MULTI-NÍVEL ---
  const callGemini = async (prompt, isJson = false) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      showNotification("Chave API não configurada no ambiente (.env).", "error");
      throw new Error("Chave não configurada.");
    }
    const initialModel = activeModel || localStorage.getItem('nutrisa_selected_model') || import.meta.env.VITE_GEMINI_MODEL || "gemini-3.7-flash";
    
    // Cascata de modelos em camadas
    const fallbackChain = [
      "gemini-3.7-flash",
      "gemini-3.5-flash-lite",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite"
    ];
    const modelsToTry = [initialModel, ...fallbackChain.filter(m => m !== initialModel)];

    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3
      }
    };
    if (isJson) payload.generationConfig.responseMimeType = "application/json";

    let lastError = null;

    for (let i = 0; i < modelsToTry.length; i++) {
      const model = modelsToTry[i];
      try {
        if (i > 0) {
          console.warn(`[Anamnese Fallback] Alternando automaticamente para ${model} (tentativa ${i + 1}/${modelsToTry.length})...`);
          showNotification(`Cota ou instabilidade no modelo anterior. Alternando para ${model}...`, "info");
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errBody = await response.text();
          console.warn(`Modelo ${model} retornou status ${response.status}: ${errBody}`);
          lastError = new Error(`Erro ${response.status} no modelo ${model}`);
          continue; // Tenta o próximo modelo
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
      } catch (error) {
        lastError = error;
        console.warn(`Erro com modelo ${model}:`, error);
      }
    }

    showNotification("Todos os modelos da cascata falharam. Verifique sua conexão ou cota.", "error");
    throw lastError || new Error("Falha na geração via IA.");
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
    // Converte elementos de listas <li> para • item
    html = html.replace(/<li[^>]*>(.*?)<\/li>/gi, '\n• $1');
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
  const handleEditorCommand = (command, arg = null, e = null) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, arg);
    syncEditorToTemplate();
  };

  // Inserir Tópico / Bullet list no cursor do editor preservando a seleção
  const handleInsertBullet = (e = null) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editorRef.current) return;
    editorRef.current.focus();

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        const bulletNode = document.createTextNode("• ");
        range.deleteContents();
        range.insertNode(bulletNode);
        range.setStartAfter(bulletNode);
        range.setEndAfter(bulletNode);
        selection.removeAllRanges();
        selection.addRange(range);
        syncEditorToTemplate();
        return;
      }
    }

    // Se o cursor não estava dentro da div, insere no final
    editorRef.current.innerText += (editorRef.current.innerText ? '\n' : '') + '• ';
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
      {/* STEPPER PROGRESS BAR - REPLICANDO O ESTILO DE LAUDO */}
      <div className="flex items-center justify-center max-w-2xl mx-auto my-6 print:hidden">
        {/* Step 1 */}
        <div 
          onClick={() => setActiveTab('input')} 
          className="flex items-center space-x-2.5 cursor-pointer group"
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
            activeTab === 'input' 
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 ring-4 ring-emerald-50' 
              : activeTab === 'template' || activeTab === 'result'
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'bg-slate-100 text-slate-400 border border-slate-200'
          }`}>
            1
          </div>
          <span className={`text-xs uppercase tracking-wider font-extrabold transition-colors ${
            activeTab === 'input' ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'
          }`}>
            1. Coleta de Dados
          </span>
        </div>

        {/* Line 1-2 */}
        <div className={`flex-1 h-0.5 mx-4 transition-colors ${activeTab === 'template' || activeTab === 'result' ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>

        {/* Step 2 */}
        <div 
          onClick={() => setActiveTab('template')} 
          className="flex items-center space-x-2.5 cursor-pointer group"
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
            activeTab === 'template' 
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 ring-4 ring-emerald-50' 
              : activeTab === 'result'
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'bg-white text-slate-400 border border-slate-200'
          }`}>
            2
          </div>
          <span className={`text-xs uppercase tracking-wider font-extrabold transition-colors ${
            activeTab === 'template' ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'
          }`}>
            2. Estrutura Modelo
          </span>
        </div>

        {/* Line 2-3 */}
        <div className={`flex-1 h-0.5 mx-4 transition-colors ${activeTab === 'result' ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>

        {/* Step 3 */}
        <div 
          onClick={() => result && setActiveTab('result')} 
          className={`flex items-center space-x-2.5 ${result ? 'cursor-pointer group' : 'cursor-not-allowed opacity-60'}`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
            activeTab === 'result' 
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 ring-4 ring-emerald-50' 
              : 'bg-white text-slate-400 border border-slate-200'
          }`}>
            3
          </div>
          <span className={`text-xs uppercase tracking-wider font-extrabold transition-colors ${
            activeTab === 'result' ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'
          }`}>
            3. Relatório IA
          </span>
        </div>
      </div>

      {/* Título da Seção apenas na Aba 1 */}
      {activeTab === 'input' && (
        <div className="text-center space-y-2 pt-2 pb-6">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Análise Integrada de Prontuário
          </h2>
          <p className="text-slate-600 text-xs md:text-sm leading-relaxed max-w-2xl mx-auto font-normal">
            Colete os dados do questionário prévio e notas da consulta, escolha um modelo de documento e deixe a IA preencher a estrutura automaticamente.
          </p>
        </div>
      )}

      {activeTab === 'input' && (
        <div className="grid md:grid-cols-2 gap-6 animate-fadeIn max-w-5xl mx-auto">
          {[
            { title: 'Questionário do Paciente', icon: <User size={18} className="text-emerald-600"/>, val: patientData, set: setPatientData, ph: "Introduza aqui o questionário respondido pelo paciente ou carregue um PDF..." },
            { title: 'Notas da Consulta', icon: <Stethoscope size={18} className="text-teal-600"/>, val: doctorData, set: setDoctorData, ph: "Notas da consulta, avaliação qualitativa, queixas..." }
          ].map((field, idx) => (
            <div key={idx} className="bg-white rounded-3xl shadow-xs border border-slate-200 p-6 flex flex-col h-[400px]">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  {field.icon} 
                  <h2 className="text-base font-extrabold text-slate-900">{field.title}</h2>
                </div>
                <label className="cursor-pointer text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-full border border-slate-200 transition-all shadow-2xs flex items-center active:scale-95">
                  <Upload size={13} className="mr-1.5 text-slate-500" /> PDF / TXT
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
              <textarea className="flex-1 w-full p-4 border border-slate-200 rounded-2xl bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none font-sans text-sm leading-relaxed transition-all shadow-2xs text-slate-800" placeholder={field.ph} value={field.val} onChange={(e) => field.set(e.target.value)} />
            </div>
          ))}
          
          {/* Actions Bar (Idêntico ao do Laudo) */}
          <div className="md:col-span-2 bg-white backdrop-blur-md p-5 md:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 max-w-5xl mx-auto w-full mt-2">
            <div className="text-left space-y-1">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center">
                <Sparkles className="w-4 h-4 text-amber-500 mr-2 shrink-0" />
                Assistente de Anamnese com IA
              </h4>
              <p className="text-xs text-slate-500 max-w-md">
                Insira ou carregue os dados do paciente e as notas da consulta. Depois, defina a estrutura modelo para a IA preencher.
              </p>
            </div>

            <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={loadDemoData}
                className="px-4 py-2.5 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all flex items-center space-x-1.5 hover:bg-slate-100/80 rounded-full"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Carregar Dados Demo</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('template')}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-full shadow-sm hover:shadow transition-all flex items-center space-x-2 active:scale-95"
              >
                <span>Definir Estrutura</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'template' && (
        <div className="animate-fadeIn space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase ml-1">Meus Modelos</label>
              <select value={selectedTemplateId} onChange={(e) => { 
                  const t = savedTemplates.find(tem => tem.id === e.target.value); 
                  if (t) { setSelectedTemplateId(t.id); setTemplate(t.content); } 
                  else { setSelectedTemplateId(''); setTemplate(''); } 
                }} className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white font-medium outline-none shadow-2xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800">
                <option value="">-- Novo / Em branco --</option>
                {savedTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase ml-1">Nome do Modelo</label>
              <input type="text" value={templateNameInput} onChange={(e) => setTemplateNameInput(e.target.value)} placeholder="Ex: Anamnese Esportiva" className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-medium outline-none shadow-2xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-slate-800" />
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
              }} className="bg-emerald-600 text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase flex items-center gap-2 shadow-xs hover:bg-emerald-500 transition-all active:scale-95"><Save size={15}/> Salvar</button>
              <button onClick={() => {setSelectedTemplateId(''); setTemplate(''); setTemplateNameInput('');}} className="bg-slate-100 text-slate-700 px-5 py-2.5 rounded-full text-xs font-bold uppercase flex items-center gap-2 hover:bg-slate-200 border border-slate-200 transition-all active:scale-95"><Plus size={15}/> Limpar</button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 h-[500px]">
            <div className="md:col-span-2 h-full flex flex-col bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Barra de Ferramentas de Formatação Visual */}
              <div className="p-3 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase px-1">Editor:</span>
                  
                  <button 
                    type="button" 
                    onMouseDown={(e) => handleEditorCommand('bold', null, e)} 
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
                    title="Negrito Visual (Ctrl+B)"
                  >
                    <strong>B</strong> Negrito
                  </button>

                  <button 
                    type="button" 
                    onMouseDown={(e) => handleEditorCommand('italic', null, e)} 
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs italic font-medium text-slate-700 transition-all shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
                    title="Itálico Visual (Ctrl+I)"
                  >
                    <em>I</em> Itálico
                  </button>

                  <button 
                    type="button" 
                    onMouseDown={handleInsertBullet} 
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 transition-all shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
                    title="Inserir Lista com Marcadores"
                  >
                    • Tópicos
                  </button>

                  <button 
                    type="button" 
                    onClick={handleInsertVariableBadge} 
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl text-xs font-bold text-emerald-700 transition-all shadow-2xs flex items-center gap-1 active:scale-95"
                    title="Inserir Pílula de Variável"
                  >
                    ⚡ Variável
                  </button>
                </div>
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
            
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col h-full overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/80">
                <h3 className="font-extrabold text-xs text-slate-700 uppercase text-center tracking-wider">Variáveis Detectadas</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {detectedVars.map((v, i) => (
                  <div key={i} className="text-xs bg-emerald-50 p-2.5 rounded-xl border border-emerald-200/60 font-mono text-emerald-800 font-bold flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-600 flex-shrink-0"/> 
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
              
              <div className="p-4 border-t border-slate-100 bg-white">
                <button onClick={() => setActiveTab('result')} className="w-full py-3 rounded-full font-bold text-xs uppercase text-white bg-emerald-600 flex items-center justify-center gap-2 hover:bg-emerald-500 shadow-sm transition-all active:scale-95">Ir para Geração <ArrowRight size={14}/></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'result' && (
        <div className="animate-fadeIn pb-12">
          {isGenerating ? (
            <div className="h-[400px] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-xs animate-pulse max-w-4xl mx-auto">
              <div className="relative mb-6">
                <BrainCircuit size={60} className="text-emerald-500 animate-bounce" />
                <Sparkles size={24} className="text-teal-400 absolute -top-2 -right-2 animate-ping" />
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">Processando Documento...</h3>
            </div>
          ) : !result ? (
            <div className="h-[400px] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 text-center p-8 shadow-xs max-w-3xl mx-auto">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 text-emerald-600">
                <Sparkles size={32} />
              </div>
              <h2 className="text-xl font-black mb-2 text-slate-900">Preencher Estrutura com IA</h2>
              <p className="text-xs text-slate-500 mb-6 max-w-md">
                O motor de inteligência artificial analisará os dados do questionário e as notas para gerar o prontuário completo.
              </p>
              <button onClick={generateReport} className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-bold text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all shadow-sm hover:shadow active:scale-95">
                <BrainCircuit size={18} /> <span>Gerar Relatório de Anamnese</span>
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-4 gap-6">
              <div className="md:col-span-3 space-y-6">
                <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
                  <div className="bg-white p-4 flex flex-wrap justify-between items-center border-b border-slate-200/80 gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button 
                        onClick={() => setActiveResultView('main')} 
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                          activeResultView === 'main' 
                            ? 'bg-emerald-600 text-white shadow-xs' 
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        <FileText size={14} /> Documento Finalizado
                      </button>

                      {patientTranslation && (
                        <button 
                          onClick={() => setActiveResultView('patient')} 
                          className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border ${
                            activeResultView === 'patient' 
                              ? 'bg-teal-600 text-white border-teal-600 shadow-xs' 
                              : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200'
                          }`}
                        >
                          <MessageCircle size={14} /> Tradução p/ Paciente
                        </button>
                      )}

                      {clinicInsights && (
                        <button 
                          onClick={() => setActiveResultView('clinic')} 
                          className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border ${
                            activeResultView === 'clinic' 
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs' 
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
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95" 
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
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-all border border-slate-200 bg-white shadow-2xs active:scale-95" 
                        title="Baixar arquivo limpo (.txt)"
                      >
                        <Download size={15}/>
                      </button>
                    </div>
                  </div>

                  <div id="final-anamnese-report" className="p-8 font-sans leading-relaxed text-sm text-slate-800 min-h-[400px] bg-white">
                    {activeResultView === 'main' && renderFormattedText(result)}
                    {activeResultView === 'patient' && (
                      <div className="space-y-4">
                        <div className="p-3 bg-teal-50 border border-teal-200 text-teal-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
                          <MessageCircle size={16} /> Tradução simples e acolhedora pronta para o paciente:
                        </div>
                        <div>{renderFormattedText(patientTranslation)}</div>
                      </div>
                    )}
                    {activeResultView === 'clinic' && (
                      <div className="space-y-4">
                        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
                          <Sparkles size={16} /> Parecer e perguntas recomendadas para a consulta de retorno:
                        </div>
                        <div>{renderFormattedText(clinicInsights)}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs sticky top-6">
                  <h4 className="text-[10px] font-extrabold uppercase text-slate-400 mb-4 text-center tracking-wider">Opções de IA</h4>
                  <button onClick={generateReport} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-full font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-2xs">
                    <RefreshCw size={14}/> Refazer Relatório
                  </button>
                  <div className="mt-4 space-y-2">
                    <button 
                      onClick={() => handleExtraAnalysis('patient')} 
                      disabled={isExtraLoading} 
                      className={`w-full py-2.5 text-xs font-bold rounded-full flex items-center justify-center transition-all border active:scale-95 shadow-2xs ${
                        patientTranslation 
                          ? 'bg-teal-100 text-teal-800 border-teal-300 hover:bg-teal-200' 
                          : 'bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-700'
                      }`}
                    >
                      {isExtraLoading ? "Gerando..." : patientTranslation ? "✓ Refazer Tradução" : "Traduzir p/ Paciente"}
                    </button>

                    <button 
                      onClick={() => handleExtraAnalysis('clinic')} 
                      disabled={isExtraLoading} 
                      className={`w-full py-2.5 text-xs font-bold rounded-full flex items-center justify-center transition-all border active:scale-95 shadow-2xs ${
                        clinicInsights 
                          ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200' 
                          : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700'
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
