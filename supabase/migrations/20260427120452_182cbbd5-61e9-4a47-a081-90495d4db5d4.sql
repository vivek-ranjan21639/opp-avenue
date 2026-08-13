-- Drop redundant columns and rebuild j_featured for poster + job-card support across home and job_detail pages

-- 1. Create enums
DO $$ BEGIN
  CREATE TYPE public.featured_content_type_enum AS ENUM (
    'poster_static',
    'poster_clickable',
    'poster_job_link',
    'job_card'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.featured_display_location_enum AS ENUM ('home', 'job_detail');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Drop redundant columns and add new structured columns
ALTER TABLE public.j_featured DROP COLUMN IF EXISTS content_id;
ALTER TABLE public.j_featured DROP COLUMN IF EXISTS link;
ALTER TABLE public.j_featured DROP COLUMN IF EXISTS priority_order;

ALTER TABLE public.j_featured
  ADD COLUMN IF NOT EXISTS content_type public.featured_content_type_enum NOT NULL DEFAULT 'poster_static',
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS link_url text,
  ADD COLUMN IF NOT EXISTS job_id uuid REFERENCES public.j_jobs(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS display_location public.featured_display_location_enum NOT NULL DEFAULT 'home',
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- 3. Helpful indexes
CREATE INDEX IF NOT EXISTS idx_j_featured_location_active_order
  ON public.j_featured (display_location, is_active, display_order);

CREATE INDEX IF NOT EXISTS idx_j_featured_job_id
  ON public.j_featured (job_id);

-- 4. updated_at trigger
DROP TRIGGER IF EXISTS trg_j_featured_updated_at ON public.j_featured;
CREATE TRIGGER trg_j_featured_updated_at
  BEFORE UPDATE ON public.j_featured
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
