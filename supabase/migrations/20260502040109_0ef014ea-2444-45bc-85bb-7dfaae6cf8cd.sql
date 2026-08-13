-- Top pages by path (first-party)
CREATE OR REPLACE FUNCTION public.analytics_top_pages(
  p_from timestamp with time zone,
  p_to timestamp with time zone,
  p_limit integer DEFAULT 15
)
RETURNS TABLE(path text, views bigint, sessions bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT e.path, COUNT(*)::bigint, COUNT(DISTINCT e.session_id)::bigint
  FROM public.analytics_events e
  WHERE e.created_at >= p_from AND e.created_at < p_to
    AND e.event_type = 'page_view'
    AND e.path IS NOT NULL
  GROUP BY e.path
  ORDER BY COUNT(*) DESC
  LIMIT p_limit;
$function$;

-- Top referrers grouped by hostname (first-party)
CREATE OR REPLACE FUNCTION public.analytics_top_referrers(
  p_from timestamp with time zone,
  p_to timestamp with time zone,
  p_limit integer DEFAULT 10
)
RETURNS TABLE(referrer_host text, sessions bigint, page_views bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH normalized AS (
    SELECT
      e.session_id,
      e.event_type,
      CASE
        WHEN e.referrer IS NULL OR e.referrer = '' THEN '(direct)'
        ELSE COALESCE(
          NULLIF(regexp_replace(e.referrer, '^https?://([^/]+).*$', '\1'), ''),
          '(direct)'
        )
      END AS host
    FROM public.analytics_events e
    WHERE e.created_at >= p_from AND e.created_at < p_to
  )
  SELECT host,
         COUNT(DISTINCT session_id)::bigint,
         COUNT(*) FILTER (WHERE event_type = 'page_view')::bigint
  FROM normalized
  GROUP BY host
  ORDER BY COUNT(DISTINCT session_id) DESC
  LIMIT p_limit;
$function$;