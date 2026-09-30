import React, { useState } from 'react';
import {
  Sparkles,
  Palette,
  Layout,
  Upload,
  RotateCcw,
  Download,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sliders,
  CheckCircle2,
  Plus,
  Trash2,
  Archive,
  Layers
} from 'lucide-react';
import { POST_FORMATS, POST_THEMES, SUGGESTED_TOPICS } from '../services/postGeneratorService.js';

export function PostControls({
  postData,
  onChangePostData,
  currentTheme,
  onChangeTheme,
  onGenerateWithAI,
  isGeneratingAI,
  onCustomPhotoUpload,
  onResetPhoto,
  hasCustomPhoto,
  onDownloadSingleImage,
  onDownloadCarouselZip,
  isDownloading,
  downloadProgress,
  currentSlideIndex = 0,
  onGoToSlide,
  onAddSlide,
  onRemoveSlide
}) {
  const [promptTopic, setPromptTopic] = useState('');
  const [isAccordionOpen, setIsAccordionOpen] = useState(true);

  const slides = postData.slides || [];
  const currentSlide = slides[currentSlideIndex] || slides[0] || {};
  const isCarousel = postData.format === 'carrossel';

  const handleFieldChange = (field, value) => {
    onChangePostData({
      ...postData,
      [field]: value
    });
  };

  const handleSlideFieldChange = (field, value) => {
    const updatedSlides = slides.map((s, idx) => {
      if (idx === currentSlideIndex) {
        return { ...s, [field]: value };
      }
      return s;
    });
    onChangePostData({
      ...postData,
      slides: updatedSlides
    });
  };

  const handleApplyPresetTopic = (topicItem) => {
    setPromptTopic(topicItem.title);
    if (topicItem.format && topicItem.format !== postData.format) {
      handleFieldChange('format', topicItem.format);
    }
  };

  const handleTriggerAI = (e) => {
    e.preventDefault();
    if (!promptTopic.trim() && !postData.headline) return;
    onGenerateWithAI(promptTopic.trim() || postData.headline);
  };

  return (
    <div className="space-y-5">
      {/* 1. SELETOR DE FORMATO DO POST */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <Layout className="w-3.5 h-3.5 text-teal-600" />
          <span>1. Formato da Publicação no Feed</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {POST_FORMATS.map((fmt) => {
            const isActive = postData.format === fmt.id;
            return (
              <button
                key={fmt.id}
                type="button"
                onClick={() => handleFieldChange('format', fmt.id)}
                className={`p-3 rounded-xl text-left transition-all border cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-br from-teal-500/10 via-white to-amber-500/10 border-teal-500 text-teal-950 shadow-xs ring-1 ring-teal-500/20'
                    : 'bg-slate-50/70 border-slate-200/70 hover:bg-slate-100 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">{fmt.label}</span>
                  {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />}
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">{fmt.subtitle}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SELETOR DE PALETA / IDENTIDADE VISUAL */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Palette className="w-3.5 h-3.5 text-teal-600" />
            <span>2. Identidade Visual & Paleta</span>
          </label>
          <span className="text-[10px] font-semibold text-slate-400">Alternar tema das lâminas</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {POST_THEMES.map((th) => {
            const isActive = currentTheme === th.id;
            return (
              <button
                key={th.id}
                type="button"
                onClick={() => onChangeTheme(th.id)}
                className={`p-3 rounded-xl text-left transition-all border flex items-center gap-3 cursor-pointer ${
                  isActive
                    ? 'bg-white border-teal-600 text-slate-900 shadow-sm ring-2 ring-teal-500/20'
                    : 'bg-slate-50/70 border-slate-200/70 hover:bg-slate-100 text-slate-600'
                }`}
              >
                <div
                  className="w-5 h-5 rounded-full shrink-0 shadow-inner border border-white"
                  style={{ backgroundColor: th.dotColor }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate">{th.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{th.tag}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SE FOR CARROSSEL: GERENCIADOR DE LÂMINAS / SLIDES */}
      {isCarousel && (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-amber-500/30 p-4 sm:p-5 shadow-xs bg-gradient-to-r from-amber-500/5 via-white to-transparent">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-950">
                Lâminas do Carrossel ({slides.length} slides)
              </span>
            </div>
            <button
              type="button"
              onClick={onAddSlide}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Slide</span>
            </button>
          </div>

          {/* Abas dos Slides */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {slides.map((s, idx) => {
              const isSelected = currentSlideIndex === idx;
              const label =
                idx === 0
                  ? '01. Capa'
                  : idx === slides.length - 1
                  ? `${String(idx + 1).padStart(2, '0')}. CTA Final`
                  : `${String(idx + 1).padStart(2, '0')}. Dica`;

              return (
                <button
                  key={s.id || idx}
                  type="button"
                  onClick={() => onGoToSlide(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm ring-1 ring-amber-400'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. ASSISTENTE DE IA INTELIGENTE */}
      <div className="bg-gradient-to-br from-teal-500/5 via-white to-amber-500/5 rounded-2xl border border-teal-500/25 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-teal-600 text-white shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-950">
              3. Gerar Conteúdo com IA da Dra. Isabela
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
            {isCarousel ? 'Carrossel 5 Lâminas' : 'Post Único'}
          </span>
        </div>

        <p className="text-xs text-slate-600 mb-3">
          {isCarousel
            ? 'A IA gerará a Capa, 3 lâminas de conteúdo educativo, a lâmina final com CTA e a legenda completa:'
            : 'Digite um tema clínico/esportivo ou clique em uma das ideias sugeridas:'}
        </p>

        {/* Chips de Sugestões */}
        <div className="flex flex-wrap gap-1.5 mb-3.5">
          {SUGGESTED_TOPICS.map((topic, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPresetTopic(topic)}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white/90 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200/80 hover:border-teal-300 transition-all cursor-pointer shadow-2xs"
            >
              💡 {topic.title}
            </button>
          ))}
        </div>

        {/* Input e Botão de Ação */}
        <form onSubmit={handleTriggerAI} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={promptTopic}
            onChange={(e) => setPromptTopic(e.target.value)}
            placeholder={
              isCarousel
                ? 'Ex: 5 erros que travam o emagrecimento mesmo treinando pesado...'
                : 'Ex: Treino em jejum e perda de massa muscular...'
            }
            className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
          />
          <button
            type="submit"
            disabled={isGeneratingAI}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 transition-all cursor-pointer disabled:opacity-50 shadow-sm shrink-0"
          >
            {isGeneratingAI ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{isCarousel ? 'Criando Carrossel...' : 'Criando Post...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isCarousel ? 'Gerar Carrossel com IA' : 'Gerar Post com IA'}</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* 4. AJUSTE FINO MANUAL DOS TEXTOS */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => setIsAccordionOpen(!isAccordionOpen)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {isCarousel
                ? `4. Textos do Slide ${currentSlideIndex + 1} de ${slides.length}`
                : '4. Ajuste Manual dos Textos do Post'}
            </span>
          </div>
          {isAccordionOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {isAccordionOpen && (
          <div className="p-5 border-t border-slate-200/70 space-y-4">
            {/* MODO CARROSSEL */}
            {isCarousel && (
              <>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-amber-800">
                    Tipo do Slide: {currentSlide.type === 'cover' ? 'Capa do Post' : currentSlide.type === 'cta' ? 'Lâmina Final (CTA)' : 'Lâmina de Conteúdo'}
                  </span>
                  {slides.length > 2 && (
                    <button
                      type="button"
                      onClick={() => onRemoveSlide(currentSlideIndex)}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Excluir este slide</span>
                    </button>
                  )}
                </div>

                {/* Se for Capa */}
                {currentSlide.type === 'cover' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 mb-1 block">Badge Superior</label>
                        <input
                          type="text"
                          value={currentSlide.badge || ''}
                          onChange={(e) => handleSlideFieldChange('badge', e.target.value)}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 mb-1 block">Tagline Cursiva</label>
                        <input
                          type="text"
                          value={currentSlide.tagline || ''}
                          onChange={(e) => handleSlideFieldChange('tagline', e.target.value)}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">Título da Capa (Headline)</label>
                      <textarea
                        rows={2}
                        value={currentSlide.headline || ''}
                        onChange={(e) => handleSlideFieldChange('headline', e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">Palavras com Destaque Dourado</label>
                      <input
                        type="text"
                        value={currentSlide.highlightText || ''}
                        onChange={(e) => handleSlideFieldChange('highlightText', e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">Texto de Apoio (Gancho)</label>
                      <textarea
                        rows={2}
                        value={currentSlide.description || ''}
                        onChange={(e) => handleSlideFieldChange('description', e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70"
                      />
                    </div>
                  </>
                )}

                {/* Se for Conteúdo */}
                {currentSlide.type === 'content' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 mb-1 block">Número do Ponto</label>
                        <input
                          type="text"
                          value={currentSlide.stepNumber || ''}
                          onChange={(e) => handleSlideFieldChange('stepNumber', e.target.value)}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70 font-bold"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-bold text-slate-600 mb-1 block">Badge da Lâmina</label>
                        <input
                          type="text"
                          value={currentSlide.badge || ''}
                          onChange={(e) => handleSlideFieldChange('badge', e.target.value)}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">Título da Dica</label>
                      <textarea
                        rows={2}
                        value={currentSlide.title || ''}
                        onChange={(e) => handleSlideFieldChange('title', e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">Destaque Dourado / Colorido</label>
                      <input
                        type="text"
                        value={currentSlide.highlightText || ''}
                        onChange={(e) => handleSlideFieldChange('highlightText', e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">Explicação Clínica</label>
                      <textarea
                        rows={3}
                        value={currentSlide.text || ''}
                        onChange={(e) => handleSlideFieldChange('text', e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">Caixa de Dica Prática</label>
                      <textarea
                        rows={2}
                        value={currentSlide.tip || ''}
                        onChange={(e) => handleSlideFieldChange('tip', e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70"
                      />
                    </div>
                  </>
                )}

                {/* Se for CTA Final */}
                {currentSlide.type === 'cta' && (
                  <>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">Badge Superior</label>
                      <input
                        type="text"
                        value={currentSlide.badge || ''}
                        onChange={(e) => handleSlideFieldChange('badge', e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">Título de Fechamento</label>
                      <textarea
                        rows={2}
                        value={currentSlide.headline || ''}
                        onChange={(e) => handleSlideFieldChange('headline', e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">Destaque Dourado</label>
                      <input
                        type="text"
                        value={currentSlide.highlightText || ''}
                        onChange={(e) => handleSlideFieldChange('highlightText', e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">Texto de Resumo</label>
                      <textarea
                        rows={2}
                        value={currentSlide.description || ''}
                        onChange={(e) => handleSlideFieldChange('description', e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">Texto do Card de Chamada para Ação</label>
                      <textarea
                        rows={2}
                        value={currentSlide.ctaBoxText || ''}
                        onChange={(e) => handleSlideFieldChange('ctaBoxText', e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {/* MODO POST ÚNICO (AUTORIDADE) */}
            {!isCarousel && postData.format === 'autoridade' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Badge Superior</label>
                    <input
                      type="text"
                      value={postData.badge || ''}
                      onChange={(e) => handleFieldChange('badge', e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Tagline Cursiva</label>
                    <input
                      type="text"
                      value={postData.tagline || ''}
                      onChange={(e) => handleFieldChange('tagline', e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Título Principal (Headline)</label>
                  <textarea
                    rows={2}
                    value={postData.headline || ''}
                    onChange={(e) => handleFieldChange('headline', e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Trecho Dourado / Destaque do Título</label>
                  <input
                    type="text"
                    value={postData.highlightText || ''}
                    onChange={(e) => handleFieldChange('highlightText', e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Descrição Clínica (2 a 3 frases)</label>
                  <textarea
                    rows={3}
                    value={postData.description || ''}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70"
                  />
                </div>
              </>
            )}

            {/* MODO PRATO & PERFORMANCE */}
            {!isCarousel && postData.format === 'prato' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Categoria do Prato</label>
                    <input
                      type="text"
                      value={postData.dishCategory || ''}
                      onChange={(e) => handleFieldChange('dishCategory', e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Título da Estratégia</label>
                    <input
                      type="text"
                      value={postData.dishHeadline || ''}
                      onChange={(e) => handleFieldChange('dishHeadline', e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Explicação Nutricional</label>
                  <textarea
                    rows={2}
                    value={postData.dishSubheadline || ''}
                    onChange={(e) => handleFieldChange('dishSubheadline', e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70"
                  />
                </div>

                {/* HUD Macronutrientes */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Macronutrientes do HUD</label>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block">Kcal</span>
                      <input
                        type="text"
                        value={postData.dishKcal || ''}
                        onChange={(e) => handleFieldChange('dishKcal', e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50/70 text-center font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block">Proteína</span>
                      <input
                        type="text"
                        value={postData.dishProteina || ''}
                        onChange={(e) => handleFieldChange('dishProteina', e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50/70 text-center font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block">Carboidratos</span>
                      <input
                        type="text"
                        value={postData.dishCarbos || ''}
                        onChange={(e) => handleFieldChange('dishCarbos', e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50/70 text-center font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block">Gorduras</span>
                      <input
                        type="text"
                        value={postData.dishGorduras || ''}
                        onChange={(e) => handleFieldChange('dishGorduras', e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50/70 text-center font-bold"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* MODO CIÊNCIA VS SENSO COMUM */}
            {!isCarousel && postData.format === 'ciencia' && (
              <>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Badge de Chancela</label>
                  <input
                    type="text"
                    value={postData.cienciaBadge || ''}
                    onChange={(e) => handleFieldChange('cienciaBadge', e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Pergunta / Título Central</label>
                  <input
                    type="text"
                    value={postData.cienciaTitle || ''}
                    onChange={(e) => handleFieldChange('cienciaTitle', e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70"
                  />
                </div>

                <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200/70 space-y-2">
                  <span className="text-[11px] font-bold text-rose-800 uppercase block">❌ Senso Comum (Mito)</span>
                  <input
                    type="text"
                    value={postData.debateWrongTitle || ''}
                    onChange={(e) => handleFieldChange('debateWrongTitle', e.target.value)}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-rose-200 bg-white"
                  />
                  <textarea
                    rows={2}
                    value={postData.debateWrongText || ''}
                    onChange={(e) => handleFieldChange('debateWrongText', e.target.value)}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-rose-200 bg-white"
                  />
                </div>

                <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200/70 space-y-2">
                  <span className="text-[11px] font-bold text-teal-800 uppercase block">✅ Ciência Clínica (Evidência)</span>
                  <input
                    type="text"
                    value={postData.debateRightTitle || ''}
                    onChange={(e) => handleFieldChange('debateRightTitle', e.target.value)}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-teal-200 bg-white"
                  />
                  <textarea
                    rows={2}
                    value={postData.debateRightText || ''}
                    onChange={(e) => handleFieldChange('debateRightText', e.target.value)}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-teal-200 bg-white"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 5. GESTÃO DE FOTO DA DRA E DOWNLOAD */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Trocar Foto</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onCustomPhotoUpload}
            />
          </label>

          {hasCustomPhoto && (
            <button
              type="button"
              onClick={onResetPhoto}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Oficial</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Se for carrossel, oferece download em ZIP do carrossel completo */}
          {isCarousel ? (
            <>
              <button
                type="button"
                onClick={onDownloadSingleImage}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar Este Slide</span>
              </button>

              <button
                type="button"
                onClick={onDownloadCarouselZip}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{downloadProgress || 'Exportando ZIP...'}</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4" />
                    <span>Baixar Carrossel Completo (ZIP)</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onDownloadSingleImage}
              disabled={isDownloading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gerando PNG...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Baixar Post (PNG 1080×1350)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
