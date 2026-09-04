import type { AttributeValue, RuleOperator } from "../domain/types.ts";

// The condition-evaluation half of docs/02-architecture.md section 5's
// matches() formula:
//   evaluate(rule.attribute, rule.operator, rule.value, event.attributes)
//
// "Missing attributes evaluate to no match, never to an error. A rule
// referencing an attribute a particular event does not carry is not a
// failure, it is a non-match."

export function evaluate(
  attribute: string,
  operator: RuleOperator,
  value: AttributeValue,
  attributes: Record<string, AttributeValue>,
): boolean {
  if (!Object.prototype.hasOwnProperty.call(attributes, attribute)) {
    return false;
  }

  const actual = attributes[attribute];

  switch (operator) {
    case ">":
      return typeof actual === "number" && typeof value === "number" && actual > value;
    case ">=":
      return typeof actual === "number" && typeof value === "number" && actual >= value;
    case "<":
      return typeof actual === "number" && typeof value === "number" && actual < value;
    case "<=":
      return typeof actual === "number" && typeof value === "number" && actual <= value;
    case "==":
      return typeof actual === typeof value && actual === value;
    // A type mismatch is a non-match, not a vacuous true: the condition is
    // unverifiable, not proven different, so this stays consistent with
    // every other operator rather than treating a wrong type as an
    // automatic "not equal".
    case "!=":
      return typeof actual === typeof value && actual !== value;
    case "contains":
      return (
        typeof actual === "string" &&
        typeof value === "string" &&
        actual.includes(value)
      );
    default:
      return false;
  }
}
