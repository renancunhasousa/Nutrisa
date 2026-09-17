import { useState, useEffect, useRef, useCallback } from 'react';
import { KEY_CONTRACTS_PLAN_HISTORY, KEY_CONTRACTS_CONFIG } from '../../../config/storageKeys';
import { defaultClauses } from '../domain/defaultClauses';
import { createRemoteContract, getRemoteContract } from '../services/contracts';
import { callGeminiWithFallback } from '../../../shared/services/aiClient.js';

const createPage = (label) => ({
  id: Date.now().toString() + Math.random().toString(36).slice(2),
  label,
  content: '',
});

export function useContratos(activeModel) {
  const [activeTab, setActiveTab] = useState('input'); // input, template, result

  // Passo 1: Dados do Paciente e Plano
  const [patientData, setPatientData] = useState({ name: 'Paciente Selecionado' }); // Mock
  const [selectedPlan, setSelectedPlan] = useState('essence');
  const [valor, setValor] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('Pix');
  const [consultas, setConsultas] = useState([{ data: '', horario: '' }]);

  // Passo 2: Estrutura Modelo — Sistema de Múltiplas Páginas
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templateNameInput, setTemplateNameInput] = useState('');

  // Array de páginas: [{ id, label, content }]
  const [pages, setPages] = useState([createPage('Página 1')]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const editorRef = useRef(null);
  const [editorCharCount, setEditorCharCount] = useState(0);

  // Passo 3: Geração Final
  const [assinaturaBase64, setAssinaturaBase64] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Link e Polling da Assinatura Remota
  const [remoteContractId, setRemoteContractId] = useState(null);

  // Poll for remote signature
  useEffect(() => {
    if (!remoteContractId) return;

    let interval = setInterval(async () => {
      try {
        const contract = await getRemoteContract(remoteContractId);
        if (contract.signature_base64) {
          setAssinaturaBase64(contract.signature_base64);
          setRemoteContractId(null);
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [remoteContractId]);

  // Máscara de moeda para o valor
  const handleSetValor = (val) => {
    let nums = val.replace(/\D/g, "");
    if (!nums) {
      setValor("");
      return;
    }
    nums = (parseInt(nums, 10) / 100).toFixed(2);
    nums = nums.replace(".", ",");
    nums = nums.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    setValor(nums);
  };

  // Carregar histórico de preços (Passo 1)
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
      console.error(e);
    }
  }, [selectedPlan]);

  // Carregar templates (Passo 2)
  useEffect(() => {
    try {
      const templatesStr = localStorage.getItem('nutrisa_contratos_templates');
      if (templatesStr) {
        setSavedTemplates(JSON.parse(templatesStr));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSalvarPreco = () => {
    try {
      const historyStr = localStorage.getItem(KEY_CONTRACTS_PLAN_HISTORY);
      const history = historyStr ? JSON.parse(historyStr) : {};
      history[selectedPlan] = { valor, formaPagamento };
      localStorage.setItem(KEY_CONTRACTS_PLAN_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error(e);
    }
  };

  // Referência mutável ao índice ativo (evita stale closure nas funções de página)
  const activePageIndexRef = useRef(activePageIndex);
  useEffect(() => { activePageIndexRef.current = activePageIndex; }, [activePageIndex]);

  // Flush: salva HTML atual do editor na página ativa do array
  const flushCurrentPage = useCallback((pagesSnapshot) => {
    if (!editorRef.current) return pagesSnapshot;
    const idx = activePageIndexRef.current;
    return pagesSnapshot.map((p, i) =>
      i === idx ? { ...p, content: editorRef.current.innerHTML } : p
    );
  }, []);

  // Troca para outra página, salvando a atual
  const switchPage = useCallback((targetIndex) => {
    setPages(prev => {
      const saved = flushCurrentPage(prev);
      setActivePageIndex(targetIndex);
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = saved[targetIndex]?.content || '';
          setEditorCharCount(editorRef.current.innerText.length);
        }
      }, 0);
      return saved;
    });
  }, [flushCurrentPage]);

  // Adiciona nova página em branco
  const addPage = useCallback(() => {
    setPages(prev => {
      const saved = flushCurrentPage(prev);
      const newPage = createPage(`Página ${saved.length + 1}`);
      const updated = [...saved, newPage];
      const newIndex = updated.length - 1;
      setActivePageIndex(newIndex);
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = '';
          setEditorCharCount(0);
        }
      }, 0);
      return updated;
    });
  }, [flushCurrentPage]);

  // Remove uma página (com confirmação se tiver conteúdo)
  const removePage = useCallback((index) => {
    setPages(prev => {
      if (prev.length === 1) return prev;

      const pageToRemove = prev[index];
      const plainText = pageToRemove.content ? pageToRemove.content.replace(/<[^>]*>/g, '').trim() : '';
      if (plainText.length > 0 && !window.confirm(`Tem certeza que deseja remover a "${pageToRemove.label}"? O conteúdo será perdido.`)) {
        return prev;
      }

      const updated = prev.filter((_, i) => i !== index);
      const renumbered = updated.map((p, i) => ({ ...p, label: `Página ${i + 1}` }));
      const newActiveIndex = Math.min(index, renumbered.length - 1);
      setActivePageIndex(newActiveIndex);

      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = renumbered[newActiveIndex]?.content || '';
          setEditorCharCount(editorRef.current.innerText.length);
        }
      }, 0);

      return renumbered;
    });
  }, []);

  // Sync editor → state (chamado no onInput e onBlur do editor)
  const syncEditorToTemplate = () => {
    if (!editorRef.current) return;
    setEditorCharCount(editorRef.current.innerText.length);
    setPages(prev => prev.map((p, i) =>
      i === activePageIndexRef.current ? { ...p, content: editorRef.current.innerHTML } : p
    ));
  };

  // Templates
  const saveTemplate = () => {
    if (!templateNameInput.trim()) return alert('Dê um nome ao modelo!');
    const currentContent = editorRef.current?.innerHTML || '';
    const allPages = pages.map((p, i) =>
      i === activePageIndex ? { ...p, content: currentContent } : p
    );
    const newTemplate = { id: Date.now().toString(), name: templateNameInput, pages: allPages };
    const updated = [...savedTemplates, newTemplate];
    setSavedTemplates(updated);
    localStorage.setItem('nutrisa_contratos_templates', JSON.stringify(updated));
    setSelectedTemplateId(newTemplate.id);
    alert('Modelo de contrato salvo!');
  };

  const loadTemplate = (id) => {
    setSelectedTemplateId(id);
    if (!id) {
      const blank = [createPage('Página 1')];
      setPages(blank);
      setActivePageIndex(0);
      if (editorRef.current) editorRef.current.innerHTML = '';
      setEditorCharCount(0);
      setTemplateNameInput('');
      return;
    }
    const t = savedTemplates.find(x => x.id === id);
    if (t) {
      setTemplateNameInput(t.name);
      if (t.pages && Array.isArray(t.pages)) {
        setPages(t.pages);
        setActivePageIndex(0);
        if (editorRef.current) editorRef.current.innerHTML = t.pages[0]?.content || '';
        setEditorCharCount(editorRef.current?.innerText.length || 0);
      } else if (t.content) {
        // Migração de template antigo (content string → pages array)
        const migrated = [{ ...createPage('Página 1'), content: t.content }];
        setPages(migrated);
        setActivePageIndex(0);
        if (editorRef.current) editorRef.current.innerHTML = t.content;
        setEditorCharCount(editorRef.current?.innerText.length || 0);
      }
    }
  };

  const handleInsertVariableBadge = (variableName) => {
    if (!editorRef.current) return;
    const tag = `{{${variableName}}}`;
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && editorRef.current.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0);
      const node = document.createTextNode(tag);
      range.insertNode(node);
      range.collapse(false);
    } else {
      editorRef.current.innerHTML += tag;
    }
    syncEditorToTemplate();
  };

  // Retorna conteúdo HTML de todas as páginas (flush a ativa)
  const getAllPagesHTML = () => {
    const currentHTML = editorRef.current?.innerHTML || '';
    return pages.map((p, i) =>
      i === activePageIndex ? currentHTML : (p.content || '')
    );
  };

  // Retorna texto puro de todas as páginas
  const getAllPagesText = () => {
    const currentText = editorRef.current?.innerText || '';
    return pages.map((p, i) => {
      if (i === activePageIndex) return currentText;
      const div = document.createElement('div');
      div.innerHTML = p.content || '';
      return div.innerText;
    });
  };

  const handleGerarPDF = async () => {
    handleSalvarPreco();
    setIsGenerating(true);
    setTimeout(() => {
      window.print();
      setIsGenerating(false);
    }, 300);
  };

  const handleGerarLink = async () => {
    try {
      setIsGenerating(true);
      const allText = getAllPagesText();
      const finalContent = allText.join('\n\n--- Página seguinte ---\n\n');

      const contract = await createRemoteContract({
        patientName: patientData?.name || 'Paciente',
        plan: selectedPlan,
        finalContent,
      });

      const url = `${window.location.origin}/#sign-${contract.id}`;
      await navigator.clipboard.writeText(url);
      setRemoteContractId(contract.id);
      alert('Link copiado para a área de transferência!\n\nEnvie este link para o paciente assinar pelo WhatsApp:\n' + url + '\n\nA tela aguardará automaticamente a assinatura do paciente.');
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar o link: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Assistente de IA ─────────────────────────────────────────────────────

  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return alert("Digite o que você quer que a IA gere.");

    setIsGeneratingAi(true);
    try {
      const activeContent = editorRef.current?.innerText?.trim() || '';
      const totalPages = pages.length;
      const currentPageNum = activePageIndex + 1;

      const contextSection = activeContent
        ? `\n\nCONTEÚDO ATUAL DA PÁGINA ${currentPageNum} (use como contexto para continuar ou complementar, NÃO repita o que já existe):\n---\n${activeContent}\n---`
        : '';

      const pageInfo = totalPages > 1
        ? `\nO contrato possui ${totalPages} páginas no total. A nutricionista está editando a Página ${currentPageNum}.`
        : '';

      const promptText = `Você é uma advogada especialista em direito da saúde e contratos de prestação de serviço nutricional.
A nutricionista está pedindo: "${aiPrompt}"${pageInfo}${contextSection}

Instruções:
- O contrato já possui um cabeçalho com nome do paciente, valor, plano e dados gerais.
- Você deve gerar APENAS O TEXTO DAS CLÁUSULAS de forma clara, direta e juridicamente segura.
- Não crie campos como (Nome do Paciente), (Valor), etc., pois isso já estará no cabeçalho.
- Não crie título "CONTRATO DE PRESTAÇÃO DE SERVIÇOS". Vá direto para as cláusulas.
- Use linguagem acessível, mas firme em relação a direitos e deveres (atrasos, faltas, política de cancelamento).
- Formate a resposta usando HTML básico adequado para o editor de texto rico (<b>, <br>, <p>, <ul>, <li>).
- Retorne SOMENTE O HTML final. Sem markdown \`\`\`html.`;

      const response = await callGeminiWithFallback({
        prompt: promptText,
        model: activeModel,
        jsonMode: false,
      });

      if (editorRef.current) {
        editorRef.current.innerHTML = response.text || response;
        syncEditorToTemplate();
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar cláusulas com a IA: " + error.message);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return {
    activeTab, setActiveTab,
    patientData, setPatientData,
    selectedPlan, setSelectedPlan,
    valor, setValor, handleSetValor,
    formaPagamento, setFormaPagamento,
    consultas, setConsultas,
    savedTemplates, selectedTemplateId,
    templateNameInput, setTemplateNameInput,
    // Sistema de páginas
    pages, activePageIndex,
    addPage, removePage, switchPage,
    editorRef, editorCharCount,
    getAllPagesHTML, getAllPagesText,
    assinaturaBase64, setAssinaturaBase64,
    isGenerating,
    aiPrompt, setAiPrompt, isGeneratingAi, handleGenerateAI,
    saveTemplate, loadTemplate, handleInsertVariableBadge, syncEditorToTemplate,
    handleGerarPDF, handleGerarLink,
  };
}
