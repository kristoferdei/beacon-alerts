# Prompt Log

Every prompt used during the build, in order. Kept live rather than reconstructed
afterwards, because a reconstructed prompt history is a summary of what I wish I had asked.

The prompt text alone is the least useful part of an entry. What matters is why I asked for
it in that shape, and what happened to the output. The outcome field is therefore mandatory
and is one of: **accepted**, **accepted with edits**, **rejected**, or **re-prompted**.

Where an output was rejected or corrected, the entry links to the corresponding catch in
`04-ai-critique.md`.

---

## Format

```
### N. Short description
**When.** HH:MM
**Intent.** Why I asked for this, and why in this shape.
**Prompt.**
> ...

**Outcome.** accepted / accepted with edits / rejected / re-prompted
**What I did with it.** ...
**Related.** DL-nn, Cn
```

---

## Planning phase

Prompts used while producing the documents in `docs/`, before any code was generated.

<!-- Entries appended here. -->

## Build phase

### 1. Scaffold and the USGS source
**When.**
**Model.** Claude Code v2.1.236, Sonnet 5, default effort
**Intent.** Establish the skeleton and prove the ingestion boundary against a live feed
before anything depends on it. Scoped narrowly on purpose: a large first diff would make it
impossible to tell which part to distrust. Full text and my verification checklist in
`prompts/drafts/01-scaffold-and-usgs-source.md`.

**Prompt.**
> Follow the instructions in prompts/drafts/01-scaffold-and-usgs-source.md, in the section
> titled "Prompt". Ignore the section below it, that is my own checklist.

**Outcome.** accepted with edits

**What I did with it.** Verified every USGS field citation against the ComCat documentation:
all anchors real, all definitions accurate. Verified the claimed `agentRules` Next.js config
key exists in the installed package rather than trusting the report. Two corrections made:
`ingestedAt` was being stamped inside the normalizer, making it non-deterministic over a
fixture, so it was moved out; `package.json` was modified without asking, which the agent
should have raised first. The agent also sidestepped the test runner question by using a
zero-dependency approach rather than proposing and waiting, so the outcome was fine but the
process was not what I asked for.

The agent's own uncertainty about USGS event id stability turned out to be correct and to
invalidate the deduplication key in DL-07. That became DL-11.

**Related.** DL-11, C4, C5. Agent's full report in `notes/agent-report-01.md`.

### 2. Remove the clock from the normalizer
**When.**
**Intent.** The normalizer stamped `ingestedAt` with `now()`, making it non-deterministic
over a fixture. Caught by reading the return type before running anything. Asked for the
field to be removed rather than for a clock to be injected, because `ingestedAt` is a
persistence fact and injecting a parameter would have kept the concern in the wrong place
with more ceremony.

**Prompt.**
> The normalizer stamps ingestedAt with now(), which makes it non-deterministic: the same fixture produces different output on every run, so any test over it is asserting on the clock. Remove ingestedAt from the normalizer's return type entirely. It should return Omit<CanonicalEvent, 'id' | 'ingestedAt'>. Both id and ingestedAt are facts the persistence layer owns, not the source boundary. Do not inject a clock as a parameter, that keeps the concern in the wrong place. Update the guard test accordingly. Change nothing else.

**Outcome.** accepted

**What I did with it.** Verified the normalizer now returns
`Omit

### 3. Failing tests for identity and alertability
**When.**
**Intent.** Write the tests before the implementation, because deduplication, revision
handling and the DL-11 alias logic all fail silently and look fine in a demo. If the code
comes first, the tests get shaped to fit it, and P1 and P2 are exactly what gets shaped away.
Full text and checklist in `prompts/drafts/02-failing-tests-ingestion.md`.

**Prompt.**
> Follow the instructions in prompts/drafts/02-failing-tests-ingestion.md, in the section
> titled "Prompt". Ignore the section below it, that is my own checklist.

**Outcome.** accepted with edits

**What I did with it.** All 13 new tests fail with `not implemented` thrown from inside the
stub, not from an import or syntax error, and the one passing test is the pre-existing USGS
guard. Six transition rows are six separate tests rather than collapsed into alert and
no-alert. The merge case is present rather than skipped as hard.

Read the test inputs rather than the names, and found that no case covers partial overlap of
alias sets: every pair is either identical or one contains the other. An implementation using
subset or equality instead of intersection would pass all of them. Requested one additional
case and a rename. That gap was mine, not the agent's.

Confirmed the agent's open question about `decideAlertability` taking a precomputed
`currentlyMatches` rather than calling `evaluate()` itself. That split is what section 5 of
the architecture document describes, so it stays.

**Related.** C8, DL-07, DL-11. Agent's report in `notes/agent-report-02.md`.

### 4. Cover partial alias overlap
**When.**
**Intent.** Close the gap found in entry 3. Kept deliberately narrow: one case and one
rename, tests only, so the diff is small enough to read completely.

**Prompt.**
> The identity tests never cover partial overlap. In every case the alias sets are either identical, or one contains the other. An implementation that checks subset or set equality instead of intersection would pass all of them and fail in production, because USGS can drop associations as well as add them, so a stored set and an incoming set can overlap without either containing the other.
 Add one test: a stored event with aliases ["us1", "ci1"] and an observation with aliases ["ci1", "nc1"]. They share ci1 and neither contains the other. They are the same event, and nc1 is recorded.
 Also rename the existing "even when their preferred ids differ" test to say what it actually pins: that alias order does not matter. It currently asserts on identical sets in different order.
 Tests only. Change nothing else.

**Outcome.** accepted

**What I did with it.** Verified the new case uses stored `["us1","ci1"]` against observed
`["ci1","nc1"]`, which no containment check would satisfy.

**Related.** C8

### 5. Admin view
**When.**
**Intent.** The brief's fourth requirement, kept deliberately last, matching the "too" at the
end of the brief and the ordering in the plan. Scoped read-only against the DL-08 question
rather than as CRUD over every table, and asked for no UI or CSS framework: a well-set plain
table says more in the time available than a half-configured component library. Full text and
checklist in `prompts/drafts/05-admin-view.md`.

**Prompt.**
> Follow the instructions in prompts/drafts/05-admin-view.md, in the section titled "Prompt".
> Ignore the section below it, that is my own checklist.

**Outcome.** accepted

**What I did with it.** Checked the diff touched no schema, ingestion, dispatcher or test
code. Loaded it against a fresh database before running a cycle and again after, since the
empty state is the one a reviewer sees first and the one that never gets tested. Screenshots
of both in `notes/`.

**Related.** DL-08, P12

### 6. Replace the scaffold placeholder
**When.** 
**Intent.** The root page was still the Next.js scaffold default, which is the first thing a
reviewer sees after clone and `npm run dev`, before any data exists. A landing page that
explains what the project is and names the two commands that populate it turns a confusing
first impression into an entry point. Small, but it is the state nobody tests.

**Prompt.**
> The root page at / is still the Next.js scaffold placeholder. Replace it with a minimal landing page: the project name, one sentence on what it is, a link to /admin, and the two commands to get data into it (npm run seed, npm run cycle). Same plain styling as the admin view, no new dependencies.
  It should make sense to someone who just cloned the repo and ran npm run dev before running anything else.

**Outcome.** accepted

**What I did with it.** Checked it renders sensibly against an empty database, which is the
state it exists for.