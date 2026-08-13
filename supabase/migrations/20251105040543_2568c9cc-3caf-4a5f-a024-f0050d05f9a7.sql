-- Add featured column to resources table for "You might like" section
ALTER TABLE public.resources 
ADD COLUMN featured boolean DEFAULT false;

-- Create index for better performance when querying featured resources
CREATE INDEX idx_resources_featured ON public.resources(featured) WHERE featured = true;