import { useAdminJobs, useDeleteJob, useBulkDelete, useBulkUpdate } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionsToolbar, downloadCsv } from "@/components/admin/BulkActionsToolbar";
import { jobCodeFor } from "@/lib/jobCode";

const INVALIDATE = [['admin-jobs'], ['admin-stats'], ['admin-job-duplicates']];

export default function AdminLiveJobs() {
  const { data: jobs = [], isLoading } = useAdminJobs('published');
  const deleteJob = useDeleteJob();
  const bulkDel = useBulkDelete('j_jobs', INVALIDATE);
  const bulkUpd = useBulkUpdate('j_jobs', INVALIDATE);
  const sel = useRowSelection<any>(jobs as any[]);
  const navigate = useNavigate();

  const handleBulkDelete = async () => { await bulkDel.mutateAsync(sel.selectedIds); sel.clear(); };
  const handleBulkUnpublish = async () => {
    await bulkUpd.mutateAsync({ ids: sel.selectedIds, patch: { status: 'draft', workflow_stage: 'manual_draft' } });
    sel.clear();
  };
  const handleExport = () => {
    downloadCsv('live-jobs.csv', sel.selectedRows.map((j: any) => ({
      id: j.id, code: jobCodeFor(j), title: j.title, company: (j.j_companies as any)?.name,
      job_type: j.job_type, posted_at: j.posted_at,
    })));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Live Jobs</h1>
        <Button onClick={() => navigate('/admin/jobs/edit')}>
          <Plus className="h-4 w-4 mr-2" /> New Job
        </Button>
      </div>

      <BulkActionsToolbar
        count={sel.count}
        onClear={sel.clear}
        onDelete={handleBulkDelete}
        onExport={handleExport}
        itemNoun="job"
        extraActions={
          <Button size="sm" variant="outline" onClick={handleBulkUnpublish}>
            <EyeOff className="mr-2 h-4 w-4" /> Unpublish
          </Button>
        }
      />

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : jobs.length === 0 ? (
        <p className="text-muted-foreground">No published jobs yet.</p>
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
                <TableHead>Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Posted On</TableHead>
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
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell>{(job.j_companies as any)?.name || '—'}</TableCell>
                  <TableCell><Badge variant="outline">{job.job_type?.replace(/_/g, ' ')}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {job.posted_at ? new Date(job.posted_at).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell><Badge variant="default">{job.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/jobs/edit/${job.id}`)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete job?</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
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
