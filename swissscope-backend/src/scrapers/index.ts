import { sitesConfig } from "../config/sites.config.js";
import { SwissDevJobsScraper } from "./sites/swissdevjobs.scraper.js";

export const scrapers = {
  swissdevjobs: new SwissDevJobsScraper(sitesConfig.swissdevjobs),
};

export type ScraperName = keyof typeof scrapers;

export function getScraper(name: string) {
  const scraper = scrapers[name as ScraperName];
  if (!scraper) {
    throw new Error(`Unknown scraper "${name}". Available scrapers: ${Object.keys(scrapers).join(", ")}`);
  }

  return scraper;
}
