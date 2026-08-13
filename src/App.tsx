import { lazy, Suspense, useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  HydrationBoundary,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { usePageTracking } from "./hooks/usePageTracking";

// Public routes are imported eagerly so server-rendered HTML contains the
// actual crawlable page content instead of a Suspense fallback.
import Index from "./pages/Index";
import JobDetail from "./pages/JobDetail";
import Advertise from "./pages/Advertise";
import About from "./pages/About";
import Resources from "./pages/Resources";
import Blogs from "./pages/Blogs";
import BlogDetail from "./pages/BlogDetail";
import ResourceCategoryPage from "./pages/ResourceCategoryPage";
import ResourceDetail from "./pages/ResourceDetail";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import Disclaimer from "./pages/Disclaimer";
import CookiePolicy from "./pages/CookiePolicy";
import Sitemap from "./pages/Sitemap";
import NotFound from "./pages/NotFound";
import { RequirePermission } from "./components/admin/RequirePermission";

const PageTracker = () => {
  usePageTracking();
  return null;
};

// Admin (heavy, never needed by public visitors) - lazy
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminLocations = lazy(() => import("./pages/admin/AdminLocations"));
const AdminLiveJobs = lazy(() => import("./pages/admin/AdminLiveJobs"));
const AdminDraftJobs = lazy(() => import("./pages/admin/AdminDraftJobs"));
const AdminBulkUpload = lazy(() => import("./pages/admin/AdminBulkUpload"));
const AdminBulkJobs = lazy(() => import("./pages/admin/AdminBulkJobs"));
const AdminJobEditor = lazy(() => import("./pages/admin/AdminJobEditor"));
const AdminBlogs = lazy(() => import("./pages/admin/AdminBlogs"));
const AdminBlogEditor = lazy(() => import("./pages/admin/AdminBlogEditor"));
const AdminResources = lazy(() => import("./pages/admin/AdminResources"));
const AdminResourceEditor = lazy(() => import("./pages/admin/AdminResourceEditor"));
const AdminCompanies = lazy(() => import("./pages/admin/AdminCompanies"));
const AdminSources = lazy(() => import("./pages/admin/AdminSources"));
const AdminDomains = lazy(() => import("./pages/admin/AdminDomains"));
const AdminSkills = lazy(() => import("./pages/admin/AdminSkills"));
const AdminJobTaxonomy = lazy(() => import("./pages/admin/AdminJobTaxonomy"));
const AdminBlogCategories = lazy(() => import("./pages/admin/AdminBlogCategories"));
const AdminBlogTags = lazy(() => import("./pages/admin/AdminBlogTags"));
const AdminBlogAuthors = lazy(() => import("./pages/admin/AdminBlogAuthors"));
const AdminResourceCategories = lazy(() => import("./pages/admin/AdminResourceCategories"));
const AdminResourceCategoryEditor = lazy(() => import("./pages/admin/AdminResourceCategoryEditor"));
const AdminResourceTags = lazy(() => import("./pages/admin/AdminResourceTags"));
const AdminFeatured = lazy(() => import("./pages/admin/AdminFeatured"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminNotices = lazy(() => import("./pages/admin/AdminNotices"));
const AdminSitePages = lazy(() => import("./pages/admin/AdminSitePages"));
const AdminSiteSettings = lazy(() => import("./pages/admin/AdminSiteSettings"));
const AdminMessages = lazy(() => import("./pages/admin/AdminMessages"));

export const createAppQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
      },
    },
  });

const RouteFallback = () => (
  <div className="min-h-screen bg-background" />
);

interface AppProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
  dehydratedState?: unknown;
  helmetContext?: Record<string, unknown>;
}

export const AppProviders = ({
  children,
  queryClient,
  dehydratedState,
  helmetContext,
}: AppProvidersProps) => {
  const [client] = useState(() => queryClient ?? createAppQueryClient());

  return (
    <HelmetProvider context={helmetContext}>
      <QueryClientProvider client={client}>
        <HydrationBoundary state={dehydratedState}>
          {children}
        </HydrationBoundary>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export const AppRoutes = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <PageTracker />
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/job/:jobId" element={<JobDetail />} />
        <Route path="/advertise" element={<Advertise />} />
        <Route path="/about" element={<About />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/resources/:categorySlug" element={<ResourceCategoryPage />} />
        <Route path="/resources/:categorySlug/:slug" element={<ResourceDetail />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/blog/:blogId" element={<BlogDetail />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsConditions />} />
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
        <Route path="/sitemap" element={<Sitemap />} />

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="jobs/locations" element={<RequirePermission module="taxonomy"><AdminLocations /></RequirePermission>} />
          <Route path="jobs/live" element={<RequirePermission module="jobs"><AdminLiveJobs /></RequirePermission>} />
          <Route path="jobs/drafts" element={<RequirePermission module="jobs"><AdminDraftJobs /></RequirePermission>} />
          <Route path="jobs/bulk" element={<RequirePermission module="bulk_jobs"><AdminBulkJobs /></RequirePermission>} />
          <Route path="jobs/bulk-upload" element={<RequirePermission module="bulk_jobs"><AdminBulkUpload /></RequirePermission>} />
          <Route path="jobs/edit" element={<RequirePermission module="jobs"><AdminJobEditor /></RequirePermission>} />
          <Route path="jobs/edit/:jobId" element={<RequirePermission module="jobs"><AdminJobEditor /></RequirePermission>} />
          <Route path="blogs" element={<RequirePermission module="blogs"><AdminBlogs /></RequirePermission>} />
          <Route path="blogs/edit" element={<RequirePermission module="blogs"><AdminBlogEditor /></RequirePermission>} />
          <Route path="blogs/edit/:blogId" element={<RequirePermission module="blogs"><AdminBlogEditor /></RequirePermission>} />
          <Route path="resources" element={<RequirePermission module="resources"><AdminResources /></RequirePermission>} />
          <Route path="resources/edit" element={<RequirePermission module="resources"><AdminResourceEditor /></RequirePermission>} />
          <Route path="resources/edit/:resourceId" element={<RequirePermission module="resources"><AdminResourceEditor /></RequirePermission>} />
          <Route path="jobs/companies" element={<RequirePermission module="taxonomy"><AdminCompanies /></RequirePermission>} />
          <Route path="jobs/sources" element={<RequirePermission module="taxonomy"><AdminSources /></RequirePermission>} />
          <Route path="jobs/domains" element={<RequirePermission module="taxonomy"><AdminDomains /></RequirePermission>} />
          <Route path="jobs/skills" element={<RequirePermission module="taxonomy"><AdminSkills /></RequirePermission>} />
          <Route path="jobs/taxonomy" element={<RequirePermission module="taxonomy"><AdminJobTaxonomy /></RequirePermission>} />
          <Route path="blogs/categories" element={<RequirePermission module="taxonomy"><AdminBlogCategories /></RequirePermission>} />
          <Route path="blogs/tags" element={<RequirePermission module="taxonomy"><AdminBlogTags /></RequirePermission>} />
          <Route path="blogs/authors" element={<RequirePermission module="taxonomy"><AdminBlogAuthors /></RequirePermission>} />
          <Route path="resources/categories" element={<RequirePermission module="taxonomy"><AdminResourceCategories /></RequirePermission>} />
          <Route path="resources/categories/new" element={<RequirePermission module="taxonomy"><AdminResourceCategoryEditor /></RequirePermission>} />
          <Route path="resources/categories/:id" element={<RequirePermission module="taxonomy"><AdminResourceCategoryEditor /></RequirePermission>} />
          <Route path="resources/tags" element={<RequirePermission module="taxonomy"><AdminResourceTags /></RequirePermission>} />
          <Route path="featured" element={<RequirePermission module="featured_carousel"><AdminFeatured /></RequirePermission>} />
          <Route path="analytics" element={<RequirePermission module="analytics"><AdminAnalytics /></RequirePermission>} />
          <Route path="notices" element={<AdminNotices />} />
          <Route path="site-pages" element={<AdminSitePages />} />
          <Route path="site-settings" element={<AdminSiteSettings />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="users" element={<RequirePermission module="user_management"><AdminUsers /></RequirePermission>} />
          {/* Legacy routes */}
          <Route path="companies" element={<RequirePermission module="taxonomy"><AdminCompanies /></RequirePermission>} />
          <Route path="sources" element={<RequirePermission module="taxonomy"><AdminSources /></RequirePermission>} />
        </Route>

        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </TooltipProvider>
);

interface AppProps {
  queryClient?: QueryClient;
  dehydratedState?: unknown;
}

const App = ({ queryClient, dehydratedState }: AppProps) => (
  <AppProviders queryClient={queryClient} dehydratedState={dehydratedState}>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AppProviders>
);

export default App;
