import type { JobStatus } from "@/lib/types";

const STATUS_OPTIONS: Array<{ value: JobStatus; label: string }> = [
  { value: "NEW", label: "New" },
  { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "APPLIED", label: "Applied" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "OFFER", label: "Offer" },
  { value: "REJECTED", label: "Rejected" },
  { value: "ARCHIVED", label: "Archived" },
];

export function JobStatusSelect({
  value,
  disabled,
  onChange,
}: {
  value: JobStatus;
  disabled?: boolean;
  onChange: (status: JobStatus) => void;
}) {
  return (
    <select
      aria-label="Job status"
      className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled}
      value={value}
      onChange={(event) => onChange(event.target.value as JobStatus)}
    >
      {STATUS_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export { STATUS_OPTIONS };
