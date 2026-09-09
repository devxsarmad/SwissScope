import type { SiteConfig } from "../../config/sites.config.js";

export abstract class BaseScraper<Payload, RawJob, NormalizedJob> {
  readonly config: SiteConfig;
  readonly source: string;

  constructor(config: SiteConfig) {
    this.config = config;
    this.source = config.name;
  }

  abstract fetch(): Promise<Payload>;

  abstract parse(payload: Payload): RawJob[];

  normalize(rawJobs: RawJob[]): NormalizedJob[] {
    return rawJobs as unknown as NormalizedJob[];
  }

  async scrape(): Promise<NormalizedJob[]> {
    const payload = await this.fetch();
    const rawJobs = this.parse(payload);
    return this.normalize(rawJobs);
  }
}
