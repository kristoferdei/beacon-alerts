# beacon-alerts

An alerting system built from a deliberately vague one-paragraph brief: users subscribe to
rules, events are ingested from external sources, and matching events are delivered over
email and Slack through a channel abstraction that new channels can be added to.

Built as a take-home exercise for Sonrisa. The exercise is explicit that the process, not
the solution, is what is being evaluated, so this repository is organised as a set of
working documents with an implementation attached as evidence. If you only read two files,
read `docs/00-plan.md` and `docs/04-ai-critique.md`.

---

## Start here

Read in this order:

| File | Why |
|------|-----|
| [`docs/00-plan.md`](docs/00-plan.md) | The plan of attack, written and committed before any code was generated. Deliverables, ordering, timebox, and the scope boundary. |
| [`docs/01-brief-analysis.md`](docs/01-brief-analysis.md) | What the brief actually specifies, what it leaves open, and the questions I would have asked the PM. |
| [`docs/02-architecture.md`](docs/02-architecture.md) | Canonical event model, rule matching, and the channel registry that makes the "add more channels later" requirement real. |
| [`docs/03-decision-log.md`](docs/03-decision-log.md) | Every ambiguity in the brief closed by a named decision, with the option I rejected and the cost I accepted. |
| [`docs/04-ai-critique.md`](docs/04-ai-critique.md) | Failure predictions registered before generation, what the agent actually got wrong, and what I rewrote or discarded. |
| [`prompts/prompt-log.md`](prompts/prompt-log.md) | Every prompt used, in order, with the outcome recorded: accepted, edited, or discarded. |

`src/` is the implementation. `notes/` holds scratch material and screenshots.

---

## Running it

> TODO: fill in once the implementation is complete.

Prerequisites, install, environment setup (`.env.example`), how to seed, how to start,
how to trigger an ingestion cycle without waiting for the poll interval, and how to run
the tests.

---

## What works, and what does not

> TODO: fill in at the end, against the definition of done in `docs/00-plan.md`.

The scope boundary, including everything considered and deliberately cut, is in section 6
of the plan. It has not been revised since the first commit.

---

## Timebox

> TODO: record actual time spent and where it went.

Four hours, self-imposed. See section 2 of the plan for the reasoning.