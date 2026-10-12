
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: patients
create table if not exists public.patients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  initials text,
  phone text,
  email text,
  created_at timestamptz default now()
);

-- Table: appointments
create table if not exists public.appointments (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.patients(id) on delete cascade,
  type text not null,
  scheduled_at timestamptz not null,
  status text not null default 'pending', -- 'confirmed', 'pending', 'canceled'
  created_at timestamptz default now()
);

-- Table: tasks
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  text text not null,
  completed boolean not null default false,
  scheduled_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Table: finance_entries
create table if not exists public.finance_entries (
  id uuid primary key default uuid_generate_v4(),
  description text,
  amount numeric not null,
  type text not null, -- 'income_obtained', 'income_expected'
  entry_date date not null default current_date,
  created_at timestamptz default now()
);

-- Insert dummy data to let the user see it working
-- 1. Patients
insert into public.patients (name, initials, email) values
('Ana Oliveira', 'AO', 'ana@email.com'),
('Bruno Santos', 'BS', 'bruno@email.com'),
('Carla Mendes', 'CM', 'carla@email.com'),
('Diego Lima', 'DL', 'diego@email.com');

-- 2. Appointments (assuming the patient IDs from dummy data)
do $$
declare
    v_ana_id uuid;
    v_bruno_id uuid;
begin
    select id into v_ana_id from public.patients where initials = 'AO' limit 1;
    select id into v_bruno_id from public.patients where initials = 'BS' limit 1;

    insert into public.appointments (patient_id, type, scheduled_at, status) values
    (v_ana_id, 'Retorno nutricional', now() + interval '2 hours', 'confirmed'),
    (v_bruno_id, 'Avaliação inicial', now() + interval '3 hours', 'pending');
end $$;

-- 3. Tasks
insert into public.tasks (text, completed, scheduled_at) values
('Enviar dieta da Ana Oliveira', false, now()),
('Revisar exames do Bruno Santos', true, now()),
('Preparar lâmina de hipertrofia', false, now());

-- 4. Finance
insert into public.finance_entries (description, amount, type, entry_date) values
('Consulta Ana', 250, 'income_obtained', current_date),
('Consulta Bruno (Prevista)', 250, 'income_expected', current_date);
;
