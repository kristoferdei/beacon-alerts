# Admin console visual design plan

Plan only, per prompt draft 06 Prompt A — no code written. Scope is the visual layer of the
four admin surfaces; no query, route, or data shape changes.

## Ground truth: who this is for

An on-call engineer, at night, mid-incident, answering one question: why did this user not
get their alert. They are scanning many rows looking for the one that explains a specific
failure, then following it backward (delivery → rule / event) or forward (event → rules that
matched it). Density and legibility under speed matter more than visual calm.

## The current view already uses two of the listed defaults

- **All-caps table headers.** `.admin th` sets `text-transform: uppercase`. This is the
  generic "make it look like a data table" move — it reads as loud rather than structured,
  and it's the same trick on every column regardless of whether that column needs shouting
  at.
- **Monospace as a blanket "this is data" signal.** `.mono` is applied to `source`,
  `channelId`, the rule condition string, aliases, and the attributes summary — five
  different kinds of content that don't share a reason to be monospaced. Aliases and raw ids
  genuinely benefit from a fixed-width face (unambiguous `0`/`O`, `1`/`l`/`I`, easy visual
  diffing between two similar ids). A rule condition or a channel name is language, not a
  code, and doesn't.

What I'd do instead for both is below, under Type.

## Colour — layered dark, not near-black-plus-accent

Three surface levels, not one:

| Token | Hex | Use |
|---|---|---|
| `surface-0` | `#12151b` | Page background |
| `surface-1` | `#191d25` | Table shell, header row background |
| `surface-2` | `#222834` | Hover state, the row a cross-link scrolls to |
| `divider` | `#2b313d` | The one hairline used, between header and body only — not a grid |

Not `#000000` (nowhere to layer downward from) and not a single flat `#111111` (no depth).
Depth comes from these three steps, not from borders around every cell.

Foreground, three tiers, none of them pure white:

| Token | Hex | Use |
|---|---|---|
| `text-primary` | `#e6e9ef` | Titles, primary cell content |
| `text-secondary` | `#9aa4b5` | Timestamps, table header labels, helper copy |
| `text-tertiary` | `#6b7385` | Empty-state dashes, deemphasized punctuation |

`#e6e9ef` against `#12151b` is roughly 15:1 — comfortably past body-text contrast, without the
vibration pure `#ffffff` produces on a dark field.

One accent, used for links, focus rings, and the active-route indicator, kept out of the
status vocabulary entirely so it never gets mistaken for a status: `#6ea8fe`.

Status: every value is a hex, every one is paired with a shape/text carrier, never colour
alone, and green/red are separated in lightness as well as hue so a lightness-only (greyscale)
reading still distinguishes them:

| Status | Text | Tint background | Paired marker |
|---|---|---|---|
| Active / sent | `#4ade80` | `#123a1e` | `✓` prefix, filled circle |
| Failed | `#fb7185` | `#3a1420` | `✕` prefix, filled square (different shape, not just colour) |
| Pending | `#fbbf24` | `#3a2e10` | `●` half-tone marker |
| Withdrawn | `#9aa4b5` | `#232834` | `–` prefix (reads as "stopped", not "bad") |
| Merged | `#c4b5fd` | `#2a2140` | `⇄` prefix |

The green (`#4ade80`) and the rose-red (`#fb7185`) are deliberately not the same lightness —
shifting the red toward rose rather than pure red keeps a blue component in it, which is what
actually survives deuteranopia/protanopia compression, not the hue difference alone. The
marker glyph and the status word are the real accessibility guarantee; colour is
reinforcement on top of them, per the brief's own framing.

## Type — two families, used for a reason each

**Primary (everything: headings, labels, body, links).** System UI stack —
`ui-sans-serif, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`. No web font:
this is a local dev/ops tool, and pulling a font from a CDN for it is a dependency-shaped
decision I'm not making silently in a CSS file.

**Secondary (monospace, used narrowly).** `ui-monospace, "SF Mono", "Cascadia Code",
"Roboto Mono", Consolas, monospace` — applied only to event aliases and, if a raw id is ever
shown, that id. Not to source names, channel names, or the rule condition string, which move
to the primary face. This is the direct fix for the second default above: monospace becomes a
statement about the content (an opaque identifier) rather than a costume for "this row is
data."

Scale (a real one, not the framework default), weight doing the work case-transform used to:

| Role | Size | Weight |
|---|---|---|
| Page heading (h1) | 19px | 600 |
| Section heading (h2) | 16px | 600 |
| Body / table cells | 14px | 400 |
| Secondary / muted (timestamps, helper text) | 13px | 400 |
| Table header labels, tag text | 11px | 600 |

Table header labels: 11px, weight 600, `text-secondary`, sentence case (`Occurred at`, not
`OCCURRED AT`). Size, weight, and colour separate it from body content on their own; the case
transform was doing a job the scale should have been doing.

## Layout — how the four surfaces relate, and what happens at 380px

**Chrome.** The persistent top nav gets an active-route indicator (missing today — right now
you can't tell which of the four you're on without reading the page content), rendered as a
bottom border in the accent colour plus a `surface-2` background on the current tab. For a
console someone tabs between constantly mid-incident, this is not decoration.

**Cross-linking.** The existing `tr:target` highlight (landing on a row via an anchor link
from another surface) is redesigned as a `surface-2` background plus a 4px accent-coloured
left bar on that row, so following a delivery attempt back to its event or rule has an
unambiguous landing, not a barely-visible background tint change.

**Density.** Row padding comes down from the current ~10px vertical to ~6px, keeping a
~36–40px row height — enough for a tap target, tight enough that more rows are visible per
screen, which is the actual point of an on-call console.

**Narrow width — a designed answer, not horizontal scroll.** At 380px none of the four
tables fit as a grid, and I'm not treating horizontal scroll as that designed answer: on a
phone, mid-incident, side-scrolling while trying to scan rows fights the exact thing this
console is for. Instead, below a width threshold each table's rows switch from a `<tr>` of
columns to a stacked block per row, with each surface defining what stays on the compact
first line (the fields that matter for scanning) versus what wraps onto a second, labelled
line beneath:

| Surface | Stays on the scan line | Wraps beneath |
|---|---|---|
| Events | title, status tag, occurred-at | aliases, attributes, matched-by |
| Rules | name, enabled, condition | owner, channel, last-matched |
| Deliveries | outcome tag, rule, event | channel, attempt #, error |
| Sources | name, event count | last activity |

Deliveries puts the outcome tag first, not last as it is today, because outcome is the
specific thing being scanned for on that surface.

## Principle

This console optimises for one person, at one moment, scanning many rows to find the single
one that explains a specific delivery failure, and then walking it backward or forward through
the other three surfaces — not for someone admiring an overview, so every choice above
(density, status legibility, the redesigned cross-link landing) serves that one task rather
than a reusable "clean dashboard" look.

## Quality floor

- **380px:** the stacked-row reflow above, not overflow.
- **Keyboard focus:** a `:focus-visible` ring — 2px solid `#6ea8fe`, 2px offset — on every
  link and interactive element, so it appears for keyboard navigation without a permanent
  outline on every mouse click.
- **`prefers-reduced-motion`:** the only motion in this plan is the target-row landing and the
  active-nav indicator; both become instant (no transition) under
  `prefers-reduced-motion: reduce`.
- **Contrast:** body text against `surface-0` is ~15:1. Each status pairing above is chosen so
  its text colour clears 4.5:1 against its own tint background, not just against the page
  background — status text is content, not decoration, and needs to survive being read at
  4am.

No CSS framework, no component library, no icon package — the status markers above are plain
characters, not an icon set.

## One thing I'm flagging rather than deciding

`src/app/page.tsx` (the root landing page) currently imports `admin.css` and reuses the
`.admin` wrapper class to get the same plain styling, per an earlier request to match it. If
this dark console redesign lands under the same `.admin` class, the landing page goes dark
with it as a side effect, unasked. I'd scope the new dark styles under their own class (e.g.
`.console`) so the landing page keeps its current light treatment unless told otherwise —
flagging this now since it's a real decision, not one to make silently in the build step.
