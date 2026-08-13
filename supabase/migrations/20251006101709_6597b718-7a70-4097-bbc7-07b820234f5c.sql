-- Create companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  website TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  location TEXT NOT NULL,
  salary TEXT NOT NULL,
  type TEXT NOT NULL,
  experience TEXT NOT NULL,
  skills TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,
  remote BOOLEAN DEFAULT false,
  posted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Public read access for companies
CREATE POLICY "Anyone can view active companies"
ON public.companies
FOR SELECT
USING (true);

-- Public read access for jobs
CREATE POLICY "Anyone can view active jobs"
ON public.jobs
FOR SELECT
USING (is_active = true);

-- Create indexes for search and filtering performance
CREATE INDEX idx_jobs_company_name ON public.jobs(company_name);
CREATE INDEX idx_jobs_location ON public.jobs(location);
CREATE INDEX idx_jobs_type ON public.jobs(type);
CREATE INDEX idx_jobs_experience ON public.jobs(experience);
CREATE INDEX idx_jobs_remote ON public.jobs(remote);
CREATE INDEX idx_jobs_posted_at ON public.jobs(posted_at DESC);
CREATE INDEX idx_jobs_title_search ON public.jobs USING gin(to_tsvector('english', title));
CREATE INDEX idx_jobs_description_search ON public.jobs USING gin(to_tsvector('english', description));
CREATE INDEX idx_jobs_skills ON public.jobs USING gin(skills);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample companies
INSERT INTO public.companies (name) VALUES
  ('Amazon'),
  ('Google'),
  ('Microsoft'),
  ('Netflix'),
  ('Meta'),
  ('Spotify'),
  ('Tesla'),
  ('Uber'),
  ('National Legal Services Authority')
ON CONFLICT (name) DO NOTHING;