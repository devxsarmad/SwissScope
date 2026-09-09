"use client";

import { useEffect, useState } from "react";
import { fetchJobs, type JobFilters } from "@/lib/api";
import type { Job } from "@/lib/types";

type JobsState = {
  jobs: Job[];
  isLoading: boolean;
  error: string | null;
};

export function useJobs(filters: JobFilters = {}) {
  const { city, company, minScore } = filters;
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
        const response = await fetchJobs({ city, company, minScore });
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
  }, [city, company, minScore]);

  return state;
}
