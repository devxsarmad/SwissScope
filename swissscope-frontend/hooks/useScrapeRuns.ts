"use client";

import { useEffect, useState } from "react";
import { fetchScrapeRuns } from "@/lib/api";
import type { ScrapeRun } from "@/lib/types";

type ScrapeRunsState = {
  scrapeRuns: ScrapeRun[];
  isLoading: boolean;
  error: string | null;
};

export function useScrapeRuns(limit = 5) {
  const [state, setState] = useState<ScrapeRunsState>({
    scrapeRuns: [],
    isLoading: true,
    error: null,
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadScrapeRuns() {
      setState((current) => ({ ...current, isLoading: true, error: null }));
      try {
        const response = await fetchScrapeRuns(limit, controller.signal);
        if (isMounted) setState({ scrapeRuns: response.scrapeRuns, isLoading: false, error: null });
      } catch (error) {
        if (isMounted) {
          setState((current) => ({
            ...current,
            isLoading: false,
            error: error instanceof Error ? error.message : "Failed to load scrape history",
          }));
        }
      }
    }

    void loadScrapeRuns();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [limit, refreshKey]);

  return {
    ...state,
    refresh: () => setRefreshKey((current) => current + 1),
  };
}
