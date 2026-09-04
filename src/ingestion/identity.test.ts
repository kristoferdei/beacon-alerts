import { test } from "node:test";
import assert from "node:assert/strict";

import { resolveEventIdentity, type StoredEvent } from "./identity.ts";

test("two observations sharing no alias are two events", () => {
  const first = resolveEventIdentity({ aliases: ["us1"] }, []);
  assert.deepEqual(first, { kind: "new" });

  const storedFirst: StoredEvent = {
    eventId: "event-1",
    aliases: ["us1"],
    ingestedAt: "2026-09-01T00:00:00.000Z",
  };
  const second = resolveEventIdentity({ aliases: ["ci9"] }, [storedFirst]);
  assert.deepEqual(second, { kind: "new" });
});

test("alias order does not matter", () => {
  const stored: StoredEvent = {
    eventId: "event-1",
    aliases: ["us1", "ci1"],
    ingestedAt: "2026-09-01T00:00:00.000Z",
  };

  const result = resolveEventIdentity({ aliases: ["ci1", "us1"] }, [stored]);

  assert.deepEqual(result, {
    kind: "existing",
    eventId: "event-1",
    newAliases: [],
  });
});

test("a stored event's aliases and an observation's aliases can partially overlap, sharing one alias while neither contains the other, and are still the same event", () => {
  // USGS can drop associations as well as add them, so a stored set and an
  // incoming set can overlap without either being a subset of the other.
  // An implementation checking subset or set equality instead of true
  // intersection would miss this and pass every other test in this file.
  const stored: StoredEvent = {
    eventId: "event-1",
    aliases: ["us1", "ci1"],
    ingestedAt: "2026-09-01T00:00:00.000Z",
  };

  const result = resolveEventIdentity({ aliases: ["ci1", "nc1"] }, [stored]);

  assert.deepEqual(result, {
    kind: "existing",
    eventId: "event-1",
    newAliases: ["nc1"],
  });
});

test("an observation whose alias set is a superset of a stored event's is the same event, and the new aliases are recorded", () => {
  const stored: StoredEvent = {
    eventId: "event-1",
    aliases: ["us1"],
    ingestedAt: "2026-09-01T00:00:00.000Z",
  };

  const result = resolveEventIdentity(
    { aliases: ["us1", "ci1", "nc1"] },
    [stored],
  );

  assert.deepEqual(result, {
    kind: "existing",
    eventId: "event-1",
    newAliases: ["ci1", "nc1"],
  });
});

test("an observation whose aliases match two separate stored events is a merge: the earliest-ingested wins, the other is marked merged, and no alert is produced", () => {
  const earlier: StoredEvent = {
    eventId: "event-a",
    aliases: ["us1"],
    ingestedAt: "2026-09-01T00:00:00.000Z",
  };
  const later: StoredEvent = {
    eventId: "event-b",
    aliases: ["ci2"],
    ingestedAt: "2026-09-02T00:00:00.000Z",
  };

  // A source has associated what were, until now, two separately stored
  // events: this single observation carries an alias from each.
  const result = resolveEventIdentity({ aliases: ["us1", "ci2"] }, [
    earlier,
    later,
  ]);

  assert.deepEqual(result, {
    kind: "merge",
    canonicalEventId: "event-a",
    mergedEventId: "event-b",
  });
});

test("a source returning one identifier works through the same path with no special case", () => {
  const stored: StoredEvent = {
    eventId: "event-1",
    aliases: ["only-id"],
    ingestedAt: "2026-09-01T00:00:00.000Z",
  };

  const result = resolveEventIdentity({ aliases: ["only-id"] }, [stored]);

  assert.deepEqual(result, {
    kind: "existing",
    eventId: "event-1",
    newAliases: [],
  });
});
