import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  RefreshCw,
  MessageSquare,
  Globe,
  Flame,
  Check,
  Send,
  Lightbulb
} from 'lucide-react';
import { SUGGESTED_TOPICS, checkIsDraIsabela } from '../services/postGeneratorService.js';
import { getActiveNutritionist } from '../../configuracoes/services/clinicProfileService.js';

export function PostAIAssistant({
  postData,
  onChangePostData,
  onGenerateWithAI,
  isGeneratingAI,
  whatsappIdeas = [],
  isLoadingWhatsApp = false,
  onLoadWhatsAppIdeas,
  trendingWebTopics = [],
  isLoadingWeb = false,
  onLoadWebTopics
}) {
  const [promptTopic, setPromptTopic] = useState('');
  const [activeIdeaSource, setActiveIdeaSource] = useState('whatsapp');
  const isCarousel = postData.format === 'carrossel';
  const activeNutri = getActiveNutritionist();
  const isIsabela = checkIsDraIsabela(activeNutri);
  const firstName = activeNutri?.name ? activeNutri.name.split(' ')[0] : 'Nutri';
  const format1Label = isIsabela ? 'Dra. Isabela Explica' : `${firstName} Explica`;

  const formatLabels = {
    autoridade: format1Label,
    prato: 'Prato & Performance',
    ciencia: 'Ciência vs Senso Comum',
    dicas: 'Dicas Práticas',
    cta: 'CTA de Consulta',
    manifesto: 'Manifesto Clínico',
    passo: 'Passo Clínico',
    'legacy-content': 'Passo Clínico'
  };

  const handleApplyPresetTopic = (topicItem) => {
    setPromptTopic(topicItem.title);
    if (topicItem.format && topicItem.format !== postData.format) {
      if (onChangePostData) {
        onChangePostData({ ...postData, format: topicItem.format });
      }
    }
  };

  const handleApplyWhatsAppTopic = (idea) => {
    setPromptTopic(idea.title);
    if (idea.format && idea.format !== postData.format) {
      if (onChangePostData) {
        onChangePostData({ ...postData, format: idea.format });
      }
    }
  };

  const handleTriggerAI = (e) => {
    if (e) e.preventDefault();
    if (!promptTopic.trim() && !postData.headline) return;
    onGenerateWithAI(promptTopic.trim() || postData.headline);
  };

  return (
    <div className="space-y-4">
      {/* CABEÇALHO DA IA */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 leading-tight">
                Assistente Criativo &amp; IA Nutricional
              </h4>
              <p className="text-[11px] text-slate-500">
                Gere carrosséis ou posts com embasamento clínico em 1 clique
              </p>
            </div>
          </div>
          {isGeneratingAI && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 animate-pulse border border-emerald-300">
              <Sparkles className="w-3 h-3 text-emerald-600 animate-spin" />
              <span>Criando arte...</span>
            </span>
          )}
        </div>

        {/* INPUT DE TEMA + BOTÃO GERAR */}
        <form onSubmit={handleTriggerAI} className="space-y-2 mt-3">
          <div className="relative">
            <textarea
              rows={3}
              value={promptTopic}
              onChange={(e) => setPromptTopic(e.target.value)}
              placeholder={
                isCarousel
                  ? 'Ex: Jejum intermitente e perda de massa muscular, creatina para mulheres, como estruturar o pré-treino...'
                  : 'Digite o tema ou selecione uma ideia clínica abaixo...'
              }
              className="w-full text-xs text-slate-800 bg-white border border-emerald-200/90 rounded-xl p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 shadow-2xs resize-none placeholder:text-slate-400 font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={isGeneratingAI || (!promptTopic.trim() && !postData.headline)}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
            <span>
              {isGeneratingAI
                ? 'Estruturando publicação com IA...'
                : isCarousel
                ? 'Gerar Carrossel Completo com IA'
                : 'Gerar Conteúdo do Post com IA'}
            </span>
          </button>
        </form>
      </div>

      {/* SELETOR DE FONTES DE IDEIAS */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Fontes de Inspiração &amp; Temas Reais</span>
          </label>
        </div>

        {/* ABAS: WHATSAPP VS TENDÊNCIAS */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveIdeaSource('whatsapp')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeIdeaSource === 'whatsapp'
                ? 'bg-white text-emerald-800 shadow-2xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>Dúvidas WhatsApp</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
              {whatsappIdeas.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveIdeaSource('editoriais')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeIdeaSource === 'editoriais'
                ? 'bg-white text-emerald-800 shadow-2xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-sky-600" />
            <span>Tendências Web</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-sky-100 text-sky-800">
              {((trendingWebTopics && trendingWebTopics.length > 0) ? trendingWebTopics : SUGGESTED_TOPICS).length}
            </span>
          </button>
        </div>

        {/* REFRESH ACTIONS */}
        <div className="flex justify-end">
          {activeIdeaSource === 'whatsapp' && onLoadWhatsAppIdeas && (
            <button
              type="button"
              onClick={onLoadWhatsAppIdeas}
              disabled={isLoadingWhatsApp}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer py-0.5"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingWhatsApp ? 'animate-spin' : ''}`} />
              <span>{isLoadingWhatsApp ? 'Buscando WhatsApp...' : 'Atualizar dúvidas do WhatsApp'}</span>
            </button>
          )}

          {activeIdeaSource === 'editoriais' && onLoadWebTopics && (
            <button
              type="button"
              onClick={onLoadWebTopics}
              disabled={isLoadingWeb}
              className="text-[11px] font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1 cursor-pointer py-0.5"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingWeb ? 'animate-spin' : ''}`} />
              <span>{isLoadingWeb ? 'Buscando Web...' : 'Atualizar tendências da Web'}</span>
            </button>
          )}
        </div>

        {/* LISTAGEM DE CARDS DE TEMAS */}
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {activeIdeaSource === 'whatsapp' ? (
            whatsappIdeas.map((idea, idx) => {
              const isSelected = promptTopic === idea.title;
              const formatLabel = formatLabels[idea.format] || idea.format;

              return (
                <div
                  key={idx}
                  onClick={() => handleApplyWhatsAppTopic(idea)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 shadow-2xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800 leading-snug">
                      💬 {idea.title}
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 bg-slate-100 text-slate-700 border border-slate-200">
                      {formatLabel}
                    </span>
                  </div>

                  {idea.whatsappInsight && (
                    <p className="text-[10px] text-slate-500 line-clamp-2">
                      {idea.whatsappInsight}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[9px] text-slate-400">
                    <span>
                      {String(idea.tag || '').replace(/whatsapp/gi, '').replace(/•/g, '').trim() || 'Dúvida frequente de pacientes'}
                    </span>
                    <span className="text-emerald-700 font-bold hover:underline">
                      Usar tema →
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            ((trendingWebTopics && trendingWebTopics.length > 0) ? trendingWebTopics : SUGGESTED_TOPICS).map((topic, idx) => {
              const isSelected = promptTopic === topic.title;
              const formatKey = topic.format || 'autoridade';
              const formatLabel = formatLabels[formatKey] || formatKey;

              return (
                <div
                  key={idx}
                  onClick={() => handleApplyPresetTopic(topic)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 shadow-2xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800 leading-snug">
                      💡 {topic.title}
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 bg-slate-100 text-slate-700 border border-slate-200">
                      {formatLabel}
                    </span>
                  </div>

                  {topic.insight && (
                    <p className="text-[10px] text-slate-500 line-clamp-2">
                      {topic.insight}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[9px] text-slate-400">
                    <span>
                      {String(topic.tag || topic.category || '').replace(/•/g, '').trim() || 'Em alta'}
                    </span>
                    <span className="text-emerald-700 font-bold hover:underline">
                      Usar tema →
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
