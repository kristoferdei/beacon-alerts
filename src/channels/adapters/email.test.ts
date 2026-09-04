import { test } from "node:test";
import assert from "node:assert/strict";

import { createEmailAdapter, createLoggingEmailTransport } from "./email.ts";
import type { ChannelConfig, NotificationPayload } from "../types.ts";

const channelConfig: ChannelConfig = {
  id: "channel-config-1",
  channelId: "email",
  destination: "ops@example.com",
  secretEnvVar: "SMTP_PASSWORD",
};

test("validateConfig rejects a destination that is not an email address", () => {
  const adapter = createEmailAdapter(createLoggingEmailTransport());

  const result = adapter.validateConfig({ ...channelConfig, destination: "not-an-email" });

  assert.equal(result.ok, false);
});

test("validateConfig accepts a well-formed email destination", () => {
  const adapter = createEmailAdapter(createLoggingEmailTransport());

  const result = adapter.validateConfig(channelConfig);

  assert.deepEqual(result, { ok: true });
});

test("send records the notification through the logging transport instead of sending it", async () => {
  const transport = createLoggingEmailTransport();
  const adapter = createEmailAdapter(transport);
  const payload: NotificationPayload = {
    title: "M 6.1 - 84 km SW of Example",
    body: "A magnitude 6.1 earthquake was detected.",
    eventUrl: "https://earthquake.usgs.gov/earthquakes/eventpage/us7000abcd",
  };

  const result = await adapter.send(payload, channelConfig);

  assert.equal(result.ok, true);
  assert.equal(transport.sent.length, 1);
  assert.equal(transport.sent[0].to, channelConfig.destination);
  assert.equal(transport.sent[0].subject, payload.title);
  assert.match(transport.sent[0].body, /A magnitude 6\.1 earthquake was detected\./);
  assert.match(transport.sent[0].body, /https:\/\/earthquake\.usgs\.gov/);
});
