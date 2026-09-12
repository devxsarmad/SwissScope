import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ScrapeRun } from "@/lib/types";

export function ScrapeRunSummary({ scrapeRun, isLoading }: { scrapeRun: ScrapeRun | null; isLoading: boolean }) {
  if (isLoading) {
    return <span className="text-xs text-muted-foreground">Loading scrape status...</span>;
  }

  if (!scrapeRun) {
    return <span className="text-xs text-muted-foreground">No scheduled scrape has run yet.</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <RefreshCw className="size-3.5 text-primary" />
      <span>Last scrape {formatDate(scrapeRun.finishedAt ?? scrapeRun.startedAt)}</span>
      <Badge className="rounded-full px-2 py-0.5" variant={scrapeRun.status === "SUCCESS" ? "secondary" : "destructive"}>
        {scrapeRun.status.replace("_", " ")}
      </Badge>
      <span>
        {scrapeRun.totalFetched} fetched · {scrapeRun.totalCreated} new · {scrapeRun.totalUpdated} updated · {scrapeRun.archivedJobs} archived
      </span>
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
