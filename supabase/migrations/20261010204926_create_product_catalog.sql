create table public.product_catalog (
  id uuid primary key default extensions.uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  name text not null check (btrim(name) <> ''),
  brand text,
  category text not null default 'alimento'
    check (category in ('alimento', 'suplemento', 'bebida', 'outro')),
  barcode text,
  description text,
  serving_size numeric(10, 2) check (serving_size is null or serving_size > 0),
  serving_unit text,
  calories numeric(10, 2) check (calories is null or calories >= 0),
  protein_g numeric(10, 2) check (protein_g is null or protein_g >= 0),
  carbs_g numeric(10, 2) check (carbs_g is null or carbs_g >= 0),
  fat_g numeric(10, 2) check (fat_g is null or fat_g >= 0),
  fiber_g numeric(10, 2) check (fiber_g is null or fiber_g >= 0),
  sodium_mg numeric(10, 2) check (sodium_mg is null or sodium_mg >= 0),
  nutrition_facts jsonb not null default '[]'::jsonb
    check (jsonb_typeof(nutrition_facts) = 'array'),
  ingredients text,
  allergens text,
  image_path text,
  image_url text,
  source_type text not null default 'manual'
    check (source_type in ('manual', 'ai_web', 'imported')),
  source_urls text[] not null default '{}'::text[],
  source_notes text,
  verification_status text not null default 'draft'
    check (verification_status in ('draft', 'verified')),
  verified_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.product_catalog is
  'Catálogo de alimentos, bebidas e suplementos revisado pela clínica para reutilização em planos alimentares.';
comment on column public.product_catalog.source_type is
  'Origem inicial dos dados; resultados de IA/web permanecem como rascunho até revisão humana.';
comment on column public.product_catalog.nutrition_facts is
  'Nutrientes adicionais no formato [{name, amount, unit}].';

create index product_catalog_organization_updated_idx
  on public.product_catalog (organization_id, updated_at desc)
  where archived_at is null;

create index product_catalog_organization_name_idx
  on public.product_catalog (organization_id, lower(name));

create unique index product_catalog_organization_barcode_key
  on public.product_catalog (organization_id, barcode)
  where barcode is not null and btrim(barcode) <> '' and archived_at is null;

alter table public.product_catalog enable row level security;

create policy product_catalog_select_member
on public.product_catalog
for select
to authenticated
using ((select private.is_organization_member(organization_id)));

create policy product_catalog_insert_member
on public.product_catalog
for insert
to authenticated
with check ((select private.is_organization_member(organization_id)));

create policy product_catalog_update_member
on public.product_catalog
for update
to authenticated
using ((select private.is_organization_member(organization_id)))
with check ((select private.is_organization_member(organization_id)));

create policy product_catalog_delete_member
on public.product_catalog
for delete
to authenticated
using ((select private.is_organization_member(organization_id)));

revoke all on table public.product_catalog from anon;
grant select, insert, update, delete on table public.product_catalog to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy product_images_select_member
on storage.objects
for select
to authenticated
using (
  bucket_id = 'product-images'
  and (select private.is_organization_member(((storage.foldername(name))[1])::uuid))
);

create policy product_images_insert_member
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (select private.is_organization_member(((storage.foldername(name))[1])::uuid))
);

create policy product_images_delete_member
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and (select private.is_organization_member(((storage.foldername(name))[1])::uuid))
);
