import { HostNode } from "@/types";

export interface ScanStatus {
  isScanning: boolean;
  phase: "idle" | "broadcasting_mdns" | "pinging_subnet" | "resolving_nodes" | "complete";
  message: string;
  foundCount: number;
}

export interface NetworkInfo {
  localIp: string;
  netmask: string;
  subnet: string;
  interfaceName: string;
  hostname: string;
  portalUrl: string;
  isServerHost?: boolean;
  myDeviceName?: string;
  myDeviceType?: string;
  peerIp?: string;
  peerDeviceName?: string;
  peerDeviceType?: string;
  serverIp?: string;
  clientIp?: string;
}

/**
 * Fetch real network info from server (e.g. 10.80.79.244, 10.80.0.0/16)
 */
export async function getRealNetworkInfo(): Promise<NetworkInfo> {
  try {
    const res = await fetch("/api/network");
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Ignore fallback
  }
  return {
    localIp: "10.80.79.244",
    netmask: "255.255.0.0",
    subnet: "10.80.0.0/16",
    interfaceName: "Wi-Fi",
    hostname: "Zare",
    portalUrl: "http://10.80.79.244:3001",
    isServerHost: true,
    myDeviceName: "ASUS TUF Gaming A15",
    myDeviceType: "ASUSTeK TUF Gaming A15 (Windows 11)",
    peerIp: "10.80.79.44",
    peerDeviceName: "HP Laptop",
    peerDeviceType: "HP Pavilion Laptop (Windows 11)",
  };
}

/**
 * Query real active peers registered on the local Wi-Fi from /api/peers
 */
export async function fetchRealWifiPeers(forceScan = false): Promise<HostNode[]> {
  try {
    const res = await fetch(forceScan ? "/api/peers?scan=1" : "/api/peers");
    if (res.ok) {
      const data = await res.json();
      return data.peers || [];
    }
  } catch {
    // Ignore
  }
  return [];
}

/**
 * Register or ping a real friend's laptop by IP on the local Wi-Fi
 */
export async function registerRealPeerNode(peerData: {
  ipAddress: string;
  name?: string;
  deviceType?: string;
  storageFreeGB?: number;
  rateMST?: number;
}): Promise<HostNode | null> {
  try {
    const res = await fetch("/api/peers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(peerData),
    });
    if (res.ok) {
      const data = await res.json();
      return data.registeredPeer;
    }
  } catch {
    // Ignore
  }
  return null;
}
