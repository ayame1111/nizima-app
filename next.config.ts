import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // These settings help prevent memory exhaustion on small servers during build
    workerThreads: false,
    cpus: 1,
  },
  /* config options here */
};

export default nextConfig;
