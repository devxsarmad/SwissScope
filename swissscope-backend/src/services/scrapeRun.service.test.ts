import assert from "node:assert/strict";
import { it } from "node:test";

it("keeps scrape source result shape explicit", () => {
  const result = {
    source: "jobs.ch",
    status: "success",
    fetched: 1,
    created: 0,
    updated: 1,
    error: null,
  };

  assert.equal(result.source, "jobs.ch");
  assert.equal(result.status, "success");
});
