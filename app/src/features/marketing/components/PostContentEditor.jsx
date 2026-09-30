import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Sliders,
  Trash2,
  UtensilsCrossed,
  Microscope,
  ListOrdered,
  PhoneCall,
  Quote,
  ShieldCheck,
  RefreshCw,
  MessageSquare,
  Flame,
  Check,
  Globe
} from 'lucide-react';
import { SUGGESTED_TOPICS } from '../services/postGeneratorService.js';

export function PostContentEditor({
  postData,
  onChangePostData,
  currentSlideIndex = 0,
  onGenerateWithAI,
  isGeneratingAI,
  onRemoveSlide,
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
  const slides = postData.slides || [];
  const currentSlide = isCarousel ? (slides[currentSlideIndex] || slides[0] || {}) : {};
  const totalSlides = slides.length;

  // Determina o formato ativo para exibição dos campos de edição
  const activeFormat = isCarousel
    ? (currentSlide.format || (currentSlide.type === 'cover' ? 'autoridade' : (currentSlide.type === 'cta' ? 'cta' : (currentSlide.type === 'content' ? 'legacy-content' : 'autoridade'))))
    : postData.format;

  // Dados mesclados para leitura nos inputs (prioriza o slide atual se for carrossel)
  const activeData = isCarousel
    ? { ...postData, ...currentSlide }
    : postData;

  // Atualiza um campo: se for carrossel, atualiza o slide ativo E o postData
  const handleFieldChange = (field, value) => {
    if (isCarousel) {
      const updatedSlides = slides.map((s, idx) => {
        if (idx === currentSlideIndex) {
          return { ...s, [field]: value };
        }
        return s;
      });
      onChangePostData({
        ...postData,
        [field]: value,
        slides: updatedSlides
      });
    } else {
      onChangePostData({
        ...postData,
        [field]: value
      });
    }
  };

  const handleApplyPresetTopic = (topicItem) => {
    setPromptTopic(topicItem.title);
    if (topicItem.format && topicItem.format !== postData.format) {
      handleFieldChange('format', topicItem.format);
    }
  };

  const handleApplyWhatsAppTopic = (idea) => {
    setPromptTopic(idea.title);
    if (idea.format && idea.format !== postData.format) {
      handleFieldChange('format', idea.format);
    }
  };

  const handleTriggerAI = (e) => {
    e.preventDefault();
    if (!promptTopic.trim() && !postData.headline) return;
    onGenerateWithAI(promptTopic.trim() || postData.headline);
  };

  const formatLabels = {
    autoridade: '1. Dra. Isabela Explica',
    prato: '2. Prato & Performance',
    ciencia: '3. Ciência vs Senso Comum',
    dicas: '4. Dicas 01 / 02 / 03',
    cta: '5. CTA de Consulta',
    manifesto: '6. Manifesto Clínico',
    passo: '7. Ponto / Passo Clínico',
    'legacy-content': '7. Ponto / Passo Clínico'
  };

  const formatIcons = {
    autoridade: ShieldCheck,
    prato: UtensilsCrossed,
    ciencia: Microscope,
    dicas: ListOrdered,
    cta: PhoneCall,
    manifesto: Quote,
    passo: ListOrdered,
    'legacy-content': ListOrdered
  };

  const FormatIcon = formatIcons[activeFormat] || Sliders;

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* 1. ASSISTENTE DE IA */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden shrink-0">
        <div className="bg-slate-50 border-b border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center text-slate-800 font-extrabold text-[11px] uppercase tracking-wider">
              <Bot className="w-4 h-4 mr-1.5 text-emerald-600" />
              <span>Assistente de Conteúdo</span>
            </label>

            <div className="flex items-center gap-1.5">
              {activeIdeaSource === 'whatsapp' ? (
                onLoadWhatsAppIdeas && (
                  <button
                    type="button"
                    onClick={onLoadWhatsAppIdeas}
                    disabled={isLoadingWhatsApp}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                    title="Ler mensagens recentes do WhatsApp e extrair novas ideias clínicas"
                  >
                    <RefreshCw className={`w-3 h-3 text-emerald-600 ${isLoadingWhatsApp ? 'animate-spin' : ''}`} />
                    <span>{isLoadingWhatsApp ? 'Analisando WhatsApp...' : 'Analisar WhatsApp'}</span>
                  </button>
                )
              ) : (
                onLoadWebTopics && (
                  <button
                    type="button"
                    onClick={onLoadWebTopics}
                    disabled={isLoadingWeb}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                    title="Pesquisar tendências da web e temas em alta em nutrição esportiva e clínica"
                  >
                    <Globe className={`w-3 h-3 text-emerald-600 ${isLoadingWeb ? 'animate-spin' : ''}`} />
                    <span>{isLoadingWeb ? 'Buscando Web...' : 'Buscar Web'}</span>
                  </button>
                )
              )}

              {isCarousel && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {totalSlides} Lâminas
                </span>
              )}
            </div>
          </div>

          {/* Seletor entre Dúvidas do WhatsApp e Temas Fixos/Web */}
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveIdeaSource('whatsapp')}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeIdeaSource === 'whatsapp'
                    ? 'bg-emerald-600 text-white shadow-2xs font-extrabold'
                    : 'bg-white text-slate-600 hover:text-emerald-700 border border-slate-200'
                }`}
              >
                <MessageSquare className="w-3 h-3" />
                <span>Dúvidas Reais</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeIdeaSource === 'whatsapp' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {whatsappIdeas.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveIdeaSource('editoriais')}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeIdeaSource === 'editoriais'
                    ? 'bg-emerald-600 text-white shadow-2xs font-extrabold'
                    : 'bg-white text-slate-600 hover:text-emerald-700 border border-slate-200'
                }`}
              >
                <Flame className="w-3 h-3 text-amber-500" />
                <span>Temas Editoriais</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeIdeaSource === 'editoriais' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {((trendingWebTopics && trendingWebTopics.length > 0) ? trendingWebTopics : SUGGESTED_TOPICS).length}
                </span>
              </button>
            </div>
          </div>

          {/* Exibição das Dúvidas Reais do WhatsApp com o Modelo Recomendado */}
          {activeIdeaSource === 'whatsapp' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {whatsappIdeas.map((idea, idx) => {
                const isSelected = promptTopic === idea.title;
                const formatLabel = formatLabels[idea.format] || idea.format;
                const isCurrentModel = postData.format === idea.format;

                return (
                  <div
                    key={idx}
                    onClick={() => handleApplyWhatsAppTopic(idea)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1 group ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400 shadow-xs'
                        : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-emerald-300 shadow-2xs'
                    }`}
                    title={idea.whatsappInsight || 'Clique para preencher e ativar o modelo recomendado'}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <span className="text-[10px] font-bold text-slate-800 group-hover:text-emerald-800 line-clamp-2 leading-snug">
                        💬 {idea.title}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 mt-0.5">
                      <span className="text-[9px] text-slate-400 font-medium truncate">
                        {String(idea.tag || '')
                          .replace(/whatsapp/gi, '')
                          .replace(/•/g, '')
                          .trim() || 'Tema Clínico'}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 bg-slate-100 text-slate-700 border-slate-200">
                        {formatLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Cards de Temas Editoriais / Web com o Modelo Recomendado */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {((trendingWebTopics && trendingWebTopics.length > 0) ? trendingWebTopics : SUGGESTED_TOPICS).map((topic, idx) => {
                const isSelected = promptTopic === topic.title;
                const formatKey = topic.format || 'autoridade';
                const formatLabel = formatLabels[formatKey] || formatKey;
                const isCurrentModel = postData.format === formatKey;

                return (
                  <div
                    key={idx}
                    onClick={() => handleApplyPresetTopic(topic)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1 group ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400 shadow-xs'
                        : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-emerald-300 shadow-2xs'
                    }`}
                    title={topic.insight || 'Clique para preencher e ativar o modelo recomendado'}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <span className="text-[10px] font-bold text-slate-800 group-hover:text-emerald-800 line-clamp-2 leading-snug">
                        💡 {topic.title}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 mt-0.5">
                      <span className="text-[9px] text-slate-400 font-medium truncate">
                        {String(topic.tag || topic.category || '')
                          .replace(/•/g, '')
                          .trim() || 'Em Alta na Web'}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 bg-slate-100 text-slate-700 border-slate-200">
                        {formatLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Formulário de Prompt da IA */}
          <form onSubmit={handleTriggerAI} className="flex gap-2 items-center pt-1">
            <input
              type="text"
              value={promptTopic}
              onChange={(e) => setPromptTopic(e.target.value)}
              placeholder={
                isCarousel
                  ? 'Ex: 5 erros que travam o emagrecimento mesmo treinando pesado...'
                  : 'Ex: Treino em jejum e quebra de platô metabólico...'
              }
              className="flex-1 bg-white border border-slate-200 rounded-xl text-xs p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium text-slate-700"
            />

            <button
              type="submit"
              disabled={isGeneratingAI}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center justify-center whitespace-nowrap active:scale-95 cursor-pointer shrink-0"
            >
              {isGeneratingAI ? (
                <span className="flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  <span>Criando...</span>
                </span>
              ) : (
                <span className="flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  <span>{isCarousel ? 'Gerar Carrossel' : 'Gerar Post'}</span>
                </span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* 2. CAMPOS PARA EDITAR O CONTEÚDO ESPECÍFICO DO FORMATO */}
      <div className="bg-slate-50 rounded-3xl border border-slate-200 shadow-xs p-5 md:p-6 space-y-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FormatIcon className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              {isCarousel
                ? `Editando Slide ${currentSlideIndex + 1} de ${totalSlides} • ${formatLabels[activeFormat] || activeFormat}`
                : `Conteúdo da Publicação • ${formatLabels[activeFormat] || activeFormat}`}
            </h3>
          </div>

          {isCarousel && (
            <button
              type="button"
              onClick={() => onRemoveSlide(currentSlideIndex)}
              className="text-[11px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-rose-50"
              title="Excluir este slide"
            >
              <Trash2 className="w-3 h-3" />
              <span>Excluir</span>
            </button>
          )}
        </div>

        {/* =========================================================
            FORMATO 1: DRA. ISABELA EXPLICA (AUTORIDADE)
            ========================================================= */}
        {activeFormat === 'autoridade' && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                  Badge Superior
                </label>
                <input
                  type="text"
                  value={activeData.badge || ''}
                  onChange={(e) => handleFieldChange('badge', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                  Tagline Cursiva
                </label>
                <input
                  type="text"
                  value={activeData.tagline || ''}
                  onChange={(e) => handleFieldChange('tagline', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                Título Principal (Headline)
              </label>
              <textarea
                rows={2}
                value={activeData.headline || ''}
                onChange={(e) => handleFieldChange('headline', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                Palavras com Destaque Dourado
              </label>
              <input
                type="text"
                value={activeData.highlightText || ''}
                onChange={(e) => handleFieldChange('highlightText', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                Descrição Clínica (2 a 3 frases)
              </label>
              <textarea
                rows={3}
                value={activeData.description || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                  Nome da Autora
                </label>
                <input
                  type="text"
                  value={activeData.authorName || 'Isabela Muñoz'}
                  onChange={(e) => handleFieldChange('authorName', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                  Especialidade / Subtítulo
                </label>
                <input
                  type="text"
                  value={activeData.authorTitle || 'Nutrição Clínica, Esportiva & Performance'}
                  onChange={(e) => handleFieldChange('authorTitle', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            FORMATO 2: PRATO & PERFORMANCE
            ========================================================= */}
        {activeFormat === 'prato' && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                  Categoria do Prato
                </label>
                <input
                  type="text"
                  value={activeData.dishCategory || ''}
                  onChange={(e) => handleFieldChange('dishCategory', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                  Título da Estratégia
                </label>
                <input
                  type="text"
                  value={activeData.dishHeadline || ''}
                  onChange={(e) => handleFieldChange('dishHeadline', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                Explicação Nutricional
              </label>
              <textarea
                rows={2}
                value={activeData.dishSubheadline || ''}
                onChange={(e) => handleFieldChange('dishSubheadline', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1.5 block ml-1">
                Macronutrientes do HUD Nutricional
              </label>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block text-center mb-0.5">Kcal</span>
                  <input
                    type="text"
                    value={activeData.dishKcal || ''}
                    onChange={(e) => handleFieldChange('dishKcal', e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white text-center font-bold text-slate-700 shadow-2xs"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block text-center mb-0.5">Proteína</span>
                  <input
                    type="text"
                    value={activeData.dishProteina || ''}
                    onChange={(e) => handleFieldChange('dishProteina', e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white text-center font-bold text-slate-700 shadow-2xs"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block text-center mb-0.5">Carbos</span>
                  <input
                    type="text"
                    value={activeData.dishCarbos || ''}
                    onChange={(e) => handleFieldChange('dishCarbos', e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white text-center font-bold text-slate-700 shadow-2xs"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block text-center mb-0.5">Gorduras</span>
                  <input
                    type="text"
                    value={activeData.dishGorduras || ''}
                    onChange={(e) => handleFieldChange('dishGorduras', e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white text-center font-bold text-slate-700 shadow-2xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            FORMATO 3: CIÊNCIA VS SENSO COMUM
            ========================================================= */}
        {activeFormat === 'ciencia' && (
          <div className="space-y-3.5">
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                Badge de Chancela
              </label>
              <input
                type="text"
                value={activeData.cienciaBadge || ''}
                onChange={(e) => handleFieldChange('cienciaBadge', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
              />
            </div>
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                Pergunta / Título Central
              </label>
              <input
                type="text"
                value={activeData.cienciaTitle || ''}
                onChange={(e) => handleFieldChange('cienciaTitle', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-2">
              <span className="text-[10px] font-extrabold text-rose-800 uppercase block tracking-wider">
                ❌ Senso Comum (Mito)
              </span>
              <input
                type="text"
                value={activeData.debateWrongTitle || ''}
                onChange={(e) => handleFieldChange('debateWrongTitle', e.target.value)}
                placeholder="Título do mito"
                className="w-full text-xs p-2 rounded-xl border border-rose-200 bg-white text-slate-800 font-semibold"
              />
              <textarea
                rows={2}
                value={activeData.debateWrongText || ''}
                onChange={(e) => handleFieldChange('debateWrongText', e.target.value)}
                placeholder="Explicação do porquê está equivocado"
                className="w-full text-xs p-2 rounded-xl border border-rose-200 bg-white text-slate-700"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
              <span className="text-[10px] font-extrabold text-emerald-800 uppercase block tracking-wider">
                ✅ Ciência Clínica (Evidência ACSM)
              </span>
              <input
                type="text"
                value={activeData.debateRightTitle || ''}
                onChange={(e) => handleFieldChange('debateRightTitle', e.target.value)}
                placeholder="Título da conduta correta"
                className="w-full text-xs p-2 rounded-xl border border-emerald-200 bg-white text-slate-800 font-semibold"
              />
              <textarea
                rows={2}
                value={activeData.debateRightText || ''}
                onChange={(e) => handleFieldChange('debateRightText', e.target.value)}
                placeholder="Evidência científica e conduta clínica"
                className="w-full text-xs p-2 rounded-xl border border-emerald-200 bg-white text-slate-700"
              />
            </div>
          </div>
        )}

        {/* =========================================================
            FORMATO 4: DICAS 01 / 02 / 03
            ========================================================= */}
        {activeFormat === 'dicas' && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                  Badge Superior
                </label>
                <input
                  type="text"
                  value={activeData.dicasBadge || ''}
                  onChange={(e) => handleFieldChange('dicasBadge', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                  Destaque Dourado do Título
                </label>
                <input
                  type="text"
                  value={activeData.dicasHighlight || ''}
                  onChange={(e) => handleFieldChange('dicasHighlight', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                Título Principal
              </label>
              <textarea
                rows={2}
                value={activeData.dicasTitle || ''}
                onChange={(e) => handleFieldChange('dicasTitle', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
              />
            </div>

            {/* Dica 01 */}
            <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-1.5">
              <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">
                💡 Dica {activeData.dica1Num || '01'}
              </span>
              <input
                type="text"
                value={activeData.dica1Title || ''}
                onChange={(e) => handleFieldChange('dica1Title', e.target.value)}
                placeholder="Título da Dica 01"
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-bold shadow-2xs"
              />
              <textarea
                rows={2}
                value={activeData.dica1Text || ''}
                onChange={(e) => handleFieldChange('dica1Text', e.target.value)}
                placeholder="Texto explicativo da Dica 01"
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs"
              />
            </div>

            {/* Dica 02 */}
            <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-1.5">
              <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">
                💡 Dica {activeData.dica2Num || '02'}
              </span>
              <input
                type="text"
                value={activeData.dica2Title || ''}
                onChange={(e) => handleFieldChange('dica2Title', e.target.value)}
                placeholder="Título da Dica 02"
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-bold shadow-2xs"
              />
              <textarea
                rows={2}
                value={activeData.dica2Text || ''}
                onChange={(e) => handleFieldChange('dica2Text', e.target.value)}
                placeholder="Texto explicativo da Dica 02"
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs"
              />
            </div>

            {/* Dica 03 */}
            <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-1.5">
              <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">
                💡 Dica {activeData.dica3Num || '03'}
              </span>
              <input
                type="text"
                value={activeData.dica3Title || ''}
                onChange={(e) => handleFieldChange('dica3Title', e.target.value)}
                placeholder="Título da Dica 03"
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-bold shadow-2xs"
              />
              <textarea
                rows={2}
                value={activeData.dica3Text || ''}
                onChange={(e) => handleFieldChange('dica3Text', e.target.value)}
                placeholder="Texto explicativo da Dica 03"
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                Texto do Rodapé
              </label>
              <input
                type="text"
                value={activeData.dicasFooter || 'Salve e aplique esta semana!'}
                onChange={(e) => handleFieldChange('dicasFooter', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
              />
            </div>
          </div>
        )}

        {/* =========================================================
            FORMATO 5: CTA DE CONSULTA
            ========================================================= */}
        {activeFormat === 'cta' && (
          <div className="space-y-3.5">
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                Badge Superior
              </label>
              <input
                type="text"
                value={activeData.ctaBadge || ''}
                onChange={(e) => handleFieldChange('ctaBadge', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                Título Principal
              </label>
              <textarea
                rows={2}
                value={activeData.ctaTitle || ''}
                onChange={(e) => handleFieldChange('ctaTitle', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                Destaque Dourado do Título
              </label>
              <input
                type="text"
                value={activeData.ctaHighlight || ''}
                onChange={(e) => handleFieldChange('ctaHighlight', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                Subtítulo Explicativo
              </label>
              <textarea
                rows={2}
                value={activeData.ctaSubtitle || ''}
                onChange={(e) => handleFieldChange('ctaSubtitle', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
              />
            </div>

            <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2">
              <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">
                Itens de Acompanhamento (Bullets)
              </span>
              <input
                type="text"
                value={activeData.ctaBullet1 || ''}
                onChange={(e) => handleFieldChange('ctaBullet1', e.target.value)}
                placeholder="Bullet 1"
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white text-slate-800 shadow-2xs"
              />
              <input
                type="text"
                value={activeData.ctaBullet2 || ''}
                onChange={(e) => handleFieldChange('ctaBullet2', e.target.value)}
                placeholder="Bullet 2"
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white text-slate-800 shadow-2xs"
              />
              <input
                type="text"
                value={activeData.ctaBullet3 || ''}
                onChange={(e) => handleFieldChange('ctaBullet3', e.target.value)}
                placeholder="Bullet 3"
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white text-slate-800 shadow-2xs"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                Texto do Botão / Chamada para Ação
              </label>
              <textarea
                rows={2}
                value={activeData.ctaCallout || ''}
                onChange={(e) => handleFieldChange('ctaCallout', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
              />
            </div>
          </div>
        )}

        {/* =========================================================
            FORMATO 6: MANIFESTO CLÍNICO
            ========================================================= */}
        {activeFormat === 'manifesto' && (
          <div className="space-y-3.5">
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                Badge Superior
              </label>
              <input
                type="text"
                value={activeData.manifestoBadge || ''}
                onChange={(e) => handleFieldChange('manifestoBadge', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                Citação / Frase de Impacto Principal
              </label>
              <textarea
                rows={3}
                value={activeData.manifestoCitacao || ''}
                onChange={(e) => handleFieldChange('manifestoCitacao', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                Trecho com Destaque Dourado na Frase
              </label>
              <input
                type="text"
                value={activeData.manifestoHighlight || ''}
                onChange={(e) => handleFieldChange('manifestoHighlight', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                  Nome da Autora
                </label>
                <input
                  type="text"
                  value={activeData.manifestoAutor || 'Dra. Isabela Muñoz'}
                  onChange={(e) => handleFieldChange('manifestoAutor', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                  Especialidade / Título
                </label>
                <input
                  type="text"
                  value={activeData.manifestoTitulo || 'Nutricionista Clínica & Esportiva'}
                  onChange={(e) => handleFieldChange('manifestoTitulo', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                  Credencial
                </label>
                <input
                  type="text"
                  value={activeData.manifestoCred || 'Certificação Internacional ACSM'}
                  onChange={(e) => handleFieldChange('manifestoCred', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                  Botão / Link na Bio
                </label>
                <input
                  type="text"
                  value={activeData.manifestoCta || 'Link na Bio ↗'}
                  onChange={(e) => handleFieldChange('manifestoCta', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            FORMATO 7: PONTO / PASSO CLÍNICO (NÚMERO GRANDE + CONDUTA 💡)
            ========================================================= */}
        {(activeFormat === 'passo' || activeFormat === 'legacy-content') && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                  Número do Ponto
                </label>
                <input
                  type="text"
                  value={activeData.stepNumber || '01'}
                  onChange={(e) => handleFieldChange('stepNumber', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-bold text-center"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                  Badge da Lâmina
                </label>
                <input
                  type="text"
                  value={activeData.badge || activeData.passoBadge || ''}
                  onChange={(e) => {
                    handleFieldChange('badge', e.target.value);
                    handleFieldChange('passoBadge', e.target.value);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                Título do Ponto
              </label>
              <textarea
                rows={2}
                value={activeData.title || activeData.passoTitle || ''}
                onChange={(e) => {
                  handleFieldChange('title', e.target.value);
                  handleFieldChange('passoTitle', e.target.value);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                Destaque Dourado do Título
              </label>
              <input
                type="text"
                value={activeData.highlightText || activeData.passoHighlight || ''}
                onChange={(e) => {
                  handleFieldChange('highlightText', e.target.value);
                  handleFieldChange('passoHighlight', e.target.value);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                Explicação Científica Completa
              </label>
              <textarea
                rows={3}
                value={activeData.text || activeData.passoText || ''}
                onChange={(e) => {
                  handleFieldChange('text', e.target.value);
                  handleFieldChange('passoText', e.target.value);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block ml-1">
                Conduta Clínica (Card Dourado com 💡)
              </label>
              <textarea
                rows={2}
                value={activeData.tip || activeData.passoTip || ''}
                onChange={(e) => {
                  handleFieldChange('tip', e.target.value);
                  handleFieldChange('passoTip', e.target.value);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-700 p-2.5 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
