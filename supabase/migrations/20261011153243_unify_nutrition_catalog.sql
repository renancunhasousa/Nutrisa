alter table public.product_catalog
  alter column organization_id drop not null,
  add column item_type text,
  add column food_group text,
  add column preparation_method text,
  add column reference_quantity numeric(10, 2),
  add column reference_unit text,
  add column household_measures jsonb not null default '[]'::jsonb,
  add column official_source text,
  add column official_source_code text,
  add column source_version text,
  add column is_available_for_diets boolean not null default false;

update public.product_catalog
set item_type = case category
  when 'suplemento' then 'suplemento'
  when 'bebida' then 'bebida'
  else 'produto'
end,
reference_quantity = coalesce(serving_size, 100),
reference_unit = case
  when lower(coalesce(serving_unit, '')) in ('g', 'ml', 'unidade') then lower(serving_unit)
  else 'g'
end,
is_available_for_diets = verification_status = 'verified';

alter table public.product_catalog
  alter column item_type set not null,
  alter column item_type set default 'produto',
  alter column reference_quantity set not null,
  alter column reference_quantity set default 100,
  alter column reference_unit set not null,
  alter column reference_unit set default 'g',
  add constraint product_catalog_item_type_check
    check (item_type in ('alimento', 'preparacao', 'produto', 'suplemento', 'bebida')),
  add constraint product_catalog_reference_quantity_check
    check (reference_quantity > 0),
  add constraint product_catalog_reference_unit_check
    check (reference_unit in ('g', 'ml', 'unidade')),
  add constraint product_catalog_household_measures_check
    check (jsonb_typeof(household_measures) = 'array'),
  add constraint product_catalog_diet_verified_check
    check (not is_available_for_diets or verification_status = 'verified'),
  add constraint product_catalog_official_scope_check
    check (organization_id is not null or official_source is not null);

alter table public.product_catalog
  drop constraint if exists product_catalog_category_check;

alter table public.product_catalog
  add constraint product_catalog_category_check
  check (category in ('alimento', 'preparacao', 'produto', 'suplemento', 'bebida', 'outro'));

create unique index product_catalog_official_source_code_key
  on public.product_catalog (lower(official_source), official_source_code)
  where organization_id is null and official_source_code is not null and archived_at is null;

create index product_catalog_diet_search_idx
  on public.product_catalog (organization_id, item_type, food_group, lower(name))
  where archived_at is null and is_available_for_diets;

drop policy if exists product_catalog_select_member on public.product_catalog;
create policy product_catalog_select_member
on public.product_catalog
for select
to authenticated
using (
  organization_id is null
  or (select private.is_organization_member(organization_id))
);

comment on table public.product_catalog is
  'Catálogo nutricional unificado: alimentos oficiais, preparações, produtos, suplementos e bebidas.';
comment on column public.product_catalog.reference_quantity is
  'Quantidade à qual calories e macronutrientes se referem; o editor normaliza bases em g/ml.';
comment on column public.product_catalog.is_available_for_diets is
  'Somente itens verificados podem ser habilitados para uso no criador de dietas.';

-- Migra a base foods quando ela existir no ambiente legado. O bloco dinâmico
-- mantém instalações novas reproduzíveis, nas quais public.foods nunca existiu.
do $migration$
begin
  if to_regclass('public.foods') is not null then
    execute $sql$
      insert into public.product_catalog (
        organization_id, name, category, item_type, food_group,
        serving_size, serving_unit, reference_quantity, reference_unit,
        calories, protein_g, carbs_g, fat_g, fiber_g,
        household_measures, source_type, official_source, official_source_code,
        verification_status, verified_at, is_available_for_diets
      )
      select
        null, f.name, 'alimento', 'alimento', f.category,
        100, 'g', coalesce(f.portion_base_grams, 100), 'g',
        f.calories, f.protein, f.carbs, f.fat, f.fiber,
        coalesce(f.household_measures, '[]'::jsonb), 'imported',
        coalesce(nullif(f.source, ''), 'Base legada'), f.id::text,
        'verified', now(), true
      from public.foods f
      where coalesce(f.is_active, true)
      on conflict do nothing
    $sql$;
  end if;
end
$migration$;

revoke all on table public.product_catalog from anon;
grant select, insert, update, delete on table public.product_catalog to authenticated;
