"use client";

import { useMemo, useState } from "react";
import { Activity, BriefcaseBusiness, Building2, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useJobs } from "@/hooks/useJobs";
import type { Job } from "@/lib/types";
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
    }),
    [filters.city, filters.minScore],
  );
  const { jobs, isLoading, error } = useJobs(apiFilters);
  const visibleJobs = useMemo(() => applyClientFilters(jobs, filters), [jobs, filters]);
  const stats = useMemo(() => buildStats(visibleJobs), [visibleJobs]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2">
        <Badge variant="outline" className="w-fit rounded-md">
          Live data from PostgreSQL
        </Badge>
        <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">Job Match Dashboard</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Saved Swiss engineering roles ranked by fit for your full-stack and AI profile.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BriefcaseBusiness} label="Jobs" value={String(stats.totalJobs)} />
        <StatCard icon={Building2} label="Companies" value={String(stats.totalCompanies)} />
        <StatCard icon={Target} label="Best Score" value={`${stats.bestScore}%`} />
        <StatCard icon={Activity} label="Average Score" value={`${stats.averageScore}%`} />
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
          <JobTable jobs={visibleJobs} />
          <div className="grid gap-3">
            {visibleJobs.map((job) => (
              <JobCard key={job.id} job={job} />
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
    <Card className="rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-xl font-semibold">{value}</p>
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

  return {
    totalJobs: jobs.length,
    totalCompanies: companyNames.size,
    bestScore,
    averageScore: jobs.length === 0 ? 0 : Math.round(totalScore / jobs.length),
  };
}
