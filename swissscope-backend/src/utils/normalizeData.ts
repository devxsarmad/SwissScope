export type RawJob = {
  title?: string | null;
  company?: string | null;
  location?: string | null;
  url?: string | null;
  description?: string | null;
  techStack?: string[];
  workload?: string | null;
  postedAt?: string | null;
  applicantCount?: number | null;
};

export type NormalizedJob = {
  source: string;
  title: string;
  company: string;
  location: string | null;
  url: string;
  description: string;
  techStack: string[];
  workload: string | null;
  postedAt: string | null;
  applicantCount: number | null;
  scrapedAt: string;
};

const TECH_KEYWORDS = [
  "React",
  "React Native",
  "TypeScript",
  "JavaScript",
  "NodeJS",
  "Node.js",
  "NestJS",
  "Next.js",
  "Prisma",
  "PostgreSQL",
  "SQL",
  "AI",
  "LLM",
  "OpenAI",
  "RAG",
  "Embeddings",
  "Vector Databases",
  "Tailwind CSS",
  "MongoDB",
  "pgvector",
  "GraphQL",
  "REST APIs",
  "WebSockets",
  "AI Agents",
  "Agentic Workflows",
];

export function cleanText(value: unknown): string {
  return String(value ?? "")
    .replace(/[\s\u2063]+/g, " ")
    .trim();
}

export function toAbsoluteUrl(url: string | null | undefined, baseUrl: string): string {
  if (!url) return "";
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return cleanText(url);
  }
}

export function normalizeTechStack(values: string[] = [], description = ""): string[] {
  const combined = [...values, description].filter(Boolean).join(" ");
  const seen = new Set<string>();

  for (const keyword of TECH_KEYWORDS) {
    const pattern = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, "i");
    if (pattern.test(combined)) {
      seen.add(keyword === "Node.js" ? "NodeJS" : keyword);
    }
  }

  return [...seen].sort((a, b) => a.localeCompare(b));
}

export function normalizeJob(rawJob: RawJob, options: { source: string; baseUrl: string }): NormalizedJob {
  const title = cleanText(rawJob.title);
  const company = cleanText(rawJob.company);
  const description = cleanText(rawJob.description);
  const rawTechStack = Array.isArray(rawJob.techStack) ? rawJob.techStack : [];
  const postedAt = normalizeDate(rawJob.postedAt);
  const applicantCount = normalizeApplicantCount(rawJob.applicantCount);

  return {
    source: options.source,
    title,
    company,
    location: cleanText(rawJob.location) || null,
    url: toAbsoluteUrl(rawJob.url, options.baseUrl),
    description,
    techStack: normalizeTechStack(rawTechStack, `${title} ${description}`),
    workload: cleanText(rawJob.workload) || null,
    postedAt,
    applicantCount,
    scrapedAt: new Date().toISOString(),
  };
}

function normalizeDate(value: string | null | undefined): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

function normalizeApplicantCount(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isInteger(value) || value < 0) return null;
  return value;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
