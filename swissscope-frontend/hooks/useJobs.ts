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

  useEffect(() => {
    let isMounted = true;

    async function loadJobs() {
      await Promise.resolve();

      if (!isMounted) return;
      setState((current) => ({ ...current, isLoading: true, error: null }));

      try {
        const response = await fetchJobs({ city, company, minScore, status });
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
    };
  }, [city, company, minScore, status]);

  async function setJobStatus(jobId: string, status: JobStatus) {
    const previousJobs = state.jobs;
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
        jobs: previousJobs,
        error: caughtError instanceof Error ? caughtError.message : "Failed to update job status",
      }));
    }
  }

  return { ...state, setJobStatus };
}
