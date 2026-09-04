import { defineConfig } from "prisma/config";

// Prisma 7 moved the connection URL for Migrate out of schema.prisma and
// into this file. It does not affect application code (src/lib/prisma.ts),
// which connects through a driver adapter instead.
//
// This file does not load .env — a bare `npx prisma migrate ...`, run in a
// fresh shell with nothing exported, has no DATABASE_URL in its process
// environment at all. The previous version of this file fell back to an
// empty string in that case, which is exactly what produced "Connection
// url is empty" for both `migrate dev` and `migrate deploy`: process.env
// was never the problem, the empty-string fallback was. DATABASE_URL is a
// local file path, not a secret, so the fix is the same fallback
// src/lib/prisma.ts already uses, not a dotenv dependency.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  },
});
