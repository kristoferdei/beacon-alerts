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

test("magnitude 6.1 against >= 6.0 is a match", () => {
  const result = evaluate("magnitude", ">=", 6.0, { magnitude: 6.1 });

  assert.equal(result, true);
});

test("magnitude 5.9 against >= 6.0 is not a match", () => {
  const result = evaluate("magnitude", ">=", 6.0, { magnitude: 5.9 });

  assert.equal(result, false);
});

test("a string attribute matching via the contains operator is a match", () => {
  const result = evaluate("magnitudeType", "contains", "w", {
    magnitudeType: "mww",
  });

  assert.equal(result, true);
});
