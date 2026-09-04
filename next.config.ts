import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A package-lock.json outside this git repository (in the parent
  // directory) otherwise makes Turbopack guess the workspace root.
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },
  // better-sqlite3 is a native addon; Next's server compiler otherwise
  // pulls it into the bundle instead of leaving it as a plain runtime
  // require, per https://nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
  // `next dev` otherwise appends an agent-instructions block to CLAUDE.md on
  // every run, which is a human-authored file this project treats as
  // authoritative.
  agentRules: false,
};

export default nextConfig;
