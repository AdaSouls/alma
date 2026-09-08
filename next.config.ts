import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // apps/identity-studio and packages/* are separate npm workspaces with
  // their own toolchains — nothing here needs to reach into them at build
  // time, so there's nothing extra to configure for the monorepo layout.
};

export default nextConfig;
