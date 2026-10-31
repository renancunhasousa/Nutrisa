import React, { useEffect } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  FileText,
  FilePlus,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react';
import { PostCanvas } from './PostCanvas.jsx';
import { InstagramIcon } from './InstagramIcon.jsx';

export function PostSlideViewer({
  canvasRef,
  postData,
  theme,
  customPhotoUrl,
  previewScale = 0.52,
  setPreviewScale,
  currentSlideIndex = 0,
  onGoToSlide,
  onAddSlide,
  onRemoveSlide,
  onPrevSlide,
  onNextSlide,
  isSidebarOpen = true,
  onToggleSidebar
}) {
  const slides = postData.slides && postData.slides.length > 0
    ? postData.slides
    : [{ id: 'default-1', format: postData.format || 'autoridade', title: 'Slide 01' }];
  const totalSlides = slides.length;

  const formatNames = {
    autoridade: 'Autoridade',
    prato: 'Prato',
    ciencia: 'Ciência',
    dicas: 'Dicas',
    cta: 'CTA',
    manifesto: 'Manifesto',
    passo: 'Passo Clínico'
  };

  // Teclas de atalho para navegar entre slides
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (totalSlides > 1) {
        if (e.key === 'ArrowLeft' && currentSlideIndex > 0) {
          onPrevSlide?.();
        } else if (e.key === 'ArrowRight' && currentSlideIndex < totalSlides - 1) {
          onNextSlide?.();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalSlides, currentSlideIndex, onPrevSlide, onNextSlide]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col h-full min-h-0 relative transition-all">
      {/* 1. BARRA DE ABAS DE SLIDES ESTILO CONTRATOS (EXATOS 56px NIVELADOS COM O BLOCO DA DIREITA) */}
      <div className="h-[56px] px-4 bg-slate-50 border-b border-slate-200 shrink-0 flex items-end gap-1.5 overflow-x-auto">
        {slides.map((slide, index) => {
          const isSelected = index === currentSlideIndex;
          const slideFormatName = slide.format ? (formatNames[slide.format] || slide.format) : null;
          const slideNum = String(index + 1).padStart(2, '0');
          const label = slideFormatName
            ? `${slideNum}. ${slideFormatName}`
            : (slide.type === 'cover' ? `${slideNum}. Capa` : (slide.type === 'cta' ? `${slideNum}. CTA` : `${slideNum}. Slide`));

          return (
            <div
              key={slide.id || index}
              onClick={() => onGoToSlide(index)}
              className={`group flex items-center gap-2 px-3.5 py-2.5 rounded-t-lg text-xs transition-all border border-b-0 shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-white border-slate-200 text-emerald-800 shadow-2xs font-medium'
                  : 'bg-slate-100/80 border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200/70 font-normal'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{label}</span>
              {totalSlides > 1 && (
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
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={onAddSlide}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-t-lg text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors shrink-0 border border-transparent cursor-pointer"
          title="Adicionar nova lâmina"
        >
          <FilePlus className="w-3.5 h-3.5 text-emerald-600" />
          <span>Novo slide</span>
        </button>
      </div>

      {/* 2. BARRA DE STATUS, RESOLUÇÃO & CONTROLES */}
      <div className="px-5 py-3 bg-white border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap shrink-0">
        <div className="flex items-center gap-2">
          {/* Ícone do Instagram SEM fundo verde */}
          <InstagramIcon className="w-4 h-4 text-slate-600" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-slate-800">
              {totalSlides > 1
                ? `Slide ${currentSlideIndex + 1} de ${totalSlides}`
                : 'Post Instagram'}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80">
              1080 × 1350 px (4:5)
            </span>
          </div>
        </div>

        {/* FERRAMENTAS DE ZOOM E MODO FOCO */}
        <div className="flex items-center gap-2">
          {/* Zoom Presets Rápidos */}
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setPreviewScale((s) => Math.max(0.35, Number((s - 0.05).toFixed(2))))}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-0.5 px-1">
              {[0.45, 0.55, 0.65].map((preset) => {
                const isActive = Math.abs(previewScale - preset) < 0.04;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPreviewScale(preset)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-emerald-700 shadow-2xs border border-slate-200/80'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {Math.round(preset * 100)}%
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setPreviewScale((s) => Math.min(0.85, Number((s + 0.05).toFixed(2))))}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Botão de Toggle da Sidebar (Modo Foco) */}
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                !isSidebarOpen
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
              }`}
              title={isSidebarOpen ? 'Ocultar painel lateral (Modo Foco na Arte)' : 'Mostrar painel lateral de edição'}
            >
              {isSidebarOpen ? (
                <>
                  <PanelRightClose className="w-4 h-4 text-slate-500" />
                  <span className="hidden sm:inline text-xs font-semibold">Foco</span>
                </>
              ) : (
                <>
                  <PanelRightOpen className="w-4 h-4 text-white" />
                  <span className="text-xs font-semibold">Editar</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 3. ÁREA CENTRAL DA PRANCHETA (MESA DE LUZ) */}
      <div
        className="flex-1 flex items-center justify-center p-6 md:p-8 overflow-auto relative select-none min-h-0"
        style={{
          backgroundColor: '#f8fafc',
          backgroundImage: 'radial-gradient(#e2e8f0 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px'
        }}
      >
        {/* Setas Flutuantes de Navegação Lateral */}
        {totalSlides > 1 && (
          <>
            <button
              type="button"
              onClick={onPrevSlide}
              disabled={currentSlideIndex === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200 shadow-lg backdrop-blur-sm flex items-center justify-center transition-all active:scale-95 disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
              title="Slide anterior (←)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={onNextSlide}
              disabled={currentSlideIndex >= totalSlides - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200 shadow-lg backdrop-blur-sm flex items-center justify-center transition-all active:scale-95 disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
              title="Próximo slide (→)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* CONTAINER DA ARTE */}
        <div className="transition-transform duration-200 ease-out origin-center drop-shadow-2xl">
          <PostCanvas
            ref={canvasRef}
            postData={postData}
            theme={theme}
            customPhotoUrl={customPhotoUrl}
            scale={previewScale}
            currentSlideIndex={currentSlideIndex}
          />
        </div>
      </div>
    </div>
  );
}
