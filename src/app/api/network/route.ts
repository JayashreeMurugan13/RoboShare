import { NextRequest, NextResponse } from "next/server";
import os from "os";

export async function GET(req: NextRequest) {
  const ifaces = os.networkInterfaces();
  let serverIp = "10.80.79.244";
  let netmask = "255.255.0.0";
  let interfaceName = "Wi-Fi";

  for (const name of Object.keys(ifaces)) {
    const list = ifaces[name] || [];
    const found = list.find((i) => i.family === "IPv4" && !i.internal);
    if (found) {
      serverIp = found.address;
      netmask = found.netmask;
      interfaceName = name;
      break;
    }
  }

  // Detect caller IP from incoming request
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const rawCaller = forwarded?.split(",")[0].trim() || realIp || serverIp;
  const cleanCaller = rawCaller.replace(/^::ffff:/, "");

  const isServerHost =
    cleanCaller === serverIp ||
    cleanCaller === "127.0.0.1" ||
    cleanCaller === "::1" ||
    cleanCaller === "localhost";

  // Distinguish caller device vs peer device
  const callerIp = isServerHost ? serverIp : cleanCaller;
  const callerDeviceName = isServerHost ? "ASUS TUF Gaming A15" : "HP Laptop";
  const callerDeviceType = isServerHost
    ? "ASUSTeK TUF Gaming A15 (Windows 11)"
    : "HP Pavilion Laptop (Windows 11)";

  const peerIp = isServerHost ? "10.80.79.44" : serverIp;
  const peerDeviceName = isServerHost ? "HP Laptop" : "ASUS TUF Gaming A15";
  const peerDeviceType = isServerHost
    ? "HP Pavilion Laptop (Windows 11)"
    : "ASUSTeK TUF Gaming A15 (Windows 11)";

  const subnetBase = serverIp.split(".").slice(0, 2).join(".") + ".0.0/16";

  return NextResponse.json({
    localIp: callerIp,
    serverIp,
    clientIp: callerIp,
    isServerHost,
    myDeviceName: callerDeviceName,
    myDeviceType: callerDeviceType,
    peerIp,
    peerDeviceName,
    peerDeviceType,
    netmask,
    subnet: subnetBase,
    interfaceName,
    hostname: isServerHost ? os.hostname() : "HP-Laptop",
    platform: "win32",
    port: 3001,
    portalUrl: `http://${serverIp}:3001`,
  });
}
