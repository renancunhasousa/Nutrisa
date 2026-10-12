ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'ativo';;
