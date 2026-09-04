import { test } from "node:test";
import assert from "node:assert/strict";

import { createDefaultChannelRegistry } from "./index.ts";
import { resolveChannelAdapter } from "./registry.ts";

test("email and slack are both resolvable from the same registry", () => {
  const registry = createDefaultChannelRegistry();

  assert.equal(resolveChannelAdapter(registry, "email").id, "email");
  assert.equal(resolveChannelAdapter(registry, "slack").id, "slack");
});
