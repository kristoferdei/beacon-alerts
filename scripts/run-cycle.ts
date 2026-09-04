import { prisma } from "../src/lib/prisma.ts";
import { normalizeUsgsFeature } from "../src/sources/usgs/normalizer.ts";
import type { UsgsRawFeatureCollection } from "../src/sources/usgs/raw-types.ts";
import { resolveEventIdentity, type StoredEvent } from "../src/ingestion/identity.ts";
import { matches, type MatchableEvent } from "../src/ingestion/matches.ts";
import { decideAlertability } from "../src/ingestion/alertability.ts";
import { createDefaultChannelRegistry } from "../src/channels/index.ts";
import { dispatch } from "../src/channels/dispatcher.ts";
import { createPrismaDeliveryAttemptRecorder } from "../src/channels/prisma-recorder.ts";
import type { AlertRule, AttributeValue, RuleOperator } from "../src/domain/types.ts";
import type { ChannelConfig, NotificationPayload } from "../src/channels/types.ts";

const FEED_URL =
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";

function toAttributeValue(value: unknown): AttributeValue {
  if (typeof value === "number" || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  throw new Error(`stored rule value ${JSON.stringify(value)} is not number/string/boolean`);
}

async function loadRules(): Promise<AlertRule[]> {
  const rows = await prisma.alertRule.findMany({ where: { enabled: true } });
  return rows.map((row): AlertRule => ({
    id: row.id,
    userId: row.userId,
    name: row.name,
    source: row.source,
    eventType: row.eventType,
    attribute: row.attribute,
    operator: row.operator as RuleOperator,
    value: toAttributeValue(row.value),
    region:
      row.regionLat !== null && row.regionLon !== null && row.regionRadiusKm !== null
        ? { lat: row.regionLat, lon: row.regionLon, radiusKm: row.regionRadiusKm }
        : null,
    channelConfigId: row.channelConfigId,
    enabled: row.enabled,
  }));
}

type EventCategory = "new" | "revised" | "withdrawn" | "unchanged" | "merged";

type DeliveryAttemptSummary = {
  ruleName: string;
  eventTitle: string;
  attemptNumber: number;
  status: string;
  error: string | null;
};

async function main(): Promise<void> {
  const response = await fetch(FEED_URL);
  if (!response.ok) {
    throw new Error(`USGS feed request failed: ${response.status} ${response.statusText}`);
  }
  const collection: UsgsRawFeatureCollection = await response.json();
  const normalizedEvents = collection.features.map(normalizeUsgsFeature);

  // Preloaded once: identity resolution needs every stored event's aliases,
  // and revision detection needs its current content.
  const storedEventRows = await prisma.event.findMany({ include: { aliases: true } });
  const existingEvents: StoredEvent[] = storedEventRows.map((row) => ({
    eventId: row.id,
    aliases: row.aliases.map((a) => a.alias),
    ingestedAt: row.ingestedAt.toISOString(),
  }));
  const storedById = new Map(storedEventRows.map((row) => [row.id, row]));

  const rules = await loadRules();
  const registry = createDefaultChannelRegistry();
  const recorder = createPrismaDeliveryAttemptRecorder(prisma);
  const channelConfigCache = new Map<string, ChannelConfig>();

  async function getChannelConfig(channelConfigId: string): Promise<ChannelConfig> {
    const cached = channelConfigCache.get(channelConfigId);
    if (cached) {
      return cached;
    }
    const row = await prisma.channelConfig.findUniqueOrThrow({
      where: { id: channelConfigId },
    });
    const config: ChannelConfig = {
      id: row.id,
      channelId: row.channelId,
      destination: row.destination,
      secretEnvVar: row.secretEnvVar,
    };
    channelConfigCache.set(channelConfigId, config);
    return config;
  }

  const counts = {
    fetched: normalizedEvents.length,
    new: 0,
    revised: 0,
    withdrawn: 0,
    unchanged: 0,
    merged: 0,
    rulesEvaluated: 0,
    matches: 0,
    alertsDispatched: 0,
  };
  const deliveryAttempts: DeliveryAttemptSummary[] = [];

  for (const normalized of normalizedEvents) {
    const resolution = resolveEventIdentity(
      { aliases: normalized.sourceEventIds },
      existingEvents,
    );

    let eventId: string;
    let category: EventCategory;

    if (resolution.kind === "new") {
      const created = await prisma.event.create({
        data: {
          source: normalized.source,
          sourceEventId: normalized.sourceEventIds[0],
          type: normalized.type,
          occurredAt: new Date(normalized.occurredAt),
          revisedAt: normalized.revisedAt ? new Date(normalized.revisedAt) : null,
          status: normalized.status,
          title: normalized.title,
          locationLat: normalized.location?.lat ?? null,
          locationLon: normalized.location?.lon ?? null,
          locationLabel: normalized.location?.label ?? null,
          attributes: normalized.attributes,
          aliases: {
            create: normalized.sourceEventIds.map((alias) => ({
              source: normalized.source,
              alias,
            })),
          },
        },
      });
      eventId = created.id;
      category = "new";
      existingEvents.push({
        eventId,
        aliases: normalized.sourceEventIds,
        ingestedAt: created.ingestedAt.toISOString(),
      });
    } else if (resolution.kind === "existing") {
      eventId = resolution.eventId;
      const stored = storedById.get(eventId);
      if (!stored) {
        throw new Error(`resolved to unknown stored event ${eventId}`);
      }

      if (resolution.newAliases.length > 0) {
        // SQLite's Prisma connector does not support skipDuplicates; not
        // needed anyway, since resolveEventIdentity only ever returns
        // aliases the stored event doesn't already have.
        await prisma.eventAlias.createMany({
          data: resolution.newAliases.map((alias) => ({
            source: normalized.source,
            alias,
            eventId,
          })),
        });
        const inMemory = existingEvents.find((e) => e.eventId === eventId);
        inMemory?.aliases.push(...resolution.newAliases);
      }

      const storedRevisedAtIso = stored.revisedAt ? stored.revisedAt.toISOString() : null;
      const contentChanged =
        storedRevisedAtIso !== normalized.revisedAt || stored.status !== normalized.status;

      if (contentChanged) {
        await prisma.event.update({
          where: { id: eventId },
          data: {
            revisedAt: normalized.revisedAt ? new Date(normalized.revisedAt) : null,
            status: normalized.status,
            title: normalized.title,
            attributes: normalized.attributes,
            locationLat: normalized.location?.lat ?? null,
            locationLon: normalized.location?.lon ?? null,
            locationLabel: normalized.location?.label ?? null,
          },
        });
        category =
          normalized.status === "withdrawn" && stored.status !== "withdrawn"
            ? "withdrawn"
            : "revised";
      } else {
        category = "unchanged";
      }
    } else {
      // Merge (DL-11): two previously-separate stored events share an
      // alias with this observation. Recording the new aliases against the
      // canonical event is done; actually marking the other event "merged"
      // has no column to write to (not built — see the response for why).
      // Not alerting is enforced simply by never entering the evaluation
      // block below for this iteration.
      eventId = resolution.canonicalEventId;
      category = "merged";
      const canonicalAliases = existingEvents.find((e) => e.eventId === eventId);
      const newAliases = normalized.sourceEventIds.filter(
        (alias) => !canonicalAliases?.aliases.includes(alias),
      );
      if (newAliases.length > 0) {
        await prisma.eventAlias.createMany({
          data: newAliases.map((alias) => ({ source: normalized.source, alias, eventId })),
        });
        canonicalAliases?.aliases.push(...newAliases);
      }
    }

    counts[category] += 1;

    const shouldEvaluate =
      (category === "new" && normalized.status === "active") || category === "revised";
    if (!shouldEvaluate) {
      continue;
    }

    const matchableEvent: MatchableEvent = {
      source: normalized.source,
      type: normalized.type,
      status: normalized.status,
      attributes: normalized.attributes,
    };

    for (const rule of rules) {
      if (rule.source !== normalized.source) {
        continue;
      }
      counts.rulesEvaluated += 1;

      const currentlyMatches = matches(rule, matchableEvent);
      if (currentlyMatches) {
        counts.matches += 1;
      }

      const existingRuleMatch = await prisma.ruleMatch.findUnique({
        where: { ruleId_eventId: { ruleId: rule.id, eventId } },
      });
      const priorRecord = existingRuleMatch ? { matched: existingRuleMatch.matched } : null;

      const action = decideAlertability(normalized.status, currentlyMatches, priorRecord);

      let ruleMatchId: string | null = null;
      if (action === "alert-new-match") {
        const created = await prisma.ruleMatch.create({
          data: { ruleId: rule.id, eventId, matched: true, alertedAt: new Date() },
        });
        ruleMatchId = created.id;
      } else if (action === "already-alerted") {
        const updated = await prisma.ruleMatch.update({
          where: { ruleId_eventId: { ruleId: rule.id, eventId } },
          data: { matched: true },
        });
        ruleMatchId = updated.id;
      } else if (action === "record-no-alert") {
        await prisma.ruleMatch.update({
          where: { ruleId_eventId: { ruleId: rule.id, eventId } },
          data: { matched: false },
        });
      } else if (action === "alert-revision-match") {
        const updated = await prisma.ruleMatch.update({
          where: { ruleId_eventId: { ruleId: rule.id, eventId } },
          data: { matched: true, alertedAt: new Date() },
        });
        ruleMatchId = updated.id;
      }
      // "no-op" and "withdraw" need no row written, per the DL-07 table.

      if (
        ruleMatchId &&
        (action === "alert-new-match" || action === "alert-revision-match")
      ) {
        const channelConfig = await getChannelConfig(rule.channelConfigId);
        const payload: NotificationPayload = {
          title: `Alert: ${rule.name}`,
          body: `${normalized.title} matched rule "${rule.name}" (${rule.attribute} ${rule.operator} ${String(rule.value)}).`,
          // CanonicalEvent carries no URL field yet (not built in any prior
          // step); nothing to put here honestly.
          eventUrl: null,
        };
        await dispatch({ ruleMatchId, payload, channelConfig }, registry, recorder);
        counts.alertsDispatched += 1;

        const attempts = await prisma.deliveryAttempt.findMany({
          where: { ruleMatchId },
          orderBy: { attemptNumber: "asc" },
        });
        for (const attempt of attempts) {
          deliveryAttempts.push({
            ruleName: rule.name,
            eventTitle: normalized.title,
            attemptNumber: attempt.attemptNumber,
            status: attempt.status,
            error: attempt.error,
          });
        }
      }
    }
  }

  console.log(`USGS ingestion cycle — ${new Date().toISOString()}`);
  console.log(`  events fetched:     ${counts.fetched}`);
  console.log(`  events new:         ${counts.new}`);
  console.log(`  events revised:     ${counts.revised}`);
  console.log(`  events withdrawn:   ${counts.withdrawn}`);
  console.log(`  events unchanged:   ${counts.unchanged}`);
  console.log(`  events merged:      ${counts.merged}`);
  console.log(`  rules evaluated:    ${counts.rulesEvaluated}`);
  console.log(`  rule matches:       ${counts.matches}`);
  console.log(`  alerts dispatched:  ${counts.alertsDispatched}`);
  if (deliveryAttempts.length === 0) {
    console.log("  delivery attempts:  (none)");
  } else {
    console.log("  delivery attempts:");
    for (const attempt of deliveryAttempts) {
      const errorSuffix = attempt.error ? ` — ${attempt.error}` : "";
      console.log(
        `    [${attempt.status}] attempt ${attempt.attemptNumber}: "${attempt.ruleName}" / ${attempt.eventTitle}${errorSuffix}`,
      );
    }
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
