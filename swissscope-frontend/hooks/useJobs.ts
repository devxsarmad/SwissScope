"use client";

import { useEffect, useState } from "react";
import { fetchJobs, updateJobStatus, type JobFilters } from "@/lib/api";
import type { Job, JobStatus } from "@/lib/types";

type JobsState = {
  jobs: Job[];
  isLoading: boolean;
  error: string | null;
};

export function useJobs(filters: JobFilters = {}) {
  const { city, company, minScore, status } = filters;
  const [state, setState] = useState<JobsState>({
    jobs: [],
    isLoading: true,
    error: null,
  });
  const [statusError, setStatusError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadJobs() {
      await Promise.resolve();

      if (!isMounted) return;
      setStatusError(null);
      setState((current) => ({ ...current, isLoading: true, error: null }));

      try {
        const response = await fetchJobs({ city, company, minScore, status }, controller.signal);
        if (isMounted) {
          setState({ jobs: response.jobs, isLoading: false, error: null });
        }
      } catch (caughtError: unknown) {
        if (isMounted) {
          setState({
            jobs: [],
            isLoading: false,
            error: caughtError instanceof Error ? caughtError.message : "Failed to load jobs",
          });
        }
      }
    }

    void loadJobs();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [city, company, minScore, status, refreshKey]);

  async function setJobStatus(jobId: string, status: JobStatus) {
    setStatusError(null);
    const previousJob = state.jobs.find((job) => job.id === jobId);
    setState((current) => ({
      ...current,
      jobs: current.jobs.map((job) => (job.id === jobId ? { ...job, status } : job)),
      error: null,
    }));

    try {
      const updatedJob = await updateJobStatus(jobId, status);
      setState((current) => ({
        ...current,
        jobs: current.jobs.map((job) => (job.id === jobId ? updatedJob : job)),
      }));
    } catch (caughtError) {
      setState((current) => ({
        ...current,
        jobs: previousJob
          ? current.jobs.map((job) => (job.id === jobId ? previousJob : job))
          : current.jobs,
      }));
      setStatusError(caughtError instanceof Error ? caughtError.message : "Failed to update job status");
    }
  }

  return {
    ...state,
    statusError,
    setJobStatus,
    refresh: () => setRefreshKey((current) => current + 1),
  };
}
