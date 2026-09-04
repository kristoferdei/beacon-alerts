import type { ChannelAdapter } from "./types.ts";

// Adapters registered into a map at startup (DL-04). A plain Map rather
// than a module-level singleton: the dispatcher takes one as a parameter,
// so a test can build a registry containing only its own stub adapter
// instead of sharing global state with every other test.
export type ChannelRegistry = Map<string, ChannelAdapter>;

export function createChannelRegistry(adapters: ChannelAdapter[]): ChannelRegistry {
  const registry: ChannelRegistry = new Map();
  for (const adapter of adapters) {
    registry.set(adapter.id, adapter);
  }
  return registry;
}

// The dispatcher resolves through here and only here: it never imports a
// concrete adapter or branches on channelId itself.
export function resolveChannelAdapter(
  registry: ChannelRegistry,
  channelId: string,
): ChannelAdapter {
  const adapter = registry.get(channelId);
  if (!adapter) {
    throw new Error(`no channel adapter registered for "${channelId}"`);
  }
  return adapter;
}
