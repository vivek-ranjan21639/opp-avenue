
-- 1) Drop public read on b_authors so email isn't exposed
DROP POLICY IF EXISTS "Public read b_authors non-sensitive" ON public.b_authors;

-- Drop existing view if any
DROP VIEW IF EXISTS public.b_authors_public;

-- Public-safe view: email only when show_email=true
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

-- Allow the security_invoker view to read rows; the view itself masks email.
CREATE POLICY "Read b_authors via masked view"
ON public.b_authors
FOR SELECT
USING (true);

-- Restrict direct column access on the base table so anon/authenticated cannot pull the email column directly
REVOKE SELECT ON public.b_authors FROM anon, authenticated;
GRANT SELECT (id, name, bio, profile_image, profile_link, show_email, created_at, updated_at)
  ON public.b_authors TO anon, authenticated;

-- 2) j_sources: remove public read
DROP POLICY IF EXISTS "Public read sources" ON public.j_sources;

-- 3) Analytics RPCs: validate existence + restrict to authenticated
CREATE OR REPLACE FUNCTION public.increment_resource_view(p_resource_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.r_resources WHERE id = p_resource_id) THEN
    RETURN;
  END IF;
  INSERT INTO public.r_resource_analytics (resource_id, view_count)
  VALUES (p_resource_id, 1)
  ON CONFLICT (resource_id) DO UPDATE SET view_count = r_resource_analytics.view_count + 1, updated_at = now();
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_resource_download(p_resource_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.r_resources WHERE id = p_resource_id) THEN
    RETURN;
  END IF;
  INSERT INTO public.r_resource_analytics (resource_id, download_count)
  VALUES (p_resource_id, 1)
  ON CONFLICT (resource_id) DO UPDATE SET download_count = r_resource_analytics.download_count + 1, updated_at = now();
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.increment_resource_view(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_resource_download(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_resource_view(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_resource_download(uuid) TO authenticated;
