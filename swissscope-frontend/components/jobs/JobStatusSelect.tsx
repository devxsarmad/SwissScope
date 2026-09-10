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

const STATUS_CLASSES: Record<JobStatus, string> = {
  NEW: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300",
  SHORTLISTED:
    "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300",
  APPLIED: "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-300",
  INTERVIEW: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
  OFFER: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
  REJECTED: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300",
  ARCHIVED: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300",
};

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
      className={`h-9 rounded-full border px-3 text-xs font-semibold shadow-xs outline-none transition-colors focus-visible:border-primary/70 focus-visible:ring-3 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 ${STATUS_CLASSES[value]}`}
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

export { STATUS_CLASSES, STATUS_OPTIONS };
