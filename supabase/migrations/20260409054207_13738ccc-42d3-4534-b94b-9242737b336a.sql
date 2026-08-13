
-- 1. Add thumbnail_url to b_blogs
ALTER TABLE public.b_blogs ADD COLUMN thumbnail_url text;

-- 2. Create content storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('content', 'content', true);

-- 3. RLS policies for content bucket
CREATE POLICY "Public read content" ON storage.objects FOR SELECT USING (bucket_id = 'content');
CREATE POLICY "Admin insert content" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'content' AND public.is_admin_or_editor());
CREATE POLICY "Admin update content" ON storage.objects FOR UPDATE USING (bucket_id = 'content' AND public.is_admin_or_editor());
CREATE POLICY "Admin delete content" ON storage.objects FOR DELETE USING (bucket_id = 'content' AND public.is_admin_or_editor());

-- 4. Create storage_trash table
CREATE TABLE public.storage_trash (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text NOT NULL DEFAULT 'content',
  file_path text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  trashed_at timestamptz NOT NULL DEFAULT now(),
  permanent_delete_after timestamptz NOT NULL DEFAULT (now() + interval '30 days')
);

ALTER TABLE public.storage_trash ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full storage_trash" ON public.storage_trash FOR ALL USING (public.is_admin_or_editor());

CREATE INDEX idx_storage_trash_delete_after ON public.storage_trash (permanent_delete_after);

-- 5. Create trash_entity_files function
CREATE OR REPLACE FUNCTION public.trash_entity_files()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_entity_type text;
  v_prefix text;
  v_file record;
  v_new_path text;
BEGIN
  -- Determine entity type from TG_TABLE_NAME
  CASE TG_TABLE_NAME
    WHEN 'j_jobs' THEN v_entity_type := 'jobs';
    WHEN 'b_blogs' THEN v_entity_type := 'blogs';
    WHEN 'r_resources' THEN v_entity_type := 'resources';
    ELSE RETURN OLD;
  END CASE;

  v_prefix := v_entity_type || '/' || OLD.id || '/';

  -- Find all files under this entity's folder
  FOR v_file IN
    SELECT name FROM storage.objects
    WHERE bucket_id = 'content' AND name LIKE v_prefix || '%'
  LOOP
    v_new_path := '_trash/' || v_file.name;

    -- Move file by copying then deleting (Supabase storage has no rename)
    -- We just record it for the edge function to handle the actual move+delete
    INSERT INTO public.storage_trash (file_path, entity_type, entity_id)
    VALUES (v_file.name, v_entity_type, OLD.id);
  END LOOP;

  RETURN OLD;
END;
$$;

-- 6. Create triggers on content tables (NOT on entity tables)
CREATE TRIGGER trash_files_on_job_delete
  BEFORE DELETE ON public.j_jobs
  FOR EACH ROW EXECUTE FUNCTION public.trash_entity_files();

CREATE TRIGGER trash_files_on_blog_delete
  BEFORE DELETE ON public.b_blogs
  FOR EACH ROW EXECUTE FUNCTION public.trash_entity_files();

CREATE TRIGGER trash_files_on_resource_delete
  BEFORE DELETE ON public.r_resources
  FOR EACH ROW EXECUTE FUNCTION public.trash_entity_files();
