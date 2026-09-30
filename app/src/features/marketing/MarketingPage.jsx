import React, { useState } from 'react';
import {
  Download,
  Archive
} from 'lucide-react';
import { usePostStudio } from './hooks/usePostStudio.js';
import { PostDesignConfig } from './components/PostDesignConfig.jsx';
import { PostSlideViewer } from './components/PostSlideViewer.jsx';
import { PostContentEditor } from './components/PostContentEditor.jsx';
import { CaptionBox } from './components/CaptionBox.jsx';

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

  const [previewScale, setPreviewScale] = useState(0.52);
  const isCarousel = postData.format === 'carrossel';

  return (
    <div className="animate-fadeIn max-w-7xl xl:max-w-[1440px] mx-auto space-y-6 pb-16 print:hidden">
      {/* CABEÇALHO DO MÓDULO - IDÊNTICO À IMAGEM DE REFERÊNCIA */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Estúdio de Posts & Carrossel IA
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1 max-w-2xl leading-relaxed">
            Criação de publicações e carrosséis para Instagram com apoio de IA, alternância de paletas e download em alta resolução.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">

          {/* Botão Primário (Verde Sólido) */}
          {isCarousel ? (
            <button
              type="button"
              onClick={handleDownloadCarouselZip}
              disabled={isDownloading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-full shadow-xs transition-all flex items-center space-x-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{isDownloading ? (downloadProgress || 'Exportando...') : 'Baixar Carrossel (ZIP)'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDownloadSingleImage}
              disabled={isDownloading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-full shadow-xs transition-all flex items-center space-x-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Gerando...' : 'Baixar Post'}</span>
            </button>
          )}

          {/* Botão secundário de slide avulso apenas no modo carrossel */}
          {isCarousel && (
            <button
              type="button"
              onClick={handleDownloadSingleImage}
              disabled={isDownloading}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-full border border-slate-300 shadow-2xs transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Slide Atual</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. CONFIGURAÇÕES INICIAIS & DESIGN (MODELO, PALETA DE COR, FOTO DA DRA) */}
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
        isCarousel={postData.format === 'carrossel'}
      />

      {/* 3. ÁREA DE TRABALHO: PREVIEW/SLIDES À ESQUERDA (MAIOR) E CAMPOS DE CONTEÚDO À DIREITA (ALTURAS SINCRONIZADAS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* COLUNA ESQUERDA: IMAGEM/PREVIEW DO POST (7 COLUNAS - MAIOR) */}
        <div className="lg:col-span-7 flex flex-col h-full">
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
            onDownloadSingleImage={handleDownloadSingleImage}
            isDownloading={isDownloading}
            onConvertToCarousel={handleConvertToCarousel}
            onAddAsSlide={addCurrentPostAsSlide}
          />
        </div>

        {/* COLUNA DIREITA: CAMPOS PARA EDITAR O CONTEÚDO (5 COLUNAS) */}
        <div className="lg:col-span-5 flex flex-col h-full">
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
          />
        </div>
      </div>

      {/* 4. LEGENDA DO INSTAGRAM: LARGURA TOTAL IGUAL AO BLOCO DE CONFIGURAÇÃO */}
      <CaptionBox
        caption={postData.caption}
        onChangeCaption={(newCap) => setPostData((prev) => ({ ...prev, caption: newCap }))}
        onGenerateCaption={handleGenerateCaption}
        isGeneratingCaption={isGeneratingCaption}
      />
    </div>
  );
}
