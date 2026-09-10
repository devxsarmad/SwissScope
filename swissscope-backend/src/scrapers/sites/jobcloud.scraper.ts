import axios, { type AxiosResponse } from "axios";
import * as cheerio from "cheerio";
import { BaseScraper } from "../base/BaseScraper.js";
import { isRelevantSwissTechJob } from "../../services/jobRelevance.service.js";
import { cleanText, normalizeJob, type NormalizedJob, type RawJob } from "../../utils/normalizeData.js";

const DEFAULT_SEARCH_TERMS = [
  "React TypeScript Node.js",
  "Next.js Node.js",
  "Full Stack AI TypeScript",
  "MERN Developer",
  "PERN Developer",
  "OpenAI TypeScript",
  "NestJS React",
];

type JobPostingJson = {
  "@type"?: string | string[];
  title?: string;
  description?: string;
  employmentType?: string | string[];
  datePosted?: string;
  hiringOrganization?: {
    name?: string;
  };
  jobLocation?: JobLocationJson | JobLocationJson[];
  url?: string;
};

type JobLocationJson = {
  address?: {
    addressLocality?: string;
    addressRegion?: string;
    addressCountry?: string | { name?: string };
  };
};

type JobCloudPayload = {
  rows: RawJob[];
};

export class JobCloudScraper extends BaseScraper<JobCloudPayload, RawJob, NormalizedJob> {
  async fetch(): Promise<JobCloudPayload> {
    const rows = new Map<string, RawJob>();
    const searchTerms = this.config.searchTerms ?? DEFAULT_SEARCH_TERMS;

    for (const term of searchTerms) {
      const searchRows = await this.fetchSearchRows(term);
      for (const row of searchRows) {
        const key = row.url || `${row.title}:${row.company}`;
        if (key && !rows.has(key)) rows.set(key, row);
      }

      if (rows.size >= this.config.maxJobs) break;
    }

    const enrichedRows = await this.enrichRows([...rows.values()].slice(0, this.config.maxJobs));
    return { rows: enrichedRows };
  }

  parse(payload: JobCloudPayload): RawJob[] {
    return payload.rows;
  }

  override normalize(rawJobs: RawJob[]): NormalizedJob[] {
    return rawJobs
      .map((job) => normalizeJob(job, { source: this.source, baseUrl: this.config.baseUrl }))
      .filter((job) => job.title && job.company && job.url)
      .filter(isRelevantSwissTechJob)
      .slice(0, this.config.maxJobs);
  }

  private async fetchSearchRows(term: string): Promise<RawJob[]> {
    const url = new URL(this.config.searchPath ?? "/en/vacancies/", this.config.baseUrl);
    url.searchParams.set("term", term);
    url.searchParams.set("location", this.config.location ?? "Switzerland");

    try {
      const response = await this.request(url.toString());
      if (typeof response.data !== "string") return [];
      return parseJobPostingsFromHtml(response.data).map((posting) => toRawJob(posting, this.config.baseUrl));
    } catch {
      return [];
    }
  }

  private async enrichRows(rows: RawJob[]): Promise<RawJob[]> {
    const maxDetailRequests = this.config.maxDetailRequests ?? 6;
    const enrichedRows: RawJob[] = [];

    for (const row of rows) {
      if (enrichedRows.length >= maxDetailRequests) {
        enrichedRows.push(row);
        continue;
      }

      const enrichedRow = await this.fetchDetailRow(row);
      enrichedRows.push(enrichedRow ?? row);
    }

    return enrichedRows;
  }

  private async fetchDetailRow(row: RawJob): Promise<RawJob | null> {
    if (!row.url) return null;

    try {
      const response = await this.request(row.url);
      if (typeof response.data !== "string") return null;
      const [posting] = parseJobPostingsFromHtml(response.data);
      if (!posting) return null;

      const detailRow = toRawJob(posting, this.config.baseUrl, response.data);

      return {
        ...row,
        ...detailRow,
        techStack: [...(row.techStack ?? []), ...(detailRow.techStack ?? [])],
      };
    } catch {
      return null;
    }
  }

  private async request(url: string): Promise<AxiosResponse<unknown>> {
    return axios.get(url, {
      timeout: this.config.requestTimeoutMs,
      maxRedirects: 5,
      responseType: "text",
      headers: {
        "User-Agent": this.config.userAgent,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: `${this.config.baseUrl}/`,
      },
      validateStatus: (status) => status >= 200 && status < 400,
    });
  }
}

export function parseJobPostingsFromHtml(html: string): JobPostingJson[] {
  const $ = cheerio.load(html);
  const postings: JobPostingJson[] = [];

  $('script[type="application/ld+json"]').each((_, element) => {
    const scriptText = $(element).text();
    if (!scriptText) return;

    try {
      collectJobPostings(JSON.parse(scriptText) as unknown, postings);
    } catch {
      // Ignore invalid JSON-LD scripts and keep parsing the rest of the page.
    }
  });

  return dedupePostings(postings);
}

function collectJobPostings(value: unknown, postings: JobPostingJson[]): void {
  if (Array.isArray(value)) {
    value.forEach((item) => collectJobPostings(item, postings));
    return;
  }

  if (!isRecord(value)) return;

  if (hasType(value, "JobPosting")) {
    postings.push(value as JobPostingJson);
  }

  collectJobPostings(value.item, postings);
  collectJobPostings(value.itemListElement, postings);
  collectJobPostings(value["@graph"], postings);
}

function toRawJob(posting: JobPostingJson, baseUrl: string, html = ""): RawJob {
  const description = htmlToText(posting.description ?? "");

  return {
    title: posting.title,
    company: posting.hiringOrganization?.name,
    location: formatLocation(posting.jobLocation),
    url: posting.url ? new URL(posting.url, baseUrl).toString() : "",
    description,
    techStack: [],
    workload: formatEmploymentType(posting.employmentType),
    postedAt: posting.datePosted,
    applicantCount: extractApplicantCount(html),
  };
}

function extractApplicantCount(html: string): number | null {
  if (!html) return null;

  const text = htmlToText(html);
  const match = text.match(/\b(\d{1,5})\s+(?:applicants?|applications?)\b/i);
  if (!match?.[1]) return null;

  const count = Number(match[1]);
  return Number.isInteger(count) && count >= 0 ? count : null;
}

function htmlToText(html: string): string {
  return cleanText(cheerio.load(html).text());
}

function formatEmploymentType(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean).join(", ");
  return cleanText(value);
}

function formatLocation(value: JobLocationJson | JobLocationJson[] | undefined): string {
  const locations = Array.isArray(value) ? value : value ? [value] : [];

  return locations
    .map((location) => {
      const address = location.address;
      const country = typeof address?.addressCountry === "string" ? address.addressCountry : address?.addressCountry?.name;
      return [address?.addressLocality, address?.addressRegion, country].map(cleanText).filter(Boolean).join(", ");
    })
    .filter(Boolean)
    .join(" / ");
}

function dedupePostings(postings: JobPostingJson[]): JobPostingJson[] {
  const seen = new Set<string>();

  return postings.filter((posting) => {
    const key = posting.url || `${posting.title}:${posting.hiringOrganization?.name}`;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hasType(value: Record<string, unknown>, expectedType: string): boolean {
  const type = value["@type"];
  return Array.isArray(type) ? type.includes(expectedType) : type === expectedType;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
