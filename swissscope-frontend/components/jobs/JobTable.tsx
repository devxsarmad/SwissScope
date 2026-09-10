import Link from "next/link";
import { ExternalLink } from "lucide-react";
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
import { JobStatusSelect } from "./JobStatusSelect";
import { MatchScoreBadge } from "./MatchScoreBadge";
import { TechChip } from "./TechChip";

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
    <div className="hidden min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-sm shadow-slate-950/5 ring-1 ring-white/70 md:block dark:ring-white/5">
      <div className="overflow-x-auto">
        <Table className="min-w-[980px]">
          <TableHeader className="bg-muted/60">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[34%]">Role</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tech</TableHead>
              <TableHead className="w-20 text-right">Open</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="whitespace-normal">
                  <Link className="font-semibold leading-5 text-foreground hover:text-primary hover:underline" href={`/jobs/${job.id}`}>
                    {job.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">{job.workload ?? "Workload unknown"}</p>
                </TableCell>
                <TableCell className="font-medium text-slate-700 dark:text-slate-200">{job.company.name}</TableCell>
                <TableCell className="text-muted-foreground">{job.location ?? "Remote/unspecified"}</TableCell>
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
                  <div className="flex max-w-64 flex-wrap gap-1.5">
                    {job.techStack.slice(0, 4).map((tech) => (
                      <TechChip key={tech} label={tech} />
                    ))}
                    {job.techStack.length === 0 ? (
                      <span className="text-xs text-muted-foreground">None detected</span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="icon-sm" variant="ghost" render={<a href={job.url} rel="noreferrer" target="_blank" />}>
                    <ExternalLink className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
