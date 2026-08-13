import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

export function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
        <div className="text-2xl font-semibold mt-1 tabular-nums">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

export function ChartCard({
  title,
  children,
  height = "h-72",
  action,
}: {
  title: string;
  children: ReactNode;
  height?: string;
  action?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent className={height}>{children}</CardContent>
    </Card>
  );
}

export function EmptyState({ loading, label }: { loading?: boolean; label?: string }) {
  return (
    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
      {loading ? "Loading…" : label ?? "No data for this range"}
    </div>
  );
}

export type SimpleCol = {
  key: string;
  label: string;
  align?: "left" | "right";
  truncate?: boolean;
  format?: (v: any, row: any) => ReactNode;
};

export function SimpleTable({
  rows,
  columns,
  loading,
  emptyLabel,
}: {
  rows: any[];
  columns: SimpleCol[];
  loading?: boolean;
  emptyLabel?: string;
}) {
  if (!rows.length) return <EmptyState loading={loading} label={emptyLabel} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase text-muted-foreground border-b">
            {columns.map((c) => (
              <th key={c.key} className={`py-2 pr-3 ${c.align === "right" ? "text-right" : ""}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b last:border-0">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`py-2 pr-3 ${c.align === "right" ? "text-right tabular-nums" : ""} ${
                    c.truncate ? "max-w-[280px] truncate" : ""
                  }`}
                  title={c.truncate ? String(r[c.key] ?? "") : undefined}
                >
                  {c.format ? c.format(r[c.key], r) : String(r[c.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function fmt(n: number | undefined | null, opts: Intl.NumberFormatOptions = {}) {
  if (n === undefined || n === null || Number.isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("en-US", opts).format(Number(n));
}

export function fmtPct(n: number | undefined, decimals = 1) {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return `${(n * 100).toFixed(decimals)}%`;
}

export function fmtDuration(seconds: number | undefined) {
  if (!seconds) return "0s";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function fmtDate(yyyymmdd: string) {
  if (!yyyymmdd || yyyymmdd.length !== 8) return yyyymmdd;
  return `${yyyymmdd.slice(4, 6)}/${yyyymmdd.slice(6, 8)}`;
}
