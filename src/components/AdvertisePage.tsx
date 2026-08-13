import React from 'react';
import { X, Users, Eye, MessageCircle, Linkedin, Phone, Mail, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface AdvertisePageProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdvertisePage: React.FC<AdvertisePageProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const platformStats = [
    { metric: 'Total Page Views', value: '53 Lakhs/monthly', icon: Eye, color: 'text-blue-600' },
    { metric: 'Unique Visitors', value: '17.84 Lakhs/monthly', icon: Users, color: 'text-green-600' },
    { metric: 'WhatsApp Subscribers', value: '4.47 Lakhs over 750+ groups', icon: MessageCircle, color: 'text-green-500' },
    { metric: 'LinkedIn Followers', value: '1.80 Lakhs', icon: Linkedin, color: 'text-blue-700' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-primary max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-3xl font-bold text-card-foreground">Advertise with Opp Avenue</h2>
            <p className="text-lg text-muted-foreground mt-1">
              Reach out to 1lakh+ daily users by advertising at our platform
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="w-10 h-10">
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6 space-y-8">
            {/* Platform Statistics */}
            <div>
              <h3 className="text-2xl font-semibold mb-6 text-card-foreground flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-primary" />
                Why advertise at our platform
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {platformStats.map((stat, index) => (
                  <Card key={index} className="p-6 border border-card-border bg-gradient-to-br from-card to-secondary/20">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl bg-secondary ${stat.color}`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg text-card-foreground mb-2">{stat.metric}</h4>
                        <p className="text-2xl font-bold text-primary">{stat.value}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Advertising Benefits */}
            <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-8">
              <h3 className="text-2xl font-semibold mb-6 text-card-foreground">Advertising Benefits</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-hover rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h4 className="font-semibold text-lg mb-2">Massive Reach</h4>
                  <p className="text-muted-foreground">Connect with over 1 lakh daily active users seeking opportunities</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-accent to-accent-hover rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-accent-foreground" />
                  </div>
                  <h4 className="font-semibold text-lg mb-2">Targeted Audience</h4>
                  <p className="text-muted-foreground">Reach professionals actively looking for career opportunities</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-success to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-success-foreground" />
                  </div>
                  <h4 className="font-semibold text-lg mb-2">Multi-Channel</h4>
                  <p className="text-muted-foreground">Leverage our website, WhatsApp groups, and LinkedIn presence</p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gradient-to-br from-secondary/30 to-accent/10 rounded-2xl p-8">
              <h3 className="text-2xl font-semibold mb-6 text-card-foreground text-center">Get Started Today</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Call Us */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-semibold text-lg mb-2">Call us at:</h4>
                  <Button 
                    variant="outline" 
                    className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    +91 98765 43210
                  </Button>
                </div>
                
                {/* Email Us */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-semibold text-lg mb-2">Email us at:</h4>
                  <Button 
                    variant="outline" 
                    className="rounded-full border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                  >
                    ads@oppavenue.com
                  </Button>
                </div>
                
                {/* Book Meeting */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-semibold text-lg mb-2">Book a meeting</h4>
                  <Button 
                    className="bg-gradient-to-r from-success to-green-600 hover:from-green-600 hover:to-success text-success-foreground rounded-full px-6"
                  >
                    Schedule Call
                  </Button>
                </div>
              </div>
              
              <div className="text-center mt-8">
                <p className="text-lg text-muted-foreground">
                  We will contact you within 24 hours to discuss your advertising needs
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvertisePage;