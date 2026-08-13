import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";

/**
 * Fires page_view on every route change (excluding /admin).
 * Also fires scroll_depth events at 25/50/75/100% milestones once per page.
 */
export function usePageTracking() {
  const location = useLocation();
  const lastPath = useRef<string>("");

  useEffect(() => {
    const path = location.pathname + location.search;
    if (path === lastPath.current) return;
    lastPath.current = path;

    if (path.startsWith("/admin")) return;

    void trackEvent("page_view");

    // Reset & wire scroll-depth tracker
    const milestones = [25, 50, 75, 100];
    const fired = new Set<number>();

    const handler = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop;
      const max = (doc.scrollHeight - window.innerHeight) || 1;
      const pct = Math.min(100, Math.round((scrollTop / max) * 100));
      for (const m of milestones) {
        if (pct >= m && !fired.has(m)) {
          fired.add(m);
          void trackEvent("scroll_depth", { scroll_pct: m });
        }
      }
    };

    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [location.pathname, location.search]);
}
