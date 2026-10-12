create or replace function public.cache_official_foods(p_foods jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  item jsonb;
  cached_count integer := 0;
  source_name text;
  source_code text;
begin
  if auth.uid() is null or not exists (
    select 1
    from public.organization_members member
    where member.user_id = auth.uid()
  ) then
    raise exception 'Usuário autenticado sem acesso a uma organização.';
  end if;
  if jsonb_typeof(p_foods) <> 'array' or jsonb_array_length(p_foods) > 50 then
    raise exception 'Envie uma lista com no máximo 50 alimentos.';
  end if;

  for item in select value from jsonb_array_elements(p_foods)
  loop
    source_name := nullif(btrim(item->>'official_source'), '');
    source_code := nullif(btrim(item->>'official_source_code'), '');
    if source_name not in ('TBCA', 'USDA FoodData Central') or source_code is null then
      continue;
    end if;

    update public.product_catalog
    set name = left(btrim(item->>'name'), 500),
        food_group = nullif(left(btrim(item->>'food_group'), 250), ''),
        calories = nullif(item->>'calories', '')::numeric,
        protein_g = nullif(item->>'protein_g', '')::numeric,
        carbs_g = nullif(item->>'carbs_g', '')::numeric,
        fat_g = nullif(item->>'fat_g', '')::numeric,
        fiber_g = nullif(item->>'fiber_g', '')::numeric,
        sodium_mg = nullif(item->>'sodium_mg', '')::numeric,
        source_version = nullif(left(btrim(item->>'source_version'), 250), ''),
        updated_at = now()
    where organization_id is null
      and lower(official_source) = lower(source_name)
      and official_source_code = source_code
      and archived_at is null;

    if not found then
      insert into public.product_catalog (
        organization_id, name, category, item_type, food_group,
        serving_size, serving_unit, reference_quantity, reference_unit,
        calories, protein_g, carbs_g, fat_g, fiber_g, sodium_mg,
        source_type, official_source, official_source_code, source_version,
        verification_status, verified_at, is_available_for_diets
      ) values (
        null, left(btrim(item->>'name'), 500), 'alimento', 'alimento',
        nullif(left(btrim(item->>'food_group'), 250), ''),
        100, 'g', 100, 'g',
        nullif(item->>'calories', '')::numeric,
        nullif(item->>'protein_g', '')::numeric,
        nullif(item->>'carbs_g', '')::numeric,
        nullif(item->>'fat_g', '')::numeric,
        nullif(item->>'fiber_g', '')::numeric,
        nullif(item->>'sodium_mg', '')::numeric,
        'imported', source_name, source_code,
        nullif(left(btrim(item->>'source_version'), 250), ''),
        'verified', now(), true
      ) on conflict do nothing;
    end if;
    cached_count := cached_count + 1;
  end loop;
  return cached_count;
end;
$function$;

revoke all on function public.cache_official_foods(jsonb) from public, anon;
grant execute on function public.cache_official_foods(jsonb) to authenticated;

comment on function public.cache_official_foods(jsonb) is
  'Cache seguro e idempotente de resultados nutricionais oficiais consultados em TBCA e USDA.';
