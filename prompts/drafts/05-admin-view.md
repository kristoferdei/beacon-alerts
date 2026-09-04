# Prompt draft 05: admin view

Step 6 of the plan, and the brief's fourth requirement. Deliberately last, matching the "too"
at the end of the brief and the ordering in `00-plan.md`.

Scoped read-only on purpose. DL-08 frames this as a tool answering one operator question
rather than a second product surface, and a read-only view is the smallest thing that can
answer it.

---

## Prompt

> Read `docs/03-decision-log.md` DL-08 before starting. It scopes this view by the question
> it answers, not by the data available. Do not edit any document.
>
> Build a read-only admin view. Four surfaces, reachable from one page or a small set of
> pages, your choice:
>
> 1. **Ingested events**: title, source, occurred at, status (active, withdrawn, merged),
     >    aliases, and the attributes. Most recent first.
> 2. **Rules**, across all users: name, source, the condition in readable form
     >    (`magnitude >= 2.5`), owner, channel, enabled, and when it last matched.
> 3. **Delivery attempts**: which rule, which event, which channel, attempt number, outcome,
     >    and the error when there is one. Most recent first.
> 4. **Source health**: each registered source, when it was last polled successfully, and how
     >    many events it has produced.
>
> The question this has to answer is "why did this user not get their alert". Someone should
> be able to start from a delivery attempt and walk backwards to the event and the rule, or
> start from an event and see which rules matched it. Make that path work. If a link between
> two of these surfaces would make that walk possible, add it.
>
> Read-only. No create, edit, delete, or enable/disable controls. No authentication, which is
> stubbed per DL-09 and stated as a known gap.
>
> Server-rendered from the database. Do not add a UI library, a component library, a CSS
> framework, or a data-fetching library. Plain React server components and plain CSS. If you
> think something is genuinely needed, stop and ask.
>
> Keep it clean and readable: legible type, aligned columns, adequate spacing, clear
> distinction between a heading and a value, and a visible difference between a sent and a
> failed delivery attempt. Do not decorate it. A plain, well-set table is the target, not a
> dashboard.
>
> Handle the empty state: before a cycle has run, every surface has no rows, and it should
> say so rather than rendering an empty table.
>
> Do not change any existing test, the ingestion logic, the dispatcher, or the schema. If you
> need a field the schema does not have, stop and tell me rather than adding one.
>
> When done, tell me which routes exist and run the full suite.
>
> End with the three sections from `CLAUDE.md`.

---

## What I am checking

| Check | Prediction |
|---|---|
| Read-only. No mutation controls anywhere | P12 |
| Scoped to the DL-08 question, not CRUD over every table | P12 |
| The backwards walk from a delivery attempt to its rule and event actually works | P12 |
| No UI or CSS framework added without asking | P8, P11 |
| Schema, ingestion, dispatcher and tests untouched | P11 |
| Empty states handled rather than rendering blank tables | - |

Active check: load it against a fresh database before running a cycle, then again after. The
first state is the one that never gets tested and the one a reviewer will see first if they
follow the README in order.