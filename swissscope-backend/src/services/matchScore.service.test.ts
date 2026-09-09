import test from "node:test";
import assert from "node:assert/strict";
import { calculateMatchScore } from "./matchScore.service.js";

test("scores a strong full-stack healthcare match", () => {
  const result = calculateMatchScore(`
    We need a React and TypeScript engineer with Next.js, Node.js, NestJS, Prisma,
    PostgreSQL, OpenAI integration, and healthcare LIS experience.
  `);

  assert.equal(result.score, 100);
  assert.deepEqual(
    result.matched.map((match) => match.label),
    ["React", "TypeScript", "Node.js", "NestJS", "Next.js", "Prisma", "PostgreSQL", "AI/LLM", "Healthcare/LIS"],
  );
  assert.deepEqual(result.missing, []);
});

test("scores partial matches by configured weight", () => {
  const result = calculateMatchScore("Frontend role using React, TypeScript, and GraphQL.");

  assert.equal(result.score, 27);
  assert.deepEqual(
    result.matched.map((match) => match.label),
    ["React", "TypeScript"],
  );
});

test("avoids matching short aliases inside unrelated words", () => {
  const result = calculateMatchScore("This role focuses on documentation, bots, and statistics.");

  assert.equal(result.score, 0);
  assert.deepEqual(result.matched, []);
});

test("accepts a custom keyword profile", () => {
  const result = calculateMatchScore("Python ETL role with data pipelines.", [
    { label: "Python", keywords: ["python"], weight: 2 },
    { label: "ETL", keywords: ["etl"], weight: 1 },
    { label: "React", keywords: ["react"], weight: 1 },
  ]);

  assert.equal(result.score, 75);
  assert.deepEqual(result.missing, ["React"]);
});
