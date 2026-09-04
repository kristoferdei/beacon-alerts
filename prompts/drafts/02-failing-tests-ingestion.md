# Prompt draft 02: failing tests for ingestion identity and alertability

Step 4 of the plan, first half. Tests only, no implementation.

Written this way on purpose. This is the part of the system most likely to be quietly wrong:
deduplication, revision handling, and the alias logic from DL-11 all fail without raising an
error and without looking wrong in a demo. If the implementation is written first, the tests
that follow will be shaped to fit it, and the two cases I am most worried about (P1, P2) are
exactly the ones that would be shaped away.

The git history will show a commit of failing tests preceding the implementation. That
ordering is itself part of the submission.

---

## Prompt

> Write tests only. No implementation. Every test in this step must fail when you are done,
> and must fail for the right reason: a missing implementation, not a syntax error or a
> missing import.
>
> Read `docs/02-architecture.md` sections 2 and 5, and `docs/03-decision-log.md` entries
> DL-07 and DL-11, before writing anything. **DL-11 supersedes the deduplication key
> described in DL-07 and in section 8 of the architecture document.** Event identity is a set
> of aliases, not a single id. Where the two disagree, DL-11 wins.
>
> Define the function signatures the tests call, with bodies that throw `not implemented`.
> Do not write working logic in this step. Do not touch the Prisma schema, the normalizer, or
> anything under `src/sources/`.
>
> **Group 1: identity (DL-11).**
> - Two observations sharing no alias are two events.
> - Two observations sharing at least one alias are one event, even when their preferred ids
    >   differ. This is the case USGS actually produces when the preferred network changes.
> - An observation whose alias set is a superset of a stored event's is the same event, and
    >   the new aliases are recorded.
> - An observation whose aliases match two separate stored events is a merge: the
    >   earliest-ingested wins, the other is marked merged, and no alert is produced.
> - A source returning one identifier works through the same path with no special case.
>
> **Group 2: alertability (DL-07 section 5 transition table).** One test per row, named after
> the row. All five:
> - No prior record and the rule matches: alert.
> - No prior record and the rule does not match: nothing.
> - Prior record matched, still matches: no second alert.
> - Prior record matched, revision no longer matches: record updated, no alert, no retraction.
> - Prior record did not match, revision now matches: alert. Use the case from DL-07: a quake
    >   published at magnitude 5.9, revised to 6.1, against a rule set at 6.0.
> - Withdrawn event: marked withdrawn, no alert, still visible.
>
> **Group 3: evaluation edge cases.**
> - A rule referencing an attribute the event does not carry is a non-match, not an error.
    >   Test this with a news-shaped event against a magnitude rule.
> - A rule whose attribute is present but of the wrong type is a non-match, not an error.
>
> Constraints:
> - No mocking of the unit under test. These tests must be capable of failing once an
    >   implementation exists and is wrong.
> - Use fixtures or hand-built canonical events as input, not live network calls. This is the
    >   one place hand-built input is correct, because these cases (merge, revision across a
    >   threshold) cannot be produced on demand from a live feed.
> - Name each test after the behaviour it pins, not after the function it calls.
> - Add an `npm test` script that runs the whole suite. There isn't one, and it is the first
    >   thing anyone will try.
>
> When done, run the suite and show me the output. I expect every new test to fail. Tell me
> if any passes, because a test that passes before the implementation exists is testing
> nothing.
>
> End with the three sections from `CLAUDE.md`.

---

## What I am checking in the response

| Check | Prediction |
|---|---|
| Every new test actually fails, and for the right reason | P9 |
| No test asserts on its own mock | P9 |
| The five transition rows are all present and distinguishable, not collapsed into two | P2 |
| The merge case exists rather than being quietly skipped as hard | P1 |
| Alias intersection is used, not preferred-id equality | P1, DL-11 |
| Missing and wrong-typed attributes are non-matches, not throws | P10 |
| Nothing implemented, schema untouched | P11 |

Active check: after the implementation lands in the next step, delete one branch of the
transition logic and confirm exactly one test goes red. If two go red, the tests are coupled.
If none do, the row is not covered.