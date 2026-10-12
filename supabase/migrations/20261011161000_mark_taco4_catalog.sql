-- Identifica a edição do PDF que serviu de base aos alimentos TACO já catalogados.
update public.product_catalog
set official_source = 'TACO',
    source_version = coalesce(source_version, '4ª edição revisada e ampliada (2011)'),
    official_source_code = coalesce(official_source_code, 'TACO-' || left(replace(id::text, '-', ''), 12))
where organization_id is null
  and lower(coalesce(official_source, '')) like '%taco%';

comment on column public.product_catalog.official_source is 'Fonte nutricional, por exemplo TACO, TBCA, USDA FoodData Central ou receita própria.';
