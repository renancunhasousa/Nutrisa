import { useState, useEffect, useRef, useCallback } from 'react';
import { KEY_CONTRACTS_PLAN_HISTORY, KEY_CONTRACT_TEMPLATES, KEY_LAST_CONTRACT_TEMPLATE_ID } from '../../../config/storageKeys';
import { createRemoteContract, getRemoteContract } from '../services/contracts';
import { callGeminiWithFallback } from '../../../shared/services/aiClient.js';
import { useAuth } from '../../auth/useAuth.js';
import { consumePatientHandoff } from '../../pacientes/services/patientHandoff.js';
import { usePatient } from '../../pacientes/usePatient.js';
import { consumeClinicalRecordHandoff } from '../../pacientes/services/clinicalRecords.js';
import { deleteDocumentTemplate, importLocalDocumentTemplates, listDocumentTemplates, saveDocumentTemplate } from '../../../shared/services/documentTemplates.js';
import { getContractVariableBadgeHTML, replaceContractVariables, formatContractTemplateToHTML, extractContractVariables } from '../domain/contractVariables';
import {
  listContractPlans,
  saveContractPlan,
  deleteContractPlan,
  DEFAULT_CONTRACT_PLANS,
} from '../services/contractPlansService';

const createPage = (label) => ({
  id: Date.now().toString() + Math.random().toString(36).slice(2),
  label,
  content: '',
});

export function useContratos(activeModel, nutritionist = null) {
  const { organizationId } = useAuth();
  const [patientHandoff] = useState(() => consumePatientHandoff('contratos'));
  const [openedRecord] = useState(() => consumeClinicalRecordHandoff('contrato'));
  const [activeTab, setActiveTab] = useState(() => openedRecord ? 'template' : 'input'); // input, template, result
  const { selectedPatient } = usePatient();
  const activePatient = selectedPatient || patientHandoff;

  // Passo 1: Dados do Paciente e Plano
  const [patientData, setPatientData] = useState(() => ({
    name: activePatient?.full_name || activePatient?.name || '',
    id: activePatient?.id || null,
  }));

  useEffect(() => {
    setPatientData((current) => ({
      ...current,
      id: activePatient?.id || null,
      name: activePatient?.full_name || activePatient?.name || current.name,
    }));
  }, [activePatient]);

  const [contractPlans, setContractPlans] = useState(() => {
    return DEFAULT_CONTRACT_PLANS.map((p) => ({
      id: p.name.toLowerCase().replace(/\s+/g, '-'),
      label: p.name,
      icon: p.icon || '📋',
      name: p.name,
      defaultPrice: p.default_price || '',
      defaultPaymentMethod: p.default_payment_method || 'Pix',
      description: p.description || '',
      consultasCount: p.consultas_count || 1,
    }));
  });
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState(() => openedRecord?.plan || 'essence');
  const [valor, setValor] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('Pix');
  const [consultas, setConsultas] = useState([{ data: '', horario: '' }]);

  // Passo 2: Estrutura Modelo — Sistema de Múltiplas Páginas
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templateNameInput, setTemplateNameInput] = useState('');
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isDeletingTemplate, setIsDeletingTemplate] = useState(false);

  // Array de páginas: [{ id, label, content }]
  const [pages, setPages] = useState([createPage('Página 1')]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const editorRef = useRef(null);
  const [editorCharCount, setEditorCharCount] = useState(0);
  const [detectedVars, setDetectedVars] = useState([]);

  // Sincroniza conteúdo no editor quando a página ativa mudar ou o componente montar
  useEffect(() => {
    if (editorRef.current && pages[activePageIndex]) {
      const activeContent = pages[activePageIndex].content || '';
      const formatted = formatContractTemplateToHTML(activeContent);
      if (editorRef.current.innerHTML !== formatted) {
        editorRef.current.innerHTML = formatted;
        setEditorCharCount(editorRef.current.innerText.length);
      }
    }
    const currentHTML = editorRef.current?.innerHTML || '';
    const allText = pages.map((p, i) => i === activePageIndex ? currentHTML : (p.content || '')).join(' ');
    setDetectedVars(extractContractVariables(allText));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePageIndex]);

  // Passo 3: Geração Final
  const [assinaturaBase64, setAssinaturaBase64] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Link e Polling da Assinatura Remota
  const [remoteContractId, setRemoteContractId] = useState(openedRecord?.id || null);

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

  // Carregar planos da clínica via Supabase
  useEffect(() => {
    if (!organizationId) return undefined;
    let cancelled = false;

    const loadPlans = async () => {
      setIsLoadingPlans(true);
      try {
        const plans = await listContractPlans(organizationId);
        if (!cancelled && plans && plans.length > 0) {
          setContractPlans(plans.map((p) => ({
            ...p,
            label: p.name,
          })));
        }
      } catch (err) {
        console.error('Erro ao carregar planos de contrato:', err);
      } finally {
        if (!cancelled) setIsLoadingPlans(false);
      }
    };

    loadPlans();
    return () => { cancelled = true; };
  }, [organizationId]);

  // Atualizar valor e forma de pagamento com base no plano selecionado
  useEffect(() => {
    try {
      const matchedPlan = contractPlans.find(
        (p) => p.id === selectedPlan || p.name?.toLowerCase() === selectedPlan?.toLowerCase()
      );

      if (matchedPlan) {
        const methods = Array.isArray(matchedPlan.paymentMethods) && matchedPlan.paymentMethods.length > 0
          ? matchedPlan.paymentMethods
          : null;

        if (methods && methods.length > 0) {
          const firstMethod = methods[0];
          setFormaPagamento(firstMethod.name || 'Pix à vista');
          const pr = Number(firstMethod.price);
          if (!isNaN(pr) && pr > 0) {
            setValor(pr.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
          } else if (matchedPlan.defaultPrice) {
            setValor(
              typeof matchedPlan.defaultPrice === 'number'
                ? matchedPlan.defaultPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : String(matchedPlan.defaultPrice)
            );
          }
          return;
        }

        if (matchedPlan.defaultPrice) {
          setValor(
            typeof matchedPlan.defaultPrice === 'number'
              ? matchedPlan.defaultPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : String(matchedPlan.defaultPrice)
          );
          if (matchedPlan.defaultPaymentMethod) {
            setFormaPagamento(matchedPlan.defaultPaymentMethod);
          }
          return;
        }
      }

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
  }, [selectedPlan, contractPlans]);

  const handleSavePlan = async (planData) => {
    if (!organizationId) {
      throw new Error('Organização não identificada');
    }
    const saved = await saveContractPlan(organizationId, planData);
    setContractPlans((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      const formatted = { ...saved, label: saved.name };
      if (exists) {
        return prev.map((p) => (p.id === saved.id ? formatted : p));
      }
      return [...prev, formatted];
    });

    if (selectedPlan === saved.id || selectedPlan === planData.id) {
      setSelectedPlan(saved.id);
      const firstMethod = Array.isArray(saved.paymentMethods) && saved.paymentMethods.length > 0 ? saved.paymentMethods[0] : null;
      const targetPrice = firstMethod?.price != null ? Number(firstMethod.price) : Number(saved.defaultPrice || 0);
      const targetMethod = firstMethod?.name || saved.defaultPaymentMethod || 'Pix à vista';
      if (targetPrice > 0) {
        setValor(targetPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      } else if (saved.defaultPrice) {
        setValor(
          typeof saved.defaultPrice === 'number'
            ? saved.defaultPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : String(saved.defaultPrice)
        );
      }
      if (targetMethod) {
        setFormaPagamento(targetMethod);
      }
    }
    return saved;
  };

  const handleDeletePlan = async (planId) => {
    await deleteContractPlan(planId);
    setContractPlans((prev) => {
      const next = prev.filter((p) => p.id !== planId);
      if (selectedPlan === planId && next.length > 0) {
        setSelectedPlan(next[0].id);
      }
      return next;
    });
  };

  const applyTemplatePages = useCallback((templateItem) => {
    if (!templateItem) return;
    setTemplateNameInput(templateItem.name || '');
    if (templateItem.pages && Array.isArray(templateItem.pages)) {
      const formattedPages = templateItem.pages.map(p => ({
        ...p,
        content: formatContractTemplateToHTML(p.content || ''),
      }));
      setPages(formattedPages);
      setActivePageIndex(0);
      if (editorRef.current) editorRef.current.innerHTML = formattedPages[0]?.content || '';
      setEditorCharCount(editorRef.current?.innerText.length || 0);
      const allText = formattedPages.map(p => p.content || '').join(' ');
      setDetectedVars(extractContractVariables(allText));
    } else if (templateItem.content) {
      // Migração de template antigo (content string → pages array)
      const formattedContent = formatContractTemplateToHTML(templateItem.content);
      const migrated = [{ ...createPage('Página 1'), content: formattedContent }];
      setPages(migrated);
      setActivePageIndex(0);
      if (editorRef.current) editorRef.current.innerHTML = formattedContent;
      setEditorCharCount(editorRef.current?.innerText.length || 0);
      setDetectedVars(extractContractVariables(formattedContent));
    }
  }, []);

  // Carregar templates (Passo 2)
  useEffect(() => {
    if (!organizationId) return undefined;
    let cancelled = false;
    const loadTemplates = async () => {
      setIsLoadingTemplates(true);
      try {
        const templatesStr = localStorage.getItem(KEY_CONTRACT_TEMPLATES);
        const localTemplates = templatesStr ? JSON.parse(templatesStr) : [];
        if (localTemplates.length) {
          await importLocalDocumentTemplates({ organizationId, templateType: 'contrato', templates: localTemplates });
          localStorage.removeItem(KEY_CONTRACT_TEMPLATES);
        }
        const remoteTemplates = await listDocumentTemplates(organizationId, 'contrato');
        if (!cancelled) {
          setSavedTemplates(remoteTemplates);
          // Restaura o último modelo de contrato selecionado
          const lastTemplateId = localStorage.getItem(KEY_LAST_CONTRACT_TEMPLATE_ID);
          if (lastTemplateId) {
            const found = remoteTemplates.find(x => x.id === lastTemplateId);
            if (found) {
              setSelectedTemplateId(found.id);
              applyTemplatePages(found);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar modelos de contrato:', error);
        if (!cancelled) alert('Erro ao carregar modelos de contrato: ' + error.message);
      } finally {
        if (!cancelled) setIsLoadingTemplates(false);
      }
    };
    loadTemplates();
    return () => { cancelled = true; };
  }, [organizationId, applyTemplatePages]);

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
    const updatedHtml = editorRef.current.innerHTML;
    setPages(prev => {
      const nextPages = prev.map((p, i) =>
        i === activePageIndexRef.current ? { ...p, content: updatedHtml } : p
      );
      const allText = nextPages.map(p => p.content || '').join(' ');
      setDetectedVars(extractContractVariables(allText));
      return nextPages;
    });
  };

  // Templates
  const saveTemplate = async () => {
    if (!templateNameInput.trim()) return alert('Dê um nome ao modelo!');
    const currentContent = editorRef.current?.innerHTML || '';
    const allPages = pages.map((p, i) =>
      i === activePageIndex ? { ...p, content: currentContent } : p
    );
    try {
      const saved = await saveDocumentTemplate({
        organizationId,
        templateType: 'contrato',
        name: templateNameInput,
        content: allPages,
      });
      setSavedTemplates(prev => [saved, ...prev]);
      setSelectedTemplateId(saved.id);
      localStorage.setItem(KEY_LAST_CONTRACT_TEMPLATE_ID, saved.id);
      alert('Modelo de contrato salvo na nuvem!');
    } catch (error) {
      alert('Erro ao salvar modelo de contrato: ' + error.message);
    }
  };

  const loadTemplate = (id) => {
    setSelectedTemplateId(id);
    if (!id) {
      localStorage.removeItem(KEY_LAST_CONTRACT_TEMPLATE_ID);
      const blank = [createPage('Página 1')];
      setPages(blank);
      setActivePageIndex(0);
      if (editorRef.current) editorRef.current.innerHTML = '';
      setEditorCharCount(0);
      setDetectedVars([]);
      setTemplateNameInput('');
      return;
    }
    localStorage.setItem(KEY_LAST_CONTRACT_TEMPLATE_ID, id);
    const t = savedTemplates.find(x => x.id === id);
    if (t) {
      applyTemplatePages(t);
    }
  };

  const deleteTemplate = async () => {
    if (!selectedTemplateId) return;
    const selected = savedTemplates.find(item => item.id === selectedTemplateId);
    if (!window.confirm(`Excluir o modelo "${selected?.name || 'selecionado'}"? Esta ação não pode ser desfeita.`)) return;
    setIsDeletingTemplate(true);
    try {
      await deleteDocumentTemplate({ id: selectedTemplateId, organizationId, templateType: 'contrato' });
      setSavedTemplates(prev => prev.filter(item => item.id !== selectedTemplateId));
      loadTemplate('');
      localStorage.removeItem(KEY_LAST_CONTRACT_TEMPLATE_ID);
      alert('Modelo de contrato excluído da nuvem.');
    } catch (error) {
      alert('Erro ao excluir modelo de contrato: ' + error.message);
    } finally {
      setIsDeletingTemplate(false);
    }
  };

  const handleInsertVariableBadge = (variableName) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const badgeHTML = getContractVariableBadgeHTML(variableName);
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && editorRef.current.contains(selection.anchorNode)) {
      document.execCommand('insertHTML', false, badgeHTML);
    } else {
      editorRef.current.innerHTML += badgeHTML;
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
      const allPages = getAllPagesHTML();
      const renderedPages = allPages.map(page =>
        replaceContractVariables(page, {
          paciente: patientData,
          plano: selectedPlan,
          valor,
          formaPagamento,
          consultas,
          nutritionist,
          organizationId,
        })
      );
      const finalContent = renderedPages.join('<br><hr class="my-6 border-slate-200"><br>');

      const contract = await createRemoteContract({
        id: openedRecord?.id || null,
        organizationId,
        patientId: patientData?.id || null,
        patientName: patientData?.name || 'Paciente',
        plan: selectedPlan,
        finalContent,
      });

      const url = `${window.location.origin}/#sign-${contract.public_token}`;
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
  const [aiMode, setAiMode] = useState('append'); // 'append' (Adicionar ao final) ou 'replace' (Reescrever / Atualizar)
  const [lastAiBackup, setLastAiBackup] = useState(null);

  const handleUndoAi = () => {
    if (lastAiBackup === null || !editorRef.current) return;
    editorRef.current.innerHTML = lastAiBackup;
    syncEditorToTemplate();
    setLastAiBackup(null);
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return alert("Digite o que você quer que a IA gere.");

    setIsGeneratingAi(true);
    try {
      const activeContent = editorRef.current?.innerHTML?.trim() || '';
      const activeText = editorRef.current?.innerText?.trim() || '';
      const totalPages = pages.length;
      const currentPageNum = activePageIndex + 1;

      // Guarda backup do estado atual para permitir desfazer se a usuária desejar
      setLastAiBackup(activeContent);

      const pageInfo = totalPages > 1
        ? `\nO contrato possui ${totalPages} páginas no total. A nutricionista está editando a Página ${currentPageNum}.`
        : '';

      let promptText = '';

      if (aiMode === 'append' && activeText) {
        promptText = `Você é uma advogada especialista em direito da saúde e contratos de prestação de serviço nutricional.
A nutricionista deseja ADICIONAR UMA NOVA CLÁUSULA ao final da página atual do contrato.
Instrução da nutricionista: "${aiPrompt}"${pageInfo}

CLÁUSULAS JÁ EXISTENTES NESTA PÁGINA (apenas para seu contexto de coerência, NÃO repita nada disto):
---
${activeText}
---

Instruções obrigatórias:
- Crie APENAS a nova cláusula ou texto complementar solicitado, sem repetir as cláusulas já existentes.
- A cláusula deve ser juridicamente segura, clara, firme e em tom profissional.
- Não crie título "CONTRATO DE PRESTAÇÃO DE SERVIÇOS" nem cabeçalhos com dados do paciente (já existem no topo do contrato).
- Formate a resposta usando HTML básico adequado para o editor de texto rico (<b>, <br>, <p>, <ul>, <li>).
- Retorne SOMENTE O HTML da nova cláusula. Sem markdown \`\`\`html.`;
      } else {
        // Modo 'replace' (Reescrever / Atualizar) ou se a página estiver em branco
        const contextExisting = activeText
          ? `\n\nCONTEÚDO ATUAL DA PÁGINA QUE DEVE SER ATUALIZADO:\n---\n${activeText}\n---\n\nInstrução específica de alteração da nutricionista:\n"${aiPrompt}"`
          : `\n\nA nutricionista deseja criar as cláusulas do zero com base nesta instrução:\n"${aiPrompt}"`;

        promptText = `Você é uma advogada especialista em direito da saúde e contratos de prestação de serviço nutricional.${pageInfo}${contextExisting}

Instruções obrigatórias:
- Se já houver conteúdo existente, PRESERVE integralmente todas as cláusulas e termos que a nutricionista NÃO pediu para alterar.
- Modifique, atualize ou acrescente com precisão cirúrgica apenas as regras e pontos solicitados na instrução da nutricionista.
- Não crie título "CONTRATO DE PRESTAÇÃO DE SERVIÇOS" nem campos como (Nome do Paciente), (Valor), etc., pois isso já estará no cabeçalho do documento.
- Use linguagem acessível, mas firme em relação a direitos e deveres (atrasos, faltas, política de cancelamento).
- Formate a resposta usando HTML básico adequado para o editor de texto rico (<b>, <br>, <p>, <ul>, <li>).
- Retorne o HTML COMPLETO da página para o editor. Sem markdown \`\`\`html.`;
      }

      const response = await callGeminiWithFallback({
        prompt: promptText,
        model: activeModel,
        jsonMode: false,
      });

      const rawResult = response.text || response || '';
      const generatedHtml = rawResult.replace(/^```html\s*/i, '').replace(/```$/i, '').trim();
      const formattedHtml = formatContractTemplateToHTML(generatedHtml);

      if (editorRef.current) {
        if (aiMode === 'append' && activeContent) {
          editorRef.current.innerHTML = `${activeContent}<br><p>${formattedHtml}</p>`;
        } else {
          editorRef.current.innerHTML = formattedHtml;
        }
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
    hasActivePatient: Boolean(activePatient?.id),
    activeTab, setActiveTab,
    patientData, setPatientData,
    selectedPlan, setSelectedPlan,
    contractPlans, setContractPlans,
    isPlansModalOpen, setIsPlansModalOpen,
    isLoadingPlans,
    handleSavePlan, handleDeletePlan,
    valor, setValor, handleSetValor,
    formaPagamento, setFormaPagamento,
    consultas, setConsultas,
    savedTemplates, selectedTemplateId,
    isLoadingTemplates,
    isDeletingTemplate,
    templateNameInput, setTemplateNameInput,
    // Sistema de páginas
    pages, activePageIndex,
    addPage, removePage, switchPage,
    editorRef, editorCharCount,
    detectedVars,
    getAllPagesHTML, getAllPagesText,
    assinaturaBase64, setAssinaturaBase64,
    isGenerating,
    aiPrompt, setAiPrompt, isGeneratingAi, handleGenerateAI,
    aiMode, setAiMode, lastAiBackup, handleUndoAi,
    saveTemplate, loadTemplate, deleteTemplate, handleInsertVariableBadge, syncEditorToTemplate,
    handleGerarPDF, handleGerarLink,
    organizationId, nutritionist,
  };
}
