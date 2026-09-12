import type { Prisma, ScrapeRunStatus } from "@prisma/client";
import { prisma } from "../prisma/client.js";

export type ScrapeSourceResult = {
  source: string;
  status: "success" | "failed";
  fetched: number;
  created: number;
  updated: number;
  error: string | null;
};

export type FinishScrapeRunInput = {
  sourceResults: ScrapeSourceResult[];
  archivedJobs: number;
  error?: string | null;
};

export async function startScrapeRun() {
  return prisma.scrapeRun.create({
    data: {
      status: "RUNNING",
    },
  });
}

export async function finishScrapeRun(id: string, input: FinishScrapeRunInput) {
  const hasFailures = input.sourceResults.some((result) => result.status === "failed");
  const hasSuccesses = input.sourceResults.some((result) => result.status === "success");
  const status: ScrapeRunStatus = hasFailures ? (hasSuccesses ? "PARTIAL_FAILURE" : "FAILED") : "SUCCESS";

  return prisma.scrapeRun.update({
    where: { id },
    data: {
      status,
      finishedAt: new Date(),
      sourceResults: input.sourceResults as unknown as Prisma.InputJsonValue,
      totalFetched: sum(input.sourceResults, "fetched"),
      totalCreated: sum(input.sourceResults, "created"),
      totalUpdated: sum(input.sourceResults, "updated"),
      archivedJobs: input.archivedJobs,
      error: input.error ?? summarizeErrors(input.sourceResults),
    },
  });
}

export async function failScrapeRun(id: string, error: string) {
  return prisma.scrapeRun.update({
    where: { id },
    data: {
      status: "FAILED",
      finishedAt: new Date(),
      error,
    },
  });
}

export async function getLatestScrapeRun() {
  const run = await prisma.scrapeRun.findFirst({
    orderBy: {
      startedAt: "desc",
    },
  });

  return run ? toScrapeRunResponse(run) : null;
}

type ScrapeRunModel = Awaited<ReturnType<typeof prisma.scrapeRun.findFirst>> & {};

function toScrapeRunResponse(run: NonNullable<ScrapeRunModel>) {
  return {
    id: run.id,
    status: run.status,
    startedAt: run.startedAt.toISOString(),
    finishedAt: run.finishedAt?.toISOString() ?? null,
    sourceResults: run.sourceResults,
    totalFetched: run.totalFetched,
    totalCreated: run.totalCreated,
    totalUpdated: run.totalUpdated,
    archivedJobs: run.archivedJobs,
    error: run.error,
  };
}

function sum(results: ScrapeSourceResult[], key: "fetched" | "created" | "updated"): number {
  return results.reduce((total, result) => total + result[key], 0);
}

function summarizeErrors(results: ScrapeSourceResult[]): string | null {
  const errors = results.filter((result) => result.error).map((result) => `${result.source}: ${result.error}`);
  return errors.length > 0 ? errors.join("\n") : null;
}
