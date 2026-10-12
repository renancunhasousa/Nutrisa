
create table if not exists public.agenda_settings (
  user_id uuid references auth.users on delete cascade primary key,
  interval integer default 30,
  legend_colors jsonb default '{"padrao": "#10b981", "primeira": "#6366f1", "bio": "#f59e0b", "google": "#4285F4", "bloqueado": "#94a3b8"}'::jsonb,
  custom_legends jsonb default '[]'::jsonb,
  updated_at timestamp with time zone default now()
);

-- Habilitar RLS
alter table public.agenda_settings enable row level security;

-- Criar políticas
create policy "Users can view their own agenda settings"
  on public.agenda_settings for select
  using (auth.uid() = user_id);

create policy "Users can update their own agenda settings"
  on public.agenda_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can modify their own agenda settings"
  on public.agenda_settings for update
  using (auth.uid() = user_id);
;
