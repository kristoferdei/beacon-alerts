import type { AttributeValue, CanonicalEvent } from "../../domain/types.ts";
import type { UsgsRawFeature } from "./raw-types.ts";

// `id` and `ingestedAt` are facts the persistence layer owns ("ours" / "when
// we first saw it" in CanonicalEvent's own comments), not the source
// boundary. Neither exists yet at the point of normalization.
export type NormalizedUsgsEvent = Omit<CanonicalEvent, "id" | "ingestedAt">;

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
    sourceEventId: feature.id,
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
