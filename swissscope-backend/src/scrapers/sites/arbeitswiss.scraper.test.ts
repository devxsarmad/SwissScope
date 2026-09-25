import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sitesConfig } from "../../config/sites.config.js";
import { ArbeitSwissScraper, parseJobRoomSearchItem } from "./arbeitswiss.scraper.js";

describe("parseJobRoomSearchItem", () => {
  it("maps a public Job-Room result to the shared job shape", () => {
    const job = parseJobRoomSearchItem(
      {
        jobAdvertisement: {
          id: "job-id-123",
          jobContent: {
            jobDescriptions: [
              {
                languageIsoCode: "en",
                title: "Full-Stack <em>TypeScript</em> Engineer",
                description: "Build <em>React</em>, Node.js, and PostgreSQL products.",
              },
            ],
            company: { name: "SwissScope Labs" },
            employment: {
              permanent: true,
              workloadPercentageMin: "80",
              workloadPercentageMax: "100",
              workForms: ["HOME_WORK"],
            },
            languageSkills: [],
            location: { city: "Zürich", cantonCode: "ZH", countryIsoCode: "CH" },
          },
          publication: { startDate: "2026-09-25" },
        },
      },
      "https://www.job-room.ch",
    );

    assert.equal(job.title, "Full-Stack TypeScript Engineer");
    assert.equal(job.company, "SwissScope Labs");
    assert.equal(job.location, "Zürich, ZH");
    assert.equal(job.url, "https://www.job-room.ch/job-search/job-id-123");
    assert.equal(job.description, "Build React, Node.js, and PostgreSQL products.");
    assert.equal(job.workload, "80-100% · Permanent · Home work");
    assert.equal(job.postedAt, "2026-09-25");
  });

  it("prefers the English description when multiple languages are present", () => {
    const job = parseJobRoomSearchItem(
      {
        jobAdvertisement: {
          id: "multilingual-job",
          jobContent: {
            jobDescriptions: [
              { languageIsoCode: "de", title: "Entwickler", description: "Deutsche Beschreibung" },
              { languageIsoCode: "en", title: "React Developer", description: "English description" },
            ],
            company: { name: "Example AG" },
          },
        },
      },
      "https://www.job-room.ch",
    );

    assert.equal(job.title, "React Developer");
    assert.equal(job.description, "English description");
  });

  it("drops unrelated roles that only mention a target technology", () => {
    const scraper = new ArbeitSwissScraper(sitesConfig.arbeitswiss);
    const jobs = scraper.normalize([
      {
        title: "M365 Collaboration Engineer",
        company: "Example AG",
        url: "https://www.job-room.ch/job-search/m365",
        description: "Automation scripts use TypeScript.",
      },
    ]);

    assert.equal(jobs.length, 0);
  });

  it("adds structured local-language requirements for the relevance filter", () => {
    const scraper = new ArbeitSwissScraper(sitesConfig.arbeitswiss);
    const rawJob = parseJobRoomSearchItem(
      {
        jobAdvertisement: {
          id: "german-required",
          jobContent: {
            jobDescriptions: [
              {
                languageIsoCode: "en",
                title: "React TypeScript Developer",
                description: "Build web applications with React and Node.js.",
              },
            ],
            company: { name: "Example AG" },
            languageSkills: [{ languageIsoCode: "de" }],
          },
        },
      },
      "https://www.job-room.ch",
    );

    assert.match(rawJob.description ?? "", /German required/);
    assert.equal(scraper.normalize([rawJob]).length, 0);
  });
});
