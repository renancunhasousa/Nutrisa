import React from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  FilePlus
} from 'lucide-react';
import { PostCanvas } from './PostCanvas.jsx';
import { InstagramIcon } from './InstagramIcon.jsx';

export function PostSlideViewer({
  canvasRef,
  postData,
  theme,
  customPhotoUrl,
  previewScale,
  setPreviewScale,
  currentSlideIndex,
  onGoToSlide,
  onAddSlide,
  onRemoveSlide,
  onPrevSlide,
  onNextSlide,
  onDownloadSingleImage,
  isDownloading,
  onConvertToCarousel,
  onAddAsSlide
}) {
  const isCarousel = postData.format === 'carrossel';
  const slides = postData.slides || [];
  const totalSlides = slides.length;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-full">
      {/* BARRA DE ABAS DE SLIDES ESTILO CONTRATOS */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-0 bg-slate-50 border-b border-slate-200 shrink-0 overflow-x-auto">
        {isCarousel ? (
          <>
            {slides.map((slide, index) => {
              const isSelected = index === currentSlideIndex;
              const formatNames = {
                autoridade: 'Autoridade',
                prato: 'Prato',
                ciencia: 'Ciência',
                dicas: 'Dicas',
                cta: 'CTA',
                manifesto: 'Manifesto',
                passo: 'Passo Clínico'
              };
              const slideFormatName = slide.format ? (formatNames[slide.format] || slide.format) : null;
              const slideNum = String(index + 1).padStart(2, '0');
              const label = slideFormatName
                ? `${slideNum}. ${slideFormatName}`
                : (slide.type === 'cover' ? `${slideNum}. Capa` : (slide.type === 'cta' ? `${slideNum}. CTA` : `${slideNum}. Slide`));

              return (
                <div
                  key={slide.id || index}
                  onClick={() => onGoToSlide(index)}
                  className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-[11px] font-bold cursor-pointer transition-all border border-b-0 shrink-0 ${
                    isSelected
                      ? 'bg-white border-slate-200 text-emerald-700 shadow-xs'
                      : 'bg-slate-100 border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>{label}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveSlide(index);
                    }}
                    className="ml-1 p-0.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title={`Excluir slide ${slideNum}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              onClick={onAddSlide}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-t-lg text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 transition-colors shrink-0 border border-transparent cursor-pointer"
              title="Adicionar nova lâmina ao carrossel"
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span>Novo slide</span>
            </button>
          </>
        ) : (
          <div className="flex items-center w-full pb-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-[11px] font-bold bg-white border border-slate-200 border-b-0 text-emerald-700 shadow-xs">
              <FileText className="w-3 h-3" />
              <span>Slide 01</span>
            </div>
          </div>
        )}
      </div>

      {/* BARRA DE FERRAMENTAS DO PREVIEW (ZOOM E NAVEGAÇÃO) */}
      <div className="px-4 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {isCarousel && (
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={onPrevSlide}
                disabled={currentSlideIndex === 0}
                className="p-1 hover:bg-white rounded text-slate-600 disabled:opacity-30 cursor-pointer"
                title="Lâmina anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-bold text-slate-700 px-1">
                {currentSlideIndex + 1} / {totalSlides}
              </span>
              <button
                type="button"
                onClick={onNextSlide}
                disabled={currentSlideIndex >= totalSlides - 1}
                className="p-1 hover:bg-white rounded text-slate-600 disabled:opacity-30 cursor-pointer"
                title="Próxima lâmina"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
            <InstagramIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>Instagram 4:5 • 1080×1350 px</span>
          </span>
        </div>

        {/* Controles de Zoom */}
        <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setPreviewScale((s) => Math.max(0.35, s - 0.05))}
            className="p-1 hover:bg-white rounded text-slate-600 cursor-pointer"
            title="Diminuir zoom"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="text-[10px] font-bold text-slate-600 px-1 min-w-[32px] text-center">
            {Math.round(previewScale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setPreviewScale((s) => Math.min(0.75, Number((s + 0.05).toFixed(2))))}
            className="p-1 hover:bg-white rounded text-slate-600 cursor-pointer"
            title="Aumentar zoom"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ÁREA CENTRAL DO CANVAS */}
      <div className="flex-1 flex items-center justify-center p-4 bg-slate-100/60 overflow-hidden min-h-[500px]">
        <PostCanvas
          ref={canvasRef}
          postData={postData}
          theme={theme}
          customPhotoUrl={customPhotoUrl}
          scale={previewScale}
          currentSlideIndex={currentSlideIndex}
        />
      </div>

      {/* RODAPÉ DO VISUALIZADOR COM BOTÃO DE DOWNLOAD RÁPIDO DO SLIDE */}
      <div className="px-4 py-3 bg-white border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-medium">
          {isCarousel ? `Visualizando Lâmina ${currentSlideIndex + 1}` : 'Feed Instagram • 1080×1350'}
        </span>
        <button
          type="button"
          onClick={onDownloadSingleImage}
          disabled={isDownloading}
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isCarousel ? 'Baixar Este Slide' : 'Baixar Post'}</span>
        </button>
      </div>
    </div>
  );
}
