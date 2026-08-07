import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // There is a stray lockfile above this directory; without an explicit root
  // Turbopack picks D:\Workspace and traces the wrong tree.
  turbopack: { root: path.resolve(process.cwd()) },
};

export default nextConfig;
