"use client";

import { useState } from "react";
import { CalendarDays, Contact, NotebookPen, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { updateJobOutreach, type JobOutreachUpdate } from "@/lib/api";
import type { Job, OutreachStatus } from "@/lib/types";

const OUTREACH_OPTIONS: Array<{ value: OutreachStatus; label: string }> = [
  { value: "NOT_STARTED", label: "Not started" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "FOLLOWED_UP", label: "Followed up" },
  { value: "RESPONDED", label: "Responded" },
  { value: "INTERVIEWING", label: "Interviewing" },
  { value: "CLOSED", label: "Closed" },
];

type OutreachFormState = {
  outreachStatus: OutreachStatus;
  notes: string;
  contactName: string;
  contactEmail: string;
  contactLinkedIn: string;
  appliedAt: string;
  followUpAt: string;
  lastContactedAt: string;
  interviewNotes: string;
};

export function OutreachPanel({ job }: { job: Job }) {
  const [form, setForm] = useState<OutreachFormState>(() => toFormState(job));
  const [savedJob, setSavedJob] = useState(job);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const hasUnsavedChanges = JSON.stringify(form) !== JSON.stringify(toFormState(savedJob));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setSaveFailed(false);

    try {
      const updatedJob = await updateJobOutreach(savedJob.id, toPayload(form));
      setSavedJob(updatedJob);
      setForm(toFormState(updatedJob));
      setMessage("Outreach details saved.");
    } catch (error) {
      setSaveFailed(true);
      setMessage(error instanceof Error ? error.message : "Failed to save outreach details.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="gap-2">
        <div className="flex items-center gap-2 text-primary">
          <NotebookPen aria-hidden="true" className="size-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">Outreach CRM</span>
        </div>
        <CardTitle>Notes and follow-up</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-medium" htmlFor="outreach-status">
              Outreach status
              <select
                id="outreach-status"
                className="h-10 rounded-xl border border-input/80 bg-card/80 px-3 text-sm text-foreground shadow-xs outline-none transition-colors focus-visible:border-primary/70 focus-visible:ring-3 focus-visible:ring-primary/20"
                value={form.outreachStatus}
                onChange={(event) => setForm((current) => ({ ...current, outreachStatus: event.target.value as OutreachStatus }))}
              >
                {OUTREACH_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <TextInput label="Contact name" maxLength={200} autoComplete="name" icon={Contact} value={form.contactName} onChange={(contactName) => setForm((current) => ({ ...current, contactName }))} />
            <TextInput label="Contact email" maxLength={320} type="email" autoComplete="email" value={form.contactEmail} onChange={(contactEmail) => setForm((current) => ({ ...current, contactEmail }))} />
            <TextInput label="LinkedIn URL" maxLength={2048} type="url" value={form.contactLinkedIn} onChange={(contactLinkedIn) => setForm((current) => ({ ...current, contactLinkedIn }))} />
            <TextInput label="Applied date" icon={CalendarDays} type="date" value={form.appliedAt} onChange={(appliedAt) => setForm((current) => ({ ...current, appliedAt }))} />
            <TextInput label="Follow-up date" icon={CalendarDays} type="date" value={form.followUpAt} onChange={(followUpAt) => setForm((current) => ({ ...current, followUpAt }))} />
            <TextInput label="Last contacted" icon={CalendarDays} type="date" value={form.lastContactedAt} onChange={(lastContactedAt) => setForm((current) => ({ ...current, lastContactedAt }))} />
          </div>

          <TextArea label="Personal notes" maxLength={10000} value={form.notes} onChange={(notes) => setForm((current) => ({ ...current, notes }))} />
          <TextArea label="Interview notes" maxLength={10000} value={form.interviewNotes} onChange={(interviewNotes) => setForm((current) => ({ ...current, interviewNotes }))} />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p
              aria-live="polite"
              className={`text-sm ${saveFailed ? "text-destructive" : "text-muted-foreground"}`}
              role={saveFailed ? "alert" : "status"}
            >
              {message ?? (isSaving ? "Saving outreach details..." : "Track contacts, applications, and next follow-up steps for this role.")}
            </p>
            <Button className="gap-2" disabled={isSaving || !hasUnsavedChanges} type="submit">
              <Save aria-hidden="true" className="size-4" />
              {isSaving ? "Saving..." : hasUnsavedChanges ? "Save outreach" : "Saved"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  maxLength,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  maxLength?: number;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const id = `outreach-${label.toLowerCase().replaceAll(" ", "-")}`;

  return (
    <div className="grid gap-1.5 text-sm font-medium">
      <label htmlFor={id}>{label}</label>
      <div className="relative">
        {Icon ? <Icon aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /> : null}
        <Input id={id} className={Icon ? "pl-9" : undefined} type={type} autoComplete={autoComplete} maxLength={maxLength} value={value} onChange={(event) => onChange(event.target.value)} />
      </div>
    </div>
  );
}

function TextArea({ label, value, onChange, maxLength }: { label: string; value: string; onChange: (value: string) => void; maxLength: number }) {
  const id = `outreach-${label.toLowerCase().replaceAll(" ", "-")}`;

  return (
    <div className="grid gap-1.5 text-sm font-medium">
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        maxLength={maxLength}
        className="min-h-28 rounded-xl border border-input/80 bg-card/80 px-3 py-2 text-sm text-foreground shadow-xs outline-none transition-colors placeholder:text-muted-foreground/80 focus-visible:border-primary/70 focus-visible:ring-3 focus-visible:ring-primary/20"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function toFormState(job: Job): OutreachFormState {
  return {
    outreachStatus: job.outreachStatus,
    notes: job.notes ?? "",
    contactName: job.contactName ?? "",
    contactEmail: job.contactEmail ?? "",
    contactLinkedIn: job.contactLinkedIn ?? "",
    appliedAt: toDateInputValue(job.appliedAt),
    followUpAt: toDateInputValue(job.followUpAt),
    lastContactedAt: toDateInputValue(job.lastContactedAt),
    interviewNotes: job.interviewNotes ?? "",
  };
}

function toPayload(form: OutreachFormState): JobOutreachUpdate {
  return {
    outreachStatus: form.outreachStatus,
    notes: emptyToNull(form.notes),
    contactName: emptyToNull(form.contactName),
    contactEmail: emptyToNull(form.contactEmail),
    contactLinkedIn: emptyToNull(form.contactLinkedIn),
    appliedAt: emptyToNull(form.appliedAt),
    followUpAt: emptyToNull(form.followUpAt),
    lastContactedAt: emptyToNull(form.lastContactedAt),
    interviewNotes: emptyToNull(form.interviewNotes),
  };
}

function emptyToNull(value: string): string | null {
  return value.trim() || null;
}

function toDateInputValue(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}
