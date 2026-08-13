ALTER TABLE public.b_blogs
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_top boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_b_blogs_is_featured ON public.b_blogs (is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_b_blogs_is_top ON public.b_blogs (is_top) WHERE is_top = true;