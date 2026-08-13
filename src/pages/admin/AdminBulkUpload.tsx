import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, Upload, FileSpreadsheet, FileText, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  BULK_COLUMNS,
  downloadCsvTemplate,
  downloadXlsxTemplate,
  parseFile,
  importBulkJobs,
  type ImportResult,
} from "@/lib/bulkJobImport";

export default function AdminBulkUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const handleImport = async () => {
    if (!file) return;
    setBusy(true);
    setResult(null);
    try {
      const rows = await parseFile(file);
      if (rows.length === 0) {
        toast({ title: "Empty file", description: "No rows found.", variant: "destructive" });
        return;
      }
      const res = await importBulkJobs(rows);
      setResult(res);
      qc.invalidateQueries({ queryKey: ["admin-jobs"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({
        title: `Imported ${res.inserted} job${res.inserted === 1 ? "" : "s"}`,
        description: res.failed.length ? `${res.failed.length} row(s) failed.` : "All rows succeeded.",
      });
    } catch (e: any) {
      toast({ title: "Import failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bulk Upload Jobs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Import many jobs at once from a CSV or Excel file. Imported jobs land in{" "}
          <button className="underline text-primary" onClick={() => navigate("/admin/jobs/bulk")}>
            Bulk Uploaded Jobs
          </button>{" "}
          where you can review, edit, and publish them.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Download className="h-5 w-5" /> Step 1 — Download the template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button onClick={downloadXlsxTemplate} variant="outline">
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel template (.xlsx)
            </Button>
            <Button onClick={downloadCsvTemplate} variant="outline">
              <FileText className="mr-2 h-4 w-4" /> CSV template (.csv)
            </Button>
          </div>
          <div className="rounded-md border p-3 text-xs">
            <p className="font-semibold mb-2">Column reference (first row must be the header):</p>
            <code className="block whitespace-pre-wrap break-all text-muted-foreground">
              {BULK_COLUMNS.join(", ")}
            </code>
            <ul className="list-disc pl-5 mt-3 space-y-1 text-muted-foreground">
              <li><strong>Multi-value fields</strong> (locations, skills, domains) use a pipe <code>|</code> as separator: <code>Delhi|Mumbai|Bangalore</code>.</li>
              <li><strong>job_type</strong>: full_time, part_time, internship, contract, freelance.</li>
              <li><strong>work_mode</strong>: onsite, remote, hybrid.</li>
              <li><strong>experience_level</strong>: entry, mid, senior, lead, executive.</li>
              <li><strong>application_type</strong>: <code>url</code> (fill application_url) or <code>email</code> (fill application_email).</li>
              <li>Unknown companies, cities, skills and domains are <strong>created automatically</strong>.</li>
              <li>The Excel template includes a README sheet with the same notes.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Step 2 — Upload your file</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={(e) => { setFile(e.target.files?.[0] || null); setResult(null); }}
            disabled={busy}
          />
          <Button onClick={handleImport} disabled={!file || busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {busy ? "Importing..." : "Import jobs"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.failed.length === 0 ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <AlertTriangle className="h-5 w-5 text-destructive" />}
              Import results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              <strong>{result.inserted}</strong> job{result.inserted === 1 ? "" : "s"} imported successfully.
              {result.failed.length > 0 && <> <strong>{result.failed.length}</strong> row{result.failed.length === 1 ? "" : "s"} failed.</>}
            </p>
            {result.failed.length > 0 && (
              <Alert variant="destructive">
                <AlertTitle>Failed rows</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 text-xs space-y-1 mt-2">
                    {result.failed.map((f, i) => (
                      <li key={i}>Row {f.row} ({f.title || "untitled"}): {f.error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            {result.inserted > 0 && (
              <Button variant="outline" onClick={() => navigate("/admin/jobs/bulk")}>
                Review imported jobs →
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
