export type SiteConfig = {
  name: string;
  baseUrl: string;
  jobsLightPath: string;
  rssPath: string;
  readerFeedUrl: string;
  telegramFeedUrl: string;
  maxJobs: number;
  requestTimeoutMs: number;
  fallbackTimeoutMs: number;
  userAgent: string;
};

export const sitesConfig = {
  swissdevjobs: {
    name: "SwissDevJobs",
    baseUrl: "https://swissdevjobs.ch",
    jobsLightPath: "/api/jobsLight",
    rssPath: "/rss",
    readerFeedUrl: "https://r.jina.ai/https://t.me/s/switzerlanddevjobs",
    telegramFeedUrl: "https://t.me/s/switzerlanddevjobs",
    maxJobs: 20,
    requestTimeoutMs: 8000,
    fallbackTimeoutMs: 45000,
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  },
} satisfies Record<string, SiteConfig>;
