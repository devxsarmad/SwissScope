"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { JobFilters as ApiJobFilters } from "@/lib/api";

export type JobFiltersValue = ApiJobFilters & {
  query?: string;
};

export function JobFilters({
  filters,
  onChange,
  onReset,
}: {
  filters: JobFiltersValue;
  onChange: (filters: JobFiltersValue) => void;
  onReset: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-lg border bg-card p-3 md:grid-cols-[1fr_160px_150px_auto]">
      <label className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search jobs or companies"
          className="pl-9"
          placeholder="Search title or company"
          value={filters.query ?? ""}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
        />
      </label>
      <Input
        aria-label="City"
        placeholder="City"
        value={filters.city ?? ""}
        onChange={(event) => onChange({ ...filters, city: event.target.value })}
      />
      <Input
        aria-label="Minimum score"
        min={0}
        max={100}
        placeholder="Min score"
        type="number"
        value={filters.minScore ?? ""}
        onChange={(event) =>
          onChange({
            ...filters,
            minScore: event.target.value ? Number(event.target.value) : undefined,
          })
        }
      />
      <Button className="gap-2" type="button" variant="outline" onClick={onReset}>
        <X className="size-4" />
        Reset
      </Button>
      <div className="flex items-center gap-2 text-xs text-muted-foreground md:col-span-4">
        <SlidersHorizontal className="size-3.5" />
        Filters apply to saved PostgreSQL jobs and computed match scores.
      </div>
    </div>
  );
}
