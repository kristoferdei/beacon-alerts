# Prompt draft 06: admin view visual layer

Not in the original plan. Added because the role is a frontend position and four unstyled
tables, however honest, show none of the judgement the job is about. The functional scope
does not change: this is the visual layer only, and no query, route, or data shape moves.

Two passes on purpose. The design plan is reviewed before any code exists, for the same
reason the failing tests came before the implementation: it is the cheapest point at which
being wrong costs nothing. The returned plan goes in `notes/` as an artifact.

---

## Prompt A: the plan

> Redesign the visual layer of the admin view. **Plan first. Do not write any code until I
> approve the plan.**
>
> The subject is an operations console. The person using it is on call and is answering one
> question: why did this user not get their alert. They are scanning, not reading. Density is
> a feature here, not a compromise. Ground the design in that, not in a generic dashboard.
>
> Give me a compact plan covering:
>
> **Colour.** Dark surface, deliberately: this is an on-call console and it gets looked at at
> night. But not near-black with one acid accent, which is the default generated answer. Give
> me a layered dark palette: at least two surface levels so tables get depth without borders
> everywhere, plus muted foreground tiers for primary and secondary text. Status colours must
> survive on a dark surface and must not be the only carrier of meaning. Name every value as
> a hex.
>
> On dark surfaces specifically: do not use pure white for body text, it vibrates against a
> dark field. Do not use pure black as the base, it leaves nowhere to layer downward. Green
> and red status markers need enough lightness separation to read for someone with red-green
> colour blindness, so pair them with shape or text rather than relying on hue.
>
> **Type.** One or two families, chosen deliberately, with a stated scale and intentional
> weights. Not the framework default. If you use two, make them clearly distinct.
>
> **Layout.** How the four surfaces relate to each other, and what a wide table does when it
> does not fit. Horizontal overflow is an answer only if it is a designed one.
>
> **Principle.** One sentence on what makes this specific to this console rather than
> reusable for any dashboard.
>
> Avoid the following, because they are defaults rather than choices: all-caps labels;
> monospace used as a way of signalling "this is data"; identical rounded cards with the same
> soft shadow; gradient washes as decoration; tinted near-black standing in for black; arrows
> appended to link text; hover transitions on everything.
>
> **The current view already uses two of these.** Say which, and what you would do instead.
>
> Quality floor, non-negotiable in the build: works down to 380px, visible keyboard focus,
> respects `prefers-reduced-motion`, sufficient contrast throughout.
>
> No CSS framework, no component library, no icon package. Plain CSS.
>
> Write the plan to `notes/design-plan.md` as well as showing it to me.

---

## Prompt B: the build, after approving the plan

> Build the approved plan. Visual layer only.
>
> Do not change any query, route, data shape, or test. If the design needs a field the pages
> do not currently load, stop and tell me rather than adding a query.
>
> Every surface must work at 380px, including the four tables. Keep the empty states: they
> are the first thing a reviewer sees, and they should read as an instruction rather than as
> an absence.
>
> When done, tell me what you would remove if you had to remove one thing.
>
> End with the three sections from `CLAUDE.md`.

---

## What I am checking

| Check | Why |
|---|---|
| The plan names both existing defaults (all-caps labels, monospace data) unprompted by me pointing at them | Whether it can critique its own prior output |
| Palette has real surface layering, not one background plus an accent | The default answer to "dark console" |
| Status is not carried by hue alone | Accessibility, and the reason I asked |
| Tables have a designed answer at 380px, not accidental overflow | The job description names responsive design |
| Keyboard focus visible, reduced motion respected | Quality floor |
| No framework, no component library, no icon package added | P8, P11 |
| No query, route, or test touched | P11 |

Active checks after the build: tab through a full page and confirm focus is always visible;
load every surface at 380px; load with an empty database, which is the state a reviewer sees
first and the one that never gets tested.