
CREATE TABLE public.static_routes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path text NOT NULL UNIQUE,
  priority text NOT NULL DEFAULT '0.5',
  changefreq text NOT NULL DEFAULT 'weekly',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.static_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active routes"
  ON public.static_routes
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage routes"
  ON public.static_routes
  FOR ALL
  USING (auth.uid() = '240f1361-1f37-4cae-b12b-8fe51e789a76'::uuid);
