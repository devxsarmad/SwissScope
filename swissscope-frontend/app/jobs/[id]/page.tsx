import { fetchJob } from "@/lib/api";

export default async function JobDetailPage({ params }: PageProps<"/jobs/[id]">) {
  const { id } = await params;
  const job = await fetchJob(id);

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8">
      <p className="text-sm text-muted-foreground">{job.company.name}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-normal">{job.title}</h1>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">{job.description}</p>
    </main>
  );
}
