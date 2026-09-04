import { test } from "node:test";
import assert from "node:assert/strict";

import { createSlackAdapter, type SlackWebhookTransport } from "./slack.ts";
import type { ChannelConfig, NotificationPayload } from "../types.ts";

const payload: NotificationPayload = {
  title: "M 6.1 - 84 km SW of Example",
  body: "A magnitude 6.1 earthquake was detected.",
  eventUrl: "https://earthquake.usgs.gov/earthquakes/eventpage/us7000abcd",
};

function channelConfig(secretEnvVar: string): ChannelConfig {
  return {
    id: "channel-config-1",
    channelId: "slack",
    destination: "#alerts",
    secretEnvVar,
  };
}

// Records what was posted and returns a scripted status; never touches the
// network. Not the unit under test.
function createFakeTransport(status: number, body = ""): SlackWebhookTransport & {
  calls: Array<{ url: string; body: unknown }>;
} {
  const calls: Array<{ url: string; body: unknown }> = [];
  return {
    calls,
    async post(url, requestBody) {
      calls.push({ url, body: requestBody });
      return { status, body };
    },
  };
}

test("validateConfig rejects a config whose secret env var is not set", () => {
  const adapter = createSlackAdapter(createFakeTransport(200));
  const config = channelConfig("SLACK_WEBHOOK_URL_UNSET_TEST");

  const result = adapter.validateConfig(config);

  assert.equal(result.ok, false);
});

test("validateConfig accepts a config whose secret env var holds a webhook URL", () => {
  process.env.SLACK_WEBHOOK_URL_VALID_TEST =
    "https://hooks.slack.com/services/T000/B000/xxxxxxxxxxxxxxxxxxxxxxxx";
  try {
    const adapter = createSlackAdapter(createFakeTransport(200));
    const config = channelConfig("SLACK_WEBHOOK_URL_VALID_TEST");

    const result = adapter.validateConfig(config);

    assert.deepEqual(result, { ok: true });
  } finally {
    delete process.env.SLACK_WEBHOOK_URL_VALID_TEST;
  }
});

test("send posts the notification text to the webhook URL from the environment", async () => {
  process.env.SLACK_WEBHOOK_URL_SEND_TEST =
    "https://hooks.slack.com/services/T000/B000/xxxxxxxxxxxxxxxxxxxxxxxx";
  try {
    const transport = createFakeTransport(200, "ok");
    const adapter = createSlackAdapter(transport);
    const config = channelConfig("SLACK_WEBHOOK_URL_SEND_TEST");

    const result = await adapter.send(payload, config);

    assert.equal(result.ok, true);
    assert.equal(transport.calls.length, 1);
    assert.equal(transport.calls[0].url, process.env.SLACK_WEBHOOK_URL_SEND_TEST);
    assert.deepEqual(transport.calls[0].body, {
      text: `${payload.title}\n${payload.body}\n${payload.eventUrl}`,
    });
  } finally {
    delete process.env.SLACK_WEBHOOK_URL_SEND_TEST;
  }
});

test("retryability classification: 429 and 5xx are retryable, 404 is not", async () => {
  process.env.SLACK_WEBHOOK_URL_RETRY_TEST =
    "https://hooks.slack.com/services/T000/B000/xxxxxxxxxxxxxxxxxxxxxxxx";
  try {
    const config = channelConfig("SLACK_WEBHOOK_URL_RETRY_TEST");

    const rateLimited = await createSlackAdapter(createFakeTransport(429)).send(
      payload,
      config,
    );
    assert.equal(rateLimited.ok, false);
    assert.equal((rateLimited as { retryable: boolean }).retryable, true);

    const serverError = await createSlackAdapter(createFakeTransport(503)).send(
      payload,
      config,
    );
    assert.equal(serverError.ok, false);
    assert.equal((serverError as { retryable: boolean }).retryable, true);

    const deadWebhook = await createSlackAdapter(createFakeTransport(404)).send(
      payload,
      config,
    );
    assert.equal(deadWebhook.ok, false);
    assert.equal((deadWebhook as { retryable: boolean }).retryable, false);
  } finally {
    delete process.env.SLACK_WEBHOOK_URL_RETRY_TEST;
  }
});
