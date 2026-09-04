// Channel abstraction, docs/02-architecture.md section 6 and
// docs/03-decision-log.md DL-04, DL-05.

// The channel_configs row an adapter needs to act: a destination and the
// name of an environment variable holding the secret, never the secret
// itself (hard rule 4). `id` is included so the dispatcher can attach a
// delivery attempt to the config that produced it.
export type ChannelConfig = {
  id: string;
  channelId: string;
  destination: string;
  secretEnvVar: string;
};

export type ValidationResult = { ok: true } | { ok: false; errors: string[] };

export type NotificationPayload = {
  title: string;
  body: string;
  eventUrl: string | null;
};

export type SendResult =
  | { ok: true; providerRef?: string }
  | { ok: false; retryable: boolean; error: string };

export type ChannelAdapter = {
  id: string;
  validateConfig(config: ChannelConfig): ValidationResult;
  send(payload: NotificationPayload, config: ChannelConfig): Promise<SendResult>;
};
