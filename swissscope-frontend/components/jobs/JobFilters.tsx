"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { JobFilters as ApiJobFilters } from "@/lib/api";
import type { JobStatus } from "@/lib/types";
import { STATUS_OPTIONS } from "./JobStatusSelect";

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
    <div className="min-w-0 rounded-2xl border border-border/70 bg-card/95 p-4 shadow-sm shadow-slate-950/5 ring-1 ring-white/70 dark:ring-white/5">
      <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_150px_150px_160px_auto]">
        <label className="relative min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search jobs or companies"
            className="pl-9"
            placeholder="Search title, company, or stack"
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
        <select
          aria-label="Status"
          className="h-10 rounded-xl border border-input/80 bg-card/80 px-3 text-sm text-foreground shadow-xs outline-none transition-colors focus-visible:border-primary/70 focus-visible:ring-3 focus-visible:ring-primary/20"
          value={filters.status ?? ""}
          onChange={(event) =>
            onChange({
              ...filters,
              status: event.target.value ? (event.target.value as JobStatus) : undefined,
            })
          }
        >
          <option value="">Any status</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Button className="gap-2" type="button" variant="outline" onClick={onReset}>
          <X className="size-4" />
          Reset
        </Button>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <SlidersHorizontal className="size-3.5 text-primary" />
        Filters apply to saved PostgreSQL jobs, workflow status, and computed match scores.
      </div>
    </div>
  );
}
