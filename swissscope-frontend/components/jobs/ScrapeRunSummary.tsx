import { AlertTriangle, CheckCircle2, Clock, RefreshCw, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScrapeRun, ScrapeRunStatus } from "@/lib/types";

const STALE_AFTER_HOURS = 6;

export function ScrapeRunSummary({ scrapeRuns, isLoading, error, onRetry }: { scrapeRuns: ScrapeRun[]; isLoading: boolean; error: string | null; onRetry: () => void }) {
  const latestRun = scrapeRuns[0] ?? null;
  const health = getAutomationHealth(latestRun);

  return (
    <Card aria-busy={isLoading} className="rounded-2xl border-primary/10 bg-gradient-to-br from-card to-muted/30">
      <CardHeader className="gap-2 sm:flex sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <RefreshCw aria-hidden="true" className="size-4 text-primary" />
            Scrape automation
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Latest scheduler health and recent scrape history.</p>
        </div>
        {latestRun ? <StatusBadge status={latestRun.status} /> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? <p aria-live="polite" className="text-sm text-muted-foreground" role="status">Loading scrape history...</p> : null}

        {!isLoading && error ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2">
            <p className="text-sm text-destructive" role="alert">{error}</p>
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>Retry</Button>
          </div>
        ) : null}

        {!isLoading && !error && !latestRun ? <HealthMessage tone="warning" message="No scheduled scrape has run yet." /> : null}

        {!isLoading && !error && latestRun ? (
          <>
            <HealthMessage tone={health.tone} message={health.message} />
            <div className="grid gap-3 text-sm sm:grid-cols-4">
              <Metric label="Fetched" value={latestRun.totalFetched} />
              <Metric label="New" value={latestRun.totalCreated} />
              <Metric label="Updated" value={latestRun.totalUpdated} />
              <Metric label="Archived" value={latestRun.archivedJobs} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Recent runs</p>
              <ul className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70 bg-background/60">
                {scrapeRuns.map((run) => (
                  <li key={run.id} className="grid gap-2 p-3 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusIcon status={run.status} />
                        <time className="font-medium" dateTime={run.finishedAt ?? run.startedAt}>
                          {formatDate(run.finishedAt ?? run.startedAt)}
                        </time>
                        <StatusBadge status={run.status} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatCount(run.totalFetched)} fetched · {formatCount(run.totalCreated)} new · {formatCount(run.totalUpdated)} updated · {formatCount(run.archivedJobs)} archived
                      </p>
                    </div>
                    <SourceSummary run={run} />
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

function HealthMessage({ tone, message }: { tone: "success" | "warning" | "danger"; message: string }) {
  const toneClass = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200",
    warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200",
    danger: "border-destructive/30 bg-destructive/10 text-destructive",
  }[tone];

  return <div className={`rounded-xl border px-3 py-2 text-sm ${toneClass}`} role={tone === "danger" ? "alert" : "status"}>{message}</div>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{formatCount(value)}</p>
    </div>
  );
}

function SourceSummary({ run }: { run: ScrapeRun }) {
  if (run.sourceResults.length === 0) {
    return <span className="text-xs text-muted-foreground sm:text-right">No source results</span>;
  }

  const failedSources = run.sourceResults.filter((source) => source.status === "failed");
  if (failedSources.length === 0) {
    return <span className="text-xs text-muted-foreground sm:text-right">{formatCount(run.sourceResults.length)} sources ok</span>;
  }

  const failedNames = failedSources.map((source) => source.source).join(", ");

  return (
    <span className="text-xs text-destructive sm:text-right" title={`Failed sources: ${failedNames}`}>
      {formatCount(failedSources.length)} failed {failedSources.length === 1 ? "source" : "sources"}: {failedNames}
    </span>
  );
}

function StatusBadge({ status }: { status: ScrapeRunStatus }) {
  const isHealthy = status === "SUCCESS";
  const isRunning = status === "RUNNING";

  return (
    <Badge className="rounded-full px-2 py-0.5" variant={isHealthy || isRunning ? "secondary" : "destructive"}>
      {status.replace("_", " ")}
    </Badge>
  );
}

function StatusIcon({ status }: { status: ScrapeRunStatus }) {
  if (status === "SUCCESS") return <CheckCircle2 aria-hidden="true" className="size-4 text-emerald-600" />;
  if (status === "RUNNING") return <Clock aria-hidden="true" className="size-4 text-primary" />;
  if (status === "PARTIAL_FAILURE") return <AlertTriangle aria-hidden="true" className="size-4 text-amber-600" />;
  return <XCircle aria-hidden="true" className="size-4 text-destructive" />;
}

function getAutomationHealth(run: ScrapeRun | null): { tone: "success" | "warning" | "danger"; message: string } {
  if (!run) return { tone: "warning", message: "No scheduled scrape has run yet." };
  if (run.status === "RUNNING") return { tone: "warning", message: "A scrape is currently running." };
  if (run.status === "FAILED") return { tone: "danger", message: "The latest scheduled scrape failed. Check source errors before trusting the dashboard data." };
  if (run.status === "PARTIAL_FAILURE") return { tone: "warning", message: "The latest scrape completed with at least one source failure." };

  const finishedAt = run.finishedAt ? new Date(run.finishedAt).getTime() : new Date(run.startedAt).getTime();
  const ageHours = (Date.now() - finishedAt) / (1000 * 60 * 60);
  if (ageHours > STALE_AFTER_HOURS) {
    return {
      tone: "warning",
      message: `Last successful scrape was ${formatRelativeHours(ageHours)} ago. Data may be stale.`,
    };
  }

  return {
    tone: "success",
    message: `Data is fresh. Last successful scrape was ${formatRelativeHours(ageHours)} ago.`,
  };
}

function formatCount(value: number): string {
  return new Intl.NumberFormat().format(value);
}

function formatRelativeHours(ageHours: number): string {
  if (ageHours < 1) return "less than 1 hour";
  const rounded = Math.round(ageHours);
  return `${rounded} hour${rounded === 1 ? "" : "s"}`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
