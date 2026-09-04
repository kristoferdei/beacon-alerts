import { test } from "node:test";
import assert from "node:assert/strict";

import { decideAlertability } from "./alertability.ts";

test("no prior record and the rule matches: alert", () => {
  const result = decideAlertability("active", true, null);
  assert.equal(result, "alert-new-match");
});

test("no prior record and the rule does not match: nothing", () => {
  const result = decideAlertability("active", false, null);
  assert.equal(result, "no-op");
});

test("prior record matched, still matches: no second alert", () => {
  const result = decideAlertability("active", true, { matched: true });
  assert.equal(result, "already-alerted");
});

test("prior record matched, revision no longer matches: record updated, no alert, no retraction", () => {
  const result = decideAlertability("active", false, { matched: true });
  assert.equal(result, "record-no-alert");
});

test("prior record did not match, revision now matches: alert", () => {
  // DL-07's own case: a quake first published at magnitude 5.9 (rule at 6.0
  // did not match), revised to 6.1 (now matches).
  const result = decideAlertability("active", true, { matched: false });
  assert.equal(result, "alert-revision-match");
});

test("withdrawn event: marked withdrawn, no alert, still visible", () => {
  // Withdrawal wins regardless of what matching would otherwise say.
  const result = decideAlertability("withdrawn", true, { matched: false });
  assert.equal(result, "withdraw");
});
