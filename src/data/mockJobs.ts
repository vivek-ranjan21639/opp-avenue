import { Job } from '@/components/JobCard';

export const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Data Scientist',
    company: 'Amazon',
    location: 'Austin, TX',
    salary: '₹77k - ₹152k',
    type: 'Full-time',
    experience: '3-5 years',
    skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow', 'Statistics'],
    postedTime: '2 days ago',
    description: 'We are looking for a skilled Data Scientist to join our team and help drive data-driven decisions across the organization. You will work with large datasets, build predictive models, and collaborate with cross-functional teams to deliver insights.',
    remote: true,
  },
  {
    id: '2',
    title: 'Senior Software Engineer',
    company: 'Google',
    location: 'Mountain View, CA',
    salary: '₹120k - ₹200k',
    type: 'Full-time',
    experience: '5+ years',
    skills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'Docker'],
    postedTime: '1 day ago',
    description: 'Join our engineering team to build scalable web applications that serve millions of users. You will work on cutting-edge technologies and contribute to products that impact people globally.',
    remote: false,
  },
  {
    id: '3',
    title: 'UX Designer',
    company: 'Microsoft',
    location: 'Seattle, WA',
    salary: '₹85k - ₹130k',
    type: 'Full-time',
    experience: '2-4 years',
    skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'Adobe CC'],
    postedTime: '3 days ago',
    description: 'We are seeking a creative UX Designer to help design intuitive and engaging user experiences for our products. You will conduct user research, create wireframes, and collaborate with product teams.',
    remote: true,
  },
  {
    id: '4',
    title: 'DevOps Engineer',
    company: 'Netflix',
    location: 'Los Gatos, CA',
    salary: '₹100k - ₹160k',
    type: 'Full-time',
    experience: '3-6 years',
    skills: ['AWS', 'Kubernetes', 'CI/CD', 'Terraform', 'Monitoring'],
    postedTime: '1 week ago',
    description: 'Help us maintain and scale our infrastructure that serves content to millions of users worldwide. You will work with modern cloud technologies and automation tools.',
    remote: true,
  },
  {
    id: '5',
    title: 'Product Manager',
    company: 'Meta',
    location: 'Menlo Park, CA',
    salary: '₹130k - ₹180k',
    type: 'Full-time',
    experience: '4-7 years',
    skills: ['Product Strategy', 'Analytics', 'A/B Testing', 'SQL', 'Leadership'],
    postedTime: '5 days ago',
    description: 'Lead product development initiatives and work with cross-functional teams to deliver features that enhance user experience and drive business growth.',
    remote: false,
  },
  {
    id: '6',
    title: 'Frontend Developer',
    company: 'Spotify',
    location: 'New York, NY',
    salary: '₹90k - ₹140k',
    type: 'Full-time',
    experience: '2-4 years',
    skills: ['Vue.js', 'JavaScript', 'CSS3', 'Webpack', 'Testing'],
    postedTime: '4 days ago',
    description: 'Build beautiful and responsive user interfaces for our music streaming platform. You will work with the latest frontend technologies and contribute to our design system.',
    remote: true,
  },
  {
    id: '7',
    title: 'Machine Learning Engineer',
    company: 'Tesla',
    location: 'Austin, TX',
    salary: '₹110k - ₹170k',
    type: 'Full-time',
    experience: '3-5 years',
    skills: ['PyTorch', 'Python', 'MLOps', 'Computer Vision', 'Deep Learning'],
    postedTime: '6 days ago',
    description: 'Work on autonomous driving technology and develop machine learning models that power our self-driving capabilities. You will work with cutting-edge AI technologies.',
    remote: false,
  },
  {
    id: '8',
    title: 'Backend Engineer',
    company: 'Uber',
    location: 'San Francisco, CA',
    salary: '₹105k - ₹155k',
    type: 'Full-time',
    experience: '3-5 years',
    skills: ['Java', 'Spring Boot', 'Microservices', 'Redis', 'PostgreSQL'],
    postedTime: '1 week ago',
    description: 'Build and maintain high-performance backend systems that handle millions of requests. You will work on distributed systems and scalable architectures.',
    remote: true,
  },
  {
    id: '9',
    title: 'Legal Intern',
    company: 'National Legal Services Authority',
    location: 'New Delhi, India',
    salary: '₹15k - ₹25k',
    type: 'Internship',
    experience: 'Entry Level',
    skills: ['Legal Research', 'Case Analysis', 'Documentation', 'Communication'],
    postedTime: '2 days ago',
    description: 'Join our internship programme for law students across the country. This programme aims to acquaint young law students with the workings of the National Legal Services Authority (NALSA) by providing hands-on experience in various specialised areas of legal services.',
    remote: false,
  },
  {
    id: '10',
    title: 'Cloud Architect',
    company: 'Amazon',
    location: 'Austin, TX',
    salary: '₹140k - ₹200k',
    type: 'Full-time',
    experience: '7+ years',
    skills: ['AWS', 'Azure', 'Cloud Security', 'Architecture Design', 'Leadership'],
    postedTime: '3 days ago',
    description: 'Design and implement cloud infrastructure solutions for enterprise clients. You will lead technical discussions and provide architectural guidance for cloud migrations.',
    remote: true,
  },
];

// Function to simulate infinite scroll pagination
export const getJobsPage = (page: number, pageSize: number = 6): Job[] => {
  const startIndex = page * pageSize;
  const endIndex = startIndex + pageSize;
  
  // Cycle through jobs if we run out
  const totalJobs = mockJobs.length;
  const jobs: Job[] = [];
  
  for (let i = startIndex; i < endIndex; i++) {
    const jobIndex = i % totalJobs;
    const job = { ...mockJobs[jobIndex] };
    // Add unique ID for infinite scroll
    job.id = `${job.id}-page-${page}-${i}`;
    jobs.push(job);
  }
  
  return jobs;
};