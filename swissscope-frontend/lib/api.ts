import type { CompaniesResponse, Job, JobsResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type JobFilters = {
  city?: string;
  company?: string;
  minScore?: number;
};

export async function fetchJobs(filters: JobFilters = {}): Promise<JobsResponse> {
  const params = new URLSearchParams();
  if (filters.city) params.set("city", filters.city);
  if (filters.company) params.set("company", filters.company);
  if (filters.minScore !== undefined) params.set("minScore", String(filters.minScore));

  const query = params.toString();
  return apiFetch<JobsResponse>(`/jobs${query ? `?${query}` : ""}`);
}

export async function fetchJob(id: string): Promise<Job> {
  return apiFetch<Job>(`/jobs/${id}`);
}

export async function fetchCompanies(): Promise<CompaniesResponse> {
  return apiFetch<CompaniesResponse>("/companies");
}

async function apiFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`SwissScope API request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}
