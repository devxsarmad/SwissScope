import { prisma } from "../prisma/client.js";
import type { NormalizedJob } from "../utils/normalizeData.js";
import { findOrCreateCompany } from "./company.service.js";
import { calculateMatchScore } from "./matchScore.service.js";
import { isRelevantSwissTechJob } from "./jobRelevance.service.js";

export type SaveJobsResult = {
  total: number;
  created: number;
  updated: number;
};

export type PruneJobsResult = {
  scanned: number;
  deleted: number;
};

export type JobFilters = {
  city?: string;
  company?: string;
  minScore?: number;
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

export async function listJobs(filters: JobFilters = {}) {
  const jobs = await prisma.job.findMany({
    where: {
      location: filters.city ? { contains: filters.city, mode: "insensitive" } : undefined,
      company: filters.company
        ? {
            name: {
              contains: filters.company,
              mode: "insensitive",
            },
          }
        : undefined,
    },
    include: {
      company: true,
    },
    orderBy: {
      scrapedAt: "desc",
    },
  });

  return jobs
    .map(toJobResponse)
    .filter(isRelevantSavedJob)
    .filter((job) => filters.minScore === undefined || job.matchScore.score >= filters.minScore)
    .sort((a, b) => b.matchScore.score - a.matchScore.score || b.scrapedAt.localeCompare(a.scrapedAt));
}

export async function getJobById(id: string) {
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      company: true,
    },
  });

  return job ? toJobResponse(job) : null;
}

export async function pruneIrrelevantJobs(): Promise<PruneJobsResult> {
  const jobs = await prisma.job.findMany({
    include: {
      company: true,
    },
  });
  const irrelevantJobs = jobs.map(toJobResponse).filter((job) => !isRelevantSavedJob(job));

  if (irrelevantJobs.length > 0) {
    await prisma.job.deleteMany({
      where: {
        id: {
          in: irrelevantJobs.map((job) => job.id),
        },
      },
    });
  }

  await prisma.company.deleteMany({
    where: {
      jobs: {
        none: {},
      },
    },
  });

  return {
    scanned: jobs.length,
    deleted: irrelevantJobs.length,
  };
}

type JobWithCompany = Awaited<ReturnType<typeof prisma.job.findMany<{ include: { company: true } }>>>[number];

function toJobResponse(job: JobWithCompany) {
  const matchScore = calculateMatchScore([job.title, job.description, job.techStack.join(" ")]);

  return {
    id: job.id,
    title: job.title,
    description: job.description,
    techStack: job.techStack,
    location: job.location,
    url: job.url,
    workload: job.workload,
    scrapedAt: job.scrapedAt.toISOString(),
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    company: {
      id: job.company.id,
      name: job.company.name,
    },
    matchScore,
  };
}

type JobResponse = ReturnType<typeof toJobResponse>;

function isRelevantSavedJob(job: JobResponse): boolean {
  return isRelevantSwissTechJob({
    source: "database",
    title: job.title,
    company: job.company.name,
    location: job.location,
    url: job.url,
    description: job.description,
    techStack: job.techStack,
    workload: job.workload,
    scrapedAt: job.scrapedAt,
  });
}
