
-- Fix search_path for all mutable functions

CREATE OR REPLACE FUNCTION public.set_company_human_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE max_id INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SPLIT_PART(human_id,'-',2) AS INT)),0) + 1 INTO max_id FROM companies;
  NEW.human_id := 'COMP-' || LPAD(max_id::TEXT,5,'0');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_location_human_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE max_id INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SPLIT_PART(human_id,'-',2) AS INT)),0) + 1 INTO max_id FROM locations;
  NEW.human_id := 'LOC-' || LPAD(max_id::TEXT,5,'0');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_skill_human_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE max_id INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SPLIT_PART(human_id,'-',2) AS INT)),0) + 1 INTO max_id FROM skills;
  NEW.human_id := 'SKL-' || LPAD(max_id::TEXT,5,'0');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_benefit_human_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE max_id INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SPLIT_PART(human_id,'-',2) AS INT)),0) + 1 INTO max_id FROM benefits;
  NEW.human_id := 'BEN-' || LPAD(max_id::TEXT,5,'0');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_job_human_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE max_id INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SPLIT_PART(human_id,'-',2) AS INT)),0) + 1 INTO max_id FROM jobs;
  NEW.human_id := 'JOB-' || LPAD(max_id::TEXT,5,'0');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_domain_human_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE max_id INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SPLIT_PART(human_id,'-',2) AS INT)),0) + 1 INTO max_id FROM domains;
  NEW.human_id := 'DOM-' || LPAD(max_id::TEXT,5,'0');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_recommended_jobs(p_job_id uuid, p_limit integer DEFAULT 15)
RETURNS TABLE(job_id uuid, title text, company_id uuid, company_name text, company_logo text, company_sector text, salary_min numeric, salary_max numeric, currency text, job_type text, work_mode text, created_at timestamp without time zone, relevance_score numeric)
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  v_title TEXT;
  v_search_query tsquery;
  v_salary_min NUMERIC;
  v_salary_max NUMERIC;
  v_min_exp INT;
  v_work_mode TEXT;
BEGIN
  SELECT j.title, j.salary_min, j.salary_max, j.work_mode::TEXT, ec.min_experience
  INTO v_title, v_salary_min, v_salary_max, v_work_mode, v_min_exp
  FROM jobs j LEFT JOIN eligibility_criteria ec ON j.id = ec.job_id
  WHERE j.id = p_job_id;
  
  v_search_query := plainto_tsquery('english', v_title);
  
  RETURN QUERY
  WITH current_domains AS (SELECT domain_id FROM job_domains WHERE job_id = p_job_id),
  current_skills AS (SELECT skill_id FROM job_skills WHERE job_id = p_job_id),
  current_locations AS (SELECT location_id FROM job_locations WHERE job_id = p_job_id),
  initial_candidates AS (
    SELECT j.id, j.title, j.company_id, c.name as comp_name, c.logo_url as comp_logo, c.sector as comp_sector,
      j.salary_min as sal_min, j.salary_max as sal_max, j.currency::TEXT as curr, j.job_type::TEXT as jtype,
      j.work_mode::TEXT as wmode, j.created_at as job_created_at,
      COALESCE(ts_rank(j.search_vector, v_search_query), 0) * 0.30 AS title_score,
      COALESCE((SELECT COUNT(*)::NUMERIC FROM job_domains jd WHERE jd.job_id = j.id AND jd.domain_id IN (SELECT domain_id FROM current_domains))
        / NULLIF((SELECT COUNT(DISTINCT domain_id)::NUMERIC FROM job_domains WHERE job_id IN (j.id, p_job_id)), 0), 0) * 0.25 AS domain_score,
      COALESCE((SELECT COUNT(*)::NUMERIC FROM job_skills js WHERE js.job_id = j.id AND js.skill_id IN (SELECT skill_id FROM current_skills))
        / NULLIF((SELECT COUNT(DISTINCT skill_id)::NUMERIC FROM job_skills WHERE job_id IN (j.id, p_job_id)), 0), 0) * 0.25 AS skills_score,
      CASE WHEN v_salary_min IS NULL OR j.salary_min IS NULL THEN 0.05
        ELSE (1 - LEAST(ABS(COALESCE((j.salary_min + j.salary_max)/2, 0) - COALESCE((v_salary_min + v_salary_max)/2, 0)) / 10000000, 1)) * 0.10 END AS salary_score,
      CASE WHEN v_min_exp IS NULL THEN 0.05
        ELSE (1 - LEAST(ABS(COALESCE(ec.min_experience, 0) - COALESCE(v_min_exp, 0))::NUMERIC / 10, 1)) * 0.10 END AS exp_score
    FROM jobs j LEFT JOIN companies c ON j.company_id = c.id LEFT JOIN eligibility_criteria ec ON j.id = ec.job_id
    WHERE j.id != p_job_id AND j.deleted_at IS NULL AND (j.deadline IS NULL OR j.deadline >= CURRENT_DATE)
    ORDER BY (COALESCE(ts_rank(j.search_vector, v_search_query), 0) * 0.30 +
      COALESCE((SELECT COUNT(*)::NUMERIC FROM job_domains jd WHERE jd.job_id = j.id AND jd.domain_id IN (SELECT domain_id FROM current_domains))
        / NULLIF((SELECT COUNT(DISTINCT domain_id)::NUMERIC FROM job_domains WHERE job_id IN (j.id, p_job_id)), 0), 0) * 0.25 +
      COALESCE((SELECT COUNT(*)::NUMERIC FROM job_skills js WHERE js.job_id = j.id AND js.skill_id IN (SELECT skill_id FROM current_skills))
        / NULLIF((SELECT COUNT(DISTINCT skill_id)::NUMERIC FROM job_skills WHERE job_id IN (j.id, p_job_id)), 0), 0) * 0.25) DESC
    LIMIT 30
  ),
  reranked AS (
    SELECT ic.*,
      (ic.title_score + ic.domain_score + ic.skills_score + ic.salary_score + ic.exp_score) AS base_score,
      CASE WHEN ic.job_created_at > (CURRENT_TIMESTAMP - INTERVAL '7 days') THEN 0.05
        WHEN ic.job_created_at > (CURRENT_TIMESTAMP - INTERVAL '14 days') THEN 0.03 ELSE 0 END AS recency_boost,
      CASE WHEN ic.wmode = v_work_mode THEN 0.05 ELSE 0 END AS work_mode_boost,
      COALESCE((SELECT COUNT(*)::NUMERIC FROM job_locations jl WHERE jl.job_id = ic.id AND jl.location_id IN (SELECT location_id FROM current_locations))
        / NULLIF((SELECT COUNT(*)::NUMERIC FROM current_locations), 0), 0) * 0.05 AS location_boost,
      ROW_NUMBER() OVER (PARTITION BY ic.company_id ORDER BY (ic.title_score + ic.domain_score + ic.skills_score + ic.salary_score + ic.exp_score) DESC) AS company_rank
    FROM initial_candidates ic
  )
  SELECT r.id, r.title, r.company_id, r.comp_name, r.comp_logo, r.comp_sector, r.sal_min, r.sal_max, r.curr, r.jtype, r.wmode, r.job_created_at,
    (r.base_score + r.recency_boost + r.work_mode_boost + r.location_boost) AS final_score
  FROM reranked r WHERE r.company_rank <= 2
  ORDER BY (r.base_score + r.recency_boost + r.work_mode_boost + r.location_boost) DESC
  LIMIT p_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_jobs_search_vector()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE((SELECT string_agg(s.name, ' ') FROM job_skills js JOIN skills s ON js.skill_id = s.id WHERE js.job_id = NEW.id), '')), 'C') ||
    setweight(to_tsvector('english', COALESCE((SELECT string_agg(b.name, ' ') FROM job_benefits jb JOIN benefits b ON jb.benefit_id = b.id WHERE jb.job_id = NEW.id), '')), 'D');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_read_time(content text)
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  clean_text TEXT;
  word_count INTEGER;
BEGIN
  IF content IS NULL OR content = '' THEN RETURN 1; END IF;
  clean_text := regexp_replace(content, '<[^>]*>', '', 'g');
  word_count := array_length(regexp_split_to_array(trim(clean_text), '\s+'), 1);
  IF word_count IS NULL OR word_count = 0 THEN RETURN 1; END IF;
  RETURN GREATEST(1, CEIL(word_count::NUMERIC / 200));
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_blog_read_time()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.read_time_minutes := public.calculate_read_time(NEW.content);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_expired_jobs()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  DELETE FROM jobs WHERE deleted_at IS NULL AND deadline IS NOT NULL AND deadline < CURRENT_DATE - INTERVAL '1 day';
  DELETE FROM jobs WHERE deleted_at IS NULL AND deadline IS NULL AND created_at < (CURRENT_DATE - INTERVAL '30 days');
  DELETE FROM jobs WHERE deleted_at IS NOT NULL;
END;
$function$;
