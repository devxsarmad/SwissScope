import axios from "axios";
import { BaseScraper } from "../base/BaseScraper.js";
import { isRelevantSwissTechJob } from "../../services/jobRelevance.service.js";
import { cleanText, normalizeJob, type NormalizedJob, type RawJob } from "../../utils/normalizeData.js";

const DEFAULT_SEARCH_TERMS = ["React TypeScript", "Next.js Node.js", "Full Stack JavaScript", "NestJS", "OpenAI LLM"];

const TARGET_TITLE_PATTERNS = [
  /\bfull[-\s]?stack\b/i,
  /\bfront[-\s]?end\b/i,
  /\bmern\b/i,
  /\bpern\b/i,
  /\breact\b/i,
  /\bnext\.?js\b/i,
  /\bnode\.?js\b/i,
  /\b(?:javascript|typescript)\b/i,
  /\b(?:ai application|ai engineer|llm engineer|agentic)\b/i,
];

type JobRoomDescription = {
  languageIsoCode?: string;
  title?: string;
  description?: string;
};

type JobRoomEmployment = {
  permanent?: boolean;
  workloadPercentageMin?: string | number;
  workloadPercentageMax?: string | number;
  workForms?: string[];
};

type JobRoomAdvertisement = {
  id?: string;
  jobContent?: {
    jobDescriptions?: JobRoomDescription[];
    company?: { name?: string };
    employment?: JobRoomEmployment;
    languageSkills?: Array<{ languageIsoCode?: string }>;
    location?: {
      city?: string;
      cantonCode?: string;
      countryIsoCode?: string;
    };
  };
  publication?: {
    startDate?: string;
  };
};

export type JobRoomSearchItem = {
  jobAdvertisement?: JobRoomAdvertisement;
};

type ArbeitSwissPayload = {
  rows: JobRoomSearchItem[];
};

export class ArbeitSwissScraper extends BaseScraper<ArbeitSwissPayload, RawJob, NormalizedJob> {
  async fetch(): Promise<ArbeitSwissPayload> {
    const rows = new Map<string, JobRoomSearchItem>();
    const errors: string[] = [];

    for (const term of this.config.searchTerms ?? DEFAULT_SEARCH_TERMS) {
      let searchRows: JobRoomSearchItem[];

      try {
        searchRows = await this.fetchSearchRows(term);
      } catch (error) {
        errors.push(`${term}: ${error instanceof Error ? error.message : String(error)}`);
        continue;
      }

      for (const row of searchRows) {
        const id = row.jobAdvertisement?.id;
        if (id && !rows.has(id)) rows.set(id, row);
      }
    }

    if (rows.size === 0 && errors.length > 0) {
      throw new Error(`Every Job-Room search failed: ${errors.join("; ")}`);
    }

    return { rows: [...rows.values()] };
  }

  parse(payload: ArbeitSwissPayload): RawJob[] {
    return payload.rows.map((row) => parseJobRoomSearchItem(row, this.config.baseUrl)).filter(hasRequiredFields);
  }

  override normalize(rawJobs: RawJob[]): NormalizedJob[] {
    return rawJobs
      .map((job) => normalizeJob(job, { source: this.source, baseUrl: this.config.baseUrl }))
      .filter((job) => job.title && job.company && job.url)
      .filter((job) => TARGET_TITLE_PATTERNS.some((pattern) => pattern.test(job.title)))
      .filter(isRelevantSwissTechJob)
      .slice(0, this.config.maxJobs);
  }

  private async fetchSearchRows(term: string): Promise<JobRoomSearchItem[]> {
    const apiPath = this.config.apiPath;
    if (!apiPath) throw new Error("arbeit.swiss scraper requires config field apiPath.");

    const url = new URL(apiPath, this.config.baseUrl);
    url.searchParams.set("page", "0");
    url.searchParams.set("size", String(this.config.maxJobs));

    const response = await axios.post<unknown>(
      url.toString(),
      { keywords: [term] },
      {
        timeout: this.config.requestTimeoutMs,
        headers: {
          "User-Agent": this.config.userAgent,
          Accept: "application/json",
          "Content-Type": "application/json",
          Referer: `${this.config.baseUrl}/`,
        },
        validateStatus: (status) => status >= 200 && status < 300,
      },
    );

    if (!Array.isArray(response.data)) {
      throw new Error("Job-Room search returned an unexpected response.");
    }

    return response.data as JobRoomSearchItem[];
  }
}

export function parseJobRoomSearchItem(item: JobRoomSearchItem, baseUrl: string): RawJob {
  const advertisement = item.jobAdvertisement;
  const content = advertisement?.jobContent;
  const descriptions = content?.jobDescriptions ?? [];
  const englishDescription = descriptions.find((description) => description.languageIsoCode?.toLowerCase() === "en");
  const selectedDescription = englishDescription ?? descriptions[0];
  const location = [content?.location?.city, content?.location?.cantonCode].map(cleanText).filter(Boolean).join(", ");
  const id = cleanText(advertisement?.id);
  const languageRequirements = formatLanguageRequirements(content?.languageSkills);

  return {
    title: stripHighlights(selectedDescription?.title),
    company: content?.company?.name,
    location,
    url: id ? new URL(`/job-search/${id}`, baseUrl).toString() : "",
    description: [stripHighlights(selectedDescription?.description), languageRequirements].filter(Boolean).join(" "),
    techStack: [],
    workload: formatWorkload(content?.employment),
    postedAt: advertisement?.publication?.startDate,
  };
}

function stripHighlights(value: string | undefined): string {
  return cleanText(value?.replace(/<\/?em>/gi, ""));
}

function formatWorkload(employment: JobRoomEmployment | undefined): string {
  if (!employment) return "";

  const minimum = cleanText(employment.workloadPercentageMin);
  const maximum = cleanText(employment.workloadPercentageMax);
  const percentage = minimum && maximum ? (minimum === maximum ? `${minimum}%` : `${minimum}-${maximum}%`) : minimum || maximum;
  const contract = employment.permanent === true ? "Permanent" : employment.permanent === false ? "Temporary" : "";
  const workForms = (employment.workForms ?? []).map(humanizeCode).filter(Boolean).join(", ");

  return [percentage, contract, workForms].filter(Boolean).join(" · ");
}

function formatLanguageRequirements(languageSkills: Array<{ languageIsoCode?: string }> | undefined): string {
  const languageNames: Record<string, string> = {
    de: "German",
    fr: "French",
    it: "Italian",
  };

  return (languageSkills ?? [])
    .map((skill) => languageNames[cleanText(skill.languageIsoCode).toLowerCase()])
    .filter((language): language is string => Boolean(language))
    .map((language) => `${language} required.`)
    .join(" ");
}

function humanizeCode(value: string): string {
  return cleanText(value)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (character) => character.toUpperCase());
}

function hasRequiredFields(job: RawJob): boolean {
  return Boolean(cleanText(job.title) && cleanText(job.company) && cleanText(job.url));
}
