# 04 - AI Critique Log

How I directed the agent, what I checked, what I rejected, and what I missed.

**Sections 1 and 2 were written and committed before the first line of code was generated.**
That ordering is the point. A list of caught mistakes assembled afterwards proves only that I
noticed things; a list of predictions made in advance and then scored honestly, including the
ones that did not happen and the ones I failed to anticipate, is testable.

Sections 3 to 5 are filled in as the build proceeds.

---

## 1. Pre-registered failure predictions

Written before generation. Each has a stated reason and a stated detection method, so the
outcome column can be filled in without hindsight doing the work.

| # | Prediction | Why I expect it | How I will detect it |
|---|---|---|---|
| P1 | Ingestion omits deduplication, or dedups on an unstable key such as title or timestamp | Dedup is invisible in a single-run demo. The generated code will look correct and be wrong on the second poll. | Failing test written before implementation: same payload ingested twice yields one event and one delivery. |
| P2 | Revised events are ignored entirely, or every revision re-alerts | The brief has no concept of revision, so nothing in the prompt suggests it unless I put it there. Handling it correctly requires the state table in DL-07, which is easy to flatten into "changed, therefore alert". | Test over the five transitions in DL-07, including a revision that crosses a threshold and one that does not. |
| P3 | The channel abstraction is a switch on channel type rather than a registry | It satisfies the requirement visibly and is the shorter path. | Read the dispatcher. Then add the second adapter and check the dispatcher diff is empty. |
| P4 | Channel secrets (Slack webhook URL, SMTP credentials) stored in the database | Config and secret arrive together in the same user flow, so they get modelled together. | Read the schema. Any secret-shaped column is rejected. |
| P5 | Retry is unbounded, absent, or retries non-retryable failures | Retry is usually generated as a loop without a classification of what is worth retrying. | Read the dispatcher. Check that retryability comes from the adapter, per DL-04, and that attempts are bounded. |
| P6 | Source definition and normalizer disagree on an attribute key | Two separate artifacts with no compiler-enforced link, generated at different times. Failure is silent: the form offers a rule that never matches. | The guard test in DL-03: every declared key must appear in normalizer output over a recorded real payload. |
| P7 | The external feed's payload shape is partly invented | Highest-frequency hallucination class. Plausible field names are easy to produce. | Every field checked against the provider's own documentation, with the link recorded in section 3. Already partly done before the build, see DL-06. |
| P8 | Suggested packages do not exist, or the version does not | Package names and versions are generated from pattern, not lookup. | Verify each on the registry before install. |
| P9 | Generated tests assert on their own mocks | Produces a green suite that tests nothing, and is the most comfortable thing to accept. | Read every test for whether the assertion could fail if the implementation were deleted. Any test that mocks the unit under test is deleted, not repaired. |
| P10 | A rule referencing an attribute the event lacks throws instead of not matching | Undefined attribute access is an edge case that only appears with heterogeneous sources. | Test: a news event against an earthquake rule yields a non-match and no error. |
| P11 | Scope creep beyond what I asked for, particularly features from the cut list | The cut items (throttling, digests, natural language rules) are the ones a model will helpfully add. | Diff each delivery against the request. Unrequested additions are reverted, not kept because they are nice. |
| P12 | The admin view is built without any scoping question, as CRUD over every table | "Admin view" reads as CRUD unless told otherwise. | Check against DL-08: can I walk a specific delivery failure backwards through it? |

## 2. Standing checks applied to every generated unit

Applied regardless of whether a prediction above is in play.

- **Package existence and version.** Confirmed on the registry before install. No exceptions.
- **External payload shapes.** Checked against the provider's own documentation, never
  against memory or against what the agent asserts. Link recorded in section 3.
- **Test honesty.** Every test read for whether it would fail if the implementation were
  removed.
- **Diff against request.** What was delivered compared with what was asked for, to catch
  additions as well as omissions.
- **Self-critique is verified, not trusted.** When the agent reviews its own output, I check
  the review. A confident and wrong self-assessment is worse than none, because it invites me
  to stop looking.
- **Silent-failure bias.** Extra attention to anything that fails without raising: a rule that
  never matches, a delivery that never fires, a dedup that never triggers. Loud failures find
  themselves.

## 3. Catches

Chronological. Every entry records what was produced, how it was caught, and what I did.
Entries include artifacts as well as code, since the exercise asks about sanity checks
applied to generated artifacts generally.

### C1. Misquoted brief in `01-brief-analysis.md`

**Produced.** The verbatim brief quote rendered as "flexible enough **that** we can add more
channels later".

**Actual.** The assignment says "flexible enough **so** we can add more channels later".

**How caught.** Read the generated quote against the original assignment document word by
word, on the principle that a verbatim quote is the one thing that can be checked exactly.

**Why it matters.** This is not a hallucination. It is a real quote drifted toward more
fluent phrasing, which makes it harder to spot than an invented one. Returning a client's own
sentence to them slightly rewritten, while presenting it as verbatim, is a bad look in a
document whose entire argument is careful reading. The same fragment appeared twice more in
the file; a grep confirmed all occurrences were fixed.

**Action.** Corrected in both places. Third occurrence was elided with an ellipsis and left.

### C2. Unverified word count in the same document

**Produced.** "Fifty-three words", describing the brief.

**Actual.** Fifty-six.

**How caught.** Counted, because a specific number stated confidently is exactly the kind of
detail that gets generated rather than computed.

**Why it matters.** Small, and revealing. The number was not wrong because of bad information;
it was produced because a precise-sounding figure fit the sentence. Any unverified specific
quantity in generated prose deserves the same treatment.

**Action.** Corrected.

### C3. Library smuggled into an architecture document

**Produced.** `configSchema: ZodSchema` inside the `ChannelAdapter` type in
`02-architecture.md`.

**How caught.** Noticed while reviewing the interface: no decision had been made to use Zod,
and no entry in the decision log covered it. A design document had quietly committed the
implementation to a dependency.

**Why it matters.** Had it stayed, adopting Zod later would have looked like following the
plan rather than making a choice, and the decision would never have been logged. Grepped the
other documents for the same pattern; the only remaining concrete dependency was SQLite via
Prisma, which is deliberate and has its own entry (DL-10).

**Action.** Replaced with a library-agnostic `validateConfig(config): ValidationResult`. If
the agent proposes a validation library during the build, that becomes a logged decision.

### C4. Guard test verified by mutation, not by reading

**Checked.** Renamed `magnitude` to `magnitudo` in the USGS `EventSourceDefinition` and ran
the guard test. It failed, as intended. Renamed back, it passed.

**Why this rather than reading it.** A test that passes in both states is worse than no test,
because it produces confidence without cover. Reading the assertion would not have told me
whether it reaches the definition at all. Two minutes of mutation did.

**Outcome.** The guard for DL-03 holds. Definition and normalizer cannot drift on a key name
without the suite going red.

### C5. A build tool rewriting the governance file

**Category.** Not an AI error and not mine. A side effect of a third tool.

**Produced.** During the first sanity-check run, `next dev` appended an agent-instructions
block to `CLAUDE.md`, a human-authored file this project treats as authoritative and cites as
evidence of how the agent was constrained.

**How caught.** The agent noticed the modification and reported it under "not done" rather
than leaving it in place. It reverted the file and set `agentRules: false` in
`next.config.ts`.

**How I verified it.** I did not take the report at face value, because a plausible fix for a
real problem is more dangerous than an obvious mistake: if the config key had been invented,
I would have believed the problem solved while `CLAUDE.md` kept being overwritten. Checked
the installed package directly rather than the agent's word or my own assumption:

```
grep -rn "agentRules" node_modules/next/dist/server/config-shared.d.ts
```

Two hits in the type definitions. The key is real and the fix holds.

**Why it matters.** Everything else in this log is about output from the agent. This is about
a tool silently editing the file that governs the agent. Had it gone unnoticed, `CLAUDE.md`
would carry a modification in its git history that I did not author and could not account
for, in the one file whose credibility depends on being human-authored.

**Standing change.** `git diff --stat CLAUDE.md` after any dev-server run, until the build is
finished. Verification of tool behaviour now sits alongside verification of AI output.

### C6. `package.json` modified without asking, and a question sidestepped

**Produced.** The agent added `"type": "module"` to `package.json` and
`allowImportingTsExtensions` to `tsconfig.json` on its own initiative. It also did not answer
the test runner question: the prompt said to propose one, say why, and wait, and instead it
arranged for zero new dependencies and moved on.

**How caught.** Read the diff against the request rather than only reading the code.

**Assessment.** The outcome is better than what I asked for: no test runner dependency at all
is a cleaner result than any proposal I would have approved. The process is not. Hard rule 2
says `package.json` is not modified without permission, and the prompt asked for a proposal
and a pause. Both were bypassed, and the fact that the destination was good does not make the
route acceptable, because next time the same latitude produces something I would not have
approved.

Kept, because reverting a better answer to make a point would be theatre. Recorded because
the whole value of the constraint file is that its violations are visible.

**Prediction relevance.** Adjacent to P11 (scope creep) rather than an instance of it: nothing
from the cut list was built, but work was done outside the request. Scored as Partial, with
this note.

### C7. Non-deterministic normalizer

**Produced.** The normalizer stamped `ingestedAt` with `now()` inside itself, so the same
fixture produced different output on every run.

**How caught.** Read the return type before running anything. A field whose value comes from
the clock has no business in a pure transformation, and any test asserting over that output
would have been asserting partly on the time of day.

**Why it matters.** Nothing was broken yet, and nothing would have looked broken later
either. Tests would have been written around it, and the resulting suite would have quietly
excluded one field from ever being checked.

**Action.** `ingestedAt` removed from the normalizer's return type entirely. Along with `id`,
it is a fact the persistence layer owns, not the source boundary. No clock injected as a
parameter, which would have kept the concern in the wrong place with more ceremony.

### C8. A gap in my own test specification, not the agent's tests

**Category.** My error. The agent wrote exactly the cases I listed, and the list was
incomplete.

**Produced.** Five identity tests covering the alias rules from DL-11, all failing correctly
with `not implemented`, all named after the behaviour they pin.

**How caught.** Read the inputs rather than the test names. Across all five cases the alias
sets are either identical (in different order), or one strictly contains the other:

| Test | Stored | Observed | Relationship |
|---|---|---|---|
| no shared alias | `["us1"]` | `["ci9"]` | disjoint |
| differing preferred ids | `["us1","ci1"]` | `["ci1","us1"]` | identical, reordered |
| superset | `["us1"]` | `["us1","ci1","nc1"]` | observed contains stored |
| merge | `["us1"]`, `["ci2"]` | `["us1","ci2"]` | observed contains both |
| single identifier | `["only-id"]` | `["only-id"]` | identical |

No case has the two sets overlapping without one containing the other.

**Why it matters.** An implementation checking subset or set equality rather than
intersection passes all five and is wrong in production. USGS drops associations as well as
adding them, so a stored set and an incoming set can share an id while each holds one the
other does not. That is the exact condition none of the tests reach, and it is the condition
the whole entry exists to handle.

The second row is a smaller version of the same problem: the test is named for differing
preferred ids but its two sets are identical, so it pins order-independence, not
re-association. The name claims more than the assertion delivers.

**Action.** Added a partial-overlap case: stored `["us1","ci1"]` against observed
`["ci1","nc1"]`, sharing `ci1` with neither containing the other, expected to resolve as one
event with `nc1` recorded. Renamed the second test to say what it actually pins.

**Reflection.** This is the second specification error of mine that the process caught before
it reached an implementation, after the guard test that would have failed on legitimately
null fields. Both came from listing cases rather than characterising the space they are drawn
from: I enumerated examples, and the enumeration had a hole in the middle. Writing the
constraint first ("cover disjoint, containing, and partially overlapping") would have made
the gap visible before the tests existed rather than after.

<!-- Further entries appended during the build. -->

## 4. Predictions that did not happen, and things I missed

> To be completed at the end.


Reporting only the hits would make section 1 decorative. This section records predictions
that turned out to be wrong, which is information about my own model of where AI output
fails, and problems I did not anticipate at all, which is more useful still.

## The predictions were mostly wrong, and in a specific direction

Ten of twelve did not occur. The two that did fired partially and neither in the shape
predicted.

Every prediction in section 1 assumes the same failure mode: the agent produces something
plausible and incorrect, and my job is to catch it. That happened twice, and neither time
seriously. What happened repeatedly instead was the inverse. The agent implemented my
specification faithfully, and my specification was wrong.

Three instances, all caught before they reached anything:

**The deduplication key.** DL-07 deduplicated on a single source id and called it stable. The
USGS documentation says the opposite, and says so in the definition of the field itself. The
agent read it, reported the conflict, and stopped rather than deciding. Had it not, the
system would have alerted twice for one earthquake whenever a preferred network changed, and
the duplicate would have been invisible in every test I had planned. Became DL-11.

**The guard test that would have failed on correct output.** I specified that every attribute
declared in a source definition must appear in the normalized output. Nullable fields are
common in the USGS feed, so a correct normalizer would have failed this on any event where a
declared field happened to be null. On first red I would have "fixed" a working normalizer.
Corrected to at-least-one-across-the-fixture before it was written.

**The missing positive cases.** `matching.test.ts` as I scoped it covered only non-matches.
An implementation returning `false` unconditionally would have passed both tests. Caught by
reading the inputs rather than the test names.

## The pattern underneath all three

I enumerated examples where I should have characterised the space they were drawn from.

Each time I listed cases that felt representative, and each list had a hole in the middle
that the enumeration itself concealed: it looked complete because every item in it was
correct. The identity tests are the clearest instance. Five cases, all sound, and the alias
sets in every one were either identical or one contained the other. Nothing covered two sets
overlapping while each held an id the other did not, which is the only case the entry exists
to handle. An implementation checking subset or equality would have passed all five.

A fourth instance appeared later without my noticing: the DL-07 transition table names six
rows and there is a seventh, prior record exists, did not match, still does not. The agent
found it, flagged it in a comment, returned the obvious answer rather than inventing one, and
I chose not to add the test for time. It is untested to this day and I would not have known
it existed.

The general form: writing "cover disjoint, containing, and partially overlapping" would have
exposed the gap before the tests existed. Writing five good examples did not.

## What the AI did better than predicted

Worth recording, because a critique log that only accumulates failures is not an accurate
account of what happened.

- **It declined to use an undocumented field.** `title` is present in every live USGS payload
  and absent from the documented per-feature properties. Hard rule 3 said not to read fields
  it could not cite, so it constructed the title from two documented fields instead. That is
  the rule working against a field that certainly exists, which is a harder call than
  refusing one that does not.
- **It caught a dependency mismatch I would not have.** `prisma@latest` was a release
  candidate ahead of `@prisma/client@latest`. Installing both at `latest` would have paired an
  RC CLI with a stable client. It pinned both instead.
- **It stopped twice on a dependency and once on an architectural deviation**, each time with
  evidence rather than a request. The `node:sqlite` proposal in particular was correctly
  framed as needing sign-off rather than presented as a solution.
- **It reported a third tool modifying the governance file.** `next dev` was appending to
  `CLAUDE.md`. The agent noticed, reverted it, and configured it away. That was outside
  anything I had asked it to watch.
## Things I did not anticipate at all

**That the tooling would consume real time.** Prisma 7 moved the connection URL into a config
file, and the CLI could not read it while the runtime client could. The database was already
deleted when this surfaced. Nothing about it was interesting, and it cost more of the budget
than any correctness problem did. My planning treated setup as free.

**That the agent would be a better reader of documentation than I was.** I wrote the rule
requiring every external field to be cited to the provider's own documentation in order to
catch invented field names. It caught zero invented field names. What it caught was the
unstable identifier that invalidated my own deduplication design, and it caught it in the
first ten minutes of implementation.

**That a real feed produces cases fixtures never would.** The revision observed in a live
cycle, an event updated and correctly not re-alerted, is a case I could not have produced on
demand. It exists in `notes/` because it happened, not because it was arranged.

## What I would do differently

Write specifications as constraints over a space rather than as lists of examples. Every one
of my errors was an enumeration that looked complete.

Budget for setup explicitly. The plan's time estimates covered only the work.

Treat the agent's uncertainty section as the highest-value part of its output. Every real
finding in this log came from something it flagged rather than something it got wrong.

## 5. Scorecard

> To be completed at the end.

Outcome is one of **Yes**, **No**, or **Partial**. The third value is the one that carries
information: a deduplication that existed but keyed on an unstable field is a more useful
finding than either a clean hit or a clean miss, and forcing it into a binary would throw
that away.

| # | Prediction | Outcome     | What actually happened |
|---|---|-------------|---|
| P1 | Deduplication missing or unstable key | **Partial** | Not the agent's error. Deduplication was implemented as specified, on a key my own design named. The agent then read the source documentation and reported that USGS's `id` is the *current preferred* identifier and may change, so the key I had specified in DL-07 was not stable. Prediction hit the right target for the wrong reason: I expected a generated implementation to get dedup wrong, and instead the specification was wrong and the implementation was faithful to it. Resolved by DL-11. |
| P2 | Revision handling absent or over-alerting | **No**      | Six transition rows implemented as six distinguishable branches, verified by mutation: breaking one branch turned exactly one test red. A live cycle later observed a real USGS revision that correctly produced a match and no second alert. |
| P3 | Switch instead of channel registry | **No**      | The dispatcher names no concrete channel. Settled by commit diff rather than by reading: adding the Slack adapter modified **zero existing files**. Four new files, no change to `dispatcher.ts` or `registry.ts`. The definition-of-done claim in `00-plan.md` is met and the git history proves it without anyone taking my word for it. |
| P4 | Secrets in the database | **No**      | `channel_configs` stores `secretEnvVar`, the name of an environment variable. The only occurrences of "webhook" and "password" in the schema are in comments explaining why the value is absent. |
| P5 | Retry unbounded or misclassified | **No**      | Bounded at three attempts with backoff, only on `retryable`. Retryability is the adapter's judgement, not the dispatcher's: the Slack adapter classifies 429 and 5xx as retryable and a 404 on a dead webhook as not, and the dispatcher never learns what those codes mean. A delivery attempt row is written before the send, so a crash leaves evidence. |
| P6 | Definition and normalizer drift | **No**      | The DL-03 guard test holds, verified by mutation: renaming `magnitude` to `magnitudo` in the definition turned it red. Its first form, as I specified it, would have failed on legitimately null fields; corrected before it was written. A second-order version of this risk appeared later and was rejected on the same grounds (see P8). |
| P7 | Invented payload fields | **No**      | Every USGS field was cited to the ComCat documentation with a URL, and I checked the anchors and definitions myself rather than accepting the citations. All real. The agent went further than instructed: it found `title` present in live payloads but absent from the documented per-feature properties, declined to read it under hard rule 3, and constructed the title from two documented fields instead. |
| P8 | Nonexistent package or version | **No**      | The opposite happened, twice. The agent found that `prisma@latest` was an RC ahead of `@prisma/client@latest` and pinned both to 7.10.0 rather than pairing an RC CLI with a stable client. Later it stopped and asked before installing a driver adapter, having confirmed the version exists and matches. It then offered a zero-dependency alternative using `node:sqlite` with raw SQL and correctly flagged that as a deviation needing sign-off. I rejected it: raw SQL against a Prisma-managed schema creates two access paths to one database, and the raw path goes stale silently at the first schema change. That is the P6 drift class one layer down. |
| P9 | Tests asserting on mocks | **No**      | No test mocks its unit under test. Two mutation checks confirmed the suite has teeth. The real failure in this area was mine: `matching.test.ts` initially covered only non-matches, so an implementation returning `false` unconditionally would have passed both tests. Caught by reading the inputs rather than the names. |
| P10 | Missing attribute throws | **No**      | Missing and wrong-typed attributes both evaluate to non-matches. Covered by tests written before the implementation existed. |
| P11 | Scope creep into cut features | **Partial** | Nothing from the cut list was built. But `package.json` and `tsconfig.json` were modified without asking, and the test runner question was sidestepped rather than answered: the prompt asked for a proposal and a pause, and the agent arranged for zero new dependencies and moved on. The destination was better than what I would have approved; the route was not. Kept, and recorded as C6. |
| P12 | Admin view as unscoped CRUD | **Yes**     | Built read-only against the question in DL-08, not as CRUD over every table. |

## What the scoring says

Ten of twelve predictions did not occur. That is not a flattering result for the prediction
list, and reading it as one would be the wrong lesson.

Three of the entries above describe errors that were mine rather than the agent's: the
deduplication key in P1, the guard test that would have failed on correct output in P6, and
the missing positive cases in P9. In each case the agent implemented my specification
faithfully and the specification was wrong. The instructions that caught them were written
to catch invented fields and lazy tests, and what they actually caught was me.

The predictions that did fire, P1 and P11, both fired partially and neither in the shape
predicted. The value of the list turned out not to be its accuracy but its function: having
committed to twelve specific things to look for, I looked, and looking is what found the
things that were not on the list.