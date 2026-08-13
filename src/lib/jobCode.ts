// Human-readable job code: {prefix}{YYYY}{MM}{job_number padded to 8}
// Prefix reflects current state: JL = Live (published), JD = Draft.
// YYYYMM comes from created_at, job_number is a stable sequence shared across all states.
export type JobLocation = 'live' | 'draft';

const pad8 = (n: number) => String(n).padStart(8, '0');

function ymFromDate(d: string | Date | null | undefined): string {
  if (!d) return '000000';
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dt.getTime())) return '000000';
  return `${dt.getFullYear()}${String(dt.getMonth() + 1).padStart(2, '0')}`;
}

function prefixFor(status?: string | null): 'JL' | 'JD' {
  if (status === 'published') return 'JL';
  return 'JD';
}

export function jobCodeFor(opts: {
  job_number?: number | null;
  status?: string | null;
  workflow_stage?: string | null;
  created_at?: string | Date | null;
}): string {
  if (opts.job_number == null) return '—';
  return `${prefixFor(opts.status)}${ymFromDate(opts.created_at)}${pad8(opts.job_number)}`;
}

export function jobCodeFromLocation(
  job_number: number | null | undefined,
  location: JobLocation,
  created_at?: string | Date | null,
): string {
  if (job_number == null) return '—';
  const prefix = location === 'live' ? 'JL' : 'JD';
  return `${prefix}${ymFromDate(created_at)}${pad8(job_number)}`;
}
