# 02 - Architecture

The shape of the system, and the reasoning behind the two boundaries that matter. Decisions
referenced as DL-nn are recorded in full in `03-decision-log.md`.

---

## 1. Shape

```
  Event Sources                          Source Definitions
  ┌──────────────┐                       (declared capabilities)
  │ USGS         │                                │
  │ Mock News    │                                │
  └──────┬───────┘                                │
         │  poll                                  │  drives the rule form
         ▼                                        ▼
  ┌──────────────┐                          ┌──────────┐
  │ Normalizer   │  per source              │  Rule UI │
  └──────┬───────┘                          └────┬─────┘
         │  canonical Event                      │
         ▼                                       ▼
  ┌──────────────────────┐               ┌──────────────┐
  │ Ingestion            │               │ Alert Rules  │
  │ new / revised / gone │               └──────┬───────┘
  └──────┬───────────────┘                      │
         │                                      │
         └──────────────┬───────────────────────┘
                        ▼
                 ┌─────────────┐
                 │ Rule Engine │  match, and decide if this match is alertable
                 └──────┬──────┘
                        ▼
                 ┌─────────────┐
                 │ Dispatcher  │  looks adapters up in a registry
                 └──┬───────┬──┘
                    ▼       ▼
                 Email    Slack        (+ future adapters, registered not branched)
```

Two extension points, at the two ends. Everything between them is fixed. The brief only
asked for flexibility at the delivery end; I treat the ingestion end the same way, for the
reason set out in `01-brief-analysis.md` section 3.

## 2. Canonical event

Sources have nothing in common. An earthquake has a magnitude and no category. A news item
has a category and no magnitude. Forcing both into one flat type produces either a wide
sparse record or, worse, a fabricated magnitude on a news event.

So: a narrow envelope that every source can honestly fill, plus a typed attribute bag for
everything domain-specific (DL-02).

```ts
type CanonicalEvent = {
  id: string              // ours
  source: string          // 'usgs' | 'mock-news'
  sourceEventId: string   // theirs, stable, the dedup key
  type: string            // 'earthquake' | 'breaking-news'
  occurredAt: string      // ISO 8601, when it happened
  ingestedAt: string      // when we first saw it
  revisedAt: string | null// source's own last-modified, drives revision detection
  status: 'active' | 'withdrawn'
  title: string
  location: Location | null
  attributes: Record<string, AttributeValue>
}

type Location = { lat: number; lon: number; label: string | null }
type AttributeValue = number | string | boolean
```

`location` sits on the envelope rather than in `attributes` because region filtering applies
to every source that has a position at all, and is not domain knowledge. That is the test I
use for envelope membership: if a second, unrelated source would want the same field for the
same reason, it belongs on the envelope.

Normalized USGS event:

```json
{
  "source": "usgs",
  "sourceEventId": "us7000abcd",
  "type": "earthquake",
  "occurredAt": "2026-09-03T14:22:11.000Z",
  "revisedAt": "2026-09-03T14:41:02.000Z",
  "status": "active",
  "title": "M 6.1 - 84 km SW of Example",
  "location": { "lat": -15.42, "lon": -172.9, "label": "84 km SW of Example" },
  "attributes": { "magnitude": 6.1, "magnitudeType": "mww", "tsunami": false, "significance": 571 }
}
```

Normalized mock news event, with no fabricated magnitude:

```json
{
  "source": "mock-news",
  "sourceEventId": "news-1042",
  "type": "breaking-news",
  "occurredAt": "2026-09-03T09:05:00.000Z",
  "revisedAt": null,
  "status": "active",
  "title": "Central bank holds rates",
  "location": null,
  "attributes": { "category": "markets", "headline": "Central bank holds rates" }
}
```

## 3. Source capability metadata

An opaque attribute bag creates a problem the flat model did not have: the rule form cannot
know that `magnitude` exists for USGS and `category` exists for news. Branching on source id
inside the UI would solve it and would also relocate source knowledge into the frontend,
where it rots.

Instead each source declares what it produces (DL-03):

```ts
type AttributeDefinition = {
  key: string
  label: string
  type: 'number' | 'string' | 'boolean'
  operators: RuleOperator[]
  unit?: string
}

type EventSourceDefinition = {
  id: string
  name: string
  eventTypes: string[]
  supportsLocation: boolean
  attributes: AttributeDefinition[]
}
```

The rule form is generated from this. Adding an attribute to a source makes it filterable
with no frontend change.

**The failure mode this introduces, and the guard.** The definition and the normalizer are
two separate pieces of code with no compiler-enforced link between them. If the normalizer
emits `sig` while the definition declares `significance`, the UI offers a rule that can
never match. Nothing throws. No alert arrives, and the cause is invisible.

Guard: a test that runs every source's normalizer over a recorded real payload and asserts
that every key declared in its definition is present in the output. Cheap, and it catches
the whole class. Recorded in `04-ai-critique.md` as a pre-registered risk.

## 4. Rules

```ts
type RuleOperator = '>' | '>=' | '<' | '<=' | '==' | '!=' | 'contains'

type AlertRule = {
  id: string
  userId: string
  name: string
  source: string
  eventType: string | null      // null = any type from this source
  attribute: string
  operator: RuleOperator
  value: number | string | boolean
  region: RegionFilter | null   // optional, envelope-level
  channelConfigId: string
  enabled: boolean
}

type RegionFilter = { lat: number; lon: number; radiusKm: number }
```

Structured, not natural language (DL-01). Deterministic, validatable against the source
definition, testable without a model in the loop, and renderable as a form. Natural language
entry is the obvious impressive feature here and is deliberately out of scope, because its
correctness cannot be asserted in a test.

**One condition per rule, by choice not by omission.** This shape cannot express
`magnitude >= 6.0 AND tsunami == true`. Two rules are needed, which means two alerts. That
is a real limitation and I am accepting it for the timebox. The extension path is to replace
the three condition fields with `conditions: Condition[]` evaluated as a conjunction, which
is additive: existing single-condition rules migrate to a one-element array. The matcher is
written as `evaluate(condition, event)` with a caller that happens to pass one condition, so
the change is localised to the caller.

## 5. Matching, and when a match is alertable

Matching and alerting are separate questions. A rule can match the same event on every poll
forever; it should alert once.

```
matches(rule, event) =
     event.source === rule.source
  && (rule.eventType === null || event.type === rule.eventType)
  && event.status === 'active'
  && evaluate(rule.attribute, rule.operator, rule.value, event.attributes)
  && (rule.region === null || withinRadius(event.location, rule.region))
```

A `rule_matches` record is kept per `(ruleId, eventId)`. The transition table (DL-07):

| Previous state | Now matches | Action |
|---|---|---|
| no record | yes | Record match, **alert** |
| no record | no | Nothing |
| matched | yes | Nothing. Already alerted. |
| matched | no (revised below threshold) | Update record. No alert, no retraction notice. |
| not matched | yes (revised across threshold) | Update record, **alert** |
| any | event withdrawn | Mark withdrawn. No alert. Visible in admin. |

The interesting row is the fifth. A quake first published at 5.9 and revised to 6.1 should
alert a rule set at 6.0, because from the user's point of view a magnitude 6.1 earthquake
happened. The row above it is the one that prevents a revision storm from re-alerting.

Missing attributes evaluate to no match, never to an error. A rule referencing an attribute
a particular event does not carry is not a failure, it is a non-match.

## 6. Channels

The brief's one architectural requirement. The standard way to fail it is a switch on
channel type in the dispatcher, which passes a demo and breaks on first addition.

```ts
type ChannelAdapter = {
  id: string
  validateConfig(config: ChannelConfig): ValidationResult
  send(payload: NotificationPayload, config: ChannelConfig): Promise<SendResult>
}

type ValidationResult = { ok: true } | { ok: false; errors: string[] }
type NotificationPayload = { title: string; body: string; eventUrl: string | null }
type SendResult = { ok: true; providerRef?: string } | { ok: false; retryable: boolean; error: string }
```

Adapters own the validation of their own config, checked when a channel config is saved
rather than at send time. The interface says nothing about how that validation is
implemented; picking a validation library is an implementation decision and belongs in the
decision log at the point it is actually made, not here.

Adapters are registered into a map at startup. The dispatcher resolves by
`channelConfig.channelId` and never names a concrete channel (DL-04).

The claim is only credible if it is demonstrated, so the definition of done in `00-plan.md`
requires that adding the second adapter touched no dispatcher code, and the diff proving it
is linked from `04-ai-critique.md`.

`retryable` is the adapter's judgement, not the dispatcher's. Only the adapter knows that a
Slack 429 is worth retrying and a 404 on a dead webhook is not. Putting that knowledge in the
dispatcher would mean the dispatcher understands Slack, which is the coupling being avoided.

Slack is via incoming webhook (DL-05): a URL per channel config, no OAuth, no workspace token
storage. A distributed Slack app is a different project.

## 7. Delivery

Every send produces a `delivery_attempt` row before the network call, not after, so a crash
mid-send leaves evidence rather than silence.

Retry is bounded: three attempts, exponential backoff, only when the adapter says
`retryable`. After that the attempt is marked `failed` and surfaces in the admin view. There
is no dead letter queue and no distributed idempotency, both cut in `00-plan.md` section 6.
Dedup happens at ingestion, where it is a correctness property. Exactly-once delivery across
workers is a different problem that does not exist while there is one process.

Channel configs store a destination and a reference to a secret, never the secret. Slack
webhook URLs and SMTP credentials come from the environment. A generated implementation that
puts them in the database is rejected on sight, and this is one of the pre-registered
predictions.

## 8. Persistence

SQLite via Prisma. One process, one file, no infrastructure to stand up before a reviewer can
run it.

| Table | Purpose |
|---|---|
| `users` | Seeded. No registration flow (DL-09). |
| `events` | Canonical events. Unique on `(source, sourceEventId)`, the dedup key. |
| `alert_rules` | User rules. |
| `rule_matches` | One row per `(ruleId, eventId)`. Drives the table in section 5. |
| `channel_configs` | Per-user channel destination plus secret reference. |
| `delivery_attempts` | Every send, its outcome, and its attempt number. |

Source definitions live in code, not the database. They are a property of the deployed
adapter, and a definition in the database could describe a source the running code cannot
produce.

`attributes` is stored as JSON. The cost is honest: no index on magnitude, so a query like
"every event above 6.0" is a scan. Acceptable at this scale and for this purpose, and the
migration path is a promoted column once a specific access pattern justifies it.

## 9. Admin view

Scoped by asking what decision it supports rather than what data exists (DL-08). The question
it answers is "why did this user not get their alert", which is the actual support burden of
any alerting product.

Four surfaces: ingested events with status, rules across all users with last-match time,
delivery attempts with outcome and error, and source health showing last successful poll.

Deliberately last in the build order, matching the "too" at the end of the brief.

## 10. Seams

Where the things that were cut would go, so that cutting them is a decision rather than a
corner the design has painted itself into.

| Cut | Seam |
|---|---|
| Message broker | The dispatcher is called with a match, not with a database cursor. It becomes a queue consumer without changing its signature. |
| Push ingestion | Sources expose `poll()`; a webhook source calls the same normalizer and the same ingestion function. |
| Multi-condition rules | `evaluate(condition, event)` already takes one condition. The caller loops. |
| Throttling and digests | Between the rule engine and the dispatcher. Nothing else changes. |
| Tenancy | `userId` is on rules and channel configs. An `orgId` beside it is additive. |
| Auth | A single stubbed identity resolver. |

## 11. What this design makes harder

Every choice costs something, and stating the costs is more useful than defending them.

- **Attribute queries are slow and untyped.** JSON storage means no index and no compile-time
  guarantee that `attributes.magnitude` is a number at the point of comparison. The rule
  engine has to check at runtime.
- **Two places describe a source.** The definition and the normalizer must agree, enforced by
  a test rather than by the type system. A single generated-from-schema source of truth would
  be better and is more work than the timebox allows.
- **Single-condition rules push complexity to the user.** Wanting two conditions means two
  rules and two alerts.
- **Polling has a floor on latency and a ceiling on politeness.** A one-minute interval means
  up to a minute of delay and a request every minute regardless of activity.
- **Everything is one process.** No horizontal scaling, and an ingestion cycle that hangs
  delays delivery.