import { useAdminJobs, useDeleteJob, useJobDuplicates, useBulkDelete, useBulkUpdate } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, AlertTriangle, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { jobCodeFor, jobCodeFromLocation } from "@/lib/jobCode";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionsToolbar, downloadCsv } from "@/components/admin/BulkActionsToolbar";

const INVALIDATE = [['admin-jobs'], ['admin-stats'], ['admin-job-duplicates']];

export default function AdminDraftJobs() {
  const { data: jobs = [], isLoading } = useAdminJobs('draft', 'manual_draft');
  const { data: dupes = {} } = useJobDuplicates('manual_draft');
  const deleteJob = useDeleteJob();
  const bulkDel = useBulkDelete('j_jobs', INVALIDATE);
  const bulkUpd = useBulkUpdate('j_jobs', INVALIDATE);
  const sel = useRowSelection<any>(jobs as any[]);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();

  const makeLive = async (jobId: string) => {
    const { error } = await supabase
      .from('j_jobs')
      .update({ status: 'published', posted_at: new Date().toISOString() } as any)
      .eq('id', jobId);
    if (error) { toast({ title: 'Failed to publish', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Job published' });
    qc.invalidateQueries({ queryKey: ['admin-jobs'] });
    qc.invalidateQueries({ queryKey: ['admin-job-duplicates'] });
    qc.invalidateQueries({ queryKey: ['admin-stats'] });
  };

  const handleBulkDelete = async () => { await bulkDel.mutateAsync(sel.selectedIds); sel.clear(); };
  const handleBulkPublish = async () => {
    await bulkUpd.mutateAsync({ ids: sel.selectedIds, patch: { status: 'published', posted_at: new Date().toISOString() } });
    sel.clear();
  };
  const handleExport = () => {
    downloadCsv('draft-jobs.csv', sel.selectedRows.map((j: any) => ({
      id: j.id, code: jobCodeFor(j), title: j.title, company: (j.j_companies as any)?.name,
      job_type: j.job_type, status: j.status, created_at: j.created_at,
    })));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Draft Jobs</h1>
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
          <Button size="sm" variant="outline" onClick={handleBulkPublish}>
            <Rocket className="mr-2 h-4 w-4" /> Publish
          </Button>
        }
      />

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : jobs.length === 0 ? (
        <p className="text-muted-foreground">No draft jobs yet. Manually-created jobs you save without publishing will appear here.</p>
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
                <TableHead>Duplicate Check</TableHead>
                <TableHead className="w-[160px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(jobs as any[]).map((job: any) => {
                const matches = (dupes as any)[job.id] as { id: string; title: string; location: 'live' | 'draft'; job_number: number | null; created_at: string | null }[] | undefined;
                return (
                  <TableRow key={job.id} className={matches ? 'bg-destructive/5' : ''} data-state={sel.isSelected(job.id) ? "selected" : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={sel.isSelected(job.id)}
                        onCheckedChange={() => sel.toggle(job.id)}
                        aria-label={`Select ${job.title}`}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{jobCodeFor(job)}</TableCell>
                    <TableCell className="font-medium">{job.title || <span className="text-muted-foreground italic">Untitled draft</span>}</TableCell>
                    <TableCell>{(job.j_companies as any)?.name || '—'}</TableCell>
                    <TableCell><Badge variant="outline">{job.job_type?.replace(/_/g, ' ') || '—'}</Badge></TableCell>
                    <TableCell>
                      {matches ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex flex-col gap-1 cursor-help">
                              <Badge variant="destructive" className="gap-1 w-fit">
                                <AlertTriangle className="h-3 w-3" /> Duplicate ({matches.length})
                              </Badge>
                              <div className="flex flex-wrap gap-1">
                                {matches.slice(0, 3).map((m) => (
                                  <span key={m.id} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20">
                                    {jobCodeFromLocation(m.job_number, m.location, m.created_at)}
                                  </span>
                                ))}
                                {matches.length > 3 && (
                                  <span className="text-[10px] text-muted-foreground">+{matches.length - 3} more</span>
                                )}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm">
                            <div className="space-y-1 text-xs">
                              <p className="font-semibold">Possible duplicates:</p>
                              {matches.map((m) => (
                                <div key={m.id}>
                                  • <span className="font-mono">{jobCodeFromLocation(m.job_number, m.location, m.created_at)}</span> — <span className="font-medium">{m.title}</span> <span className="capitalize text-muted-foreground">({m.location})</span>
                                </div>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Badge variant="outline" className="text-xs">Unique</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" title="Make live" onClick={() => makeLive(job.id)}>
                          <Rocket className="h-4 w-4 text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/jobs/edit/${job.id}`)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete draft?</AlertDialogTitle>
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
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
