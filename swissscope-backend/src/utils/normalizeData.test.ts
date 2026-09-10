import assert from "node:assert/strict";
import { it } from "node:test";
import { normalizeJob } from "./normalizeData.js";

it("normalizes posted dates and applicant counts", () => {
  const job = normalizeJob(
    {
      title: "Full-Stack AI Engineer",
      company: "Example AG",
      description: "React TypeScript Node.js OpenAI",
      url: "/jobs/1",
      postedAt: "2026-09-10T08:00:00+02:00",
      applicantCount: 12,
    },
    { source: "test", baseUrl: "https://example.com" },
  );

  assert.equal(job.postedAt, "2026-09-10T06:00:00.000Z");
  assert.equal(job.applicantCount, 12);
});

it("drops invalid posted dates and applicant counts", () => {
  const job = normalizeJob(
    {
      title: "Full-Stack AI Engineer",
      company: "Example AG",
      description: "React TypeScript Node.js OpenAI",
      url: "/jobs/1",
      postedAt: "not a date",
      applicantCount: -3,
    },
    { source: "test", baseUrl: "https://example.com" },
  );

  assert.equal(job.postedAt, null);
  assert.equal(job.applicantCount, null);
});
