-- Add vacancies column to jobs table
ALTER TABLE public.jobs ADD COLUMN vacancies integer NULL;

-- Add JD file URL column to jobs table
ALTER TABLE public.jobs ADD COLUMN jd_file_url text NULL;