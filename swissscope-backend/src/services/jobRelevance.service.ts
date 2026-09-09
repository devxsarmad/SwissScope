import type { NormalizedJob } from "../utils/normalizeData.js";
import { cleanText } from "../utils/normalizeData.js";

export type JobRelevanceResult = {
  isRelevant: boolean;
  includeReasons: string[];
  excludeReasons: string[];
};

const TARGET_ROLE_PATTERNS = [
  /\bfull[-\s]?stack\b/i,
  /\bmern\b/i,
  /\bpern\b/i,
  /\breact\b/i,
  /\bnext\.?js\b/i,
  /\bnode\.?js\b/i,
  /\bnest\.?js\b/i,
  /\bjavascript\b/i,
  /\btypescript\b/i,
  /\bai application\b/i,
  /\bai engineer\b/i,
  /\bllm\b/i,
  /\brag\b/i,
  /\bopenai\b/i,
  /\bagentic\b/i,
];

const TARGET_STACK_PATTERNS = [
  /\bai\b/i,
  /\breact(?:\.js|js)?\b/i,
  /\bnext(?:\.js|js)?\b/i,
  /\btypescript\b/i,
  /\bjavascript\b/i,
  /\btailwind\b/i,
  /\bnode(?:\.js|js)?\b/i,
  /\bexpress(?:\.js|js)?\b/i,
  /\bnest(?:\.js|js)?\b/i,
  /\bpostgres(?:ql)?\b/i,
  /\bmongodb\b/i,
  /\bpgvector\b/i,
  /\bopenai\b/i,
  /\bllm\b/i,
  /\brag\b/i,
  /\bembedding(?:s)?\b/i,
  /\bvector database(?:s)?\b/i,
  /\btool calling\b/i,
  /\bai agent(?:s)?\b/i,
  /\bagentic workflow(?:s)?\b/i,
  /\brest api(?:s)?\b/i,
  /\bgraphql\b/i,
  /\bwebsocket(?:s)?\b/i,
];

const EXCLUDED_STACK_PATTERNS = [
  { label: "Python/FastAPI-first", pattern: /\b(?:python|fastapi)\b/i },
  { label: "Java-first", pattern: /\bjava\b/i },
  { label: "C/C++-first", pattern: /\b(?:c\+\+|c\/c\+\+|embedded c|c engineer)\b/i },
  { label: ".NET-first", pattern: /\b(?:\.net|c#|csharp|asp\.net)\b/i },
  { label: "PHP-first", pattern: /\b(?:php|symfony|drupal|laravel)\b/i },
  { label: "Ruby-first", pattern: /\b(?:ruby|rails)\b/i },
  { label: "Go-first", pattern: /\b(?:golang|go developer|go engineer)\b/i },
];

const EXCLUDED_ROLE_PATTERNS = [
  { label: "Data Scientist", pattern: /\bdata scientist\b/i },
  { label: "ML Research", pattern: /\b(?:ml researcher|machine learning researcher|research scientist)\b/i },
  { label: "DevOps-only", pattern: /\b(?:devops|platform engineer|systems administrator|infrastructure engineer|cloud engineer)\b/i },
  { label: "Mobile-only", pattern: /\b(?:android|ios|flutter|mobile engineer|react native developer)\b/i },
  { label: "QA", pattern: /\b(?:qa engineer|quality assurance|test automation)\b/i },
];

const MANDATORY_LANGUAGE_PATTERNS = [
  /\b(?:german|deutsch|french|français|italian|italiano)\s+(?:is\s+)?(?:required|mandatory|must|native|fluent)\b/i,
  /\b(?:required|mandatory|must|native|fluent)\s+(?:german|deutsch|french|français|italian|italiano)\b/i,
  /\b(?:📣|\[📣\])\s*(?:german|deutsch|french|français|italian|italiano)\b/i,
];

const PERMIT_PATTERNS = [
  /\b(?:swiss|eu|efta)\s+(?:citizen|citizenship|passport)\b/i,
  /\b(?:valid|existing)\s+(?:swiss\s+)?work permit\b/i,
  /\b(?:c permit|b permit|permit b|permit c)\b/i,
];

const VISA_SPONSORSHIP_PATTERN = /\b(?:visa sponsorship|sponsorship offered|work permit sponsorship|relocation support)\b/i;

export function isRelevantSwissTechJob(job: NormalizedJob): boolean {
  return explainJobRelevance(job).isRelevant;
}

export function explainJobRelevance(job: NormalizedJob): JobRelevanceResult {
  const text = searchableJobText(job);
  const includeReasons = collectIncludeReasons(text);
  const excludeReasons = collectExcludeReasons(text);

  return {
    isRelevant: includeReasons.includes("target stack") && excludeReasons.length === 0,
    includeReasons,
    excludeReasons,
  };
}

function searchableJobText(job: NormalizedJob): string {
  return cleanText([job.title, job.company, job.location, job.workload, job.description, job.techStack.join(" ")].join(" "));
}

function collectIncludeReasons(text: string): string[] {
  const hasTargetRole = TARGET_ROLE_PATTERNS.some((pattern) => pattern.test(text));
  const hasTargetStack = TARGET_STACK_PATTERNS.some((pattern) => pattern.test(text));

  const reasons: string[] = [];
  if (hasTargetStack) reasons.push("target stack");
  if (hasTargetRole) reasons.push("target role");

  return reasons;
}

function collectExcludeReasons(text: string): string[] {
  const reasons: string[] = [];

  for (const exclusion of [...EXCLUDED_STACK_PATTERNS, ...EXCLUDED_ROLE_PATTERNS]) {
    if (exclusion.pattern.test(text)) {
      reasons.push(exclusion.label);
    }
  }

  if (MANDATORY_LANGUAGE_PATTERNS.some((pattern) => pattern.test(text))) {
    reasons.push("mandatory local language");
  }

  if (PERMIT_PATTERNS.some((pattern) => pattern.test(text)) && !VISA_SPONSORSHIP_PATTERN.test(text)) {
    reasons.push("permit or citizenship requirement");
  }

  return reasons;
}
