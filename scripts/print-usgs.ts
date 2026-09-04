import { normalizeUsgsFeature } from "../src/sources/usgs/normalizer.ts";
import type { UsgsRawFeatureCollection } from "../src/sources/usgs/raw-types.ts";

const FEED_URL =
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";

async function main(): Promise<void> {
  const response = await fetch(FEED_URL);
  if (!response.ok) {
    throw new Error(`USGS feed request failed: ${response.status} ${response.statusText}`);
  }
  const collection: UsgsRawFeatureCollection = await response.json();

  const canonicalEvents = collection.features.map(normalizeUsgsFeature);

  console.log(JSON.stringify(canonicalEvents.slice(0, 5), null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
