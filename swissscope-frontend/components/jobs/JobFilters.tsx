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
    <div className="grid gap-3 rounded-lg border bg-card p-3 md:grid-cols-[1fr_150px_150px_160px_auto]">
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
      <select
        aria-label="Status"
        className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
      <div className="flex items-center gap-2 text-xs text-muted-foreground md:col-span-5">
        <SlidersHorizontal className="size-3.5" />
        Filters apply to saved PostgreSQL jobs and computed match scores.
      </div>
    </div>
  );
}
