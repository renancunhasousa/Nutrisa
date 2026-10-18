import React, { useState } from 'react';
import {
  Download,
  Archive,
  Palette,
  Sparkles,
  FileText,
  MessageSquare
} from 'lucide-react';
import { usePostStudio } from './hooks/usePostStudio.js';
import { PostDesignConfig } from './components/PostDesignConfig.jsx';
import { PostSlideViewer } from './components/PostSlideViewer.jsx';
import { PostContentEditor } from './components/PostContentEditor.jsx';
import { PostAIAssistant } from './components/PostAIAssistant.jsx';
import { CaptionBox } from './components/CaptionBox.jsx';
import PageHeader from '../../shared/ui/PageHeader.jsx';

export default function MarketingPage({ activeModel }) {
  const {
    postData,
    setPostData,
    currentTheme,
    setCurrentTheme,
    customPhotoUrl,
    currentSlideIndex,
    goToSlide,
    nextSlide,
    prevSlide,
    addSlide,
    removeSlide,
    isGeneratingAI,
    isGeneratingCaption,
    handleGenerateCaption,
    isDownloading,
    downloadProgress,
    statusMessage,
    setStatusMessage,
    canvasRef,
    handleGenerateWithAI,
    handleCustomPhotoUpload,
    handleResetPhoto,
    handleDownloadSingleImage,
    handleDownloadCarouselZip,
    handleConvertToCarousel,
    addCurrentPostAsSlide,
    addFormatAsSlide,
    addSlideWithConfig,
    resetSlides,
    whatsappIdeas,
    isLoadingWhatsApp,
    handleLoadWhatsAppIdeas,
    trendingWebTopics,
    isLoadingWeb,
    handleLoadWebTopics
  } = usePostStudio(activeModel);

  // Escala inicial confortável e estado da sidebar
  const [previewScale, setPreviewScale] = useState(0.55);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('design'); // 'design' | 'ai' | 'content' | 'caption'

  const totalSlides = (postData.slides && postData.slides.length > 0)
    ? postData.slides.length
    : 1;

  // Ordem e foco em uma palavra: Design, Criativo, Conteúdo, Legenda
  const tabs = [
    { id: 'design', label: 'Design', icon: Palette },
    { id: 'ai', label: 'Criativo', icon: Sparkles },
    { id: 'content', label: 'Conteúdo', icon: FileText },
    { id: 'caption', label: 'Legenda', icon: MessageSquare }
  ];

  return (
    <div className="animate-fadeIn w-full min-w-0 space-y-4 pb-12 print:hidden">
      {/* 1. BARRA SUPERIOR INTEGRADA (HEADER DO ESTÚDIO) */}
      <PageHeader
        category="Comunicação &amp; Conteúdo"
        title="Estúdio Criativo de Posts &amp; Carrossel IA"
        description="Ambiente de criação visual e copy clínico de alta conversão para Instagram."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Botão de Exportação (Sem botão de foco aqui) */}
            {totalSlides > 1 ? (
              <>
                <button
                  type="button"
                  onClick={handleDownloadCarouselZip}
                  disabled={isDownloading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>{isDownloading ? (downloadProgress || 'Exportando...') : 'Baixar Todos'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSingleImage}
                  disabled={isDownloading}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 shadow-2xs transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
                  title="Baixar apenas o slide que está visível no momento"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Slide Atual</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleDownloadSingleImage}
                disabled={isDownloading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isDownloading ? 'Gerando...' : 'Baixar Post'}</span>
              </button>
            )}
          </div>
        }
      />

      {/* 2. ESPAÇO DE TRABALHO DO ESTÚDIO (MESMA ALTURA EM AMBOS OS BLOCOS) */}
      <div className="flex flex-col lg:flex-row gap-5 items-stretch h-[830px] max-h-[calc(100vh-175px)] min-h-[700px]">
        {/* COLUNA ESQUERDA: CANVAS & PRANCHETA CENTRAL */}
        <div className={`flex flex-col h-full min-h-0 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'w-full lg:flex-1 min-w-0' : 'w-full flex-1'
        }`}>
          <PostSlideViewer
            canvasRef={canvasRef}
            postData={postData}
            theme={currentTheme}
            customPhotoUrl={customPhotoUrl}
            previewScale={previewScale}
            setPreviewScale={setPreviewScale}
            currentSlideIndex={currentSlideIndex}
            onGoToSlide={goToSlide}
            onAddSlide={addSlide}
            onRemoveSlide={removeSlide}
            onPrevSlide={prevSlide}
            onNextSlide={nextSlide}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          />
        </div>

        {/* COLUNA DIREITA: PAINEL LATERAL DO ESTÚDIO (STUDIO INSPECTOR COM MESMA ALTURA) */}
        {isSidebarOpen && (
          <aside className="w-full lg:w-[450px] xl:w-[480px] shrink-0 bg-white rounded-3xl border border-slate-200/90 shadow-xs flex flex-col overflow-hidden h-full min-h-0">
            {/* SELETOR DE ABAS DO INSPETOR: Design, Criativo, Conteúdo, Legenda (h-[56px] alinhado ao bloco da esquerda) */}
            <div className="h-[56px] px-3 bg-slate-50 border-b border-slate-200 shrink-0 flex items-center">
              <nav className="grid grid-cols-4 gap-1 p-1 bg-slate-200/70 rounded-xl w-full">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white text-emerald-800 shadow-2xs font-medium'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 font-normal'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-500'}`} />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* CONTEÚDO SCROLLÁVEL DA ABA ATIVA */}
            <div className="flex-1 overflow-y-auto p-4 md:p-5 scrollbar-thin flex flex-col">
              {/* ABA 1: DESIGN */}
              {activeTab === 'design' && (
                <div className="space-y-4">
                  <PostDesignConfig
                    postData={postData}
                    onChangePostData={setPostData}
                    currentTheme={currentTheme}
                    onChangeTheme={setCurrentTheme}
                    onCustomPhotoUpload={handleCustomPhotoUpload}
                    onResetPhoto={handleResetPhoto}
                    hasCustomPhoto={Boolean(customPhotoUrl)}
                    onAddFormatAsSlide={addFormatAsSlide}
                    onAddSlideWithConfig={addSlideWithConfig}
                    onResetSlides={resetSlides}
                    isCarousel={totalSlides > 1}
                  />
                </div>
              )}

              {/* ABA 2: CRIATIVO (IA & TEMAS) */}
              {activeTab === 'ai' && (
                <div className="space-y-4">
                  <PostAIAssistant
                    postData={postData}
                    onChangePostData={setPostData}
                    onGenerateWithAI={handleGenerateWithAI}
                    isGeneratingAI={isGeneratingAI}
                    whatsappIdeas={whatsappIdeas}
                    isLoadingWhatsApp={isLoadingWhatsApp}
                    onLoadWhatsAppIdeas={handleLoadWhatsAppIdeas}
                    trendingWebTopics={trendingWebTopics}
                    isLoadingWeb={isLoadingWeb}
                    onLoadWebTopics={handleLoadWebTopics}
                  />
                </div>
              )}

              {/* ABA 3: CONTEÚDO */}
              {activeTab === 'content' && (
                <div className="space-y-4">
                  <PostContentEditor
                    postData={postData}
                    onChangePostData={setPostData}
                    currentSlideIndex={currentSlideIndex}
                    onGenerateWithAI={handleGenerateWithAI}
                    isGeneratingAI={isGeneratingAI}
                    onRemoveSlide={removeSlide}
                    whatsappIdeas={whatsappIdeas}
                    isLoadingWhatsApp={isLoadingWhatsApp}
                    onLoadWhatsAppIdeas={handleLoadWhatsAppIdeas}
                    trendingWebTopics={trendingWebTopics}
                    isLoadingWeb={isLoadingWeb}
                    onLoadWebTopics={handleLoadWebTopics}
                    hideAIAssistant={true}
                  />
                </div>
              )}

              {/* ABA 4: LEGENDA */}
              {activeTab === 'caption' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <CaptionBox
                    caption={postData.caption}
                    onChangeCaption={(newCap) => setPostData((prev) => ({ ...prev, caption: newCap }))}
                    onGenerateCaption={handleGenerateCaption}
                    isGeneratingCaption={isGeneratingCaption}
                  />
                </div>
              )}
            </div>

            {/* RODAPÉ DO PAINEL LATERAL: BOTÃO DINÂMICO PARA O PRÓXIMO PASSO */}
            <div className="p-3 bg-slate-50 border-t border-slate-200/80 shrink-0 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-normal text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{totalSlides > 1 ? `${totalSlides} slides` : '1 slide'}</span>
              </span>

              {activeTab === 'design' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('ai')}
                  className="text-emerald-700 hover:text-emerald-800 font-normal hover:underline cursor-pointer flex items-center gap-1 transition-all"
                >
                  <span>Criativo →</span>
                </button>
              )}

              {activeTab === 'ai' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('content')}
                  className="text-emerald-700 hover:text-emerald-800 font-normal hover:underline cursor-pointer flex items-center gap-1 transition-all"
                >
                  <span>Conteúdo →</span>
                </button>
              )}

              {activeTab === 'content' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('caption')}
                  className="text-emerald-700 hover:text-emerald-800 font-normal hover:underline cursor-pointer flex items-center gap-1 transition-all"
                >
                  <span>Legenda →</span>
                </button>
              )}

              {activeTab === 'caption' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('design')}
                  className="text-slate-500 hover:text-slate-800 font-normal hover:underline cursor-pointer flex items-center gap-1 transition-all"
                >
                  <span>← Voltar ao Design</span>
                </button>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
