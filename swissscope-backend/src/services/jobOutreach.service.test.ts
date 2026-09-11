import assert from "node:assert/strict";
import { it } from "node:test";
import { parseJobOutreachUpdate, parseOutreachStatus } from "./jobOutreach.service.js";

it("parses outreach status case-insensitively", () => {
  assert.equal(parseOutreachStatus("contacted"), "CONTACTED");
  assert.equal(parseOutreachStatus("FOLLOWED_UP"), "FOLLOWED_UP");
});

it("normalizes empty outreach strings and dates to null", () => {
  const result = parseJobOutreachUpdate({
    outreachStatus: "responded",
    notes: "  ",
    contactName: " Ada Recruiter ",
    appliedAt: "",
    followUpAt: "2026-09-12",
  });

  assert.equal(result instanceof Error, false);
  if (result instanceof Error) return;

  assert.equal(result.outreachStatus, "RESPONDED");
  assert.equal(result.notes, null);
  assert.equal(result.contactName, "Ada Recruiter");
  assert.equal(result.appliedAt, null);
  assert.equal(result.followUpAt?.toISOString(), "2026-09-12T00:00:00.000Z");
});

it("rejects empty outreach updates", () => {
  assert.ok(parseJobOutreachUpdate({}) instanceof Error);
  assert.ok(parseJobOutreachUpdate({ outreachStatus: "maybe" }) instanceof Error);
});
