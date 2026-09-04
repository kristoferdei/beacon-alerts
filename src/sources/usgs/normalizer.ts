import type { AttributeValue, CanonicalEvent } from "../../domain/types.ts";
import type { UsgsRawFeature } from "./raw-types.ts";

// `id` and `ingestedAt` are facts the persistence layer owns ("ours" / "when
// we first saw it" in CanonicalEvent's own comments), not the source
// boundary. Neither exists yet at the point of normalization.
export type NormalizedUsgsEvent = Omit<CanonicalEvent, "id" | "ingestedAt">;

// `ids` is documented as "A comma-separated list of event ids that are
// associated to an event", with a leading and trailing comma in USGS's own
// example ("...ci15296281,us2013mqbd,at00mji9pf,..."), which splitting
// produces as empty leading/trailing segments. `id` is documented as "the
// current preferred id" and, in a live 328-feature sample, is not always
// the first entry `ids` lists (it is always present in `ids`, but reordered
// in 30 of the 328). The preferred id is placed first here regardless, and
// included even on the hypothetical case where `ids` omits it.
function parseSourceEventIds(feature: UsgsRawFeature): string[] {
  const otherIds = feature.properties.ids
    .split(",")
    .filter((id) => id.length > 0 && id !== feature.id);
  return [feature.id, ...otherIds];
}

export function normalizeUsgsFeature(
  feature: UsgsRawFeature,
): NormalizedUsgsEvent {
  const { properties } = feature;

  const attributes: Record<string, AttributeValue> = {
    tsunami: properties.tsunami === 1,
    significance: properties.sig,
  };
  if (properties.mag !== null) {
    attributes.magnitude = properties.mag;
  }
  if (properties.magType !== null) {
    attributes.magnitudeType = properties.magType;
  }

  const magnitudeLabel =
    properties.mag !== null ? `M ${properties.mag.toFixed(1)}` : "M ?";
  const placeLabel = properties.place ?? "Unknown location";

  return {
    source: "usgs",
    sourceEventIds: parseSourceEventIds(feature),
    type: properties.type,
    occurredAt: new Date(properties.time).toISOString(),
    revisedAt: new Date(properties.updated).toISOString(),
    // USGS: status "deleted" means the event was withdrawn; "automatic" and
    // "reviewed" both mean it is still current.
    status: properties.status === "deleted" ? "withdrawn" : "active",
    title: `${magnitudeLabel} - ${placeLabel}`,
    location: feature.geometry
      ? {
          lon: feature.geometry.coordinates[0],
          lat: feature.geometry.coordinates[1],
          label: properties.place,
        }
      : null,
    attributes,
  };
}
