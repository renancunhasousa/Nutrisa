import { useState, useEffect, useRef } from 'react';
import { callGeminiWithFallback } from '../../../shared/services/aiClient.js';
import { readDocument } from '../services/documents.js';
import { extractVariables, extractVariableNames, replaceVariable } from '../domain/variables.js';
import { syncHTMLToTemplate, formatTemplateToHTML, cleanMarkdownToText } from '../domain/formatting.js';
import { buildGenerationPrompt, buildPatientTranslationPrompt, buildClinicInsightsPrompt } from '../prompts/generate.js';
import { KEY_ANAMNESE_TEMPLATES, KEY_ANAMNESE_DRAFT } from '../../../config/storageKeys.js';
import { importLocalDocumentTemplates, listDocumentTemplates, saveDocumentTemplate } from '../../../shared/services/documentTemplates.js';
import { useAuth } from '../../auth/useAuth.js';
import { consumePatientHandoff } from '../../pacientes/services/patientHandoff.js';
import { createPatientAnamnese, updatePatientAnamnese } from '../services/anamneses.js';
import { usePatient } from '../../pacientes/usePatient.js';
import { consumeClinicalRecordHandoff } from '../../pacientes/services/clinicalRecords.js';

/** Dados de demonstração pré-carregados */
const DEMO_PATIENT = `NOME: Mariana Santos Silva
IDADE: 34 anos
OBJETIVO: Emagrecimento saudável e melhora da disposição nos treinos.
ROTINA: Trabalho de escritório (sedentária 8h/dia), treina musculação 3x na semana à noite.
ALIMENTAÇÃO: Pula o café da manhã, almoça PF em restaurante self-service (prato grande, pouca salada), sente muita vontade de doces no final da tarde (16h-17h).
INTESTINO: Preso (evacua a cada 2 ou 3 dias).
INGESTÃO HÍDRICA: Cerca de 1 litro de água por dia.
HISTÓRICO FAMILIAR: Mãe diabética tipo 2, Pai hipertenso.`;

const DEMO_DOCTOR = `AVALIAÇÃO CLÍNICA E NUTRICIONAL:
Paciente consciente e motivada. Queixa-se de fadiga tensional à tarde e episódios de compulsão por doces associados ao estresse do trabalho.
Prescrevo plano alimentar com fracionamento de refeições (introduzir lanche da tarde proteico com frutas e sementes).
Aumentar meta hídrica para 2.5L/dia.
Suplementação sugerida: Creatina 5g/dia, Magnésio Inositol à noite para melhora do sono e ansiedade.
Reavaliação em 30 dias.`;

const DEMO_TEMPLATE = `**ANAMNESE NUTRICIONAL COMPLETA**

**DADOS DO PACIENTE:**
• **Nome:** {{ NOME }}
• **Idade:** {{ IDADE }}
• **Objetivo Principal:** {{ OBJETIVO }}

**DIAGNÓSTICO E HÁBITOS:**
• **Rotina Alimentar e Hídrica:** {{ INGESTÃO HÍDRICA }}
• **Funcionamento Intestinal:** {{ INTESTINO }}

**PARECER E CONDUTA DA NUTRICIONISTA:**
• **Síntese da Consulta:** {{ AVALIAÇÃO CLÍNICA E NUTRICIONAL }}
• **Suplementação Indicada:** {{ SUPLEMENTAÇÃO }}`;

/**
 * Hook que encapsula todo o estado e a lógica da tela de Anamnese.
 * @param {{ activeModel: string }} props
 */
export function useAnamnese({ activeModel }) {
  const { organizationId } = useAuth();
  const [patientHandoff] = useState(() => consumePatientHandoff('anamnese'));
  const { selectedPatient } = usePatient();
  const activePatient = selectedPatient || patientHandoff;
  const [openedRecord] = useState(() => consumeClinicalRecordHandoff('anamnese'));
  // ── Dados ────────────────────────────────────────────────
  const [patientData, setPatientData] = useState(() => openedRecord?.patient_answers || (activePatient?.full_name || activePatient?.name ? `NOME: ${activePatient.full_name || activePatient.name}` : ''));
  const [doctorData, setDoctorData] = useState(() => openedRecord?.professional_notes || '');
  const [template, setTemplate] = useState('');
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templateNameInput, setTemplateNameInput] = useState('');
  const [result, setResult] = useState(() => openedRecord?.report || '');
  const [patientTranslation, setPatientTranslation] = useState(() => openedRecord?.patient_translation || '');
  const [clinicInsights, setClinicInsights] = useState(() => openedRecord?.clinic_insights || '');
  const [activeResultView, setActiveResultView] = useState('main');
  const [detectedVars, setDetectedVars] = useState([]);

  // ── UI ───────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(() => openedRecord ? 'result' : 'input');
  const [notification, setNotification] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [isExtraLoading, setIsExtraLoading] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const editorRef = useRef(null);
  const savedAnamneseIdRef = useRef(openedRecord?.id || null);

  useEffect(() => {
    if (!activePatient?.id) return;
    setPatientData((current) => current.trim() ? current : `NOME: ${activePatient.full_name || activePatient.name}`);
  }, [activePatient]);

  // ── Notificações ─────────────────────────────────────────
  const showNotification = (msg, type) => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ── Persistência ─────────────────────────────────────────
  useEffect(() => {
    if (!organizationId) return undefined;
    let cancelled = false;
    const loadTemplates = async () => {
      setIsLoadingTemplates(true);
      try {
        const raw = localStorage.getItem(KEY_ANAMNESE_TEMPLATES);
        const localTemplates = raw ? JSON.parse(raw) : [];
        if (localTemplates.length) {
          await importLocalDocumentTemplates({ organizationId, templateType: 'anamnese', templates: localTemplates });
          localStorage.removeItem(KEY_ANAMNESE_TEMPLATES);
        }
        const remoteTemplates = await listDocumentTemplates(organizationId, 'anamnese');
        if (!cancelled) setSavedTemplates(remoteTemplates);
        const draft = localStorage.getItem(KEY_ANAMNESE_DRAFT);
        if (!cancelled && draft) setTemplate(draft);
      } catch (e) {
        console.error('Erro ao carregar modelos de anamnese', e);
        if (!cancelled) showNotification(`Erro ao carregar modelos: ${e.message}`, 'error');
      } finally {
        if (!cancelled) setIsLoadingTemplates(false);
      }
    };
    loadTemplates();
    return () => { cancelled = true; };
  }, [organizationId]);

  useEffect(() => {
    const id = setTimeout(() => {
      localStorage.setItem(KEY_ANAMNESE_DRAFT, template);
    }, 1500);
    return () => clearTimeout(id);
  }, [template]);

  // ── Variáveis detectadas ──────────────────────────────────
  useEffect(() => {
    setDetectedVars(extractVariables(template));
  }, [template]);

  // ── Sincronização do editor rico ──────────────────────────
  const syncEditorToTemplate = () => {
    if (!editorRef.current) return;
    setTemplate(syncHTMLToTemplate(editorRef.current.innerHTML));
  };

  useEffect(() => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.innerHTML = formatTemplateToHTML(template);
    }
  }, [template, activeTab]);

  // ── Comandos de edição ────────────────────────────────────
  const handleEditorCommand = (command, arg = null, e = null) => {
    if (e?.preventDefault) e.preventDefault();
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, arg);
    syncEditorToTemplate();
  };

  const handleInsertBullet = (e = null) => {
    if (e?.preventDefault) e.preventDefault();
    if (!editorRef.current) return;
    editorRef.current.focus();
    const selection = window.getSelection();
    if (selection?.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        const node = document.createTextNode('• ');
        range.deleteContents();
        range.insertNode(node);
        range.setStartAfter(node);
        range.setEndAfter(node);
        selection.removeAllRanges();
        selection.addRange(range);
        syncEditorToTemplate();
        return;
      }
    }
    editorRef.current.innerText += (editorRef.current.innerText ? '\n' : '') + '• ';
    syncEditorToTemplate();
  };

  const handleInsertVariableBadge = () => {
    const varName = prompt('Digite o nome da nova variável (ex: SINTOMAS, OBJETIVO):');
    if (!varName?.trim()) return;
    const cleanName = varName.trim().toUpperCase();
    const badgeHTML = `<span contenteditable="false" data-var="${cleanName}" class="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-xs px-2 py-0.5 rounded-md font-bold mx-1 shadow-sm select-none">⚡ {{ ${cleanName} }}</span>&nbsp;`;
    handleEditorCommand('insertHTML', badgeHTML);
  };

  // ── Geração ───────────────────────────────────────────────
  const callGemini = async (prompt, isJson = false) => {
    const response = await callGeminiWithFallback({ prompt, jsonMode: isJson, model: activeModel });
    return response.text;
  };

  const persistGeneratedAnamnese = async (reportText) => {
    if (!activePatient?.id) return null;
    if (savedAnamneseIdRef.current) {
      return updatePatientAnamnese(savedAnamneseIdRef.current, {
        patient_id: activePatient.id,
        patient_answers: patientData,
        professional_notes: doctorData,
        report: reportText,
      });
    }
    const saved = await createPatientAnamnese({
      organizationId,
      patientId: activePatient.id,
      patientAnswers: patientData,
      professionalNotes: doctorData,
      report: reportText,
    });
    savedAnamneseIdRef.current = saved?.id || null;
    return saved;
  };

  const generateReport = async () => {
    setIsGenerating(true);
    setPatientTranslation('');
    setClinicInsights('');
    setActiveResultView('main');
    setActiveTab('result');
    try {
      const tags = template.match(/\{\{\s*[\wÀ-ÿ0-9_\-\s]+\s*\}\}/g) || [];
      if (tags.length === 0) {
        setResult(template);
        await persistGeneratedAnamnese(template);
        return;
      }
      const variableNames = extractVariableNames(template);
      const prompt = buildGenerationPrompt(patientData, doctorData, variableNames);
      const responseText = await callGemini(prompt, true);
      const cleanJsonStr = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const aiData = JSON.parse(cleanJsonStr);

      let finalReport = template;
      variableNames.forEach(name => {
        const matchedKey = Object.keys(aiData).find(k => k.trim().toLowerCase() === name.toLowerCase()) || name;
        const val = aiData[matchedKey] !== undefined ? aiData[matchedKey] : 'Não informado';
        finalReport = replaceVariable(finalReport, name, val);
      });

      setResult(finalReport);
      await persistGeneratedAnamnese(finalReport);
      showNotification('Anamnese processada e preenchida com sucesso!', 'success');
    } catch (error) {
      showNotification(`Erro no processamento: ${error.message}`, 'error');
      setResult(`Erro na geração: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExtraAnalysis = async (type) => {
    if (!result) return;
    setIsExtraLoading(true);
    try {
      const prompt = type === 'patient'
        ? buildPatientTranslationPrompt(result)
        : buildClinicInsightsPrompt(patientData, doctorData, result);
      const text = await callGemini(prompt);
      if (type === 'patient') {
        setPatientTranslation(text);
        await updatePatientAnamnese(savedAnamneseIdRef.current, { patient_translation: text });
        setActiveResultView('patient');
        showNotification('Tradução para o paciente criada com sucesso!', 'success');
      } else {
        setClinicInsights(text);
        await updatePatientAnamnese(savedAnamneseIdRef.current, { clinic_insights: text });
        setActiveResultView('clinic');
        showNotification('Insights de retorno criados com sucesso!', 'success');
      }
    } catch {
      showNotification('Erro na análise secundária.', 'error');
    } finally {
      setIsExtraLoading(false);
    }
  };

  const saveEditedReport = async () => {
    if (!result || !activePatient?.id) return;
    setIsSavingReport(true);
    try {
      await persistGeneratedAnamnese(result);
      showNotification('Anamnese atualizada no prontuário!', 'success');
    } catch (error) {
      showNotification(`Erro ao atualizar prontuário: ${error.message}`, 'error');
    } finally {
      setIsSavingReport(false);
    }
  };

  // ── Clipboard e download ──────────────────────────────────
  const copyToClipboard = async (text) => {
    if (!text) return;
    const clean = cleanMarkdownToText(text);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(clean);
        showNotification('Copiado limpo sem asteriscos! Cole com Ctrl+V no WebDiet.', 'success');
        return;
      }
    } catch (e) { console.warn('writeText falhou, tentando fallback:', e); }
    try {
      const el = document.createElement('textarea');
      el.value = clean;
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      showNotification('Copiado com sucesso p/ WebDiet!', 'success');
    } catch {
      showNotification('Erro ao copiar.', 'error');
    }
  };

  // ── Dados Demo ────────────────────────────────────────────
  const loadDemoData = () => {
    setPatientData(DEMO_PATIENT);
    setDoctorData(DEMO_DOCTOR);
    if (!template) setTemplate(DEMO_TEMPLATE);
  };

  // ── Gestão de templates ───────────────────────────────────
  const saveTemplate = async () => {
    if (!template.trim()) return;
    if (!templateNameInput.trim() && !selectedTemplateId) return showNotification('Informe um nome para o modelo!', 'error');
    try {
      const current = savedTemplates.find(item => item.id === selectedTemplateId);
      const saved = await saveDocumentTemplate({
        id: selectedTemplateId || null,
        organizationId,
        templateType: 'anamnese',
        name: templateNameInput || current?.name || 'Modelo de anamnese',
        content: template,
      });
      setSavedTemplates(prev => selectedTemplateId
        ? prev.map(item => item.id === saved.id ? saved : item)
        : [saved, ...prev]);
      setSelectedTemplateId(saved.id);
      setTemplateNameInput(saved.name);
      showNotification('Modelo salvo na nuvem!', 'success');
    } catch (error) {
      showNotification(`Erro ao salvar modelo: ${error.message}`, 'error');
    }
  };

  const loadTemplate = (id) => {
    const found = savedTemplates.find(t => t.id === id);
    if (found) { setSelectedTemplateId(found.id); setTemplate(found.content); }
    else { setSelectedTemplateId(''); setTemplate(''); }
  };

  const clearTemplate = () => {
    setSelectedTemplateId('');
    setTemplate('');
    setTemplateNameInput('');
  };

  const handleFileUpload = async (file, setter) => {
    try {
      const text = await readDocument(file);
      setter(text);
      showNotification('Arquivo carregado!', 'success');
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  return {
    // Estado de dados
    hasActivePatient: Boolean(activePatient?.id),
    patientData, setPatientData,
    doctorData, setDoctorData,
    template, setTemplate,
    savedTemplates,
    selectedTemplateId,
    templateNameInput, setTemplateNameInput,
    result, setResult,
    patientTranslation,
    clinicInsights,
    activeResultView, setActiveResultView,
    detectedVars,
    // UI
    activeTab, setActiveTab,
    notification,
    isGenerating,
    isSavingReport,
    isExtraLoading,
    isLoadingTemplates,
    editorRef,
    // Handlers
    generateReport,
    saveEditedReport,
    handleExtraAnalysis,
    copyToClipboard,
    cleanMarkdownToText,
    loadDemoData,
    saveTemplate,
    loadTemplate,
    clearTemplate,
    handleEditorCommand,
    handleInsertBullet,
    handleInsertVariableBadge,
    syncEditorToTemplate,
    handleFileUpload,
  };
}
