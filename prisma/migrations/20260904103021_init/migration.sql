-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "sourceEventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL,
    "ingestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revisedAt" DATETIME,
    "status" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "locationLat" REAL,
    "locationLon" REAL,
    "locationLabel" TEXT,
    "attributes" JSONB NOT NULL
);

-- CreateTable
CREATE TABLE "alert_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "eventType" TEXT,
    "attribute" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "regionLat" REAL,
    "regionLon" REAL,
    "regionRadiusKm" REAL,
    "channelConfigId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "alert_rules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "alert_rules_channelConfigId_fkey" FOREIGN KEY ("channelConfigId") REFERENCES "channel_configs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rule_matches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ruleId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "matched" BOOLEAN NOT NULL,
    "alertedAt" DATETIME,
    "lastEvaluatedAt" DATETIME NOT NULL,
    CONSTRAINT "rule_matches_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "alert_rules" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rule_matches_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "channel_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "secretEnvVar" TEXT NOT NULL,
    CONSTRAINT "channel_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "delivery_attempts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ruleMatchId" TEXT NOT NULL,
    "channelConfigId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "providerRef" TEXT,
    "error" TEXT,
    "retryable" BOOLEAN,
    "attemptedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "delivery_attempts_ruleMatchId_fkey" FOREIGN KEY ("ruleMatchId") REFERENCES "rule_matches" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "delivery_attempts_channelConfigId_fkey" FOREIGN KEY ("channelConfigId") REFERENCES "channel_configs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "events_source_sourceEventId_key" ON "events"("source", "sourceEventId");

-- CreateIndex
CREATE UNIQUE INDEX "rule_matches_ruleId_eventId_key" ON "rule_matches"("ruleId", "eventId");
