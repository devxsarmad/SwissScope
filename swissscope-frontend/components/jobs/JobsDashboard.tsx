"use client";

import { useMemo, useState } from "react";
import { Activity, BriefcaseBusiness, Building2, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useJobs } from "@/hooks/useJobs";
import { useScrapeRuns } from "@/hooks/useScrapeRuns";
import type { Job, JobStatus } from "@/lib/types";
import { JobCard } from "./JobCard";
import { JobFilters, type JobFiltersValue } from "./JobFilters";
import { JobTable } from "./JobTable";
import { ScrapeRunSummary } from "./ScrapeRunSummary";

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
  const { jobs, isLoading, error, statusError, setJobStatus } = useJobs(apiFilters);
  const [updatingJobIds, setUpdatingJobIds] = useState<Set<string>>(() => new Set());
  const { scrapeRuns, isLoading: isScrapeRunsLoading, error: scrapeRunsError } = useScrapeRuns(5);
  const visibleJobs = useMemo(() => applyClientFilters(jobs, filters), [jobs, filters]);
  const stats = useMemo(() => buildStats(visibleJobs), [visibleJobs]);
  const hasActiveFilters = Boolean(
    filters.query?.trim() ||
      filters.city?.trim() ||
      filters.status ||
      filters.minScore !== undefined,
  );

  async function handleStatusChange(jobId: string, status: JobStatus) {
    setUpdatingJobIds((current) => new Set(current).add(jobId));
    try {
      await setJobStatus(jobId, status);
    } finally {
      setUpdatingJobIds((current) => {
        const next = new Set(current);
        next.delete(jobId);
        return next;
      });
    }
  }

  return (
    <section id="jobs" className="min-w-0 space-y-6">
      <div className="flex min-w-0 flex-col gap-3">
        <Badge variant="outline" className="w-fit rounded-full border-primary/20 bg-primary/10 px-3 py-1 font-semibold text-primary">
          Live data from PostgreSQL
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Job Match Dashboard</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
          Saved Swiss engineering roles ranked by fit for your full-stack and AI profile.
        </p>
        <ScrapeRunSummary scrapeRuns={scrapeRuns} isLoading={isScrapeRunsLoading} error={scrapeRunsError} />
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={BriefcaseBusiness} label="Jobs" value={formatCount(stats.totalJobs)} />
        <StatCard id="companies" icon={Building2} label="Companies" value={formatCount(stats.totalCompanies)} />
        <StatCard id="scores" icon={Target} label="Best Score" value={stats.totalJobs ? `${stats.bestScore}%` : "—"} />
        <StatCard icon={Target} label="Average Score" value={stats.totalJobs ? `${stats.averageScore}%` : "—"} />
        <StatCard icon={Activity} label="Active" value={formatCount(stats.activeJobs)} />
      </div>

      <JobFilters filters={filters} onChange={setFilters} onReset={() => setFilters(EMPTY_FILTERS)} />

      {!isLoading && !error ? (
        <p aria-live="polite" className="text-sm text-muted-foreground">
          Showing {visibleJobs.length} {visibleJobs.length === 1 ? "job" : "jobs"}.
        </p>
      ) : null}

      {statusError ? (
        <Card role="alert" className="rounded-lg border-destructive/40">
          <CardContent className="py-4 text-sm text-destructive">{statusError}</CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card role="alert" className="rounded-lg border-destructive/40">
          <CardContent className="py-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <Card role="status" aria-live="polite" className="rounded-lg">
          <CardContent className="py-8 text-sm text-muted-foreground">Loading saved jobs...</CardContent>
        </Card>
      ) : null}

      {!isLoading && !error && visibleJobs.length === 0 ? (
        <Card className="rounded-lg">
          <CardContent className="flex flex-col items-start gap-3 py-8">
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters ? "No jobs match the current filters." : "No saved jobs yet."}
            </p>
            {hasActiveFilters ? (
              <Button type="button" variant="outline" onClick={() => setFilters(EMPTY_FILTERS)}>
                Clear filters
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !error && visibleJobs.length > 0 ? (
        <>
          <JobTable jobs={visibleJobs} updatingJobIds={updatingJobIds} onStatusChange={handleStatusChange} />
          <div className="grid gap-3" role="list" aria-label="Saved jobs">
            {visibleJobs.map((job) => (
              <JobCard key={job.id} job={job} updatingJobIds={updatingJobIds} onStatusChange={handleStatusChange} />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

function StatCard({
  id,
  icon: Icon,
  label,
  value,
}: {
  id?: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card id={id} className="rounded-2xl bg-gradient-to-br from-card to-muted/35">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-0">
        <CardTitle className="text-sm font-semibold text-muted-foreground">{label}</CardTitle>
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon aria-hidden="true" className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

function applyClientFilters(jobs: Job[], filters: JobFiltersValue): Job[] {
  const queryTerms = normalizeSearchText(filters.query ?? "").split(" ").filter(Boolean);
  if (queryTerms.length === 0) return jobs;

  return jobs.filter((job) => {
    const searchableText = normalizeSearchText(
      [job.title, job.company.name, job.location, job.workload, job.techStack.join(" ")]
        .filter(Boolean)
        .join(" "),
    );
    return queryTerms.every((term) => searchableText.includes(term));
  });
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function formatCount(value: number): string {
  return new Intl.NumberFormat().format(value);
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
