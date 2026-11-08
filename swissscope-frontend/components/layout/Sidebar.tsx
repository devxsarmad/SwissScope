import { BarChart3, Building2, ListFilter } from "lucide-react";

const navItems = [
  { label: "Jobs", href: "#jobs", icon: ListFilter },
  { label: "Companies", href: "#companies", icon: Building2 },
  { label: "Scores", href: "#scores", icon: BarChart3 },
];

export function Sidebar() {
  return (
    <aside aria-label="Dashboard sidebar" className="rounded-lg border bg-card p-2 md:min-h-[calc(100vh-6.5rem)]">
      <nav aria-label="Dashboard sections" className="grid gap-1">
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="flex h-9 items-center gap-2 rounded-md px-3 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <item.icon aria-hidden="true" className="size-4" />
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
