import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "oa_sid";
const SESSION_TS_KEY = "oa_sid_ts";
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 min idle window

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getSessionId(): string {
  try {
    const now = Date.now();
    const last = Number(sessionStorage.getItem(SESSION_TS_KEY) || 0);
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid || (last && now - last > SESSION_TTL_MS)) {
      sid = uuid();
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    sessionStorage.setItem(SESSION_TS_KEY, String(now));
    return sid;
  } catch {
    return "no-session";
  }
}

function getDevice(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < 640) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

export type TrackPayload = {
  entity_type?: "job" | "blog" | "resource" | null;
  entity_id?: string | null;
  search_query?: string | null;
  result_count?: number | null;
  scroll_pct?: number | null;
  metadata?: Record<string, unknown>;
};

export type EventName =
  | "page_view"
  | "job_view"
  | "job_card_click"
  | "apply_click"
  | "apply_email_click"
  | "search"
  | "search_zero_result"
  | "filter_apply"
  | "filter_clear"
  | "scroll_depth"
  | "blog_view"
  | "resource_view"
  | "resource_download"
  | "outbound_click"
  | "featured_impression"
  | "featured_click";

// Lightweight client-side dedupe so a single render burst doesn't spam events.
const recentEvents = new Map<string, number>();
const DEDUPE_WINDOW_MS = 1500;

function shouldSkip(key: string): boolean {
  const now = Date.now();
  const last = recentEvents.get(key);
  if (last && now - last < DEDUPE_WINDOW_MS) return true;
  recentEvents.set(key, now);
  // GC old entries
  if (recentEvents.size > 200) {
    for (const [k, t] of recentEvents) {
      if (now - t > 10_000) recentEvents.delete(k);
    }
  }
  return false;
}

export async function trackEvent(event: EventName, payload: TrackPayload = {}): Promise<void> {
  // Disable tracking inside the admin portal to avoid skewing metrics.
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
    return;
  }

  const dedupeKey = [
    event,
    payload.entity_id ?? "",
    payload.search_query ?? "",
    payload.scroll_pct ?? "",
    payload.metadata?.["filter_key"] ?? "",
  ].join("|");
  if (shouldSkip(dedupeKey)) return;

  try {
    await supabase.rpc("log_event", {
      p_event_type: event,
      p_session_id: getSessionId(),
      p_path: typeof window !== "undefined" ? window.location.pathname + window.location.search : null,
      p_referrer: typeof document !== "undefined" ? document.referrer || null : null,
      p_device: getDevice(),
      p_entity_type: payload.entity_type ?? null,
      p_entity_id: payload.entity_id ?? null,
      p_search_query: payload.search_query ?? null,
      p_result_count: payload.result_count ?? null,
      p_scroll_pct: payload.scroll_pct ?? null,
      p_metadata: (payload.metadata ?? {}) as never,
    });
  } catch {
    // Never let analytics failures break the UI.
  }
}
