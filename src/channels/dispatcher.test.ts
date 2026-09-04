import { test } from "node:test";
import assert from "node:assert/strict";

import { dispatch, type DeliveryAttemptRecorder } from "./dispatcher.ts";
import { createChannelRegistry } from "./registry.ts";
import type { ChannelAdapter, ChannelConfig, NotificationPayload, SendResult } from "./types.ts";

const payload: NotificationPayload = {
  title: "M 6.1 - 84 km SW of Example",
  body: "A magnitude 6.1 earthquake was detected.",
  eventUrl: "https://earthquake.usgs.gov/earthquakes/eventpage/us7000abcd",
};

const channelConfig: ChannelConfig = {
  id: "channel-config-1",
  channelId: "stub",
  destination: "ops@example.com",
  secretEnvVar: "STUB_SECRET",
};

// Records its own calls; not the unit under test. `sendResults` is consumed
// one result per call, so a test can script exactly what each attempt does.
function createStubAdapter(
  sendResults: Array<SendResult | Error>,
): ChannelAdapter & { calls: Array<{ payload: NotificationPayload; config: ChannelConfig }> } {
  const calls: Array<{ payload: NotificationPayload; config: ChannelConfig }> = [];
  return {
    id: "stub",
    calls,
    validateConfig: () => ({ ok: true }),
    async send(sentPayload, sentConfig) {
      calls.push({ payload: sentPayload, config: sentConfig });
      const outcome = sendResults[calls.length - 1] ?? sendResults[sendResults.length - 1];
      if (outcome instanceof Error) {
        throw outcome;
      }
      return outcome;
    },
  };
}

// Also not the unit under test: an in-memory stand-in for the future
// Prisma-backed implementation of DeliveryAttemptRecorder.
function createRecordingRecorder(): DeliveryAttemptRecorder & {
  attempts: Array<{
    id: string;
    ruleMatchId: string;
    channelConfigId: string;
    attemptNumber: number;
    status: "pending" | "sent" | "failed";
    providerRef?: string;
    error?: string;
    retryable?: boolean;
  }>;
} {
  const attempts: ReturnType<typeof createRecordingRecorder>["attempts"] = [];
  let nextId = 0;
  return {
    attempts,
    async create(input) {
      nextId += 1;
      const id = `attempt-${nextId}`;
      attempts.push({ id, status: "pending", ...input });
      return id;
    },
    async update(attemptId, patch) {
      const attempt = attempts.find((a) => a.id === attemptId);
      if (!attempt) {
        throw new Error(`no such attempt: ${attemptId}`);
      }
      Object.assign(attempt, patch);
    },
  };
}

const noWait = async () => {};

test("an adapter resolved from the registry is the one called", async () => {
  const adapter = createStubAdapter([{ ok: true }]);
  const registry = createChannelRegistry([adapter]);
  const recorder = createRecordingRecorder();

  await dispatch(
    { ruleMatchId: "match-1", payload, channelConfig },
    registry,
    recorder,
    { wait: noWait },
  );

  assert.equal(adapter.calls.length, 1);
  assert.deepEqual(adapter.calls[0].payload, payload);
  assert.deepEqual(adapter.calls[0].config, channelConfig);
});

test("a retryable failure is retried up to the bound and then marked failed", async () => {
  const failure: SendResult = { ok: false, retryable: true, error: "rate limited" };
  const adapter = createStubAdapter([failure, failure, failure]);
  const registry = createChannelRegistry([adapter]);
  const recorder = createRecordingRecorder();

  await dispatch(
    { ruleMatchId: "match-1", payload, channelConfig },
    registry,
    recorder,
    { wait: noWait },
  );

  assert.equal(adapter.calls.length, 3);
  assert.equal(recorder.attempts.length, 3);
  assert.deepEqual(
    recorder.attempts.map((a) => a.attemptNumber),
    [1, 2, 3],
  );
  assert.ok(recorder.attempts.every((a) => a.status === "failed"));
  assert.ok(recorder.attempts.every((a) => a.retryable === true));
});

test("a non-retryable failure is not retried at all", async () => {
  const failure: SendResult = { ok: false, retryable: false, error: "unknown recipient" };
  const adapter = createStubAdapter([failure]);
  const registry = createChannelRegistry([adapter]);
  const recorder = createRecordingRecorder();

  await dispatch(
    { ruleMatchId: "match-1", payload, channelConfig },
    registry,
    recorder,
    { wait: noWait },
  );

  assert.equal(adapter.calls.length, 1);
  assert.equal(recorder.attempts.length, 1);
  assert.equal(recorder.attempts[0].status, "failed");
  assert.equal(recorder.attempts[0].retryable, false);
});

test("a delivery attempt row exists even when the send throws", async () => {
  const adapter = createStubAdapter([new Error("socket hang up")]);
  const registry = createChannelRegistry([adapter]);
  const recorder = createRecordingRecorder();

  await dispatch(
    { ruleMatchId: "match-1", payload, channelConfig },
    registry,
    recorder,
    { wait: noWait },
  );

  assert.equal(recorder.attempts.length, 1);
  assert.equal(recorder.attempts[0].status, "failed");
  assert.equal(recorder.attempts[0].error, "socket hang up");
});
