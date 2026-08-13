import { createClient } from "@supabase/supabase-js";

const DEFAULT_SITE_URL = "https://oppavenue.com";
const SUPABASE_URL = "https://egyeyrjxlvblveijmkky.supabase.co";
const SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVneWV5cmp4bHZibHZlaWpta2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNTMwOTksImV4cCI6MjA5MDYyOTA5OX0.pwEAcHZ_N42PA47Rlp3J7_5mkOQ0TcQahR5xGwS736Q";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

interface JobSitemapRow {
  id?: string;
  updated_at?: string | null;
}

interface BlogSitemapRow {
  slug?: string | null;
  updated_at?: string | null;
}

interface ResourceCategorySitemapRow {
  slug?: string | null;
}

interface ResourceSitemapRow {
  slug?: string | null;
  updated_at?: string | null;
  r_categories?: ResourceCategorySitemapRow | null;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/blogs", changefreq: "daily", priority: "0.8" },
  { path: "/resources", changefreq: "weekly", priority: "0.8" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
  { path: "/advertise", changefreq: "monthly", priority: "0.5" },
  { path: "/contact", changefreq: "monthly", priority: "0.4" },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/disclaimer", changefreq: "yearly", priority: "0.3" },
  { path: "/cookie-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/sitemap", changefreq: "monthly", priority: "0.3" },
];

export function getSiteUrl(origin?: string): string {
  const raw = process.env.SITE_URL || process.env.VITE_SITE_URL || DEFAULT_SITE_URL;
  return raw.replace(/\/+$/, "");
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function encodePath(path: string): string {
  if (path === "/") return "/";
  return path
    .split("/")
    .map((segment, index) => (index === 0 ? "" : encodeURIComponent(segment)))
    .join("/");
}

async function fetchDynamicEntries(): Promise<SitemapEntry[]> {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  const out: SitemapEntry[] = [];

  const { data: jobs } = await sb
    .from("j_jobs")
    .select("id, updated_at")
    .eq("status", "published")
    .limit(5000);
  for (const j of ((jobs ?? []) as JobSitemapRow[])) {
    if (!j.id) continue;
    out.push({
      path: `/job/${j.id}`,
      lastmod: j.updated_at?.slice(0, 10),
      changefreq: "weekly",
      priority: "0.7",
    });
  }

  const { data: blogs } = await sb
    .from("b_blogs")
    .select("slug, updated_at")
    .eq("status", "published")
    .limit(5000);
  for (const b of ((blogs ?? []) as BlogSitemapRow[])) {
    const slug = b.slug;
    if (!slug) continue;
    out.push({
      path: `/blog/${slug}`,
      lastmod: b.updated_at?.slice(0, 10),
      changefreq: "monthly",
      priority: "0.6",
    });
  }

  const { data: cats } = await sb
    .from("r_categories")
    .select("slug");
  for (const c of ((cats ?? []) as ResourceCategorySitemapRow[])) {
    const slug = c.slug;
    if (slug) out.push({ path: `/resources/${slug}`, changefreq: "weekly", priority: "0.6" });
  }

  const { data: resources } = await sb
    .from("r_resources")
    .select("slug, updated_at, r_categories(slug)")
    .eq("status", "published")
    .limit(5000);
  for (const r of ((resources ?? []) as ResourceSitemapRow[])) {
    const categorySlug = r.r_categories?.slug;
    const slug = r.slug;
    if (!categorySlug || !slug) continue;
    out.push({
      path: `/resources/${categorySlug}/${slug}`,
      lastmod: r.updated_at?.slice(0, 10),
      changefreq: "monthly",
      priority: "0.5",
    });
  }

  return out;
}

function renderSitemap(entries: SitemapEntry[], siteUrl: string): string {
  const urls = entries.map((entry) =>
    [
      "  <url>",
      `    <loc>${escapeXml(`${siteUrl}${encodePath(entry.path)}`)}</loc>`,
      entry.lastmod ? `    <lastmod>${entry.lastmod}</lastmod>` : null,
      entry.changefreq ? `    <changefreq>${entry.changefreq}</changefreq>` : null,
      entry.priority ? `    <priority>${entry.priority}</priority>` : null,
      "  </url>",
    ]
      .filter(Boolean)
      .join("\n")
  );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
  ].join("\n");
}

export async function buildSitemapXml(origin?: string): Promise<string> {
  let dynamicEntries: SitemapEntry[] = [];
  try {
    dynamicEntries = await fetchDynamicEntries();
  } catch (error) {
    console.warn("sitemap: dynamic fetch failed, writing static entries only", error);
  }

  return renderSitemap([...staticEntries, ...dynamicEntries], getSiteUrl(origin));
}

export function buildRobotsTxt(origin?: string): string {
  const siteUrl = getSiteUrl(origin);
  return [
    "User-agent: Googlebot",
    "Allow: /",
    "",
    "User-agent: Googlebot-Image",
    "Allow: /",
    "",
    "User-agent: Bingbot",
    "Allow: /",
    "",
    "User-agent: Twitterbot",
    "Allow: /",
    "",
    "User-agent: facebookexternalhit",
    "Allow: /",
    "",
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "",
    `Sitemap: ${siteUrl}/sitemap.xml`,
    "",
  ].join("\n");
}
