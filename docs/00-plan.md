# 00 - Plan of Attack

Written before any code was generated. Committed on its own so the repository history
shows this plan preceded the implementation rather than rationalising it afterwards.

---

## 1. How I read the brief

The brief is one paragraph from a product manager and contains four requirements that are
easy to restate but hard to specify:

1. Users set up alerts.
2. Alerts fire when "something important" happens in the world.
3. Delivery over email and Slack, with more channels added later.
4. There is an admin view.

Three of these four are underspecified in ways that change the architecture, not just the
feature list. "Something important" has no objective definition. "Happens in the world"
implies an external data source that is never named. "Add more channels later" is the only
sentence in the brief that is actually an architectural constraint, and it is the one I
weight most heavily.

My reading: this is not a request for a news product. It is a request for a rules engine
with pluggable inputs and pluggable outputs. The interesting design work sits in the two
boundaries (ingestion and delivery), not in the UI.

## 2. What I am optimising for

The task description states that the solution itself is not what is being evaluated, and
that the process artifacts are the submission. I am therefore optimising for:

- Legible decisions over feature count.
- A narrow vertical slice that actually runs over a broad set of stubs.
- Explicit, recorded rejection of AI output over a clean final diff.

A deliberate consequence: I would rather ship four working features and a documented list
of eight I chose not to build, than ship twelve half-working ones. Section 6 is that list.

The assignment says to plan for 24 hours; the recruiter indicated roughly three hours of
work is expected. I have budgeted four hours for the exercise and capped it there. If I run
over, I stop and write up what is unfinished rather than continuing.

## 3. Deliverables, and why each one exists

| # | Deliverable | Why it is in scope |
|---|-------------|--------------------|
| D1 | This plan | Explicitly requested. Scoping is part of the evaluation. |
| D2 | Brief analysis and ambiguity register | Makes the gap between brief and spec visible, with each gap closed by a named decision rather than a silent assumption. |
| D3 | Architecture note (data model, event flow, channel abstraction) | The "add channels later" constraint needs a documented answer. |
| D4 | Decision log (ADR style) | The core process artifact. Each entry: context, options, choice, cost accepted. |
| D5 | AI critique log | Explicitly called out as what they pay particular attention to. Pre-registered predictions plus what actually happened. |
| D6 | Full prompt history | Explicitly requested. Kept live during the work, not reconstructed. |
| D7 | Running vertical slice | Evidence that the design survives contact with an implementation. |
| D8 | Tests on the parts that can silently be wrong | Rule matching and deduplication. See section 7. |
| D9 | README as reading order | The submission is a set of documents. Reviewers need an entry point. |

## 4. Order of work, with time budget

The ordering principle is that every step should be able to invalidate the next one.

1. **Ambiguity register and decisions (30 min).** Nothing can be built until "important" has
   an operational definition. Produces D2.
2. **Data model and channel abstraction on paper (30 min).** Cheapest point to be wrong.
   Produces D3.
3. **Skeleton plus one real event source (45 min).** Proves the ingestion boundary against
   a live feed rather than a fixture.
4. **Rule matching plus deduplication, with tests written first (60 min).** The part most
   likely to be quietly broken. See section 7.
5. **Two channel adapters behind one interface (45 min).** The claim in the brief is only
   credible if the second adapter required no change to the dispatcher.
6. **Admin view (30 min).** Deliberately last and deliberately thin.
7. **Write-up and consolidation (30 min).** Reserved, not borrowed from.

## 5. Ambiguity register: the decisions I am making on the PM's behalf

Each of these is a decision the brief left open. Each gets a full entry in the decision log.

**What does "important" mean?**
The system does not decide. Any attempt to encode global importance is either a
classification research project or a hardcoded editorial opinion, and both are out of scope
for a four hour build. Importance is expressed by the user as a rule: source, category,
keyword match, numeric threshold, and region. This turns a subjective product question into
a testable engineering one, and it is defensible in front of the PM because it is the only
version of the feature that can be validated.

**Where does the data come from?**
Sources are pluggable. For the demo I use the USGS earthquake GeoJSON summary feed, which
needs no API key and exposes a numeric attribute users can reason about directly
(`properties.mag`), so threshold rules can be demonstrated without inventing a subjective
severity score. The feed does carry a composite significance value (`sig`) and a categorical
`alert` level, so the choice of magnitude is a deliberate one: magnitude is the attribute a
user can state a threshold for and understand, whereas `sig` is a provider-specific score
whose meaning I would have to explain before anyone could use it. A mock news source sits
alongside it so the architecture does not quietly become an earthquake application.

Using a live feed rather than fixtures is the point. It forces the ingestion layer to handle
real payload shapes, widely nullable fields, stable IDs that recur on every poll, and
records that are revised after first publication.

**How is an event detected?**
Scheduled polling, normalised into a single canonical Event shape at the source boundary.
Push and webhook ingestion are noted as a later extension and are not built.

**What happens when an already seen event changes?**
This is the question the brief cannot answer and a live source forces. USGS revises records
(`updated` moves independently of `time`) and can mark them withdrawn via `status`. So a
quake first reported at magnitude 5.9 may later be revised to 6.1, and a rule set at 6.0 was
correct not to fire at ingestion and would be correct to fire on revision. My decision:
re-evaluate rules on revision and treat a first-time match as alertable, but never re-alert
for a revision that does not cross a threshold it had not already crossed. Withdrawn events
are marked in the admin view and never alert. This is recorded as a product decision, not an
implementation detail, because a reasonable PM could choose otherwise.

**What is in the admin view?**
Rules across all users, delivery attempt log with outcomes, channel health, ingested event
feed. It is an operator tool, not a second product surface.

**Who is the user?**
Single tenant, seeded users, no registration flow. Auth is stubbed with a documented note.

## 6. Scope boundary

Listing what I cut is a deliverable, not an apology. The split below matters because several
of these items are neighbours of things I am building, and I want the line between them to be
explicit rather than left for a reviewer to guess at.

**Built**

- Ingestion from one live source and one mock source, normalised to a canonical Event.
- Deduplication and revision handling across polling cycles.
- Rule storage and matching.
- Channel abstraction with two adapters (email, Slack) behind one registry.
- Retry with bounded backoff on delivery failure.
- Admin view over rules, events, and delivery attempts.

**Considered and cut**

- Distributed delivery idempotency. Dedup at ingestion is a correctness property and is in
  scope. Guaranteeing exactly-once delivery across multiple workers is a different problem
  that only exists once there are multiple workers, and there is one process here.
- Rate limiting, quiet hours, and digest batching. The data model leaves room for them.
- Dead letter queue and a real broker. In-process queue with a documented seam.
- Horizontal scaling and worker distribution.
- Real authentication and authorisation. Stubbed, and the first thing I would add.
- Secret management beyond environment variables, with a note on why channel credentials
  must not be stored in the database.
- Natural language rule entry. The obvious AI-flavoured feature, and the one most likely to
  produce an impressive demo built on an untestable core.
- Further channels (SMS, push, webhook). Two adapters prove the interface; a third proves
  nothing new.

## 7. How I will validate what the AI produces

The default is that the agent writes the code and I review, redirect, and where necessary
rewrite. Rewriting is not a deviation from the exercise; the brief names rejected and
rewritten code as evidence.

Standing checks applied to every generated unit:

- Every suggested package is confirmed to exist at the stated version before install.
- Every external API payload shape is checked against the vendor's own documentation, with
  the link recorded in the critique log. Payload shapes are the highest hallucination risk.
- Generated tests are read for whether they assert on real behaviour or on their own mocks.
  A test that mocks the thing under test is deleted, not fixed.
- The delivered diff is compared against what I asked for, to catch unrequested scope.
- After the agent self-critiques, I verify the critique. A confident and wrong self-review
  is worse than none.

**Pre-registered failure predictions.** Recorded now, before generation, so that the
critique log reports on predictions rather than on hindsight. I expect the agent to omit or
get wrong: deduplication across polling cycles; idempotency on send; rate limiting and alert
storm control; secrets stored in plaintext; retry with backoff and a dead letter path; a
channel abstraction that is a switch statement on channel type rather than a real registry.
The critique log will state which of these occurred, which did not, and what I missed.

The deduplication case is the one I am most concerned about, because it fails silently and
looks fine in a demo. It gets a failing test before the implementation is written.

## 8. Definition of done

- A rule created in the UI produces a delivery attempt visible in the admin log, driven by a
  real ingested event.
- A second channel adapter was added without modifying the dispatcher, and the diff proving
  that is referenced in the architecture note.
- The same event polled twice produces exactly one delivery, and an event revised across a
  rule threshold produces exactly one further delivery. Both covered by tests.
- Every ambiguity in section 5 maps to a decision log entry.
- Every prompt is in the prompt history with its outcome recorded: accepted, edited, or
  discarded, and why.