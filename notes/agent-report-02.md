# Agent report 02 — failing tests for ingestion identity and alertability

Written after: `src/ingestion/identity.ts`, `src/ingestion/alertability.ts`,
`src/ingestion/matching.ts` (all throwing `not implemented`), and their test files. Prisma
schema, the normalizer, and everything under `src/sources/` were not touched.

## Test run output

`npm test` (`node --test`), run from a clean state, exit code 1:

```
> beacon-alerts@0.1.0 test
> node --test

✖ no prior record and the rule matches: alert (0.469125ms)
✖ no prior record and the rule does not match: nothing (0.064333ms)
✖ prior record matched, still matches: no second alert (0.050834ms)
✖ prior record matched, revision no longer matches: record updated, no alert, no retraction (0.048416ms)
✖ prior record did not match, revision now matches: alert (0.056ms)
✖ withdrawn event: marked withdrawn, no alert, still visible (0.048584ms)
✖ two observations sharing no alias are two events (0.704042ms)
✖ two observations sharing at least one alias are one event, even when their preferred ids differ (0.07825ms)
✖ an observation whose alias set is a superset of a stored event's is the same event, and the new aliases are recorded (0.060875ms)
✖ an observation whose aliases match two separate stored events is a merge: the earliest-ingested wins, the other is marked merged, and no alert is produced (0.058958ms)
✖ a source returning one identifier works through the same path with no special case (0.054208ms)
✖ a rule referencing an attribute the event does not carry is a non-match, not an error (0.427583ms)
✖ a rule whose attribute is present but of the wrong type is a non-match, not an error (0.072875ms)
✔ every attribute declared in usgsSourceDefinition appears in at least one normalized event (3.54925ms)
ℹ tests 14
ℹ suites 0
ℹ pass 1
ℹ fail 13
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 144.947959

✖ failing tests:

test at src/ingestion/alertability.test.ts:6:1
✖ no prior record and the rule matches: alert (0.469125ms)
  Error: not implemented
      at decideAlertability (file:///Users/kristoferdei/Documents/Git/beacon-alerts/src/ingestion/alertability.ts:26:9)
      at TestContext.<anonymous> (file:///Users/kristoferdei/Documents/Git/beacon-alerts/src/ingestion/alertability.test.ts:7:18)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1397:25)
      at Test.start (node:internal/test_runner/test:1257:17)
      at startSubtestAfterBootstrap (node:internal/test_runner/harness:387:17)

test at src/ingestion/alertability.test.ts:11:1
✖ no prior record and the rule does not match: nothing (0.064333ms)
  Error: not implemented
      at decideAlertability (file:///Users/kristoferdei/Documents/Git/beacon-alerts/src/ingestion/alertability.ts:26:9)
      at TestContext.<anonymous> (file:///Users/kristoferdei/Documents/Git/beacon-alerts/src/ingestion/alertability.test.ts:12:18)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1397:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:969:18)
      at Test.postRun (node:internal/test_runner/test:1537:19)
      at Test.run (node:internal/test_runner/test:1462:12)
      at async startSubtestAfterBootstrap (node:internal/test_runner/harness:387:3)

test at src/ingestion/alertability.test.ts:16:1
✖ prior record matched, still matches: no second alert (0.050834ms)
  Error: not implemented
      at decideAlertability (file:///Users/kristoferdei/Documents/Git/beacon-alerts/src/ingestion/alertability.ts:26:9)
      at TestContext.<anonymous> (file:///Users/kristoferdei/Documents/Git/beacon-alerts/src/ingestion/alertability.test.ts:17:18)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1397:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:969:18)
      at Test.postRun (node:internal/test_runner/test:1537:19)
      at Test.run (node:internal/test_runner/test:1462:12)
      at async Test.processPendingSubtests (node:internal/test_runner/test:969:7)

test at src/ingestion/alertability.test.ts:21:1
✖ prior record matched, revision no longer matches: record updated, no alert, no retraction (0.048416ms)
  Error: not implemented
      at decideAlertability (file:///Users/kristoferdei/Documents/Git/beacon-alerts/src/ingestion/alertability.ts:26:9)
      at TestContext.<anonymous> (file:///Users/kristoferdei/Documents/Git/beacon-alerts/src/ingestion/alertability.test.ts:22:18)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1397:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:969:18)
      at Test.postRun (node:internal/test_runner/test:1537:19)
      at Test.run (node:internal/test_runner/test:1462:12)
      at async Test.processPendingSubtests (node:internal/test_runner/test:969:7)

test at src/ingestion/alertability.test.ts:26:1
✖ prior record did not match, revision now matches: alert (0.056ms)
  Error: not implemented
      at decideAlertability (file:///Users/kristoferdei/Documents/Git/beacon-alerts/src/ingestion/alertability.ts:26:9)
      at TestContext.<anonymous> (file:///Users/kristoferdei/Documents/Git/beacon-alerts/src/ingestion/alertability.test.ts:29:18)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1397:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:969:18)
      at Test.postRun (node:internal/test_runner/test:1537:19)
      at Test.run (node:internal/test_runner/test:1462:12)
      at async Test.processPendingSubtests (node:internal/test_runner/test:969:7)

test at src/ingestion/alertability.test.ts:33:1
✖ withdrawn event: marked withdrawn, no alert, still visible (0.048584ms)
  Error: not implemented
      at decideAlertability (file:///Users/kristoferdei/Documents/Git/beacon-alerts/src/ingestion/alertability.ts:26:9)
      at TestContext.<anonymous> (file:///Users/kristoferdei/Documents/Git/beacon-alerts/src/ingestion/alertability.test.ts:35:18)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1397:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:969:18)
      at Test.postRun (node:internal/test_runner/test:1537:19)
      at Test.run (node:internal/test_runner/test:1462:12)
      at async Test.processPendingSubtests (node:internal/test_runner/test:969:7)

test at src/ingestion/identity.test.ts:6:1
✖ two observations sharing no alias are two events (0.704042ms)
  Error: not implemented
      at resolveEventIdentity (file:///Users/kristoferdei/Documents/Git/beacon-alerts/src/ingestion/identity.ts:35:9)
      at TestContext.<anonymous> (file:///Users/kristoferdei/Documents/Git/beacon-alerts/src/ingestion/identity.test.ts:7:17)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1397:25)
      at Test.start (node:internal/test_runner/test:1257:17)
      at startSubtestAfterBootstrap (node:internal/test_runner/harness:387:17)

test at src/ingestion/identity.test.ts:19:1
✖ two observations sharing at least one alias are one event, even when their preferred ids differ (0.07825ms)
  Error: not implemented
      at resolveEventIdentity (file:///Users/kristoferdei/Documents/Git/beacon-alerts/src/ingestion/identity.ts:35:9)
      at TestContext.<anonymous> (file:///Users/kristoferdei/Documents/Git/beacon-alerts/src/ingestion/identity.test.ts:29:18)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1397:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:969:18)
      at Test.postRun (node:internal/test_runner/test:1537:19)
      at Test.run (node:internal/test_runner/test:1462:12)
      at async startSubtestAfterBootstrap (node:internal/test_runner/harness:387:3)

test at src/ingestion/identity.test.ts:38:1
✖ an observation whose alias set is a superset of a stored event's is the same event, and the new aliases are recorded (0.060875ms)
  Error: not implemented
      at resolveEventIdentity (file:///Users/kristoferdei/Documents/Git/beacon-alerts/src/ingestion/identity.ts:35:9)
      at TestContext.<anonymous> (file:///Users/kristoferdei/Documents/Git/beacon-alerts/src/ingestion/identity.test.ts:45:18)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1397:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:969:18)
      at Test.postRun (node:internal/test_runner/test:1537:19)
      at Test.run (node:internal/test_runner/test:1462:12)
      at async Test.processPendingSubtests (node:internal/test_runner/test:969:7)

test at src/ingestion/identity.test.ts:57:1
✖ an observation whose aliases match two separate stored events is a merge: the earliest-ingested wins, the other is marked merged, and no alert is produced (0.058958ms)
  Error: not implemented
      at resolveEventIdentity (file:///Users/kristoferdei/Documents/Git/beacon-alerts/src/ingestion/identity.ts:35:9)
      at TestContext.<anonymous> (file:///Users/kristoferdei/Documents/Git/beacon-alerts/src/ingestion/identity.test.ts:71:18)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1397:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:969:18)
      at Test.postRun (node:internal/test_runner/test:1537:19)
      at Test.run (node:internal/test_runner/test:1462:12)
      at async Test.processPendingSubtests (node:internal/test_runner/test:969:7)

test at src/ingestion/identity.test.ts:83:1
✖ a source returning one identifier works through the same path with no special case (0.054208ms)
  Error: not implemented
      at resolveEventIdentity (file:///Users/kristoferdei/Documents/Git/beacon-alerts/src/ingestion/identity.ts:35:9)
      at TestContext.<anonymous> (file:///Users/kristoferdei/Documents/Git/beacon-alerts/src/ingestion/identity.test.ts:90:18)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1397:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:969:18)
      at Test.postRun (node:internal/test_runner/test:1537:19)
      at Test.run (node:internal/test_runner/test:1462:12)
      at async Test.processPendingSubtests (node:internal/test_runner/test:969:7)

test at src/ingestion/matching.test.ts:6:1
✖ a rule referencing an attribute the event does not carry is a non-match, not an error (0.427583ms)
  Error: not implemented
      at evaluate (file:///Users/kristoferdei/Documents/Git/beacon-alerts/src/ingestion/matching.ts:19:9)
      at TestContext.<anonymous> (file:///Users/kristoferdei/Documents/Git/beacon-alerts/src/ingestion/matching.test.ts:11:18)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1397:25)
      at Test.start (node:internal/test_runner/test:1257:17)
      at startSubtestAfterBootstrap (node:internal/test_runner/harness:387:17)

test at src/ingestion/matching.test.ts:16:1
✖ a rule whose attribute is present but of the wrong type is a non-match, not an error (0.072875ms)
  Error: not implemented
      at evaluate (file:///Users/kristoferdei/Documents/Git/beacon-alerts/src/ingestion/matching.ts:19:9)
      at TestContext.<anonymous> (file:///Users/kristoferdei/Documents/Git/beacon-alerts/src/ingestion/matching.test.ts:19:18)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1397:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:969:18)
      at Test.postRun (node:internal/test_runner/test:1537:19)
      at Test.run (node:internal/test_runner/test:1462:12)
      at async startSubtestAfterBootstrap (node:internal/test_runner/harness:387:3)
```

**Summary**: 14 tests total, 1 pass, 13 fail.

- **1 test passed**: `every attribute declared in usgsSourceDefinition appears in at least one
  normalized event` — this is the pre-existing USGS guard test from a prior step, unaffected
  because `src/sources/` was not touched this step. It passes because the implementation it
  covers already exists.
- **All 13 new tests fail**, and each one fails with `Error: not implemented` thrown from
  inside the stub function it calls (`decideAlertability`, `resolveEventIdentity`, or
  `evaluate`) — not a syntax error, not a missing import, not an assertion mismatch that
  happens to also be wrong for the wrong reason. No new test passed.

## Assumptions

- DL-11 says the canonical envelope should carry `sourceEventIds: string[]`, but the prompt
  forbids touching the normalizer or anything under `src/sources/`, and
  `docs/02-architecture.md` section 2 still shows the old single `sourceEventId`. `CanonicalEvent`
  was not changed at all — the new alias types (`Observation`, `StoredEvent`) live entirely in
  `src/ingestion/identity.ts`, decoupled from the canonical envelope, since migrating the
  envelope is implementation work for a later step.
- `AlertabilityAction` is a 6-value discriminated result (one string per DL-07 row) rather
  than a richer object, so each test can assert a single equality and the later "delete one
  branch, exactly one test goes red" check has a clean target.
- `decideAlertability`'s "no prior record, no match" row returns `"no-op"`, distinct from
  `"already-alerted"` (prior record, still matches) — the table describes the first as
  "Nothing" (no row ever created) and the second as an existing row not being touched; these
  were kept as different actions since they're different operations on storage, even though
  neither alerts.
- The DL-07 table in section 5 has 6 rows; the prompt's prose says "All five" while listing 6
  bullets (the withdrawn case on top of 5 match-state rows). All 6 were implemented as 6
  separate tests rather than forcing a 5-way split.

## Uncertain

- Whether `decideAlertability` should take a `currentlyMatches: boolean` precomputed by the
  caller (what was done) or compute matching internally via `evaluate()`/`matches()` itself.
  They were split because section 5 itself frames matching and alerting as separate
  questions, and Group 3's tests target `evaluate()` in isolation — but this is a real
  interface decision for the implementation step, not settled by anything in the docs.
- The exact shape of a "stored event" as identity resolution will see it in production (it's
  currently a plain in-memory `StoredEvent[]` array in the test, standing in for whatever the
  real lookup against `events` + a future `event_aliases` table returns).

## Not done

- No implementation of `resolveEventIdentity`, `decideAlertability`, or `evaluate` — all three
  still throw, as instructed.
- No `event_aliases` table — DL-11 describes one, but the Prisma schema was explicitly
  off-limits this step.
- Did not touch `prompts/prompt-log.md`'s new entry (visible in `git status` but written by
  the user, not this agent).
