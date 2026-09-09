import Link from "next/link";
import { ExternalLink, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Job, JobStatus } from "@/lib/types";
import { MatchScoreBadge } from "./MatchScoreBadge";
import { JobStatusSelect } from "./JobStatusSelect";

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
    <Card className="rounded-lg md:hidden">
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base">
              <Link className="hover:underline" href={`/jobs/${job.id}`}>
                {job.title}
              </Link>
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{job.company.name}</p>
          </div>
          <MatchScoreBadge score={job.matchScore.score} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="size-4" />
          {job.location ?? "Remote/unspecified"}
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Status</span>
          <JobStatusSelect
            disabled={updatingJobId === job.id}
            value={job.status}
            onChange={(status) => onStatusChange(job.id, status)}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {job.techStack.slice(0, 4).map((tech) => (
            <Badge key={tech} className="rounded-md" variant="secondary">
              {tech}
            </Badge>
          ))}
          {job.techStack.length === 0 ? <span className="text-sm text-muted-foreground">No tech detected</span> : null}
        </div>
        <Button className="w-full gap-2" size="sm" variant="outline" render={<a href={job.url} rel="noreferrer" target="_blank" />}>
          <ExternalLink className="size-4" />
          View posting
        </Button>
      </CardContent>
    </Card>
  );
}
