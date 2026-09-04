import { createChannelRegistry, type ChannelRegistry } from "./registry.ts";
import { createEmailAdapter, createLoggingEmailTransport } from "./adapters/email.ts";
import { createSlackAdapter } from "./adapters/slack.ts";

// Where both adapters are registered together (DL-04): neither this file
// nor the two adapters touch registry.ts or dispatcher.ts.
export function createDefaultChannelRegistry(): ChannelRegistry {
  return createChannelRegistry([
    createEmailAdapter(createLoggingEmailTransport()),
    createSlackAdapter(),
  ]);
}
