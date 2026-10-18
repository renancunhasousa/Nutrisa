import React from 'react';
import { ArrowLeft, Beef, PackageOpen, Printer, Droplets, Flame, Wheat } from 'lucide-react';
import logoPdf from '../../../assets/logo.png';
import signatureImg from '../../../assets/assinatura.png';
import { calculateMealTotals } from '../domain/nutritionCalculations.js';
import { LipidIcon } from '../components/LipidIcon.jsx';

const PAGE_CAPACITY = 17;
const MEAL_FRAGMENT_CAPACITY = 12;

function itemWeight(item) {
  const substitutions = item.substitutions?.length || 0;
  const nameLines = Math.max(1, Math.ceil(String(item.name || '').length / 72));
  return nameLines + substitutions * 0.75;
}

function splitMeal(meal, mealIndex) {
  const items = meal.items || [];
  if (!items.length) return [{ type: 'meal', meal, mealIndex, items: [], continuation: false, weight: 3 }];

  const fragments = [];
  let current = [];
  let weight = 2;
  items.forEach((item) => {
    const nextWeight = itemWeight(item);
    if (current.length && weight + nextWeight > MEAL_FRAGMENT_CAPACITY) {
      fragments.push({ items: current, weight });
      current = [];
      weight = 2;
    }
    current.push(item);
    weight += nextWeight;
  });
  if (current.length) fragments.push({ items: current, weight });

  return fragments.map((fragment, index) => ({
    type: 'meal',
    meal,
    mealIndex,
    items: fragment.items,
    continuation: index > 0,
    showNotes: index === fragments.length - 1,
    weight: fragment.weight + (index === fragments.length - 1 && meal.notes ? 1 : 0),
  }));
}

function splitText(text, maxLength = 520) {
  const paragraphs = String(text || '').split('\n').filter((line) => line.trim());
  const chunks = [];
  let current = '';
  paragraphs.forEach((paragraph) => {
    const words = paragraph.split(/\s+/);
    words.forEach((word) => {
      if (current && `${current} ${word}`.length > maxLength) {
        chunks.push(current.trim());
        current = '';
      }
      current += `${current ? ' ' : ''}${word}`;
    });
    if (current) current += '\n';
  });
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function createReportBlocks(plan) {
  const mealBlocks = (plan.meals || []).flatMap(splitMeal);
  const sections = [
    ['Marcas e produtos recomendados', plan.recommended_brands],
    ['Suplementos', plan.supplement_recommendations],
    ['Receitas e preparações', plan.recipe_suggestions],
    ['Orientações e recados gerais', plan.general_notes],
  ];
  const recommendationBlocks = sections.flatMap(([title, content]) =>
    content?.trim()
      ? splitText(content).map((text, index) => ({
          type: 'recommendation', title, text, continuation: index > 0,
          weight: 2.5 + Math.ceil(text.length / 90),
        }))
      : []
  );
  const visibility = plan.recommendation_card_visibility || {};
  const cardItems = (plan.recommendation_card_items || []).filter((item) => visibility[item.recommendation_field]);
  const cardBlocks = [];
  for (let index = 0; index < cardItems.length; index += 3) {
    cardBlocks.push({ type: 'recommendation-cards', items: cardItems.slice(index, index + 3), weight: 4.5 });
  }
  return [...mealBlocks, ...recommendationBlocks, ...cardBlocks];
}

function paginateBlocks(blocks) {
  if (!blocks.length) return [[]];
  const pages = [];
  let cursor = 0;
  while (cursor < blocks.length) {
    const remaining = blocks.slice(cursor);
    const remainingWeight = remaining.reduce((sum, block) => sum + block.weight, 0);
    const remainingPages = Math.max(1, Math.ceil(remainingWeight / PAGE_CAPACITY));
    const balancedTarget = Math.min(PAGE_CAPACITY, remainingWeight / remainingPages);
    const page = [];
    let used = 0;

    while (cursor < blocks.length) {
      const block = blocks[cursor];
      const wouldExceedTarget = page.length && used + block.weight > balancedTarget;
      const mustLeaveBlocks = blocks.length - cursor <= remainingPages - 1;
      if (wouldExceedTarget && !mustLeaveBlocks) break;
      if (page.length && used + block.weight > PAGE_CAPACITY) break;
      page.push(block);
      used += block.weight;
      cursor += 1;
    }

    if (!page.length) {
      page.push(blocks[cursor]);
      cursor += 1;
    }
    pages.push(page);
  }
  return pages;
}

function ReportHeader({ nut, plan, totals, formattedDate }) {
  return (
    <header className="shrink-0 border-b-2 border-emerald-800 pb-5 print:pb-3">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row print:flex-row">
        <div className="flex items-center space-x-3.5">
          <img src={nut.logoUrl || logoPdf} alt={nut.clinic || 'Logo'} className="size-12 shrink-0 object-contain" />
          <div className="min-w-0">
            <h1 className="truncate whitespace-nowrap text-xl font-black uppercase tracking-tight text-emerald-950 sm:text-2xl print:text-lg">{nut.name}</h1>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 print:text-[10px]">{nut.title}</p>
            <p className="mt-0.5 text-[11px] text-slate-500 print:text-[9px]">{nut.crn} • {nut.clinic}</p>
          </div>
        </div>
        <div className="shrink-0 sm:text-right">
          <span className="inline-block rounded-full bg-emerald-900 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white print:text-[9px]">Plano Alimentar Individualizado</span>
          <p className="mt-1.5 text-xs text-slate-500 print:text-[10px]">Emissão: <strong className="text-slate-800">{formattedDate}</strong></p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs sm:grid-cols-4 print:mt-3 print:grid-cols-4 print:gap-2 print:p-2">
        <div className="min-w-0"><span className="block text-[9px] font-bold uppercase text-slate-400">Paciente</span><strong className="block truncate text-sm font-bold text-slate-900 print:text-xs">{plan.patient_name || 'Paciente'}</strong></div>
        <div><span className="block text-[9px] font-bold uppercase text-slate-400">Objetivo</span><span className="font-semibold text-slate-800">{plan.objective || 'Emagrecimento'}</span></div>
        <div><span className="block text-[9px] font-bold uppercase text-slate-400">Meta Calórica</span><span className="font-bold text-slate-800">{plan.target_calories} kcal</span></div>
        <div><span className="block text-[9px] font-bold uppercase text-slate-400">Meta de Água</span><span className="flex items-center gap-1 font-bold text-sky-700"><Droplets className="size-3 text-sky-600" /> {plan.water_intake_ml || 2500} ml/dia</span></div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-2.5 text-xs font-semibold text-emerald-950">
        <div className="flex items-center gap-1.5"><Flame className="size-4 text-orange-600" aria-hidden="true" /><span>Total diário: <strong>{totals.calories} kcal</strong></span></div>
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1"><Beef className="size-3.5 text-rose-600" aria-hidden="true" /> Proteínas: <strong>{totals.protein}g</strong> ({totals.percentages?.protein || 0}%)</span>
          <span className="inline-flex items-center gap-1"><Wheat className="size-3.5 text-amber-600" aria-hidden="true" /> Carboidratos: <strong>{totals.carbs}g</strong> ({totals.percentages?.carbs || 0}%)</span>
          <span className="inline-flex items-center gap-1"><LipidIcon className="size-3.5 text-teal-600" aria-hidden="true" /> Gorduras: <strong>{totals.fat}g</strong> ({totals.percentages?.fat || 0}%)</span>
        </div>
      </div>
    </header>
  );
}

function MealBlock({ block }) {
  const { meal, items, continuation, showNotes } = block;
  const totals = calculateMealTotals(meal.items || []);
  return (
    <section className="break-inside-avoid rounded-xl border border-slate-200 print:border-slate-300">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100/80 px-4 py-2">
        <div className="flex items-center gap-2"><span className="rounded-md bg-emerald-700 px-2 py-0.5 text-[11px] font-black text-white">{meal.time || '08:00'}</span><h3 className="text-sm font-bold text-slate-900">{meal.title}{continuation ? ' — continuação' : ''}</h3></div>
        <div className="text-[11px] font-semibold text-slate-500">{totals.calories} kcal • P: {totals.protein}g • C: {totals.carbs}g • G: {totals.fat}g</div>
      </div>
      <div className="space-y-2.5 p-3 sm:p-4 print:p-3">
        {items.length ? <ul className="space-y-1.5 text-xs">{items.map((item, index) => (
          <li key={item.id || index} className="border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
            <div className="flex items-baseline justify-between gap-2"><span className="font-semibold text-slate-900">• {item.quantity} {item.unit !== 'g' && item.unit !== 'ml' ? item.unit : ''} {item.name}{item.unit !== 'g' && item.nutrition_snapshot?.grams ? ` (${item.nutrition_snapshot.grams}g)` : (item.unit === 'g' ? 'g' : '')}</span><span className="shrink-0 text-[11px] font-medium text-slate-400">{item.nutrition_snapshot?.calories} kcal</span></div>
            {item.substitutions?.length > 0 && <div className="ml-4 mt-0.5 space-y-0.5 text-[11px] text-teal-800">{item.substitutions.map((sub, subIndex) => <div key={sub.id || subIndex} className="flex flex-wrap justify-between gap-x-2 italic"><span>↳ <em>Substituição:</em> {sub.quantity} {sub.unit} de {sub.name}</span><span className="not-italic text-slate-500">{sub.nutrition_snapshot?.calories || 0} kcal • P: {sub.nutrition_snapshot?.protein || 0}g • C: {sub.nutrition_snapshot?.carbs || 0}g • G: {sub.nutrition_snapshot?.fat || 0}g</span></div>)}</div>}
          </li>
        ))}</ul> : <p className="text-xs italic text-slate-400">Nenhum alimento prescrito para este horário.</p>}
        {showNotes && meal.notes && <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-2 text-[11px] text-amber-900"><strong>Orientação do horário:</strong> {meal.notes}</div>}
      </div>
    </section>
  );
}

function RecommendationBlock({ block }) {
  return (
    <section className="break-inside-avoid rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">Recomendações e recados</h4>
      <h5 className="mt-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">{block.title}{block.continuation ? ' — continuação' : ''}</h5>
      <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-700">{block.text}</p>
    </section>
  );
}

function RecommendationCardsBlock({ block }) {
  return (
    <section className="break-inside-avoid rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-900">Itens recomendados</h4>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 print:grid-cols-3">
        {block.items.map((item) => (
          <article key={`${item.recommendation_field}-${item.id}`} className="flex min-w-0 rounded-lg border border-slate-200 bg-white p-2">
            <div className="size-14 shrink-0 rounded-md bg-slate-100">
              {item.image_url ? <img src={item.image_url} alt="" className="size-full rounded-md object-cover" /> : <span className="flex size-full items-center justify-center"><PackageOpen className="size-5 text-slate-300" aria-hidden="true" /></span>}
            </div>
            <div className="min-w-0 flex-1 pl-2">
              <p className="truncate text-[7px] font-black uppercase tracking-wide text-emerald-700">{{ produto: 'Produto', suplemento: 'Suplemento', preparacao: 'Preparação', alimento: 'Alimento' }[item.item_type || item.category] || 'Item'}</p>
              <p className="truncate text-[10px] font-bold text-slate-900">{item.name}</p>
              <p className="truncate text-[8px] text-slate-500">{item.brand ? `${item.brand} · ` : ''}Base {Number(item.reference_quantity || item.serving_size) || 100} {item.reference_unit || item.serving_unit || 'g'}</p>
              <div className="mt-1 grid grid-cols-4 gap-0.5 text-center text-[7px] font-bold text-slate-600">
                <span><Flame className="mx-auto size-2.5 text-orange-600" />{Number(item.calories) || 0}</span>
                <span><Beef className="mx-auto size-2.5 text-rose-600" />{Number(item.protein_g) || 0}g</span>
                <span><Wheat className="mx-auto size-2.5 text-amber-600" />{Number(item.carbs_g) || 0}g</span>
                <span><LipidIcon className="mx-auto size-2.5 text-teal-600" />{Number(item.fat_g) || 0}g</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ReportFooter({ nut, pageNumber, totalPages }) {
  return (
    <footer className="a4-print-footer mt-auto shrink-0 border-t border-slate-300 pt-5 print:pt-3">
      <div className="flex flex-col items-end justify-between gap-3 text-center sm:flex-row sm:text-left print:flex-row print:text-left">
        <div className="space-y-0.5 text-xs text-slate-500"><p className="font-bold text-slate-800">{nut.name}</p><p>{nut.title} • {nut.crn}</p>{nut.address && <p>{nut.address}</p>}{(nut.phone || nut.email) && <p>{[nut.phone, nut.email].filter(Boolean).join(' • ')}</p>}</div>
        <div className="flex flex-col items-center sm:items-end print:items-end">
          {nut.signatureUrl ? (
            <img src={nut.signatureUrl} alt="Assinatura da Nutricionista" className="h-16 w-auto object-contain drop-shadow-xs" />
          ) : String(nut.name || '').toLowerCase().includes('isabela') ? (
            <img src={signatureImg} alt="Assinatura da Nutricionista" className="h-16 w-auto object-contain drop-shadow-xs" />
          ) : (
            <div className="h-10 w-36 border-b border-slate-400 mb-1" />
          )}
          <p className="text-right text-[10px] font-bold text-emerald-800">Página {pageNumber} de {totalPages}</p>
        </div>
      </div>
    </footer>
  );
}

export function DietReport({ plan, totals, nutritionist, onBack }) {
  const nut = { name: 'Profissional responsável', title: 'Nutricionista Clínica & Funcional', crn: 'CRN-3 12345/P', clinic: 'NutrIsa Clínica Integrada', address: '', phone: '', email: '', logoUrl: '', signatureUrl: '', ...nutritionist };
  const formattedDate = new Date(plan.created_at || Date.now()).toLocaleDateString('pt-BR');
  const pages = paginateBlocks(createReportBlocks(plan));

  return (
    <div className="space-y-6">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs print:hidden">
        <div className="flex items-center space-x-3"><button type="button" onClick={onBack} className="flex items-center rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-200 active:scale-95"><ArrowLeft className="mr-1.5 size-3.5" /> Voltar ao Editor</button><span className="hidden text-xs font-medium text-slate-500 sm:inline">Plano alimentar paginado para impressão e entrega em PDF.</span></div>
        <button type="button" onClick={() => window.print()} className="flex items-center rounded-full bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-500 hover:shadow active:scale-95"><Printer className="mr-1.5 size-4" /> Imprimir / Salvar em PDF</button>
      </div>

      <div className="space-y-6 print:space-y-0">
        {pages.map((blocks, pageIndex) => (
          <article key={pageIndex} className="a4-print-page mx-auto flex min-h-[1120px] max-w-4xl flex-col gap-5 rounded-none border border-slate-300 bg-white p-6 text-slate-800 shadow-xl sm:p-10 md:rounded-2xl print:gap-3 print:rounded-none print:border-0 print:p-0 print:shadow-none">
            <ReportHeader nut={nut} plan={plan} totals={totals} formattedDate={formattedDate} />
            <main className="flex-1 space-y-3">
              {blocks.map((block, blockIndex) => {
                if (block.type === 'meal') return <MealBlock key={`meal-${block.mealIndex}-${blockIndex}`} block={block} />;
                if (block.type === 'recommendation-cards') return <RecommendationCardsBlock key={`cards-${pageIndex}-${blockIndex}`} block={block} />;
                return <RecommendationBlock key={`recommendation-${pageIndex}-${blockIndex}`} block={block} />;
              })}
            </main>
            <ReportFooter nut={nut} pageNumber={pageIndex + 1} totalPages={pages.length} />
          </article>
        ))}
      </div>
    </div>
  );
}
