import { supabase } from "@/integrations/supabase/client";

export type DateRange = { from: Date; to: Date; label: string; ga4StartDate: string };

export const RANGES: DateRange[] = [
  { label: "7d", ga4StartDate: "7daysAgo", from: daysAgo(7), to: new Date() },
  { label: "28d", ga4StartDate: "28daysAgo", from: daysAgo(28), to: new Date() },
  { label: "90d", ga4StartDate: "90daysAgo", from: daysAgo(90), to: new Date() },
  { label: "6m", ga4StartDate: "180daysAgo", from: daysAgo(180), to: new Date() },
  { label: "1y", ga4StartDate: "365daysAgo", from: daysAgo(365), to: new Date() },
];

export const MAX_RANGE_DAYS = 365;

function daysAgo(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

const fromTo = (r: DateRange) => ({ p_from: r.from.toISOString(), p_to: r.to.toISOString() });

export async function fetchTopPages(r: DateRange, limit = 15) {
  const { data, error } = await supabase.rpc("analytics_top_pages", { ...fromTo(r), p_limit: limit });
  if (error) throw error;
  return (data ?? []) as { path: string; views: number; sessions: number }[];
}

export async function fetchTopReferrers(r: DateRange, limit = 10) {
  const { data, error } = await supabase.rpc("analytics_top_referrers", { ...fromTo(r), p_limit: limit });
  if (error) throw error;
  return (data ?? []) as { referrer_host: string; sessions: number; page_views: number }[];
}

export async function fetchSummary(r: DateRange) {
  const { data, error } = await supabase.rpc("analytics_summary", fromTo(r));
  if (error) throw error;
  return (data?.[0] ?? {}) as Record<string, number>;
}

export async function fetchDailySeries(r: DateRange) {
  const { data, error } = await supabase.rpc("analytics_daily_series", fromTo(r));
  if (error) throw error;
  return (data ?? []) as { day: string; event_type: string; count: number; sessions: number }[];
}

export async function fetchTopEntities(r: DateRange, eventType: string, limit = 10) {
  const { data, error } = await supabase.rpc("analytics_top_entities", {
    ...fromTo(r),
    p_event_type: eventType,
    p_limit: limit,
  });
  if (error) throw error;
  return (data ?? []) as { entity_id: string; entity_type: string; count: number }[];
}

export async function fetchTopSearches(r: DateRange, zeroOnly = false, limit = 15) {
  const { data, error } = await supabase.rpc("analytics_top_searches", {
    ...fromTo(r),
    p_zero_only: zeroOnly,
    p_limit: limit,
  });
  if (error) throw error;
  return (data ?? []) as { search_query: string; count: number; avg_result_count: number }[];
}

export async function fetchJobFunnel(r: DateRange) {
  const { data, error } = await supabase.rpc("analytics_job_funnel", fromTo(r));
  if (error) throw error;
  return (data?.[0] ?? {}) as {
    job_views: number;
    job_card_clicks: number;
    apply_clicks: number;
    unique_view_sessions: number;
    unique_apply_sessions: number;
  };
}

export async function fetchDeviceBreakdown(r: DateRange) {
  const { data, error } = await supabase.rpc("analytics_device_breakdown", fromTo(r));
  if (error) throw error;
  return (data ?? []) as { device: string; sessions_count: number; page_views: number }[];
}

export async function fetchScrollDistribution(r: DateRange) {
  const { data, error } = await supabase.rpc("analytics_scroll_distribution", fromTo(r));
  if (error) throw error;
  return (data ?? []) as { scroll_pct: number; count: number }[];
}

export async function fetchReturning(r: DateRange) {
  const { data, error } = await supabase.rpc("analytics_returning_sessions", fromTo(r));
  if (error) throw error;
  return (data?.[0] ?? { returning_sessions: 0, total_sessions: 0 }) as {
    returning_sessions: number;
    total_sessions: number;
  };
}

// Resolve entity titles in batch
export async function resolveJobTitles(ids: string[]) {
  if (!ids.length) return new Map<string, string>();
  const { data } = await supabase.from("j_jobs").select("id, title").in("id", ids);
  return new Map((data ?? []).map((r: any) => [r.id, r.title]));
}
export async function resolveBlogTitles(ids: string[]) {
  if (!ids.length) return new Map<string, string>();
  const { data } = await supabase.from("b_blogs").select("id, title").in("id", ids);
  return new Map((data ?? []).map((r: any) => [r.id, r.title]));
}
export async function resolveResourceTitles(ids: string[]) {
  if (!ids.length) return new Map<string, string>();
  const { data } = await supabase.from("r_resources").select("id, title").in("id", ids);
  return new Map((data ?? []).map((r: any) => [r.id, r.title]));
}

// ===================== BLOGS =====================
export async function fetchBlogSummary(r: DateRange) {
  const { data, error } = await supabase.rpc("analytics_blog_summary", fromTo(r));
  if (error) throw error;
  return (data?.[0] ?? {}) as {
    total_blog_views: number;
    unique_blog_sessions: number;
    unique_blogs_viewed: number;
    avg_views_per_session: number;
  };
}
export async function fetchBlogDaily(r: DateRange) {
  const { data, error } = await supabase.rpc("analytics_blog_daily", fromTo(r));
  if (error) throw error;
  return (data ?? []) as { day: string; views: number; sessions: number }[];
}
export async function fetchBlogTop(r: DateRange, limit = 15) {
  const { data, error } = await supabase.rpc("analytics_blog_top", { ...fromTo(r), p_limit: limit });
  if (error) throw error;
  return (data ?? []) as { entity_id: string; views: number; sessions: number }[];
}
export async function fetchBlogReferrers(r: DateRange, limit = 10) {
  const { data, error } = await supabase.rpc("analytics_blog_referrers", { ...fromTo(r), p_limit: limit });
  if (error) throw error;
  return (data ?? []) as { referrer_host: string; sessions: number; views: number }[];
}
export async function fetchBlogDevices(r: DateRange) {
  const { data, error } = await supabase.rpc("analytics_blog_devices", fromTo(r));
  if (error) throw error;
  return (data ?? []) as { device: string; sessions: number; views: number }[];
}

// ===================== FEATURED CAROUSEL =====================
export async function fetchFeaturedSummary(r: DateRange) {
  const { data, error } = await supabase.rpc("analytics_featured_summary", fromTo(r));
  if (error) throw error;
  return (data?.[0] ?? {}) as {
    total_impressions: number;
    total_clicks: number;
    unique_items: number;
    unique_sessions: number;
    ctr: number;
  };
}
export async function fetchFeaturedDaily(r: DateRange) {
  const { data, error } = await supabase.rpc("analytics_featured_daily", fromTo(r));
  if (error) throw error;
  return (data ?? []) as { day: string; impressions: number; clicks: number }[];
}
export async function fetchFeaturedTop(r: DateRange, limit = 20) {
  const { data, error } = await supabase.rpc("analytics_featured_top", { ...fromTo(r), p_limit: limit });
  if (error) throw error;
  return (data ?? []) as {
    entity_id: string;
    title: string | null;
    content_type: string;
    display_location: string;
    impressions: number;
    clicks: number;
    ctr: number;
  }[];
}
export async function fetchFeaturedBreakdown(r: DateRange) {
  const { data, error } = await supabase.rpc("analytics_featured_breakdown", fromTo(r));
  if (error) throw error;
  return (data ?? []) as {
    bucket: string;
    group_key: string;
    impressions: number;
    clicks: number;
    ctr: number;
  }[];
}
