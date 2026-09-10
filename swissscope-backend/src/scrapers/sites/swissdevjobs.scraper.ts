import axios, { type AxiosResponse } from "axios";
import * as cheerio from "cheerio";
import { BaseScraper } from "../base/BaseScraper.js";
import { cleanText, normalizeJob, toAbsoluteUrl, type NormalizedJob, type RawJob } from "../../utils/normalizeData.js";
import { isRelevantSwissTechJob } from "../../services/jobRelevance.service.js";

const SOURCE = "swissdevjobs";

type ApiJobRow = {
  _id?: string;
  name?: string;
  company?: string;
  actualCity?: string;
  cityCategory?: string;
  jobUrl?: string;
  jobType?: string;
  datePosted?: string;
  postedAt?: string;
  createdAt?: string;
  publishedAt?: string;
  technologies?: string[];
  tech?: string[];
  techCategory?: string;
};

type ScraperPayload =
  | { type: "api"; rows: ApiJobRow[] }
  | { type: "rss"; html: string }
  | { type: "reader"; markdown: string }
  | { type: "telegram"; html: string };

export class SwissDevJobsScraper extends BaseScraper<ScraperPayload, RawJob, NormalizedJob> {
  async fetch(): Promise<ScraperPayload> {
    const apiPayload = await this.tryFetchApi();
    if (apiPayload) return apiPayload;

    const rssPayload = await this.tryFetchRss();
    if (rssPayload) return rssPayload;

    const readerPayload = await this.tryFetchReaderFeed();
    if (readerPayload) return readerPayload;

    return this.fetchTelegramFeed();
  }

  parse(payload: ScraperPayload): RawJob[] {
    if (payload.type === "api") {
      return payload.rows.map((row) => this.parseApiRow(row)).filter(hasRequiredFields);
    }

    if (payload.type === "rss") {
      return this.parseRss(payload.html);
    }

    if (payload.type === "reader") {
      return this.parseReaderMarkdown(payload.markdown);
    }

    return this.parseTelegram(payload.html);
  }

  override normalize(rawJobs: RawJob[]): NormalizedJob[] {
    return rawJobs
      .slice(0, this.config.maxJobs)
      .map((job) =>
        normalizeJob(job, {
          source: SOURCE,
          baseUrl: this.config.baseUrl,
        }),
      )
      .filter((job) => job.title && job.company && job.url)
      .filter(isRelevantSwissTechJob);
  }

  private async tryFetchApi(): Promise<ScraperPayload | null> {
    const url = new URL(requireConfigValue(this.config.jobsLightPath, "jobsLightPath"), this.config.baseUrl);
    url.searchParams.set("_cb", Date.now().toString());

    const response = await this.tryRequest(url.toString());
    if (!response) return null;

    if (Array.isArray(response.data)) {
      return { type: "api", rows: response.data as ApiJobRow[] };
    }

    return null;
  }

  private async tryFetchRss(): Promise<ScraperPayload | null> {
    const url = new URL(requireConfigValue(this.config.rssPath, "rssPath"), this.config.baseUrl);
    const response = await this.tryRequest(url.toString());
    if (!response) return null;

    if (typeof response.data !== "string" || !response.data.includes("<rss")) {
      return null;
    }

    return { type: "rss", html: response.data };
  }

  private async fetchTelegramFeed(): Promise<ScraperPayload> {
    const response = await this.request(requireConfigValue(this.config.telegramFeedUrl, "telegramFeedUrl"), this.config.fallbackTimeoutMs);
    if (typeof response.data !== "string") {
      throw new Error("SwissDevJobs fallback feed returned a non-HTML response.");
    }

    return { type: "telegram", html: response.data };
  }

  private async tryFetchReaderFeed(): Promise<ScraperPayload | null> {
    const response = await this.tryRequest(requireConfigValue(this.config.readerFeedUrl, "readerFeedUrl"), this.config.fallbackTimeoutMs);
    if (typeof response?.data !== "string" || !response.data.includes("SwissDevJobs")) {
      return null;
    }

    return { type: "reader", markdown: response.data };
  }

  private async request(url: string, timeoutMs = this.config.requestTimeoutMs): Promise<AxiosResponse<unknown>> {
    return axios.get(url, {
      timeout: timeoutMs,
      maxRedirects: 5,
      responseType: "text",
      transformResponse: [(data: unknown) => tryParseJson(data)],
      headers: {
        "User-Agent": this.config.userAgent,
        Accept: "application/json, text/html, application/rss+xml, */*",
        "Accept-Language": "en-US,en;q=0.9,de;q=0.8",
        Referer: `${this.config.baseUrl}/`,
      },
      validateStatus: (status) => status >= 200 && status < 400,
    });
  }

  private async tryRequest(url: string, timeoutMs = this.config.requestTimeoutMs): Promise<AxiosResponse<unknown> | null> {
    try {
      return await this.request(url, timeoutMs);
    } catch {
      return null;
    }
  }

  private parseApiRow(row: ApiJobRow): RawJob {
    const slug = row.jobUrl || "";
    const location = row.actualCity || row.cityCategory || "";
    const techStack = [
      ...(Array.isArray(row.technologies) ? row.technologies : []),
      ...(Array.isArray(row.tech) ? row.tech : []),
      row.techCategory,
    ].filter(Boolean) as string[];

    return {
      title: row.name,
      company: row.company,
      location,
      url: slug ? `/jobs/${slug}` : "",
      description: [row.name, row.company, location, techStack.join(" ")].filter(Boolean).join(" "),
      techStack,
      workload: row.jobType,
      postedAt: row.datePosted || row.postedAt || row.publishedAt || row.createdAt,
    };
  }

  private parseRss(html: string): RawJob[] {
    const $ = cheerio.load(html, { xmlMode: true });

    return $("item")
      .toArray()
      .map((item) => {
        const $item = $(item);
        const titleText = cleanText($item.find("title").first().text());
        const [title, company] = splitTitleAndCompany(titleText);
        const description = cleanText($item.find("description").first().text());
        const pubDate = cleanText($item.find("pubDate").first().text());

        return {
          title,
          company,
          location: extractLocation(description),
          url: $item.find("link").first().text(),
          description,
          techStack: extractTechTags(description),
          workload: extractWorkload(`${title} ${description}`),
          postedAt: pubDate,
        };
      })
      .filter(hasRequiredFields);
  }

  private parseTelegram(html: string): RawJob[] {
    const $ = cheerio.load(html);
    const jobs: RawJob[] = [];

    $(".tgme_widget_message_text").each((_, element) => {
      const text = $(element).text();
      const links = $(element)
        .find("a[href]")
        .toArray()
        .map((link) => $(link).attr("href"))
        .filter((href): href is string => Boolean(href));

      jobs.push(...extractJobsFromTelegramText(text, links, this.config.baseUrl));
    });

    return dedupeJobs(jobs).slice(0, this.config.maxJobs);
  }

  private parseReaderMarkdown(markdown: string): RawJob[] {
    return dedupeJobs(extractJobsFromReaderMarkdown(markdown, this.config.baseUrl)).slice(0, this.config.maxJobs);
  }
}

function requireConfigValue(value: string | undefined, fieldName: string): string {
  if (!value) {
    throw new Error(`SwissDevJobs scraper requires config field ${fieldName}.`);
  }

  return value;
}

function tryParseJson(data: unknown): unknown {
  if (typeof data !== "string") return data;

  try {
    return JSON.parse(data) as unknown;
  } catch {
    return data;
  }
}

function hasRequiredFields(job: RawJob): boolean {
  return Boolean(cleanText(job.title) && cleanText(job.company) && cleanText(job.url));
}

function splitTitleAndCompany(value: string): [string, string] {
  const parts = cleanText(value).split(/\s+\|\s+/);
  if (parts.length >= 2) return [parts[0] ?? "", parts.slice(1).join(" | ")];
  return [value, "Unknown"];
}

function extractJobsFromTelegramText(text: string, links: string[], baseUrl: string): RawJob[] {
  const lines = text
    .replace(/\u2063/g, "\n")
    .split("\n")
    .map(cleanText)
    .filter(Boolean);
  const jobs: RawJob[] = [];
  let linkIndex = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (!line.includes(" | ")) continue;

    const [title, company] = splitTitleAndCompany(line.replace(/^[^\p{L}\p{N}]+/u, ""));
    const metaLine = lines[index + 1] ?? "";
    const link = links[linkIndex] ?? "";
    linkIndex += 1;

    jobs.push({
      title,
      company,
      location: extractLocation(metaLine),
      url: toAbsoluteUrl(link, baseUrl),
      description: `${line} ${metaLine}`,
      techStack: extractTechTags(`${line} ${metaLine}`),
      workload: extractWorkload(`${line} ${metaLine}`),
    });
  }

  return jobs.filter(hasRequiredFields);
}

function extractJobsFromReaderMarkdown(markdown: string, baseUrl: string): RawJob[] {
  const lines = markdown
    .replace(/\u2063/g, "\n")
    .split("\n")
    .map(stripMarkdown)
    .map(cleanText)
    .filter(Boolean);
  const jobs: RawJob[] = [];
  let postContext = "";

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (!line.includes(" | ") || !line.includes("➡️")) {
      if (isPostContextLine(line)) {
        postContext = line;
      }
      continue;
    }

    const [title, company] = splitTitleAndCompany(line.replace(/^.*?➡️\s*/u, ""));
    const metaLine = lines[index + 1] ?? "";
    const urlLine = lines[index + 2] ?? "";

    jobs.push({
      title,
      company,
      location: extractLocation(metaLine),
      url: toAbsoluteUrl(extractFirstUrl(urlLine), baseUrl),
      description: `${postContext} ${line} ${metaLine}`,
      techStack: extractTechTags(`${postContext} ${line} ${metaLine}`),
      workload: extractWorkload(`${postContext} ${line} ${metaLine}`),
    });
  }

  return jobs.filter(hasRequiredFields);
}

function isPostContextLine(value: string): boolean {
  if (!value || value.startsWith("Title:") || value.startsWith("URL Source:")) return false;
  if (/^(?:Markdown Content:|August \d+|PS\.|❤|🔥|\[|_)/i.test(value)) return false;
  if (/^https?:\/\//i.test(value)) return false;
  return value.length > 20;
}

function stripMarkdown(value: string): string {
  return value
    .replace(/!\[[^\]]*]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)]\(([^)]+)\)/g, "$1")
    .replace(/[_*`]/g, "");
}

function extractFirstUrl(value: string): string {
  return value.match(/https?:\/\/\S+/)?.[0] ?? "";
}

function extractLocation(value: string): string {
  const locationMatch = cleanText(value).match(/(?:📍|\[📍)\s*([^\]\[]+)/u);
  return cleanText(locationMatch?.[1] || "");
}

function extractWorkload(value: string): string {
  const text = cleanText(value);
  const percentMatch = text.match(/\b\d{1,3}\s*[-–]\s*\d{1,3}%|\b\d{1,3}%/u);
  if (percentMatch) return percentMatch[0] ?? "";

  const typeMatch = text.match(/\b(?:Full-Time|Part-Time|Internship|Contract)\b/i);
  return cleanText(typeMatch?.[0] || "");
}

function extractTechTags(value: string): string[] {
  return cleanText(value)
    .split(/[,/|()[\]\s]+/)
    .map(cleanText)
    .filter((token) => /^[A-Za-z][A-Za-z0-9.#+-]{1,24}$/.test(token));
}

function dedupeJobs(jobs: RawJob[]): RawJob[] {
  const seen = new Set<string>();
  return jobs.filter((job) => {
    const key = `${cleanText(job.title).toLowerCase()}|${cleanText(job.company).toLowerCase()}|${cleanText(job.url)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
