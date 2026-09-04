import { test } from "node:test";
import assert from "node:assert/strict";

import { evaluate } from "./matching.ts";

test("a rule referencing an attribute the event does not carry is a non-match, not an error", () => {
  // A news-shaped event's attributes, evaluated against a magnitude rule
  // from an unrelated (earthquake) source.
  const newsAttributes = { category: "markets", headline: "Central bank holds rates" };

  const result = evaluate("magnitude", ">=", 6.0, newsAttributes);

  assert.equal(result, false);
});

test("a rule whose attribute is present but of the wrong type is a non-match, not an error", () => {
  const attributesWithWrongType = { magnitude: "severe" };

  const result = evaluate("magnitude", ">=", 6.0, attributesWithWrongType);

  assert.equal(result, false);
});
