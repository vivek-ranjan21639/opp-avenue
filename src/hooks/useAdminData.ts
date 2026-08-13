import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { clearJobDraftCache, clearJobDraftCaches } from '@/hooks/useAutoSaveDraft';

// ---- Generic helpers ----
const fetchAll = async (table: string, orderBy = 'created_at', ascending = false) => {
  const { data, error } = await (supabase.from(table as any) as any)
    .select('*')
    .order(orderBy, { ascending });
  if (error) throw error;
  return data || [];
};

// ---- Dashboard Stats ----
export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [jobs, blogs, resources, companies] = await Promise.all([
        supabase.from('j_jobs').select('id, status'),
        supabase.from('b_blogs').select('id, status'),
        supabase.from('r_resources').select('id'),
        supabase.from('j_companies').select('id'),
      ]);

      const jobData = jobs.data || [];
      const liveJobs = jobData.filter((j: any) => j.status === 'published').length;
      const draftJobs = jobData.filter((j: any) => j.status === 'draft').length;

      const blogData = blogs.data || [];
      const publishedBlogs = blogData.filter((b: any) => b.status === 'published').length;

      return {
        liveJobs,
        draftJobs,
        totalBlogs: blogData.length,
        publishedBlogs,
        totalResources: resources.data?.length || 0,
        totalCompanies: companies.data?.length || 0,
      };
    },
  });
};

// ---- Companies ----
export const useAdminCompanies = () => useQuery({
  queryKey: ['admin-companies'],
  queryFn: async () => {
    const { data, error } = await supabase.from('j_companies').select('*').order('name');
    if (error) throw error;
    return data || [];
  },
});

export const useUpsertCompany = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (company: any) => {
      const { data, error } = company.id
        ? await supabase.from('j_companies').update(company).eq('id', company.id).select().single()
        : await supabase.from('j_companies').insert(company).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-companies'] }); toast({ title: 'Company saved' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
};

export const useDeleteCompany = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('j_companies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-companies'] }); toast({ title: 'Company deleted' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
};

// ---- Sources ----
export const useAdminSources = () => useQuery({
  queryKey: ['admin-sources'],
  queryFn: async () => {
    const { data, error } = await supabase.from('j_sources').select('*, j_companies(id, name)').order('name');
    if (error) throw error;
    return data || [];
  },
});

export const useUpsertSource = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (source: any) => {
      const { data, error } = source.id
        ? await supabase.from('j_sources').update(source).eq('id', source.id).select().single()
        : await supabase.from('j_sources').insert(source).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-sources'] }); toast({ title: 'Source saved' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
};

export const useDeleteSource = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('j_sources').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-sources'] }); toast({ title: 'Source deleted' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
};

// ---- Domains ----
export const useAdminDomains = () => useQuery({
  queryKey: ['admin-domains'],
  queryFn: async () => {
    const { data, error } = await supabase.from('j_domains').select('*').order('name');
    if (error) throw error;
    return data || [];
  },
});

export const useUpsertDomain = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (d: { id?: string; name: string; slug: string }) => {
      const { data, error } = d.id
        ? await supabase.from('j_domains').update({ name: d.name, slug: d.slug }).eq('id', d.id).select().single()
        : await supabase.from('j_domains').insert({ name: d.name, slug: d.slug }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-domains'] }); toast({ title: 'Domain saved' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
};

export const useDeleteDomain = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('j_domains').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-domains'] }); toast({ title: 'Domain deleted' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
};

// ---- Skills ----
export const useAdminSkills = () => useQuery({
  queryKey: ['admin-skills'],
  queryFn: async () => {
    const { data, error } = await supabase.from('j_skills').select('*').order('name');
    if (error) throw error;
    return data || [];
  },
});

export const useUpsertSkill = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (s: { id?: string; name: string; slug: string }) => {
      const { data, error } = s.id
        ? await supabase.from('j_skills').update({ name: s.name, slug: s.slug }).eq('id', s.id).select().single()
        : await supabase.from('j_skills').insert({ name: s.name, slug: s.slug }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-skills'] }); toast({ title: 'Skill saved' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
};

export const useDeleteSkill = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('j_skills').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-skills'] }); toast({ title: 'Skill deleted' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
};

// ---- Blog Categories CRUD ----
export const useUpsertBlogCategory = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (c: { id?: string; name: string; slug: string }) => {
      const { data, error } = c.id
        ? await supabase.from('b_categories').update({ name: c.name, slug: c.slug }).eq('id', c.id).select().single()
        : await supabase.from('b_categories').insert({ name: c.name, slug: c.slug }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-blog-categories'] }); toast({ title: 'Category saved' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
};

export const useDeleteBlogCategory = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('b_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-blog-categories'] }); toast({ title: 'Category deleted' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
};

// ---- Blog Tags CRUD ----
export const useUpsertBlogTag = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (t: { id?: string; name: string; slug: string }) => {
      const { data, error } = t.id
        ? await supabase.from('b_tags').update({ name: t.name, slug: t.slug }).eq('id', t.id).select().single()
        : await supabase.from('b_tags').insert({ name: t.name, slug: t.slug }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-blog-tags'] }); toast({ title: 'Tag saved' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
};

export const useDeleteBlogTag = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('b_tags').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-blog-tags'] }); toast({ title: 'Tag deleted' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
};

// ---- Blog Authors CRUD ----
export const useUpsertBlogAuthor = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (a: { id?: string; name: string; email?: string | null; show_email?: boolean; bio?: string | null; profile_image?: string | null; profile_link?: string | null }) => {
      const payload: any = { name: a.name, email: a.email ?? null, show_email: a.show_email ?? false, bio: a.bio ?? null, profile_image: a.profile_image ?? null, profile_link: a.profile_link ?? null };
      const { data, error } = a.id
        ? await supabase.from('b_authors').update(payload).eq('id', a.id).select().single()
        : await supabase.from('b_authors').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-blog-authors'] }); toast({ title: 'Author saved' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
};

export const useDeleteBlogAuthor = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('b_authors').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-blog-authors'] }); toast({ title: 'Author deleted' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
};

// ---- Resource Categories / Tags CRUD ----
export const useUpsertResourceCategory = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (c: { id?: string; name: string; slug: string }) => {
      const { data, error } = c.id
        ? await supabase.from('r_categories').update({ name: c.name, slug: c.slug }).eq('id', c.id).select().single()
        : await supabase.from('r_categories').insert({ name: c.name, slug: c.slug }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-resource-categories'] }); toast({ title: 'Category saved' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
};

export const useDeleteResourceCategory = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('r_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-resource-categories'] }); toast({ title: 'Category deleted' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
};

export const useUpsertResourceTag = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (t: { id?: string; name: string; slug: string; group_id?: string | null }) => {
      const payload: any = { name: t.name, slug: t.slug };
      if (t.group_id !== undefined) payload.group_id = t.group_id;
      const { data, error } = t.id
        ? await (supabase as any).from('r_tags').update(payload).eq('id', t.id).select().single()
        : await (supabase as any).from('r_tags').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-resource-tags'] });
      qc.invalidateQueries({ queryKey: ['admin-resource-tag-groups'] });
      qc.invalidateQueries({ queryKey: ['resource-tag-groups'] });
      toast({ title: 'Tag saved' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
};

export const useDeleteResourceTag = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('r_tags').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-resource-tags'] });
      qc.invalidateQueries({ queryKey: ['admin-resource-tag-groups'] });
      qc.invalidateQueries({ queryKey: ['resource-tag-groups'] });
      toast({ title: 'Tag deleted' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
};

// ---- Resource tag groups (admin) ----
export const useAdminResourceTagGroups = (categoryId?: string | null) => useQuery({
  queryKey: ['admin-resource-tag-groups', categoryId],
  enabled: !!categoryId,
  queryFn: async () => {
    const { data, error } = await (supabase as any)
      .from('r_tag_groups')
      .select('id, category_id, name, slug, display_order')
      .eq('category_id', categoryId)
      .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
  },
});

export const useUpsertResourceTagGroup = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (g: { id?: string; category_id: string; name: string; slug: string; display_order?: number }) => {
      const payload: any = { category_id: g.category_id, name: g.name, slug: g.slug, display_order: g.display_order ?? 0 };
      const { data, error } = g.id
        ? await (supabase as any).from('r_tag_groups').update(payload).eq('id', g.id).select().single()
        : await (supabase as any).from('r_tag_groups').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-resource-tag-groups'] });
      qc.invalidateQueries({ queryKey: ['resource-tag-groups'] });
      toast({ title: 'Tag group saved' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
};

export const useDeleteResourceTagGroup = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('r_tag_groups').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-resource-tag-groups'] });
      qc.invalidateQueries({ queryKey: ['resource-tag-groups'] });
      toast({ title: 'Tag group deleted' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
};

// ---- Create resource tag inline ----
// (slugify defined below)

// ---- Locations ----
export const useAdminCountries = () => useQuery({
  queryKey: ['admin-countries'],
  queryFn: async () => {
    const { data, error } = await supabase.from('j_countries').select('*').order('name');
    if (error) throw error;
    return data || [];
  },
});

export const useAdminStates = (countryId?: string) => useQuery({
  queryKey: ['admin-states', countryId],
  queryFn: async () => {
    let q = supabase.from('j_states').select('*').order('name');
    if (countryId) q = q.eq('country_id', countryId);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  },
});

export const useAdminCities = (stateId?: string) => useQuery({
  queryKey: ['admin-cities', stateId],
  queryFn: async () => {
    let q = supabase.from('j_cities').select('*, j_states(id, name, country_id), j_countries:country_id(id, name)').order('name');
    if (stateId) q = q.eq('state_id', stateId);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  },
});

// All cities with state + country for display
export const useAdminAllLocations = () => useQuery({
  queryKey: ['admin-all-locations'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('j_cities')
      .select('id, name, state_id, country_id, j_states(id, name), j_countries:country_id(id, name)')
      .order('name');
    if (error) throw error;
    return data || [];
  },
});

// Upsert a country by name (case-insensitive); requires iso_code
export const useUpsertCountry = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ name, iso_code }: { name: string; iso_code: string }) => {
      const trimmed = name.trim();
      const { data: existing } = await supabase.from('j_countries').select('*').ilike('name', trimmed).maybeSingle();
      if (existing) return existing;
      const { data, error } = await supabase.from('j_countries').insert({ name: trimmed, iso_code: iso_code.trim().toUpperCase() }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-countries'] }); },
    onError: (e: any) => toast({ title: 'Error saving country', description: e.message, variant: 'destructive' }),
  });
};

export const useDeleteCountry = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('j_countries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-countries'] });
      qc.invalidateQueries({ queryKey: ['admin-states'] });
      qc.invalidateQueries({ queryKey: ['admin-cities'] });
      qc.invalidateQueries({ queryKey: ['admin-all-locations'] });
      toast({ title: 'Country deleted' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
};

export const useUpsertState = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ name, country_id }: { name: string; country_id: string }) => {
      const trimmed = name.trim();
      const { data: existing } = await supabase
        .from('j_states').select('*').eq('country_id', country_id).ilike('name', trimmed).maybeSingle();
      if (existing) return existing;
      const { data, error } = await supabase.from('j_states').insert({ name: trimmed, country_id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-states'] }); },
    onError: (e: any) => toast({ title: 'Error saving state', description: e.message, variant: 'destructive' }),
  });
};

export const useDeleteState = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('j_states').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-states'] });
      qc.invalidateQueries({ queryKey: ['admin-cities'] });
      qc.invalidateQueries({ queryKey: ['admin-all-locations'] });
      toast({ title: 'State deleted' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
};

export const useUpsertCity = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ name, state_id, country_id }: { name: string; state_id: string | null; country_id: string }) => {
      const trimmed = name.trim();
      let query = supabase.from('j_cities').select('*').eq('country_id', country_id).ilike('name', trimmed);
      query = state_id ? query.eq('state_id', state_id) : query.is('state_id', null);
      const { data: existing } = await query.maybeSingle();
      if (existing) return existing;
      const { data, error } = await supabase.from('j_cities').insert({ name: trimmed, state_id, country_id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-cities'] });
      qc.invalidateQueries({ queryKey: ['admin-all-locations'] });
    },
    onError: (e: any) => toast({ title: 'Error saving city', description: e.message, variant: 'destructive' }),
  });
};

export const useDeleteCity = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('j_cities').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-cities'] });
      qc.invalidateQueries({ queryKey: ['admin-all-locations'] });
      toast({ title: 'City deleted' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
};

// Detect duplicates across draft and live published.
// `forStage` filters which jobs to compute duplicates FOR; comparisons always span all draft+live.
export const useJobDuplicates = (forStage?: 'manual_draft' | 'bulk_upload' | 'all') => useQuery({
  queryKey: ['admin-job-duplicates', forStage || 'all'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('j_jobs')
      .select('id, title, normalized_title, status, workflow_stage, company_id, job_number, created_at, j_companies(id, name)')
      .in('status', ['draft', 'published']);
    if (error) throw error;
    const all = (data || []) as any[];
    const norm = (s: string | null | undefined) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const map: Record<string, any[]> = {};
    for (const j of all) {
      const key = `${norm(j.normalized_title || j.title)}::${j.company_id || ''}`;
      if (!key.startsWith('::')) (map[key] = map[key] || []).push(j);
    }
    const labelFor = (j: any): 'live' | 'draft' =>
      j.status === 'published' ? 'live' : 'draft';
    const dupesByJob: Record<string, { id: string; title: string; status: string; location: 'live' | 'draft'; job_number: number | null; created_at: string | null }[]> = {};
    for (const j of all) {
      if (j.status !== 'draft') continue;
      if (forStage && forStage !== 'all' && j.workflow_stage !== forStage) continue;
      const key = `${norm(j.normalized_title || j.title)}::${j.company_id || ''}`;
      const siblings = (map[key] || []).filter((s) => s.id !== j.id);
      if (siblings.length > 0) {
        dupesByJob[j.id] = siblings.map((s) => ({ id: s.id, title: s.title, status: s.status, location: labelFor(s), job_number: s.job_number ?? null, created_at: s.created_at ?? null }));
      }
    }
    return dupesByJob;
  },
});

// ---- Jobs (admin) ----
export const useAdminJobs = (status?: string, workflowStage?: 'manual_draft' | 'bulk_upload') => useQuery({
  queryKey: ['admin-jobs', status, workflowStage],
  queryFn: async () => {
    let q = supabase.from('j_jobs').select(`
      *,
      j_companies(id, name, logo_url),
      j_job_skills_map(j_skills(id, name)),
      j_job_domains_map(j_domains(id, name)),
      j_job_locations_map(j_cities(id, name))
    `).order('created_at', { ascending: false });
    if (status) q = q.eq('status', status as any);
    if (workflowStage) q = (q as any).eq('workflow_stage', workflowStage);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  },
});

export const useAdminJob = (id: string | undefined) => useQuery({
  queryKey: ['admin-job', id],
  queryFn: async () => {
    if (!id) return null;
    const { data, error } = await supabase.from('j_jobs').select(`
      *,
      j_companies(id, name),
      j_job_skills_map(skill_id, j_skills(id, name)),
      j_job_domains_map(domain_id, j_domains(id, name)),
      j_job_locations_map(city_id, j_cities(id, name, state_id, country_id)),
      j_job_applications(*),
      j_job_seo(*)
    `).eq('id', id).single();
    if (error) throw error;
    return data;
  },
  enabled: !!id,
});

export const useSaveJob = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ job, skills, domains, cities, application, seo }: {
      job: any;
      skills: string[];
      domains: string[];
      cities: string[];
      application?: any;
      seo?: any;
    }) => {
      const jobPayload = { ...job };
      delete jobPayload.id;
      delete jobPayload.salary_period;
      delete jobPayload.salary_type;
      
      const { data: savedJob, error: jobError } = job.id
        ? await supabase.from('j_jobs').update(jobPayload).eq('id', job.id).select().single()
        : await supabase.from('j_jobs').insert(jobPayload).select().single();
      if (jobError) throw jobError;

      const jobId = savedJob.id;

      await supabase.from('j_job_skills_map').delete().eq('job_id', jobId);
      if (skills.length > 0) {
        await supabase.from('j_job_skills_map').insert(skills.map(s => ({ job_id: jobId, skill_id: s })));
      }

      await supabase.from('j_job_domains_map').delete().eq('job_id', jobId);
      if (domains.length > 0) {
        await supabase.from('j_job_domains_map').insert(domains.map(d => ({ job_id: jobId, domain_id: d })));
      }

      await supabase.from('j_job_locations_map').delete().eq('job_id', jobId);
      if (cities.length > 0) {
        await supabase.from('j_job_locations_map').insert(cities.map(c => ({ job_id: jobId, city_id: c })));
      }

      if (application) {
        await supabase.from('j_job_applications').delete().eq('job_id', jobId);
        await supabase.from('j_job_applications').insert({ ...application, job_id: jobId });
      }

      if (seo) {
        const { data: existingSeo } = await supabase.from('j_job_seo').select('id').eq('job_id', jobId).maybeSingle();
        if (existingSeo) {
          await supabase.from('j_job_seo').update(seo).eq('job_id', jobId);
        } else {
          await supabase.from('j_job_seo').insert({ ...seo, job_id: jobId });
        }
      }

      return savedJob;
    },
    onSuccess: (savedJob: any) => {
      qc.invalidateQueries({ queryKey: ['admin-jobs'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      qc.invalidateQueries({ queryKey: ['admin-job-duplicates'] });
      if (savedJob?.id) qc.invalidateQueries({ queryKey: ['admin-job', savedJob.id] });
      toast({ title: 'Job saved successfully' });
    },
    onError: (e: any) => toast({ title: 'Error saving job', description: e.message, variant: 'destructive' }),
  });
};

export const useDeleteJob = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('j_jobs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      clearJobDraftCache(id);
      qc.removeQueries({ queryKey: ['admin-job', id] });
      qc.removeQueries({ queryKey: ['job', id] });
      qc.removeQueries({ queryKey: ['recommended-jobs', id] });
      qc.invalidateQueries({ queryKey: ['admin-jobs'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      qc.invalidateQueries({ queryKey: ['admin-job-duplicates'] });
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['recent-jobs'] });
      qc.invalidateQueries({ queryKey: ['featured-content'] });
      toast({ title: 'Job deleted' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
};

// ---- Blogs (admin) ----
export const useAdminBlogs = () => useQuery({
  queryKey: ['admin-blogs'],
  queryFn: async () => {
    const { data, error } = await supabase.from('b_blogs').select(`
      *,
      b_categories(id, name),
      b_blog_authors_map(b_authors(id, name)),
      b_blog_tags_map(b_tags(id, name))
    `).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
});

export const useAdminBlog = (id: string | undefined) => useQuery({
  queryKey: ['admin-blog', id],
  queryFn: async () => {
    if (!id) return null;
    const { data, error } = await supabase.from('b_blogs').select(`
      *,
      b_categories(id, name),
      b_blog_authors_map(author_id, b_authors(id, name)),
      b_blog_tags_map(tag_id, b_tags(id, name)),
      b_blog_seo(*)
    `).eq('id', id).single();
    if (error) throw error;
    return data;
  },
  enabled: !!id,
});

export const useSaveBlog = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ blog, authors, tags, seo }: {
      blog: any;
      authors: string[];
      tags: string[];
      seo?: any;
    }) => {
      const blogPayload = { ...blog };
      const blogId = blogPayload.id;
      delete blogPayload.id;

      const { data: saved, error } = blogId
        ? await supabase.from('b_blogs').update(blogPayload).eq('id', blogId).select().single()
        : await supabase.from('b_blogs').insert(blogPayload).select().single();
      if (error) throw error;

      const savedId = saved.id;

      await supabase.from('b_blog_authors_map').delete().eq('blog_id', savedId);
      if (authors.length > 0) {
        await supabase.from('b_blog_authors_map').insert(authors.map(a => ({ blog_id: savedId, author_id: a })));
      }

      await supabase.from('b_blog_tags_map').delete().eq('blog_id', savedId);
      if (tags.length > 0) {
        await supabase.from('b_blog_tags_map').insert(tags.map(t => ({ blog_id: savedId, tag_id: t })));
      }

      if (seo) {
        const { data: existingSeo } = await supabase.from('b_blog_seo').select('id').eq('blog_id', savedId).maybeSingle();
        if (existingSeo) {
          await supabase.from('b_blog_seo').update(seo).eq('blog_id', savedId);
        } else {
          await supabase.from('b_blog_seo').insert({ ...seo, blog_id: savedId });
        }
      }

      return saved;
    },
    onSuccess: (saved: any) => {
      qc.invalidateQueries({ queryKey: ['admin-blogs'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      if (saved?.id) qc.invalidateQueries({ queryKey: ['admin-blog', saved.id] });
      toast({ title: 'Blog saved' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
};

export const useDeleteBlog = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('b_blogs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-blogs'] });
      toast({ title: 'Blog deleted' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
};

// Blog helpers
export const useAdminBlogCategories = () => useQuery({
  queryKey: ['admin-blog-categories'],
  queryFn: async () => {
    const { data, error } = await supabase.from('b_categories').select('*').order('name');
    if (error) throw error;
    return data || [];
  },
});

export const useAdminBlogTags = () => useQuery({
  queryKey: ['admin-blog-tags'],
  queryFn: async () => {
    const { data, error } = await supabase.from('b_tags').select('*').order('name');
    if (error) throw error;
    return data || [];
  },
});

export const useAdminBlogAuthors = () => useQuery({
  queryKey: ['admin-blog-authors'],
  queryFn: async () => {
    const { data, error } = await supabase.from('b_authors').select('*').order('name');
    if (error) throw error;
    return data || [];
  },
});

// ---- Resources (admin) ----
export const useAdminResources = () => useQuery({
  queryKey: ['admin-resources'],
  queryFn: async () => {
    const { data, error } = await supabase.from('r_resources').select(`
      *,
      r_categories(id, name),
      r_resource_tags_map(r_tags(id, name))
    `).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
});

export const useSaveResource = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ resource, tags, seo }: {
      resource: any;
      tags: string[];
      seo?: any;
    }) => {
      const payload = { ...resource };
      const resId = payload.id;
      delete payload.id;

      const { data: saved, error } = resId
        ? await supabase.from('r_resources').update(payload).eq('id', resId).select().single()
        : await supabase.from('r_resources').insert(payload).select().single();
      if (error) throw error;

      const savedId = saved.id;

      await supabase.from('r_resource_tags_map').delete().eq('resource_id', savedId);
      if (tags.length > 0) {
        await supabase.from('r_resource_tags_map').insert(tags.map(t => ({ resource_id: savedId, tag_id: t })));
      }

      if (seo) {
        const { data: existingSeo } = await supabase.from('r_resource_seo').select('id').eq('resource_id', savedId).maybeSingle();
        if (existingSeo) {
          await supabase.from('r_resource_seo').update(seo).eq('resource_id', savedId);
        } else {
          await supabase.from('r_resource_seo').insert({ ...seo, resource_id: savedId });
        }
      }

      return saved;
    },
    onSuccess: (saved: any) => {
      qc.invalidateQueries({ queryKey: ['admin-resources'] });
      if (saved?.id) qc.invalidateQueries({ queryKey: ['admin-resource', saved.id] });
      toast({ title: 'Resource saved' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
};

export const useDeleteResource = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('r_resources').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-resources'] });
      toast({ title: 'Resource deleted' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
};

export const useAdminResourceCategories = () => useQuery({
  queryKey: ['admin-resource-categories'],
  queryFn: async () => {
    const { data, error } = await supabase.from('r_categories').select('*').order('name');
    if (error) throw error;
    return data || [];
  },
});

export const useAdminResourceTags = () => useQuery({
  queryKey: ['admin-resource-tags'],
  queryFn: async () => {
    const { data, error } = await (supabase as any).from('r_tags').select('id, name, slug, group_id').order('name');
    if (error) throw error;
    return data || [];
  },
});

// ---- Create inline taxonomy items ----
function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export const useCreateBlogCategory = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.from('b_categories').insert({ name, slug: slugify(name) }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-blog-categories'] }); toast({ title: 'Category created' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
};

export const useCreateBlogTag = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.from('b_tags').insert({ name, slug: slugify(name) }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-blog-tags'] }); toast({ title: 'Tag created' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
};

export const useCreateBlogAuthor = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.from('b_authors').insert({ name }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-blog-authors'] }); toast({ title: 'Author created' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
};

export const useCreateResourceCategory = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.from('r_categories').insert({ name, slug: slugify(name) }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-resource-categories'] }); toast({ title: 'Category created' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
};

// ---- Storage Path Helpers ----
export function buildStoragePath(
  entity: 'jobs' | 'blogs' | 'resources' | 'entities',
  entityId: string,
  subfolder: string,
  fileType: string,
  variant: string,
  originalFileName: string
): string {
  const ext = originalFileName.split('.').pop() || 'bin';
  const name = variant ? `${fileType}_${entityId}_${variant}.${ext}` : `${fileType}_${entityId}.${ext}`;
  return `${entity}/${entityId}/${subfolder}/${name}`;
}

// ---- File Upload ----
export const useFileUpload = () => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ file, path, bucket = 'content' }: { file: File; path: string; bucket?: string }) => {
      const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
      return urlData.publicUrl;
    },
    onError: (e: any) => toast({ title: 'Upload failed', description: e.message, variant: 'destructive' }),
  });
};

// ---- Generic bulk operations ----
type SupabaseTable =
  | 'j_jobs' | 'j_sources' | 'j_companies'
  | 'j_skills' | 'j_domains' | 'j_cities' | 'j_states' | 'j_countries'
  | 'b_blogs' | 'b_categories' | 'b_tags' | 'b_authors'
  | 'r_resources' | 'r_categories' | 'r_tags'
  | 'j_featured';

export const useBulkDelete = (table: SupabaseTable, invalidateKeys: string[][]) => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length === 0) return;
      const { error } = await (supabase.from(table as any) as any).delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_data, ids) => {
      if (table === 'j_jobs') {
        clearJobDraftCaches(ids);
        ids.forEach((id) => qc.removeQueries({ queryKey: ['admin-job', id] }));
        ids.forEach((id) => qc.removeQueries({ queryKey: ['job', id] }));
        ids.forEach((id) => qc.removeQueries({ queryKey: ['recommended-jobs', id] }));
        qc.invalidateQueries({ queryKey: ['jobs'] });
        qc.invalidateQueries({ queryKey: ['recent-jobs'] });
        qc.invalidateQueries({ queryKey: ['featured-content'] });
      }
      invalidateKeys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
      toast({ title: `${ids.length} item${ids.length === 1 ? '' : 's'} deleted` });
    },
    onError: (e: any) => toast({ title: 'Bulk delete failed', description: e.message, variant: 'destructive' }),
  });
};

export const useBulkUpdate = (table: SupabaseTable, invalidateKeys: string[][]) => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ ids, patch }: { ids: string[]; patch: Record<string, any> }) => {
      if (ids.length === 0) return;
      const { error } = await (supabase.from(table as any) as any).update(patch).in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      invalidateKeys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
      toast({ title: `${vars.ids.length} item${vars.ids.length === 1 ? '' : 's'} updated` });
    },
    onError: (e: any) => toast({ title: 'Bulk update failed', description: e.message, variant: 'destructive' }),
  });
};
