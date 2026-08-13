
-- Per-category field config
ALTER TABLE public.r_categories
  ADD COLUMN IF NOT EXISTS field_config jsonb NOT NULL DEFAULT '{
    "thumbnail": true,
    "title": true,
    "description": true,
    "notes": false,
    "tags": true,
    "link": true,
    "linked": true
  }'::jsonb;

-- Notes field on resources
ALTER TABLE public.r_resources ADD COLUMN IF NOT EXISTS notes text;

-- Tag groups scoped to a category
CREATE TABLE IF NOT EXISTS public.r_tag_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.r_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, slug)
);

ALTER TABLE public.r_tag_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read r_tag_groups"
  ON public.r_tag_groups FOR SELECT USING (true);

CREATE POLICY "Admin full r_tag_groups"
  ON public.r_tag_groups FOR ALL
  USING (is_admin_or_editor())
  WITH CHECK (is_admin_or_editor());

CREATE INDEX IF NOT EXISTS idx_r_tag_groups_category ON public.r_tag_groups(category_id);

-- Add group_id to existing tags (nullable for backward compat)
ALTER TABLE public.r_tags
  ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.r_tag_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_r_tags_group ON public.r_tags(group_id);
