-- Create domains table
CREATE TABLE public.domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  human_id TEXT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for domains
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

-- Create policies for domains
CREATE POLICY "Admins can manage domains" 
ON public.domains 
FOR ALL 
USING (auth.uid() = '240f1361-1f37-4cae-b12b-8fe51e789a76'::uuid);

CREATE POLICY "Users can view domains" 
ON public.domains 
FOR SELECT 
USING (true);

-- Create domain human_id trigger
CREATE OR REPLACE FUNCTION public.set_domain_human_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    max_id INT;
BEGIN
    SELECT COALESCE(MAX(CAST(SPLIT_PART(human_id,'-',2) AS INT)),0) + 1 INTO max_id FROM domains;
    NEW.human_id := 'DOM-' || LPAD(max_id::TEXT,5,'0');
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_domain_human_id_trigger
BEFORE INSERT ON public.domains
FOR EACH ROW
EXECUTE FUNCTION public.set_domain_human_id();

-- Create job_domains junction table
CREATE TABLE public.job_domains (
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  PRIMARY KEY (job_id, domain_id)
);

-- Enable RLS for job_domains
ALTER TABLE public.job_domains ENABLE ROW LEVEL SECURITY;

-- Create policies for job_domains
CREATE POLICY "Admins can manage job_domains" 
ON public.job_domains 
FOR ALL 
USING (auth.uid() = '240f1361-1f37-4cae-b12b-8fe51e789a76'::uuid);

CREATE POLICY "Users can view job_domains" 
ON public.job_domains 
FOR SELECT 
USING (true);

-- Add author_profile_url to authors table
ALTER TABLE public.authors 
ADD COLUMN profile_url TEXT;

-- Add read_time_minutes to blogs table (will be calculated on frontend but stored for caching)
ALTER TABLE public.blogs 
ADD COLUMN read_time_minutes INTEGER;