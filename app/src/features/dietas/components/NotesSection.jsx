import React, { useEffect, useMemo, useState } from 'react';
import { ChefHat, FileText, Pill, Plus, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../auth/useAuth.js';
import { listProducts } from '../../produtos/services/products.js';

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
}) {
  const [selectedId, setSelectedId] = useState('');
  const addSelectedItem = () => {
    const selected = options.find((option) => option.id === selectedId);
    if (!selected) return;
    const itemText = `• ${selected.name}${selected.brand ? ` — ${selected.brand}` : ''}`;
    if (!value.includes(itemText)) onChange(value.trim() ? `${value.trim()}\n${itemText}` : itemText);
    setSelectedId('');
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
      <div className="mb-4 flex items-start gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center text-emerald-600">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div>
          <label htmlFor={id} className="text-sm font-bold text-slate-800">{title}</label>
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </div>
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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <RecommendationField
          id="recommended-brands"
          title="Marcas e produtos recomendados"
          description="Indique opções específicas e alternativas de compra."
          icon={ShoppingBag}
          value={plan.recommended_brands || ''}
          onChange={(value) => onUpdateField('recommended_brands', value)}
          options={catalogOptions.products}
          loadingOptions={catalogLoading}
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
