// Canonical event envelope, docs/02-architecture.md section 2.

export type AttributeValue = number | string | boolean;

export type Location = {
  lat: number;
  lon: number;
  label: string | null;
};

export type CanonicalEvent = {
  id: string; // ours
  source: string; // 'usgs' | 'mock-news'
  // theirs. Identity is this set, not any single entry: DL-11 supersedes the
  // single stable-id assumption in docs/02-architecture.md sections 2 and 8.
  // Preferred identifier first.
  sourceEventIds: string[];
  type: string; // 'earthquake' | 'breaking-news'
  occurredAt: string; // ISO 8601, when it happened
  ingestedAt: string; // when we first saw it
  revisedAt: string | null; // source's own last-modified, drives revision detection
  status: "active" | "withdrawn";
  title: string;
  location: Location | null;
  attributes: Record<string, AttributeValue>;
};

// Rule operators, docs/02-architecture.md section 4. Defined here, alongside
// the envelope, because AttributeDefinition (section 3) already needs it and
// the rule engine itself is not being built in this step.
export type RuleOperator = ">" | ">=" | "<" | "<=" | "==" | "!=" | "contains";
