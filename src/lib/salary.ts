// Format salary in LPA (Lakhs Per Annum). Annual rupees in -> "₹X-Y LPA".
// Returns '' when no salary info is available.
export function formatSalaryLPA(min?: number | null, max?: number | null): string {
  const fmt = (n: number) => {
    const lpa = n / 100000;
    // 1 decimal when < 10, otherwise integer
    return lpa < 10 ? lpa.toFixed(1).replace(/\.0$/, '') : Math.round(lpa).toString();
  };
  if (min && max) return `₹${fmt(min)}-${fmt(max)} LPA`;
  if (min) return `₹${fmt(min)}+ LPA`;
  if (max) return `Up to ₹${fmt(max)} LPA`;
  return '';
}

// Predefined salary range buckets in LPA (annual rupees).
export const SALARY_BUCKETS: { label: string; min: number; max: number }[] = [
  { label: '0-3 LPA', min: 0, max: 300000 },
  { label: '3-6 LPA', min: 300000, max: 600000 },
  { label: '6-10 LPA', min: 600000, max: 1000000 },
  { label: '10-15 LPA', min: 1000000, max: 1500000 },
  { label: '15-25 LPA', min: 1500000, max: 2500000 },
  { label: '25-50 LPA', min: 2500000, max: 5000000 },
  { label: '50+ LPA', min: 5000000, max: Number.POSITIVE_INFINITY },
];

export function jobMatchesSalaryBucket(
  salaryMin: number | null | undefined,
  salaryMax: number | null | undefined,
  bucketLabel: string
): boolean {
  const b = SALARY_BUCKETS.find((x) => x.label === bucketLabel);
  if (!b) return false;
  const jMin = salaryMin ?? salaryMax ?? null;
  const jMax = salaryMax ?? salaryMin ?? null;
  if (jMin == null && jMax == null) return false;
  // overlap
  return (jMin ?? 0) < b.max && (jMax ?? Number.POSITIVE_INFINITY) >= b.min;
}

// Title case helper used for filter labels (e.g. 'hybrid' -> 'Hybrid').
export function toTitleCase(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .toString()
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

// Canonical work-mode label: Remote / Hybrid / Onsite.
export function normalizeWorkMode(s: string | null | undefined): string {
  if (!s) return '';
  const v = s.toString().toLowerCase().replace(/[\s_-]+/g, '');
  if (v === 'remote') return 'Remote';
  if (v === 'hybrid') return 'Hybrid';
  if (v === 'onsite' || v === 'inoffice' || v === 'office') return 'Onsite';
  return toTitleCase(s);
}

// Canonical job-type options shown in the filter.
export const JOB_TYPE_OPTIONS = ['Full Time', 'Part Time', 'Contract', 'Internship', 'Temporary', 'Freelance'];
export const WORK_MODE_OPTIONS = ['Remote', 'Hybrid', 'Onsite'];
export const EXPERIENCE_OPTIONS = ['Entry', 'Junior', 'Mid', 'Senior', 'Lead', 'Executive'];
