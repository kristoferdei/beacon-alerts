# 01 - Brief Analysis

What the brief specifies, what it only implies, what it omits, and the questions I would
have put to the product manager if asking were an option.

This document does not contain decisions. It contains the gaps. Each gap is closed by a
numbered entry in `03-decision-log.md`, and the mapping is in section 6 below. Keeping the
two apart is deliberate: I want the size of the specification gap to be visible on its own,
before any of it is papered over by my own choices.

---

## 1. The brief

> "We want users to be able to set up alerts so they get notified when something important
> happens in the world, like breaking news, market movements, natural disasters, that kind
> of thing. Should work for both email and Slack. Make it flexible enough so we can add
> more channels later. We need an admin view too."

Fifty-six words. Roughly a dozen distinct requirements are recoverable from it, depending
on how you read three phrases.

## 2. Sentence by sentence

| Fragment | What it states | What it does not state |
|---|---|---|
| "users ... set up alerts" | Alerts are user-configured, not globally curated. Users are plural, so there are multiple of them with separate configuration. | Whether users are self-serve or provisioned. Whether one user's rules are visible to another. Whether there is any notion of an organisation. |
| "get notified when" | Delivery is triggered by an event, not requested by the user. This is push, not a feed. | Latency expectation. Whether near-real-time or a periodic digest is acceptable. |
| "something important happens" | There is a filtering step between raw events and delivered alerts. | Who decides importance: the user, the system, or the source. This is the single largest gap in the brief. |
| "in the world" | Events originate outside the product. There is at least one external data source. | Which sources. How many. Whether the set is fixed or grows. |
| "breaking news, market movements, natural disasters" | Three example domains with no shared schema. News has no magnitude, markets have no location, disasters have both. | Whether these three are the requirement or three examples of an open set. |
| "that kind of thing" | The set of domains is open, not closed. | Where it stops. |
| "both email and Slack" | Two delivery channels at launch. Email is one-to-one, Slack is one-to-many and needs a destination. | Slack integration style: incoming webhook, bot token, or app. These are materially different builds. |
| "flexible enough so we can add more channels later" | An explicit architectural constraint on the delivery boundary. | Which channels are anticipated. Whether "later" means next sprint or next year. |
| "an admin view too" | An operator surface exists and is distinct from the user surface. | Who the admin is, what they need to do, and whether "admin" means support, ops, or engineering. |

## 3. The four phrases doing the most work

**"something important."** The brief presents this as a property of the event. It is not. It
is a relation between an event and a person. A magnitude 4.5 earthquake is unimportant
globally and extremely important two hundred kilometres away. Any design that treats
importance as intrinsic will either hardcode an editorial opinion or require a
classification model, and neither is testable in the time available. Read as a relation, the
requirement becomes a rules engine, which is buildable and verifiable.

**"that kind of thing."** Three named domains would let me build three purpose-shaped
pipelines. An open set does not. This phrase quietly makes the ingestion boundary as
important as the delivery boundary, even though only the delivery boundary is called out as
needing flexibility. I treat both as pluggable, and I consider this the single most useful
inference available from the brief.

**"flexible enough ... later."** The only sentence that constrains the architecture rather
than the feature set, and therefore the one I weight most heavily. It is also the easiest
requirement to fake: a switch statement on channel type satisfies it in a demo and fails on
the first real addition. I hold it to a testable standard instead, stated in the definition
of done in `00-plan.md`.

**"an admin view too."** The word "too" places this last in the PM's own priority order, and
I have kept it last in mine.

## 4. Present by implication, never stated

- **Persistence.** Rules must survive restarts, and detecting that an event is new requires
  remembering the ones already seen.
- **Deduplication.** Not mentioned anywhere, and unavoidable. Any polled source re-presents
  the same events on every cycle. Without it the product's defining behaviour, notifying
  once when something happens, is simply wrong.
- **Revision.** Real sources correct themselves after publication. The brief has no concept
  of an event changing after it is first seen.
- **Failure.** Email and Slack both fail intermittently. The brief has no unhappy path.
- **Volume.** "Notified when something important happens" implicitly assumes importance is
  rare. Nothing enforces that. A badly configured rule against a busy source is an alert
  storm, and the brief offers no protection.
- **Credentials.** Slack delivery needs a destination and a secret per user or per workspace.
  The brief mentions neither.

## 5. Questions for the product manager, ranked by blast radius

Ranked by how much the answer would change what gets built, not by how interesting they are.
The first three are the ones I would insist on before writing code.

1. **Who decides what is important, the user or us?** Changes the product category. A rules
   engine and a curated importance feed share almost no code.
2. **Are news, markets, and disasters the requirement, or examples?** Determines whether the
   ingestion layer is three adapters or an extension point.
3. **Which Slack integration?** Incoming webhook is an afternoon. A distributed Slack app
   with OAuth and per-workspace token storage is not.
4. **Who is the admin, and what decision are they trying to make?** "Admin view" is a
   solution, not a problem. Support answering "why did I not get my alert" needs a delivery
   log. Ops needs source health. These are different screens.
5. **How late is too late?** Distinguishes push ingestion from polling, and sets the poll
   interval.
6. **What happens when a user's rule matches two hundred times an hour?** Determines whether
   throttling and digests are launch requirements or later work.
7. **Do users belong to organisations?** Determines whether the data model needs a tenancy
   concept now or can take it later.
8. **If a source revises an event after we alerted on it, does the user hear about it
   again?** The question nobody thinks to ask until a live feed forces it.

## 6. Gaps mapped to decisions

Every question above that blocks the build is answered by me, on the record, rather than
left implicit. The answers live in `03-decision-log.md` and are cross-referenced here so it
is clear that nothing was quietly skipped.

| Gap | Resolved in |
|---|---|
| Who defines importance | DL-01 Structured user-defined rules |
| Open set of domains | DL-02 Pluggable sources, canonical event envelope |
| Heterogeneous source fields | DL-03 Source capability metadata |
| Channel flexibility | DL-04 Channel registry with adapter interface |
| Slack integration style | DL-05 |
| Detection mechanism and latency | DL-06 |
| Duplicate and revised events | DL-07, deduplication key superseded by DL-11 |
| Admin view purpose | DL-08 |
| Tenancy and identity | DL-09 |
| Alert volume | Considered and cut, `00-plan.md` section 6 |

Two later entries in the decision log do not appear above, because they do not resolve a gap
in the brief. DL-10 records a build decision (a single application on SQLite) that shapes what
a reviewer has to do to run it. DL-11 was forced during implementation, when the source's own
documentation contradicted the deduplication key I had specified in DL-07. Neither could have
been anticipated from reading the brief, which is a useful reminder that this analysis maps
only the gaps a careful reading can find.

## 7. What I would tell the PM

That the brief is one product question wearing the costume of a feature request, and the
question is whether the user or the system decides what matters. Everything else follows
from the answer. I have answered it in the user's favour, because that is the version that
can be validated, shipped incrementally, and later augmented with system-side importance
scoring as an additional input to a rule rather than a replacement for one.