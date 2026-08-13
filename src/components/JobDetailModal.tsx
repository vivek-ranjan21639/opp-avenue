import React from 'react';
import { X, MapPin, Clock, IndianRupee, Building, Users, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Job } from './JobCard';

interface JobDetailModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
}

const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, isOpen, onClose }) => {
  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-primary max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-hover rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-2xl">
                {job.company.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-card-foreground">{job.title}</h2>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <Building className="w-5 h-5" />
                <span className="text-lg">{job.company}</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="w-10 h-10">
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6 space-y-6">
            {/* Job Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{job.location}</p>
                  {job.remote && <Badge variant="secondary" className="mt-1 text-xs">Remote</Badge>}
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl">
                <IndianRupee className="w-5 h-5 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Salary</p>
                  <p className="font-medium">{job.salary}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl">
                <Clock className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Job Type</p>
                  <p className="font-medium">{job.type}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl">
                <Users className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Experience</p>
                  <p className="font-medium">{job.experience}</p>
                </div>
              </div>
            </div>

            {/* Skills Required */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-card-foreground">Skills Required</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <Badge key={index} variant="outline" className="px-3 py-1 rounded-full">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Job Description */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-card-foreground">About the Role</h3>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <p>{job.description}</p>
                
                <h4 className="font-semibold text-card-foreground mt-4">Responsibilities:</h4>
                <ul className="space-y-1">
                  <li>Design and develop scalable data pipelines and analytics solutions</li>
                  <li>Collaborate with cross-functional teams to understand business requirements</li>
                  <li>Build machine learning models and statistical analyses</li>
                  <li>Present insights and recommendations to stakeholders</li>
                </ul>

                <h4 className="font-semibold text-card-foreground mt-4">Requirements:</h4>
                <ul className="space-y-1">
                  <li>Bachelor's degree in Computer Science, Statistics, or related field</li>
                  <li>3+ years of experience in data science or analytics</li>
                  <li>Proficiency in Python, R, SQL, and machine learning frameworks</li>
                  <li>Experience with cloud platforms (AWS, GCP, Azure)</li>
                </ul>
              </div>
            </div>

            {/* Company Info */}
            <div className="bg-muted/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-3 text-card-foreground">About {job.company}</h3>
              <p className="text-muted-foreground mb-4">
                {job.company} is a leading technology company focused on innovation and excellence. 
                We provide cutting-edge solutions and foster a collaborative work environment where 
                talented individuals can grow and make a significant impact.
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Posted {job.postedTime}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>50+ employees</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/20">
          <div className="flex items-center gap-4">
            <Button variant="outline" className="rounded-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Company
            </Button>
            <Button variant="outline" className="rounded-full">
              Save Job
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose} className="rounded-full px-6">
              Close
            </Button>
            <Button className="bg-gradient-to-r from-accent to-accent-hover hover:from-accent-hover hover:to-accent text-accent-foreground px-8 py-2 rounded-full font-medium">
              Apply Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailModal;