import * as XLSX from "xlsx";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";

/**
 * Bulk job import — column spec, template generation, parsing, and DB insertion.
 * Every column from the Add New Job editor (Details, Description, SEO) is supported.
 * Multi-value cells use pipe `|` separators (e.g. "Delhi|Mumbai|Bangalore").
 * Unknown company / city / skill / domain values are auto-created.
 */

export const BULK_COLUMNS = [
  // --- Core ---
  "title",
  "normalized_title",
  "slug",
  "company",
  "status",                // draft | published | archived | expired (defaults to draft)
  // --- Type / mode / experience ---
  "job_type",              // full_time | part_time | internship | contract | freelance
  "work_mode",             // onsite | remote | hybrid
  "experience_level",      // entry | mid | senior | lead | executive (optional)
  "experience_min",
  "experience_max",
  // --- Salary ---
  "salary_min",
  "salary_max",
  "salary_currency",       // INR | USD | ...
  // --- Taxonomy ---
  "locations",             // pipe-separated city names
  "skills",                // pipe-separated
  "domains",               // pipe-separated
  // --- Content ---
  "description",           // plain text or HTML
  "jd_pdf_url",            // optional pre-hosted PDF URL
  // --- Application ---
  "application_type",      // url | email
  "application_url",
  "application_email",
  // --- Dates ---
  "posted_at",             // ISO date (optional, used when status=published)
  "expires_at",            // ISO date (optional)
  // --- SEO ---
  "meta_title",
  "meta_description",
  "og_title",
  "og_description",
  "og_image_url",
  "canonical_url",
] as const;

export type BulkColumn = (typeof BULK_COLUMNS)[number];

const SAMPLE_ROWS: Record<BulkColumn, string>[] = [
  {
    title: "Senior Frontend Engineer",
    normalized_title: "senior frontend engineer",
    slug: "",
    company: "Acme Corp",
    status: "draft",
    job_type: "full_time",
    work_mode: "hybrid",
    experience_level: "senior",
    experience_min: "4",
    experience_max: "8",
    salary_min: "1800000",
    salary_max: "2800000",
    salary_currency: "INR",
    locations: "Bangalore|Hyderabad",
    skills: "React|TypeScript|Tailwind",
    domains: "SaaS|Fintech",
    description: "<p>Build delightful UIs for our customer portal.</p>",
    jd_pdf_url: "",
    application_type: "url",
    application_url: "https://acme.example.com/careers/sr-fe",
    application_email: "",
    posted_at: "",
    expires_at: "",
    meta_title: "Senior Frontend Engineer at Acme Corp",
    meta_description: "Join Acme Corp as a Senior Frontend Engineer building modern web apps.",
    og_title: "Senior Frontend Engineer — Acme Corp",
    og_description: "Build delightful UIs for our customer portal.",
    og_image_url: "",
    canonical_url: "",
  },
  {
    title: "Marketing Intern",
    normalized_title: "marketing intern",
    slug: "",
    company: "Brightside Media",
    status: "draft",
    job_type: "internship",
    work_mode: "remote",
    experience_level: "entry",
    experience_min: "0",
    experience_max: "1",
    salary_min: "20000",
    salary_max: "25000",
    salary_currency: "INR",
    locations: "Remote",
    skills: "SEO|Content Writing",
    domains: "Media",
    description: "Assist the content team with SEO research and copy.",
    jd_pdf_url: "",
    application_type: "email",
    application_url: "",
    application_email: "careers@brightside.example.com",
    posted_at: "",
    expires_at: "",
    meta_title: "",
    meta_description: "",
    og_title: "",
    og_description: "",
    og_image_url: "",
    canonical_url: "",
  },
];

/* ------------------------------------------------------------------ */
/* Template downloads                                                  */
/* ------------------------------------------------------------------ */

export function downloadCsvTemplate() {
  const csv = Papa.unparse({ fields: [...BULK_COLUMNS], data: SAMPLE_ROWS.map((r) => BULK_COLUMNS.map((c) => r[c])) });
  triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "bulk-jobs-template.csv");
}

export function downloadXlsxTemplate() {
  const ws = XLSX.utils.json_to_sheet(SAMPLE_ROWS, { header: [...BULK_COLUMNS] });
  ws["!cols"] = BULK_COLUMNS.map((c) => ({ wch: Math.max(16, c.length + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Jobs");

  const readme: (string | number)[][] = [
    ["Field", "Required", "Notes"],
    ["title", "yes", "Job title."],
    ["normalized_title", "no", "Lowercase canonical title used for de-duplication. Auto-derived from title if blank."],
    ["slug", "no", "URL slug. Auto-generated from title if blank."],
    ["company", "yes", "Company name. Auto-created if missing."],
    ["status", "no", "draft | published | archived | expired. Defaults to draft."],
    ["job_type", "yes", "full_time | part_time | internship | contract | freelance."],
    ["work_mode", "yes", "onsite | remote | hybrid."],
    ["experience_level", "no", "entry | mid | senior | lead | executive."],
    ["experience_min", "no", "Whole number of years."],
    ["experience_max", "no", "Whole number of years."],
    ["salary_min", "no", "Numeric, no commas. e.g. 1800000."],
    ["salary_max", "no", "Numeric, no commas."],
    ["salary_currency", "no", "Defaults to INR."],
    ["locations", "no", "Pipe-separated city names. e.g. Delhi|Mumbai. Cities auto-created in default country if missing."],
    ["skills", "no", "Pipe-separated. e.g. React|Node.js. Auto-created if missing."],
    ["domains", "no", "Pipe-separated. e.g. SaaS|Fintech. Auto-created if missing."],
    ["description", "no", "Plain text or HTML."],
    ["jd_pdf_url", "no", "Pre-hosted PDF URL for job description attachment."],
    ["application_type", "no", "url | email. Defaults to url."],
    ["application_url", "no", "Required when application_type=url."],
    ["application_email", "no", "Required when application_type=email."],
    ["posted_at", "no", "ISO datetime (e.g. 2025-04-01T09:00:00Z). Auto-set when status=published if blank."],
    ["expires_at", "no", "ISO datetime when the listing should expire."],
    ["meta_title", "no", "SEO meta title."],
    ["meta_description", "no", "SEO meta description."],
    ["og_title", "no", "Open Graph title for social previews."],
    ["og_description", "no", "Open Graph description."],
    ["og_image_url", "no", "Open Graph image URL."],
    ["canonical_url", "no", "Canonical URL for SEO."],
  ];
  const wsReadme = XLSX.utils.aoa_to_sheet(readme);
  wsReadme["!cols"] = [{ wch: 22 }, { wch: 10 }, { wch: 90 }];
  XLSX.utils.book_append_sheet(wb, wsReadme, "README");

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  triggerDownload(new Blob([out], { type: "application/octet-stream" }), "bulk-jobs-template.xlsx");
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/* Parsing                                                             */
/* ------------------------------------------------------------------ */

export type ParsedRow = Record<string, string>;

export async function parseFile(file: File): Promise<ParsedRow[]> {
  const isXlsx = /\.xlsx?$/i.test(file.name);
  if (isXlsx) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });
    return rows.map((r) => normalizeKeys(r));
  }
  const text = await file.text();
  const parsed = Papa.parse<Record<string, any>>(text, { header: true, skipEmptyLines: true });
  return parsed.data.map((r) => normalizeKeys(r));
}

function normalizeKeys(row: Record<string, any>): ParsedRow {
  const out: ParsedRow = {};
  for (const [k, v] of Object.entries(row)) {
    out[k.trim().toLowerCase().replace(/\s+/g, "_")] = v == null ? "" : String(v).trim();
  }
  return out;
}

const splitMulti = (s: string) =>
  (s || "")
    .split("|")
    .map((x) => x.trim())
    .filter(Boolean);

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const isoOrNull = (v: string): string | null => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

const strOrNull = (v: string): string | null => (v && v.trim() ? v.trim() : null);

/* ------------------------------------------------------------------ */
/* Insert pipeline                                                     */
/* ------------------------------------------------------------------ */

export interface ImportResult {
  inserted: number;
  failed: { row: number; title: string; error: string }[];
}

export async function importBulkJobs(rows: ParsedRow[]): Promise<ImportResult> {
  const result: ImportResult = { inserted: 0, failed: [] };

  const [skillsRes, domainsRes, citiesRes, companiesRes, countriesRes] = await Promise.all([
    supabase.from("j_skills").select("id, name"),
    supabase.from("j_domains").select("id, name"),
    supabase.from("j_cities").select("id, name, country_id"),
    supabase.from("j_companies").select("id, name"),
    supabase.from("j_countries").select("id, name, iso_code"),
  ]);

  const skillMap = mapByName(skillsRes.data);
  const domainMap = mapByName(domainsRes.data);
  const cityMap = mapByName(citiesRes.data);
  const companyMap = mapByName(companiesRes.data);

  let defaultCountryId = countriesRes.data?.[0]?.id;
  if (!defaultCountryId) {
    const { data: c } = await supabase
      .from("j_countries")
      .insert({ name: "India", iso_code: "IN" })
      .select("id")
      .single();
    defaultCountryId = c?.id;
  }

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const title = (r.title || "").trim();
    if (!title) continue;

    try {
      // Company
      const companyName = (r.company || "").trim();
      let companyId: string | null = null;
      if (companyName) {
        companyId = await ensureEntity(companyMap, companyName, async () => {
          const { data, error } = await supabase
            .from("j_companies")
            .insert({ name: companyName, slug: slugify(companyName) })
            .select("id")
            .single();
          if (error) throw error;
          return data!.id;
        });
      }

      // Resolve status & posted_at
      const status = (r.status || "draft").toLowerCase();
      let postedAt = isoOrNull(r.posted_at);
      if (status === "published" && !postedAt) postedAt = new Date().toISOString();

      // Job
      const jobPayload: any = {
        title,
        normalized_title: r.normalized_title?.trim() || title.toLowerCase(),
        slug: r.slug?.trim() || undefined, // omit so DB trigger generates one
        company_id: companyId,
        job_type: (r.job_type || "full_time").toLowerCase(),
        work_mode: (r.work_mode || "onsite").toLowerCase(),
        experience_level: r.experience_level ? r.experience_level.toLowerCase() : null,
        experience_min: numOrNull(r.experience_min),
        experience_max: numOrNull(r.experience_max),
        salary_min: numOrNull(r.salary_min),
        salary_max: numOrNull(r.salary_max),
        salary_currency: r.salary_currency || "INR",
        description: strOrNull(r.description),
        jd_pdf_url: strOrNull(r.jd_pdf_url),
        posted_at: postedAt,
        expires_at: isoOrNull(r.expires_at),
        status,
        workflow_stage: "bulk_upload",
      };
      // Drop slug if blank so DB default/trigger applies
      if (!jobPayload.slug) delete jobPayload.slug;

      const { data: savedJob, error: jobError } = await supabase
        .from("j_jobs")
        .insert(jobPayload)
        .select("id")
        .single();
      if (jobError) throw jobError;
      const jobId = savedJob!.id;

      // Cities
      const cityNames = splitMulti(r.locations);
      const cityIds: string[] = [];
      for (const name of cityNames) {
        const id = await ensureEntity(cityMap, name, async () => {
          const { data, error } = await supabase
            .from("j_cities")
            .insert({ name, country_id: defaultCountryId })
            .select("id")
            .single();
          if (error) throw error;
          return data!.id;
        });
        if (id) cityIds.push(id);
      }
      if (cityIds.length) {
        await supabase
          .from("j_job_locations_map")
          .insert(cityIds.map((city_id) => ({ job_id: jobId, city_id })));
      }

      // Skills
      const skillNames = splitMulti(r.skills);
      const skillIds: string[] = [];
      for (const name of skillNames) {
        const id = await ensureEntity(skillMap, name, async () => {
          const { data, error } = await supabase
            .from("j_skills")
            .insert({ name, slug: slugify(name) })
            .select("id")
            .single();
          if (error) throw error;
          return data!.id;
        });
        if (id) skillIds.push(id);
      }
      if (skillIds.length) {
        await supabase
          .from("j_job_skills_map")
          .insert(skillIds.map((skill_id) => ({ job_id: jobId, skill_id })));
      }

      // Domains
      const domainNames = splitMulti(r.domains);
      const domainIds: string[] = [];
      for (const name of domainNames) {
        const id = await ensureEntity(domainMap, name, async () => {
          const { data, error } = await supabase
            .from("j_domains")
            .insert({ name, slug: slugify(name) })
            .select("id")
            .single();
          if (error) throw error;
          return data!.id;
        });
        if (id) domainIds.push(id);
      }
      if (domainIds.length) {
        await supabase
          .from("j_job_domains_map")
          .insert(domainIds.map((domain_id) => ({ job_id: jobId, domain_id })));
      }

      // Application
      const appType = (r.application_type || "url").toLowerCase();
      if (appType === "email" && r.application_email) {
        await supabase.from("j_job_applications").insert({
          job_id: jobId,
          application_type: "email",
          application_email: r.application_email,
        });
      } else if (r.application_url) {
        await supabase.from("j_job_applications").insert({
          job_id: jobId,
          application_type: "url",
          application_url: r.application_url,
        });
      }

      // SEO (only if at least one field provided)
      const seoPayload: any = {
        meta_title: strOrNull(r.meta_title),
        meta_description: strOrNull(r.meta_description),
        og_title: strOrNull(r.og_title),
        og_description: strOrNull(r.og_description),
        og_image_url: strOrNull(r.og_image_url),
        canonical_url: strOrNull(r.canonical_url),
      };
      if (Object.values(seoPayload).some((v) => v !== null)) {
        await supabase.from("j_job_seo").insert({ ...seoPayload, job_id: jobId });
      }

      result.inserted++;
    } catch (e: any) {
      result.failed.push({ row: i + 2, title, error: e?.message || String(e) });
    }
  }

  return result;
}

function mapByName(rows: { id: string; name: string }[] | null | undefined) {
  const m = new Map<string, string>();
  for (const r of rows || []) m.set(r.name.trim().toLowerCase(), r.id);
  return m;
}

async function ensureEntity(
  cache: Map<string, string>,
  name: string,
  create: () => Promise<string>,
): Promise<string> {
  const key = name.trim().toLowerCase();
  if (cache.has(key)) return cache.get(key)!;
  const id = await create();
  cache.set(key, id);
  return id;
}

function numOrNull(v: string): number | null {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}
