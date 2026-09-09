export type RawJob = {
  title?: string | null;
  company?: string | null;
  location?: string | null;
  url?: string | null;
  description?: string | null;
  techStack?: string[];
  workload?: string | null;
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
  "Python",
  "Java",
  "Angular",
  "Vue",
  "Docker",
  "AWS",
  "Azure",
  "GraphQL",
  "Backend",
  "Frontend",
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

  return {
    source: options.source,
    title,
    company,
    location: cleanText(rawJob.location) || null,
    url: toAbsoluteUrl(rawJob.url, options.baseUrl),
    description,
    techStack: normalizeTechStack(rawTechStack, `${title} ${description}`),
    workload: cleanText(rawJob.workload) || null,
    scrapedAt: new Date().toISOString(),
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
