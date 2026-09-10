import { Clock3, Users } from "lucide-react";
import type { Job } from "@/lib/types";

export function JobFreshness({ job, compact = false }: { job: Job; compact?: boolean }) {
  const postedText = job.postedAgeText ?? formatPostedDate(job.postedAt) ?? "Posted date unknown";

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground ${compact ? "text-xs" : "text-sm"}`}>
      <span className="inline-flex items-center gap-1.5">
        <Clock3 className="size-3.5 text-primary" />
        {postedText}
      </span>
      {typeof job.applicantCount === "number" ? (
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-3.5 text-primary" />
          {job.applicantCount} applicants
        </span>
      ) : null}
    </div>
  );
}

function formatPostedDate(postedAt: string | null | undefined): string | null {
  if (!postedAt) return null;

  const date = new Date(postedAt);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}
