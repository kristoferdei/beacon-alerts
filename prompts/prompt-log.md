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

<!-- Entries appended here. -->