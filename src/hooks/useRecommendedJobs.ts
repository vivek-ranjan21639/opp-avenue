import { useQuery } from "@tanstack/react-query";
import type { Job } from "@/components/JobCard";

export const recommendedJobsQueryOptions = (currentJobId: string | undefined) => ({
  queryKey: ['recommended-jobs', currentJobId] as const,
  queryFn: async (): Promise<Job[]> => {
    return [];
  },
});

export const useRecommendedJobs = (currentJobId: string | undefined) => {
  return useQuery({
    ...recommendedJobsQueryOptions(currentJobId),
    enabled: !!currentJobId,
  });
};
