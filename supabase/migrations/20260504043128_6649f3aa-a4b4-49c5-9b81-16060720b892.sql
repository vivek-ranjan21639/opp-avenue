ALTER TABLE public.j_jobs DROP COLUMN IF EXISTS salary_type;
ALTER TABLE public.j_jobs DROP COLUMN IF EXISTS salary_period;
DROP TYPE IF EXISTS public.salary_type_enum;
DROP TYPE IF EXISTS public.salary_period_enum;