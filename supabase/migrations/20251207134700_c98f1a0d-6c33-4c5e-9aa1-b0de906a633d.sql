-- Create function to calculate read time from content (200 words per minute)
CREATE OR REPLACE FUNCTION public.calculate_read_time(content TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  clean_text TEXT;
  word_count INTEGER;
BEGIN
  IF content IS NULL OR content = '' THEN
    RETURN 1;
  END IF;
  
  -- Remove HTML tags
  clean_text := regexp_replace(content, '<[^>]*>', '', 'g');
  
  -- Count words by splitting on whitespace
  word_count := array_length(regexp_split_to_array(trim(clean_text), '\s+'), 1);
  
  IF word_count IS NULL OR word_count = 0 THEN
    RETURN 1;
  END IF;
  
  -- Calculate read time (200 words per minute, minimum 1 minute)
  RETURN GREATEST(1, CEIL(word_count::NUMERIC / 200));
END;
$$;

-- Create trigger function to auto-update read_time_minutes
CREATE OR REPLACE FUNCTION public.update_blog_read_time()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.read_time_minutes := public.calculate_read_time(NEW.content);
  RETURN NEW;
END;
$$;

-- Create trigger to run on insert or update of blogs
DROP TRIGGER IF EXISTS trigger_update_blog_read_time ON public.blogs;
CREATE TRIGGER trigger_update_blog_read_time
  BEFORE INSERT OR UPDATE OF content ON public.blogs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_blog_read_time();

-- Update existing blogs to calculate their read times
UPDATE public.blogs
SET read_time_minutes = public.calculate_read_time(content)
WHERE read_time_minutes IS NULL;