import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { JobFreshness } from "@/components/jobs/JobFreshness";
import { MatchScoreBadge } from "@/components/jobs/MatchScoreBadge";
import { OutreachPanel } from "@/components/jobs/OutreachPanel";
import { TechChip } from "@/components/jobs/TechChip";
import { fetchJob } from "@/lib/api";

export default async function JobDetailPage({ params }: PageProps<"/jobs/[id]">) {
  const { id } = await params;
  const job = await fetchJob(id);

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-4xl gap-6 px-4 py-8 sm:px-6">
      <Card className="rounded-2xl">
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-2">
              <p className="text-sm font-semibold text-primary">{job.company.name}</p>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-3">
                <MatchScoreBadge score={job.matchScore.score} />
                <Badge className="rounded-full px-3 py-1" variant="secondary">
                  {job.status}
                </Badge>
              </div>
            </div>
            <Button className="gap-2" variant="outline" render={<a href={job.url} rel="noreferrer" target="_blank" />}>
              <ExternalLink className="size-4" />
              Open posting
            </Button>
          </div>

          <div className="grid gap-3 rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground md:grid-cols-3">
            <span>{job.location ?? "Remote/unspecified"}</span>
            <span>{job.workload ?? "Workload unknown"}</span>
            <JobFreshness job={job} />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {job.techStack.map((tech) => (
              <TechChip key={tech} label={tech} />
            ))}
          </div>

          <p className="text-sm leading-7 text-muted-foreground">{job.description}</p>
        </CardContent>
      </Card>

      <OutreachPanel job={job} />
    </main>
  );
}
