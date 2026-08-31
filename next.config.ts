import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/gamify",
  assetPrefix: "/gamify/",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
