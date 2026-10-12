import { useEffect, useRef, useState } from 'react';
import { Barcode, Camera, ClipboardPaste, ExternalLink, ImagePlus, Plus, Search, Sparkles, Trash2, X, Apple, CookingPot, Package, Pill, CupSoda, Tag, ClipboardList, SlidersHorizontal, Flame, Wheat, BadgeCheck, Beef, Drumstick, Bean, Milk, Salad, Nut } from 'lucide-react';
import { prepareNutritionLabelImage } from '../services/productResearchInput.js';
import { normalizeBarcodeInput } from '../services/productLookup.js';

const EMPTY_FORM = {
  name: '', brand: '', category: 'alimento', item_type: 'alimento', food_group: '',
  preparation_method: '', video_url: '', barcode: '', description: '', reference_quantity: 100,
  reference_unit: 'g', household_measures: [], official_source: '',
  official_source_code: '', source_version: '', is_available_for_diets: false,
  serving_size: '', serving_unit: 'g', calories: '', protein_g: '', carbs_g: '',
  fat_g: '', fiber_g: '', sodium_mg: '', nutrition_facts: [], ingredients: '',
  allergens: '', image_path: '', image_url: '', source_type: 'manual', source_urls: [],
  source_notes: '', verification_status: 'draft', verified_at: null,
};

const FIELD_CLASS = 'mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-normal shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 sm:text-sm';
const SECTION_CLASS = 'rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5';
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;

const SOURCE_LABELS = {
  ai_web: 'Rascunho gerado com IA',
  ai_vision: 'Rascunho lido da foto com IA',
  open_food_facts: 'Rascunho importado pelo código de barras',
  imported: 'Rascunho importado',
};

const ITEM_TYPES = [
  ['alimento', 'Alimento'], ['preparacao', 'Preparação'], ['produto', 'Produto'],
  ['suplemento', 'Suplemento'], ['bebida', 'Bebida'],
];

const FOOD_GROUPS = [
  'Cereais e Tubérculos', 'Carnes e Ovos', 'Leguminosas', 'Laticínios',
  'Frutas', 'Verduras e Legumes', 'Gorduras e Oleaginosas', 'Bebidas', 'Outros',
];

const normalizeNutrientName = (value = '') => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

function includeOptionalNutrients(values) {
  const nutritionFacts = [...(values.nutrition_facts || [])];
  const includes = (names) => nutritionFacts.some((item) => names.includes(normalizeNutrientName(item.name)));
  if (values.fiber_g !== '' && values.fiber_g !== null && values.fiber_g !== undefined && !includes(['fibra', 'fibras'])) {
    nutritionFacts.push({ name: 'Fibras', amount: values.fiber_g, unit: 'g' });
  }
  if (values.sodium_mg !== '' && values.sodium_mg !== null && values.sodium_mg !== undefined && !includes(['sodio'])) {
    nutritionFacts.push({ name: 'Sódio', amount: values.sodium_mg, unit: 'mg' });
  }
  return nutritionFacts;
}

export default function ProductFormDialog({ open, product, onClose, onSave, onBarcodeLookup, onResearch }) {
  const dialogRef = useRef(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [labelImageFile, setLabelImageFile] = useState(null);
  const [labelPreviewUrl, setLabelPreviewUrl] = useState('');
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [researching, setResearching] = useState(false);
  const [researchError, setResearchError] = useState('');
  const [researchStatus, setResearchStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const next = product ? { ...EMPTY_FORM, ...product, nutrition_facts: includeOptionalNutrients(product), source_urls: product.source_urls || [] } : EMPTY_FORM;
    setForm(next);
    setLabelImageFile(null);
    setImageFile(null);
    setError('');
    setResearchError('');
    setResearchStatus('');
  }, [product, open]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(form.image_url || '');
      return undefined;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile, form.image_url]);

  useEffect(() => {
    if (!labelImageFile) {
      setLabelPreviewUrl('');
      return undefined;
    }
    const objectUrl = URL.createObjectURL(labelImageFile);
    setLabelPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [labelImageFile]);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const applyDraft = (draft, sourceType, sources = []) => {
    setForm((current) => ({
      ...current,
      ...Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, value ?? ''])),
      nutrition_facts: includeOptionalNutrients(draft),
      source_type: sourceType || draft.source_type || 'imported',
      source_urls: draft.source_urls || sources.map((source) => source.url),
      source_notes: draft.source_notes || '',
      verification_status: 'draft',
      verified_at: null,
    }));
  };

  const runBarcodeLookup = async () => {
    const barcode = normalizeBarcodeInput(form.barcode);
    if (barcode.length < 7) {
      setResearchError('Informe um código de barras válido, com pelo menos 7 dígitos.');
      setResearchStatus('');
      return;
    }
    setBarcodeLoading(true);
    setResearchError('');
    setResearchStatus('Consultando o catálogo e a base de produtos…');
    try {
      const result = await onBarcodeLookup(barcode);
      const draft = result.product || {};
      applyDraft(draft, draft.source_type);
      const origin = result.provider === 'catalog' ? 'catálogo da clínica' : 'Open Food Facts';
      setResearchStatus(`Produto encontrado no ${origin}. Confira o rótulo antes de salvar.`);
    } catch (lookupError) {
      setResearchError(lookupError.message || 'Não foi possível consultar o código de barras.');
      setResearchStatus('');
    } finally {
      setBarcodeLoading(false);
    }
  };

  const runResearch = async () => {
    if (!labelImageFile) {
      setResearchError('Escolha ou cole uma imagem da tabela nutricional para usar a IA.');
      setResearchStatus('');
      return;
    }
    setResearching(true);
    setResearchError('');
    setResearchStatus('Preparando e interpretando a imagem do rótulo…');
    try {
      const image = await prepareNutritionLabelImage(labelImageFile);
      const result = await onResearch({ image });
      const draft = result.product || {};
      applyDraft(draft, 'ai_vision');
      setResearchStatus('Imagem interpretada. Confira as informações preenchidas abaixo.');
    } catch (researchError) {
      setResearchError(researchError.message || 'Não foi possível interpretar a imagem.');
      setResearchStatus('');
    } finally {
      setResearching(false);
    }
  };

  const selectLabelImage = (file, status = '') => {
    setLabelImageFile(file || null);
    setResearchError('');
    setResearchStatus(status);
  };

  const getPastedImage = (event) => [...(event.clipboardData?.items || [])]
    .find((item) => item.kind === 'file' && item.type.startsWith('image/')) || null;

  const createPastedImageFile = (imageItem, prefix) => {
    const pastedBlob = imageItem.getAsFile();
    if (!pastedBlob) return null;
    const extension = imageItem.type === 'image/png' ? 'png' : imageItem.type === 'image/webp' ? 'webp' : 'jpg';
    return new File([pastedBlob], `${prefix}-${Date.now()}.${extension}`, {
      type: imageItem.type,
      lastModified: Date.now(),
    });
  };

  const handleLabelImagePaste = (event) => {
    const imageItem = getPastedImage(event);
    if (!imageItem) return;
    event.preventDefault();
    event.stopPropagation();
    if (!ALLOWED_IMAGE_TYPES.includes(imageItem.type)) {
      setResearchError('Cole uma imagem JPG, PNG ou WebP.');
      setResearchStatus('');
      return;
    }
    const pastedFile = createPastedImageFile(imageItem, 'tabela-nutricional-colada');
    if (!pastedFile) {
      setResearchError('Não foi possível ler a imagem copiada. Tente salvá-la e escolher o arquivo.');
      setResearchStatus('');
      return;
    }
    selectLabelImage(pastedFile, 'Imagem colada. Agora clique em “Interpretar imagem com IA”.');
  };

  const selectProductImage = (file) => {
    if (!file) {
      setImageFile(null);
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('Use uma imagem JPG, PNG ou WebP.');
      return;
    }
    if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
      setError('A imagem deve ter no máximo 5 MB.');
      return;
    }
    setImageFile(file);
    setError('');
  };

  const handleProductImagePaste = (event) => {
    const imageItem = getPastedImage(event);
    if (!imageItem) return;
    event.preventDefault();
    event.stopPropagation();
    if (!ALLOWED_IMAGE_TYPES.includes(imageItem.type)) {
      setError('Cole uma imagem JPG, PNG ou WebP.');
      return;
    }
    const pastedFile = createPastedImageFile(imageItem, 'imagem-produto-colada');
    if (!pastedFile) {
      setError('Não foi possível ler a imagem copiada. Tente salvá-la e escolher o arquivo.');
      return;
    }
    selectProductImage(pastedFile);
  };

  const removeProductImagePreview = () => {
    setImageFile(null);
    setForm((current) => ({ ...current, image_path: '', image_url: '' }));
    setError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(form, imageFile);
      onClose();
    } catch (saveError) {
      setError(saveError.message || 'Não foi possível salvar o produto.');
    } finally {
      setSaving(false);
    }
  };

  const addNutrient = () => setField('nutrition_facts', [...form.nutrition_facts, { name: '', amount: '', unit: 'mg' }]);
  const updateNutrient = (index, field, value) => setField('nutrition_facts', form.nutrition_facts.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  const removeNutrient = (index) => setField('nutrition_facts', form.nutrition_facts.filter((_, itemIndex) => itemIndex !== index));
  const addMeasure = () => setField('household_measures', [...form.household_measures, { name: '', grams: '' }]);
  const updateMeasure = (index, field, value) => setField('household_measures', form.household_measures.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  const removeMeasure = (index) => setField('household_measures', form.household_measures.filter((_, itemIndex) => itemIndex !== index));
  const isFoodLike = form.item_type === 'alimento' || form.item_type === 'preparacao';
  return (
    <dialog ref={dialogRef} onCancel={onClose} onClose={onClose} className="settings-dialog product-form-dialog">
      <form method="dialog" onSubmit={submit} className="settings-dialog__panel" aria-labelledby="product-form-title">
        <header className="flex items-center justify-between gap-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-white px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm"><Apple className="size-5" aria-hidden="true" /></span>
            <div className="min-w-0">
            <h2 id="product-form-title" className="text-xl font-black text-slate-900">{product?.id ? 'Editar item' : 'Novo item nutricional'}</h2>
            <p className="text-xs text-slate-500">Organize os dados do alimento, porção e nutrientes.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex size-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Fechar"><X /></button>
        </header>

        <div className="settings-dialog__body space-y-5 bg-slate-50/70 p-4 sm:p-6">
          <fieldset className={SECTION_CLASS}>
            <legend className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900"><Tag className="size-3.5 text-emerald-600" aria-hidden="true" />Tipo de cadastro</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {ITEM_TYPES.map(([value, label], index) => {
                const Icon = [Apple, CookingPot, Package, Pill, CupSoda][index];
                return (
                <label key={value} className={`flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border px-3 text-center text-xs font-bold transition ${form.item_type === value ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-600/10' : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/40'}`}>
                  <input type="radio" name="item-type" value={value} checked={form.item_type === value} onChange={() => setForm((current) => ({ ...current, item_type: value, category: value }))} className="sr-only" />
                  <><Icon className="size-5" aria-hidden="true" />{label}</>
                </label>
                );
              })}
            </div>
          </fieldset>
          {!isFoodLike ? <section className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4" aria-labelledby="product-lookup-title">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm"><Barcode className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <h3 id="product-lookup-title" className="font-black text-emerald-950">Buscar dados do produto</h3>
                <p className="text-xs leading-relaxed text-emerald-800">Comece pelo código de barras. Essa consulta não usa Gemini nem consome cota de IA.</p>
                <div className="mt-3 grid gap-3">
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                    <label htmlFor="product-barcode-lookup" className="text-xs font-bold text-emerald-950">Código de barras
                      <span className="relative mt-1.5 block">
                        <Barcode className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-emerald-600" />
                        <input id="product-barcode-lookup" name="product-barcode-lookup" inputMode="numeric" autoComplete="off" autoCorrect="off" spellCheck="false" value={form.barcode || ''} onChange={(event) => { setField('barcode', normalizeBarcodeInput(event.target.value)); setResearchError(''); setResearchStatus(''); }} aria-describedby="product-research-feedback" placeholder="Ex.: 7891234567890" className="min-h-11 w-full rounded-xl border border-emerald-200 bg-white pl-9 pr-3 text-base font-normal sm:text-sm" />
                      </span>
                    </label>
                    <button type="button" onClick={runBarcodeLookup} disabled={barcodeLoading || researching} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60">
                      <Search className="size-4" /> {barcodeLoading ? 'Consultando…' : 'Buscar código'}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 py-1" aria-hidden="true"><span className="h-px flex-1 bg-emerald-200" /><span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Se não encontrar</span><span className="h-px flex-1 bg-emerald-200" /></div>
                  <p className="text-xs font-semibold leading-relaxed text-emerald-900">A IA é usada somente para interpretar a imagem. Ela não pesquisa por nome nem abre links; a tabela nutricional precisa estar visível.</p>
                  <div className="grid gap-3 rounded-xl border border-dashed border-emerald-300 bg-white/70 p-3 sm:grid-cols-[6rem_minmax(0,1fr)] sm:items-center">
                    <div className="flex h-24 items-center justify-center overflow-hidden rounded-xl bg-emerald-50">
                      {labelPreviewUrl ? <img src={labelPreviewUrl} alt="Prévia da tabela nutricional para interpretação" className="size-full object-contain" /> : <Camera className="size-7 text-emerald-400" />}
                    </div>
                    <div className="min-w-0 space-y-2">
                      <div>
                        <label htmlFor="product-label-image" className="block text-xs font-bold text-emerald-950">Imagem da tabela nutricional</label>
                        <p className="truncate text-[11px] text-emerald-800">{labelImageFile ? labelImageFile.name : 'Escolha uma imagem ou cole direto de um anúncio'}</p>
                      </div>
                      <input id="product-label-image" name="product-label-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectLabelImage(event.target.files?.[0] || null)} className="block w-full min-w-0 text-xs text-slate-600 file:mr-2 file:min-h-10 file:rounded-xl file:border-0 file:bg-emerald-100 file:px-3 file:font-bold file:text-emerald-800" />
                      <button type="button" onPaste={handleLabelImagePaste} aria-describedby="product-label-paste-hint" className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 text-xs font-bold text-emerald-800 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
                        <ClipboardPaste className="size-4" /> Clique aqui e pressione Ctrl+V
                      </button>
                      <p id="product-label-paste-hint" className="text-[11px] leading-relaxed text-emerald-700">Copie uma imagem do anúncio, clique no botão acima e cole. JPG, PNG ou WebP.</p>
                    </div>
                  </div>
                  <button type="button" onClick={runResearch} disabled={researching} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60">
                    <Sparkles className="size-4" /> {researching ? 'Interpretando…' : 'Interpretar imagem com IA'}
                  </button>
                </div>
                <div id="product-research-feedback" aria-live="polite" className="mt-2 min-h-5">
                  {researchError ? <div role="alert" className="rounded-lg bg-rose-50 px-2.5 py-2 text-xs font-bold text-rose-700">
                    <p>{researchError}</p>
                  </div> : null}
                  {!researchError && researchStatus ? <p className="text-xs font-semibold text-emerald-800">{researchStatus}</p> : null}
                </div>
              </div>
            </div>
          </section> : null}

          {SOURCE_LABELS[form.source_type] ? (
            <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <p className="font-black">{SOURCE_LABELS[form.source_type]}</p>
              <p className="mt-1 text-xs leading-relaxed">Confira porção, versão e valores diretamente no rótulo antes de marcar como verificado.</p>
              {form.source_urls.length ? <div className="mt-2 flex flex-wrap gap-2">{form.source_urls.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-xs font-bold text-amber-800 underline">Fonte {index + 1}<ExternalLink className="size-3" /></a>)}</div> : null}
            </aside>
          ) : null}

          <fieldset className={SECTION_CLASS}>
            <legend className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900"><SlidersHorizontal className="size-3.5 text-emerald-600" aria-hidden="true" />Identificação</legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nome do item" name="product-name" required value={form.name} onChange={(value) => setField('name', value)} />
              <Field label="Marca" name="product-brand" value={form.brand} onChange={(value) => setField('brand', value)} />
              {isFoodLike ? <div className="sm:col-span-2">
                <span className="mb-2 block text-sm font-bold text-slate-700">Grupo alimentar</span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  {FOOD_GROUPS.map((group) => {
                    const active = form.food_group === group;
                    const GroupIcon = group.includes('Frut') ? Apple : group.includes('Verd') ? Salad : group.includes('Beb') ? CupSoda : group.includes('Carn') ? Drumstick : group.includes('Gord') ? Nut : group.includes('Leg') ? Bean : group.includes('Latic') ? Milk : Wheat;
                    return <button key={group} type="button" onClick={() => setField('food_group', group)} aria-pressed={active} className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-bold transition-all ${active ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-600/10' : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/50'}`}><GroupIcon className="size-4 shrink-0" aria-hidden="true" /><span className="leading-tight">{group}</span></button>;
                  })}
                </div>
              </div> : null}
              {form.item_type === 'preparacao' ? <>
                <Field label="Método de preparo" name="preparation-method" value={form.preparation_method} onChange={(value) => setField('preparation_method', value)} />
                <label className="text-sm font-bold text-slate-700">
                  <span className="block">Vídeo do preparo <span className="font-normal text-slate-400">(opcional)</span></span>
                  <input name="preparation-video-url" type="url" inputMode="url" autoCapitalize="off" autoCorrect="off" spellCheck="false" placeholder="https://www.tiktok.com/... ou https://www.instagram.com/reel/..." value={form.video_url || ''} onChange={(event) => setField('video_url', event.target.value)} aria-describedby="preparation-video-hint" className={FIELD_CLASS} />
                  <span id="preparation-video-hint" className="mt-1.5 block text-xs font-normal leading-relaxed text-slate-500">Cole o link público de um TikTok, Reel, YouTube ou outro vídeo em HTTPS.</span>
                </label>
              </> : null}
              {!isFoodLike ? <Field label="Código de barras" name="product-barcode" inputMode="numeric" value={form.barcode} onChange={(value) => setField('barcode', normalizeBarcodeInput(value))} /> : null}
              {isFoodLike ? (
                <div className="grid grid-cols-1 gap-4 sm:col-span-2 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
                  <Field label="Fonte nutricional" name="official-source" placeholder="Ex.: TACO, TBCA ou receita própria" value={form.official_source} onChange={(value) => setField('official_source', value)} />
                  <Field label="Código na fonte" name="official-source-code" value={form.official_source_code} onChange={(value) => setField('official_source_code', value)} />
                  <Field label="Versão da fonte" name="source-version" value={form.source_version} onChange={(value) => setField('source_version', value)} />
                </div>
              ) : null}
              <label className="text-sm font-bold text-slate-700 sm:col-span-2"><span className="block">Descrição</span>
                <textarea name="product-description" rows="2" value={form.description || ''} onChange={(event) => setField('description', event.target.value)} className={`${FIELD_CLASS} py-3`} />
              </label>
            </div>
          </fieldset>

          <fieldset className={SECTION_CLASS}>
            <legend className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900"><ImagePlus className="size-3.5 text-emerald-600" aria-hidden="true" />Imagem</legend>
            <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-slate-300 p-4 sm:flex-row sm:items-center">
              <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                {previewUrl ? <img src={previewUrl} alt={`Prévia da imagem de ${form.name || 'item nutricional'}`} className="size-full object-cover" /> : <ImagePlus className="size-8 text-slate-300" aria-hidden="true" />}
                {previewUrl ? <button type="button" onClick={removeProductImagePreview} aria-label="Remover imagem do item" title="Remover imagem" className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-slate-900/75 text-white shadow-sm transition hover:bg-rose-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"><X className="size-4" aria-hidden="true" /></button> : null}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <label htmlFor="product-image" className="block text-sm font-bold text-slate-700">Foto do item</label>
                  <p className="text-xs text-slate-500">Pode ser uma foto do alimento, da preparação, embalagem ou rótulo.</p>
                </div>
                <input id="product-image" name="product-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectProductImage(event.target.files?.[0] || null)} className="block w-full text-sm text-slate-600 file:mr-3 file:min-h-10 file:rounded-xl file:border-0 file:bg-slate-100 file:px-3 file:font-bold file:text-slate-700" />
                <button type="button" onPaste={handleProductImagePaste} aria-describedby="product-image-paste-hint" className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
                  <ClipboardPaste className="size-4" aria-hidden="true" /> Clique aqui e pressione Ctrl+V
                </button>
                <p id="product-image-paste-hint" className="text-xs leading-relaxed text-slate-500">Copie uma imagem do navegador e cole aqui. JPG, PNG ou WebP, até 5 MB.</p>
              </div>
            </div>
          </fieldset>

          <fieldset className={SECTION_CLASS}>
            <legend className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900"><SlidersHorizontal className="size-3.5 text-emerald-600" aria-hidden="true" />Tabela nutricional</legend>
            <p className="mb-3 text-xs text-slate-500">Defina primeiro a referência dos valores nutricionais. A porção sugerida é opcional e serve apenas como orientação de consumo.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <fieldset className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                <legend className="px-1 text-xs font-black text-emerald-900">Valores nutricionais referentes a</legend>
                <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2">
                  <Field label="Quantidade" name="reference-quantity" type="number" min="0.01" step="0.01" value={form.reference_quantity} onChange={(value) => setField('reference_quantity', value)} />
                  <label className="text-sm font-bold text-slate-700">Unidade
                    <select name="reference-unit" value={form.reference_unit || 'g'} onChange={(event) => setField('reference_unit', event.target.value)} className={FIELD_CLASS}>
                      <option value="g">g</option><option value="ml">ml</option><option value="unidade">unidade</option>
                    </select>
                  </label>
                </div>
              </fieldset>
              <fieldset className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                <legend className="px-1 text-xs font-black text-slate-700">Porção sugerida <span className="font-normal text-slate-400">(opcional)</span></legend>
                <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2">
                  <Field label="Quantidade" name="serving-size" type="number" min="0" step="0.01" value={form.serving_size} onChange={(value) => setField('serving_size', value)} />
                  <Field label="Unidade" name="serving-unit" placeholder="g, ml ou un." value={form.serving_unit} onChange={(value) => setField('serving_unit', value)} />
                </div>
              </fieldset>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <MacroField label="Energia" unit="kcal" name="calories" value={form.calories} onChange={(value) => setField('calories', value)} icon={Flame} iconClass="text-orange-500" />
              <MacroField label="Proteína" unit="g" name="protein" value={form.protein_g} onChange={(value) => setField('protein_g', value)} icon={Beef} iconClass="text-red-500" />
              <MacroField label="Carboidrato" unit="g" name="carbs" value={form.carbs_g} onChange={(value) => setField('carbs_g', value)} icon={Wheat} iconClass="text-amber-500" />
              <MacroField label="Gordura" unit="g" name="fat" value={form.fat_g} onChange={(value) => setField('fat_g', value)} icon={AvocadoIcon} iconClass="text-emerald-600" />
            </div>

            {isFoodLike ? <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-bold text-slate-700">Medidas caseiras</h4>
                <button type="button" onClick={addMeasure} className="inline-flex min-h-10 items-center gap-1 rounded-xl px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-50"><Plus className="size-4" /> Adicionar medida</button>
              </div>
              {form.household_measures.map((measure, index) => <div key={index} className="grid grid-cols-[minmax(0,1fr)_7rem_2.75rem] gap-2">
                <input aria-label={`Nome da medida ${index + 1}`} value={measure.name} onChange={(event) => updateMeasure(index, 'name', event.target.value)} placeholder="Ex.: Colher de sopa" className="min-h-11 rounded-xl border border-slate-200 px-3 text-base sm:text-sm" />
                <input aria-label={`Gramas da medida ${index + 1}`} type="number" min="0.01" step="0.01" value={measure.grams} onChange={(event) => updateMeasure(index, 'grams', event.target.value)} placeholder="gramas" className="min-h-11 rounded-xl border border-slate-200 px-3 text-base sm:text-sm" />
                <button type="button" onClick={() => removeMeasure(index)} className="flex min-h-11 items-center justify-center rounded-xl text-rose-600 hover:bg-rose-50" aria-label={`Remover medida ${index + 1}`}><Trash2 className="size-4" /></button>
              </div>)}
            </div> : null}

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-bold text-slate-700">Outros nutrientes</h4>
                <button type="button" onClick={addNutrient} className="inline-flex min-h-10 items-center gap-1 rounded-xl px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-50"><Plus className="size-4" /> Adicionar nutriente</button>
              </div>
              {form.nutrition_facts.map((nutrient, index) => (
                <div key={index} className="grid grid-cols-[minmax(0,1fr)_6rem_5rem_2.75rem] gap-2">
                  <label className="sr-only" htmlFor={`nutrient-name-${index}`}>Nutriente</label>
                  <input id={`nutrient-name-${index}`} value={nutrient.name} onChange={(event) => updateNutrient(index, 'name', event.target.value)} placeholder="Ex.: Cálcio" className="min-h-11 min-w-0 rounded-xl border border-slate-200 px-3 text-base sm:text-sm" />
                  <label className="sr-only" htmlFor={`nutrient-amount-${index}`}>Quantidade</label>
                  <input id={`nutrient-amount-${index}`} type="number" min="0" step="0.01" value={nutrient.amount ?? ''} onChange={(event) => updateNutrient(index, 'amount', event.target.value)} placeholder="0" className="min-h-11 min-w-0 rounded-xl border border-slate-200 px-3 text-base sm:text-sm" />
                  <label className="sr-only" htmlFor={`nutrient-unit-${index}`}>Unidade</label>
                  <input id={`nutrient-unit-${index}`} value={nutrient.unit} onChange={(event) => updateNutrient(index, 'unit', event.target.value)} placeholder="mg" className="min-h-11 min-w-0 rounded-xl border border-slate-200 px-3 text-base sm:text-sm" />
                  <button type="button" onClick={() => removeNutrient(index)} className="flex min-h-11 items-center justify-center rounded-xl text-rose-600 hover:bg-rose-50" aria-label={`Remover ${nutrient.name || 'nutriente'}`}><Trash2 className="size-4" /></button>
                </div>
              ))}
            </div>
          </fieldset>

          <fieldset className={SECTION_CLASS}>
                <legend className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-800">
                  <ClipboardList className="size-4 text-emerald-600" aria-hidden="true" />
                  Rótulo e revisão
                </legend>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="text-sm font-bold text-slate-700">
                    <span className="block">Ingredientes</span>
                    <textarea name="product-ingredients" rows="3" value={form.ingredients || ''} onChange={(event) => setField('ingredients', event.target.value)} className={`${FIELD_CLASS} py-3`} />
                  </label>
                  <label className="text-sm font-bold text-slate-700">
                    <span className="block">Alérgenos</span>
                    <textarea name="product-allergens" rows="3" value={form.allergens || ''} onChange={(event) => setField('allergens', event.target.value)} className={`${FIELD_CLASS} py-3`} />
                  </label>
              {form.source_notes ? <div className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 sm:col-span-2"><strong>Observação da pesquisa:</strong> {form.source_notes}</div> : null}
              <label className="flex min-h-12 items-center gap-3 rounded-xl bg-slate-50 px-3 text-sm font-semibold text-slate-700 sm:col-span-2">
                <input type="checkbox" checked={form.verification_status === 'verified'} onChange={(event) => setField('verification_status', event.target.checked ? 'verified' : 'draft')} className="size-4" />
                Conferi os dados no rótulo e quero marcar este produto como verificado
              </label>
              <label className="flex min-h-12 items-center gap-3 rounded-xl bg-emerald-50 px-3 text-sm font-semibold text-emerald-900 sm:col-span-2">
                <input type="checkbox" checked={Boolean(form.is_available_for_diets)} disabled={form.verification_status !== 'verified'} onChange={(event) => setField('is_available_for_diets', event.target.checked)} className="size-4" />
                Disponibilizar este item verificado no criador de dietas
              </label>
            </div>
          </fieldset>

          {error ? <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p> : null}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
          <p className="hidden text-xs text-slate-500 sm:block"><span className="font-bold text-slate-700">Dica:</span> confira a quantidade-base antes de salvar.</p>
          <div className="flex flex-1 justify-end gap-2">
            <button type="button" onClick={onClose} className="min-h-11 rounded-xl px-4 text-sm font-bold text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="submit" disabled={saving || researching || barcodeLoading} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"><BadgeCheck className="size-4" />{saving ? 'Salvando…' : 'Salvar item'}</button>
          </div>
        </footer>
      </form>
    </dialog>
  );
}
function Field({ label, name, value, onChange, type = 'text', required = false, inputMode, placeholder, min, step }) {
  return <label className="text-sm font-bold text-slate-700"><span>{label}</span>
    <input name={name} type={type} required={required} inputMode={inputMode} placeholder={placeholder} min={min} step={step} value={value ?? ''} onChange={(event) => onChange(event.target.value)} className={FIELD_CLASS} />
  </label>;
}

function MacroField({ label, unit, name, value, onChange, icon: Icon, iconClass }) {
  return <label className="rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-700 shadow-sm">
    <span className="flex items-center gap-1.5"><Icon className={`size-5 ${iconClass}`} aria-hidden="true" />{label}</span>
    <span className="relative mt-2 block">
      <input name={name} type="number" min="0" step="0.01" inputMode="decimal" value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="min-h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 pr-12 text-base font-normal text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/15 sm:text-sm" />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{unit}</span>
    </span>
  </label>;
}

function AvocadoIcon({ className = '', ...props }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M12 2.8c-2.8 0-3.5 3.2-5.2 6.2C5.2 11.7 4 14 4 16a8 8 0 0 0 16 0c0-2-1.2-4.3-2.8-7C15.5 6 14.8 2.8 12 2.8Z" />
    <circle cx="12" cy="15.5" r="3.2" />
  </svg>;
}
