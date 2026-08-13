ALTER TABLE public.r_categories ADD COLUMN default_view text NOT NULL DEFAULT 'list';
COMMENT ON COLUMN public.r_categories.default_view IS 'list or grid — controls resource category page layout';

-- Update existing categories that might have been intended as grid to list default (they can be changed in admin)
-- No data migration needed since default covers it.

-- Also need to update queries: ensure default_view is public readable
-- r_categories already has public read policy, so new column is automatically readable.

-- Update admin side queries are also covered by Admin full r_categories policy.

SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'r_categories' AND table_schema = 'public';


