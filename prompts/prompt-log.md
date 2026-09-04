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
**When.** [időpont]
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
**When.** [időpont]
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