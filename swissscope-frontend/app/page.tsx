import type { ComponentType } from "react";
import { Activity, Database, Search, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 md:grid-cols-[220px_1fr] md:px-6">
        <Sidebar />
        <section className="space-y-6">
          <div className="flex flex-col gap-2">
            <Badge variant="outline" className="w-fit">
              Backend connected on demand
            </Badge>
            <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">
              SwissScope dashboard foundation
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              The frontend shell is ready for saved jobs, company filters, match scores, and status tracking.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatusCard icon={Server} label="API" value="Express" />
            <StatusCard icon={Database} label="Storage" value="PostgreSQL" />
            <StatusCard icon={Search} label="Source" value="SwissDevJobs" />
            <StatusCard icon={Activity} label="Scoring" value="Keywords" />
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card className="rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
