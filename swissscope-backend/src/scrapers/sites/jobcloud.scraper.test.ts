import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseJobPostingsFromHtml } from "./jobcloud.scraper.js";

describe("parseJobPostingsFromHtml", () => {
  it("extracts JobPosting rows from JobCloud search JSON-LD", () => {
    const html = `
      <script type="application/ld+json">
        [{
          "@context": "https://schema.org",
          "@type": "ItemList",
          "itemListElement": [{
            "@type": "ListItem",
            "item": {
              "@context": "https://schema.org",
              "@type": "JobPosting",
              "title": "Full-Stack AI Engineer",
              "description": "React, TypeScript, Node.js and OpenAI APIs",
              "employmentType": "Permanent position",
              "hiringOrganization": { "@type": "Organization", "name": "SwissScope Labs" },
              "jobLocation": { "@type": "Place", "address": { "addressLocality": "Zurich", "addressCountry": "CH" } },
              "url": "https://www.jobs.ch/en/vacancies/detail/example/"
            }
          }]
        }]
      </script>`;

    const [job] = parseJobPostingsFromHtml(html);

    assert.equal(job?.title, "Full-Stack AI Engineer");
    assert.equal(job?.hiringOrganization?.name, "SwissScope Labs");
    assert.equal(job?.url, "https://www.jobs.ch/en/vacancies/detail/example/");
  });

  it("extracts JobPosting rows from detail page JSON-LD", () => {
    const html = `
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "JobPosting",
          "title": "React/Next.js Developer with Node.js",
          "description": "<p>Build REST APIs with NestJS and PostgreSQL.</p>",
          "hiringOrganization": { "name": "Example AG" },
          "url": "/en/vacancies/detail/example/"
        }
      </script>`;

    const jobs = parseJobPostingsFromHtml(html);

    assert.equal(jobs.length, 1);
    assert.equal(jobs[0]?.title, "React/Next.js Developer with Node.js");
  });
});
