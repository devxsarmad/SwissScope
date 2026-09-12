import type { JobStatus, Prisma } from "@prisma/client";
import type { JobOutreachUpdate } from "./jobOutreach.service.js";
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

export type ArchiveStaleJobsResult = {
  cutoff: string;
  archived: number;
};

export type JobFilters = {
  city?: string;
  company?: string;
  minScore?: number;
  status?: JobStatus;
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
        postedAt: job.postedAt ? new Date(job.postedAt) : undefined,
        applicantCount: job.applicantCount ?? undefined,
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
        postedAt: job.postedAt ? new Date(job.postedAt) : undefined,
        applicantCount: job.applicantCount ?? undefined,
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
      status: filters.status,
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

export async function updateJobStatus(id: string, status: JobStatus) {
  const job = await prisma.job.update({
    where: { id },
    data: { status },
    include: {
      company: true,
    },
  });

  return toJobResponse(job);
}

export async function updateJobOutreach(id: string, data: JobOutreachUpdate) {
  const job = await prisma.job.update({
    where: { id },
    data,
    include: {
      company: true,
    },
  });

  return toJobResponse(job);
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

export async function archiveStaleJobs(staleAfterDays: number): Promise<ArchiveStaleJobsResult> {
  const cutoff = new Date(Date.now() - staleAfterDays * 24 * 60 * 60 * 1000);
  const result = await prisma.job.updateMany({
    where: {
      scrapedAt: {
        lt: cutoff,
      },
      status: {
        in: ["NEW", "SHORTLISTED", "REJECTED"],
      },
    },
    data: {
      status: "ARCHIVED",
    },
  });

  return {
    cutoff: cutoff.toISOString(),
    archived: result.count,
  };
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

type JobWithCompany = Prisma.JobGetPayload<{ include: { company: true } }>;

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
    status: job.status,
    postedAt: job.postedAt?.toISOString() ?? null,
    postedAgeText: formatPostedAge(job.postedAt),
    applicantCount: job.applicantCount,
    outreachStatus: job.outreachStatus,
    notes: job.notes,
    contactName: job.contactName,
    contactEmail: job.contactEmail,
    contactLinkedIn: job.contactLinkedIn,
    appliedAt: job.appliedAt?.toISOString() ?? null,
    followUpAt: job.followUpAt?.toISOString() ?? null,
    lastContactedAt: job.lastContactedAt?.toISOString() ?? null,
    interviewNotes: job.interviewNotes,
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
    postedAt: job.postedAt,
    applicantCount: job.applicantCount,
    scrapedAt: job.scrapedAt,
  });
}

function formatPostedAge(postedAt: Date | null): string | null {
  if (!postedAt) return null;

  const elapsedMs = Date.now() - postedAt.getTime();
  if (!Number.isFinite(elapsedMs)) return null;
  if (elapsedMs < 0) return "Today";

  const minutes = Math.floor(elapsedMs / 60000);
  if (minutes < 60) return minutes <= 1 ? "Just posted" : `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return days === 1 ? "1 day ago" : `${days} days ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? "1 month ago" : `${months} months ago`;

  const years = Math.floor(days / 365);
  return years <= 1 ? "1 year ago" : `${years} years ago`;
}
