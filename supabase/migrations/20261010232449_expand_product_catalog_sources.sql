alter table public.product_catalog
  drop constraint if exists product_catalog_source_type_check;

alter table public.product_catalog
  add constraint product_catalog_source_type_check
  check (source_type in (
    'manual',
    'ai_web',
    'imported',
    'open_food_facts',
    'ai_vision'
  ));

comment on column public.product_catalog.source_type is
  'Origem inicial dos dados. Importações automáticas permanecem como rascunho até revisão humana.';

grant select, insert, update, delete on table public.product_catalog to authenticated;
