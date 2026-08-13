
-- === JOB TABLES ===
COMMENT ON TABLE public.jobs IS '[JOBS] Main job listings table';
COMMENT ON TABLE public.companies IS '[JOBS] Companies that post jobs';
COMMENT ON TABLE public.company_culture IS '[JOBS] Culture points for companies';
COMMENT ON TABLE public.locations IS '[JOBS] Job locations (city/state/country)';
COMMENT ON TABLE public.skills IS '[JOBS] Skills required for jobs';
COMMENT ON TABLE public.domains IS '[JOBS] Job domains/sectors';
COMMENT ON TABLE public.benefits IS '[JOBS] Job benefits';
COMMENT ON TABLE public.eligibility_criteria IS '[JOBS] Eligibility criteria for jobs';
COMMENT ON TABLE public.job_locations IS '[JOBS] Junction: jobs ↔ locations';
COMMENT ON TABLE public.job_skills IS '[JOBS] Junction: jobs ↔ skills';
COMMENT ON TABLE public.job_domains IS '[JOBS] Junction: jobs ↔ domains';
COMMENT ON TABLE public.job_benefits IS '[JOBS] Junction: jobs ↔ benefits';

-- === BLOG TABLES ===
COMMENT ON TABLE public.blogs IS '[BLOGS] Blog posts';
COMMENT ON TABLE public.authors IS '[BLOGS] Blog authors';
COMMENT ON TABLE public.tags IS '[BLOGS] Blog tags';
COMMENT ON TABLE public.blog_tags IS '[BLOGS] Junction: blogs ↔ tags';

-- === RESOURCE TABLES ===
COMMENT ON TABLE public.resources IS '[RESOURCES] Career resources (guides, templates, reports)';

-- === SITE TABLES ===
COMMENT ON TABLE public.featured_content IS '[SITE] Featured carousel/banner content';
COMMENT ON TABLE public.static_routes IS '[SITE] Static routes for sitemap generation';
