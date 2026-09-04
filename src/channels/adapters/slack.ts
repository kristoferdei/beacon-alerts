import type {
  ChannelAdapter,
  ChannelConfig,
  NotificationPayload,
  SendResult,
} from "../types.ts";

// Slack via incoming webhook, docs/03-decision-log.md DL-05: a URL per
// channel config, no OAuth, no workspace token storage. The webhook URL is
// the secret and comes only from process.env[config.secretEnvVar] — never
// the database (hard rule 4).
//
// Unlike the email adapter, this makes a real network call by default
// (native fetch, no new dependency): DL-05 picked incoming webhooks
// specifically because they "exercise everything the architecture needs to
// prove... a real network call that can fail." The HTTP call itself is
// still behind a small transport interface, purely so tests can supply a
// fake response instead of reaching a real Slack workspace.

export type SlackWebhookTransport = {
  post(url: string, body: unknown): Promise<{ status: number; body: string }>;
};

export function createFetchSlackWebhookTransport(): SlackWebhookTransport {
  return {
    async post(url, body) {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const text = await response.text().catch(() => "");
      return { status: response.status, body: text };
    },
  };
}

// Incoming webhooks accept a JSON body whose only required field is "text"
// (https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/).
// Slack's own docs state the channel, username, and icon "cannot [be]
// override[n]" via an incoming webhook payload — they are fixed by the
// webhook itself — so ChannelConfig.destination is a display label only
// (e.g. "#alerts") and is never sent to Slack.
function buildSlackText(payload: NotificationPayload): string {
  const lines = [payload.title, payload.body];
  if (payload.eventUrl) {
    lines.push(payload.eventUrl);
  }
  return lines.join("\n");
}

export function createSlackAdapter(
  transport: SlackWebhookTransport = createFetchSlackWebhookTransport(),
): ChannelAdapter {
  return {
    id: "slack",

    validateConfig(config: ChannelConfig) {
      const errors: string[] = [];
      if (!config.secretEnvVar) {
        errors.push("secretEnvVar is required");
      } else {
        const url = process.env[config.secretEnvVar];
        if (!url) {
          errors.push(
            `environment variable "${config.secretEnvVar}" is not set`,
          );
        } else if (!url.startsWith("https://")) {
          errors.push(
            `environment variable "${config.secretEnvVar}" does not look like a webhook URL`,
          );
        }
      }
      return errors.length > 0 ? { ok: false, errors } : { ok: true };
    },

    async send(
      payload: NotificationPayload,
      config: ChannelConfig,
    ): Promise<SendResult> {
      const url = process.env[config.secretEnvVar];
      if (!url) {
        // A missing secret is a configuration problem, not a transient one:
        // retrying will not make the environment variable appear.
        return {
          ok: false,
          retryable: false,
          error: `environment variable "${config.secretEnvVar}" is not set`,
        };
      }

      let response: { status: number; body: string };
      try {
        response = await transport.post(url, { text: buildSlackText(payload) });
      } catch (error) {
        // A connection-level failure (DNS, refused, timeout) rather than a
        // response from Slack at all. This is exactly the judgement DL-04
        // says belongs to the adapter: treated as transient.
        return {
          ok: false,
          retryable: true,
          error: error instanceof Error ? error.message : String(error),
        };
      }

      if (response.status === 200) {
        return { ok: true };
      }

      // A 429 (rate limited) or any 5xx is worth retrying; a 404 (dead
      // webhook) or any other 4xx (bad payload, revoked token, admin
      // restriction) is not, per the classification this adapter owns.
      const retryable = response.status === 429 || response.status >= 500;
      return {
        ok: false,
        retryable,
        error: `Slack webhook responded ${response.status}${
          response.body ? `: ${response.body}` : ""
        }`,
      };
    },
  };
}
