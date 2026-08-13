import { useAdminJobs, useDeleteJob, useBulkDelete, useBulkUpdate } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Rocket, Undo2, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { jobCodeFor } from "@/lib/jobCode";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionsToolbar, downloadCsv } from "@/components/admin/BulkActionsToolbar";

const INVALIDATE = [["admin-jobs"], ["admin-stats"], ["admin-job-duplicates"]];

export default function AdminBulkJobs() {
  const { data: jobs = [], isLoading } = useAdminJobs("draft", "bulk_upload");
  const deleteJob = useDeleteJob();
  const bulkDel = useBulkDelete("j_jobs", INVALIDATE);
  const bulkUpd = useBulkUpdate("j_jobs", INVALIDATE);
  const publishOne = (id: string) =>
    bulkUpd.mutate({ ids: [id], patch: { status: "published", posted_at: new Date().toISOString() } });
  const sel = useRowSelection<any>(jobs as any[]);
  const navigate = useNavigate();

  const handleBulkDelete = async () => { await bulkDel.mutateAsync(sel.selectedIds); sel.clear(); };
  const handleBulkPublish = async () => {
    await bulkUpd.mutateAsync({ ids: sel.selectedIds, patch: { status: "published", posted_at: new Date().toISOString() } });
    sel.clear();
  };
  const handleBulkToDraft = async () => {
    await bulkUpd.mutateAsync({ ids: sel.selectedIds, patch: { workflow_stage: "manual_draft" } });
    sel.clear();
  };
  const handleExport = () => {
    downloadCsv("bulk-uploaded-jobs.csv", sel.selectedRows.map((j: any) => ({
      id: j.id, code: jobCodeFor(j), title: j.title, company: (j.j_companies as any)?.name,
      job_type: j.job_type, status: j.status, created_at: j.created_at,
    })));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Bulk Uploaded Jobs</h1>
        <Button onClick={() => navigate("/admin/jobs/bulk-upload")}>
          <Upload className="h-4 w-4 mr-2" /> Upload more
        </Button>
      </div>

      <BulkActionsToolbar
        count={sel.count}
        onClear={sel.clear}
        onDelete={handleBulkDelete}
        onExport={handleExport}
        itemNoun="job"
        extraActions={
          <>
            <Button size="sm" variant="outline" onClick={handleBulkToDraft}>
              <Undo2 className="mr-2 h-4 w-4" /> Move to Draft
            </Button>
            <Button size="sm" variant="outline" onClick={handleBulkPublish}>
              <Rocket className="mr-2 h-4 w-4" /> Publish
            </Button>
          </>
        }
      />

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : jobs.length === 0 ? (
        <p className="text-muted-foreground">No bulk-uploaded jobs yet. Use the “Upload more” button to import a CSV or Excel file.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={sel.allChecked ? true : sel.someChecked ? "indeterminate" : false}
                    onCheckedChange={() => sel.toggleAll()}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="w-[110px]">Job ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(jobs as any[]).map((job: any) => (
                <TableRow key={job.id} data-state={sel.isSelected(job.id) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={sel.isSelected(job.id)}
                      onCheckedChange={() => sel.toggle(job.id)}
                      aria-label={`Select ${job.title}`}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{jobCodeFor(job)}</TableCell>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell>{(job.j_companies as any)?.name || "—"}</TableCell>
                  <TableCell><Badge variant="outline">{job.job_type?.replace(/_/g, " ") || "—"}</Badge></TableCell>
                  <TableCell><Badge variant="secondary">{job.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/jobs/edit/${job.id}`)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>
                      {job.status !== "published" && (
                        <AlertDialog>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Rocket className="h-4 w-4 text-primary" />
                                </Button>
                              </AlertDialogTrigger>
                            </TooltipTrigger>
                            <TooltipContent>Make live</TooltipContent>
                          </Tooltip>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Publish this job?</AlertDialogTitle>
                              <AlertDialogDescription>It will be visible on the public site immediately.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => publishOne(job.id)}>Publish</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      <AlertDialog>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </AlertDialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete job?</AlertDialogTitle>
                            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteJob.mutate(job.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
