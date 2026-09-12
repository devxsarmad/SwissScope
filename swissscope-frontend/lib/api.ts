import type { CompaniesResponse, Job, JobStatus, JobsResponse, LatestScrapeRunResponse, OutreachStatus } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type JobOutreachUpdate = {
  outreachStatus?: OutreachStatus;
  notes?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactLinkedIn?: string | null;
  appliedAt?: string | null;
  followUpAt?: string | null;
  lastContactedAt?: string | null;
  interviewNotes?: string | null;
};

export type JobFilters = {
  city?: string;
  company?: string;
  minScore?: number;
  status?: JobStatus;
};

export async function fetchJobs(filters: JobFilters = {}): Promise<JobsResponse> {
  const params = new URLSearchParams();
  if (filters.city) params.set("city", filters.city);
  if (filters.company) params.set("company", filters.company);
  if (filters.minScore !== undefined) params.set("minScore", String(filters.minScore));
  if (filters.status) params.set("status", filters.status);

  const query = params.toString();
  return apiFetch<JobsResponse>(`/jobs${query ? `?${query}` : ""}`);
}

export async function updateJobStatus(id: string, status: JobStatus): Promise<Job> {
  return apiFetch<Job>(`/jobs/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
}

export async function updateJobOutreach(id: string, data: JobOutreachUpdate): Promise<Job> {
  return apiFetch<Job>(`/jobs/${id}/outreach`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function fetchJob(id: string): Promise<Job> {
  return apiFetch<Job>(`/jobs/${id}`);
}

export async function fetchCompanies(): Promise<CompaniesResponse> {
  return apiFetch<CompaniesResponse>("/companies");
}

export async function fetchLatestScrapeRun(): Promise<LatestScrapeRunResponse> {
  return apiFetch<LatestScrapeRunResponse>("/scrape-runs/latest");
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`SwissScope API request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}
