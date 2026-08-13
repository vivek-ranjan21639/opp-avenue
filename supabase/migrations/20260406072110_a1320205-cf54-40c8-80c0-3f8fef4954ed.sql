
-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE public.job_type_enum AS ENUM ('full_time','part_time','contract','internship','freelance','temporary');
CREATE TYPE public.work_mode_enum AS ENUM ('remote','onsite','hybrid');
CREATE TYPE public.experience_level_enum AS ENUM ('entry','mid','senior','lead','executive');
CREATE TYPE public.salary_period_enum AS ENUM ('hourly','daily','weekly','monthly','yearly');
CREATE TYPE public.salary_type_enum AS ENUM ('fixed','range','negotiable');
CREATE TYPE public.content_status_enum AS ENUM ('draft','published','archived','expired');
CREATE TYPE public.application_type_enum AS ENUM ('url','email');
CREATE TYPE public.source_type_enum AS ENUM ('scraper','api','manual','rss');
CREATE TYPE public.resource_type_enum AS ENUM ('guide','template','report','tool','video','article');
CREATE TYPE public.storage_type_enum AS ENUM ('uploaded','embedded','external');
CREATE TYPE public.media_type_enum AS ENUM ('image','video','audio','document');
CREATE TYPE public.app_role AS ENUM ('admin','editor','viewer');

-- ============================================================
-- UTILITY: updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================
-- AUTH: profiles & user_roles
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Helper: is current user admin or editor
CREATE OR REPLACE FUNCTION public.is_admin_or_editor()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin','editor')
  );
$$;

-- Profiles RLS
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- User roles RLS
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- JOBS MODULE
-- ============================================================

-- Companies
CREATE TABLE public.j_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  website TEXT,
  description TEXT,
  social_links JSONB DEFAULT '{}',
  headquarter TEXT,
  employee_count TEXT,
  founding_year INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.j_companies ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_j_companies_updated_at BEFORE UPDATE ON public.j_companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_j_companies_name ON public.j_companies(name);
CREATE INDEX idx_j_companies_slug ON public.j_companies(slug);

-- Sources
CREATE TABLE public.j_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  base_url TEXT,
  source_type public.source_type_enum NOT NULL DEFAULT 'manual',
  company_id UUID REFERENCES public.j_companies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.j_sources ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_j_sources_updated_at BEFORE UPDATE ON public.j_sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Domains
CREATE TABLE public.j_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.j_domains ENABLE ROW LEVEL SECURITY;

-- Skills
CREATE TABLE public.j_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.j_skills ENABLE ROW LEVEL SECURITY;

-- Countries
CREATE TABLE public.j_countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  iso_code CHAR(2) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.j_countries ENABLE ROW LEVEL SECURITY;

-- States
CREATE TABLE public.j_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country_id UUID NOT NULL REFERENCES public.j_countries(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(name, country_id)
);
ALTER TABLE public.j_states ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_j_states_country ON public.j_states(country_id);

-- Cities
CREATE TABLE public.j_cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state_id UUID REFERENCES public.j_states(id) ON DELETE SET NULL,
  country_id UUID NOT NULL REFERENCES public.j_countries(id) ON DELETE CASCADE,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(name, state_id, country_id)
);
ALTER TABLE public.j_cities ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_j_cities_state ON public.j_cities(state_id);
CREATE INDEX idx_j_cities_country ON public.j_cities(country_id);

-- Jobs (main table)
CREATE TABLE public.j_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  normalized_title TEXT,
  company_id UUID REFERENCES public.j_companies(id) ON DELETE SET NULL,
  job_type public.job_type_enum NOT NULL DEFAULT 'full_time',
  work_mode public.work_mode_enum NOT NULL DEFAULT 'onsite',
  experience_min INT DEFAULT 0,
  experience_max INT,
  experience_level public.experience_level_enum,
  salary_min NUMERIC(12,2),
  salary_max NUMERIC(12,2),
  salary_currency TEXT DEFAULT 'INR',
  salary_period public.salary_period_enum DEFAULT 'yearly',
  salary_type public.salary_type_enum DEFAULT 'range',
  responsibilities JSONB DEFAULT '[]',
  must_have JSONB DEFAULT '[]',
  nice_to_have JSONB DEFAULT '[]',
  benefits JSONB DEFAULT '[]',
  jd_pdf_url TEXT,
  status public.content_status_enum NOT NULL DEFAULT 'draft',
  normalized_hash TEXT,
  posted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.j_jobs ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_j_jobs_updated_at BEFORE UPDATE ON public.j_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for j_jobs
CREATE INDEX idx_j_jobs_slug ON public.j_jobs(slug);
CREATE INDEX idx_j_jobs_company ON public.j_jobs(company_id);
CREATE INDEX idx_j_jobs_status ON public.j_jobs(status);
CREATE INDEX idx_j_jobs_job_type ON public.j_jobs(job_type);
CREATE INDEX idx_j_jobs_work_mode ON public.j_jobs(work_mode);
CREATE INDEX idx_j_jobs_experience_level ON public.j_jobs(experience_level);
CREATE INDEX idx_j_jobs_posted_at ON public.j_jobs(posted_at DESC);
CREATE INDEX idx_j_jobs_normalized_hash ON public.j_jobs(normalized_hash);
CREATE UNIQUE INDEX idx_j_jobs_unique_hash ON public.j_jobs(normalized_hash) WHERE normalized_hash IS NOT NULL;
CREATE INDEX idx_j_jobs_search ON public.j_jobs USING GIN(search_vector);

-- Auto-generate search vector
CREATE OR REPLACE FUNCTION public.j_jobs_search_vector_update()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.normalized_title, '')), 'A');
  RETURN NEW;
END;
$$;
CREATE TRIGGER j_jobs_search_update BEFORE INSERT OR UPDATE OF title, normalized_title ON public.j_jobs FOR EACH ROW EXECUTE FUNCTION public.j_jobs_search_vector_update();

-- Auto slug for jobs
CREATE OR REPLACE FUNCTION public.generate_job_slug()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := lower(regexp_replace(regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
    final_slug := base_slug;
    LOOP
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.j_jobs WHERE slug = final_slug AND id != NEW.id);
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER j_jobs_auto_slug BEFORE INSERT OR UPDATE OF title ON public.j_jobs FOR EACH ROW EXECUTE FUNCTION public.generate_job_slug();

-- Job-Domain mapping
CREATE TABLE public.j_job_domains_map (
  job_id UUID NOT NULL REFERENCES public.j_jobs(id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES public.j_domains(id) ON DELETE CASCADE,
  PRIMARY KEY (job_id, domain_id)
);
ALTER TABLE public.j_job_domains_map ENABLE ROW LEVEL SECURITY;

-- Job-Skills mapping
CREATE TABLE public.j_job_skills_map (
  job_id UUID NOT NULL REFERENCES public.j_jobs(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.j_skills(id) ON DELETE CASCADE,
  PRIMARY KEY (job_id, skill_id)
);
ALTER TABLE public.j_job_skills_map ENABLE ROW LEVEL SECURITY;

-- Job-Locations mapping
CREATE TABLE public.j_job_locations_map (
  job_id UUID NOT NULL REFERENCES public.j_jobs(id) ON DELETE CASCADE,
  city_id UUID NOT NULL REFERENCES public.j_cities(id) ON DELETE CASCADE,
  PRIMARY KEY (job_id, city_id)
);
ALTER TABLE public.j_job_locations_map ENABLE ROW LEVEL SECURITY;

-- Job-Sources mapping
CREATE TABLE public.j_job_sources_map (
  job_id UUID NOT NULL REFERENCES public.j_jobs(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES public.j_sources(id) ON DELETE CASCADE,
  external_job_id TEXT,
  source_url TEXT,
  PRIMARY KEY (job_id, source_id)
);
ALTER TABLE public.j_job_sources_map ENABLE ROW LEVEL SECURITY;

-- Job applications
CREATE TABLE public.j_job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.j_jobs(id) ON DELETE CASCADE,
  application_type public.application_type_enum NOT NULL DEFAULT 'url',
  application_url TEXT,
  application_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.j_job_applications ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_j_job_applications_job ON public.j_job_applications(job_id);

-- Job SEO
CREATE TABLE public.j_job_seo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL UNIQUE REFERENCES public.j_jobs(id) ON DELETE CASCADE,
  meta_title TEXT,
  meta_description TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image_url TEXT,
  canonical_url TEXT,
  robots TEXT DEFAULT 'index, follow',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.j_job_seo ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_j_job_seo_updated_at BEFORE UPDATE ON public.j_job_seo FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Job deduplication
CREATE TABLE public.j_job_deduplication (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.j_jobs(id) ON DELETE CASCADE,
  normalized_hash TEXT NOT NULL,
  source_id UUID REFERENCES public.j_sources(id) ON DELETE SET NULL,
  external_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.j_job_deduplication ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_j_dedup_hash ON public.j_job_deduplication(normalized_hash);

-- Raw jobs (pipeline input)
CREATE TABLE public.j_raw_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES public.j_sources(id) ON DELETE SET NULL,
  raw_title TEXT,
  raw_company TEXT,
  raw_location TEXT,
  raw_json JSONB DEFAULT '{}',
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.j_raw_jobs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_j_raw_jobs_processed ON public.j_raw_jobs(processed);
CREATE INDEX idx_j_raw_jobs_source ON public.j_raw_jobs(source_id);

-- Featured content
CREATE TABLE public.j_featured (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID,
  image_url TEXT,
  link TEXT,
  priority_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.j_featured ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_j_featured_updated_at BEFORE UPDATE ON public.j_featured FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Company-Domain mapping
CREATE TABLE public.j_company_domains_map (
  company_id UUID NOT NULL REFERENCES public.j_companies(id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES public.j_domains(id) ON DELETE CASCADE,
  PRIMARY KEY (company_id, domain_id)
);
ALTER TABLE public.j_company_domains_map ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- BLOGS MODULE
-- ============================================================

-- Authors
CREATE TABLE public.b_authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bio TEXT,
  profile_image TEXT,
  email TEXT,
  profile_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.b_authors ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_b_authors_updated_at BEFORE UPDATE ON public.b_authors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Blog Categories
CREATE TABLE public.b_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.b_categories ENABLE ROW LEVEL SECURITY;

-- Blog Tags
CREATE TABLE public.b_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.b_tags ENABLE ROW LEVEL SECURITY;

-- Blogs
CREATE TABLE public.b_blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.b_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  content TEXT,
  status public.content_status_enum NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.b_blogs ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_b_blogs_updated_at BEFORE UPDATE ON public.b_blogs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_b_blogs_slug ON public.b_blogs(slug);
CREATE INDEX idx_b_blogs_status ON public.b_blogs(status);
CREATE INDEX idx_b_blogs_category ON public.b_blogs(category_id);
CREATE INDEX idx_b_blogs_published_at ON public.b_blogs(published_at DESC);
CREATE INDEX idx_b_blogs_search ON public.b_blogs USING GIN(search_vector);

-- Blog search vector
CREATE OR REPLACE FUNCTION public.b_blogs_search_vector_update()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'B');
  RETURN NEW;
END;
$$;
CREATE TRIGGER b_blogs_search_update BEFORE INSERT OR UPDATE OF title, summary ON public.b_blogs FOR EACH ROW EXECUTE FUNCTION public.b_blogs_search_vector_update();

-- Auto slug for blogs
CREATE OR REPLACE FUNCTION public.generate_blog_slug()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := lower(regexp_replace(regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
    final_slug := base_slug;
    LOOP
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.b_blogs WHERE slug = final_slug AND id != NEW.id);
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER b_blogs_auto_slug BEFORE INSERT OR UPDATE OF title ON public.b_blogs FOR EACH ROW EXECUTE FUNCTION public.generate_blog_slug();

-- Blog-Author mapping
CREATE TABLE public.b_blog_authors_map (
  blog_id UUID NOT NULL REFERENCES public.b_blogs(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.b_authors(id) ON DELETE CASCADE,
  PRIMARY KEY (blog_id, author_id)
);
ALTER TABLE public.b_blog_authors_map ENABLE ROW LEVEL SECURITY;

-- Blog-Tags mapping
CREATE TABLE public.b_blog_tags_map (
  blog_id UUID NOT NULL REFERENCES public.b_blogs(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.b_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (blog_id, tag_id)
);
ALTER TABLE public.b_blog_tags_map ENABLE ROW LEVEL SECURITY;

-- Media library
CREATE TABLE public.b_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  media_type public.media_type_enum NOT NULL DEFAULT 'image',
  alt_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.b_media ENABLE ROW LEVEL SECURITY;

-- Blog-Media mapping
CREATE TABLE public.b_blog_media_map (
  blog_id UUID NOT NULL REFERENCES public.b_blogs(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES public.b_media(id) ON DELETE CASCADE,
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  PRIMARY KEY (blog_id, media_id)
);
ALTER TABLE public.b_blog_media_map ENABLE ROW LEVEL SECURITY;

-- Blog SEO
CREATE TABLE public.b_blog_seo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id UUID NOT NULL UNIQUE REFERENCES public.b_blogs(id) ON DELETE CASCADE,
  meta_title TEXT,
  meta_description TEXT,
  canonical_url TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.b_blog_seo ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_b_blog_seo_updated_at BEFORE UPDATE ON public.b_blog_seo FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Blog status history
CREATE TABLE public.b_blog_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id UUID NOT NULL REFERENCES public.b_blogs(id) ON DELETE CASCADE,
  status public.content_status_enum NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.b_blog_status_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_b_blog_status_history_blog ON public.b_blog_status_history(blog_id);

-- Blog versions
CREATE TABLE public.b_blog_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id UUID NOT NULL REFERENCES public.b_blogs(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  version_number INT NOT NULL DEFAULT 1,
  edited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  edited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  change_summary TEXT
);
ALTER TABLE public.b_blog_versions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_b_blog_versions_blog ON public.b_blog_versions(blog_id);

-- ============================================================
-- RESOURCES MODULE
-- ============================================================

-- Resource Categories
CREATE TABLE public.r_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.r_categories ENABLE ROW LEVEL SECURITY;

-- Resource Tags
CREATE TABLE public.r_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.r_tags ENABLE ROW LEVEL SECURITY;

-- Resources
CREATE TABLE public.r_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  resource_type public.resource_type_enum NOT NULL DEFAULT 'guide',
  category_id UUID REFERENCES public.r_categories(id) ON DELETE SET NULL,
  display_order INT DEFAULT 0,
  title TEXT NOT NULL,
  description TEXT,
  whats_new TEXT,
  content TEXT,
  status public.content_status_enum NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.r_resources ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_r_resources_updated_at BEFORE UPDATE ON public.r_resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_r_resources_slug ON public.r_resources(slug);
CREATE INDEX idx_r_resources_status ON public.r_resources(status);
CREATE INDEX idx_r_resources_category ON public.r_resources(category_id);
CREATE INDEX idx_r_resources_search ON public.r_resources USING GIN(search_vector);

-- Resource search vector
CREATE OR REPLACE FUNCTION public.r_resources_search_vector_update()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$;
CREATE TRIGGER r_resources_search_update BEFORE INSERT OR UPDATE OF title, description ON public.r_resources FOR EACH ROW EXECUTE FUNCTION public.r_resources_search_vector_update();

-- Auto slug for resources
CREATE OR REPLACE FUNCTION public.generate_resource_slug()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := lower(regexp_replace(regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
    final_slug := base_slug;
    LOOP
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.r_resources WHERE slug = final_slug AND id != NEW.id);
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER r_resources_auto_slug BEFORE INSERT OR UPDATE OF title ON public.r_resources FOR EACH ROW EXECUTE FUNCTION public.generate_resource_slug();

-- Resource Files
CREATE TABLE public.r_resource_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.r_resources(id) ON DELETE CASCADE,
  file_type TEXT,
  storage_type public.storage_type_enum NOT NULL DEFAULT 'uploaded',
  file_url TEXT,
  embed_code TEXT,
  file_size BIGINT,
  mime_type TEXT,
  is_downloadable BOOLEAN DEFAULT TRUE,
  is_streamable BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.r_resource_files ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_r_resource_files_resource ON public.r_resource_files(resource_id);

-- Resource-Tags mapping
CREATE TABLE public.r_resource_tags_map (
  resource_id UUID NOT NULL REFERENCES public.r_resources(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.r_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (resource_id, tag_id)
);
ALTER TABLE public.r_resource_tags_map ENABLE ROW LEVEL SECURITY;

-- Resource SEO
CREATE TABLE public.r_resource_seo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL UNIQUE REFERENCES public.r_resources(id) ON DELETE CASCADE,
  meta_title TEXT,
  meta_description TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.r_resource_seo ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_r_resource_seo_updated_at BEFORE UPDATE ON public.r_resource_seo FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Resource Analytics
CREATE TABLE public.r_resource_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL UNIQUE REFERENCES public.r_resources(id) ON DELETE CASCADE,
  view_count INT NOT NULL DEFAULT 0,
  download_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.r_resource_analytics ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_r_resource_analytics_updated_at BEFORE UPDATE ON public.r_resource_analytics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- RLS POLICIES (bulk)
-- ============================================================

-- Public read for published content
CREATE POLICY "Public can read published jobs" ON public.j_jobs FOR SELECT USING (status = 'published');
CREATE POLICY "Public can read published blogs" ON public.b_blogs FOR SELECT USING (status = 'published');
CREATE POLICY "Public can read published resources" ON public.r_resources FOR SELECT USING (status = 'published');

-- Public read for lookup tables
CREATE POLICY "Public read domains" ON public.j_domains FOR SELECT USING (true);
CREATE POLICY "Public read skills" ON public.j_skills FOR SELECT USING (true);
CREATE POLICY "Public read countries" ON public.j_countries FOR SELECT USING (true);
CREATE POLICY "Public read states" ON public.j_states FOR SELECT USING (true);
CREATE POLICY "Public read cities" ON public.j_cities FOR SELECT USING (true);
CREATE POLICY "Public read companies" ON public.j_companies FOR SELECT USING (true);
CREATE POLICY "Public read b_categories" ON public.b_categories FOR SELECT USING (true);
CREATE POLICY "Public read b_tags" ON public.b_tags FOR SELECT USING (true);
CREATE POLICY "Public read b_authors" ON public.b_authors FOR SELECT USING (true);
CREATE POLICY "Public read r_categories" ON public.r_categories FOR SELECT USING (true);
CREATE POLICY "Public read r_tags" ON public.r_tags FOR SELECT USING (true);
CREATE POLICY "Public read r_resource_analytics" ON public.r_resource_analytics FOR SELECT USING (true);

-- Public read for job relations (only for published jobs via join)
CREATE POLICY "Public read job_domains" ON public.j_job_domains_map FOR SELECT USING (true);
CREATE POLICY "Public read job_skills" ON public.j_job_skills_map FOR SELECT USING (true);
CREATE POLICY "Public read job_locations" ON public.j_job_locations_map FOR SELECT USING (true);
CREATE POLICY "Public read job_applications" ON public.j_job_applications FOR SELECT USING (true);
CREATE POLICY "Public read job_seo" ON public.j_job_seo FOR SELECT USING (true);
CREATE POLICY "Public read blog_authors" ON public.b_blog_authors_map FOR SELECT USING (true);
CREATE POLICY "Public read blog_tags" ON public.b_blog_tags_map FOR SELECT USING (true);
CREATE POLICY "Public read blog_media" ON public.b_blog_media_map FOR SELECT USING (true);
CREATE POLICY "Public read media" ON public.b_media FOR SELECT USING (true);
CREATE POLICY "Public read blog_seo" ON public.b_blog_seo FOR SELECT USING (true);
CREATE POLICY "Public read resource_tags" ON public.r_resource_tags_map FOR SELECT USING (true);
CREATE POLICY "Public read resource_files" ON public.r_resource_files FOR SELECT USING (true);
CREATE POLICY "Public read resource_seo" ON public.r_resource_seo FOR SELECT USING (true);
CREATE POLICY "Public read featured" ON public.j_featured FOR SELECT USING (true);
CREATE POLICY "Public read sources" ON public.j_sources FOR SELECT USING (true);

-- Admin full access on all tables
CREATE POLICY "Admin full j_jobs" ON public.j_jobs FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full j_companies" ON public.j_companies FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full j_sources" ON public.j_sources FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full j_domains" ON public.j_domains FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full j_skills" ON public.j_skills FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full j_countries" ON public.j_countries FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full j_states" ON public.j_states FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full j_cities" ON public.j_cities FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full j_job_domains" ON public.j_job_domains_map FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full j_job_skills" ON public.j_job_skills_map FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full j_job_locations" ON public.j_job_locations_map FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full j_job_sources" ON public.j_job_sources_map FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full j_job_applications" ON public.j_job_applications FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full j_job_seo" ON public.j_job_seo FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full j_dedup" ON public.j_job_deduplication FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full j_raw_jobs" ON public.j_raw_jobs FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full j_featured" ON public.j_featured FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full j_company_domains" ON public.j_company_domains_map FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full b_authors" ON public.b_authors FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full b_categories" ON public.b_categories FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full b_tags" ON public.b_tags FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full b_blogs" ON public.b_blogs FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full b_blog_authors" ON public.b_blog_authors_map FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full b_blog_tags" ON public.b_blog_tags_map FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full b_media" ON public.b_media FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full b_blog_media" ON public.b_blog_media_map FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full b_blog_seo" ON public.b_blog_seo FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full b_blog_status_history" ON public.b_blog_status_history FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full b_blog_versions" ON public.b_blog_versions FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full r_categories" ON public.r_categories FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full r_tags" ON public.r_tags FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full r_resources" ON public.r_resources FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full r_resource_files" ON public.r_resource_files FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full r_resource_tags" ON public.r_resource_tags_map FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full r_resource_seo" ON public.r_resource_seo FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Admin full r_resource_analytics" ON public.r_resource_analytics FOR ALL USING (public.is_admin_or_editor());

-- Increment analytics function (public, no auth required)
CREATE OR REPLACE FUNCTION public.increment_resource_view(p_resource_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.r_resource_analytics (resource_id, view_count)
  VALUES (p_resource_id, 1)
  ON CONFLICT (resource_id) DO UPDATE SET view_count = r_resource_analytics.view_count + 1, updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_resource_download(p_resource_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.r_resource_analytics (resource_id, download_count)
  VALUES (p_resource_id, 1)
  ON CONFLICT (resource_id) DO UPDATE SET download_count = r_resource_analytics.download_count + 1, updated_at = now();
END;
$$;

-- ============================================================
-- STORAGE BUCKET for uploads
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);

CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');
CREATE POLICY "Public can read uploads" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');
CREATE POLICY "Authenticated users can update uploads" ON storage.objects FOR UPDATE USING (bucket_id = 'uploads' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete uploads" ON storage.objects FOR DELETE USING (bucket_id = 'uploads' AND auth.role() = 'authenticated');
