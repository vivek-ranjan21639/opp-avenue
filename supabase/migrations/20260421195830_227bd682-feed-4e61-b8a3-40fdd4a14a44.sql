-- Restore full table privileges for authenticated role.
-- RLS policies (is_admin_or_editor) still control who can actually write.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.b_authors TO authenticated;

-- Anon role keeps only safe column-level SELECT (no email).
-- Re-assert in case prior migration left it inconsistent.
GRANT SELECT (id, name, bio, profile_image, profile_link, show_email, created_at, updated_at)
  ON public.b_authors TO anon;