
-- Table: professionals (if we want to scale to multiple)
create table if not exists public.professionals (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  role text not null, -- 'nutricionista', 'personal_trainer'
  created_at timestamptz default now()
);

-- Table: physical_evaluations (Biometria / Avaliação Física)
create table if not exists public.physical_evaluations (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.patients(id) on delete cascade,
  professional_id uuid references public.professionals(id),
  weight numeric, -- Peso
  height numeric, -- Altura
  body_fat numeric, -- % Gordura
  muscle_mass numeric, -- Massa muscular
  chest numeric, -- Peitoral
  waist numeric, -- Cintura
  hip numeric, -- Quadril
  evaluation_date date default current_date,
  created_at timestamptz default now()
);

-- Table: workout_plans (Planos de Treino)
create table if not exists public.workout_plans (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.patients(id) on delete cascade,
  professional_id uuid references public.professionals(id),
  name text not null, -- ex: "Hipertrofia - ABC"
  goal text,
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

-- Table: exercises (Banco de exercícios)
create table if not exists public.exercises (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text, -- ex: 'Peito', 'Costas'
  video_url text, -- link para demonstração
  created_at timestamptz default now()
);

-- Table: workout_items (Exercícios dentro de um plano)
create table if not exists public.workout_items (
  id uuid primary key default uuid_generate_v4(),
  plan_id uuid references public.workout_plans(id) on delete cascade,
  exercise_id uuid references public.exercises(id),
  sets integer,
  reps text,
  rest_time text,
  order_index integer,
  created_at timestamptz default now()
);

-- Insert dummy professional
insert into public.professionals (name, role) values
('Dr. Roberto Silva', 'nutricionista'),
('Prof. Carlos Personal', 'personal_trainer');

-- Insert some base exercises
insert into public.exercises (name, category) values
('Supino Reto', 'Peito'),
('Agachamento Livre', 'Pernas'),
('Puxada no Pulley', 'Costas'),
('Rosca Direta', 'Bíceps');
;
