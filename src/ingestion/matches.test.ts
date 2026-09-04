import { test } from "node:test";
import assert from "node:assert/strict";

import { matches, type MatchableEvent } from "./matches.ts";
import type { AlertRule } from "../domain/types.ts";

const rule: AlertRule = {
  id: "rule-1",
  userId: "user-1",
  name: "Magnitude 6+",
  source: "usgs",
  eventType: "earthquake",
  attribute: "magnitude",
  operator: ">=",
  value: 6.0,
  region: null,
  channelConfigId: "channel-1",
  enabled: true,
};

const event: MatchableEvent = {
  source: "usgs",
  type: "earthquake",
  status: "active",
  attributes: { magnitude: 6.1 },
};

test("a rule matches an active event of the right source, type, and attribute", () => {
  assert.equal(matches(rule, event), true);
});

test("a rule from a different source never matches", () => {
  assert.equal(matches(rule, { ...event, source: "mock-news" }), false);
});

test("a rule scoped to an event type does not match a different type", () => {
  assert.equal(matches(rule, { ...event, type: "quarry blast" }), false);
});

test("a withdrawn event never matches, regardless of attributes", () => {
  assert.equal(matches(rule, { ...event, status: "withdrawn" }), false);
});
