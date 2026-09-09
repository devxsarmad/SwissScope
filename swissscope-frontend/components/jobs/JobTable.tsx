import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Job, JobStatus } from "@/lib/types";
import { MatchScoreBadge } from "./MatchScoreBadge";
import { JobStatusSelect } from "./JobStatusSelect";

export function JobTable({
  jobs,
  updatingJobId,
  onStatusChange,
}: {
  jobs: Job[];
  updatingJobId?: string | null;
  onStatusChange: (jobId: string, status: JobStatus) => void;
}) {
  return (
    <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Role</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tech</TableHead>
            <TableHead className="w-24 text-right">Open</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell>
                <Link className="font-medium hover:underline" href={`/jobs/${job.id}`}>
                  {job.title}
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">{job.workload ?? "Workload unknown"}</p>
              </TableCell>
              <TableCell>{job.company.name}</TableCell>
              <TableCell>{job.location ?? "Remote/unspecified"}</TableCell>
              <TableCell>
                <MatchScoreBadge score={job.matchScore.score} />
              </TableCell>
              <TableCell>
                <JobStatusSelect
                  disabled={updatingJobId === job.id}
                  value={job.status}
                  onChange={(status) => onStatusChange(job.id, status)}
                />
              </TableCell>
              <TableCell>
                <div className="flex max-w-56 flex-wrap gap-1">
                  {job.techStack.slice(0, 3).map((tech) => (
                    <Badge key={tech} className="rounded-md" variant="secondary">
                      {tech}
                    </Badge>
                  ))}
                  {job.techStack.length === 0 ? (
                    <span className="text-xs text-muted-foreground">None detected</span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="ghost" render={<a href={job.url} rel="noreferrer" target="_blank" />}>
                  <ExternalLink className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
