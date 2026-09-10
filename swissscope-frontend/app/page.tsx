import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { JobsDashboard } from "@/components/jobs/JobsDashboard";

export default function Home() {
  return (
    <main className="min-h-screen max-w-full overflow-x-hidden bg-background text-foreground">
      <Header />
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-5 px-4 py-5 sm:px-5 md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 md:px-6 md:py-7">
        <Sidebar />
        <JobsDashboard />
      </div>
    </main>
  );
}
