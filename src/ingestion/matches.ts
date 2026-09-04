import type { AlertRule, CanonicalEvent } from "../domain/types.ts";
import { evaluate } from "./matching.ts";

export type MatchableEvent = Pick<
  CanonicalEvent,
  "source" | "type" | "status" | "attributes"
>;

// The full matches() formula, docs/02-architecture.md section 5. evaluate()
// is the attribute-condition half (already built); this composes the rest:
// source, event type, active status, and region.
export function matches(rule: AlertRule, event: MatchableEvent): boolean {
  if (event.source !== rule.source) {
    return false;
  }
  if (rule.eventType !== null && event.type !== rule.eventType) {
    return false;
  }
  if (event.status !== "active") {
    return false;
  }
  if (!evaluate(rule.attribute, rule.operator, rule.value, event.attributes)) {
    return false;
  }
  if (rule.region !== null) {
    // withinRadius() was never built: no rule seeded anywhere in this
    // project uses a region filter, so there is nothing yet to verify this
    // against, and pretending it passes would be worse than saying so.
    throw new Error("region filtering is not implemented");
  }
  return true;
}
