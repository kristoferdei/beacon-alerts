import type { EventSourceDefinition } from "../types.ts";

// Attribute keys and shapes here must match what normalizeUsgsFeature
// actually emits; normalizer.test.ts guards against the two drifting apart
// (DL-03).
export const usgsSourceDefinition: EventSourceDefinition = {
  id: "usgs",
  name: "USGS Earthquakes",
  // Distinct `type` values observed in a live fetch of the "all_day"
  // summary feed on 2026-09-04 (earthquake, explosion, quarry blast). USGS's
  // own glossary lists only "earthquake" and "quarry" as "Typical Values"
  // for this field, so this list is evidence-based rather than exhaustive;
  // see the accompanying response.
  eventTypes: ["earthquake", "explosion", "quarry blast"],
  supportsLocation: true,
  attributes: [
    {
      key: "magnitude",
      label: "Magnitude",
      type: "number",
      operators: [">", ">=", "<", "<=", "==", "!="],
    },
    {
      key: "magnitudeType",
      label: "Magnitude Type",
      type: "string",
      operators: ["==", "!=", "contains"],
    },
    {
      key: "tsunami",
      label: "Tsunami",
      type: "boolean",
      operators: ["==", "!="],
    },
    {
      key: "significance",
      label: "Significance",
      type: "number",
      operators: [">", ">=", "<", "<=", "==", "!="],
    },
  ],
};
