-- 1. Add application_email to jobs table
ALTER TABLE jobs ADD COLUMN application_email text;

-- 2. Change resources.featured from boolean to enum
CREATE TYPE resource_highlight_type AS ENUM ('featured', 'new', 'general');
ALTER TABLE resources ADD COLUMN highlight_type resource_highlight_type DEFAULT 'general';
UPDATE resources SET highlight_type = CASE WHEN featured = true THEN 'featured'::resource_highlight_type ELSE 'general'::resource_highlight_type END;
ALTER TABLE resources DROP COLUMN featured;

-- 3. Create job_locations junction table (many-to-many)
CREATE TABLE job_locations (
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  PRIMARY KEY (job_id, location_id)
);

ALTER TABLE job_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view job_locations" 
ON job_locations FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage job_locations" 
ON job_locations FOR ALL 
USING (auth.uid() = '240f1361-1f37-4cae-b12b-8fe51e789a76'::uuid);

-- Migrate existing location data
INSERT INTO job_locations (job_id, location_id)
SELECT id, location_id FROM jobs WHERE location_id IS NOT NULL;

-- Remove old location_id column
ALTER TABLE jobs DROP COLUMN location_id;

-- 4. Create featured_content table for carousel content
CREATE TABLE featured_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('job', 'poster_clickable', 'poster_static')),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  title text,
  image_url text,
  link_url text,
  display_location text NOT NULL CHECK (display_location IN ('home', 'job_detail')),
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE featured_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view featured_content" 
ON featured_content FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage featured_content" 
ON featured_content FOR ALL 
USING (auth.uid() = '240f1361-1f37-4cae-b12b-8fe51e789a76'::uuid);

-- 5. Add top_blog column to blogs table
ALTER TABLE blogs ADD COLUMN top_blog boolean DEFAULT false;
CREATE INDEX idx_blogs_top_blog ON blogs(top_blog) WHERE top_blog = true;