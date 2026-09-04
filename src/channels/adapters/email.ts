import type {
  ChannelAdapter,
  ChannelConfig,
  NotificationPayload,
  SendResult,
} from "../types.ts";

// No SMTP library here on purpose: a real transport is a later, separate
// dependency decision. This interface is what the email adapter is written
// against, so swapping in a real one later does not touch the adapter's
// send()/validateConfig() logic.
export type EmailMessage = {
  to: string;
  subject: string;
  body: string;
};

export type EmailTransport = {
  send(message: EmailMessage): Promise<{ providerRef?: string }>;
};

// Records what would have been sent instead of sending it.
export function createLoggingEmailTransport(): EmailTransport & {
  sent: EmailMessage[];
} {
  const sent: EmailMessage[] = [];
  return {
    sent,
    async send(message) {
      sent.push(message);
      return {};
    },
  };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function createEmailAdapter(transport: EmailTransport): ChannelAdapter {
  return {
    id: "email",

    validateConfig(config: ChannelConfig) {
      if (!EMAIL_PATTERN.test(config.destination)) {
        return {
          ok: false,
          errors: [`destination "${config.destination}" is not an email address`],
        };
      }
      return { ok: true };
    },

    async send(
      payload: NotificationPayload,
      config: ChannelConfig,
    ): Promise<SendResult> {
      try {
        const body = payload.eventUrl
          ? `${payload.body}\n\n${payload.eventUrl}`
          : payload.body;
        const result = await transport.send({
          to: config.destination,
          subject: payload.title,
          body,
        });
        return { ok: true, providerRef: result.providerRef };
      } catch (error) {
        // The logging transport never throws; a real transport's errors
        // arrive here once one is substituted in. With nothing yet to base
        // a finer classification on, an unexpected transport failure is
        // presumed transient rather than treated as a dead end.
        return {
          ok: false,
          retryable: true,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  };
}
