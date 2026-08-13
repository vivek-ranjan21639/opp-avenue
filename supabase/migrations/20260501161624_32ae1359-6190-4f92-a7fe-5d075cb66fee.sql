-- Drop scraper-only tables
DROP TABLE IF EXISTS public.j_raw_jobs CASCADE;
DROP TABLE IF EXISTS public.j_job_deduplication CASCADE;

-- Move any staged jobs back to manual_draft before removing the enum value
UPDATE public.j_jobs SET workflow_stage = 'manual_draft' WHERE workflow_stage = 'staged';

-- Recreate the enum without 'staged'
ALTER TABLE public.j_jobs ALTER COLUMN workflow_stage DROP DEFAULT;
ALTER TYPE public.job_workflow_stage_enum RENAME TO job_workflow_stage_enum_old;
CREATE TYPE public.job_workflow_stage_enum AS ENUM ('manual_draft','bulk_upload');
ALTER TABLE public.j_jobs
  ALTER COLUMN workflow_stage TYPE public.job_workflow_stage_enum
  USING workflow_stage::text::public.job_workflow_stage_enum;
ALTER TABLE public.j_jobs ALTER COLUMN workflow_stage SET DEFAULT 'manual_draft';
DROP TYPE public.job_workflow_stage_enum_old;