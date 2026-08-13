
ALTER TABLE public.b_authors
  ADD COLUMN IF NOT EXISTS show_email boolean NOT NULL DEFAULT false;

GRANT SELECT (id, name, bio, profile_image, profile_link, show_email, created_at, updated_at)
  ON public.b_authors TO anon, authenticated;

DROP VIEW IF EXISTS public.b_authors_public;

CREATE VIEW public.b_authors_public
WITH (security_invoker = true) AS
SELECT
  id,
  name,
  bio,
  profile_image,
  profile_link,
  show_email,
  CASE WHEN show_email THEN email ELSE NULL END AS email,
  created_at,
  updated_at
FROM public.b_authors;

GRANT SELECT ON public.b_authors_public TO anon, authenticated;
