# Agent report 03 — envelope migration and identity resolution

Written after: `CanonicalEvent.sourceEventIds` migration, USGS normalizer update, the new
multi-alias fixture assertion, the `event_aliases` table, and `resolveEventIdentity`.

## Direct answers

**How many normalized events in the fixture have more than one entry in `sourceEventIds`?**
**39 of 328.** Computed directly by running `normalizeUsgsFeature` over every feature in
`src/sources/usgs/__fixtures__/all_day-2026-09-04.geojson` and counting
`sourceEventIds.length > 1`, not inferred from the raw `ids` field — this is the exact number
the new guard-test assertion (`at least one normalized event has more than one sourceEventIds
entry`) is backed by.

**Did I change any existing test file?**
**Yes, one: `src/sources/usgs/normalizer.test.ts`.** I added a new test to it (the
multi-alias-over-the-real-fixture assertion) — I did not modify or remove its existing test.
This was explicitly directed by the step 2 instruction ("Add an assertion to the USGS test
file"), which superseded the prior step's "do not touch anything under `src/sources/`"
constraint for this step only.

**No other test file was changed.** `src/ingestion/identity.test.ts`,
`src/ingestion/alertability.test.ts`, and `src/ingestion/matching.test.ts` are byte-for-byte
what they were before this step — the prompt's instruction not to edit a test to make an
implementation pass was followed by leaving all three untouched; `identity.test.ts` was made
to pass by writing `resolveEventIdentity` to satisfy it, not the reverse.

## Test run output

`npm test` (`node --test`), run from a clean state, exit code 1:

```
> beacon-alerts@0.1.0 test
> node --test

✖ no prior record and the rule matches: alert (0.612333ms)
✖ no prior record and the rule does not match: nothing (0.12425ms)
✖ prior record matched, still matches: no second alert (0.158792ms)
✖ prior record matched, revision no longer matches: record updated, no alert, no retraction (0.234916ms)
✖ prior record did not match, revision now matches: alert (0.167041ms)
✖ withdrawn event: marked withdrawn, no alert, still visible (0.131667ms)
✔ two observations sharing no alias are two events (2.292375ms)
✔ alias order does not matter (0.114458ms)
✔ a stored event's aliases and an observation's aliases can partially overlap, sharing one alias while neither contains the other, and are still the same event (0.080875ms)
✔ an observation whose alias set is a superset of a stored event's is the same event, and the new aliases are recorded (0.070792ms)
✔ an observation whose aliases match two separate stored events is a merge: the earliest-ingested wins, the other is marked merged, and no alert is produced (8.564625ms)
✔ a source returning one identifier works through the same path with no special case (0.11425ms)
✖ a rule referencing an attribute the event does not carry is a non-match, not an error (0.597833ms)
✖ a rule whose attribute is present but of the wrong type is a non-match, not an error (0.170875ms)
✔ every attribute declared in usgsSourceDefinition appears in at least one normalized event (2.467875ms)
✔ at least one normalized event has more than one sourceEventIds entry, over the real fixture (0.839917ms)
ℹ tests 16
ℹ suites 0
ℹ pass 8
ℹ fail 8
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 140.188791

✖ failing tests:

test at src/ingestion/alertability.test.ts:6:1
✖ no prior record and the rule matches: alert (0.612333ms)
  Error: not implemented
      at decideAlertability (file:///Users/kristoferdei/Documents/Git/beacon-alerts/src/ingestion/alertability.ts:26:9)
      at TestContext.<anonymous> (file:///Users/kristoferdei/Documents/Git/beacon-alerts/src/ingestion/alertability.test.ts:7:18)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1397:25)
      at Test.start (node:internal/test_runner/test:1257:17)
      at startSubtestAfterBootstrap (node:internal/test_runner/harness:387:17)

test at src/ingestion/alertability.test.ts:11:1
✖ no prior record and the rule does not match: nothing (0.12425ms)
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
✖ prior record matched, still matches: no second alert (0.158792ms)
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
✖ prior record matched, revision no longer matches: record updated, no alert, no retraction (0.234916ms)
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
✖ prior record did not match, revision now matches: alert (0.167041ms)
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
✖ withdrawn event: marked withdrawn, no alert, still visible (0.131667ms)
  Error: not implemented
      at decideAlertability (file:///Users/kristoferdei/Documents/Git/beacon-alerts/src/ingestion/alertability.ts:26:9)
      at TestContext.<anonymous> (file:///Users/kristoferdei/Documents/Git/beacon-alerts/src/ingestion/alertability.test.ts:35:18)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1397:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:969:18)
      at Test.postRun (node:internal/test_runner/test:1537:19)
      at Test.run (node:internal/test_runner/test:1462:12)
      at async Test.processPendingSubtests (node:internal/test_runner/test:969:7)

test at src/ingestion/matching.test.ts:6:1
✖ a rule referencing an attribute the event does not carry is a non-match, not an error (0.597833ms)
  Error: not implemented
      at evaluate (file:///Users/kristoferdei/Documents/Git/beacon-alerts/src/ingestion/matching.ts:19:9)
      at TestContext.<anonymous> (file:///Users/kristoferdei/Documents/Git/beacon-alerts/src/ingestion/matching.test.ts:11:18)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1397:25)
      at Test.start (node:internal/test_runner/test:1257:17)
      at startSubtestAfterBootstrap (node:internal/test_runner/harness:387:17)

test at src/ingestion/matching.test.ts:16:1
✖ a rule whose attribute is present but of the wrong type is a non-match, not an error (0.170875ms)
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

**Summary**: 16 tests, 8 pass, 8 fail.

- **Pass (8)**: all 6 `identity.test.ts` tests (now implemented), both `normalizer.test.ts`
  tests (the pre-existing guard test plus the new multi-alias assertion).
- **Fail (8)**: all 6 `alertability.test.ts` tests and both `matching.test.ts` tests, every
  one still throwing `Error: not implemented` from `decideAlertability`/`evaluate` — unchanged
  from the prior step, since those two functions were explicitly left as stubs.

## Assumptions

- Kept `Event.sourceEventId` as a plain `String` column on the Prisma model, dropping only its
  unique constraint. The instruction said to drop "the now-incorrect unique constraint," not
  to remove the column, so this was read literally: the column now serves as a denormalized
  "preferred id at ingestion" for display, while `EventAlias` owns identity. Added a comment
  on the field explaining this, since a non-unique, non-obviously-named `sourceEventId` sitting
  next to an alias table would otherwise look like leftover debt.
- `IdentityResolution`'s `merge` variant only names one `mergedEventId`. When more than two
  stored events match a single observation, the implementation merges the earliest-ingested
  with the first other match and is silent about any additional matches. No test exercises
  three-way collisions, so nothing was invented beyond what the type already expressed.

## Uncertain

- Whether a three-or-more-way alias collision is expected to happen in practice, and if so,
  whether `IdentityResolution` needs a `mergedEventIds: string[]` instead of a single field.
  Nothing in DL-11 or the tests addresses this.
- Whether `Event.sourceEventId`'s new role (display-only, no longer identity) should
  eventually be documented in `docs/02-architecture.md` itself — not touched, since docs are
  off-limits, but the doc's section 2/8 code blocks still show the pre-DL-11 shape.

## Not done

- `decideAlertability` and `evaluate` still throw — not touched, as instructed.
- No polling loop, dispatcher, or UI.
- Did not resolve the `merge`-with-more-than-two-matches gap noted above — flagged rather
  than guessed at.
