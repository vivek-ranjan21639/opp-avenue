-- Revoke the overly broad grant that re-exposed the email column
REVOKE SELECT ON public.b_authors FROM authenticated;
REVOKE SELECT ON public.b_authors FROM anon;

-- Re-grant only safe columns (email excluded)
GRANT SELECT (id, name, bio, profile_image, profile_link, show_email, created_at, updated_at)
  ON public.b_authors TO authenticated;
GRANT SELECT (id, name, bio, profile_image, profile_link, show_email, created_at, updated_at)
  ON public.b_authors TO anon;

-- Ensure masked view remains accessible
GRANT SELECT ON public.b_authors_public TO anon, authenticated;