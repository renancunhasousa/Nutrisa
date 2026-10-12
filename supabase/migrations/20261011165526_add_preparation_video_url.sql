alter table public.product_catalog
  add column if not exists video_url text;

alter table public.product_catalog
  drop constraint if exists product_catalog_video_url_check;

alter table public.product_catalog
  add constraint product_catalog_video_url_check
  check (video_url is null or video_url ~* '^https://[^[:space:]]+$');

comment on column public.product_catalog.video_url is
  'Link HTTPS opcional para vídeo de preparo, como TikTok, Instagram Reel ou YouTube.';
