-- Site pages CMS for About / Advertise rich-text content
CREATE TABLE public.site_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Site pages are viewable by everyone"
ON public.site_pages FOR SELECT USING (true);

-- Admin write (super admin or site_pages module permission; fall back to any admin role)
CREATE POLICY "Admins can insert site pages"
ON public.site_pages FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update site pages"
ON public.site_pages FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete site pages"
ON public.site_pages FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_site_pages_updated_at
BEFORE UPDATE ON public.site_pages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default rows for the two managed pages
INSERT INTO public.site_pages (slug, content, enabled) VALUES
  ('about', '', false),
  ('advertise', '', false)
ON CONFLICT (slug) DO NOTHING;