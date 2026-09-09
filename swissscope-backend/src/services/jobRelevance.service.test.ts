import test from "node:test";
import assert from "node:assert/strict";
import { explainJobRelevance } from "./jobRelevance.service.js";
import type { NormalizedJob } from "../utils/normalizeData.js";

test("keeps a full-stack AI TypeScript role", () => {
  const result = explainJobRelevance(
    job({
      title: "Full-Stack AI Engineer",
      description:
        "Build RAG workflows with React, TypeScript, Node.js, PostgreSQL, OpenAI APIs, vector databases, and tool calling.",
      techStack: ["React", "TypeScript", "NodeJS", "PostgreSQL", "AI"],
    }),
  );

  assert.equal(result.isRelevant, true);
  assert.deepEqual(result.excludeReasons, []);
});

test("keeps a React and Node role", () => {
  const result = explainJobRelevance(
    job({
      title: "React/Next.js Developer with Node.js",
      description: "Work on REST APIs, GraphQL, Next.js, Express.js, and Tailwind CSS.",
      techStack: ["React", "Next.js", "NodeJS", "GraphQL"],
    }),
  );

  assert.equal(result.isRelevant, true);
});

test("rejects C++ roles", () => {
  const result = explainJobRelevance(
    job({
      title: "Senior Software Engineer C++",
      description: "Trading systems role for C++ engineers.",
    }),
  );

  assert.equal(result.isRelevant, false);
});

test("rejects generic full-stack roles without a target stack signal", () => {
  const result = explainJobRelevance(
    job({
      title: "Senior Fullstack Developer",
      description: "Build business applications for industrial systems.",
      techStack: [],
    }),
  );

  assert.equal(result.isRelevant, false);
});

test("rejects Python and ML research roles", () => {
  const result = explainJobRelevance(
    job({
      title: "ML Researcher Model Adaptation",
      description: "Python-first research role for inference optimization.",
    }),
  );

  assert.equal(result.isRelevant, false);
  assert.ok(result.excludeReasons.includes("Python/FastAPI-first"));
  assert.ok(result.excludeReasons.includes("ML Research"));
});

test("rejects German mandatory roles", () => {
  const result = explainJobRelevance(
    job({
      title: "Full-Stack TypeScript Developer",
      description: "React and Node.js role. German is mandatory.",
    }),
  );

  assert.equal(result.isRelevant, false);
  assert.ok(result.excludeReasons.includes("mandatory local language"));
});

test("allows permit wording when visa sponsorship is offered", () => {
  const result = explainJobRelevance(
    job({
      title: "AI Application Engineer using JavaScript/TypeScript",
      description: "Existing Swiss work permit preferred, visa sponsorship offered for strong candidates.",
    }),
  );

  assert.equal(result.isRelevant, true);
});

function job(overrides: Partial<NormalizedJob>): NormalizedJob {
  return {
    source: "test",
    title: "Full-Stack TypeScript Developer",
    company: "Example AG",
    location: "Zurich",
    url: "https://example.com/job",
    description: "React TypeScript Node.js",
    techStack: [],
    workload: "Full-Time",
    scrapedAt: new Date("2026-09-09T00:00:00.000Z").toISOString(),
    ...overrides,
  };
}
