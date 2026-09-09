import type { JobStatus } from "@prisma/client";

export const JOB_STATUSES = ["NEW", "SHORTLISTED", "APPLIED", "INTERVIEW", "OFFER", "REJECTED", "ARCHIVED"] as const satisfies readonly JobStatus[];

export const JOB_STATUS_LABELS = {
  NEW: "New",
  SHORTLISTED: "Shortlisted",
  APPLIED: "Applied",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  ARCHIVED: "Archived",
} satisfies Record<JobStatus, string>;

export function parseJobStatus(value: unknown): JobStatus | Error {
  if (typeof value !== "string" || value.trim() === "") {
    return new Error("status is required.");
  }

  const normalized = value.trim().toUpperCase();
  if (isJobStatus(normalized)) return normalized;

  return new Error(`status must be one of: ${JOB_STATUSES.join(", ")}.`);
}

export function isJobStatus(value: string): value is JobStatus {
  return JOB_STATUSES.includes(value as JobStatus);
}
