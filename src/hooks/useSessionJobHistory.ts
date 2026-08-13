import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

const STORAGE_KEY = 'oppavenue_viewed_jobs';
const MAX_HISTORY_SIZE = 50;

export interface AggregatedProfile {
  jobIds: string[];
  domains: Record<string, number>;
  skills: Record<string, number>;
  jobTypes: Record<string, number>;
  sectors: Record<string, number>;
  avgSalaryMin: number;
  avgSalaryMax: number;
  workModes: Record<string, number>;
}

export const getViewedJobs = (): string[] => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const addViewedJob = (jobId: string): void => {
  try {
    const current = getViewedJobs();
    if (current.includes(jobId)) return;
    const updated = [jobId, ...current].slice(0, MAX_HISTORY_SIZE);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save job to session history:', e);
  }
};

export const useAggregatedProfile = () => {
  const viewedJobIds = useMemo(() => getViewedJobs(), []);

  return useQuery({
    queryKey: ['aggregated-profile', viewedJobIds],
    queryFn: async (): Promise<AggregatedProfile> => {
      return {
        jobIds: viewedJobIds,
        domains: {},
        skills: {},
        jobTypes: {},
        sectors: {},
        avgSalaryMin: 0,
        avgSalaryMax: 0,
        workModes: {},
      };
    },
    enabled: viewedJobIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });
};

export const useSessionJobHistory = () => {
  const addJob = useCallback((jobId: string) => {
    addViewedJob(jobId);
  }, []);

  const getJobs = useCallback(() => {
    return getViewedJobs();
  }, []);

  return {
    addJob,
    getJobs,
    viewedJobIds: getViewedJobs(),
  };
};
