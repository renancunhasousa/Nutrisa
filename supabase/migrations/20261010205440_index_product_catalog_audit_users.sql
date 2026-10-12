create index product_catalog_created_by_idx
  on public.product_catalog (created_by)
  where created_by is not null;

create index product_catalog_updated_by_idx
  on public.product_catalog (updated_by)
  where updated_by is not null;
