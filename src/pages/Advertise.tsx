import React, { useState } from 'react';
import { usePrerenderReady } from '@/hooks/usePrerenderReady';
import Header, { FilterState } from '@/components/Header';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import SitePageContent from '@/components/SitePageContent';

const Advertise = () => {
  usePrerenderReady(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    location: [], jobType: [], experience: [], salaryRange: [],
    domain: [], skills: [], companies: [], workMode: [],
  });

  return (
    <div className="min-h-screen bg-background relative">
      <SEO
        title="Advertise With Us"
        description="Advertise on Opp Avenue."
        canonical="/advertise"
      />
      <div className="relative z-10">
        <Header
          onAdvertiseClick={() => {}}
          onSearchChange={setSearchQuery}
          onFiltersChange={setActiveFilters}
          searchQuery={searchQuery}
          activeFilters={activeFilters}
        />
        <main className="px-4 sm:px-8 pt-4 pb-8">
          <div className="max-w-5xl mx-auto">
            <SitePageContent
              slug="advertise"
              fallback={
                <div className="text-center py-20 text-muted-foreground">
                  <h1 className="text-2xl font-semibold mb-2">Advertise with Opp Avenue</h1>
                  <p className="text-sm">Content coming soon.</p>
                </div>
              }
            />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Advertise;
