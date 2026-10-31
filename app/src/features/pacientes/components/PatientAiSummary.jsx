import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  X,
} from 'lucide-react';
import { callGeminiWithFallback } from '../../../shared/services/aiClient.js';
import { fetchConversations } from '../../atendimento/services/conversations.js';
import { getTasks } from '../../tarefas/services/taskStorage.js';
import { loadCurrentDraft } from '../../dietas/services/dietStorageService.js';
import { normalizePatientPhone } from '../domain/phone.js';
import { supabase } from '../../../shared/services/supabase.js';

const STORAGE_PREFIX = 'nutrisa_patient_ai_summary_';

const handleBackdropClick = (event) => {
  if (event.target !== event.currentTarget) return;
  if ('closedBy' in HTMLDialogElement.prototype) return;

  const rect = event.currentTarget.getBoundingClientRect();
  const clickedInside = (
    event.clientX >= rect.left
    && event.clientX <= rect.right
    && event.clientY >= rect.top
    && event.clientY <= rect.bottom
  );

  if (!clickedInside) event.currentTarget.close();
};

function getStoredSummary(patientId) {
  if (!patientId) return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${patientId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStoredSummary(patientId, data) {
  if (!patientId) return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${patientId}`, JSON.stringify(data));
  } catch (err) {
    console.warn('Erro ao salvar resumo no localStorage:', err);
  }
}

function calculateAge(birthDate) {
  if (!birthDate) return null;
  const birth = new Date(`${birthDate}T12:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age > 0 ? age : null;
}

function formatGeneratedDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function cleanMarkdownPreview(text) {
  if (!text) return '';
  return text
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^[-•]\s+/gm, '')
    .replace(/\n+/g, ' ')
    .trim();
}

function renderMarkdownHTML(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*([\s\S]*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
    .replace(/\*([\s\S]*?)\*/g, '<em class="italic text-slate-800">$1</em>')
    .replace(/^### (.*$)/gim, '<h4 class="text-xs font-black text-emerald-800 uppercase tracking-wide mt-4 mb-1.5 flex items-center gap-1.5">$1</h4>')
    .replace(/^## (.*$)/gim, '<h3 class="text-sm font-black text-slate-900 mt-5 mb-2 pb-1 border-b border-slate-100 flex items-center gap-1.5">$1</h3>')
    .replace(/^# (.*$)/gim, '<h2 class="text-base font-black text-slate-900 mt-5 mb-2 pb-1 border-b border-slate-100">$1</h2>')
    .replace(/^\s*[-•]\s*(.*$)/gim, '<li class="ml-4 list-disc text-slate-700 leading-relaxed">$1</li>')
    .replace(/\r\n/g, '<br>')
    .replace(/\n/g, '<br>');
}

export default function PatientAiSummary({ patient, activeModel }) {
  const dialogRef = useRef(null);
  const [summary, setSummary] = useState('');
  const [generatedAt, setGeneratedAt] = useState(null);
  const [modelUsed, setModelUsed] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sincroniza abertura e fechamento do diálogo nativo
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isModalOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isModalOpen && dialog.open) {
      dialog.close();
    }
  }, [isModalOpen]);

  // Carrega o resumo armazenado quando o paciente selecionado mudar
  useEffect(() => {
    if (!patient?.id) {
      setSummary('');
      setGeneratedAt(null);
      setModelUsed('');
      setError('');
      setIsModalOpen(false);
      return;
    }

    const cached = getStoredSummary(patient.id);
    if (cached?.summary) {
      setSummary(cached.summary);
      setGeneratedAt(cached.generatedAt || null);
      setModelUsed(cached.modelUsed || '');
    } else if (patient.metadata?.ai_summary) {
      setSummary(patient.metadata.ai_summary);
      setGeneratedAt(patient.metadata.ai_summary_at || null);
      setModelUsed(patient.metadata.ai_summary_model || '');
    } else {
      setSummary('');
      setGeneratedAt(null);
      setModelUsed('');
    }
    setError('');
  }, [patient?.id, patient?.metadata]);

  const handleCopy = useCallback(async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = summary;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [summary]);

  const handleGenerate = useCallback(async () => {
    if (!patient?.id || isLoading) return;
    setIsLoading(true);
    setError('');

    try {
      const patientPhone = normalizePatientPhone(patient.whatsapp_phone || patient.phone);

      // 1. Coleta de conversas do WhatsApp vinculadas ao paciente
      let matchedConversations = [];
      try {
        const allConversations = await fetchConversations({ limit: 200 });
        if (Array.isArray(allConversations)) {
          matchedConversations = allConversations.filter((c) => {
            const rawPhone = c.telefone_paciente || c.contact_phone || c.phone || '';
            const cPhone = rawPhone ? normalizePatientPhone(rawPhone) : '';
            if (patientPhone && cPhone && (patientPhone === cPhone || cPhone.endsWith(patientPhone) || patientPhone.endsWith(cPhone))) {
              return true;
            }
            const contactName = (c.nome_paciente || c.contact_name || '').trim().toLowerCase();
            if (contactName && patient.full_name && contactName === patient.full_name.trim().toLowerCase()) {
              return true;
            }
            return false;
          });
        }
      } catch (convErr) {
        console.warn('Conversas não disponíveis para o resumo:', convErr);
      }

      // 2. Coleta de tarefas do paciente
      let matchedTasks = [];
      try {
        const allTasks = getTasks();
        if (Array.isArray(allTasks)) {
          matchedTasks = allTasks.filter((t) => {
            if (t.patientPhone && patientPhone && normalizePatientPhone(t.patientPhone) === patientPhone) return true;
            if (t.patientName && patient.full_name && t.patientName.trim().toLowerCase().includes(patient.full_name.trim().toLowerCase())) return true;
            return false;
          });
        }
      } catch (taskErr) {
        console.warn('Tarefas não disponíveis para o resumo:', taskErr);
      }

      // 3. Coleta de plano alimentar / draft
      let matchedDiet = null;
      try {
        const draft = loadCurrentDraft();
        if (draft && (draft.patient_id === patient.id || (draft.patient_name && draft.patient_name.toLowerCase() === patient.full_name.toLowerCase()))) {
          matchedDiet = draft;
        }
      } catch {}

      const age = calculateAge(patient.birth_date);

      const activeNutri = getActiveNutritionist();
      const nutriName = activeNutri?.name || 'Nutricionista Responsável';
      const clinicName = activeNutri?.clinic || 'Consultório de Nutrição';

      // 4. Montagem do prompt para a IA Clínica
      const systemInstruction = `Você é a IA clínica assistente do consultório "${clinicName}", atuando em apoio técnico ao acompanhamento nutricional liderado por ${nutriName}.
Seu objetivo é gerar uma síntese clínica inteligente 360° estruturada, direta e de alto valor prático sobre o paciente informado, cruzando todos os dados disponíveis (cadastro, WhatsApp, tarefas e plano alimentar).

Organize o texto com títulos e tópicos claros em Markdown:
1. 👤 **Identidade & Momento Clínico**: Perfil, idade, objetivo aparente, estágio no consultório e observações.
2. 💬 **Histórico no WhatsApp & Principais Dúvidas**: Data e hora da última conversa, frequência de mensagens, principais dúvidas ou pedidos feitos no chat.
3. 📋 **Demandas & Acompanhamento**: Status das tarefas clínicas pendentes ou concluídas e status do plano alimentar.
4. 💡 **Recomendações e Próximos Passos**: O que ${nutriName} ou a equipe de atendimento devem priorizar no próximo contato ou consulta.

Seja objetivo, profissional e foque em pontos clínicos acionáveis. Não invente dados ausentes; apenas indique com clareza o que consta ou não no histórico.`;

      const prompt = `Gere o Resumo Clínico 360° para o paciente abaixo:

DADOS CADASTRAIS:
- Nome completo: ${patient.full_name}
- Nome preferido: ${patient.preferred_name || 'Não informado'}
- Idade estimada: ${age ? `${age} anos` : 'Não informada'} (Nascimento: ${patient.birth_date || 'Não informado'})
- Sexo: ${patient.sex || 'Não informado'}
- Telefone: ${patient.phone || 'Não informado'} | WhatsApp: ${patient.whatsapp_phone || 'Não informado'}
- E-mail: ${patient.email || 'Não informado'}
- Origem de captação: ${patient.acquisition_source || 'Não informada'}
- Estágio de relacionamento: ${patient.lifecycle_stage || 'lead'}
- Observações cadastradas: ${patient.notes || 'Nenhuma observação cadastrada.'}

HISTÓRICO NO WHATSAPP (${matchedConversations.length} registro(s) encontrado(s)):
${matchedConversations.length > 0
  ? matchedConversations.slice(0, 5).map((c, i) =>
      `• Atendimento ${i + 1}: Data: ${c.data_envio || c.last_message_at || 'Não informada'} | Categoria: ${c.categoria || c.category || 'Geral'} | Mensagem: "${(c.mensagem_texto || c.conteudo_mensagem || c.last_message || c.message || c.summary || '').slice(0, 300)}"`
    ).join('\n')
  : 'Nenhum registro de conversa localizado no WhatsApp para este número/nome.'}

TAREFAS E DEMANDAS OPERACIONAIS (${matchedTasks.length} encontrada(s)):
${matchedTasks.length > 0
  ? matchedTasks.map(t => `• [${t.status === 'completed' ? 'Concluída' : 'Pendente'}] ${t.title} (Categoria: ${t.category || 'Geral'}, Prazo: ${t.dueDate || 'Sem prazo'})`).join('\n')
  : 'Nenhuma tarefa ou demanda associada a este paciente.'}

${matchedDiet ? `PLANO ALIMENTAR:\n• Título: ${matchedDiet.title || 'Plano Alimentar'}\n• Metas: ${matchedDiet.target_calories ? `${matchedDiet.target_calories} kcal` : 'Calorias livres'}\n• Refeições: ${(matchedDiet.meals || []).map(m => m.name).join(', ')}` : ''}`;

      const { text, modelUsed: usedModel } = await callGeminiWithFallback({
        prompt,
        systemInstruction,
        model: activeModel,
      });

      const nowIso = new Date().toISOString();

      // 5. Salva na base de dados (localStorage + Supabase se disponível)
      saveStoredSummary(patient.id, {
        summary: text,
        generatedAt: nowIso,
        modelUsed: usedModel,
      });

      try {
        if (supabase) {
          await supabase
            .from('patients')
            .update({
              metadata: {
                ...(patient.metadata || {}),
                ai_summary: text,
                ai_summary_at: nowIso,
                ai_summary_model: usedModel || null,
              },
            })
            .eq('id', patient.id);
        }
      } catch (dbErr) {
        console.warn('Persistência remota em background não concluída:', dbErr);
      }

      setSummary(text);
      setGeneratedAt(nowIso);
      setModelUsed(usedModel || '');
    } catch (err) {
      console.error('Erro ao gerar resumo com IA:', err);
      setError(err.message || 'Não foi possível gerar a síntese do paciente. Verifique a conexão com a IA.');
    } finally {
      setIsLoading(false);
    }
  }, [patient, activeModel, isLoading]);

  const previewText = cleanMarkdownPreview(summary);

  return (
    <>
      {/* Card no mesmo estilo exato dos outros cartões de informação do paciente */}
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
            <span>Resumo com IA</span>
          </div>

          <div className="flex items-center gap-1.5">
            {summary && !isLoading ? (
              <>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="inline-flex size-6 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/70 hover:text-emerald-700 transition-colors"
                  title="Regerar resumo com IA"
                >
                  <RefreshCw className="size-3" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex size-6 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/70 hover:text-emerald-700 transition-colors"
                  title="Copiar resumo"
                >
                  {copied ? (
                    <Check className="size-3 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <Copy className="size-3" aria-hidden="true" />
                  )}
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-1.5 break-words text-[0.6875rem] font-medium leading-4 text-slate-700">
          {error ? (
            <div className="flex items-center justify-between gap-2 text-rose-700">
              <span className="truncate">{error}</span>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isLoading}
                className="shrink-0 font-bold underline hover:text-rose-900"
              >
                Tentar novamente
              </button>
            </div>
          ) : isLoading ? (
            <div className="flex items-center gap-2 py-1 text-slate-500">
              <RefreshCw className="size-3 animate-spin text-emerald-600 shrink-0" aria-hidden="true" />
              <span>Gerando síntese clínica com IA…</span>
            </div>
          ) : summary ? (
            <div className="flex flex-col gap-1.5">
              <p
                onClick={() => setIsModalOpen(true)}
                className="line-clamp-2 cursor-pointer text-slate-700 hover:text-slate-900 transition-colors"
                title="Clique para ver o resumo completo"
              >
                {previewText}
              </p>
              <div className="flex items-center justify-between pt-0.5 text-[10px] text-slate-400">
                <span>{generatedAt ? `Atualizado em ${formatGeneratedDate(generatedAt)}` : ''}</span>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  Ver completo →
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 py-0.5">
              <span className="text-slate-400">Nenhum resumo gerado ainda.</span>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isLoading}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-emerald-700 transition-colors"
              >
                <Sparkles className="size-3" aria-hidden="true" />
                <span>Gerar com IA</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Diálogo nativo HTML <dialog> com Top Layer e classes do sistema (.settings-dialog) */}
      <dialog
        ref={dialogRef}
        closedby="any"
        aria-labelledby="ai-summary-modal-title"
        className="settings-dialog print:hidden"
        onClick={handleBackdropClick}
        onClose={() => setIsModalOpen(false)}
      >
        <div className="settings-dialog__panel" onClick={(e) => e.stopPropagation()}>
          {/* Cabeçalho do Modal */}
          <header className="app-modal-header flex items-center justify-between px-6 py-4.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <Sparkles className="size-5 shrink-0 text-emerald-600" aria-hidden="true" />
              <div className="min-w-0">
                <h3 id="ai-summary-modal-title" className="truncate text-base font-black text-slate-900">
                  Resumo do Paciente • {patient.full_name}
                </h3>
                {generatedAt ? (
                  <p className="text-[11px] font-medium text-slate-400">
                    Atualizado em {formatGeneratedDate(generatedAt)}
                    {modelUsed ? ` • Modelo: ${modelUsed}` : ''}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-100 transition-colors active:scale-95"
                title="Copiar conteúdo"
              >
                {copied ? (
                  <>
                    <Check className="size-3.5 text-emerald-600" aria-hidden="true" />
                    <span className="text-emerald-700">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5 text-slate-500" aria-hidden="true" />
                    <span>Copiar</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="inline-flex size-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                aria-label="Fechar resumo"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
          </header>

          {/* Corpo com Scroll Suave */}
          <div className="settings-dialog__body app-modal-body px-6 py-5">
            {isLoading ? (
              <div className="py-12 text-center space-y-2">
                <RefreshCw className="mx-auto size-6 animate-spin text-emerald-600" aria-hidden="true" />
                <p className="text-xs font-bold text-slate-600">Atualizando resumo do paciente com IA…</p>
              </div>
            ) : (
              <div
                className="text-xs leading-relaxed text-slate-700 sm:text-sm space-y-2"
                dangerouslySetInnerHTML={{ __html: renderMarkdownHTML(summary) }}
              />
            )}
          </div>

          {/* Rodapé do Modal */}
          <footer className="app-modal-footer flex items-center justify-between px-6 py-3.5">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`size-3.5 text-emerald-600 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>Regerar com IA</span>
            </button>

            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
            >
              Fechar
            </button>
          </footer>
        </div>
      </dialog>
    </>
  );
}
