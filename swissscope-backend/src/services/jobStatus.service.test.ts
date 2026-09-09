import assert from "node:assert/strict";
import { it } from "node:test";
import { parseJobStatus } from "./jobStatus.service.js";

it("parses valid job status values case-insensitively", () => {
  assert.equal(parseJobStatus("applied"), "APPLIED");
  assert.equal(parseJobStatus("SHORTLISTED"), "SHORTLISTED");
});

it("rejects unknown job status values", () => {
  assert.ok(parseJobStatus("maybe") instanceof Error);
  assert.ok(parseJobStatus(undefined) instanceof Error);
});
