CREATE OR REPLACE FUNCTION public.analytics_top_entities(
  p_from timestamptz, p_to timestamptz, p_event_type text, p_limit int DEFAULT 10
)
RETURNS TABLE(entity_id uuid, entity_type text, count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT e.entity_id, e.entity_type, COUNT(*)::bigint
  FROM public.analytics_events e
  WHERE e.created_at >= p_from AND e.created_at < p_to
    AND e.event_type = p_event_type::public.analytics_event_type
    AND e.entity_id IS NOT NULL
  GROUP BY e.entity_id, e.entity_type
  ORDER BY COUNT(*) DESC
  LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.analytics_top_searches(
  p_from timestamptz, p_to timestamptz, p_zero_only boolean DEFAULT false, p_limit int DEFAULT 15
)
RETURNS TABLE(search_query text, count bigint, avg_result_count numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT lower(trim(e.search_query)), COUNT(*)::bigint, AVG(COALESCE(e.result_count,0))::numeric
  FROM public.analytics_events e
  WHERE e.created_at >= p_from AND e.created_at < p_to
    AND e.event_type = CASE WHEN p_zero_only THEN 'search_zero_result' ELSE 'search' END::public.analytics_event_type
    AND e.search_query IS NOT NULL AND length(trim(e.search_query)) > 0
  GROUP BY lower(trim(e.search_query))
  ORDER BY COUNT(*) DESC
  LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.analytics_daily_series(
  p_from timestamptz, p_to timestamptz
)
RETURNS TABLE(day date, event_type text, count bigint, sessions bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (e.created_at AT TIME ZONE 'UTC')::date, e.event_type::text,
         COUNT(*)::bigint, COUNT(DISTINCT e.session_id)::bigint
  FROM public.analytics_events e
  WHERE e.created_at >= p_from AND e.created_at < p_to
  GROUP BY 1, 2
  ORDER BY 1, 2;
$$;

CREATE OR REPLACE FUNCTION public.analytics_job_funnel(
  p_from timestamptz, p_to timestamptz
)
RETURNS TABLE(job_views bigint, job_card_clicks bigint, apply_clicks bigint,
              unique_view_sessions bigint, unique_apply_sessions bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    COUNT(*) FILTER (WHERE e.event_type = 'job_view'),
    COUNT(*) FILTER (WHERE e.event_type = 'job_card_click'),
    COUNT(*) FILTER (WHERE e.event_type IN ('apply_click','apply_email_click')),
    COUNT(DISTINCT e.session_id) FILTER (WHERE e.event_type = 'job_view'),
    COUNT(DISTINCT e.session_id) FILTER (WHERE e.event_type IN ('apply_click','apply_email_click'))
  FROM public.analytics_events e
  WHERE e.created_at >= p_from AND e.created_at < p_to;
$$;

CREATE OR REPLACE FUNCTION public.analytics_device_breakdown(
  p_from timestamptz, p_to timestamptz
)
RETURNS TABLE(device text, sessions_count bigint, page_views bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(e.device,'unknown'),
         COUNT(DISTINCT e.session_id)::bigint,
         COUNT(*) FILTER (WHERE e.event_type = 'page_view')::bigint
  FROM public.analytics_events e
  WHERE e.created_at >= p_from AND e.created_at < p_to
  GROUP BY COALESCE(e.device,'unknown')
  ORDER BY COUNT(DISTINCT e.session_id) DESC;
$$;

CREATE OR REPLACE FUNCTION public.analytics_scroll_distribution(
  p_from timestamptz, p_to timestamptz
)
RETURNS TABLE(scroll_pct int, count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT e.scroll_pct, COUNT(*)::bigint
  FROM public.analytics_events e
  WHERE e.created_at >= p_from AND e.created_at < p_to
    AND e.event_type = 'scroll_depth' AND e.scroll_pct IS NOT NULL
  GROUP BY e.scroll_pct
  ORDER BY e.scroll_pct;
$$;

CREATE OR REPLACE FUNCTION public.analytics_returning_sessions(
  p_from timestamptz, p_to timestamptz
)
RETURNS TABLE(returning_sessions bigint, total_sessions bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH per_session AS (
    SELECT e.session_id, COUNT(DISTINCT (e.created_at AT TIME ZONE 'UTC')::date) AS day_count
    FROM public.analytics_events e
    WHERE e.created_at >= p_from AND e.created_at < p_to
    GROUP BY e.session_id
  )
  SELECT COUNT(*) FILTER (WHERE day_count > 1)::bigint, COUNT(*)::bigint
  FROM per_session;
$$;

REVOKE ALL ON FUNCTION public.analytics_top_entities(timestamptz, timestamptz, text, int) FROM public, anon;
REVOKE ALL ON FUNCTION public.analytics_top_searches(timestamptz, timestamptz, boolean, int) FROM public, anon;
REVOKE ALL ON FUNCTION public.analytics_daily_series(timestamptz, timestamptz) FROM public, anon;
REVOKE ALL ON FUNCTION public.analytics_job_funnel(timestamptz, timestamptz) FROM public, anon;
REVOKE ALL ON FUNCTION public.analytics_device_breakdown(timestamptz, timestamptz) FROM public, anon;
REVOKE ALL ON FUNCTION public.analytics_scroll_distribution(timestamptz, timestamptz) FROM public, anon;
REVOKE ALL ON FUNCTION public.analytics_returning_sessions(timestamptz, timestamptz) FROM public, anon;

GRANT EXECUTE ON FUNCTION public.analytics_top_entities(timestamptz, timestamptz, text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_top_searches(timestamptz, timestamptz, boolean, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_daily_series(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_job_funnel(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_device_breakdown(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_scroll_distribution(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_returning_sessions(timestamptz, timestamptz) TO authenticated;