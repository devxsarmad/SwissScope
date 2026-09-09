import { BarChart3, Building2, ListFilter } from "lucide-react";

const navItems = [
  { label: "Jobs", icon: ListFilter },
  { label: "Companies", icon: Building2 },
  { label: "Scores", icon: BarChart3 },
];

export function Sidebar() {
  return (
    <aside className="rounded-lg border bg-card p-2 md:min-h-[calc(100vh-6.5rem)]">
      <nav className="grid gap-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            type="button"
            className="flex h-9 items-center gap-2 rounded-md px-3 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <item.icon className="size-4" />
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
