import { sitesConfig } from "../config/sites.config.js";
import { ArbeitSwissScraper } from "./sites/arbeitswiss.scraper.js";
import { SwissDevJobsScraper } from "./sites/swissdevjobs.scraper.js";
import { JobCloudScraper } from "./sites/jobcloud.scraper.js";

export const scrapers = {
  swissdevjobs: new SwissDevJobsScraper(sitesConfig.swissdevjobs),
  jobsch: new JobCloudScraper(sitesConfig.jobsch),
  jobup: new JobCloudScraper(sitesConfig.jobup),
  arbeitswiss: new ArbeitSwissScraper(sitesConfig.arbeitswiss),
};

export type ScraperName = keyof typeof scrapers;

export function getScraper(name: string) {
  const scraper = scrapers[name as ScraperName];
  if (!scraper) {
    throw new Error(`Unknown scraper "${name}". Available scrapers: ${Object.keys(scrapers).join(", ")}`);
  }

  return scraper;
}
