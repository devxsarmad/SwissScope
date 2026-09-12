"use client";

import { useEffect, useState } from "react";
import { fetchLatestScrapeRun } from "@/lib/api";
import type { ScrapeRun } from "@/lib/types";

type LatestScrapeRunState = {
  scrapeRun: ScrapeRun | null;
  isLoading: boolean;
  error: string | null;
};

export function useLatestScrapeRun() {
  const [state, setState] = useState<LatestScrapeRunState>({
    scrapeRun: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadLatestScrapeRun() {
      try {
        const response = await fetchLatestScrapeRun();
        if (isMounted) setState({ scrapeRun: response.scrapeRun, isLoading: false, error: null });
      } catch (error) {
        if (isMounted) {
          setState({
            scrapeRun: null,
            isLoading: false,
            error: error instanceof Error ? error.message : "Failed to load scrape status",
          });
        }
      }
    }

    void loadLatestScrapeRun();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
