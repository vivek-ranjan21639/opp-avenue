import { useState, useEffect, useRef } from 'react';
import { Mail, Phone, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import PageLayout from '@/components/PageLayout';
import SEO from '@/components/SEO';
import { useSiteSetting, type ContactInfo } from '@/hooks/useSiteSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const FormSchema = z.object({
  name: z.string().trim().min(1, 'Name required').max(100),
  email: z.string().trim().email('Invalid email').max(255),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1, 'Message required').max(2000),
});

const Contact = () => {
  const { value: contact } = useSiteSetting<ContactInfo>('contact_info', {
    email: 'contact@oppavenue.com',
    phone: '+1 (234) 567-890',
  });

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#contact-form') {
      // Defer to ensure layout is mounted
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = FormSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Invalid input');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('submit-contact-message', {
        body: parsed.data,
      });
      if (error) throw error;
      toast.success('Message sent! We will get back to you soon.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <SEO
        title="Connect with Us"
        description="Have questions or need assistance? Connect with the Opp Avenue team."
        canonical="/contact"
      />
      <main className="container mx-auto px-4 pt-4 pb-12 max-w-6xl">
        <div className="space-y-12">
          <section className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
              Connect with Us
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have questions or need assistance? We're here to help. Reach out through any of the channels below.
            </p>
          </section>

          <div className="grid md:grid-cols-2 gap-8">
            <Card id="contact-form" ref={formRef as any} className="border-border/50 shadow-lg scroll-mt-24">

              <CardHeader>
                <CardTitle>Send us a message</CardTitle>
                <CardDescription>Fill out the form and we'll get back to you soon</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <Input
                    placeholder="Your Name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    maxLength={100}
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Your Email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    maxLength={255}
                    required
                  />
                  <Input
                    placeholder="Subject"
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    maxLength={200}
                  />
                  <Textarea
                    placeholder="Your Message"
                    className="min-h-[150px]"
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    maxLength={2000}
                    required
                  />
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    {submitting ? 'Sending…' : 'Send Message'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-border/50 shadow-lg">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>Email Us</CardTitle>
                  <CardDescription>Send us an email anytime</CardDescription>
                </CardHeader>
                <CardContent>
                  <a href={`mailto:${contact.email}`} className="text-primary hover:underline break-all">
                    {contact.email}
                  </a>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-lg">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                    <Phone className="w-6 h-6 text-accent" />
                  </div>
                  <CardTitle>Call Us</CardTitle>
                  <CardDescription>Mon-Fri from 9am to 6pm</CardDescription>
                </CardHeader>
                <CardContent>
                  <a href={`tel:${contact.phone.replace(/\s+/g, '')}`} className="text-primary hover:underline">
                    {contact.phone}
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </PageLayout>
  );
};

export default Contact;
