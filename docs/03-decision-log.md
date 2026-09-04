# 03 - Decision Log

Every gap in the brief that blocked the build, closed by a named decision. One entry per
decision, in the order the decisions were forced rather than in order of importance.

Each entry records the option I rejected and the cost I accepted, because a decision with no
rejected alternative and no cost is not a decision, it is a description. Each also records
what would tell me I was wrong, so the entries can be checked later rather than only
admired.

Entries are append-only. If a decision is reversed during the build, the original stays and a
new entry supersedes it.

---

## DL-01 Structured rules, not natural language

**Gap.** The brief says users get notified when "something important" happens but never says
who decides what is important.

**Options.**
1. The system decides. A curated or scored importance feed.
2. The user decides, expressed as a structured rule.
3. The user decides in free text, interpreted by a model into a structured rule.

**Decision.** Option 2. Importance is expressed as `source + attribute + operator + value`
with an optional region filter.

**Why.** Importance is not a property of an event, it is a relation between an event and a
person. A magnitude 4.5 earthquake is unimportant globally and urgent two hundred kilometres
away. Option 1 therefore either hardcodes an editorial opinion or becomes a classification
project, and neither is verifiable inside the timebox. Option 3 is the most impressive demo
available here and the least testable: I cannot write an assertion that pins down what the
model will do with "significant earthquake in Europe", so I would be shipping a core I
cannot check. Option 2 is deterministic, validatable against the source definition, testable
without a model in the loop, and renders directly as a form.

**Cost accepted.** Users must know what they want in the source's own vocabulary. Someone who
wants "important earthquakes" has to learn that magnitude is the dial and pick a number.

**Reversal path.** Option 3 sits cleanly on top rather than replacing this: free text becomes
a rule builder that emits a structured rule the user then confirms. The deterministic engine
stays underneath. Option 1 likewise becomes an additional attribute a rule can filter on, not
a replacement for rules.

**How I would know this was wrong.** If most users create a rule and then never adjust it
after receiving irrelevant alerts, the vocabulary is too foreign and the free-text layer is
needed sooner than I think.

---

## DL-02 Canonical event envelope with an attribute bag

**Gap.** The brief names three domains with no shared schema and then adds "that kind of
thing", so the set is open.

**Options.**
1. A flat event type containing the union of all sources' fields.
2. A separate event type per domain, with the rule engine branching per type.
3. A narrow shared envelope plus a per-source typed attribute map.

**Decision.** Option 3.

**Why.** Option 1 produces a wide sparse record and, worse, invites a fabricated `magnitude:
null` on a news item, which quietly asserts that magnitude is a concept that applies to news.
Option 2 duplicates the engine per domain and breaks the moment a fourth source arrives.
Option 3 keeps the engine domain-agnostic: it evaluates a condition against a map without
knowing what earthquakes are.

Envelope membership has a test, so the line is not arbitrary. A field belongs on the envelope
if a second unrelated source would want it for the same reason. `location` passes, because
region filtering applies to anything with a position. `magnitude` fails.

**Cost accepted.** Attributes are stored as JSON, so there is no index on them and no
compile-time guarantee that `attributes.magnitude` is a number at the comparison site. The
rule engine checks at runtime.

**Reversal path.** A frequently queried attribute can be promoted to a real column once a
specific access pattern justifies it, without changing the envelope.

**How I would know this was wrong.** If most sources end up declaring the same three
attributes, the envelope is too narrow and those attributes should be promoted.

---

## DL-03 Sources declare their own capabilities

**Gap.** Introduced by DL-02, not by the brief. An opaque attribute map means the rule form
cannot know which attributes exist for which source.

**Options.**
1. The rule form branches on source id.
2. Infer available attributes from previously ingested events.
3. Each source ships a declaration of its event types and attributes.

**Decision.** Option 3. `EventSourceDefinition` lists attributes with type, label, and
permitted operators. The form is generated from it.

**Why.** Option 1 relocates source knowledge into the frontend, where it drifts and where
adding a source means editing the UI. Option 2 is self-correcting but useless on an empty
database and unstable in the tail: a rare attribute disappears from the form when it has not
been seen recently. Option 3 means adding an attribute makes it filterable with no frontend
change.

**Cost accepted.** The declaration and the normalizer are two pieces of code with no
compiler-enforced link. They can disagree, and the failure is silent: the form offers a rule
that never matches and no error is raised anywhere.

**Mitigation.** A test that runs each normalizer over a recorded real payload and asserts
every declared key appears in the output. This is registered as a pre-registered risk in
`04-ai-critique.md`, because it is exactly the kind of consistency a generated implementation
gets almost right.

**How I would know this was wrong.** If the declarations start needing conditional logic
(this attribute exists only for some event types of this source), the flat declaration is too
weak.

---

## DL-04 Channel registry, not a switch

**Gap.** The brief's one architectural requirement: flexible enough to add channels later.

**Options.**
1. Branch on channel type in the dispatcher.
2. Adapter interface, adapters registered into a map at startup.

**Decision.** Option 2. The dispatcher resolves an adapter by `channelConfig.channelId` and
never names a concrete channel.

**Why.** Option 1 satisfies the requirement in a demo and fails on first addition, which is
precisely the shortcut worth guarding against. The requirement is only credible if
demonstrated, so the definition of done requires that adding the second adapter touched no
dispatcher code, with the diff linked from the critique log.

The adapter, not the dispatcher, decides whether a failure is retryable. Only the Slack
adapter knows that a 429 is worth retrying and a 404 on a dead webhook is not. Putting that
in the dispatcher would mean the dispatcher understands Slack, which is the coupling being
avoided.

**Cost accepted.** More indirection than two channels strictly need. Justified because
extensibility here is a stated requirement rather than speculation.

**How I would know this was wrong.** If a third adapter needs the dispatcher to change, the
interface is missing something and the abstraction was drawn at the wrong level.

---

## DL-05 Slack via incoming webhook

**Gap.** The brief says Slack and stops.

**Options.**
1. Incoming webhook URL per channel config.
2. Bot token posting to arbitrary channels.
3. Distributed Slack app with OAuth and per-workspace token storage.

**Decision.** Option 1.

**Why.** These are materially different builds, and only option 3 is a product. Within a
four hour budget, option 1 exercises everything the architecture needs to prove: an adapter
with its own config shape, its own validation, its own retryability judgement, and a real
network call that can fail. Options 2 and 3 add OAuth and secret lifecycle without teaching
the design anything new.

**Cost accepted.** Users must create a webhook in Slack themselves and paste the URL. Not
acceptable in a real product, entirely acceptable as an adapter proof.

**Reversal path.** A second Slack adapter registered alongside rather than a rewrite. The
registry makes two Slack adapters no harder than one.

---

## DL-06 Scheduled polling

**Gap.** The brief never says how events are detected, and gives no latency expectation.

**Options.**
1. Polling on an interval.
2. Push, where the source supports it.
3. Both, per source.

**Decision.** Option 1, at a one minute interval, with the source interface shaped so push
can be added later.

**Why.** The chosen live source publishes a polled feed and offers no push, so option 2 is
not available for it and option 3 builds an ingestion path nothing currently uses. Polling
also forces the design to confront duplicates and revisions immediately, which is where the
real correctness work is (DL-07). A push-only design would have hidden it.

**Cost accepted.** Up to one minute of delay, and a request every minute regardless of
activity. Both are fine here and neither is fine for markets, which the brief also mentions.

**Reversal path.** Sources expose `poll()`; a push source calls the same normalizer and the
same ingestion function from a webhook handler. The seam is already there.

**How I would know this was wrong.** The moment a market data source is added. Sub-second
movement does not survive a one minute poll.

---

## DL-07 Deduplication, revision, and when a match is alertable

**Gap.** Not in the brief at all. Forced by using a live source rather than fixtures.

**Context.** A polled feed re-presents the same events every cycle, so the product's defining
behaviour, notifying once when something happens, is wrong by default. The chosen source also
revises records after publication (`updated` moves independently of `time`) and can mark them
withdrawn. So there are three distinct events to handle, not one.

**Decision.** Deduplicate on `(source, sourceEventId)`. Keep a `rule_matches` record per
`(ruleId, eventId)`. Alert on the transition into a matching state, never on remaining in
one.

| Previous state | Now matches | Action |
|---|---|---|
| no record | yes | Record, **alert** |
| matched | yes | Nothing |
| matched | no | Update record, no alert, no retraction notice |
| not matched | yes | Update record, **alert** |
| any | withdrawn | Mark withdrawn, no alert, visible in admin |

**Why.** The fourth row is the substantive product decision: a quake first published at 5.9
and revised to 6.1 alerts a rule set at 6.0, because from the user's point of view a
magnitude 6.1 earthquake happened. The third row prevents a revision from producing a
retraction notice, which would be noise: users act on alerts, and "actually it was 5.8" after
the fact is rarely actionable.

Separating matching from alertability is what makes both testable. `matches()` is a pure
function. Alertability is a transition over stored state.

**Cost accepted.** A `rule_matches` row per rule per matching event, which grows with rules
times events rather than with either alone.

**How I would know this was wrong.** If users report alerts they consider retracted news, the
third row needs revisiting.

---

## DL-08 Admin view scoped by the question it answers

**Gap.** "We need an admin view too" names a solution, not a problem.

**Options.**
1. CRUD over every table.
2. Scope it to one operator question and build only what answers it.

**Decision.** Option 2. The question is "why did this user not get their alert", which is the
actual support burden of any alerting product. Four surfaces: ingested events with status,
rules across users with last match time, delivery attempts with outcome and error, source
health with last successful poll.

**Why.** Option 1 is unbounded and produces screens nobody uses. Scoping to a question makes
the view falsifiable: I can walk a specific failure backwards through it and see whether the
answer is visible.

**Cost accepted.** An admin who wants something else has nothing. Acceptable, since the brief
puts this last and so does the plan.

---

## DL-09 Seeded users, stubbed auth, no tenancy

**Gap.** The brief implies multiple users and an admin role, and specifies neither.

**Decision.** Users are seeded. Identity resolves through a single stub. There is no
organisation concept. `userId` is present on rules and channel configs so the data model does
not have to change when auth arrives.

**Why.** Authentication is well understood and would consume a meaningful share of a four hour
budget while teaching the design nothing. Tenancy is a real modelling decision and adding
`orgId` later beside `userId` is additive.

**Cost accepted.** The admin view is not actually protected. This is stated plainly in the
README rather than left for a reviewer to notice, and it is the first thing I would add.

---

## DL-10 Single application, SQLite via Prisma

**Gap.** Not from the brief. A build decision that shapes what a reviewer has to do to run it.

**Options.**
1. Separate frontend and backend processes.
2. One application with server-side routes.

**Decision.** Option 2, with SQLite on disk. The poller runs as a server-side interval in the
same process.

**Why.** The reviewer's first interaction is `git clone` and a start command. Every piece of
infrastructure between that and a running system is a chance for the submission to fail on
someone else's machine for reasons unrelated to the work. SQLite is a file, so there is no
database to provision. One process means no orchestration.

**Cost accepted.** Ingestion and delivery share a process with request handling, so a hanging
poll delays alerts. No horizontal scaling. Both are consequences of a single-process design
and are listed in the scope boundary rather than discovered later.

**Reversal path.** The dispatcher takes a match rather than a database cursor, so it becomes
a queue consumer without a signature change. That seam was placed deliberately.

## DL-11 Event identity is a set of aliases, not a single id

**Supersedes the deduplication key in DL-07.** That entry stays as written; this one revises
it, per the append-only rule at the top of this document.

**Gap.** Not in the brief, and not in my own design either. Found during implementation, when
the agent read the field definitions and reported a conflict between the source documentation
and DL-07.

**Context.** DL-07 deduplicates on `(source, sourceEventId)` and treats it as stable. The
USGS ComCat documentation says otherwise: the event `id` is the *current preferred* id and
may change over time, and the documentation points explicitly at a separate `ids` field
holding every id associated with the event.

The failure this produces is precise and silent. An event is first published with a preferred
id from one contributing network. Later a different network becomes preferred, and the same
earthquake appears under a new `id`. The unique constraint on `(source, sourceEventId)` does
not fire, because the key genuinely differs. A second event row is inserted, rule matching
runs against it with no prior `rule_matches` record, and the user is alerted a second time
for one earthquake.

This is exactly the class of bug DL-07 exists to prevent. DL-07 prevented it for the case I
imagined (the same key seen twice) and left it open for the case the source actually
produces.

**Options.**
1. Keep the single-id key and accept duplicate alerts on re-association.
2. Find a more stable single field. `net` plus `code` is the obvious candidate, but `net` is
   documented as the *preferred* contributor, so it moves for the same reason `id` does.
   There is no stable single key in this feed.
3. Treat identity as a set. An event carries one or more aliases; two observations are the
   same event if their alias sets intersect.

**Decision.** Option 3.

Sources may return more than one identifier for an event. The canonical envelope carries
`sourceEventIds: string[]`, with the preferred id first. An `event_aliases` table holds one
row per `(source, alias)`, unique, pointing at the event. On ingest:

1. Parse the source's aliases. For USGS this is the `ids` field split on commas, with the
   preferred `id` included. For a source with one identifier it is a single-element array,
   which needs no special case.
2. Look up existing events by any alias.
3. No hit: insert the event and all its aliases.
4. One hit: same event. Apply revision handling per DL-07 and insert any aliases not yet
   recorded.
5. More than one hit: two events previously believed distinct have been associated by the
   source. Keep the earliest-ingested as canonical, record the aliases against it, mark the
   other as merged, and do not alert. A merge is a correction to our own bookkeeping, not a
   new event in the world.

**Why.** Option 1 breaks the product's defining behaviour, notifying once when something
happens, for the same reason missing deduplication would. Option 2 does not exist. Option 3
costs one table and one lookup per event per poll, and it generalises: alias-carrying is
declared per source rather than special-cased for USGS, so a future source with stable single
ids needs no accommodation.

**Cost accepted.** An extra table and an extra query per ingested event. The merge branch in
step 5 is genuinely hard to test against live data, since it depends on the source
re-associating events on its own schedule. It gets a unit test over a constructed pair of
observations rather than a live one, and that limitation is stated rather than hidden.

**Fallback if the timebox bites.** If this does not fit in the remaining budget, the honest
fallback is option 1 with the risk written into the README and the scope boundary, not a
half-built alias table. A documented known defect is a better artifact than an untested
mechanism that appears to handle it.

**How I would know this was wrong.** If merges turn out to be frequent rather than rare, step
5 stops being a bookkeeping correction and becomes a user-visible event that probably
deserves its own handling.

**Provenance.** This was found by the implementing agent reading the field documentation, not
by me, and not by the plan. Recorded here because the process producing that finding is what
the exercise is about: the instruction to verify every field against the provider's own
documentation was written to catch invented fields, and it caught a flaw in my design
instead.