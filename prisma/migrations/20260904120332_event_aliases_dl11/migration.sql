-- DropIndex
DROP INDEX "events_source_sourceEventId_key";

-- CreateTable
CREATE TABLE "event_aliases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    CONSTRAINT "event_aliases_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "event_aliases_source_alias_key" ON "event_aliases"("source", "alias");
