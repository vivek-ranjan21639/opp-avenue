import { useEffect, useMemo, useState } from "react";
import { BarChart3, RefreshCw, CalendarIcon } from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { DateRange as DayPickerRange } from "react-day-picker";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  RANGES,
  MAX_RANGE_DAYS,
  type DateRange,
  fetchSummary,
  fetchDailySeries,
  fetchTopEntities,
  fetchTopSearches,
  fetchJobFunnel,
  fetchDeviceBreakdown,
  fetchScrollDistribution,
  fetchReturning,
  fetchTopPages,
  fetchTopReferrers,
  resolveJobTitles,
  resolveBlogTitles,
  resolveResourceTitles,
  fetchBlogSummary,
  fetchBlogDaily,
  fetchBlogTop,
  fetchBlogReferrers,
  fetchBlogDevices,
  fetchFeaturedSummary,
  fetchFeaturedDaily,
  fetchFeaturedTop,
  fetchFeaturedBreakdown,
} from "@/lib/analyticsApi";
import {
  Kpi,
  ChartCard,
  EmptyState,
  SimpleTable,
  fmt,
  fmtPct,
} from "@/components/admin/analytics/AnalyticsPrimitives";

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--secondary))",
];

export default function AdminAnalytics() {
  const [rangeIdx, setRangeIdx] = useState<number | "custom">(1); // 28d
  const [customRange, setCustomRange] = useState<DayPickerRange | undefined>(undefined);
  const [pickerOpen, setPickerOpen] = useState(false);

  const range: DateRange = useMemo(() => {
    if (rangeIdx === "custom" && customRange?.from && customRange?.to) {
      const to = new Date(customRange.to);
      to.setUTCHours(23, 59, 59, 999);
      const from = new Date(customRange.from);
      from.setUTCHours(0, 0, 0, 0);
      return { label: "custom", ga4StartDate: "", from, to };
    }
    const idx = typeof rangeIdx === "number" ? rangeIdx : 1;
    const r = RANGES[idx];
    return { ...r, from: r.from, to: new Date() };
  }, [rangeIdx, customRange]);

  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  const applyCustom = (sel: DayPickerRange | undefined) => {
    if (sel?.from && sel?.to) {
      const days = differenceInCalendarDays(sel.to, sel.from) + 1;
      if (days > MAX_RANGE_DAYS) {
        toast.error(`Please pick a range of ${MAX_RANGE_DAYS} days or less.`);
        return;
      }
      setCustomRange(sel);
      setRangeIdx("custom");
      setPickerOpen(false);
    } else {
      setCustomRange(sel);
    }
  };

  const customLabel =
    customRange?.from && customRange?.to
      ? `${format(customRange.from, "dd MMM yyyy")} – ${format(customRange.to, "dd MMM yyyy")}`
      : "Custom range";

  const minDate = useMemo(() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - MAX_RANGE_DAYS);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Analytics Dashboard
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          {RANGES.map((r, i) => (
            <Button
              key={r.label}
              variant={rangeIdx === i ? "default" : "outline"}
              size="sm"
              onClick={() => setRangeIdx(i)}
            >
              Last {r.label}
            </Button>
          ))}
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={rangeIdx === "custom" ? "default" : "outline"}
                size="sm"
                className={cn("gap-2", rangeIdx !== "custom" && "text-muted-foreground")}
              >
                <CalendarIcon className="h-4 w-4" />
                {rangeIdx === "custom" ? customLabel : "Custom range"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={customRange}
                onSelect={applyCustom}
                numberOfMonths={2}
                defaultMonth={customRange?.from ?? new Date()}
                disabled={(date) => date > new Date() || date < minDate}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
              <div className="flex items-center justify-between p-3 border-t text-xs text-muted-foreground">
                <span>Up to {MAX_RANGE_DAYS} days</span>
                {customRange?.from && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCustomRange(undefined);
                      setRangeIdx(1);
                      setPickerOpen(false);
                    }}
                  >
                    Reset
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" onClick={reload}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        All metrics are sourced from your first-party analytics events.
      </p>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="blogs">Blogs</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="tech">Tech</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><OverviewTab range={range} reloadKey={reloadKey} /></TabsContent>
        <TabsContent value="traffic"><TrafficTab range={range} reloadKey={reloadKey} /></TabsContent>
        <TabsContent value="engagement"><EngagementTab range={range} reloadKey={reloadKey} /></TabsContent>
        <TabsContent value="jobs"><JobsTab range={range} reloadKey={reloadKey} /></TabsContent>
        <TabsContent value="blogs"><BlogsTab range={range} reloadKey={reloadKey} /></TabsContent>
        <TabsContent value="featured"><FeaturedTab range={range} reloadKey={reloadKey} /></TabsContent>
        <TabsContent value="search"><SearchTab range={range} reloadKey={reloadKey} /></TabsContent>
        <TabsContent value="content"><ContentTab range={range} reloadKey={reloadKey} /></TabsContent>
        <TabsContent value="tech"><TechTab range={range} reloadKey={reloadKey} /></TabsContent>
      </Tabs>
    </div>
  );
}

// ---------- helpers ----------

function useAsync<T>(fn: () => Promise<T>, deps: any[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fn()
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e?.message ?? String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { data, loading, error };
}

// ---------- Overview ----------

function OverviewTab({ range, reloadKey }: { range: DateRange; reloadKey: number }) {
  const summary = useAsync(() => fetchSummary(range), [range, reloadKey]);
  const funnel = useAsync(() => fetchJobFunnel(range), [range, reloadKey]);
  const series = useAsync(() => fetchDailySeries(range), [range, reloadKey]);
  const ret = useAsync(() => fetchReturning(range), [range, reloadKey]);

  const s = summary.data ?? {};
  const f = funnel.data;
  const r = ret.data;
  const applyRate = f && f.job_views > 0 ? f.apply_clicks / f.job_views : undefined;
  const returningPct = r && r.total_sessions > 0 ? r.returning_sessions / r.total_sessions : undefined;

  const trend = useMemo(() => {
    const map = new Map<string, any>();
    (series.data ?? []).forEach((row) => {
      if (!map.has(row.day)) map.set(row.day, { day: row.day });
      map.get(row.day)[row.event_type] = row.count;
      map.get(row.day).sessions = Math.max(map.get(row.day).sessions ?? 0, row.sessions ?? 0);
    });
    return Array.from(map.values()).sort((a, b) => a.day.localeCompare(b.day));
  }, [series.data]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Sessions" value={fmt(s.total_sessions)} sub="Unique visits" />
        <Kpi label="Page views" value={fmt(s.total_page_views)} />
        <Kpi label="Job views" value={fmt(s.total_job_views)} />
        <Kpi label="Apply clicks" value={fmt(s.total_apply_clicks)} />
        <Kpi label="Searches" value={fmt(s.total_searches)} />
        <Kpi label="View → Apply" value={fmtPct(applyRate)} sub="Job conversion" />
        <Kpi label="Returning rate" value={fmtPct(returningPct)} sub="Visited 2+ days" />
        <Kpi
          label="Pages / session"
          value={
            s.total_sessions && s.total_sessions > 0
              ? (Number(s.total_page_views) / Number(s.total_sessions)).toFixed(2)
              : "—"
          }
        />
      </div>

      <ChartCard title="Daily sessions, page views & job views">
        {trend.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="day" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="page_view" name="Page views" stroke={PIE_COLORS[0]} dot={false} />
              <Line type="monotone" dataKey="job_view" name="Job views" stroke={PIE_COLORS[1]} dot={false} />
              <Line type="monotone" dataKey="apply_click" name="Applies" stroke={PIE_COLORS[2]} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState loading={series.loading} />
        )}
      </ChartCard>
    </div>
  );
}

// ---------- Traffic (first-party) ----------

function TrafficTab({ range, reloadKey }: { range: DateRange; reloadKey: number }) {
  const pages = useAsync(() => fetchTopPages(range, 15), [range, reloadKey]);
  const refs = useAsync(() => fetchTopReferrers(range, 10), [range, reloadKey]);
  const devices = useAsync(() => fetchDeviceBreakdown(range), [range, reloadKey]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Top referrers (sessions)" height="h-64">
          {refs.data?.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={refs.data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="referrer_host" fontSize={11} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="sessions" fill={PIE_COLORS[0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState loading={refs.loading} />
          )}
        </ChartCard>

        <ChartCard title="Devices (sessions)" height="h-64">
          {devices.data?.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={devices.data}
                  dataKey="sessions_count"
                  nameKey="device"
                  outerRadius={90}
                  label
                >
                  {devices.data.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState loading={devices.loading} />
          )}
        </ChartCard>

        <ChartCard title="Top pages" height="h-auto">
          <SimpleTable
            loading={pages.loading}
            rows={pages.data ?? []}
            columns={[
              { key: "path", label: "Page", truncate: true },
              { key: "views", label: "Views", align: "right", format: (v) => fmt(v) },
              { key: "sessions", label: "Sessions", align: "right", format: (v) => fmt(v) },
            ]}
          />
        </ChartCard>

        <ChartCard title="Top referrers" height="h-auto">
          <SimpleTable
            loading={refs.loading}
            rows={refs.data ?? []}
            columns={[
              { key: "referrer_host", label: "Referrer", truncate: true },
              { key: "sessions", label: "Sessions", align: "right", format: (v) => fmt(v) },
              { key: "page_views", label: "Page views", align: "right", format: (v) => fmt(v) },
            ]}
          />
        </ChartCard>
      </div>
    </div>
  );
}

// ---------- Engagement ----------

function EngagementTab({ range, reloadKey }: { range: DateRange; reloadKey: number }) {
  const series = useAsync(() => fetchDailySeries(range), [range, reloadKey]);
  const scroll = useAsync(() => fetchScrollDistribution(range), [range, reloadKey]);
  const ret = useAsync(() => fetchReturning(range), [range, reloadKey]);

  const trend = useMemo(() => {
    const map = new Map<string, any>();
    (series.data ?? []).forEach((r) => {
      if (!map.has(r.day)) map.set(r.day, { day: r.day });
      map.get(r.day)[r.event_type] = r.count;
      map.get(r.day).sessions = Math.max(map.get(r.day).sessions ?? 0, r.sessions ?? 0);
    });
    return Array.from(map.values()).sort((a, b) => a.day.localeCompare(b.day));
  }, [series.data]);

  const r = ret.data;
  const returningPct = r && r.total_sessions > 0 ? r.returning_sessions / r.total_sessions : undefined;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Total sessions" value={fmt(r?.total_sessions)} />
        <Kpi label="Returning sessions" value={fmt(r?.returning_sessions)} sub="Visited on 2+ days" />
        <Kpi label="Returning rate" value={fmtPct(returningPct)} />
        <Kpi
          label="Scroll completions"
          value={fmt(scroll.data?.find((x) => x.scroll_pct === 100)?.count)}
          sub="Reached 100% scroll"
        />
      </div>

      <ChartCard title="Daily events trend">
        {trend.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="day" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="page_view" stroke={PIE_COLORS[0]} dot={false} />
              <Line type="monotone" dataKey="job_view" stroke={PIE_COLORS[1]} dot={false} />
              <Line type="monotone" dataKey="apply_click" stroke={PIE_COLORS[2]} dot={false} />
              <Line type="monotone" dataKey="search" stroke={PIE_COLORS[3]} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState loading={series.loading} />
        )}
      </ChartCard>

      <ChartCard title="Scroll-depth distribution" height="h-64">
        {scroll.data?.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scroll.data.map((s) => ({ pct: `${s.scroll_pct}%`, count: s.count }))}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="pct" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" fill={PIE_COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState loading={scroll.loading} />
        )}
      </ChartCard>
    </div>
  );
}

// ---------- Jobs ----------

function JobsTab({ range, reloadKey }: { range: DateRange; reloadKey: number }) {
  const funnel = useAsync(() => fetchJobFunnel(range), [range, reloadKey]);
  const topViewed = useAsync(() => fetchTopEntities(range, "job_view", 10), [range, reloadKey]);
  const topApplied = useAsync(() => fetchTopEntities(range, "apply_click", 10), [range, reloadKey]);

  const [titles, setTitles] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    const ids = Array.from(
      new Set([
        ...(topViewed.data ?? []).map((r) => r.entity_id),
        ...(topApplied.data ?? []).map((r) => r.entity_id),
      ]),
    );
    if (ids.length) resolveJobTitles(ids).then(setTitles);
  }, [topViewed.data, topApplied.data]);

  const f = funnel.data;
  const cardCtr = f && f.job_views > 0 ? f.job_card_clicks / Math.max(f.job_views, 1) : undefined;
  const applyRate = f && f.job_views > 0 ? f.apply_clicks / f.job_views : undefined;
  const sessionApplyRate =
    f && f.unique_view_sessions > 0 ? f.unique_apply_sessions / f.unique_view_sessions : undefined;

  const funnelData = f
    ? [
        { stage: "Card clicks", count: f.job_card_clicks },
        { stage: "Job views", count: f.job_views },
        { stage: "Apply clicks", count: f.apply_clicks },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Job card clicks" value={fmt(f?.job_card_clicks)} />
        <Kpi label="Job views" value={fmt(f?.job_views)} />
        <Kpi label="Apply clicks" value={fmt(f?.apply_clicks)} />
        <Kpi label="View → Apply" value={fmtPct(applyRate)} sub={`Per-session: ${fmtPct(sessionApplyRate)}`} />
      </div>

      <ChartCard title="Job funnel" height="h-64">
        {funnelData.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" fontSize={11} />
              <YAxis dataKey="stage" type="category" fontSize={11} width={100} />
              <Tooltip />
              <Bar dataKey="count" fill={PIE_COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState loading={funnel.loading} />
        )}
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Most viewed jobs" height="h-auto">
          <SimpleTable
            loading={topViewed.loading}
            rows={topViewed.data ?? []}
            columns={[
              {
                key: "entity_id",
                label: "Job",
                truncate: true,
                format: (v) => titles.get(v) ?? <span className="text-muted-foreground">{v}</span>,
              },
              { key: "count", label: "Views", align: "right", format: (v) => fmt(v) },
            ]}
          />
        </ChartCard>
        <ChartCard title="Most applied jobs" height="h-auto">
          <SimpleTable
            loading={topApplied.loading}
            rows={topApplied.data ?? []}
            columns={[
              {
                key: "entity_id",
                label: "Job",
                truncate: true,
                format: (v) => titles.get(v) ?? <span className="text-muted-foreground">{v}</span>,
              },
              { key: "count", label: "Applies", align: "right", format: (v) => fmt(v) },
            ]}
          />
        </ChartCard>
      </div>

      <div className="text-xs text-muted-foreground">
        Card CTR (clicks ÷ views): {fmtPct(cardCtr)}
      </div>
    </div>
  );
}

// ---------- Search ----------

function SearchTab({ range, reloadKey }: { range: DateRange; reloadKey: number }) {
  const summary = useAsync(() => fetchSummary(range), [range, reloadKey]);
  const top = useAsync(() => fetchTopSearches(range, false, 15), [range, reloadKey]);
  const zero = useAsync(() => fetchTopSearches(range, true, 15), [range, reloadKey]);
  const s = summary.data ?? {};
  const zeroRate =
    s.total_searches && s.total_searches > 0
      ? Number(s.total_zero_result_searches) / Number(s.total_searches)
      : undefined;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Searches" value={fmt(s.total_searches)} />
        <Kpi label="Zero-result searches" value={fmt(s.total_zero_result_searches)} />
        <Kpi label="Zero-result rate" value={fmtPct(zeroRate)} />
        <Kpi label="Unique queries" value={fmt(top.data?.length)} sub="Top 15 by volume" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Top searches" height="h-auto">
          <SimpleTable
            loading={top.loading}
            rows={top.data ?? []}
            columns={[
              { key: "search_query", label: "Query", truncate: true },
              { key: "count", label: "Count", align: "right", format: (v) => fmt(v) },
              {
                key: "avg_result_count",
                label: "Avg results",
                align: "right",
                format: (v) => fmt(Math.round(Number(v))),
              },
            ]}
          />
        </ChartCard>
        <ChartCard title="Zero-result queries" height="h-auto">
          <SimpleTable
            loading={zero.loading}
            rows={zero.data ?? []}
            emptyLabel="No zero-result searches in this range 🎉"
            columns={[
              { key: "search_query", label: "Query", truncate: true },
              { key: "count", label: "Count", align: "right", format: (v) => fmt(v) },
            ]}
          />
        </ChartCard>
      </div>
    </div>
  );
}

// ---------- Content ----------

function ContentTab({ range, reloadKey }: { range: DateRange; reloadKey: number }) {
  const blogViews = useAsync(() => fetchTopEntities(range, "blog_view", 10), [range, reloadKey]);
  const resourceViews = useAsync(() => fetchTopEntities(range, "resource_view", 10), [range, reloadKey]);
  const resourceDl = useAsync(() => fetchTopEntities(range, "resource_download", 10), [range, reloadKey]);

  const [blogTitles, setBlogTitles] = useState<Map<string, string>>(new Map());
  const [resTitles, setResTitles] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const ids = (blogViews.data ?? []).map((r) => r.entity_id);
    if (ids.length) resolveBlogTitles(ids).then(setBlogTitles);
  }, [blogViews.data]);

  useEffect(() => {
    const ids = Array.from(
      new Set([
        ...(resourceViews.data ?? []).map((r) => r.entity_id),
        ...(resourceDl.data ?? []).map((r) => r.entity_id),
      ]),
    );
    if (ids.length) resolveResourceTitles(ids).then(setResTitles);
  }, [resourceViews.data, resourceDl.data]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Top blogs" height="h-auto">
          <SimpleTable
            loading={blogViews.loading}
            rows={blogViews.data ?? []}
            columns={[
              {
                key: "entity_id",
                label: "Blog",
                truncate: true,
                format: (v) => blogTitles.get(v) ?? <span className="text-muted-foreground">{v}</span>,
              },
              { key: "count", label: "Views", align: "right", format: (v) => fmt(v) },
            ]}
          />
        </ChartCard>

        <ChartCard title="Top resources (views)" height="h-auto">
          <SimpleTable
            loading={resourceViews.loading}
            rows={resourceViews.data ?? []}
            columns={[
              {
                key: "entity_id",
                label: "Resource",
                truncate: true,
                format: (v) => resTitles.get(v) ?? <span className="text-muted-foreground">{v}</span>,
              },
              { key: "count", label: "Views", align: "right", format: (v) => fmt(v) },
            ]}
          />
        </ChartCard>

        <ChartCard title="Top resources (downloads)" height="h-auto">
          <SimpleTable
            loading={resourceDl.loading}
            rows={resourceDl.data ?? []}
            columns={[
              {
                key: "entity_id",
                label: "Resource",
                truncate: true,
                format: (v) => resTitles.get(v) ?? <span className="text-muted-foreground">{v}</span>,
              },
              { key: "count", label: "Downloads", align: "right", format: (v) => fmt(v) },
            ]}
          />
        </ChartCard>
      </div>
    </div>
  );
}

// ---------- Tech ----------

function TechTab({ range, reloadKey }: { range: DateRange; reloadKey: number }) {
  const devices = useAsync(() => fetchDeviceBreakdown(range), [range, reloadKey]);
  const summary = useAsync(() => fetchSummary(range), [range, reloadKey]);
  const s = summary.data ?? {};
  const totalDeviceSessions = (devices.data ?? []).reduce((sum, d) => sum + Number(d.sessions_count || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Total sessions" value={fmt(s.total_sessions)} />
        <Kpi label="Total page views" value={fmt(s.total_page_views)} />
        <Kpi
          label="Mobile share"
          value={fmtPct(
            totalDeviceSessions > 0
              ? Number(devices.data?.find((d) => d.device === "mobile")?.sessions_count ?? 0) / totalDeviceSessions
              : undefined,
          )}
        />
        <Kpi
          label="Desktop share"
          value={fmtPct(
            totalDeviceSessions > 0
              ? Number(devices.data?.find((d) => d.device === "desktop")?.sessions_count ?? 0) / totalDeviceSessions
              : undefined,
          )}
        />
      </div>

      <ChartCard title="Device breakdown" height="h-64">
        {devices.data?.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={devices.data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="device" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend />
              <Bar dataKey="sessions_count" name="Sessions" fill={PIE_COLORS[0]} />
              <Bar dataKey="page_views" name="Page views" fill={PIE_COLORS[1]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState loading={devices.loading} />
        )}
      </ChartCard>
    </div>
  );
}

// ---------- Blogs (in-depth) ----------

function BlogsTab({ range, reloadKey }: { range: DateRange; reloadKey: number }) {
  const summary = useAsync(() => fetchBlogSummary(range), [range, reloadKey]);
  const daily = useAsync(() => fetchBlogDaily(range), [range, reloadKey]);
  const top = useAsync(() => fetchBlogTop(range, 15), [range, reloadKey]);
  const refs = useAsync(() => fetchBlogReferrers(range, 10), [range, reloadKey]);
  const devices = useAsync(() => fetchBlogDevices(range), [range, reloadKey]);

  const [titles, setTitles] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    const ids = (top.data ?? []).map((r) => r.entity_id);
    if (ids.length) resolveBlogTitles(ids).then(setTitles);
  }, [top.data]);

  const s = summary.data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Blog views" value={fmt(s?.total_blog_views)} />
        <Kpi label="Unique readers" value={fmt(s?.unique_blog_sessions)} sub="Distinct sessions" />
        <Kpi label="Blogs viewed" value={fmt(s?.unique_blogs_viewed)} sub="Distinct posts" />
        <Kpi label="Views / reader" value={fmt(s?.avg_views_per_session)} />
      </div>

      <ChartCard title="Daily blog views & readers">
        {daily.data?.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily.data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="day" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="views" name="Views" stroke={PIE_COLORS[0]} dot={false} />
              <Line type="monotone" dataKey="sessions" name="Readers" stroke={PIE_COLORS[1]} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState loading={daily.loading} />
        )}
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Top blogs" height="h-auto">
          <SimpleTable
            loading={top.loading}
            rows={top.data ?? []}
            columns={[
              {
                key: "entity_id",
                label: "Blog",
                truncate: true,
                format: (v) => titles.get(v) ?? <span className="text-muted-foreground">{v}</span>,
              },
              { key: "views", label: "Views", align: "right", format: (v) => fmt(v) },
              { key: "sessions", label: "Readers", align: "right", format: (v) => fmt(v) },
            ]}
          />
        </ChartCard>

        <ChartCard title="Top referrers (blog readers)" height="h-auto">
          <SimpleTable
            loading={refs.loading}
            rows={refs.data ?? []}
            columns={[
              { key: "referrer_host", label: "Referrer", truncate: true },
              { key: "sessions", label: "Sessions", align: "right", format: (v) => fmt(v) },
              { key: "views", label: "Views", align: "right", format: (v) => fmt(v) },
            ]}
          />
        </ChartCard>

        <ChartCard title="Devices (blog readers)" height="h-64">
          {devices.data?.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={devices.data}
                  dataKey="sessions"
                  nameKey="device"
                  outerRadius={90}
                  label
                >
                  {devices.data.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState loading={devices.loading} />
          )}
        </ChartCard>
      </div>
    </div>
  );
}

// ---------- Featured Carousel (in-depth) ----------

function FeaturedTab({ range, reloadKey }: { range: DateRange; reloadKey: number }) {
  const summary = useAsync(() => fetchFeaturedSummary(range), [range, reloadKey]);
  const daily = useAsync(() => fetchFeaturedDaily(range), [range, reloadKey]);
  const top = useAsync(() => fetchFeaturedTop(range, 20), [range, reloadKey]);
  const breakdown = useAsync(() => fetchFeaturedBreakdown(range), [range, reloadKey]);

  const s = summary.data;

  const byContentType = (breakdown.data ?? []).filter((b) => b.bucket === "content_type");
  const byLocation = (breakdown.data ?? []).filter((b) => b.bucket === "display_location");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Impressions" value={fmt(s?.total_impressions)} sub="Times items rendered" />
        <Kpi label="Clicks" value={fmt(s?.total_clicks)} />
        <Kpi label="CTR" value={fmtPct(s?.ctr)} sub="Clicks ÷ impressions" />
        <Kpi label="Active items" value={fmt(s?.unique_items)} sub="With activity" />
      </div>

      <ChartCard title="Daily impressions & clicks">
        {daily.data?.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily.data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="day" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="impressions" name="Impressions" stroke={PIE_COLORS[0]} dot={false} />
              <Line type="monotone" dataKey="clicks" name="Clicks" stroke={PIE_COLORS[1]} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState loading={daily.loading} />
        )}
      </ChartCard>

      <ChartCard title="Per-item performance" height="h-auto">
        <SimpleTable
          loading={top.loading}
          rows={top.data ?? []}
          columns={[
            {
              key: "title",
              label: "Item",
              truncate: true,
              format: (v, row: any) => v ?? <span className="text-muted-foreground">{row.entity_id}</span>,
            },
            { key: "content_type", label: "Type" },
            { key: "display_location", label: "Location" },
            { key: "impressions", label: "Impr.", align: "right", format: (v) => fmt(v) },
            { key: "clicks", label: "Clicks", align: "right", format: (v) => fmt(v) },
            { key: "ctr", label: "CTR", align: "right", format: (v) => fmtPct(Number(v)) },
          ]}
        />
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="By content type" height="h-auto">
          <SimpleTable
            loading={breakdown.loading}
            rows={byContentType}
            columns={[
              { key: "group_key", label: "Content type" },
              { key: "impressions", label: "Impr.", align: "right", format: (v) => fmt(v) },
              { key: "clicks", label: "Clicks", align: "right", format: (v) => fmt(v) },
              { key: "ctr", label: "CTR", align: "right", format: (v) => fmtPct(Number(v)) },
            ]}
          />
        </ChartCard>

        <ChartCard title="By display location" height="h-auto">
          <SimpleTable
            loading={breakdown.loading}
            rows={byLocation}
            columns={[
              { key: "group_key", label: "Location" },
              { key: "impressions", label: "Impr.", align: "right", format: (v) => fmt(v) },
              { key: "clicks", label: "Clicks", align: "right", format: (v) => fmt(v) },
              { key: "ctr", label: "CTR", align: "right", format: (v) => fmtPct(Number(v)) },
            ]}
          />
        </ChartCard>
      </div>
    </div>
  );
}
