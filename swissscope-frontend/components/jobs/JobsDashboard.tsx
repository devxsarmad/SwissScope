"use client";

import { useMemo, useState } from "react";
import { Activity, BriefcaseBusiness, Building2, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useJobs } from "@/hooks/useJobs";
import type { Job, JobStatus } from "@/lib/types";
import { JobCard } from "./JobCard";
import { JobFilters, type JobFiltersValue } from "./JobFilters";
import { JobTable } from "./JobTable";

const EMPTY_FILTERS: JobFiltersValue = {};

export function JobsDashboard() {
  const [filters, setFilters] = useState<JobFiltersValue>(EMPTY_FILTERS);
  const apiFilters = useMemo(
    () => ({
      city: filters.city,
      minScore: filters.minScore,
      status: filters.status,
    }),
    [filters.city, filters.minScore, filters.status],
  );
  const { jobs, isLoading, error, setJobStatus } = useJobs(apiFilters);
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);
  const visibleJobs = useMemo(() => applyClientFilters(jobs, filters), [jobs, filters]);
  const stats = useMemo(() => buildStats(visibleJobs), [visibleJobs]);

  async function handleStatusChange(jobId: string, status: JobStatus) {
    setUpdatingJobId(jobId);
    await setJobStatus(jobId, status);
    setUpdatingJobId(null);
  }

  return (
    <section className="min-w-0 space-y-6">
      <div className="flex min-w-0 flex-col gap-3">
        <Badge variant="outline" className="w-fit rounded-full border-primary/20 bg-primary/10 px-3 py-1 font-semibold text-primary">
          Live data from PostgreSQL
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Job Match Dashboard</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
          Saved Swiss engineering roles ranked by fit for your full-stack and AI profile.
        </p>
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BriefcaseBusiness} label="Jobs" value={String(stats.totalJobs)} />
        <StatCard icon={Building2} label="Companies" value={String(stats.totalCompanies)} />
        <StatCard icon={Target} label="Best Score" value={`${stats.bestScore}%`} />
        <StatCard icon={Activity} label="Active" value={String(stats.activeJobs)} />
      </div>

      <JobFilters filters={filters} onChange={setFilters} onReset={() => setFilters(EMPTY_FILTERS)} />

      {error ? (
        <Card className="rounded-lg border-destructive/40">
          <CardContent className="py-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <Card className="rounded-lg">
          <CardContent className="py-8 text-sm text-muted-foreground">Loading saved jobs...</CardContent>
        </Card>
      ) : null}

      {!isLoading && !error && visibleJobs.length === 0 ? (
        <Card className="rounded-lg">
          <CardContent className="py-8 text-sm text-muted-foreground">No jobs match the current filters.</CardContent>
        </Card>
      ) : null}

      {!isLoading && !error && visibleJobs.length > 0 ? (
        <>
          <JobTable jobs={visibleJobs} updatingJobId={updatingJobId} onStatusChange={handleStatusChange} />
          <div className="grid gap-3">
            {visibleJobs.map((job) => (
              <JobCard key={job.id} job={job} updatingJobId={updatingJobId} onStatusChange={handleStatusChange} />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card className="rounded-2xl bg-gradient-to-br from-card to-muted/35">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-0">
        <CardTitle className="text-sm font-semibold text-muted-foreground">{label}</CardTitle>
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

function applyClientFilters(jobs: Job[], filters: JobFiltersValue): Job[] {
  const query = filters.query?.trim().toLowerCase();
  if (!query) return jobs;

  return jobs.filter((job) =>
    [job.title, job.company.name, job.location, job.techStack.join(" ")]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query),
  );
}

function buildStats(jobs: Job[]) {
  const companyNames = new Set(jobs.map((job) => job.company.name));
  const totalScore = jobs.reduce((sum, job) => sum + job.matchScore.score, 0);
  const bestScore = jobs.reduce((best, job) => Math.max(best, job.matchScore.score), 0);
  const activeJobs = jobs.filter((job) => !["REJECTED", "ARCHIVED"].includes(job.status)).length;

  return {
    totalJobs: jobs.length,
    totalCompanies: companyNames.size,
    activeJobs,
    bestScore,
    averageScore: jobs.length === 0 ? 0 : Math.round(totalScore / jobs.length),
  };
}
