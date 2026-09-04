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
