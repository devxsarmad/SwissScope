import type { OutreachStatus } from "@prisma/client";

export type JobOutreachUpdate = {
  outreachStatus?: OutreachStatus;
  notes?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactLinkedIn?: string | null;
  appliedAt?: Date | null;
  followUpAt?: Date | null;
  lastContactedAt?: Date | null;
  interviewNotes?: string | null;
};

export const OUTREACH_STATUSES = ["NOT_STARTED", "CONTACTED", "FOLLOWED_UP", "RESPONDED", "INTERVIEWING", "CLOSED"] as const satisfies readonly OutreachStatus[];

export function parseJobOutreachUpdate(value: unknown): JobOutreachUpdate | Error {
  if (!isRecord(value)) return new Error("Request body must be a JSON object.");

  const update: JobOutreachUpdate = {};

  if ("outreachStatus" in value) {
    const status = parseOutreachStatus(value.outreachStatus);
    if (status instanceof Error) return status;
    update.outreachStatus = status;
  }

  for (const field of ["notes", "contactName", "contactEmail", "contactLinkedIn", "interviewNotes"] as const) {
    if (field in value) {
      const parsed = parseNullableString(value[field], field);
      if (parsed instanceof Error) return parsed;
      update[field] = parsed;
    }
  }

  for (const field of ["appliedAt", "followUpAt", "lastContactedAt"] as const) {
    if (field in value) {
      const parsed = parseNullableDate(value[field], field);
      if (parsed instanceof Error) return parsed;
      update[field] = parsed;
    }
  }

  if (Object.keys(update).length === 0) return new Error("At least one outreach field is required.");

  return update;
}

export function parseOutreachStatus(value: unknown): OutreachStatus | Error {
  if (typeof value !== "string" || value.trim() === "") return new Error("outreachStatus is required.");

  const normalized = value.trim().toUpperCase();
  if (isOutreachStatus(normalized)) return normalized;

  return new Error(`outreachStatus must be one of: ${OUTREACH_STATUSES.join(", ")}.`);
}

function parseNullableString(value: unknown, fieldName: string): string | null | Error {
  if (value === null) return null;
  if (typeof value !== "string") return new Error(`${fieldName} must be a string or null.`);

  const trimmed = value.trim();
  return trimmed || null;
}

function parseNullableDate(value: unknown, fieldName: string): Date | null | Error {
  if (value === null || value === "") return null;
  if (typeof value !== "string") return new Error(`${fieldName} must be an ISO date string or null.`);

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Error(`${fieldName} must be a valid date.`);

  return date;
}

function isOutreachStatus(value: string): value is OutreachStatus {
  return OUTREACH_STATUSES.includes(value as OutreachStatus);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
