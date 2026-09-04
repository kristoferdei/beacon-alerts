import { prisma } from "../src/lib/prisma.ts";

// Fixed ids (not the cuid() default) so this script is safe to run more
// than once: every upsert targets the same row on a second run instead of
// creating a duplicate.
const USER_ID = "seed-user-ops";
const CHANNEL_CONFIG_ID = "seed-channel-email";
const RULE_FREQUENT_ID = "seed-rule-magnitude-2-5";
const RULE_SIGNIFICANT_ID = "seed-rule-magnitude-4-5";

// Thresholds chosen from the magnitude distribution of the saved USGS
// fixture (src/sources/usgs/__fixtures__/all_day-2026-09-04.geojson, 328
// features, magnitudes -1.21 to 6.3, median 1.87):
//   >= 2.5: 117 of 328 (35.7%)
//   >= 4.5:  22 of 328 (6.7%)
// 2.5 fires on roughly a third of any given day's events — close to
// certain to produce at least one alert against a live all_day feed, which
// the run step needs on its first execution. 4.5 is a genuinely rarer,
// more significant threshold, still common enough that most days see one
// somewhere in the world, giving two rules with meaningfully different
// hit rates rather than two restatements of the same one.
const MAGNITUDE_THRESHOLD_FREQUENT = 2.5;
const MAGNITUDE_THRESHOLD_SIGNIFICANT = 4.5;

async function main(): Promise<void> {
  const user = await prisma.user.upsert({
    where: { id: USER_ID },
    update: {},
    create: { id: USER_ID, name: "Ops", email: "ops@example.com" },
  });

  const channelConfig = await prisma.channelConfig.upsert({
    where: { id: CHANNEL_CONFIG_ID },
    update: {},
    create: {
      id: CHANNEL_CONFIG_ID,
      userId: user.id,
      channelId: "email",
      destination: "ops@example.com",
      // Read by the email adapter's real transport if one is ever
      // substituted for the logging transport; unused today.
      secretEnvVar: "EMAIL_TRANSPORT_SECRET",
    },
  });

  const frequentRule = await prisma.alertRule.upsert({
    where: { id: RULE_FREQUENT_ID },
    update: {},
    create: {
      id: RULE_FREQUENT_ID,
      userId: user.id,
      name: "Magnitude 2.5+ earthquakes",
      source: "usgs",
      eventType: "earthquake",
      attribute: "magnitude",
      operator: ">=",
      value: MAGNITUDE_THRESHOLD_FREQUENT,
      channelConfigId: channelConfig.id,
      enabled: true,
    },
  });

  const significantRule = await prisma.alertRule.upsert({
    where: { id: RULE_SIGNIFICANT_ID },
    update: {},
    create: {
      id: RULE_SIGNIFICANT_ID,
      userId: user.id,
      name: "Magnitude 4.5+ earthquakes",
      source: "usgs",
      eventType: "earthquake",
      attribute: "magnitude",
      operator: ">=",
      value: MAGNITUDE_THRESHOLD_SIGNIFICANT,
      channelConfigId: channelConfig.id,
      enabled: true,
    },
  });

  console.log("Seed complete.");
  console.log(`  user:           ${user.email} (${user.id})`);
  console.log(
    `  channel config: ${channelConfig.channelId} -> ${channelConfig.destination} (${channelConfig.id})`,
  );
  console.log(
    `  rule:           "${frequentRule.name}" (fires on ~35.7% of a typical day's events, per fixture)`,
  );
  console.log(
    `  rule:           "${significantRule.name}" (fires on ~6.7% of a typical day's events, per fixture)`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
