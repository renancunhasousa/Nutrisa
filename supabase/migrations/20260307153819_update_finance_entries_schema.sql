ALTER TABLE public.finance_entries 
ADD COLUMN IF NOT EXISTS patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS installments boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS installment_count integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS package_type text,
ADD COLUMN IF NOT EXISTS observations text;

COMMENT ON COLUMN public.finance_entries.type IS 'Substitui tipo simples por entrada/despesa';
;
