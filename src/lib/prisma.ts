import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Prisma 7 requires a driver adapter to construct a client at all; there is
// no url-in-schema fallback. Falls back to the same default DATABASE_URL
// prisma.config.ts otherwise expects, so a script run without exporting it
// first still works (DATABASE_URL itself is a local file path, not a
// secret).
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

export const prisma = new PrismaClient({ adapter });
