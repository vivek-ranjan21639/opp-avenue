
GRANT SELECT ON public.b_authors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.b_authors TO authenticated;
GRANT ALL ON public.b_authors TO service_role;
