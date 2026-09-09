import { prisma } from "../prisma/client.js";
import type { NormalizedJob } from "../utils/normalizeData.js";
import { findOrCreateCompany } from "./company.service.js";

export type SaveJobsResult = {
  total: number;
  created: number;
  updated: number;
};

export async function saveJobs(jobs: NormalizedJob[]): Promise<SaveJobsResult> {
  const result: SaveJobsResult = {
    total: jobs.length,
    created: 0,
    updated: 0,
  };

  for (const job of jobs) {
    const company = await findOrCreateCompany(job.company);
    const existingJob = await prisma.job.findUnique({
      where: { url: job.url },
      select: { id: true },
    });

    await prisma.job.upsert({
      where: { url: job.url },
      update: {
        companyId: company.id,
        title: job.title,
        description: job.description,
        techStack: job.techStack,
        location: job.location,
        workload: job.workload,
        scrapedAt: new Date(job.scrapedAt),
      },
      create: {
        companyId: company.id,
        title: job.title,
        description: job.description,
        techStack: job.techStack,
        location: job.location,
        url: job.url,
        workload: job.workload,
        scrapedAt: new Date(job.scrapedAt),
      },
    });

    if (existingJob) {
      result.updated += 1;
    } else {
      result.created += 1;
    }
  }

  return result;
}
