
-- 1) Workflow stage on j_jobs to separate manual drafts from staged (scraped) drafts
DO $$ BEGIN
  CREATE TYPE public.job_workflow_stage_enum AS ENUM ('manual_draft','staged');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.j_jobs
  ADD COLUMN IF NOT EXISTS workflow_stage public.job_workflow_stage_enum NOT NULL DEFAULT 'manual_draft';

CREATE INDEX IF NOT EXISTS idx_j_jobs_workflow_stage ON public.j_jobs(workflow_stage);

-- 2) Page type on j_sources to distinguish company career page vs job portal
DO $$ BEGIN
  CREATE TYPE public.source_page_type_enum AS ENUM ('career','portal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.j_sources
  ADD COLUMN IF NOT EXISTS page_type public.source_page_type_enum NOT NULL DEFAULT 'career';
