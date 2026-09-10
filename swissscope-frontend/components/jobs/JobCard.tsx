import Link from "next/link";
import { ExternalLink, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Job, JobStatus } from "@/lib/types";
import { JobFreshness } from "./JobFreshness";
import { JobStatusSelect } from "./JobStatusSelect";
import { MatchScoreBadge } from "./MatchScoreBadge";
import { TechChip } from "./TechChip";

export function JobCard({
  job,
  updatingJobId,
  onStatusChange,
}: {
  job: Job;
  updatingJobId?: string | null;
  onStatusChange: (jobId: string, status: JobStatus) => void;
}) {
  return (
    <Card className="rounded-2xl md:hidden">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base">
              <Link className="hover:text-primary hover:underline" href={`/jobs/${job.id}`}>
                {job.title}
              </Link>
            </CardTitle>
            <p className="mt-1 text-sm font-medium text-muted-foreground">{job.company.name}</p>
          </div>
          <MatchScoreBadge score={job.matchScore.score} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="size-4 text-primary" />
          <span className="min-w-0 truncate">{job.location ?? "Remote/unspecified"}</span>
        </div>
        <JobFreshness job={job} />
        <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 p-3">
          <span className="text-sm font-medium text-muted-foreground">Status</span>
          <JobStatusSelect
            disabled={updatingJobId === job.id}
            value={job.status}
            onChange={(status) => onStatusChange(job.id, status)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {job.techStack.slice(0, 5).map((tech) => (
            <TechChip key={tech} label={tech} />
          ))}
          {job.techStack.length === 0 ? <span className="text-sm text-muted-foreground">No tech detected</span> : null}
        </div>
        <Button className="w-full gap-2" size="lg" variant="outline" render={<a href={job.url} rel="noreferrer" target="_blank" />}>
          <ExternalLink className="size-4" />
          View posting
        </Button>
      </CardContent>
    </Card>
  );
}
