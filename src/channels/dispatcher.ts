import type { ChannelConfig, NotificationPayload } from "./types.ts";
import { resolveChannelAdapter, type ChannelRegistry } from "./registry.ts";

const MAX_ATTEMPTS = 3;

export type DispatchRequest = {
  // Identifies the rule_matches row this delivery is for (delivery_attempts
  // FKs to it). The dispatcher does not need anything else about the match:
  // building the payload is a separate, earlier concern.
  ruleMatchId: string;
  payload: NotificationPayload;
  channelConfig: ChannelConfig;
};

// A persistence seam. The dispatcher does not know about Prisma or any
// storage; something else implements this against the delivery_attempts
// table (not built yet — no polling loop or DB wiring in this step). A
// row is created (status "pending") and only ever updated afterward, never
// created again, matching "create the row before the network call."
export type DeliveryAttemptRecorder = {
  create(input: {
    ruleMatchId: string;
    channelConfigId: string;
    attemptNumber: number;
  }): Promise<string>;
  update(
    attemptId: string,
    patch:
      | { status: "sent"; providerRef?: string }
      | { status: "failed"; error: string; retryable: boolean },
  ): Promise<void>;
};

export type DispatchOptions = {
  // Overridable so tests don't have to wait through real backoff delays.
  // Not a mock of the dispatcher: it's the delay primitive, injected the
  // same way the recorder and registry are.
  wait?: (ms: number) => Promise<void>;
};

const defaultWait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

function backoffMs(attemptNumber: number): number {
  return 2 ** attemptNumber * 100; // 200ms, 400ms, 800ms
}

// Takes a match and a channel config, resolves the adapter by
// channelConfig.channelId (never naming one), and calls send. Retries up to
// MAX_ATTEMPTS, only when the adapter itself reported retryable: true. The
// dispatcher never inspects a provider's error codes — that judgement is
// the adapter's alone.
export async function dispatch(
  request: DispatchRequest,
  registry: ChannelRegistry,
  recorder: DeliveryAttemptRecorder,
  options: DispatchOptions = {},
): Promise<void> {
  const wait = options.wait ?? defaultWait;
  const adapter = resolveChannelAdapter(registry, request.channelConfig.channelId);

  for (let attemptNumber = 1; attemptNumber <= MAX_ATTEMPTS; attemptNumber++) {
    // Recorded before the network call: a crash mid-send leaves evidence.
    const attemptId = await recorder.create({
      ruleMatchId: request.ruleMatchId,
      channelConfigId: request.channelConfig.id,
      attemptNumber,
    });

    try {
      const result = await adapter.send(request.payload, request.channelConfig);

      if (result.ok) {
        await recorder.update(attemptId, {
          status: "sent",
          providerRef: result.providerRef,
        });
        return;
      }

      await recorder.update(attemptId, {
        status: "failed",
        error: result.error,
        retryable: result.retryable,
      });

      if (!result.retryable || attemptNumber === MAX_ATTEMPTS) {
        return;
      }
    } catch (error) {
      // The adapter threw instead of returning a SendResult. It gave no
      // retryability judgement, and retrying blind is not this dispatcher's
      // call to make, so this is treated as a terminal failure.
      await recorder.update(attemptId, {
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
        retryable: false,
      });
      return;
    }

    await wait(backoffMs(attemptNumber));
  }
}
