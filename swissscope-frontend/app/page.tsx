import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { JobsDashboard } from "@/components/jobs/JobsDashboard";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 md:grid-cols-[220px_1fr] md:px-6">
        <Sidebar />
        <JobsDashboard />
      </div>
    </main>
  );
}
