-- Add stable sequential job_number for human-readable IDs (JL/JS/JD + 5-digit pad)
CREATE SEQUENCE IF NOT EXISTS public.j_jobs_number_seq START 1;

ALTER TABLE public.j_jobs
  ADD COLUMN IF NOT EXISTS job_number integer;

-- Backfill existing rows in creation order
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) AS rn
  FROM public.j_jobs
  WHERE job_number IS NULL
)
UPDATE public.j_jobs j
SET job_number = o.rn
FROM ordered o
WHERE j.id = o.id;

-- Advance sequence past the max existing value
SELECT setval('public.j_jobs_number_seq', GREATEST(COALESCE((SELECT MAX(job_number) FROM public.j_jobs), 0), 1));

ALTER TABLE public.j_jobs
  ALTER COLUMN job_number SET DEFAULT nextval('public.j_jobs_number_seq'),
  ALTER COLUMN job_number SET NOT NULL;

ALTER SEQUENCE public.j_jobs_number_seq OWNED BY public.j_jobs.job_number;

CREATE UNIQUE INDEX IF NOT EXISTS j_jobs_job_number_key ON public.j_jobs(job_number);