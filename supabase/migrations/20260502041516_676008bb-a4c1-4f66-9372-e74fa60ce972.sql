-- ============= BLOG ANALYTICS =============

CREATE OR REPLACE FUNCTION public.analytics_blog_summary(p_from timestamptz, p_to timestamptz)
RETURNS TABLE(
  total_blog_views bigint,
  unique_blog_sessions bigint,
  unique_blogs_viewed bigint,
  avg_views_per_session numeric
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH bv AS (
    SELECT * FROM public.analytics_events
    WHERE event_type = 'blog_view' AND created_at >= p_from AND created_at < p_to
  )
  SELECT
    COUNT(*)::bigint,
    COUNT(DISTINCT session_id)::bigint,
    COUNT(DISTINCT entity_id)::bigint,
    CASE WHEN COUNT(DISTINCT session_id) > 0
      THEN ROUND(COUNT(*)::numeric / COUNT(DISTINCT session_id), 2)
      ELSE 0 END
  FROM bv;
$$;

CREATE OR REPLACE FUNCTION public.analytics_blog_daily(p_from timestamptz, p_to timestamptz)
RETURNS TABLE(day date, views bigint, sessions bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT (created_at AT TIME ZONE 'UTC')::date,
         COUNT(*)::bigint,
         COUNT(DISTINCT session_id)::bigint
  FROM public.analytics_events
  WHERE event_type = 'blog_view' AND created_at >= p_from AND created_at < p_to
  GROUP BY 1 ORDER BY 1;
$$;

CREATE OR REPLACE FUNCTION public.analytics_blog_top(p_from timestamptz, p_to timestamptz, p_limit int DEFAULT 15)
RETURNS TABLE(entity_id uuid, views bigint, sessions bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT entity_id,
         COUNT(*)::bigint,
         COUNT(DISTINCT session_id)::bigint
  FROM public.analytics_events
  WHERE event_type = 'blog_view'
    AND created_at >= p_from AND created_at < p_to
    AND entity_id IS NOT NULL
  GROUP BY entity_id
  ORDER BY COUNT(*) DESC
  LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.analytics_blog_referrers(p_from timestamptz, p_to timestamptz, p_limit int DEFAULT 10)
RETURNS TABLE(referrer_host text, sessions bigint, views bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH n AS (
    SELECT session_id,
           CASE WHEN referrer IS NULL OR referrer = '' THEN '(direct)'
                ELSE COALESCE(NULLIF(regexp_replace(referrer, '^https?://([^/]+).*$', '\1'), ''), '(direct)')
           END AS host
    FROM public.analytics_events
    WHERE event_type = 'blog_view' AND created_at >= p_from AND created_at < p_to
  )
  SELECT host, COUNT(DISTINCT session_id)::bigint, COUNT(*)::bigint
  FROM n GROUP BY host ORDER BY COUNT(*) DESC LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.analytics_blog_devices(p_from timestamptz, p_to timestamptz)
RETURNS TABLE(device text, sessions bigint, views bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT COALESCE(device, 'unknown'),
         COUNT(DISTINCT session_id)::bigint,
         COUNT(*)::bigint
  FROM public.analytics_events
  WHERE event_type = 'blog_view' AND created_at >= p_from AND created_at < p_to
  GROUP BY 1 ORDER BY 3 DESC;
$$;

-- ============= FEATURED CAROUSEL ANALYTICS =============

CREATE OR REPLACE FUNCTION public.analytics_featured_summary(p_from timestamptz, p_to timestamptz)
RETURNS TABLE(
  total_impressions bigint,
  total_clicks bigint,
  unique_items bigint,
  unique_sessions bigint,
  ctr numeric
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH e AS (
    SELECT * FROM public.analytics_events
    WHERE event_type IN ('featured_impression','featured_click')
      AND created_at >= p_from AND created_at < p_to
  )
  SELECT
    COUNT(*) FILTER (WHERE event_type = 'featured_impression')::bigint,
    COUNT(*) FILTER (WHERE event_type = 'featured_click')::bigint,
    COUNT(DISTINCT entity_id)::bigint,
    COUNT(DISTINCT session_id)::bigint,
    CASE WHEN COUNT(*) FILTER (WHERE event_type = 'featured_impression') > 0
      THEN ROUND(
        COUNT(*) FILTER (WHERE event_type = 'featured_click')::numeric
        / COUNT(*) FILTER (WHERE event_type = 'featured_impression'), 4)
      ELSE 0 END
  FROM e;
$$;

CREATE OR REPLACE FUNCTION public.analytics_featured_daily(p_from timestamptz, p_to timestamptz)
RETURNS TABLE(day date, impressions bigint, clicks bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT (created_at AT TIME ZONE 'UTC')::date,
         COUNT(*) FILTER (WHERE event_type = 'featured_impression')::bigint,
         COUNT(*) FILTER (WHERE event_type = 'featured_click')::bigint
  FROM public.analytics_events
  WHERE event_type IN ('featured_impression','featured_click')
    AND created_at >= p_from AND created_at < p_to
  GROUP BY 1 ORDER BY 1;
$$;

CREATE OR REPLACE FUNCTION public.analytics_featured_top(p_from timestamptz, p_to timestamptz, p_limit int DEFAULT 20)
RETURNS TABLE(
  entity_id uuid,
  title text,
  content_type text,
  display_location text,
  impressions bigint,
  clicks bigint,
  ctr numeric
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH agg AS (
    SELECT
      e.entity_id,
      COUNT(*) FILTER (WHERE event_type = 'featured_impression')::bigint AS imps,
      COUNT(*) FILTER (WHERE event_type = 'featured_click')::bigint AS clicks
    FROM public.analytics_events e
    WHERE event_type IN ('featured_impression','featured_click')
      AND created_at >= p_from AND created_at < p_to
      AND entity_id IS NOT NULL
    GROUP BY e.entity_id
  )
  SELECT
    a.entity_id,
    f.title,
    f.content_type::text,
    f.display_location::text,
    a.imps,
    a.clicks,
    CASE WHEN a.imps > 0 THEN ROUND(a.clicks::numeric / a.imps, 4) ELSE 0 END
  FROM agg a
  LEFT JOIN public.j_featured f ON f.id = a.entity_id
  ORDER BY (a.imps + a.clicks) DESC
  LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.analytics_featured_breakdown(p_from timestamptz, p_to timestamptz)
RETURNS TABLE(
  bucket text,
  group_key text,
  impressions bigint,
  clicks bigint,
  ctr numeric
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH e AS (
    SELECT event_type,
           COALESCE(metadata->>'content_type', 'unknown') AS content_type,
           COALESCE(metadata->>'display_location', 'unknown') AS display_location
    FROM public.analytics_events
    WHERE event_type IN ('featured_impression','featured_click')
      AND created_at >= p_from AND created_at < p_to
  ), by_ct AS (
    SELECT 'content_type'::text AS bucket, content_type AS group_key,
           COUNT(*) FILTER (WHERE event_type = 'featured_impression')::bigint AS imps,
           COUNT(*) FILTER (WHERE event_type = 'featured_click')::bigint AS clicks
    FROM e GROUP BY content_type
  ), by_loc AS (
    SELECT 'display_location'::text, display_location,
           COUNT(*) FILTER (WHERE event_type = 'featured_impression')::bigint,
           COUNT(*) FILTER (WHERE event_type = 'featured_click')::bigint
    FROM e GROUP BY display_location
  ), u AS (
    SELECT * FROM by_ct UNION ALL SELECT * FROM by_loc
  )
  SELECT bucket, group_key, imps, clicks,
         CASE WHEN imps > 0 THEN ROUND(clicks::numeric / imps, 4) ELSE 0 END
  FROM u
  ORDER BY bucket, imps DESC;
$$;