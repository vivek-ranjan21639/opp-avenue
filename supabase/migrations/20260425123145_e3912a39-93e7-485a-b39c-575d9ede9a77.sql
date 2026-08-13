
-- 1) Make iso_code more flexible (allow 2-3 char codes like IND, USA)
ALTER TABLE public.j_countries ALTER COLUMN iso_code TYPE varchar(3);

-- 2) Add a single rich-text description column for jobs
ALTER TABLE public.j_jobs ADD COLUMN IF NOT EXISTS description text;

-- 3) Migrate existing structured fields into the new description (best-effort HTML)
UPDATE public.j_jobs
SET description = COALESCE(description, '') || 
  CASE WHEN jsonb_array_length(COALESCE(responsibilities, '[]'::jsonb)) > 0
    THEN '<h3>Responsibilities</h3><ul>' || (
      SELECT string_agg('<li>' || replace(value::text, '"', '') || '</li>', '')
      FROM jsonb_array_elements_text(responsibilities) AS value
    ) || '</ul>'
    ELSE '' END ||
  CASE WHEN jsonb_array_length(COALESCE(must_have, '[]'::jsonb)) > 0
    THEN '<h3>Must Have</h3><ul>' || (
      SELECT string_agg('<li>' || replace(value::text, '"', '') || '</li>', '')
      FROM jsonb_array_elements_text(must_have) AS value
    ) || '</ul>'
    ELSE '' END ||
  CASE WHEN jsonb_array_length(COALESCE(nice_to_have, '[]'::jsonb)) > 0
    THEN '<h3>Nice to Have</h3><ul>' || (
      SELECT string_agg('<li>' || replace(value::text, '"', '') || '</li>', '')
      FROM jsonb_array_elements_text(nice_to_have) AS value
    ) || '</ul>'
    ELSE '' END ||
  CASE WHEN jsonb_array_length(COALESCE(benefits, '[]'::jsonb)) > 0
    THEN '<h3>Benefits</h3><ul>' || (
      SELECT string_agg('<li>' || replace(value::text, '"', '') || '</li>', '')
      FROM jsonb_array_elements_text(benefits) AS value
    ) || '</ul>'
    ELSE '' END
WHERE (jsonb_array_length(COALESCE(responsibilities, '[]'::jsonb))
     + jsonb_array_length(COALESCE(must_have, '[]'::jsonb))
     + jsonb_array_length(COALESCE(nice_to_have, '[]'::jsonb))
     + jsonb_array_length(COALESCE(benefits, '[]'::jsonb))) > 0;

-- 4) Drop the now-redundant structured columns
ALTER TABLE public.j_jobs DROP COLUMN IF EXISTS responsibilities;
ALTER TABLE public.j_jobs DROP COLUMN IF EXISTS must_have;
ALTER TABLE public.j_jobs DROP COLUMN IF EXISTS nice_to_have;
ALTER TABLE public.j_jobs DROP COLUMN IF EXISTS benefits;
