// Plain formatting helpers for the admin view. No library: this is exactly
// the kind of thing a data-fetching/formatting dependency would replace,
// and none was asked for.

export function formatDateTime(date: Date | null): string {
  if (!date) {
    return "—";
  }
  return date.toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");
}

export function formatConditionValue(value: unknown): string {
  if (typeof value === "string") {
    return `"${value}"`;
  }
  return String(value);
}

export function formatCondition(rule: {
  attribute: string;
  operator: string;
  value: unknown;
}): string {
  return `${rule.attribute} ${rule.operator} ${formatConditionValue(rule.value)}`;
}

export type TagMeta = { variant: string; glyph: string; label: string };

// Colour is reinforcement, never the only carrier: every status/outcome
// pairs a variant colour with a distinct glyph and its own word.
export function eventStatusTag(status: string): TagMeta {
  if (status === "withdrawn") {
    return { variant: "withdrawn", glyph: "–", label: "withdrawn" };
  }
  if (status === "merged") {
    return { variant: "merged", glyph: "⇄", label: "merged" };
  }
  return { variant: "active", glyph: "✓", label: "active" };
}

export function deliveryOutcomeTag(status: string): TagMeta {
  if (status === "sent") {
    return { variant: "active", glyph: "✓", label: "sent" };
  }
  if (status === "failed") {
    return { variant: "failed", glyph: "✕", label: "failed" };
  }
  return { variant: "pending", glyph: "●", label: "pending" };
}

export function formatAttributes(attributes: unknown): string {
  if (
    typeof attributes !== "object" ||
    attributes === null ||
    Array.isArray(attributes)
  ) {
    return "—";
  }
  const entries = Object.entries(attributes as Record<string, unknown>);
  if (entries.length === 0) {
    return "—";
  }
  return entries.map(([key, value]) => `${key}: ${String(value)}`).join(", ");
}
