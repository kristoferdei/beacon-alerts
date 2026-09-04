import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { usgsSourceDefinition } from "./definition.ts";
import { normalizeUsgsFeature } from "./normalizer.ts";
import type { UsgsRawFeatureCollection } from "./raw-types.ts";

// Fixture is a real, unmodified response from
// https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson,
// fetched 2026-09-04.
const fixturePath = fileURLToPath(
  new URL("./__fixtures__/all_day-2026-09-04.geojson", import.meta.url),
);
const fixture: UsgsRawFeatureCollection = JSON.parse(
  readFileSync(fixturePath, "utf-8"),
);

// DL-03's guard: the definition and the normalizer are two separate
// artifacts with no compiler-enforced link. If they disagree on a key name,
// nothing throws and the rule form silently offers a rule that can never
// match. This test fails if that happens.
test("every attribute declared in usgsSourceDefinition appears in at least one normalized event", () => {
  assert.ok(
    fixture.features.length > 0,
    "fixture must contain at least one feature to be a meaningful guard",
  );

  const normalizedEvents = fixture.features.map(normalizeUsgsFeature);

  for (const attribute of usgsSourceDefinition.attributes) {
    const presentInAtLeastOneEvent = normalizedEvents.some((event) =>
      Object.prototype.hasOwnProperty.call(event.attributes, attribute.key),
    );
    assert.ok(
      presentInAtLeastOneEvent,
      `declared attribute "${attribute.key}" never appears in any normalized event's attributes`,
    );
  }
});
