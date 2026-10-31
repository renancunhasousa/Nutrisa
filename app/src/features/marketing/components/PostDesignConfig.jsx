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
  Info,
  Check
} from 'lucide-react';
import { POST_FORMATS, getPostFormats, POST_THEMES } from '../services/postGeneratorService.js';
import defaultDraPhoto from '../../../assets/dra_isabela.png';
import { getActiveNutritionist } from '../../configuracoes/services/clinicProfileService.js';

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
  const activeNutri = getActiveNutritionist();
  const isIsabela = /isabela/i.test(activeNutri?.name || '');
  const [selectedFormat, setSelectedFormat] = useState(postData.format || 'autoridade');
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [photoGallery, setPhotoGallery] = useState(() => {
    const list = [];
    if (isIsabela) {
      list.push({ id: 'dra_isabela', url: defaultDraPhoto, label: 'Foto Oficial (Dra. Isabela)' });
    }
    if (activeNutri?.marketingPhotoUrl && activeNutri.marketingPhotoUrl !== defaultDraPhoto) {
      list.unshift({
        id: 'official',
        url: activeNutri.marketingPhotoUrl,
        label: `Foto Oficial (${activeNutri.name ? activeNutri.name.split(' ')[0] : 'Nutri'})`
      });
    }
    return list;
  });
  const [selectedPhotoId, setSelectedPhotoId] = useState(() => {
    if (activeNutri?.marketingPhotoUrl && activeNutri.marketingPhotoUrl !== defaultDraPhoto) {
      return 'official';
    }
    return isIsabela ? 'dra_isabela' : null;
  });
  const galleryInputRef = useRef(null);

  // Aplica o formato diretamente ao post / slide atual
  const handleApplyFormatToCurrent = (formatId) => {
    setSelectedFormat(formatId);
    if (isCarousel && postData.slides && postData.slides.length > 0) {
      // Se for carrossel, atualiza o slide ativo
      if (onChangePostData) {
        onChangePostData({ ...postData, format: formatId });
      }
    } else {
      if (onChangePostData) {
        onChangePostData({ ...postData, format: formatId });
      }
    }
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

  const handleAddSlide = () => {
    if (!selectedFormat) return;
    onAddSlideWithConfig({
      formatId: selectedFormat,
      themeId: selectedTheme || currentTheme,
      photoUrl: getSelectedPhotoUrl()
    });
  };

  const availableFormats = getPostFormats(activeNutri);
  const selectedFormatObj = availableFormats.find((f) => f.id === selectedFormat);
  const selectedThemeObj = selectedTheme ? POST_THEMES.find((t) => t.id === selectedTheme) : null;

  return (
    <div className="space-y-5">
      {/* 1. MODELOS DE PUBLICAÇÃO */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Layout className="w-3.5 h-3.5 text-emerald-600" />
            <span>1. Modelo do Slide</span>
          </label>
          <span className="text-[10px] text-slate-400 font-medium">
            Clique para mudar o estilo
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {availableFormats.map((fmt) => {
            const isSelected = (postData.format === fmt.id) || (selectedFormat === fmt.id);
            return (
              <button
                key={fmt.id}
                type="button"
                onClick={() => handleApplyFormatToCurrent(fmt.id)}
                className={`w-full text-left rounded-xl border transition-all cursor-pointer p-2.5 relative flex flex-col justify-between min-h-[64px] ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/80 shadow-2xs ring-1 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className={`text-[11px] font-bold leading-tight block ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>
                    {fmt.label}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  )}
                </div>
                <span className="text-[9px] text-slate-400 truncate block mt-1">
                  {fmt.subtitle}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. PALETA DE CORES */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-emerald-600" />
            <span>2. Paleta &amp; Cores</span>
          </label>
          <span className="text-[10px] text-slate-400 font-medium">
            {POST_THEMES.find((t) => t.id === currentTheme)?.name || 'Padrão'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {POST_THEMES.map((th) => {
            const isSelected = currentTheme === th.id;
            return (
              <button
                key={th.id}
                type="button"
                onClick={() => {
                  setSelectedTheme(th.id);
                  onChangeTheme(th.id);
                }}
                className={`w-full text-left rounded-xl border transition-all cursor-pointer p-2 relative flex flex-col gap-1.5 ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/80 ring-1 ring-emerald-500/20 shadow-2xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-4 h-4 rounded-full border border-white shadow-xs"
                    style={{ backgroundColor: th.dotColor }}
                  />
                  {isSelected && (
                    <Check className="w-3 h-3 text-emerald-600" />
                  )}
                </div>
                <div>
                  <div className={`text-[10px] font-bold truncate leading-tight ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                    {th.name.split(' ')[0]}
                  </div>
                  <div className="text-[8px] text-slate-400 truncate">
                    {th.tag}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. FOTOGRAFIA & GALERIA DA DRA */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>3. Fotografia &amp; Imagem</span>
          </label>
          <span className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">
            {photoGallery.find((p) => p.id === selectedPhotoId)?.label || 'Oficial'}
          </span>
        </div>

        <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-200 space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {photoGallery.map((photo) => {
              const isSelected = selectedPhotoId === photo.id;
              return (
                <div
                  key={photo.id}
                  className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all group ${
                    isSelected ? 'border-emerald-500 shadow-xs' : 'border-slate-200 hover:border-slate-300'
                  }`}
                  style={{ aspectRatio: '1/1' }}
                  onClick={() => handleSelectGalleryPhoto(photo)}
                  title={photo.label}
                >
                  {photo.url ? (
                    <img src={photo.url} alt={photo.label} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-emerald-100 flex items-center justify-center">
                      <span className="text-emerald-800 font-black text-xs">IM</span>
                    </div>
                  )}

                  {isSelected && (
                    <div className="absolute inset-0 bg-emerald-600/20 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 drop-shadow" />
                    </div>
                  )}

                  {photo.id !== 'official' && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRemoveGalleryPhoto(photo.id); }}
                      className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full hidden group-hover:flex items-center justify-center transition-all cursor-pointer"
                      title="Remover foto"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              );
            })}

            {/* Adicionar nova foto */}
            <label
              className="rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-400 bg-white hover:bg-emerald-50/30 flex flex-col items-center justify-center cursor-pointer transition-all group"
              style={{ aspectRatio: '1/1' }}
              title="Adicionar nova foto à galeria"
            >
              <ImagePlus className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
              <span className="text-[8px] font-bold text-slate-400 group-hover:text-emerald-700 mt-0.5">
                Upload
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

          {/* Trocar Preview e Restaurar Oficial */}
          <div className="flex items-center gap-2 pt-1">
            <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all cursor-pointer">
              <Upload className="w-3 h-3 text-slate-500" />
              <span>Trocar Foto Atual</span>
              <input type="file" accept="image/*" className="hidden" onChange={onCustomPhotoUpload} />
            </label>

            {hasCustomPhoto && (
              <button
                type="button"
                onClick={onResetPhoto}
                className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-all cursor-pointer"
                title={isIsabela ? 'Restaurar foto oficial da Dra. Isabela' : 'Restaurar foto oficial'}
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                <span>Oficial</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. ADICIONAR NOVO SLIDE */}
      <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Adicionar Novo Slide</span>
          </span>
          {selectedFormatObj && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
              {selectedFormatObj.label}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleAddSlide}
          className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Slide com Este Estilo</span>
        </button>

        {isCarousel && onResetSlides && (
          <button
            type="button"
            onClick={onResetSlides}
            className="w-full py-1.5 text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center justify-center gap-1 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>Limpar Slides Extras</span>
          </button>
        )}
      </div>
    </div>
  );
}
