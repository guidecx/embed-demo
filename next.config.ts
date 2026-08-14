import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The demo is opened through an HTTPS reverse proxy (see README), so the dev
  // server must accept asset requests coming from that origin.
  allowedDevOrigins: ["*.dev.guidecx.io"],
};

export default nextConfig;
