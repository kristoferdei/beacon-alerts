// Event identity, docs/03-decision-log.md DL-11. Supersedes the single
// sourceEventId dedup key in DL-07 / docs/02-architecture.md section 8: an
// event's identity is the set of aliases a source has ever reported for it,
// not any single field, because USGS's own "id" is documented as the
// current *preferred* id and can change when the preferred contributing
// network changes.
//
// No implementation yet. Tests only.

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
  throw new Error("not implemented");
}
