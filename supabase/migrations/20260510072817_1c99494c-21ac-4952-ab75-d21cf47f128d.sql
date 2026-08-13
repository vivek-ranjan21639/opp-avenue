
-- 1) Lookup table for admin-editable taxonomy options
CREATE TABLE IF NOT EXISTS public.j_taxonomy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('job_type','work_mode','experience_level')),
  value text NOT NULL,
  label text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(kind, value)
);

ALTER TABLE public.j_taxonomy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read j_taxonomy" ON public.j_taxonomy FOR SELECT USING (true);
CREATE POLICY "Admin manage j_taxonomy" ON public.j_taxonomy FOR ALL
  USING (is_admin_or_editor()) WITH CHECK (is_admin_or_editor());

CREATE TRIGGER trg_j_taxonomy_updated_at
  BEFORE UPDATE ON public.j_taxonomy
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Convert j_jobs columns from enum to text so admins can add custom values
ALTER TABLE public.j_jobs ALTER COLUMN job_type DROP DEFAULT;
ALTER TABLE public.j_jobs ALTER COLUMN job_type TYPE text USING job_type::text;
ALTER TABLE public.j_jobs ALTER COLUMN job_type DROP NOT NULL;

ALTER TABLE public.j_jobs ALTER COLUMN work_mode DROP DEFAULT;
ALTER TABLE public.j_jobs ALTER COLUMN work_mode TYPE text USING work_mode::text;
ALTER TABLE public.j_jobs ALTER COLUMN work_mode DROP NOT NULL;

ALTER TABLE public.j_jobs ALTER COLUMN experience_level TYPE text USING experience_level::text;

-- 3) Seed default options matching prior enum values
INSERT INTO public.j_taxonomy (kind, value, label, display_order) VALUES
  ('job_type','full_time','Full Time',1),
  ('job_type','part_time','Part Time',2),
  ('job_type','contract','Contract',3),
  ('job_type','internship','Internship',4),
  ('job_type','freelance','Freelance',5),
  ('work_mode','onsite','On-site',1),
  ('work_mode','remote','Remote',2),
  ('work_mode','hybrid','Hybrid',3),
  ('experience_level','entry','Entry',1),
  ('experience_level','mid','Mid',2),
  ('experience_level','senior','Senior',3),
  ('experience_level','lead','Lead',4),
  ('experience_level','executive','Executive',5)
ON CONFLICT (kind, value) DO NOTHING;
