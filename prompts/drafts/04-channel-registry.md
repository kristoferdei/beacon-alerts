# Prompt draft 04: channel registry and adapters

Step 5 of the plan. The brief's one stated architectural requirement, and the one the
definition of done in `00-plan.md` makes a checkable claim about: adding the second adapter
must touch no dispatcher code.

**Structured as two prompts on purpose.** If both adapters arrive in one diff, the claim is
unprovable: I can inspect the dispatcher and believe it, but I cannot point at anything. Ask
for the email adapter and the dispatcher first, commit, then ask for Slack alone. The diff of
that second commit either touches the dispatcher or it does not, and the git history settles
it without anyone taking my word for it.

---

## Prompt A: registry, dispatcher, email adapter

> Read `docs/02-architecture.md` section 6 and `docs/03-decision-log.md` DL-04 and DL-05
> before starting. Do not edit any document.
>
> Implement the channel abstraction with one adapter.
>
> **1. The adapter interface** exactly as section 6 specifies: `id`, `validateConfig`, and
> `send`. `SendResult` carries `retryable` on failure, and that judgement belongs to the
> adapter. The dispatcher must never inspect a provider's error codes.
>
> **2. A registry.** Adapters are registered into a map at startup. The dispatcher resolves
> by `channelConfig.channelId` and must not name any concrete channel anywhere. No switch, no
> if-chain on channel type, no imports of a specific adapter inside the dispatcher module.
>
> **3. The email adapter.** Do not add an SMTP library. Write it against a small internal
> transport interface and provide a logging implementation that records what would have been
> sent. A real transport is a later substitution, and I do not want a dependency decision
> buried in this step.
>
> **4. The dispatcher.** Takes a match and a channel config, resolves the adapter, calls
> `send`, and records a `delivery_attempt` row **before** the network call, not after, so a
> crash mid-send leaves evidence. Retry is bounded at three attempts with exponential
> backoff, and only when the adapter reported `retryable`. After that the attempt is marked
> failed.
>
> **5. Secrets.** Channel configs hold a destination and the *name* of an environment
> variable, never a secret value. The adapter reads the environment. If you find yourself
> wanting to store a webhook URL or a password in the database, stop and tell me.
>
> **6. Tests.** Cover: an adapter resolved from the registry is the one called; a retryable
> failure is retried up to the bound and then marked failed; a non-retryable failure is not
> retried at all; a delivery attempt row exists even when the send throws. Do not mock the
> dispatcher itself. A stub adapter that records its calls is fine and is not the unit under
> test.
>
> Do not write the Slack adapter. I will ask for it separately, and the point of asking
> separately is to see whether adding it changes anything here.
>
> Do not build the polling loop or any UI.
>
> When done, run the full suite and show me the output.
>
> End with the three sections from `CLAUDE.md`.

---

## Prompt B: Slack adapter, after committing A

> Add a Slack adapter using an incoming webhook per DL-05, registered alongside the email
> adapter.
>
> The webhook URL comes from the environment variable named in the channel config, never from
> the database.
>
> Slack-specific retryability lives in the adapter: a 429 or a 5xx is retryable, a 404 on a
> dead webhook is not. The dispatcher must not learn anything about Slack.
>
> **Do not modify the dispatcher or the registry.** If you cannot add this adapter without
> touching either, stop and tell me what is missing from the interface. That answer is more
> valuable to me than a working adapter, because it would mean the abstraction is drawn in
> the wrong place and the requirement in the brief is not actually met.
>
> Add tests mirroring the email adapter's, plus one asserting the adapter's own retryability
> classification.
>
> When done, show me `git diff --stat` as well as the test output.

---

## What I am checking

| Check | Prediction |
|---|---|
| No concrete channel named in the dispatcher, and no import of one | P3 |
| Prompt B's diff does not touch the dispatcher or the registry | P3 |
| No secret-shaped column, no webhook URL in the database | P4 |
| Retryability comes from the adapter, not from the dispatcher | P5 |
| Retry is bounded, and non-retryable failures are not retried | P5 |
| No SMTP or Slack SDK added without being asked for | P8 |
| The delivery attempt row precedes the send | P5 |
| Tests use a recording stub, not a mock of the dispatcher | P9 |

The claim in the definition of done is settled by the second commit's diff, not by my
reading of the code. If it touches the dispatcher, the requirement is not met and I say so
rather than explaining why it nearly is.