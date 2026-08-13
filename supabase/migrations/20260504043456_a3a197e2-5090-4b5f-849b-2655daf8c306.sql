-- 1) Lock down b_authors.email at column level
REVOKE SELECT (email) ON public.b_authors FROM anon, authenticated;

-- 2) Lock down j_job_applications.application_email at column level
REVOKE SELECT (application_email) ON public.j_job_applications FROM anon, authenticated;
