import type { QueryClient } from "@tanstack/react-query";
import {
  activeNoticesQueryOptions,
  type NoticePageKey,
} from "@/hooks/useNotices";
import {
  jobQueryKey,
  jobQueryOptions,
  jobsQueryOptions,
} from "@/hooks/useJobs";
import { featuredContentQueryOptions } from "@/hooks/useFeaturedContent";
import {
  blogCategoriesQueryOptions,
  blogQueryKey,
  blogQueryOptions,
  blogsQueryOptions,
  blogTagsQueryOptions,
  type Blog,
} from "@/hooks/useBlogs";
import { blogAuthorsQueryOptions } from "@/hooks/useBlogAuthors";
import {
  featuredBlogsQueryOptions,
  topBlogsQueryOptions,
} from "@/hooks/useTopBlogs";
import {
  recentJobsQueryOptions,
  recommendedBlogsQueryOptions,
} from "@/hooks/useRecommendations";
import { recommendedJobsQueryOptions } from "@/hooks/useRecommendedJobs";
import {
  featuredResourcesQueryOptions,
  publishedResourcesQueryOptions,
  resourceBySlugQueryOptions,
  resourceCategoriesQueryOptions,
  resourceTagGroupsQueryOptions,
  type ResourceCategory,
} from "@/hooks/useResources";
import { siteSettingQueryOptions } from "@/hooks/useSiteSettings";
import { sitePageContentQueryOptions } from "@/components/SitePageContent";

const publicSiteSettingKeys = ["social_links", "contact_info", "social_visibility"] as const;

type PrefetchOptions = Parameters<QueryClient["prefetchQuery"]>[0];

async function prefetch(queryClient: QueryClient, options: PrefetchOptions): Promise<void> {
  try {
    await queryClient.prefetchQuery(options);
  } catch (error) {
    console.warn("SSR prefetch failed", options.queryKey, error);
  }
}

function splitPath(url: string): string[] {
  const pathname = new URL(url, "https://ssr.local").pathname;
  return pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    });
}

function noticeKeyForPath(segments: string[]): NoticePageKey | undefined {
  const [first, second] = segments;
  if (!first) return "home";
  if (first === "blogs") return "lighthouse";
  if (first === "blog" && second) return "blog_detail";
  if (first === "resources" && !second) return "resources";
  if (first === "resources" && second) return "resource_category";
  if (first === "about") return "about";
  if (first === "contact") return "contact";
  if (first === "advertise") return "advertise";
  return undefined;
}

async function preloadCommon(queryClient: QueryClient, segments: string[]): Promise<void> {
  const noticeKey = noticeKeyForPath(segments);
  await Promise.all([
    ...publicSiteSettingKeys.map((key) => prefetch(queryClient, siteSettingQueryOptions(key))),
    noticeKey ? prefetch(queryClient, activeNoticesQueryOptions(noticeKey)) : Promise.resolve(),
  ]);
}

async function preloadResourceCategory(queryClient: QueryClient, categorySlug: string): Promise<void> {
  await Promise.all([
    prefetch(queryClient, publishedResourcesQueryOptions(categorySlug)),
    prefetch(queryClient, resourceCategoriesQueryOptions()),
  ]);

  const categories = queryClient.getQueryData<ResourceCategory[]>(["resource-categories"]) || [];
  const currentCategory = categories.find((category) => category.slug === categorySlug);
  if (currentCategory?.id) {
    await prefetch(queryClient, resourceTagGroupsQueryOptions(currentCategory.id));
  }
}

async function preloadBlogDetail(queryClient: QueryClient, slug: string): Promise<void> {
  await prefetch(queryClient, blogQueryOptions(slug));
  const blog = queryClient.getQueryData<Blog | null>(blogQueryKey(slug));
  if (!blog) return;

  await Promise.all([
    prefetch(
      queryClient,
      recommendedBlogsQueryOptions({
        currentBlogId: blog.id,
        categoryId: blog.category_id,
        authorIds: blog.authors?.map((author) => author.id) || [],
        tagIds: blog.tags?.map((tag) => tag.id) || [],
        limit: 10,
      })
    ),
    prefetch(queryClient, recentJobsQueryOptions(10)),
  ]);
}

async function preloadJobDetail(queryClient: QueryClient, jobId: string): Promise<void> {
  await prefetch(queryClient, jobQueryOptions(jobId));
  const job = queryClient.getQueryData(jobQueryKey(jobId));
  if (!job) return;

  await Promise.all([
    prefetch(queryClient, recommendedJobsQueryOptions(jobId)),
    prefetch(queryClient, topBlogsQueryOptions()),
    prefetch(queryClient, featuredContentQueryOptions("job_detail")),
  ]);
}

export async function preloadSsrData(queryClient: QueryClient, url: string): Promise<void> {
  const segments = splitPath(url);
  const [first, second, third] = segments;

  if (first === "admin") return;

  await preloadCommon(queryClient, segments);

  if (!first) {
    await Promise.all([
      prefetch(queryClient, jobsQueryOptions()),
      prefetch(queryClient, featuredContentQueryOptions("home")),
    ]);
    return;
  }

  if (first === "job" && second) {
    await preloadJobDetail(queryClient, second);
    return;
  }

  if (first === "blogs") {
    await Promise.all([
      prefetch(queryClient, blogsQueryOptions()),
      prefetch(queryClient, blogTagsQueryOptions()),
      prefetch(queryClient, blogAuthorsQueryOptions()),
      prefetch(queryClient, blogCategoriesQueryOptions()),
      prefetch(queryClient, featuredBlogsQueryOptions()),
    ]);
    return;
  }

  if (first === "blog" && second) {
    await preloadBlogDetail(queryClient, second);
    return;
  }

  if (first === "resources" && !second) {
    await Promise.all([
      prefetch(queryClient, resourceCategoriesQueryOptions()),
      prefetch(queryClient, featuredResourcesQueryOptions()),
    ]);
    return;
  }

  if (first === "resources" && second && !third) {
    await preloadResourceCategory(queryClient, second);
    return;
  }

  if (first === "resources" && second && third) {
    await prefetch(queryClient, resourceBySlugQueryOptions(third));
    return;
  }

  if (first === "about") {
    await prefetch(queryClient, sitePageContentQueryOptions("about"));
    return;
  }

  if (first === "advertise") {
    await prefetch(queryClient, sitePageContentQueryOptions("advertise"));
  }
}
