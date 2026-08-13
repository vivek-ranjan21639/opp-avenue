
-- 1. Restrict b_authors public SELECT so email is not exposed.
-- Drop the permissive public SELECT policy on b_authors and replace with a
-- safe public view that excludes the email column.
DROP POLICY IF EXISTS "Public read b_authors" ON public.b_authors;

-- Create a public-safe view of authors (no email)
CREATE OR REPLACE VIEW public.b_authors_public
WITH (security_invoker = true) AS
SELECT id, name, bio, profile_image, profile_link, created_at, updated_at
FROM public.b_authors;

GRANT SELECT ON public.b_authors_public TO anon, authenticated;

-- Recreate a public SELECT policy on b_authors that excludes the email column
-- by relying on a column-level grant. First, revoke broad access then grant
-- only the safe columns to anon/authenticated.
REVOKE SELECT ON public.b_authors FROM anon, authenticated;
GRANT SELECT (id, name, bio, profile_image, profile_link, created_at, updated_at)
  ON public.b_authors TO anon, authenticated;

-- Add a SELECT policy so RLS allows reading the granted columns
CREATE POLICY "Public read b_authors non-sensitive"
ON public.b_authors
FOR SELECT
USING (true);

-- 2. Tighten storage 'uploads' bucket: require ownership for UPDATE/DELETE.
-- Files must be stored under a path beginning with the user's auth.uid().
DROP POLICY IF EXISTS "Authenticated users can update uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own uploads" ON storage.objects;

CREATE POLICY "Users can update own uploads"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'uploads'
  AND (
    public.is_admin_or_editor()
    OR auth.uid()::text = (storage.foldername(name))[1]
    OR owner = auth.uid()
  )
);

CREATE POLICY "Users can delete own uploads"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'uploads'
  AND (
    public.is_admin_or_editor()
    OR auth.uid()::text = (storage.foldername(name))[1]
    OR owner = auth.uid()
  )
);
