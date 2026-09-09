import { cleanText } from "../utils/normalizeData.js";

export type SkillKeyword = {
  label: string;
  keywords: string[];
  weight: number;
};

export type SkillMatch = {
  label: string;
  matchedKeywords: string[];
  weight: number;
};

export type MatchScoreResult = {
  score: number;
  matched: SkillMatch[];
  missing: string[];
};

export const DEFAULT_SKILL_KEYWORDS: SkillKeyword[] = [
  { label: "React", keywords: ["react", "reactjs", "react.js", "react native"], weight: 10 },
  { label: "TypeScript", keywords: ["typescript", "ts"], weight: 10 },
  { label: "Node.js", keywords: ["node", "node.js", "nodejs"], weight: 9 },
  { label: "NestJS", keywords: ["nestjs", "nest.js"], weight: 8 },
  { label: "Next.js", keywords: ["next.js", "nextjs"], weight: 8 },
  { label: "Prisma", keywords: ["prisma"], weight: 7 },
  { label: "PostgreSQL", keywords: ["postgresql", "postgres", "sql"], weight: 8 },
  { label: "AI/LLM", keywords: ["ai", "llm", "openai", "large language model", "machine learning"], weight: 8 },
  { label: "Healthcare/LIS", keywords: ["healthcare", "health", "lis", "laboratory information system", "medical"], weight: 7 },
];

export function calculateMatchScore(
  content: string | string[],
  skillKeywords: SkillKeyword[] = DEFAULT_SKILL_KEYWORDS,
): MatchScoreResult {
  const searchableText = normalizeSearchText(Array.isArray(content) ? content.join(" ") : content);
  const totalWeight = skillKeywords.reduce((sum, skill) => sum + skill.weight, 0);
  const matched: SkillMatch[] = [];
  const missing: string[] = [];

  for (const skill of skillKeywords) {
    const matchedKeywords = skill.keywords.filter((keyword) => keywordMatches(searchableText, keyword));

    if (matchedKeywords.length > 0) {
      matched.push({
        label: skill.label,
        matchedKeywords,
        weight: skill.weight,
      });
    } else {
      missing.push(skill.label);
    }
  }

  const matchedWeight = matched.reduce((sum, skill) => sum + skill.weight, 0);

  return {
    score: totalWeight === 0 ? 0 : Math.round((matchedWeight / totalWeight) * 100),
    matched,
    missing,
  };
}

function normalizeSearchText(value: string): string {
  return ` ${cleanText(value).toLowerCase().replace(/[^\p{L}\p{N}.+#]+/gu, " ")} `;
}

function keywordMatches(searchableText: string, keyword: string): boolean {
  const normalizedKeyword = cleanText(keyword).toLowerCase().replace(/[^\p{L}\p{N}.+#]+/gu, " ");
  const escapedKeyword = escapeRegExp(normalizedKeyword).replace(/\s+/g, "\\s+");
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapedKeyword}(?![\\p{L}\\p{N}])`, "u").test(searchableText);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
