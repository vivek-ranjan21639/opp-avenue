
-- ============================================
-- Add new columns to existing tables
-- ============================================
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS career_page_url text;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS doc_file_path text;

-- ============================================
-- Create enums for staging/scraping statuses
-- ============================================
CREATE TYPE public.staging_review_status AS ENUM ('pending_review', 'approved', 'rejected');
CREATE TYPE public.scraped_job_status AS ENUM ('pending', 'approved', 'rejected');

-- ============================================
-- [RESOURCES] resource_processing_log
-- ============================================
CREATE TABLE public.resource_processing_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid REFERENCES public.resources(id) ON DELETE CASCADE NOT NULL,
  file_path text NOT NULL UNIQUE,
  processed_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'success',
  error_message text
);
ALTER TABLE public.resource_processing_log ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.resource_processing_log IS '[RESOURCES] Log of processed resource DOCX files';

CREATE POLICY "Admins can manage resource_processing_log" ON public.resource_processing_log
  FOR ALL USING (auth.uid() = '240f1361-1f37-4cae-b12b-8fe51e789a76'::uuid);
CREATE POLICY "Users can view resource_processing_log" ON public.resource_processing_log
  FOR SELECT USING (true);

-- ============================================
-- [BLOGS] blog_processing_log
-- ============================================
CREATE TABLE public.blog_processing_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id uuid REFERENCES public.blogs(id) ON DELETE CASCADE NOT NULL,
  file_path text NOT NULL UNIQUE,
  processed_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'success',
  error_message text
);
ALTER TABLE public.blog_processing_log ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.blog_processing_log IS '[BLOGS] Log of processed blog DOCX files';

CREATE POLICY "Admins can manage blog_processing_log" ON public.blog_processing_log
  FOR ALL USING (auth.uid() = '240f1361-1f37-4cae-b12b-8fe51e789a76'::uuid);
CREATE POLICY "Users can view blog_processing_log" ON public.blog_processing_log
  FOR SELECT USING (true);

-- ============================================
-- [JOBS] scraped_jobs
-- ============================================
CREATE TABLE public.scraped_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  source_url text NOT NULL,
  title text NOT NULL,
  file_path text,
  status public.scraped_job_status NOT NULL DEFAULT 'pending',
  raw_content text,
  scraped_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, source_url)
);
ALTER TABLE public.scraped_jobs ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.scraped_jobs IS '[JOBS] Scraped career page listings awaiting review';

CREATE POLICY "Admins can manage scraped_jobs" ON public.scraped_jobs
  FOR ALL USING (auth.uid() = '240f1361-1f37-4cae-b12b-8fe51e789a76'::uuid);

-- ============================================
-- [JOBS] staging_jobs
-- ============================================
CREATE TABLE public.staging_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_scraped_job_id uuid REFERENCES public.scraped_jobs(id) ON DELETE SET NULL,
  file_path text,
  -- Mirrors jobs columns
  title text NOT NULL,
  description text,
  responsibilities text[],
  qualifications text[],
  salary_min numeric,
  salary_max numeric,
  currency text,
  job_type text,
  work_mode text,
  deadline date,
  vacancies integer,
  application_link text,
  application_email text,
  -- Parsed related data as JSON
  parsed_company_name text,
  parsed_locations jsonb DEFAULT '[]'::jsonb,
  parsed_skills jsonb DEFAULT '[]'::jsonb,
  parsed_domains jsonb DEFAULT '[]'::jsonb,
  parsed_benefits jsonb DEFAULT '[]'::jsonb,
  parsed_culture_points jsonb DEFAULT '[]'::jsonb,
  parsed_eligibility jsonb DEFAULT '{}'::jsonb,
  -- Review fields
  review_status public.staging_review_status NOT NULL DEFAULT 'pending_review',
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz
);
ALTER TABLE public.staging_jobs ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.staging_jobs IS '[JOBS] Staging table for parsed JDs awaiting approval';

CREATE POLICY "Admins can manage staging_jobs" ON public.staging_jobs
  FOR ALL USING (auth.uid() = '240f1361-1f37-4cae-b12b-8fe51e789a76'::uuid);

-- ============================================
-- [JOBS] jd_processing_log
-- ============================================
CREATE TABLE public.jd_processing_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path text NOT NULL UNIQUE,
  staging_job_id uuid REFERENCES public.staging_jobs(id) ON DELETE SET NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'success',
  error_message text
);
ALTER TABLE public.jd_processing_log ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.jd_processing_log IS '[JOBS] Log of processed JD files';

CREATE POLICY "Admins can manage jd_processing_log" ON public.jd_processing_log
  FOR ALL USING (auth.uid() = '240f1361-1f37-4cae-b12b-8fe51e789a76'::uuid);

-- ============================================
-- Storage buckets
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('resource-docs', 'resource-docs', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('resource-files', 'resource-files', true);

-- RLS for resource-docs (admin only)
CREATE POLICY "Admin can manage resource-docs" ON storage.objects
  FOR ALL USING (bucket_id = 'resource-docs' AND auth.uid() = '240f1361-1f37-4cae-b12b-8fe51e789a76'::uuid)
  WITH CHECK (bucket_id = 'resource-docs' AND auth.uid() = '240f1361-1f37-4cae-b12b-8fe51e789a76'::uuid);

-- RLS for resource-files (public read, admin write)
CREATE POLICY "Anyone can read resource-files" ON storage.objects
  FOR SELECT USING (bucket_id = 'resource-files');
CREATE POLICY "Admin can manage resource-files" ON storage.objects
  FOR ALL USING (bucket_id = 'resource-files' AND auth.uid() = '240f1361-1f37-4cae-b12b-8fe51e789a76'::uuid)
  WITH CHECK (bucket_id = 'resource-files' AND auth.uid() = '240f1361-1f37-4cae-b12b-8fe51e789a76'::uuid);
