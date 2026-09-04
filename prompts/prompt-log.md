# Prompt Log

**Drafts.** `prompts/drafts/` holds the six prompts I wrote in advance, each with the
verification checklist I ran against its output. Their numbering does not track the entry
numbers below, because the drafts cover only the planned steps. Corrections, fixes, and short
follow-ups were written in the moment and appear here in full.

Every prompt used during the build, in order. Kept live rather than reconstructed
afterwards, because a reconstructed prompt history is a summary of what I wish I had asked.

The prompt text alone is the least useful part of an entry. What matters is why I asked for
it in that shape, and what happened to the output. The outcome field is therefore mandatory
and is one of: **accepted**, **accepted with edits**, **rejected**, or **re-prompted**.

Where an output was rejected or corrected, the entry links to the corresponding catch in
`04-ai-critique.md`.

**Tooling.** Two surfaces, and the distinction matters for reading this log honestly:

- **Planning**: a Claude chat session, used conversationally to develop the documents in
  `docs/`. Not a single-prompt exercise and not solely my own writing. See the note below.
- **Build**: Claude Code v2.1.236, Sonnet 5 at default effort, held constant so the
  predictions in `04-ai-critique.md` could be scored against one variable.

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

The documents in `docs/` were developed in an extended chat session rather than through
discrete prompts, so there is no clean prompt-per-artifact list for this phase and I am not
going to manufacture one.

What it actually looked like: I described the brief and the role and worked through it in
dialogue. Structure and drafting came out of that back-and-forth; the judgements came from
reviewing drafts and pushing back on them. The corrections that mattered are recorded as they
happened, in `docs/04-ai-critique.md` C1 through C3, and they are corrections of the planning
output itself: a misquoted brief, an unverified word count, and a validation library smuggled
into a type definition in a document that was supposed to be technology-agnostic.

Specific things I changed rather than accepted, so the division of labour is visible:

- Reframed the USGS attribute argument. A draft called `mag` a "severity field"; it is not,
  and the feed carries a separate `sig` significance score. The defensible argument is that
  magnitude is the attribute a user can state a threshold for and understand, not that no
  severity value exists.
- Rejected a three-hour hard cap in favour of a self-imposed four-hour timebox, because the
  assignment says 24 hours and the recruiter's estimate is not the deadline.
- Split the scope boundary into built versus considered-and-cut, so deduplication
  (correctness, in scope) is visibly separated from distributed idempotency (out of scope).
- Kept the region filter optional on a rule rather than required.
- Required that the attribute-presence convention be read off the existing `AttributeValue`
  type rather than invented in a prompt, so a prompt could not silently create an
  architecture decision.
- Chose the USGS earthquake feed as the live source, and kept a mock news source in the plan
  so the architecture would not become earthquake-shaped. That second source is the one thing
  the plan named and the build never delivered, recorded in the README.

This phase produced `docs/00-plan.md` through `docs/04-ai-critique.md` sections 1 and 2, all
committed before the first line of code was generated. The git history shows that ordering.

---

## Build phase

### 1. Scaffold and the USGS source
**When.** 11:52
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
key exists in the installed package rather than trusting the report. Two corrections:
`ingestedAt` was stamped inside the normalizer, making it non-deterministic over a fixture, so
it was moved out; `package.json` was modified without asking, which should have been raised
first. The agent also sidestepped the test runner question by using a zero-dependency approach
rather than proposing and waiting, so the outcome was fine but the process was not what I
asked for.

The agent's own uncertainty about USGS event id stability turned out to be correct and to
invalidate the deduplication key in DL-07. That became DL-11.

**Related.** DL-11, C5, C6, C7. Agent's report in `notes/agent-report-01.md`.

### 2. Remove the clock from the normalizer
**When.** 12:20
**Intent.** Caught by reading the return type before running anything. Asked for the field to
be removed rather than for a clock to be injected, because `ingestedAt` is a persistence fact
and a parameter would have kept the concern in the wrong place with more ceremony.

**Prompt.**
> The normalizer stamps ingestedAt with now(), which makes it non-deterministic: the same
> fixture produces different output on every run, so any test over it is asserting on the
> clock. Remove ingestedAt from the normalizer's return type entirely. It should return
> Omit<CanonicalEvent, 'id' | 'ingestedAt'>. Both id and ingestedAt are facts the persistence
> layer owns, not the source boundary. Do not inject a clock as a parameter, that keeps the
> concern in the wrong place. Update the guard test accordingly. Change nothing else.

**Outcome.** accepted

**What I did with it.** Verified the normalizer returns
`Omit<CanonicalEvent, "id" | "ingestedAt">` and that `ingestedAt` remains on `CanonicalEvent`.
The diff touched nothing else.

**Related.** C7

### 3. Failing tests for identity and alertability
**When.** 12:50
**Intent.** Write the tests before the implementation, because deduplication, revision
handling and the DL-11 alias logic all fail silently and look fine in a demo. If the code
comes first the tests get shaped to fit it, and P1 and P2 are exactly what gets shaped away.
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
case and a rename. That gap was mine.

Confirmed the agent's open question about `decideAlertability` taking a precomputed
`currentlyMatches` rather than calling `evaluate()` itself. That split is what section 5 of
the architecture document describes, so it stays.

**Related.** C8, DL-07, DL-11. Agent's report in `notes/agent-report-02.md`.

### 4. Cover partial alias overlap
**When.** 13:05
**Intent.** Close the gap found in entry 3. Deliberately narrow: one case and one rename,
tests only, so the diff is small enough to read completely.

**Prompt.**
> The identity tests never cover partial overlap. In every case the alias sets are either
> identical, or one contains the other. An implementation that checks subset or set equality
> instead of intersection would pass all of them and fail in production, because USGS can drop
> associations as well as add them, so a stored set and an incoming set can overlap without
> either containing the other.
>
> Add one test: a stored event with aliases ["us1", "ci1"] and an observation with aliases
> ["ci1", "nc1"]. They share ci1 and neither contains the other. They are the same event, and
> nc1 is recorded.
>
> Also rename the existing "even when their preferred ids differ" test to say what it actually
> pins: that alias order does not matter. It currently asserts on identical sets in different
> order.
>
> Tests only. Change nothing else.

**Outcome.** accepted

**What I did with it.** Verified the new case uses stored `["us1","ci1"]` against observed
`["ci1","nc1"]`, which no containment check would satisfy.

**Related.** C8

### 5. Envelope migration and identity resolution
**When.** 13:25
**Intent.** Two things in one prompt, and the first is not identity logic at all. The tests
worked with alias arrays while `CanonicalEvent` still carried a single `sourceEventId`, so the
suite could have gone green against a model the real pipeline never produces, leaving DL-11 as
dead code. Migrating the envelope first closes that gap. Full text in
`prompts/drafts/03-implement-identity.md`.

**Prompt.**
> Follow the instructions in prompts/drafts/03-implement-identity.md, in the section titled
> "Prompt". Ignore the section below it, that is my own checklist.

**Outcome.** accepted

**What I did with it.** The assertion that mattered: over the saved 328-feature fixture, 39
normalized events carry more than one entry in `sourceEventIds`. Had that been zero, the `ids`
field would not be read and no amount of green tests would have shown it. Checked the diff
myself rather than trusting the report that no test file was edited: `identity.test.ts` does
not appear in it. The whole diff was 91 lines, small enough to read completely, which is the
payoff of narrow prompts.

The agent flagged that `IdentityResolution` handles only two colliding events and that DL-11
says nothing about three-way collisions. It did not invent behaviour. Not fixed; recorded as a
known limitation, and it is my specification error rather than its implementation error.

**Related.** DL-11. Agent's report in `notes/agent-report-03.md`.

### 6. Positive matching cases, then implement evaluate
**When.** 13:50
**Intent.** `matching.test.ts` covered only non-matches, so an implementation returning `false`
unconditionally would have passed both tests. Same class of gap as entry 4, inverted: there I
omitted the negative edge, here the positive one.

**Prompt.**
> matching.test.ts only covers non-matches. An implementation that always returns false passes
> both tests. Add positive cases before implementing: magnitude 6.1 against >= 6.0 is true,
> magnitude 5.9 against >= 6.0 is false, and one string operator case (contains) that matches.
> Then implement evaluate.

**Outcome.** accepted

**What I did with it.** Confirmed all four matching tests pass and the six alertability tests
still fail, so nothing was implemented early.

### 7. Alertability transitions
**When.** 14:05
**Intent.** The most delicate piece in the build: six rows where two alert and four do not, and
every failure mode is silent. Restated the substantive rows in the prompt rather than pointing
at the document alone, because the row that alerts on revision is the one most likely to be
flattened into "changed, therefore alert".

**Prompt.**
> Implement decideAlertability so the six tests in src/ingestion/alertability.test.ts pass. The
> six rows are the transition table in docs/02-architecture.md section 5 and DL-07. Read both
> before starting.
>
> Requirements:
> - Alerting happens on the transition into a matching state, never on remaining in one.
> - The row that produces an alert on revision is the one where a stored record previously did
    >   not match and now does. The DL-07 worked example is a quake published at 5.9 and revised to
    >   6.1 against a rule set at 6.0.
> - A revision that stops matching updates the record and produces nothing. No retraction
    >   notice. That is a product decision recorded in DL-07, not an oversight.
> - Withdrawn events never alert and remain visible.
> - Take currentlyMatches as a parameter as the tests already do. Do not call evaluate() from
    >   inside. Section 5 keeps matching and alertability separate on purpose.
>
> Do not change any test. If a test looks wrong, stop and tell me.
> Do not build the polling loop, the dispatcher, or any UI.
> When done, run the full suite and show me the output.

**Outcome.** accepted

**What I did with it.** 19/19 green, then a mutation check, because a fully green suite is
exactly what I want to believe. Broke the `priorRecord === null` branch and confirmed exactly
one test went red, the one covering that row. The tests are not coupled and the branch is
genuinely covered.

The implementation carries a comment identifying a seventh transition the DL-07 table never
names: prior record exists, did not match, still does not. It returned the obvious answer and
flagged it rather than inventing one. I chose not to add a test for it, for time, and recorded
that as a known limitation.

**Related.** DL-07

### 8. Channel registry, dispatcher, email adapter
**When.** 14:35
**Intent.** The brief's one architectural requirement. Split into two prompts deliberately: if
both adapters arrive in one diff, the claim that adding the second touched no dispatcher code
is unprovable. Asked for no SMTP library so a dependency decision would not be buried in the
step that was about the abstraction. Full text in `prompts/drafts/04-channel-registry.md`.

**Prompt.**
> Follow the instructions in prompts/drafts/04-channel-registry.md, in the section titled
> "Prompt A". Ignore Prompt B and the checklist below it. I will ask for Prompt B separately.

**Outcome.** accepted

**What I did with it.** Grepped the dispatcher and registry for any concrete channel name:
nothing, not as an import and not as a string. Grepped the schema for secret-shaped columns:
`secretEnvVar` holds the name of an environment variable, and the only occurrences of "webhook"
and "password" are comments explaining why the value is absent. Committed before running Prompt
B, because that commit boundary is what makes the next diff evidence rather than assertion.

**Related.** DL-04, DL-05

### 9. Slack adapter
**When.** 14:50
**Intent.** The actual test of DL-04. The prompt includes an exit: if the adapter cannot be
added without touching the dispatcher, stop and say what the interface is missing. That answer
would have been more valuable than a working adapter, because it would mean the abstraction is
drawn in the wrong place and the brief's requirement is not met.

**Prompt.**
> Follow the instructions in prompts/drafts/04-channel-registry.md, in the section titled
> "Prompt B".

**Outcome.** accepted

**What I did with it.** `git diff --stat` came back empty. Four new files, zero modified. The
requirement is met and the commit boundary proves it rather than my description of it. Checked
that `src/channels/index.ts` registers both adapters and that neither it nor the adapters reach
into the registry or dispatcher.

**Related.** DL-04, P3

### 10. End-to-end cycle
**When.** 15:10
**Intent.** Every layer worked and nothing connected them, so no real event had travelled the
full path. This satisfies the first and third bullets of the definition of done. Asked for the
seed thresholds to be chosen from the fixture's actual magnitude distribution rather than
guessed, because a rule at 6.0 would have fired zero times on a normal day and the demo would
have shown nothing.

**Prompt.** (abridged; the full text was seven numbered requirements)
> Wire the pieces together into a single end-to-end script. No UI. Read docs/00-plan.md section
> 8. This script exists to satisfy its first and third bullets. [...] Running the script twice
     > in a row must produce alerts on the first run and zero on the second, because every event is
     > already known and unchanged. Print enough that the difference is visible in the output.

**Outcome.** accepted with edits

**What I did with it.** The agent stopped twice before installing
`@prisma/adapter-better-sqlite3`, with evidence it had confirmed the version exists and matched
it to the pinned Prisma. It then offered a zero-dependency alternative using `node:sqlite` with
raw SQL and correctly framed that as a deviation needing sign-off rather than presenting it as
a solution. I rejected it: raw SQL against a Prisma-managed schema creates two access paths to
one database, and the raw one goes stale silently at the first schema change. That is the P6
drift class one layer down. Approved the adapter.

Result: first run 285 new events, 570 rule evaluations, 108 alerts. Second run zero and zero.
Both outputs in `notes/e2e-run-1.txt` and `notes/e2e-run-2.txt`.

**Related.** P8

### 11. Prisma CLI configuration
**When.** 15:25
**Intent.** `prisma migrate` failed with an empty connection url while the runtime client
worked through the driver adapter, and I had already deleted the database. Gave it to the agent
rather than debugging it myself because it wrote the config, and asked for a documented setup
path because whatever bit me will bite a reviewer.

**Prompt.**
> npx prisma migrate dev and migrate deploy both fail with "Connection url is empty", while the
> runtime client works fine through the driver adapter. [...] Fix the config so the CLI can read
> the connection url. Then recreate the database from the existing migrations, run seed, and run
> cycle twice. [...] Also add a documented setup sequence to package.json scripts so a reviewer
> can go from clone to a working database in one command. This bit me and it will bite them.

**Outcome.** accepted

**What I did with it.** Verified both runs produced the expected contrast afterwards.

### 12. Admin view
**When.** 15:45
**Intent.** The brief's fourth requirement, kept deliberately last, matching the "too" at the
end of the brief and the ordering in the plan. Scoped read-only against the DL-08 question
rather than as CRUD over every table, and asked for no UI or CSS framework: a well-set plain
table says more in the time available than a half-configured component library. Full text in
`prompts/drafts/05-admin-view.md`.

**Prompt.**
> Follow the instructions in prompts/drafts/05-admin-view.md, in the section titled "Prompt".
> Ignore the section below it, that is my own checklist.

**Outcome.** accepted

**What I did with it.** Checked the diff touched no schema, ingestion, dispatcher or test code.
Grepped for mutation controls (`onClick`, `<form>`, `<button>`, form actions): none, so the
read-only claim holds. Loaded it against a fresh database before running a cycle and again
after, since the empty state is the one a reviewer sees first and the one that never gets
tested. Screenshots of both in `notes/`.

**Related.** DL-08, P12

### 13. Replace the scaffold placeholder
**When.** 16:00
**Intent.** The root page was still the Next.js scaffold default, which is the first thing a
reviewer sees after clone and `npm run dev`, before any data exists. A landing page naming the
two commands that populate it turns a confusing first impression into an entry point. Small,
but it is the state nobody tests.

**Prompt.**
> The root page at / is still the Next.js scaffold placeholder. Replace it with a minimal
> landing page: the project name, one sentence on what it is, a link to /admin, and the two
> commands to get data into it (npm run seed, npm run cycle). Same plain styling as the admin
> view, no new dependencies. It should make sense to someone who just cloned the repo and ran
> npm run dev before running anything else.

**Outcome.** accepted

**What I did with it.** Checked it renders sensibly against an empty database, which is the
state it exists for.

### 14. Native module and generated client
**When.** 16:55
**Intent.** Every admin route threw at runtime while the scripts worked, so the failure was in
the bundled server path rather than the code. Two causes in sequence: `better-sqlite3` was
compiled against Node 22 and I had upgraded to 24 mid-build, and the regenerated `node_modules`
left no generated Prisma client.

**Prompt.**
> /admin/events throws PrismaClientKnownRequestError at runtime: the better-sqlite3 native
> module cannot be loaded from the bundled server chunk. The scripts work because they run in
> plain Node, the page fails because Next bundles it. Fix it so every admin route renders. Check
> all four, not just events. Do not change the schema, the ingestion logic, or any test. Tell me
> what the actual cause was and what you changed.

**Outcome.** accepted with edits

**What I did with it.** The first diagnosis was wrong, and the error on the next attempt named
the real cause: a Node module version mismatch. Fixed with `npm rebuild` and
`npx prisma generate`, then made permanent by adding `postinstall: prisma generate` so a
reviewer running `npm install` does not land where I did.

Worth recording that this was self-inflicted: I upgraded Node from 22 to 24 in the middle of a
timeboxed build, having been advised it was unnecessary, and the cost surfaced three hours
later in a place unrelated to the upgrade.

### 15. Design plan for the visual layer
**When.** 17:10
**Intent.** Not in the plan. Added because the role is a frontend position and four unstyled
tables demonstrate none of the judgement the job is about. Two passes so the design could be
reviewed before any code existed, for the same reason the failing tests came first. The prompt
states that the current view already uses two generated-design defaults without saying which: a
test of whether it could critique its own prior output. Full text in
`prompts/drafts/06-admin-visual-layer.md`.

**Prompt.**
> Follow the instructions in prompts/drafts/06-admin-visual-layer.md, in the section titled
> "Prompt A". Do not write any code. Ignore Prompt B and the checklist below it.

**Outcome.** accepted with edits

**What I did with it.** It found both defaults unprompted: all-caps table headers, and
monospace applied indiscriminately to five kinds of content. It then made a distinction I had
not: monospace is right for opaque identifiers, where fixed width separates 0 from O, and wrong
for a rule condition or a channel name, which are language. I kept its version over my own
instruction.

It also stopped before building, having noticed the landing page shares a CSS class with the
admin view, so a dark theme would carry over as an unasked side effect. I chose to take the
landing page dark too: a light landing page in front of a dark console reads as two products.

Plan saved to `notes/design-plan.md` and committed before the build, so the ordering is in the
history.

**Related.** C9

### 16. Build the visual layer
**When.** 17:18
**Intent.** Implement the approved plan, presentation only.

**Prompt.**
> Plan approved. Two things: scope the dark styles under a new class as you suggested, but apply
> it to the landing page too. A light landing page in front of a dark console reads as two
> products. Same palette, same type scale, less density. Your monospace argument is better than
> the instruction I gave you. Keep it exactly as you scoped it. Now follow
> prompts/drafts/06-admin-visual-layer.md, the section titled "Prompt B".

**Outcome.** accepted with edits

**What I did with it.** Declined the agent's offer to verify its own rendering through a browser
extension. The visual judgement is mine in this exercise, and an agent checking its own output
has the same problem as an agent reviewing its own code. Checked it myself: all four surfaces
plus the landing page, at desktop width and at 380px, with keyboard focus visible on links and
tabs. Screenshots in `notes/`.

One correction: the dark styles were scoped to an inner wrapper, so `html` and `body` kept a
light background that showed as a frame around every page.

### 17. Dark surface to the viewport edge
**When.** 17:25
**Intent.** Close the light frame left by the previous step.

**Prompt.**
> Every page has a light frame around the dark surface: the dark styles are scoped to an inner
> wrapper, so html/body keeps its default light background and shows around the edges. Set the
> page background on html and body to surface-0 so the dark surface reaches the viewport edge on
> every route, including the landing page. Make sure it also covers the area below the content
> when a page is short, and set color-scheme: dark so form controls and scrollbars match.
> Nothing else.

**Outcome.** accepted

**What I did with it.** Verified at both widths and on every route.