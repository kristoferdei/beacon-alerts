import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A package-lock.json outside this git repository (in the parent
  // directory) otherwise makes Turbopack guess the workspace root.
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },
  // `next dev` otherwise appends an agent-instructions block to CLAUDE.md on
  // every run, which is a human-authored file this project treats as
  // authoritative.
  agentRules: false,
};

export default nextConfig;
