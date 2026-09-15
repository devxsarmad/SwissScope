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

  useEffect(() => {
    let isMounted = true;

    async function loadScrapeRuns() {
      try {
        const response = await fetchScrapeRuns(limit);
        if (isMounted) setState({ scrapeRuns: response.scrapeRuns, isLoading: false, error: null });
      } catch (error) {
        if (isMounted) {
          setState({
            scrapeRuns: [],
            isLoading: false,
            error: error instanceof Error ? error.message : "Failed to load scrape history",
          });
        }
      }
    }

    void loadScrapeRuns();

    return () => {
      isMounted = false;
    };
  }, [limit]);

  return state;
}
