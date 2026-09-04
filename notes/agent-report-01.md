# Agent report 01 — scaffold + USGS source

Written after: scaffold, Prisma schema, `EventSourceDefinition`/normalizer for USGS, fixture,
guard test, and `print-usgs` script.

## USGS documentation used, per field

Overall feature shape (property list, `id` at feature level, `geometry.coordinates` =
`[longitude, latitude, depth]`): https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php

Individual fields, from the ComCat glossary (https://earthquake.usgs.gov/data/comcat/index.php):

- `mag` → https://earthquake.usgs.gov/data/comcat/index.php#mag
- `place` → https://earthquake.usgs.gov/data/comcat/index.php#place
- `time` → https://earthquake.usgs.gov/data/comcat/index.php#time
- `updated` → https://earthquake.usgs.gov/data/comcat/index.php#updated
- `status` → https://earthquake.usgs.gov/data/comcat/index.php#status — Typical Values:
  "automatic", "reviewed", "deleted"
- `type` (properties) → https://earthquake.usgs.gov/data/comcat/index.php#type — Typical
  Values: "earthquake", "quarry" (not exhaustive, see Uncertain below)
- `tsunami` → https://earthquake.usgs.gov/data/comcat/index.php#tsunami — "set to '1' for
  large events in oceanic regions and '0' otherwise"
- `sig` → https://earthquake.usgs.gov/data/comcat/index.php#sig
- `magType` → https://earthquake.usgs.gov/data/comcat/index.php#magType
- `id` (top-level Feature field) → https://earthquake.usgs.gov/data/comcat/index.php#id

**Status mapping**: `"deleted"` → `withdrawn`. `"automatic"` and `"reviewed"` (and anything
else) → `active`. USGS's own docs only narrate "automatic" vs "reviewed" in prose; "deleted"
appears only in the Typical Values list with no further explanation — mapped to `withdrawn`
because it's the only value in that list connoting removal, matching the envelope's
`active | withdrawn` split.

## Assumptions

- `title` (e.g. `"M 0.8 - 5 km SE of Ontario, CA"`) **is present in the live payload but is
  not documented as a per-feature property anywhere I could find** — only as a feed-level
  `metadata.title` ("The title of the feed"). Per hard rule 3, I did not read it. Instead I
  construct the canonical `title` from the two documented fields (`mag`, `place`), which
  happens to reproduce USGS's own format.
- The normalizer returns `Omit<CanonicalEvent, 'id'>`: `id` is explicitly "ours" (DB-assigned)
  in section 2, and nothing is persisted in this step.
- `ingestedAt` is stamped `now()` inside the normalizer. Whether a later poll of the same
  event should preserve the original `ingestedAt` is a persistence/dedup decision (not built
  yet).
- `eventTypes: ['earthquake', 'explosion', 'quarry blast']` in the USGS definition is the set
  of distinct `type` values actually observed in the one fixture pull, not USGS's documented
  "Typical Values" (which list only "earthquake", "quarry"). Live evidence was trusted over
  the doc's non-exhaustive example.
- `users` table fields (`id`, `name`, `email`, `createdAt`) are not specified anywhere in the
  docs — DL-09 only says users are seeded with no registration flow. Picked the smallest
  reasonable shape rather than stopping to ask, since it's not a product decision, but
  flagging it here per hard rule 7.
- `RuleMatch`, `ChannelConfig`, `DeliveryAttempt` have no explicit TS type blocks in the docs
  (unlike `CanonicalEvent`/`AlertRule`). Their Prisma fields are inferred from the transition
  table (section 5), section 7's delivery description, and section 8's one-line table
  purposes — documented with comments in the schema pointing at those sources.
- `Location` and `RegionFilter` are flattened to scalar columns (`locationLat/Lon/Label`,
  `regionLat/Lon/RadiusKm`) rather than stored as JSON, since region filtering needs numeric
  comparison — unlike `attributes`/`value`, which section 8 explicitly says are JSON.
- Added `"type": "module"` to `package.json` and `allowImportingTsExtensions: true` to
  `tsconfig.json` so the guard test and script run directly via Node's native TypeScript
  support with zero new dependencies.

## Uncertain

- USGS's own docs say the top-level `id` "is the current preferred id for the event, and
  **may change over time**" (see the `id` citation above) — in tension with DL-07 treating
  `(source, sourceEventId)` as a stable dedup key. Not a problem for this step, but a real
  risk once ingestion/dedup is built.
- Whether `mag`/`place`/`magType` can genuinely be `null` in this feed isn't stated on either
  doc page checked (no nulls appeared in the 328-feature fixture either) — the null-safe
  handling was implemented because the task specified it, not because documented proof of it
  was found.
- No USGS page found enumerates an exhaustive list of `status` or `type` values — "Typical
  Values" is explicitly a sample, not a closed set.

## Not done

- **Next.js's `next dev` auto-injected an "agent rules" block into `CLAUDE.md`** on the first
  sanity-check run (a human-authored governance file, not something Next should be writing
  to). Reverted via `git checkout -- CLAUDE.md` and set `agentRules: false` in
  `next.config.ts` to stop it recurring — flagged loudly since it's exactly the kind of silent
  tool side effect the critique log cares about.
- Prisma 7 removed `url` from `schema.prisma`; the connection URL now lives in
  `prisma.config.ts`, and `npm view` shows `prisma`'s `latest` dist-tag (`8.0.0-rc.12`) is
  *ahead of* `@prisma/client`'s `latest` (`7.10.0`) — installing both at `@latest` would have
  paired an RC CLI with a stable client. Pinned both to `7.10.0`.
- No `src/lib/prisma.ts` or any `PrismaClient` instantiation — not needed for a schema-only
  step, and Prisma 7 requires a driver-adapter package to construct a client at runtime (a
  separate proposal), so it was left alone rather than half-wired.
- Everything explicitly out of scope for this step (ingestion loop, dedup, rule engine,
  channel adapters, dispatcher, admin UI) — untouched.
- No seed script for `users` — not asked for.
