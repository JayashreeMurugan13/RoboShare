import type { NextConfig } from "next";
import os from "os";

// Dynamically get all local non-loopback IPv4 addresses
// so the Next.js dev server accepts HMR WebSocket connections
// from any device on the same Wi-Fi network (e.g. friend's laptop)
function getLocalIpAddresses(): string[] {
  const ips: string[] = [];
  const ifaces = os.networkInterfaces();
  for (const list of Object.values(ifaces)) {
    for (const iface of list ?? []) {
      if (iface.family === "IPv4" && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

const localIps = getLocalIpAddresses();

const nextConfig: NextConfig = {
  // Allow HMR WebSocket & font/asset requests from any device on the same local Wi-Fi
  // Required so friend's laptop (e.g. 10.80.79.244) can open the dev server without errors
  allowedDevOrigins: [
    ...localIps, // e.g. "10.80.79.244"
  ],
};

export default nextConfig;
