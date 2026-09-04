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

<!-- Further entries appended during the build. -->

## 4. Predictions that did not happen, and things I missed

> To be completed at the end.

Reporting only the hits would make section 1 decorative. This section records predictions
that turned out to be wrong, which is information about my own model of where AI output
fails, and problems I did not anticipate at all, which is more useful still.

## 5. Scorecard

> To be completed at the end.

Outcome is one of **Yes**, **No**, or **Partial**. The third value is the one that carries
information: a deduplication that existed but keyed on an unstable field is a more useful
finding than either a clean hit or a clean miss, and forcing it into a binary would throw
that away.

| # | Prediction | Outcome | Action taken |
|---|---|---|---|
| P1 | Deduplication missing or unstable key | | |
| P2 | Revision handling absent or over-alerting | | |
| P3 | Switch instead of channel registry | | |
| P4 | Secrets in the database | | |
| P5 | Retry unbounded or misclassified | | |
| P6 | Definition and normalizer drift | | |
| P7 | Invented payload fields | | |
| P8 | Nonexistent package or version | | |
| P9 | Tests asserting on mocks | | |
| P10 | Missing attribute throws | | |
| P11 | Scope creep into cut features | | |
| P12 | Admin view as unscoped CRUD | | |