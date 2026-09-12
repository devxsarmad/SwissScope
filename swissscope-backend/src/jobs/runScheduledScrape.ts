import type { ScrapeRunStatus } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { archiveStaleJobs, saveJobs } from "../services/job.service.js";
import { failScrapeRun, finishScrapeRun, startScrapeRun, type ScrapeSourceResult } from "../services/scrapeRun.service.js";
import { scrapers } from "../scrapers/index.js";

export type ScheduledScrapeOutcome = {
  id: string;
  status: ScrapeRunStatus;
  totalFetched: number;
  totalCreated: number;
  totalUpdated: number;
  archivedJobs: number;
};

export type RunScheduledScrapeOptions = {
  disconnect?: boolean;
};

export async function runScheduledScrape(options: RunScheduledScrapeOptions = {}): Promise<ScheduledScrapeOutcome> {
  const staleAfterDays = parsePositiveInteger(process.env.STALE_JOB_DAYS) ?? 30;
  const run = await startScrapeRun();
  const sourceResults: ScrapeSourceResult[] = [];

  console.log(`Started scheduled scrape run ${run.id}`);
  console.log(`Stale inactive jobs will be archived after ${staleAfterDays} days without being seen.`);

  try {
    for (const [name, scraper] of Object.entries(scrapers)) {
      try {
        const jobs = await scraper.scrape();
        const saved = jobs.length > 0 ? await saveJobs(jobs) : { total: 0, created: 0, updated: 0 };

        sourceResults.push({
          source: name,
          status: "success",
          fetched: jobs.length,
          created: saved.created,
          updated: saved.updated,
          error: null,
        });

        console.log(`${name}: fetched ${jobs.length}, created ${saved.created}, updated ${saved.updated}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        sourceResults.push({
          source: name,
          status: "failed",
          fetched: 0,
          created: 0,
          updated: 0,
          error: message,
        });
        console.error(`${name}: failed - ${message}`);
      }
    }

    const archiveResult = await archiveStaleJobs(staleAfterDays);
    const finishedRun = await finishScrapeRun(run.id, {
      sourceResults,
      archivedJobs: archiveResult.archived,
    });

    console.log(`Archived ${archiveResult.archived} stale inactive jobs older than ${archiveResult.cutoff}`);
    console.log(
      `Finished scheduled scrape run ${finishedRun.id}: ${finishedRun.status}, fetched ${finishedRun.totalFetched}, created ${finishedRun.totalCreated}, updated ${finishedRun.totalUpdated}`,
    );

    return {
      id: finishedRun.id,
      status: finishedRun.status,
      totalFetched: finishedRun.totalFetched,
      totalCreated: finishedRun.totalCreated,
      totalUpdated: finishedRun.totalUpdated,
      archivedJobs: finishedRun.archivedJobs,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failedRun = await failScrapeRun(run.id, message);
    console.error(`Scheduled scrape run failed: ${message}`);

    return {
      id: failedRun.id,
      status: failedRun.status,
      totalFetched: failedRun.totalFetched,
      totalCreated: failedRun.totalCreated,
      totalUpdated: failedRun.totalUpdated,
      archivedJobs: failedRun.archivedJobs,
    };
  } finally {
    if (options.disconnect) {
      await prisma.$disconnect();
    }
  }
}

function parsePositiveInteger(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
