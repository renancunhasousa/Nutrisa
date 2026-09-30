import React, { useState, useRef } from 'react';
import {
  Layout,
  Palette,
  Upload,
  RotateCcw,
  CheckCircle2,
  UserCheck,
  Plus,
  ImagePlus,
  Trash2,
  Layers,
  Info
} from 'lucide-react';
import { POST_FORMATS, POST_THEMES } from '../services/postGeneratorService.js';
import defaultDraPhoto from '../../../assets/dra_isabela.png';

export function PostDesignConfig({
  postData,
  onChangePostData,
  currentTheme,
  onChangeTheme,
  onCustomPhotoUpload,
  onResetPhoto,
  hasCustomPhoto,
  onAddFormatAsSlide,
  onAddSlideWithConfig,
  onResetSlides,
  isCarousel
}) {
  // --- Estado de seleção para "Adicionar Slide" ---
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(null);
  // Galeria de fotos: { id, url, label }
  const [photoGallery, setPhotoGallery] = useState([
    { id: 'official', url: defaultDraPhoto, label: 'Foto Oficial (Dra. Isabela)' }
  ]);
  const [selectedPhotoId, setSelectedPhotoId] = useState('official');
  const galleryInputRef = useRef(null);

  const handleFormatPreview = (formatId) => {
    onChangePostData({ ...postData, format: formatId });
  };

  const handleAddPhotoToGallery = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const newPhoto = {
      id: `photo-${Date.now()}`,
      url,
      label: file.name.replace(/\.[^.]+$/, '').slice(0, 20) || 'Foto Nova'
    };
    setPhotoGallery((prev) => [...prev, newPhoto]);
    setSelectedPhotoId(newPhoto.id);
    // Atualiza o preview global
    const fakeEvt = { target: { files: [file] } };
    onCustomPhotoUpload(fakeEvt);
    e.target.value = '';
  };

  const handleRemoveGalleryPhoto = (id) => {
    if (id === 'official') return;
    setPhotoGallery((prev) => prev.filter((p) => p.id !== id));
    if (selectedPhotoId === id) {
      setSelectedPhotoId('official');
      onResetPhoto();
    }
  };

  const handleSelectGalleryPhoto = (photo) => {
    setSelectedPhotoId(photo.id);
    if (photo.id === 'official') {
      onResetPhoto();
    } else {
      fetch(photo.url)
        .then((r) => r.blob())
        .then((blob) => {
          const fakeFile = new File([blob], photo.label, { type: blob.type });
          onCustomPhotoUpload({ target: { files: [fakeFile] } });
        });
    }
  };

  const getSelectedPhotoUrl = () => {
    if (selectedPhotoId === 'official') return defaultDraPhoto;
    const found = photoGallery.find((p) => p.id === selectedPhotoId);
    return found ? found.url : null;
  };

  const canAddSlide = Boolean(selectedFormat);

  const handleAddSlide = () => {
    if (!canAddSlide) return;
    onAddSlideWithConfig({
      formatId: selectedFormat,
      themeId: selectedTheme || currentTheme,
      photoUrl: getSelectedPhotoUrl()
    });
  };

  const selectedFormatObj = POST_FORMATS.find((f) => f.id === selectedFormat);
  const selectedThemeObj = selectedTheme ? POST_THEMES.find((t) => t.id === selectedTheme) : null;

  return (
    <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-xs mb-6 space-y-5">
      {/* CABEÇALHO */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Configurações Iniciais &amp; Identidade Visual
          </h3>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Selecione modelo, cor e foto → clique em{' '}
            <strong className="text-emerald-600">Adicionar Slide</strong> para criar uma lâmina personalizada.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

        {/* 1. MODELO / FORMATO (6 COLUNAS) */}
        <div className="lg:col-span-6 flex flex-col">
          <label className="text-[10px] font-extrabold text-slate-500 uppercase flex items-center gap-1.5 ml-1 mb-2">
            <Layout className="w-3.5 h-3.5 text-emerald-600" />
            <span>1. Modelos de Publicação</span>
          </label>

          <div className="grid grid-cols-2 gap-2 flex-1">
            {POST_FORMATS.map((fmt) => {
              const isSelected = selectedFormat === fmt.id;
              return (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setSelectedFormat(isSelected ? null : fmt.id)}
                  title={isSelected ? 'Remover seleção' : `Selecionar "${fmt.label}"`}
                  className={`w-full text-left rounded-xl border transition-all cursor-pointer px-3 py-2.5 relative flex flex-col justify-center ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  {isSelected && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 absolute top-2.5 right-2.5 shrink-0" />
                  )}
                  <span className={`text-[11px] font-bold leading-tight block truncate pr-5 ${isSelected ? 'text-emerald-800' : 'text-slate-700'}`}>
                    {fmt.label}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate block mt-0.5">{fmt.subtitle}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. MODELO DE COR (3 COLUNAS) */}
        <div className="lg:col-span-3 flex flex-col">
          <label className="text-[10px] font-extrabold text-slate-500 uppercase flex items-center gap-1.5 ml-1 mb-2">
            <Palette className="w-3.5 h-3.5 text-emerald-600" />
            <span>2. Modelo de Cor</span>
          </label>

          <div className="grid grid-cols-1 grid-rows-3 gap-2 flex-1">
            {POST_THEMES.map((th) => {
              const isSelected = selectedTheme === th.id;
              return (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setSelectedTheme(null);
                    } else {
                      setSelectedTheme(th.id);
                      onChangeTheme(th.id);
                    }
                  }}
                  title={isSelected ? 'Remover seleção de cor' : `Selecionar "${th.name}"`}
                  className={`w-full text-left rounded-xl border transition-all cursor-pointer px-3 py-2 relative flex items-center gap-2.5 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 shadow-sm ring-1 ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 hover:shadow-xs text-slate-700'
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full shrink-0 shadow-xs border border-white"
                    style={{ backgroundColor: th.dotColor }}
                  />
                  <div className="min-w-0 flex-1 pr-5">
                    <div className={`text-xs font-bold truncate leading-tight ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>
                      {th.name}
                    </div>
                    <div className="text-[9px] text-slate-400 truncate mt-0.5">{th.tag}</div>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 absolute top-2.5 right-2.5 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. FOTOGRAFIA (3 COLUNAS) */}
        <div className="lg:col-span-3 flex flex-col">
          <label className="text-[10px] font-extrabold text-slate-500 uppercase flex items-center gap-1.5 ml-1 mb-2">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>3. Fotografia</span>
          </label>

          <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-2xl flex flex-col justify-between flex-1 gap-2.5">
            {/* Grade de miniaturas */}
            <div className="grid grid-cols-3 gap-1.5">
              {photoGallery.map((photo) => {
                const isSelected = selectedPhotoId === photo.id;
                return (
                  <div
                    key={photo.id}
                    className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all group ${
                      isSelected
                        ? 'border-emerald-500 shadow-sm'
                        : 'border-transparent hover:border-slate-300'
                    }`}
                    style={{ aspectRatio: '1/1' }}
                    onClick={() => handleSelectGalleryPhoto(photo)}
                    title={photo.label}
                  >
                    {photo.url ? (
                      <img
                        src={photo.url}
                        alt={photo.label}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-emerald-100 flex items-center justify-center">
                        <span className="text-emerald-800 font-black text-xs">IM</span>
                      </div>
                    )}

                    {isSelected && (
                      <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 drop-shadow" />
                      </div>
                    )}

                    {photo.id !== 'official' && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveGalleryPhoto(photo.id); }}
                        className="absolute top-0.5 right-0.5 w-4 h-4 bg-rose-500 text-white rounded-full hidden group-hover:flex items-center justify-center transition-all cursor-pointer"
                        title="Remover foto da galeria"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Slot para adicionar nova foto */}
              <label
                className="rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-400 bg-white hover:bg-emerald-50/30 flex flex-col items-center justify-center cursor-pointer transition-all group"
                style={{ aspectRatio: '1/1' }}
                title="Adicionar nova foto à galeria"
              >
                <ImagePlus className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                <span className="text-[8px] font-bold text-slate-400 group-hover:text-emerald-600 mt-0.5">
                  Adicionar
                </span>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAddPhotoToGallery}
                />
              </label>
            </div>

            {/* Nome da foto selecionada */}
            <p className="text-[10px] text-slate-500 font-medium truncate">
              ✓ {photoGallery.find((p) => p.id === selectedPhotoId)?.label || 'Foto Oficial'}
            </p>

            {/* Trocar preview global */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all cursor-pointer">
                <Upload className="w-3 h-3 text-slate-500" />
                <span>Trocar Preview</span>
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
                  title="Restaurar foto oficial"
                  className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 text-slate-500" />
                  <span>Oficial</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ RESUMO + BOTÃO ADICIONAR SLIDE ═══ */}
      <div className={`rounded-2xl border transition-all ${
        canAddSlide
          ? 'bg-emerald-50/50 border-emerald-200'
          : 'bg-slate-50/60 border-slate-200'
      }`}>
        <div className="flex items-center justify-between p-3.5 gap-3 flex-wrap">
          {/* Resumo visual das seleções */}
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            <Layers className={`w-4 h-4 shrink-0 ${canAddSlide ? 'text-emerald-600' : 'text-slate-400'}`} />
            <div className="flex items-center gap-1.5 flex-wrap">
              {selectedFormatObj ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {selectedFormatObj.label}
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-medium italic">← Selecione um modelo</span>
              )}
              {selectedThemeObj && (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                  style={{
                    backgroundColor: `${selectedThemeObj.dotColor}22`,
                    borderColor: `${selectedThemeObj.dotColor}55`,
                    color: selectedThemeObj.dotColor
                  }}
                >
                  ● {selectedThemeObj.name.split(' ')[0]}
                </span>
              )}
              {selectedPhotoId !== 'official' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                  📸 {photoGallery.find((p) => p.id === selectedPhotoId)?.label}
                </span>
              )}
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Botão Limpar Slides — só visível quando há carrossel */}
            {isCarousel && onResetSlides && (
              <button
                type="button"
                onClick={onResetSlides}
                title="Limpar todos os slides e voltar ao post único"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Slides</span>
              </button>
            )}

            {/* Botão Adicionar Slide */}
            <button
              type="button"
              onClick={handleAddSlide}
              disabled={!canAddSlide}
              title={canAddSlide
                ? 'Adicionar slide com as configurações selecionadas'
                : 'Selecione ao menos um modelo de publicação'}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                canAddSlide
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm active:scale-95 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Slide</span>
            </button>
          </div>
        </div>

        {!canAddSlide && (
          <div className="px-3.5 pb-3 flex items-center gap-1.5">
            <Info className="w-3 h-3 text-slate-400 shrink-0" />
            <p className="text-[10px] text-slate-400">
              Selecione um <strong>Modelo</strong> (item 1) para habilitar. Cor e Foto são opcionais — usará configurações globais se não marcadas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

