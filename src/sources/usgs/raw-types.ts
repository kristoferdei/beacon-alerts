// Shape of the USGS earthquake GeoJSON summary feed. Only fields the
// normalizer reads are declared here; see the accompanying response for
// where each one is documented.

export type UsgsRawFeature = {
  type: "Feature";
  id: string;
  properties: {
    mag: number | null;
    place: string | null;
    time: number;
    updated: number;
    status: string;
    type: string;
    tsunami: number;
    sig: number;
    magType: string | null;
    ids: string;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number, number];
  } | null;
};

export type UsgsRawFeatureCollection = {
  type: "FeatureCollection";
  features: UsgsRawFeature[];
};
