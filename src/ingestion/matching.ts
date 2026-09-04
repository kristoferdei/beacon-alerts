import type { AttributeValue, RuleOperator } from "../domain/types.ts";

// The condition-evaluation half of docs/02-architecture.md section 5's
// matches() formula:
//   evaluate(rule.attribute, rule.operator, rule.value, event.attributes)
//
// "Missing attributes evaluate to no match, never to an error. A rule
// referencing an attribute a particular event does not carry is not a
// failure, it is a non-match."
//
// No implementation yet. Tests only.

export function evaluate(
  attribute: string,
  operator: RuleOperator,
  value: AttributeValue,
  attributes: Record<string, AttributeValue>,
): boolean {
  throw new Error("not implemented");
}
