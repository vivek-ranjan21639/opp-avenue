import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { X, Save, ArrowLeft, Plus } from "lucide-react";
import {
  useAdminJob, useSaveJob, useAdminCompanies, useAdminDomains, useAdminSkills,
  useAdminCountries, useAdminStates, useAdminCities, useAdminAllLocations, useFileUpload,
  useUpsertCompany, useUpsertSkill, useUpsertDomain,
  useUpsertCountry, useUpsertState, useUpsertCity,
} from "@/hooks/useAdminData";
import { useAutoSaveDraft } from "@/hooks/useAutoSaveDraft";
import { InlineCreateDialog } from "@/components/admin/InlineCreateDialog";
import BlogEditor from "@/components/admin/BlogEditor";
import { useJobTaxonomy } from "@/hooks/useJobTaxonomy";

// ---- Inline rich Company Create dialog (with logo upload + all j_companies fields) ----
function slugifyName(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function CreateCompanyDialog({ onCreated }: { onCreated: (c: any) => void }) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState<any>({ name: "", slug: "", website: "", headquarter: "", employee_count: "", founding_year: "", description: "", logo_url: "" });
  const [slugTouched, setSlugTouched] = useState(false);
  const upsertCompany = useUpsertCompany();
  const uploadFile = useFileUpload();

  const reset = () => { setV({ name: "", slug: "", website: "", headquarter: "", employee_count: "", founding_year: "", description: "", logo_url: "" }); setSlugTouched(false); };

  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const tempId = 'new-' + Date.now();
    const ext = file.name.split('.').pop() || 'png';
    const path = `entities/companies/${tempId}/logo/logo_${tempId}_v1.${ext}`;
    const url = await uploadFile.mutateAsync({ file, path, bucket: 'content' });
    setV((p: any) => ({ ...p, logo_url: url }));
  };

  const handleSave = async () => {
    if (!v.name?.trim()) return;
    const payload: any = { ...v };
    if (!payload.slug) payload.slug = slugifyName(payload.name);
    if (payload.founding_year) payload.founding_year = Number(payload.founding_year);
    else delete payload.founding_year;
    const created = await upsertCompany.mutateAsync(payload);
    onCreated(created);
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" /> New Company</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New Company</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Name *</Label>
              <Input value={v.name} onChange={(e) => setV((p: any) => ({ ...p, name: e.target.value, slug: slugTouched ? p.slug : slugifyName(e.target.value) }))} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={v.slug} onChange={(e) => { setSlugTouched(true); setV((p: any) => ({ ...p, slug: e.target.value })); }} />
            </div>
          </div>
          <div>
            <Label>Logo</Label>
            <div className="flex items-center gap-3">
              {v.logo_url && <img src={v.logo_url} alt="Logo" className="w-12 h-12 rounded-md object-cover border" />}
              <Input type="file" accept="image/*" onChange={handleLogo} className="flex-1" />
            </div>
            <Input className="mt-2" placeholder="…or paste logo URL" value={v.logo_url} onChange={(e) => setV((p: any) => ({ ...p, logo_url: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Website</Label><Input type="url" value={v.website} onChange={(e) => setV((p: any) => ({ ...p, website: e.target.value }))} /></div>
            <div><Label>Headquarter</Label><Input value={v.headquarter} onChange={(e) => setV((p: any) => ({ ...p, headquarter: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Employee Count</Label><Input value={v.employee_count} onChange={(e) => setV((p: any) => ({ ...p, employee_count: e.target.value }))} placeholder="e.g. 50-200" /></div>
            <div><Label>Founding Year</Label><Input type="number" value={v.founding_year} onChange={(e) => setV((p: any) => ({ ...p, founding_year: e.target.value }))} /></div>
          </div>
          <div><Label>Description</Label><Textarea rows={3} value={v.description} onChange={(e) => setV((p: any) => ({ ...p, description: e.target.value }))} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleSave} disabled={upsertCompany.isPending}>{upsertCompany.isPending ? "Saving..." : "Create"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminJobEditor() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { data: existingJob, isLoading: loadingJob } = useAdminJob(jobId);
  const saveJob = useSaveJob();
  const { data: companies = [] } = useAdminCompanies();
  const { data: allDomains = [] } = useAdminDomains();
  const { data: allSkills = [] } = useAdminSkills();
  const { data: countries = [] } = useAdminCountries();
  const uploadFile = useFileUpload();
  const upsertCompany = useUpsertCompany();
  const upsertSkill = useUpsertSkill();
  const upsertDomain = useUpsertDomain();
  const upsertCountry = useUpsertCountry();
  const upsertState = useUpsertState();
  const upsertCity = useUpsertCity();

  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const { data: states = [] } = useAdminStates(selectedCountry || undefined);
  const { data: cities = [] } = useAdminCities(selectedState || undefined);
  const { data: allLocations = [] } = useAdminAllLocations();
  // Cities directly under a country (no state) for when state isn't required
  const { data: countryCities = [] } = useAdminCities(undefined);

  const [form, setForm] = useState<any>({});
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [appType, setAppType] = useState<"url" | "email">("url");
  const [appValue, setAppValue] = useState("");
  const [seo, setSeo] = useState<any>({});
  const [description, setDescription] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [wasSaved, setWasSaved] = useState(false);
  // Track which SEO/normalized fields the user has manually edited so we don't clobber them.
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const markTouched = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  const resetEditorState = useCallback(() => {
    setForm({});
    setSelectedSkills([]);
    setSelectedDomains([]);
    setSelectedCities([]);
    setSelectedCountry("");
    setSelectedState("");
    setAppType("url");
    setAppValue("");
    setSeo({});
    setDescription("");
    setTouched({});
  }, []);

  useEffect(() => {
    if (existingJob && !initialized) {
      setForm({
        title: existingJob.title || "",
        normalized_title: existingJob.normalized_title || "",
        company_id: existingJob.company_id || "",
        job_type: existingJob.job_type || "",
        work_mode: existingJob.work_mode || "",
        experience_min: existingJob.experience_min ?? "",
        experience_max: existingJob.experience_max ?? "",
        experience_level: existingJob.experience_level || "",
        salary_min: existingJob.salary_min ?? "",
        salary_max: existingJob.salary_max ?? "",
        salary_currency: existingJob.salary_currency || "INR",
        status: existingJob.status || "draft",
        slug: existingJob.slug || "",
        jd_pdf_url: existingJob.jd_pdf_url || "",
        workflow_stage: (existingJob as any).workflow_stage || "manual_draft",
        expires_at: (existingJob as any).expires_at ? String((existingJob as any).expires_at).slice(0, 10) : "",
      });
      setSelectedSkills((existingJob.j_job_skills_map || []).map((m: any) => m.skill_id));
      setSelectedDomains((existingJob.j_job_domains_map || []).map((m: any) => m.domain_id));
      setSelectedCities((existingJob.j_job_locations_map || []).map((m: any) => m.city_id));
      const app = (existingJob.j_job_applications as any[])?.[0];
      if (app) {
        setAppType(app.application_type || "url");
        setAppValue(app.application_url || app.application_email || "");
      }
      const seoData = Array.isArray(existingJob.j_job_seo) ? existingJob.j_job_seo[0] : existingJob.j_job_seo;
      if (seoData) setSeo(seoData);
      setDescription((existingJob as any).description || "");
      setInitialized(true);
    }
  }, [existingJob, initialized]);

  // Pre-fill from sessionStorage (e.g. duplicated job)
  useEffect(() => {
    if (jobId || initialized) return;
    const raw = sessionStorage.getItem('job-editor-prefill');
    if (!raw) return;
    try {
      const p = JSON.parse(raw);
      setForm((f: any) => ({ ...f, title: p.title || f.title || "", status: 'draft', workflow_stage: 'manual_draft' }));
      if (p.external_url) setAppValue(p.external_url);
      if (p.description) setDescription(p.description);
    } catch { /* ignore */ }
    sessionStorage.removeItem('job-editor-prefill');
    setInitialized(true);
  }, [jobId, initialized]);

  // Helpers for autofill
  const normalizeTitle = (t: string) => (t || "").toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, " ").replace(/-+/g, "-");
  const stripHtml = (h: string) => (h || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  // Autofill normalized_title from title
  useEffect(() => {
    if (touched.normalized_title) return;
    const auto = normalizeTitle(form.title || "");
    if ((form.normalized_title || "") !== auto) {
      setForm((f: any) => ({ ...f, normalized_title: auto }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title]);

  // Autofill SEO fields from job content
  useEffect(() => {
    const company = companies.find((c: any) => c.id === form.company_id)?.name || "";
    const baseTitle = [form.title, company].filter(Boolean).join(" at ");
    const baseDesc = (stripHtml(description) || form.title || "").slice(0, 160);
    setSeo((s: any) => {
      const next = { ...s };
      if (!touched.meta_title && baseTitle) next.meta_title = baseTitle.slice(0, 60);
      if (!touched.meta_description && baseDesc) next.meta_description = baseDesc;
      if (!touched.og_title && baseTitle) next.og_title = baseTitle.slice(0, 60);
      if (!touched.og_description && baseDesc) next.og_description = baseDesc;
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title, form.company_id, description, companies]);

  const isReady = jobId ? initialized : true;

  const formDataForDraft = useMemo(() => ({
    form, selectedSkills, selectedDomains, selectedCities,
    appType, appValue, seo, description,
  }), [form, selectedSkills, selectedDomains, selectedCities, appType, appValue, seo, description]);

  const onRestore = useCallback((data: Record<string, any>) => {
    if (data.form) {
      const restoredForm = { ...data.form };
      delete restoredForm.salary_period;
      delete restoredForm.salary_type;
      setForm(restoredForm);
    }
    if (data.selectedSkills) setSelectedSkills(data.selectedSkills);
    if (data.selectedDomains) setSelectedDomains(data.selectedDomains);
    if (data.selectedCities) setSelectedCities(data.selectedCities);
    if (data.appType) setAppType(data.appType);
    if (data.appValue !== undefined) setAppValue(data.appValue);
    if (data.seo) setSeo(data.seo);
    if (data.description !== undefined) setDescription(data.description);
  }, []);

  const buildJobPayload = (status?: string) => {
    const slugify = (s: string) => (s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const job: any = {
      ...form,
      description,
      slug: form.slug?.trim() || slugify(form.title || "") || undefined,
      experience_min: form.experience_min ? Number(form.experience_min) : null,
      experience_max: form.experience_max ? Number(form.experience_max) : null,
      salary_min: form.salary_min ? Number(form.salary_min) : null,
      salary_max: form.salary_max ? Number(form.salary_max) : null,
      company_id: form.company_id || null,
      experience_level: form.experience_level || null,
      workflow_stage: form.workflow_stage || 'manual_draft',
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    };
    delete job.salary_period;
    delete job.salary_type;
    if (status) job.status = status;
    if (jobId) job.id = jobId;
    return job;
  };

  const onAutoSave = useCallback(async () => {
    if (!form.title) return false;
    try {
      const job = buildJobPayload("draft");
      const application = appValue ? {
        application_type: appType,
        ...(appType === "url" ? { application_url: appValue } : { application_email: appValue }),
      } : undefined;
      await saveJob.mutateAsync({
        job, skills: selectedSkills, domains: selectedDomains, cities: selectedCities,
        application, seo: seo.meta_title ? seo : undefined,
      });
      return true;
    } catch { return false; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, description, jobId, appType, appValue, selectedSkills, selectedDomains, selectedCities, seo, saveJob]);

  const hasContent = useCallback(() => !!form.title?.trim(), [form.title]);

  const { clearDraft } = useAutoSaveDraft({
    storageKey: `job-${jobId || "new"}`,
    formData: formDataForDraft,
    onRestore,
    onAutoSave,
    isNew: !jobId,
    isSaved: wasSaved,
    hasContent,
    isReady,
  });

  const handleCancel = () => {
    setWasSaved(true);
    clearDraft();
    resetEditorState();
    navigate(-1);
  };

  const handleSave = async () => {
    const job = buildJobPayload();
    if (form.status === "published" && !job.posted_at) job.posted_at = new Date().toISOString();
    const application = appValue ? {
      application_type: appType,
      ...(appType === "url" ? { application_url: appValue } : { application_email: appValue }),
    } : undefined;
    await saveJob.mutateAsync({
      job, skills: selectedSkills, domains: selectedDomains, cities: selectedCities,
      application, seo: seo.meta_title ? seo : undefined,
    });
    setWasSaved(true);
    clearDraft();
    // Route based on status: drafts -> draft list, published -> live list
    navigate(form.status === "published" ? "/admin/jobs/live" : "/admin/jobs/drafts");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const id = jobId || 'new-' + Date.now();
    const ext = file.name.split('.').pop() || 'pdf';
    const path = `jobs/${id}/jd/jd_${id}_v1.${ext}`;
    const url = await uploadFile.mutateAsync({ file, path, bucket: 'content' });
    setForm((f: any) => ({ ...f, jd_pdf_url: url }));
  };

  // Cities available to add: filter from the global location list (always fresh after invalidation)
  const availableCities = selectedCountry
    ? (allLocations as any[]).filter((c: any) =>
        c.country_id === selectedCountry && (selectedState ? c.state_id === selectedState : true)
      )
    : [];

  // Dynamic admin-managed dropdowns
  const { data: jobTypeOpts = [] } = useJobTaxonomy('job_type');
  const { data: workModeOpts = [] } = useJobTaxonomy('work_mode');
  const { data: expLevelOpts = [] } = useJobTaxonomy('experience_level');

  const [activeTab, setActiveTab] = useState<'details' | 'description' | 'seo'>('details');
  const tabOrder: Array<'details' | 'description' | 'seo'> = ['details', 'description', 'seo'];
  const isLastTab = activeTab === 'seo';
  const goNext = () => {
    const idx = tabOrder.indexOf(activeTab);
    if (idx < tabOrder.length - 1) setActiveTab(tabOrder[idx + 1]);
  };

  if (jobId && loadingJob) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-bold">{jobId ? "Edit Job" : "Create Job"}</h1>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* DETAILS TAB — everything except description and SEO */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Job Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Title *</Label>
                  <Input value={form.title || ""} onChange={(e) => setForm((f: any) => ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <Label>Normalized Title</Label>
                  <Input value={form.normalized_title || ""} onChange={(e) => { markTouched('normalized_title'); setForm((f: any) => ({ ...f, normalized_title: e.target.value })); }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between">
                    <Label>Company</Label>
                    <CreateCompanyDialog
                      onCreated={(c) => setForm((f: any) => ({ ...f, company_id: c.id }))}
                    />
                  </div>
                  <Select value={form.company_id || ""} onValueChange={(v) => setForm((f: any) => ({ ...f, company_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                    <SelectContent>{companies.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status || "draft"} onValueChange={(v) => setForm((f: any) => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Job Type</Label>
                  <Select value={form.job_type || ""} onValueChange={(v) => setForm((f: any) => ({ ...f, job_type: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select job type" /></SelectTrigger>
                    <SelectContent>
                      {jobTypeOpts.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Work Mode</Label>
                  <Select value={form.work_mode || ""} onValueChange={(v) => setForm((f: any) => ({ ...f, work_mode: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select work mode" /></SelectTrigger>
                    <SelectContent>
                      {workModeOpts.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Experience Level</Label>
                  <Select value={form.experience_level || ""} onValueChange={(v) => setForm((f: any) => ({ ...f, experience_level: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {expLevelOpts.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div><Label>Exp Min</Label><Input type="number" value={form.experience_min ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, experience_min: e.target.value }))} /></div>
                <div><Label>Exp Max</Label><Input type="number" value={form.experience_max ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, experience_max: e.target.value }))} /></div>
                <div><Label>Salary Min</Label><Input type="number" value={form.salary_min ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, salary_min: e.target.value }))} /></div>
                <div><Label>Salary Max</Label><Input type="number" value={form.salary_max ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, salary_max: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Currency</Label>
                  <Input value={form.salary_currency || "INR"} onChange={(e) => setForm((f: any) => ({ ...f, salary_currency: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Application Deadline</Label>
                <Input
                  type="date"
                  value={form.expires_at || ""}
                  onChange={(e) => setForm((f: any) => ({ ...f, expires_at: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Job is auto-deleted when this date passes. Leave empty to auto-delete 30 days after posting.
                </p>
              </div>
              <div>
                <Label>Upload JD PDF</Label>
                <Input type="file" accept=".pdf" onChange={handleFileUpload} />
                {form.jd_pdf_url && <p className="text-xs text-muted-foreground mt-1">Uploaded: {form.jd_pdf_url}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Skills & Domains */}
          <Card>
            <CardHeader><CardTitle>Skills & Domains</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <Label>Skills</Label>
                  <InlineCreateDialog
                    label="New Skill"
                    onCreate={(v) => upsertSkill.mutateAsync(v as any)}
                    onCreated={(s) => setSelectedSkills((prev) => prev.includes(s.id) ? prev : [...prev, s.id])}
                  />
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedSkills.map(id => {
                    const skill = allSkills.find((s: any) => s.id === id);
                    return skill ? <Badge key={id} variant="secondary" className="gap-1">{skill.name}<X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedSkills(prev => prev.filter(s => s !== id))} /></Badge> : null;
                  })}
                </div>
                <Select onValueChange={(v) => { if (!selectedSkills.includes(v)) setSelectedSkills(prev => [...prev, v]); }}>
                  <SelectTrigger><SelectValue placeholder="Add skill..." /></SelectTrigger>
                  <SelectContent>{allSkills.filter((s: any) => !selectedSkills.includes(s.id)).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label>Domains</Label>
                  <InlineCreateDialog
                    label="New Domain"
                    onCreate={(v) => upsertDomain.mutateAsync(v as any)}
                    onCreated={(d) => setSelectedDomains((prev) => prev.includes(d.id) ? prev : [...prev, d.id])}
                  />
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedDomains.map(id => {
                    const domain = allDomains.find((d: any) => d.id === id);
                    return domain ? <Badge key={id} variant="secondary" className="gap-1">{domain.name}<X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedDomains(prev => prev.filter(d => d !== id))} /></Badge> : null;
                  })}
                </div>
                <Select onValueChange={(v) => { if (!selectedDomains.includes(v)) setSelectedDomains(prev => [...prev, v]); }}>
                  <SelectTrigger><SelectValue placeholder="Add domain..." /></SelectTrigger>
                  <SelectContent>{allDomains.filter((d: any) => !selectedDomains.includes(d.id)).map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader><CardTitle>Location</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedCities.map(id => {
                  const city = (allLocations as any[]).find((c: any) => c.id === id);
                  const label = city ? city.name : id.slice(0, 8);
                  return <Badge key={id} variant="secondary" className="gap-1">{label}<X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCities(prev => prev.filter(c => c !== id))} /></Badge>;
                })}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center justify-between">
                    <Label>Country</Label>
                    <InlineCreateDialog
                      label="New Country"
                      fields={[
                        { key: "name", label: "Name", required: true },
                        { key: "iso_code", label: "ISO Code", required: true, maxLength: 3, uppercase: true, placeholder: "IND" },
                      ]}
                      onCreate={(v) => upsertCountry.mutateAsync(v as any)}
                      onCreated={(c) => { setSelectedCountry(c.id); setSelectedState(""); }}
                    />
                  </div>
                  <Select value={selectedCountry} onValueChange={(v) => { setSelectedCountry(v); setSelectedState(""); }}>
                    <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>{countries.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label>State (optional)</Label>
                    {selectedCountry && (
                      <InlineCreateDialog
                        label="New State"
                        fields={[{ key: "name", label: "Name", required: true }]}
                        onCreate={(v) => upsertState.mutateAsync({ name: v.name, country_id: selectedCountry })}
                        onCreated={(s) => setSelectedState(s.id)}
                      />
                    )}
                  </div>
                  <Select value={selectedState} onValueChange={setSelectedState} disabled={!selectedCountry}>
                    <SelectTrigger><SelectValue placeholder={selectedCountry ? "Select state" : "Pick country"} /></SelectTrigger>
                    <SelectContent>{states.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label>City</Label>
                    {selectedCountry && (
                      <InlineCreateDialog
                        label="New City"
                        fields={[{ key: "name", label: "Name", required: true }]}
                        onCreate={(v) => upsertCity.mutateAsync({ name: v.name, state_id: selectedState || null, country_id: selectedCountry })}
                        onCreated={(c) => setSelectedCities((prev) => prev.includes(c.id) ? prev : [...prev, c.id])}
                      />
                    )}
                  </div>
                  <Select disabled={!selectedCountry} onValueChange={(v) => { if (!selectedCities.includes(v)) setSelectedCities(prev => [...prev, v]); }}>
                    <SelectTrigger><SelectValue placeholder={selectedCountry ? "Add city" : "Pick country"} /></SelectTrigger>
                    <SelectContent>{availableCities.filter((c: any) => !selectedCities.includes(c.id)).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Application */}
          <Card>
            <CardHeader><CardTitle>Application</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Application Type</Label>
                  <Select value={appType} onValueChange={(v: any) => setAppType(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="url">URL</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{appType === "url" ? "Application URL" : "Application Email"}</Label>
                  <Input value={appValue} onChange={(e) => setAppValue(e.target.value)} placeholder={appType === "url" ? "https://..." : "hr@company.com"} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DESCRIPTION TAB — single rich text editor, no categories */}
        <TabsContent value="description">
          <Card>
            <CardHeader><CardTitle>Job Description</CardTitle></CardHeader>
            <CardContent>
              <BlogEditor content={description} onChange={setDescription} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO TAB */}
        <TabsContent value="seo">
          <Card>
            <CardHeader><CardTitle>SEO</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Meta Title</Label><Input value={seo.meta_title || ""} onChange={(e) => { markTouched('meta_title'); setSeo((s: any) => ({ ...s, meta_title: e.target.value })); }} /></div>
              <div><Label>Meta Description</Label><Textarea value={seo.meta_description || ""} onChange={(e) => { markTouched('meta_description'); setSeo((s: any) => ({ ...s, meta_description: e.target.value })); }} /></div>
              <div><Label>OG Title</Label><Input value={seo.og_title || ""} onChange={(e) => { markTouched('og_title'); setSeo((s: any) => ({ ...s, og_title: e.target.value })); }} /></div>
              <div><Label>OG Description</Label><Textarea value={seo.og_description || ""} onChange={(e) => { markTouched('og_description'); setSeo((s: any) => ({ ...s, og_description: e.target.value })); }} /></div>
              <div><Label>OG Image URL</Label><Input value={seo.og_image_url || ""} onChange={(e) => setSeo((s: any) => ({ ...s, og_image_url: e.target.value }))} /></div>
              <div><Label>Canonical URL</Label><Input value={seo.canonical_url || ""} onChange={(e) => setSeo((s: any) => ({ ...s, canonical_url: e.target.value }))} /></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={handleCancel}>Cancel</Button>
        {isLastTab ? (
          <Button onClick={handleSave} disabled={saveJob.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {saveJob.isPending ? "Saving..." : "Save Job"}
          </Button>
        ) : (
          <Button onClick={goNext}>Next</Button>
        )}
      </div>
    </div>
  );
}
