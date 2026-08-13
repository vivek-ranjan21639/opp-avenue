-- Update the content_type enum to support poster_job_link
-- First, let's update existing job type items to poster_job_link with placeholder image
UPDATE featured_content 
SET content_type = 'poster_static',
    image_url = COALESCE(image_url, 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400')
WHERE content_type = 'job';

-- Add comment for documentation
COMMENT ON TABLE featured_content IS 'Featured carousel content. content_type: poster_static (non-clickable image), poster_clickable (links to external URL via link_url), poster_job_link (links to job detail via job_id)';