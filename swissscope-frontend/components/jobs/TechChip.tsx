import { Badge } from "@/components/ui/badge";

export function TechChip({ label }: { label: string }) {
  return (
    <Badge
      className="rounded-full border border-primary/10 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary shadow-xs dark:border-primary/20 dark:bg-primary/15 dark:text-primary"
      variant="outline"
    >
      {label}
    </Badge>
  );
}
