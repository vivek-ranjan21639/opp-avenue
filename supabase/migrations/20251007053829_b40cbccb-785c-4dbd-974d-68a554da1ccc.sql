-- Insert sample companies
INSERT INTO public.companies (name, logo_url, website, description) VALUES
  ('Amazon', NULL, 'https://www.amazon.com/careers', 'Global e-commerce and cloud computing leader providing innovative solutions worldwide.'),
  ('Google', NULL, 'https://careers.google.com', 'Leading technology company focused on search, advertising, and cloud services.'),
  ('Microsoft', NULL, 'https://careers.microsoft.com', 'Global technology company developing software, services, and devices.'),
  ('Netflix', NULL, 'https://jobs.netflix.com', 'World''s leading streaming entertainment service with millions of members globally.'),
  ('Meta', NULL, 'https://www.metacareers.com', 'Social technology company building the future of human connection and immersive experiences.'),
  ('Spotify', NULL, 'https://www.lifeatspotify.com', 'Audio streaming platform giving millions access to music and podcasts.'),
  ('Tesla', NULL, 'https://www.tesla.com/careers', 'Electric vehicle and clean energy company accelerating the world''s transition to sustainable energy.'),
  ('Uber', NULL, 'https://www.uber.com/careers', 'Technology platform connecting riders to drivers and delivering food worldwide.'),
  ('National Legal Services Authority', NULL, 'https://nalsa.gov.in', 'Constitutional body providing free legal services and promoting legal awareness across India.')
ON CONFLICT (name) DO NOTHING;

-- Insert sample jobs
INSERT INTO public.jobs (title, company_id, company_name, location, salary, type, experience, skills, description, remote, is_active) 
SELECT 
  'Data Scientist',
  c.id,
  'Amazon',
  'Austin, TX',
  '₹77k - ₹152k',
  'Full-time',
  '3-5 years',
  ARRAY['Python', 'Machine Learning', 'SQL', 'TensorFlow', 'Statistics'],
  'We are looking for a skilled Data Scientist to join our team and help drive data-driven decisions across the organization. You will work with large datasets, build predictive models, and collaborate with cross-functional teams to deliver insights.',
  true,
  true
FROM public.companies c WHERE c.name = 'Amazon'
LIMIT 1;

INSERT INTO public.jobs (title, company_id, company_name, location, salary, type, experience, skills, description, remote, is_active) 
SELECT 
  'Senior Software Engineer',
  c.id,
  'Google',
  'Mountain View, CA',
  '₹120k - ₹200k',
  'Full-time',
  '5+ years',
  ARRAY['React', 'TypeScript', 'Node.js', 'GraphQL', 'Docker'],
  'Join our engineering team to build scalable web applications that serve millions of users. You will work on cutting-edge technologies and contribute to products that impact people globally.',
  false,
  true
FROM public.companies c WHERE c.name = 'Google'
LIMIT 1;

INSERT INTO public.jobs (title, company_id, company_name, location, salary, type, experience, skills, description, remote, is_active) 
SELECT 
  'UX Designer',
  c.id,
  'Microsoft',
  'Seattle, WA',
  '₹85k - ₹130k',
  'Full-time',
  '2-4 years',
  ARRAY['Figma', 'User Research', 'Prototyping', 'Design Systems', 'Adobe CC'],
  'We are seeking a creative UX Designer to help design intuitive and engaging user experiences for our products. You will conduct user research, create wireframes, and collaborate with product teams.',
  true,
  true
FROM public.companies c WHERE c.name = 'Microsoft'
LIMIT 1;

INSERT INTO public.jobs (title, company_id, company_name, location, salary, type, experience, skills, description, remote, is_active) 
SELECT 
  'DevOps Engineer',
  c.id,
  'Netflix',
  'Los Gatos, CA',
  '₹100k - ₹160k',
  'Full-time',
  '3-6 years',
  ARRAY['AWS', 'Kubernetes', 'CI/CD', 'Terraform', 'Monitoring'],
  'Help us maintain and scale our infrastructure that serves content to millions of users worldwide. You will work with modern cloud technologies and automation tools.',
  true,
  true
FROM public.companies c WHERE c.name = 'Netflix'
LIMIT 1;

INSERT INTO public.jobs (title, company_id, company_name, location, salary, type, experience, skills, description, remote, is_active) 
SELECT 
  'Product Manager',
  c.id,
  'Meta',
  'Menlo Park, CA',
  '₹130k - ₹180k',
  'Full-time',
  '4-7 years',
  ARRAY['Product Strategy', 'Analytics', 'A/B Testing', 'SQL', 'Leadership'],
  'Lead product development initiatives and work with cross-functional teams to deliver features that enhance user experience and drive business growth.',
  false,
  true
FROM public.companies c WHERE c.name = 'Meta'
LIMIT 1;

INSERT INTO public.jobs (title, company_id, company_name, location, salary, type, experience, skills, description, remote, is_active) 
SELECT 
  'Frontend Developer',
  c.id,
  'Spotify',
  'New York, NY',
  '₹90k - ₹140k',
  'Full-time',
  '2-4 years',
  ARRAY['Vue.js', 'JavaScript', 'CSS3', 'Webpack', 'Testing'],
  'Build beautiful and responsive user interfaces for our music streaming platform. You will work with the latest frontend technologies and contribute to our design system.',
  true,
  true
FROM public.companies c WHERE c.name = 'Spotify'
LIMIT 1;

INSERT INTO public.jobs (title, company_id, company_name, location, salary, type, experience, skills, description, remote, is_active) 
SELECT 
  'Machine Learning Engineer',
  c.id,
  'Tesla',
  'Austin, TX',
  '₹110k - ₹170k',
  'Full-time',
  '3-5 years',
  ARRAY['PyTorch', 'Python', 'MLOps', 'Computer Vision', 'Deep Learning'],
  'Work on autonomous driving technology and develop machine learning models that power our self-driving capabilities. You will work with cutting-edge AI technologies.',
  false,
  true
FROM public.companies c WHERE c.name = 'Tesla'
LIMIT 1;

INSERT INTO public.jobs (title, company_id, company_name, location, salary, type, experience, skills, description, remote, is_active) 
SELECT 
  'Backend Engineer',
  c.id,
  'Uber',
  'San Francisco, CA',
  '₹105k - ₹155k',
  'Full-time',
  '3-5 years',
  ARRAY['Java', 'Spring Boot', 'Microservices', 'Redis', 'PostgreSQL'],
  'Build and maintain high-performance backend systems that handle millions of requests. You will work on distributed systems and scalable architectures.',
  true,
  true
FROM public.companies c WHERE c.name = 'Uber'
LIMIT 1;

INSERT INTO public.jobs (title, company_id, company_name, location, salary, type, experience, skills, description, remote, is_active) 
SELECT 
  'Legal Intern',
  c.id,
  'National Legal Services Authority',
  'New Delhi, India',
  '₹15k - ₹25k',
  'Internship',
  'Entry Level',
  ARRAY['Legal Research', 'Case Analysis', 'Documentation', 'Communication'],
  'Join our internship programme for law students across the country. This programme aims to acquaint young law students with the workings of the National Legal Services Authority (NALSA) by providing hands-on experience in various specialised areas of legal services.',
  false,
  true
FROM public.companies c WHERE c.name = 'National Legal Services Authority'
LIMIT 1;

INSERT INTO public.jobs (title, company_id, company_name, location, salary, type, experience, skills, description, remote, is_active) 
SELECT 
  'Cloud Architect',
  c.id,
  'Amazon',
  'Seattle, WA',
  '₹140k - ₹200k',
  'Full-time',
  '7+ years',
  ARRAY['AWS', 'Azure', 'Cloud Security', 'Architecture Design', 'Leadership'],
  'Design and implement cloud infrastructure solutions for enterprise clients. You will lead technical discussions and provide architectural guidance for cloud migrations.',
  true,
  true
FROM public.companies c WHERE c.name = 'Amazon'
LIMIT 1;