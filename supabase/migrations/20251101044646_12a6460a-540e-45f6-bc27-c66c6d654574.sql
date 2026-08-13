
-- ============================================
-- DROP ALL EXISTING OBJECTS
-- ============================================
DROP TABLE IF EXISTS company_culture CASCADE;
DROP TABLE IF EXISTS eligibility_criteria CASCADE;
DROP TABLE IF EXISTS job_benefits CASCADE;
DROP TABLE IF EXISTS job_skills CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS benefits CASCADE;
DROP TABLE IF EXISTS blog_tags CASCADE;
DROP TABLE IF EXISTS blogs CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS authors CASCADE;
DROP TABLE IF EXISTS resources CASCADE;

DROP FUNCTION IF EXISTS set_company_human_id() CASCADE;
DROP FUNCTION IF EXISTS set_location_human_id() CASCADE;
DROP FUNCTION IF EXISTS set_skill_human_id() CASCADE;
DROP FUNCTION IF EXISTS set_benefit_human_id() CASCADE;
DROP FUNCTION IF EXISTS set_job_human_id() CASCADE;
DROP FUNCTION IF EXISTS update_jobs_search_vector() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS delete_expired_jobs() CASCADE;

DROP TYPE IF EXISTS job_type_enum CASCADE;
DROP TYPE IF EXISTS work_mode_enum CASCADE;
DROP TYPE IF EXISTS currency_enum CASCADE;
DROP TYPE IF EXISTS blog_status CASCADE;
DROP TYPE IF EXISTS resource_type CASCADE;
DROP TYPE IF EXISTS content_type_enum CASCADE;

-- ============================================
-- CREATE ENUMS
-- ============================================
CREATE TYPE job_type_enum AS ENUM ('Full-time','Part-time','Internship','Contract');
CREATE TYPE work_mode_enum AS ENUM ('Remote','On-site','Hybrid');
CREATE TYPE currency_enum AS ENUM ('INR','USD','EUR','GBP','Other');
CREATE TYPE blog_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE resource_type AS ENUM ('category', 'resource', 'content');
CREATE TYPE content_type_enum AS ENUM ('text', 'file', 'external', 'video', 'none');

-- ============================================
-- COMPANIES TABLE
-- ============================================
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    human_id TEXT UNIQUE,
    name TEXT NOT NULL,
    logo_url TEXT,
    hq_location TEXT,
    employee_count TEXT,
    founded_year INT,
    office_locations TEXT[],
    culture_summary TEXT,
    website TEXT,
    linkedin TEXT,
    contact_email TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE FUNCTION set_company_human_id() RETURNS trigger AS $$
DECLARE
    max_id INT;
BEGIN
    SELECT COALESCE(MAX(CAST(SPLIT_PART(human_id,'-',2) AS INT)),0) + 1 INTO max_id FROM companies;
    NEW.human_id := 'COMP-' || LPAD(max_id::TEXT,5,'0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_company_human_id
BEFORE INSERT ON companies
FOR EACH ROW
EXECUTE FUNCTION set_company_human_id();

-- ============================================
-- LOCATIONS TABLE
-- ============================================
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    human_id TEXT UNIQUE,
    city TEXT NOT NULL,
    state TEXT,
    country TEXT,
    UNIQUE(city, state, country)
);

CREATE FUNCTION set_location_human_id() RETURNS trigger AS $$
DECLARE
    max_id INT;
BEGIN
    SELECT COALESCE(MAX(CAST(SPLIT_PART(human_id,'-',2) AS INT)),0) + 1 INTO max_id FROM locations;
    NEW.human_id := 'LOC-' || LPAD(max_id::TEXT,5,'0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_location_human_id
BEFORE INSERT ON locations
FOR EACH ROW
EXECUTE FUNCTION set_location_human_id();

-- ============================================
-- SKILLS TABLE
-- ============================================
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    human_id TEXT UNIQUE,
    name TEXT NOT NULL,
    category TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE FUNCTION set_skill_human_id() RETURNS trigger AS $$
DECLARE
    max_id INT;
BEGIN
    SELECT COALESCE(MAX(CAST(SPLIT_PART(human_id,'-',2) AS INT)),0) + 1 INTO max_id FROM skills;
    NEW.human_id := 'SKL-' || LPAD(max_id::TEXT,5,'0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_skill_human_id
BEFORE INSERT ON skills
FOR EACH ROW
EXECUTE FUNCTION set_skill_human_id();

-- ============================================
-- BENEFITS TABLE
-- ============================================
CREATE TABLE benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    human_id TEXT UNIQUE,
    name TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE FUNCTION set_benefit_human_id() RETURNS trigger AS $$
DECLARE
    max_id INT;
BEGIN
    SELECT COALESCE(MAX(CAST(SPLIT_PART(human_id,'-',2) AS INT)),0) + 1 INTO max_id FROM benefits;
    NEW.human_id := 'BEN-' || LPAD(max_id::TEXT,5,'0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_benefit_human_id
BEFORE INSERT ON benefits
FOR EACH ROW
EXECUTE FUNCTION set_benefit_human_id();

-- ============================================
-- JOBS TABLE
-- ============================================
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    human_id TEXT UNIQUE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    responsibilities TEXT[],
    qualifications TEXT[],
    location_id UUID REFERENCES locations(id),
    work_mode work_mode_enum,
    job_type job_type_enum,
    salary_min NUMERIC,
    salary_max NUMERIC,
    currency currency_enum,
    application_link TEXT,
    deadline DATE,
    deleted_at TIMESTAMP,
    updated_by TEXT,
    search_vector TSVECTOR,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE FUNCTION set_job_human_id() RETURNS trigger AS $$
DECLARE
    max_id INT;
BEGIN
    SELECT COALESCE(MAX(CAST(SPLIT_PART(human_id,'-',2) AS INT)),0) + 1 INTO max_id FROM jobs;
    NEW.human_id := 'JOB-' || LPAD(max_id::TEXT,5,'0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_job_human_id
BEFORE INSERT ON jobs
FOR EACH ROW
EXECUTE FUNCTION set_job_human_id();

-- ============================================
-- JOB_SKILLS TABLE
-- ============================================
CREATE TABLE job_skills (
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (job_id, skill_id)
);

-- ============================================
-- JOB_BENEFITS TABLE
-- ============================================
CREATE TABLE job_benefits (
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    benefit_id UUID NOT NULL REFERENCES benefits(id) ON DELETE CASCADE,
    PRIMARY KEY (job_id, benefit_id)
);

-- ============================================
-- ELIGIBILITY_CRITERIA TABLE
-- ============================================
CREATE TABLE eligibility_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    education_level TEXT,
    min_experience INT,
    max_experience INT,
    age_limit INT,
    other_criteria TEXT
);

-- ============================================
-- COMPANY_CULTURE TABLE
-- ============================================
CREATE TABLE company_culture (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    point TEXT NOT NULL
);

-- ============================================
-- AUTHORS TABLE (FOR BLOGS)
-- ============================================
CREATE TABLE authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    bio TEXT,
    profile_pic_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- BLOGS TABLE
-- ============================================
CREATE TABLE blogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT,
    thumbnail_url TEXT,
    author_id UUID REFERENCES authors(id) ON DELETE SET NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    status blog_status DEFAULT 'draft',
    view_count INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- TAGS TABLE
-- ============================================
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- BLOG_TAGS TABLE
-- ============================================
CREATE TABLE blog_tags (
    blog_id UUID REFERENCES blogs(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (blog_id, tag_id)
);

-- ============================================
-- RESOURCES TABLE (HIERARCHICAL STRUCTURE)
-- ============================================
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES resources(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type resource_type NOT NULL,
    content_type content_type_enum DEFAULT 'none',
    content_text TEXT,
    file_url TEXT,
    external_url TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_jobs_search_vector ON jobs USING GIN(search_vector);
CREATE INDEX idx_jobs_company_id ON jobs(company_id);
CREATE INDEX idx_jobs_location_id ON jobs(location_id);
CREATE INDEX idx_jobs_job_type ON jobs(job_type);
CREATE INDEX idx_jobs_work_mode ON jobs(work_mode);
CREATE INDEX idx_jobs_salary_min ON jobs(salary_min);
CREATE INDEX idx_jobs_salary_max ON jobs(salary_max);
CREATE INDEX idx_jobs_deadline ON jobs(deadline);
CREATE INDEX idx_jobs_deleted_at ON jobs(deleted_at);

CREATE INDEX idx_blogs_published_at ON blogs(published_at DESC);
CREATE INDEX idx_blogs_slug ON blogs(slug);
CREATE INDEX idx_blogs_status ON blogs(status);
CREATE INDEX idx_blog_tags_tag_id ON blog_tags(tag_id);

CREATE INDEX idx_resources_parent_id ON resources(parent_id);
CREATE INDEX idx_resources_type ON resources(type);
CREATE INDEX idx_resources_display_order ON resources(display_order);

-- ============================================
-- TRIGGER FOR UPDATING SEARCH_VECTOR
-- ============================================
CREATE FUNCTION update_jobs_search_vector() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
        setweight(
            to_tsvector('english',
                COALESCE(
                    (SELECT string_agg(s.name, ' ') 
                     FROM job_skills js 
                     JOIN skills s ON js.skill_id = s.id 
                     WHERE js.job_id = NEW.id), ''
                )
            ), 'C'
        ) ||
        setweight(
            to_tsvector('english',
                COALESCE(
                    (SELECT string_agg(b.name, ' ')
                     FROM job_benefits jb
                     JOIN benefits b ON jb.benefit_id = b.id
                     WHERE jb.job_id = NEW.id), ''
                )
            ), 'D'
        );
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_jobs_search_vector
BEFORE INSERT OR UPDATE ON jobs
FOR EACH ROW EXECUTE FUNCTION update_jobs_search_vector();

-- ============================================
-- TRIGGER FOR AUTO-UPDATING TIMESTAMPS
-- ============================================
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blogs_updated_at
BEFORE UPDATE ON blogs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
BEFORE UPDATE ON resources
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION FOR DELETING EXPIRED JOBS
-- ============================================
CREATE FUNCTION delete_expired_jobs() RETURNS void AS $$
BEGIN
    DELETE FROM jobs 
    WHERE deadline IS NOT NULL AND deadline < CURRENT_DATE;

    DELETE FROM jobs 
    WHERE deadline IS NULL AND created_at < (CURRENT_DATE - INTERVAL '30 days');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligibility_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_culture ENABLE ROW LEVEL SECURITY;
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - PUBLIC READ ACCESS
-- ============================================

-- Companies
CREATE POLICY "Users can view companies" ON companies FOR SELECT USING (true);
CREATE POLICY "Admins can manage companies" ON companies FOR ALL USING (auth.uid() = '240f1361-1f37-4cae-b12b-8fe51e789a76'::uuid);

-- Locations
CREATE POLICY "Users can view locations" ON locations FOR SELECT USING (true);
CREATE POLICY "Admins can manage locations" ON locations FOR ALL USING (auth.uid() = '240f1361-1f37-4cae-b12b-8fe51e789a76'::uuid);

-- Skills
CREATE POLICY "Users can view skills" ON skills FOR SELECT USING (true);
CREATE POLICY "Admins can manage skills" ON skills FOR ALL USING (auth.uid() = '240f1361-1f37-4cae-b12b-8fe51e789a76'::uuid);

-- Benefits
CREATE POLICY "Users can view benefits" ON benefits FOR SELECT USING (true);
CREATE POLICY "Admins can manage benefits" ON benefits FOR ALL USING (auth.uid() = '240f1361-1f37-4cae-b12b-8fe51e789a76'::uuid);

-- Jobs (only show active jobs to users)
CREATE POLICY "Users can view active jobs" ON jobs FOR SELECT USING (deleted_at IS NULL AND (deadline IS NULL OR deadline >= CURRENT_DATE));
CREATE POLICY "Admins can manage jobs" ON jobs FOR ALL USING (auth.uid() = '240f1361-1f37-4cae-b12b-8fe51e789a76'::uuid);

-- Job Skills
CREATE POLICY "Users can view job_skills" ON job_skills FOR SELECT USING (true);
CREATE POLICY "Admins can manage job_skills" ON job_skills FOR ALL USING (auth.uid() = '240f1361-1f37-4cae-b12b-8fe51e789a76'::uuid);

-- Job Benefits
CREATE POLICY "Users can view job_benefits" ON job_benefits FOR SELECT USING (true);
CREATE POLICY "Admins can manage job_benefits" ON job_benefits FOR ALL USING (auth.uid() = '240f1361-1f37-4cae-b12b-8fe51e789a76'::uuid);

-- Eligibility Criteria
CREATE POLICY "Users can view eligibility_criteria" ON eligibility_criteria FOR SELECT USING (true);
CREATE POLICY "Admins can manage eligibility_criteria" ON eligibility_criteria FOR ALL USING (auth.uid() = '240f1361-1f37-4cae-b12b-8fe51e789a76'::uuid);

-- Company Culture
CREATE POLICY "Users can view company_culture" ON company_culture FOR SELECT USING (true);
CREATE POLICY "Admins can manage company_culture" ON company_culture FOR ALL USING (auth.uid() = '240f1361-1f37-4cae-b12b-8fe51e789a76'::uuid);

-- Authors
CREATE POLICY "Users can view authors" ON authors FOR SELECT USING (true);
CREATE POLICY "Admins can manage authors" ON authors FOR ALL USING (auth.uid() = '240f1361-1f37-4cae-b12b-8fe51e789a76'::uuid);

-- Blogs (only show published blogs to users)
CREATE POLICY "Users can view published blogs" ON blogs FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can manage blogs" ON blogs FOR ALL USING (auth.uid() = '240f1361-1f37-4cae-b12b-8fe51e789a76'::uuid);

-- Tags
CREATE POLICY "Users can view tags" ON tags FOR SELECT USING (true);
CREATE POLICY "Admins can manage tags" ON tags FOR ALL USING (auth.uid() = '240f1361-1f37-4cae-b12b-8fe51e789a76'::uuid);

-- Blog Tags
CREATE POLICY "Users can view blog_tags" ON blog_tags FOR SELECT USING (true);
CREATE POLICY "Admins can manage blog_tags" ON blog_tags FOR ALL USING (auth.uid() = '240f1361-1f37-4cae-b12b-8fe51e789a76'::uuid);

-- Resources
CREATE POLICY "Users can view resources" ON resources FOR SELECT USING (true);
CREATE POLICY "Admins can manage resources" ON resources FOR ALL USING (auth.uid() = '240f1361-1f37-4cae-b12b-8fe51e789a76'::uuid);
