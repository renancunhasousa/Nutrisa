import React, { useEffect, useMemo, useState } from 'react';
import { Beef, ChefHat, FileText, Flame, PackageOpen, Pill, Plus, ShoppingBag, Trash2, Wheat } from 'lucide-react';
import { useAuth } from '../../auth/useAuth.js';
import { listProducts } from '../../produtos/services/products.js';
import { LipidIcon } from './LipidIcon.jsx';

const getCatalogItemText = (item) => `• ${item.name}${item.brand ? ` — ${item.brand}` : ''}`;

function CatalogItemPreview({ item, onRemove }) {
  const typeLabel = {
    produto: 'Produto',
    suplemento: 'Suplemento',
    preparacao: 'Preparação',
    alimento: 'Alimento',
  }[item.item_type || item.category] || 'Item';
  const reference = `${Number(item.reference_quantity || item.serving_size) || 100} ${item.reference_unit || item.serving_unit || 'g'}`;
  const nutrients = [
    { label: 'kcal', value: Number(item.calories) || 0, Icon: Flame, color: 'text-orange-600' },
    { label: 'P', value: `${Number(item.protein_g) || 0}g`, Icon: Beef, color: 'text-rose-600' },
    { label: 'C', value: `${Number(item.carbs_g) || 0}g`, Icon: Wheat, color: 'text-amber-600' },
    { label: 'G', value: `${Number(item.fat_g) || 0}g`, Icon: LipidIcon, color: 'text-teal-600' },
  ];

  return (
    <article className="flex min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
      <div className="size-20 shrink-0 bg-slate-100 sm:size-24">
        {item.image_url ? (
          <img src={item.image_url} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center"><PackageOpen className="size-8 text-slate-300" aria-hidden="true" /></span>
        )}
      </div>
      <div className="min-w-0 flex-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="block text-[9px] font-black uppercase tracking-wider text-emerald-700">{typeLabel}</span>
            <h4 className="truncate text-xs font-bold text-slate-900 sm:text-sm">{item.name}</h4>
            <p className="truncate text-[10px] text-slate-500">{item.brand ? `${item.brand} · ` : ''}Base {reference}</p>
          </div>
          <button type="button" onClick={onRemove} title={`Remover ${item.name}`} aria-label={`Remover ${item.name}`}
            className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600">
            <Trash2 className="size-3.5" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1 rounded-lg bg-slate-50 px-1.5 py-1.5">
          {nutrients.map(({ label, value, Icon, color }) => (
            <span key={label} className="flex min-w-0 flex-col items-center text-[9px] font-bold text-slate-700" title={label === 'kcal' ? 'Calorias' : label}>
              <Icon className={`size-3 ${color}`} aria-hidden="true" />
              <span className="truncate">{value}</span>
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

function RecommendationField({
  id,
  title,
  description,
  icon: Icon,
  value,
  onChange,
  placeholder,
  options = [],
  loadingOptions = false,
  showCardsInReport = false,
  onToggleReportCards,
}) {
  const [selectedId, setSelectedId] = useState('');
  const selectedItems = options.filter((option) => value.includes(getCatalogItemText(option)));
  const addSelectedItem = () => {
    const selected = options.find((option) => option.id === selectedId);
    if (!selected) return;
    const itemText = getCatalogItemText(selected);
    if (!value.includes(itemText)) onChange(value.trim() ? `${value.trim()}\n${itemText}` : itemText);
    setSelectedId('');
  };

  const removeSelectedItem = (item) => {
    const itemText = getCatalogItemText(item);
    onChange(value.split('\n').filter((line) => line.trim() !== itemText).join('\n').trim());
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center text-emerald-600">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div>
            <label htmlFor={id} className="text-sm font-bold text-slate-800">{title}</label>
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-[11px] font-semibold text-slate-600">
          <span>Mostrar cards no relatório</span>
          <input type="checkbox" checked={showCardsInReport} onChange={(event) => onToggleReportCards(event.target.checked)} className="peer sr-only" role="switch" />
          <span className="relative h-6 w-10 rounded-full bg-slate-300 transition-colors peer-checked:bg-emerald-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-emerald-600 after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-4" aria-hidden="true" />
        </label>
      </div>
      <div className="mb-3 flex gap-2">
        <select
          aria-label={`Selecionar item para ${title}`}
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          disabled={loadingOptions || !options.length}
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:outline-hidden disabled:opacity-60 sm:text-sm"
        >
          <option value="">{loadingOptions ? 'Carregando cadastros…' : options.length ? 'Selecionar do catálogo…' : 'Nenhum item cadastrado'}</option>
          {options.map((option) => <option key={option.id} value={option.id}>{option.name}{option.brand ? ` — ${option.brand}` : ''}</option>)}
        </select>
        <button
          type="button"
          onClick={addSelectedItem}
          disabled={!selectedId}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="size-4" aria-hidden="true" /> Adicionar
        </button>
      </div>
      {selectedItems.length > 0 && (
        <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-label={`Itens adicionados em ${title}`}>
          {selectedItems.map((item) => (
            <CatalogItemPreview key={item.id} item={item} onRemove={() => removeSelectedItem(item)} />
          ))}
        </div>
      )}
      <textarea
        id={id}
        rows={5}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-32 w-full flex-1 resize-y rounded-xl border border-slate-200 bg-slate-50 p-3.5 font-sans text-xs leading-relaxed text-slate-800 focus:border-emerald-500 focus:outline-hidden sm:text-sm"
      />
    </div>
  );
}

export function NotesSection({ plan, onUpdateField }) {
  const { organizationId } = useAuth();
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setCatalogLoading(true);
    listProducts(organizationId)
      .then((items) => { if (active) setCatalog(items); })
      .catch(() => { if (active) setCatalog([]); })
      .finally(() => { if (active) setCatalogLoading(false); });
    return () => { active = false; };
  }, [organizationId]);

  const catalogOptions = useMemo(() => ({
    products: catalog.filter((item) => (item.item_type || item.category) === 'produto'),
    supplements: catalog.filter((item) => (item.item_type || item.category) === 'suplemento'),
    recipes: catalog.filter((item) => (item.item_type || item.category) === 'preparacao'),
  }), [catalog]);

  useEffect(() => {
    if (catalogLoading) return;
    const fields = [
      ['recommended_brands', plan.recommended_brands || ''],
      ['supplement_recommendations', plan.supplement_recommendations || ''],
      ['recipe_suggestions', plan.recipe_suggestions || ''],
    ];
    const nextItems = fields.flatMap(([field, text]) => catalog
      .filter((item) => text.includes(getCatalogItemText(item)))
      .map((item) => ({ ...item, recommendation_field: field })));
    const currentSignature = (plan.recommendation_card_items || []).map((item) => `${item.recommendation_field}:${item.id}`).sort().join('|');
    const nextSignature = nextItems.map((item) => `${item.recommendation_field}:${item.id}`).sort().join('|');
    if (currentSignature !== nextSignature) onUpdateField('recommendation_card_items', nextItems);
  }, [catalog, catalogLoading, onUpdateField, plan.recommended_brands, plan.recommendation_card_items, plan.recipe_suggestions, plan.supplement_recommendations]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <RecommendationField
          id="recommended-brands"
          title="Marcas e produtos recomendados"
          description="Indique opções específicas e alternativas de compra."
          icon={ShoppingBag}
          value={plan.recommended_brands || ''}
          onChange={(value) => onUpdateField('recommended_brands', value)}
          options={catalogOptions.products}
          loadingOptions={catalogLoading}
          showCardsInReport={Boolean(plan.recommendation_card_visibility?.recommended_brands)}
          onToggleReportCards={(checked) => onUpdateField('recommendation_card_visibility', { ...plan.recommendation_card_visibility, recommended_brands: checked })}
          placeholder={'Ex.: Iogurte natural — marcas A ou B\nPasta de amendoim sem açúcar — marca C'}
        />

        <RecommendationField
          id="supplement-recommendations"
          title="Suplementos"
          description="Registre produto, dose, horário e modo de uso."
          icon={Pill}
          value={plan.supplement_recommendations || ''}
          onChange={(value) => onUpdateField('supplement_recommendations', value)}
          options={catalogOptions.supplements}
          loadingOptions={catalogLoading}
          showCardsInReport={Boolean(plan.recommendation_card_visibility?.supplement_recommendations)}
          onToggleReportCards={(checked) => onUpdateField('recommendation_card_visibility', { ...plan.recommendation_card_visibility, supplement_recommendations: checked })}
          placeholder={'Ex.: Creatina monohidratada — 3 g ao dia\nUsar conforme orientação profissional.'}
        />

        <RecommendationField
          id="recipe-suggestions"
          title="Receitas e preparações"
          description="Inclua ideias práticas, ingredientes e preparo."
          icon={ChefHat}
          value={plan.recipe_suggestions || ''}
          onChange={(value) => onUpdateField('recipe_suggestions', value)}
          options={catalogOptions.recipes}
          loadingOptions={catalogLoading}
          showCardsInReport={Boolean(plan.recommendation_card_visibility?.recipe_suggestions)}
          onToggleReportCards={(checked) => onUpdateField('recommendation_card_visibility', { ...plan.recommendation_card_visibility, recipe_suggestions: checked })}
          placeholder={'Ex.: Panqueca de banana\nIngredientes: banana, ovo e aveia.\nPreparo: misture e doure dos dois lados.'}
        />

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center text-emerald-600">
              <FileText className="size-5 text-emerald-600" />
            </div>
            <div>
              <label htmlFor="general-diet-notes" className="text-sm font-bold text-slate-800">Orientações e recados gerais</label>
              <p className="text-xs text-slate-500">Hábitos, rotina, observações clínicas e avisos ao paciente.</p>
            </div>
          </div>

          <textarea
            id="general-diet-notes"
            rows={7}
            value={plan.general_notes || ''}
            onChange={(event) => onUpdateField('general_notes', event.target.value)}
            placeholder="Escreva observações sobre rotina, estilo de vida, finais de semana e outros cuidados importantes..."
            className="min-h-32 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3.5 font-sans text-xs leading-relaxed text-slate-800 focus:border-emerald-500 focus:outline-hidden sm:text-sm"
          />
        </div>
      </div>
    </div>
  );
}
