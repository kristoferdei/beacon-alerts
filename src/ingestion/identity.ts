// Event identity, docs/03-decision-log.md DL-11. Supersedes the single
// sourceEventId dedup key in DL-07 / docs/02-architecture.md section 8: an
// event's identity is the set of aliases a source has ever reported for it,
// not any single field, because USGS's own "id" is documented as the
// current *preferred* id and can change when the preferred contributing
// network changes.

// One incoming poll result, prior to being matched against anything stored.
export type Observation = {
  // In the order the source reports them; index 0 is the source's current
  // preferred id. A single-identifier source is just a one-element array.
  aliases: string[];
};

// An event already on record, as identity resolution needs to see it.
export type StoredEvent = {
  eventId: string;
  aliases: string[];
  // Used to decide the survivor when two stored events turn out to be the
  // same event (DL-11 step 5: earliest-ingested wins).
  ingestedAt: string;
};

export type IdentityResolution =
  | { kind: "new" }
  | { kind: "existing"; eventId: string; newAliases: string[] }
  | { kind: "merge"; canonicalEventId: string; mergedEventId: string };

export function resolveEventIdentity(
  observation: Observation,
  existingEvents: StoredEvent[],
): IdentityResolution {
  const observedAliases = new Set(observation.aliases);

  // Identity is set intersection, not subset or equality: a stored set and
  // an incoming set can each hold an id the other does not, because a
  // source can drop associations as well as add them.
  const matches = existingEvents.filter((stored) =>
    stored.aliases.some((alias) => observedAliases.has(alias)),
  );

  if (matches.length === 0) {
    return { kind: "new" };
  }

  if (matches.length === 1) {
    const matched = matches[0];
    const newAliases = observation.aliases.filter(
      (alias) => !matched.aliases.includes(alias),
    );
    return { kind: "existing", eventId: matched.eventId, newAliases };
  }

  // More than one stored event shares an alias with this observation: the
  // source has associated events we had previously recorded separately.
  // The earliest-ingested survives as canonical; the rest are merged into
  // it (DL-11 step 5). No test exercises more than two matches at once, so
  // only the first non-canonical match is named here.
  const [canonical, ...rest] = [...matches].sort((a, b) =>
    a.ingestedAt.localeCompare(b.ingestedAt),
  );
  return {
    kind: "merge",
    canonicalEventId: canonical.eventId,
    mergedEventId: rest[0].eventId,
  };
}
