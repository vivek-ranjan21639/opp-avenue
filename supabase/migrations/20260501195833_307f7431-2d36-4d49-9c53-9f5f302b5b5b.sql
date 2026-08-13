-- ============================================================
-- Self-hosted analytics event tracking (anonymous visitors)
-- ============================================================

-- 1) Event-type enum
CREATE TYPE public.analytics_event_type AS ENUM (
  'page_view',
  'job_view',
  'job_card_click',
  'apply_click',
  'apply_email_click',
  'search',
  'search_zero_result',
  'filter_apply',
  'filter_clear',
  'scroll_depth',
  'blog_view',
  'resource_view',
  'resource_download',
  'outbound_click'
);

-- 2) Events table — append-only, anonymous
CREATE TABLE public.analytics_events (
  id bigserial PRIMARY KEY,
  event_type public.analytics_event_type NOT NULL,
  session_id text NOT NULL,
  path text,
  referrer text,
  device text,                   -- 'mobile' | 'tablet' | 'desktop'
  entity_type text,              -- 'job' | 'blog' | 'resource' | null
  entity_id uuid,
  search_query text,
  result_count integer,
  scroll_pct integer,            -- 25/50/75/100
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_type_created ON public.analytics_events(event_type, created_at DESC);
CREATE INDEX idx_analytics_events_entity ON public.analytics_events(entity_type, entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX idx_analytics_events_session ON public.analytics_events(session_id, created_at);
CREATE INDEX idx_analytics_events_search ON public.analytics_events(search_query) WHERE search_query IS NOT NULL;

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- No direct INSERT for anyone — all writes go through log_event() RPC.
-- Read access: only super admins or editors with 'analytics' module access.
CREATE POLICY "Admins read analytics events"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (
  public.is_super_admin()
  OR public.has_module_access(auth.uid(), 'analytics')
);

-- 3) Public RPC for event logging — validates input, accepts anon callers.
CREATE OR REPLACE FUNCTION public.log_event(
  p_event_type text,
  p_session_id text,
  p_path text DEFAULT NULL,
  p_referrer text DEFAULT NULL,
  p_device text DEFAULT NULL,
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL,
  p_search_query text DEFAULT NULL,
  p_result_count integer DEFAULT NULL,
  p_scroll_pct integer DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type public.analytics_event_type;
BEGIN
  -- Validate event type
  BEGIN
    v_type := p_event_type::public.analytics_event_type;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN;  -- silently drop invalid types
  END;

  -- Basic sanity limits to prevent abuse / huge payloads
  IF p_session_id IS NULL OR length(p_session_id) > 64 THEN RETURN; END IF;
  IF p_path IS NOT NULL AND length(p_path) > 512 THEN p_path := left(p_path, 512); END IF;
  IF p_referrer IS NOT NULL AND length(p_referrer) > 512 THEN p_referrer := left(p_referrer, 512); END IF;
  IF p_search_query IS NOT NULL AND length(p_search_query) > 256 THEN p_search_query := left(p_search_query, 256); END IF;
  IF p_device IS NOT NULL AND p_device NOT IN ('mobile','tablet','desktop') THEN p_device := NULL; END IF;
  IF p_scroll_pct IS NOT NULL AND (p_scroll_pct < 0 OR p_scroll_pct > 100) THEN p_scroll_pct := NULL; END IF;
  IF p_metadata IS NULL OR pg_column_size(p_metadata) > 4096 THEN p_metadata := '{}'::jsonb; END IF;

  INSERT INTO public.analytics_events (
    event_type, session_id, path, referrer, device,
    entity_type, entity_id, search_query, result_count, scroll_pct, metadata
  ) VALUES (
    v_type, p_session_id, p_path, p_referrer, p_device,
    p_entity_type, p_entity_id, p_search_query, p_result_count, p_scroll_pct, p_metadata
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_event(text, text, text, text, text, text, uuid, text, integer, integer, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_event(text, text, text, text, text, text, uuid, text, integer, integer, jsonb) TO anon, authenticated;

-- 4) Aggregate helpers used by the dashboard (admin-only via RLS in source tables)
CREATE OR REPLACE FUNCTION public.analytics_summary(p_from timestamptz, p_to timestamptz)
RETURNS TABLE (
  total_sessions bigint,
  total_page_views bigint,
  total_job_views bigint,
  total_apply_clicks bigint,
  total_searches bigint,
  total_zero_result_searches bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(DISTINCT session_id) FILTER (WHERE created_at >= p_from AND created_at < p_to),
    COUNT(*) FILTER (WHERE event_type = 'page_view' AND created_at >= p_from AND created_at < p_to),
    COUNT(*) FILTER (WHERE event_type = 'job_view' AND created_at >= p_from AND created_at < p_to),
    COUNT(*) FILTER (WHERE event_type IN ('apply_click','apply_email_click') AND created_at >= p_from AND created_at < p_to),
    COUNT(*) FILTER (WHERE event_type = 'search' AND created_at >= p_from AND created_at < p_to),
    COUNT(*) FILTER (WHERE event_type = 'search_zero_result' AND created_at >= p_from AND created_at < p_to)
  FROM public.analytics_events
  WHERE created_at >= p_from AND created_at < p_to;
$$;

REVOKE EXECUTE ON FUNCTION public.analytics_summary(timestamptz, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.analytics_summary(timestamptz, timestamptz) TO authenticated;
