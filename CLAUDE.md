# CLAUDE.md

## What this is

An alerting system built from a vague one-paragraph brief. This is a take-home exercise
where **the process is what is evaluated, not the solution**. Documentation and traceability
matter more than feature count.

## Read these first

- `docs/00-plan.md` - scope, ordering, timebox, and what is deliberately not being built
- `docs/02-architecture.md` - canonical event model, rule engine, channel registry
- `docs/03-decision-log.md` - DL-01 to DL-10, the decisions these documents encode

These are authoritative. **Do not edit anything in `docs/`.** If you believe a document is
wrong, say so and stop; I will decide. `docs/00-plan.md` is frozen: it was committed before
implementation and its value depends on not having been revised.

## Hard rules

1. **Never implement anything in the cut list** (`docs/00-plan.md` section 6). Throttling,
   digests, natural language rules, dead letter queues, tenancy, real auth, extra channels.
   If one seems necessary, say so and stop.
2. **Do not modify `package.json` without permission.** You may propose dependencies: name
   them, say why, and state that you have confirmed each exists at the version proposed and
   how you confirmed it. Collect proposals and raise them together at the end of a step
   rather than halting at each one.
3. **Never invent an external API's fields.** For any field taken from an external feed,
   record in your response where in the provider's documentation it is defined, with the URL.
   That belongs in the response, not repeated as comments throughout the code. If you are not
   sure a field exists, say so rather than producing a plausible name.
4. **Never put secrets in the database.** Channel configs store a destination and a reference
   to an environment variable, never a webhook URL or credential value.
5. **Never write a test that mocks the unit under test.** Every test must be able to fail if
   the implementation were deleted.
6. **Do only what was asked.** No unrequested extras, no adjacent improvements, no
   refactoring of code outside the request. If you spot something worth doing, list it at the
   end instead of doing it.
7. **Do not make decisions for me, and do not make one look pre-decided.** If the
   implementation needs a decision not covered by DL-01 to DL-10, stop and ask. Never edit
   the decision log to accommodate an implementation choice. This includes small ones: a
   library name inside a type definition is a technology decision wearing a technical
   detail's clothes, and one of those has already slipped through once (see C3 in
   `docs/04-ai-critique.md`).

## Conventions

- TypeScript, `strict: true`. No `any`, no non-null assertions without a comment saying why.
- Named exports. No default exports outside framework-required files.
- Errors surface. No empty catch blocks, no swallowed promise rejections.
- A missing or absent value is a normal case to handle, not an exception to throw. Rule
  evaluation against an attribute an event does not carry is a non-match, not an error.

## Every response ends with

- **Assumptions**: anything you decided that was not specified.
- **Uncertain**: anything you were not confident about, especially external API shapes.
- **Not done**: anything you noticed but deliberately left alone.

Write these even when the list is empty. They feed the critique log, and an empty section is
information too.