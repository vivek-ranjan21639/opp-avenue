import React from 'react';
import { Linkedin, MessageCircle, Phone, Mail, Youtube } from 'lucide-react';
import { useSiteSetting, type SocialLinks, type SocialVisibility } from '@/hooks/useSiteSettings';
import SocialIcon, { type SocialLink } from '@/components/SocialIcon';

const ICONS: Record<keyof SocialLinks, { icon: any; label: string; color: string }> = {
  linkedin: { icon: Linkedin, label: 'LinkedIn', color: 'text-blue-600' },
  youtube: { icon: Youtube, label: 'YouTube', color: 'text-red-600' },
  whatsapp: { icon: MessageCircle, label: 'WhatsApp', color: 'text-green-600' },
  phone: { icon: Phone, label: 'Call Us', color: 'text-purple-600' },
  email: { icon: Mail, label: 'Email', color: 'text-red-500' },
};

const ORDER: (keyof SocialLinks)[] = ['linkedin', 'youtube', 'whatsapp', 'phone', 'email'];

const normalize = (key: keyof SocialLinks, raw?: string) => {
  if (!raw) return '';
  const v = raw.trim();
  if (!v) return '';
  if (key === 'phone') return v.replace(/^tel:\s*/i, 'tel:').replace(/\s+/g, '');
  if (key === 'email') return v.replace(/^mailto:\s*/i, 'mailto:').replace(/\s+/g, '');
  return v;
};

const SocialSidebar: React.FC = () => {
  const { value: links } = useSiteSetting<SocialLinks>('social_links', {});
  const { value: visibility } = useSiteSetting<SocialVisibility>('social_visibility', {});

  // Only show icons that admin has both provided a value for AND toggled visible.
  const items: SocialLink[] = ORDER.map((k) => ({
    kind: k,
    key: k,
    href: normalize(k, links?.[k]),
    ...ICONS[k],
  })).filter((link) => link.href && visibility?.[link.kind as keyof SocialVisibility] === true);

  if (items.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 md:fixed md:left-4 md:top-1/2 md:transform md:-translate-y-1/2 md:translate-x-0">
      <div className="flex flex-row gap-3 md:flex-col md:gap-4 bg-card/80 backdrop-blur-sm rounded-full md:rounded-2xl px-4 py-2 md:px-3 md:py-4 shadow-lg border border-border/50">
        {items.map((link, i) => (
          <SocialIcon
            key={i}
            link={link}
            wrapperClassName="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-background/50 hover:bg-primary hover:scale-110 transition-all duration-200 shadow-sm"
            iconClassName="w-4 h-4 md:w-5 md:h-5"
          />
        ))}
      </div>
    </div>
  );
};

export default SocialSidebar;
