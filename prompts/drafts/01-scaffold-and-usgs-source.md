# Prompt draft 01: scaffold and the USGS source

Scoped to step 3 of the plan. Deliberately excludes the rule engine, deduplication, and any
channel work: those are steps 4 and 5, and mixing them in would make it impossible to tell
which part of a large diff to distrust.

---

## Prompt

> Read `docs/00-plan.md`, `docs/02-architecture.md`, and `docs/03-decision-log.md` before
> writing anything. They define the model you are implementing. Do not edit them.
>
> Build the project skeleton and exactly one working event source. Nothing else.
>
> **1. Scaffold.** A single Next.js application, TypeScript with `strict: true`, Prisma with
> SQLite on disk. One process. No separate backend.
>
> **2. Schema.** Prisma models for the six tables in `docs/02-architecture.md` section 8:
> `users`, `events`, `alert_rules`, `rule_matches`, `channel_configs`, `delivery_attempts`.
> Field shapes follow the types in sections 2 and 4 of that document. `events` has a unique
> constraint on `(source, sourceEventId)`. `channel_configs` stores a destination and the
> *name* of an environment variable holding the secret, never a secret value. Create the
> schema only. Do not write ingestion, matching, or delivery logic.
>
> **3. Source definition type.** Implement `EventSourceDefinition` and `AttributeDefinition`
> exactly as specified in `docs/02-architecture.md` section 3, then write the USGS
> definition. Declare only attributes the feed actually provides.
>
> **4. Normalizer.** A function taking one raw USGS GeoJSON feature and returning a
> `CanonicalEvent` per section 2. Requirements:
> - Every field you read must exist in the USGS GeoJSON summary format. For each one, tell me
    >   where in the USGS documentation it is defined, with the URL. Verify against USGS's own
    >   documentation only. Do not rely on memory, on generated examples, or on third-party
    >   descriptions of the feed. If you are unsure a field exists, say so rather than guessing a
    >   name.
> - Nullable fields are common in this feed. Handle them as absent values, not errors.
> - `status` in the feed can indicate a withdrawn record. Map it to the envelope's
    >   `'active' | 'withdrawn'` and tell me exactly which source values you mapped to which.
> - Do not invent a `magnitude` for sources that have none. This normalizer is USGS only.
>
> **5. Fixture.** Fetch the live feed once, save a real unmodified response under
> `src/sources/usgs/__fixtures__/`, and note the date fetched. Tests use this, not a
> hand-written payload.
>
> **6. Guard test.** The test described in DL-03: normalize every feature in the saved
> fixture, then assert that each attribute key declared in the USGS `EventSourceDefinition`
> appears in **at least one** normalized event. Not in every event: nullable fields are
> common in this feed, so requiring a key in every event would fail on correct output.
> Presence follows the `AttributeValue` type in `docs/02-architecture.md` section 2, which
> does not admit `undefined`, so an attribute with no value is an absent key rather than a
> key set to `undefined`. Do not introduce a different convention. This test must fail if the
> definition and the normalizer disagree on a key name.
>
> **7. Script.** A command that fetches the feed, normalizes it, and prints the first five
> canonical events. Nothing is written to the database yet.
>
> Do not build: the ingestion loop, deduplication, revision handling, the rule engine,
> channel adapters, the dispatcher, or any UI. Those are later steps and I will ask for them
> separately.
>
> Use only Next.js, TypeScript, and Prisma. A test runner has not been chosen yet: propose
> one, say why, and wait. Do not install anything else without asking first.
>
> End with the three sections from `CLAUDE.md`: assumptions, uncertainties, and anything you
> noticed but left alone.

---

## What I am checking in the response

| Check | Prediction |
|---|---|
| Every USGS field cited to the documentation, and the citations are real | P7 |
| No dependency added without asking, and any proposed one actually exists | P8 |
| The guard test would fail if I renamed a key in the definition | P6, P9 |
| Nullable fields produce absent attributes rather than throwing or defaulting to zero | P10 |
| No secret-shaped column in `channel_configs` | P4 |
| Nothing from steps 4 and 5 built early | P11 |

The guard test gets an active check, not a read: rename a key in the definition and confirm
the test goes red. A test that passes in both states is worse than no test.