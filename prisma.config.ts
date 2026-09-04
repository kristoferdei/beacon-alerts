import { defineConfig } from "prisma/config";

// Prisma 7 moved the connection URL for Migrate out of schema.prisma and
// into this file. It does not affect application code, which will need a
// driver adapter to instantiate PrismaClient at runtime (not required yet:
// this step only defines the schema, it does not construct a client).
//
// This file does not load .env itself (that needs a `dotenv` dependency,
// proposed separately rather than added here). Until then, DATABASE_URL
// must be present in the environment already, e.g. `next dev` (which loads
// .env on its own) or by exporting it before running a `prisma` command.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
