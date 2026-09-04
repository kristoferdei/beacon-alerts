# Prompt draft 03: envelope migration and identity resolution

Step 4 of the plan, second half, first of three. Implementation only for identity. Matching
and alertability follow as separate prompts.

Split this way because a single diff covering all three would be too large to read
completely, and reading it completely is the point. The first section is not identity logic
at all: it closes the gap between the model the tests exercise and the model the pipeline
actually produces. Without it the suite can go green while DL-11 remains dead code.

---

## Prompt

> Read `docs/03-decision-log.md` entry DL-11 before starting. Note that it supersedes the
> deduplication key in DL-07 and the `sourceEventId` field shown in `docs/02-architecture.md`
> sections 2 and 8. Where they disagree, DL-11 wins. Do not edit any document.
>
> **1. Migrate the envelope first.** Right now `CanonicalEvent` carries
> `sourceEventId: string` while the identity tests work with alias arrays, so the two models
> are disconnected and the tests could pass against something the real pipeline never
> produces.
>
> - Replace `sourceEventId: string` with `sourceEventIds: string[]` on `CanonicalEvent`, with
    >   the source's preferred identifier first.
> - Update the USGS normalizer to populate it from the `ids` field, splitting on commas and
    >   discarding the empty leading and trailing segments the format produces. The preferred
    >   `id` goes first, and must be present in the array even if `ids` does not contain it.
> - A source returning one identifier produces a one-element array through the same code
    >   path. No special case, no optional field.
>
> **2. Prove the migration against real data.** Add an assertion to the USGS test file: over
> the saved fixture, at least one normalized event has more than one entry in
> `sourceEventIds`. If every array in a 328-feature real-world sample is length one, the
> `ids` field is not being read and I want the suite to say so rather than the code to look
> plausible. If that assertion cannot be satisfied by the fixture, stop and tell me. Do not
> weaken it to make it pass, and do not hand-edit the fixture.
>
> **3. Add the `event_aliases` table** to the Prisma schema per DL-11: one row per
> `(source, alias)`, unique on that pair, pointing at an event. Drop the now-incorrect unique
> constraint on `(source, sourceEventId)`, which DL-11 replaces.
>
> **4. Implement `resolveEventIdentity`** so the tests in `src/ingestion/identity.test.ts`
> pass. Requirements:
> - Identity is set intersection. Two observations are the same event when their alias sets
    >   share at least one member. Not subset, not equality: the sets can overlap while each
    >   holds an id the other does not.
> - The merge branch behaves as DL-11 describes: earliest-ingested wins, the other is marked
    >   merged, no alert is produced.
> - Do not change any test to make the implementation pass. If a test looks wrong, stop and
    >   tell me.
>
> Do not implement `decideAlertability` or `evaluate`. They stay throwing. Do not build the
> polling loop, the dispatcher, or any UI.
>
> When done, run the full suite and show me the output.
>
> End with the three sections from `CLAUDE.md`.

---

## What I am checking in the response

| Check | Prediction |
|---|---|
| The multi-alias assertion over the real fixture passes, and was not weakened | P1, DL-11 |
| Identity uses intersection, verified against the partial-overlap case from C8 | P1 |
| The old `(source, sourceEventId)` unique constraint is gone, not left alongside | P1 |
| No test was edited to accommodate the implementation | P9 |
| `decideAlertability` and `evaluate` still throw | P11 |
| No fixture hand-editing | P7 |

Active check after this lands: delete the intersection condition and replace it with an
equality check on the first element. The partial-overlap test must go red. If it stays green,
that test is not reaching the branch it claims to cover.