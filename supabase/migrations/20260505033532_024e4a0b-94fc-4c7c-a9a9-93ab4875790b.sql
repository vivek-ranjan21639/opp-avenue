-- Add display_order and fill_color flag to resource categories
ALTER TABLE public.r_categories
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_filled boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_r_categories_display_order ON public.r_categories (display_order);

-- Admin notices: per-page-targetable banner shown above header on selected pages
CREATE TABLE IF NOT EXISTS public.admin_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  link_url text,
  is_active boolean NOT NULL DEFAULT true,
  -- target_pages is an array of page keys, e.g. ['home','lighthouse','resources','job_detail','blog_detail','resource_category','about','contact','advertise']
  target_pages text[] NOT NULL DEFAULT ARRAY[]::text[],
  display_order integer NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.admin_notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active notices" ON public.admin_notices;
CREATE POLICY "Public read active notices"
  ON public.admin_notices
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admin manage admin_notices" ON public.admin_notices;
CREATE POLICY "Admin manage admin_notices"
  ON public.admin_notices
  FOR ALL
  USING (is_admin_or_editor())
  WITH CHECK (is_admin_or_editor());

CREATE OR REPLACE FUNCTION public.touch_admin_notices()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_notices_touch ON public.admin_notices;
CREATE TRIGGER trg_admin_notices_touch
  BEFORE UPDATE ON public.admin_notices
  FOR EACH ROW EXECUTE FUNCTION public.touch_admin_notices();

-- Auto-fill slug for jobs if missing on insert
CREATE OR REPLACE FUNCTION public.j_jobs_autofill_slug()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  base text;
  candidate text;
  i int := 0;
BEGIN
  IF NEW.slug IS NULL OR length(trim(NEW.slug)) = 0 THEN
    base := lower(regexp_replace(coalesce(NEW.title,'job'), '[^a-zA-Z0-9]+', '-', 'g'));
    base := regexp_replace(base, '(^-+|-+$)', '', 'g');
    IF base = '' THEN base := 'job'; END IF;
    candidate := base;
    WHILE EXISTS (SELECT 1 FROM public.j_jobs WHERE slug = candidate AND (NEW.id IS NULL OR id <> NEW.id)) LOOP
      i := i + 1;
      candidate := base || '-' || i::text;
    END LOOP;
    NEW.slug := candidate;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_j_jobs_autofill_slug ON public.j_jobs;
CREATE TRIGGER trg_j_jobs_autofill_slug
  BEFORE INSERT OR UPDATE ON public.j_jobs
  FOR EACH ROW EXECUTE FUNCTION public.j_jobs_autofill_slug();

-- Same for blogs and resources for safety
CREATE OR REPLACE FUNCTION public.b_blogs_autofill_slug()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  base text;
  candidate text;
  i int := 0;
BEGIN
  IF NEW.slug IS NULL OR length(trim(NEW.slug)) = 0 THEN
    base := lower(regexp_replace(coalesce(NEW.title,'post'), '[^a-zA-Z0-9]+', '-', 'g'));
    base := regexp_replace(base, '(^-+|-+$)', '', 'g');
    IF base = '' THEN base := 'post'; END IF;
    candidate := base;
    WHILE EXISTS (SELECT 1 FROM public.b_blogs WHERE slug = candidate AND (NEW.id IS NULL OR id <> NEW.id)) LOOP
      i := i + 1;
      candidate := base || '-' || i::text;
    END LOOP;
    NEW.slug := candidate;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_b_blogs_autofill_slug ON public.b_blogs;
CREATE TRIGGER trg_b_blogs_autofill_slug
  BEFORE INSERT OR UPDATE ON public.b_blogs
  FOR EACH ROW EXECUTE FUNCTION public.b_blogs_autofill_slug();

CREATE OR REPLACE FUNCTION public.r_resources_autofill_slug()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  base text;
  candidate text;
  i int := 0;
BEGIN
  IF NEW.slug IS NULL OR length(trim(NEW.slug)) = 0 THEN
    base := lower(regexp_replace(coalesce(NEW.title,'resource'), '[^a-zA-Z0-9]+', '-', 'g'));
    base := regexp_replace(base, '(^-+|-+$)', '', 'g');
    IF base = '' THEN base := 'resource'; END IF;
    candidate := base;
    WHILE EXISTS (SELECT 1 FROM public.r_resources WHERE slug = candidate AND (NEW.id IS NULL OR id <> NEW.id)) LOOP
      i := i + 1;
      candidate := base || '-' || i::text;
    END LOOP;
    NEW.slug := candidate;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_r_resources_autofill_slug ON public.r_resources;
CREATE TRIGGER trg_r_resources_autofill_slug
  BEFORE INSERT OR UPDATE ON public.r_resources
  FOR EACH ROW EXECUTE FUNCTION public.r_resources_autofill_slug();
