-- Trigger-only functions should not be exposed via PostgREST
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trash_entity_files() FROM PUBLIC, anon, authenticated;