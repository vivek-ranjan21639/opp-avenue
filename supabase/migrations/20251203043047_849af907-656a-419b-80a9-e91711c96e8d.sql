-- Update the delete_expired_jobs function to soft-delete jobs 1 day after deadline
CREATE OR REPLACE FUNCTION public.delete_expired_jobs()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Soft delete jobs where deadline has passed by at least 1 day
    UPDATE jobs 
    SET deleted_at = now()
    WHERE deleted_at IS NULL 
      AND deadline IS NOT NULL 
      AND deadline < CURRENT_DATE - INTERVAL '1 day';

    -- Soft delete jobs without deadline that are older than 30 days
    UPDATE jobs 
    SET deleted_at = now()
    WHERE deleted_at IS NULL
      AND deadline IS NULL 
      AND created_at < (CURRENT_DATE - INTERVAL '30 days');
END;
$$;

-- Create the two-stage job recommendation function
CREATE OR REPLACE FUNCTION public.get_recommended_jobs(
  p_job_id UUID,
  p_limit INT DEFAULT 15
)
RETURNS TABLE (
  job_id UUID,
  title TEXT,
  company_id UUID,
  company_name TEXT,
  company_logo TEXT,
  company_sector TEXT,
  salary_min NUMERIC,
  salary_max NUMERIC,
  currency TEXT,
  job_type TEXT,
  work_mode TEXT,
  created_at TIMESTAMP,
  relevance_score NUMERIC
) AS $$
DECLARE
  v_title TEXT;
  v_search_query tsquery;
  v_salary_min NUMERIC;
  v_salary_max NUMERIC;
  v_min_exp INT;
  v_work_mode TEXT;
BEGIN
  -- Get current job details
  SELECT j.title, j.salary_min, j.salary_max, j.work_mode::TEXT,
         ec.min_experience
  INTO v_title, v_salary_min, v_salary_max, v_work_mode, v_min_exp
  FROM jobs j
  LEFT JOIN eligibility_criteria ec ON j.id = ec.job_id
  WHERE j.id = p_job_id;
  
  -- Create search query from title
  v_search_query := plainto_tsquery('english', v_title);
  
  RETURN QUERY
  WITH current_domains AS (
    SELECT domain_id FROM job_domains WHERE job_id = p_job_id
  ),
  current_skills AS (
    SELECT skill_id FROM job_skills WHERE job_id = p_job_id
  ),
  current_locations AS (
    SELECT location_id FROM job_locations WHERE job_id = p_job_id
  ),
  -- Stage 1: Initial retrieval of 30 candidates with base scoring
  initial_candidates AS (
    SELECT 
      j.id,
      j.title,
      j.company_id,
      c.name as comp_name,
      c.logo_url as comp_logo,
      c.sector as comp_sector,
      j.salary_min as sal_min,
      j.salary_max as sal_max,
      j.currency::TEXT as curr,
      j.job_type::TEXT as jtype,
      j.work_mode::TEXT as wmode,
      j.created_at as job_created_at,
      -- Title similarity score (30%)
      COALESCE(ts_rank(j.search_vector, v_search_query), 0) * 0.30 AS title_score,
      -- Domain match score (25%)
      COALESCE(
        (SELECT COUNT(*)::NUMERIC FROM job_domains jd 
         WHERE jd.job_id = j.id AND jd.domain_id IN (SELECT domain_id FROM current_domains))
        / NULLIF(
          (SELECT COUNT(DISTINCT domain_id)::NUMERIC FROM job_domains 
           WHERE job_id IN (j.id, p_job_id)), 0
        ), 0
      ) * 0.25 AS domain_score,
      -- Skills match score (25%)
      COALESCE(
        (SELECT COUNT(*)::NUMERIC FROM job_skills js 
         WHERE js.job_id = j.id AND js.skill_id IN (SELECT skill_id FROM current_skills))
        / NULLIF(
          (SELECT COUNT(DISTINCT skill_id)::NUMERIC FROM job_skills 
           WHERE job_id IN (j.id, p_job_id)), 0
        ), 0
      ) * 0.25 AS skills_score,
      -- Salary proximity score (10%)
      CASE 
        WHEN v_salary_min IS NULL OR j.salary_min IS NULL THEN 0.05
        ELSE (1 - LEAST(ABS(COALESCE((j.salary_min + j.salary_max)/2, 0) - COALESCE((v_salary_min + v_salary_max)/2, 0)) / 10000000, 1)) * 0.10
      END AS salary_score,
      -- Experience proximity score (10%)
      CASE 
        WHEN v_min_exp IS NULL THEN 0.05
        ELSE (1 - LEAST(ABS(COALESCE(ec.min_experience, 0) - COALESCE(v_min_exp, 0))::NUMERIC / 10, 1)) * 0.10
      END AS exp_score
    FROM jobs j
    LEFT JOIN companies c ON j.company_id = c.id
    LEFT JOIN eligibility_criteria ec ON j.id = ec.job_id
    WHERE j.id != p_job_id
      AND j.deleted_at IS NULL
      AND (j.deadline IS NULL OR j.deadline >= CURRENT_DATE)
    ORDER BY (
      COALESCE(ts_rank(j.search_vector, v_search_query), 0) * 0.30 +
      COALESCE(
        (SELECT COUNT(*)::NUMERIC FROM job_domains jd 
         WHERE jd.job_id = j.id AND jd.domain_id IN (SELECT domain_id FROM current_domains))
        / NULLIF(
          (SELECT COUNT(DISTINCT domain_id)::NUMERIC FROM job_domains 
           WHERE job_id IN (j.id, p_job_id)), 0
        ), 0
      ) * 0.25 +
      COALESCE(
        (SELECT COUNT(*)::NUMERIC FROM job_skills js 
         WHERE js.job_id = j.id AND js.skill_id IN (SELECT skill_id FROM current_skills))
        / NULLIF(
          (SELECT COUNT(DISTINCT skill_id)::NUMERIC FROM job_skills 
           WHERE job_id IN (j.id, p_job_id)), 0
        ), 0
      ) * 0.25
    ) DESC
    LIMIT 30
  ),
  -- Stage 2: Reranking with additional boosts
  reranked AS (
    SELECT 
      ic.*,
      (ic.title_score + ic.domain_score + ic.skills_score + ic.salary_score + ic.exp_score) AS base_score,
      -- Recency boost: +5% for jobs < 7 days, +3% for < 14 days
      CASE 
        WHEN ic.job_created_at > (CURRENT_TIMESTAMP - INTERVAL '7 days') THEN 0.05
        WHEN ic.job_created_at > (CURRENT_TIMESTAMP - INTERVAL '14 days') THEN 0.03
        ELSE 0
      END AS recency_boost,
      -- Work mode match boost: +5%
      CASE 
        WHEN ic.wmode = v_work_mode THEN 0.05
        ELSE 0
      END AS work_mode_boost,
      -- Location overlap boost: +5% scaled
      COALESCE(
        (SELECT COUNT(*)::NUMERIC FROM job_locations jl 
         WHERE jl.job_id = ic.id AND jl.location_id IN (SELECT location_id FROM current_locations))
        / NULLIF((SELECT COUNT(*)::NUMERIC FROM current_locations), 0), 0
      ) * 0.05 AS location_boost,
      -- Company diversity: rank within company
      ROW_NUMBER() OVER (PARTITION BY ic.company_id ORDER BY (ic.title_score + ic.domain_score + ic.skills_score + ic.salary_score + ic.exp_score) DESC) AS company_rank
    FROM initial_candidates ic
  )
  SELECT 
    r.id,
    r.title,
    r.company_id,
    r.comp_name,
    r.comp_logo,
    r.comp_sector,
    r.sal_min,
    r.sal_max,
    r.curr,
    r.jtype,
    r.wmode,
    r.job_created_at,
    (r.base_score + r.recency_boost + r.work_mode_boost + r.location_boost) AS final_score
  FROM reranked r
  WHERE r.company_rank <= 2  -- Max 2 jobs per company
  ORDER BY (r.base_score + r.recency_boost + r.work_mode_boost + r.location_boost) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;