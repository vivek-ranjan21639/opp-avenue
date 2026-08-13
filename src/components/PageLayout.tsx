import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdvertisePage from '@/components/AdvertisePage';
import NoticeBanner from '@/components/NoticeBanner';
import { usePrerenderReady } from '@/hooks/usePrerenderReady';
import type { NoticePageKey } from '@/hooks/useNotices';

interface PageLayoutProps {
  children: React.ReactNode;
  prerenderReady?: boolean;
  className?: string;
  noticePage?: NoticePageKey;
}

const defaultFilters = {
  location: [] as string[],
  jobType: [] as string[],
  experience: [] as string[],
  salaryRange: [] as string[],
  domain: [] as string[],
  skills: [] as string[],
  companies: [] as string[],
  workMode: [] as string[],
};

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  prerenderReady = true,
  className = "min-h-screen bg-background",
  noticePage,
}) => {
  const [showAdvertise, setShowAdvertise] = useState(false);
  const location = useLocation();

  usePrerenderReady(prerenderReady);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Auto-derive notice page key from route if not provided
  const derivedKey: NoticePageKey | undefined = noticePage || (() => {
    const p = location.pathname;
    if (p === '/blogs') return 'lighthouse';
    if (p.startsWith('/blog/')) return 'blog_detail';
    if (p === '/resources') return 'resources';
    if (p.startsWith('/resources/')) return 'resource_category';
    if (p === '/about') return 'about';
    if (p === '/contact') return 'contact';
    if (p === '/advertise') return 'advertise';
    return undefined;
  })();

  return (
    <div className={className}>
      {derivedKey && <NoticeBanner page={derivedKey} />}
      <Header
        onAdvertiseClick={() => setShowAdvertise(true)}
        searchQuery=""
        onSearchChange={() => {}}
        activeFilters={defaultFilters}
        onFiltersChange={() => {}}
      />
      {children}
      <Footer />
      <AdvertisePage isOpen={showAdvertise} onClose={() => setShowAdvertise(false)} />
    </div>
  );
};

export default PageLayout;
