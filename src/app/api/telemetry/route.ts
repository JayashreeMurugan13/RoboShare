import { NextRequest, NextResponse } from "next/server";
import { TelemetryData } from "@/types";

declare global {
  // eslint-disable-next-line no-var
  var __roboshare_telemetry: TelemetryData & { lastUpdated: number };
}

// Default fallback telemetry state
const DEFAULT_TELEMETRY: TelemetryData & { lastUpdated: number } = {
  accelX: 0.42,
  accelY: -0.05,
  accelZ: 0.98,
  gyroX: 0.02,
  gyroY: -0.01,
  gyroZ: 0.04,
  tempC: 38.4,
  storageUsedGB: 3.80,
  storageTotalGB: 32.0,
  batteryPct: 92,
  deviceName: "Neurick-ESP32-S3",
  firmware: "v1.12-MPU",
  isBoardConnected: false,
  lastUpdated: 0,
};

if (!globalThis.__roboshare_telemetry) {
  globalThis.__roboshare_telemetry = { ...DEFAULT_TELEMETRY };
}

/**
 * GET /api/telemetry
 * Returns the latest live telemetry from the Neurick ESP32 board.
 * If no packet has been received in the last 4 seconds, marks isBoardConnected: false.
 */
export async function GET() {
  const current = globalThis.__roboshare_telemetry;
  const isFresh = Date.now() - current.lastUpdated < 4000;

  return NextResponse.json({
    ...current,
    isBoardConnected: isFresh,
  });
}

/**
 * POST /api/telemetry
 * Receives JSON telemetry data directly from the Neurick ESP32 over local Wi-Fi.
 * 
 * Payload format:
 * {
 *   "accelX": 0.42,
 *   "accelY": -0.05,
 *   "accelZ": 0.98,
 *   "gyroX": 0.02,
 *   "gyroY": -0.01,
 *   "gyroZ": 0.04,
 *   "tempC": 38.4,
 *   "storageUsedGB": 3.8,
 *   "storageTotalGB": 32.0,
 *   "batteryPct": 92
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const ax = typeof data.accelX === "number" ? data.accelX : 0;
    const ay = typeof data.accelY === "number" ? data.accelY : 0;
    const az = typeof data.accelZ === "number" ? data.accelZ : 0.98;
    const mag = Math.sqrt(ax * ax + ay * ay + az * az);
    const isShaking = Math.abs(mag - 1.0) > 0.35 || mag > 1.35;

    let storage = typeof data.storageUsedGB === "number"
      ? data.storageUsedGB
      : (globalThis.__roboshare_telemetry?.storageUsedGB ?? 3.80);

    // If physical shake is detected from MPU6050, increase storage capacity (simulating recorded sensor data)
    if (isShaking && typeof data.storageUsedGB !== "number") {
      storage = Math.min(32.0, storage + 0.35 * Math.max(1, mag));
    }

    if (data.resetStorage) {
      storage = 3.80;
    }

    globalThis.__roboshare_telemetry = {
      accelX: ax,
      accelY: ay,
      accelZ: az,
      gyroX: typeof data.gyroX === "number" ? data.gyroX : 0,
      gyroY: typeof data.gyroY === "number" ? data.gyroY : 0,
      gyroZ: typeof data.gyroZ === "number" ? data.gyroZ : 0,
      tempC: typeof data.tempC === "number" ? data.tempC : 38.0,
      storageUsedGB: parseFloat(storage.toFixed(2)),
      storageTotalGB: typeof data.storageTotalGB === "number" ? data.storageTotalGB : 32.0,
      batteryPct: typeof data.batteryPct === "number" ? data.batteryPct : 90,
      deviceName: data.deviceName || "Neurick-ESP32-S3",
      firmware: data.firmware || "v1.12-MPU",
      isBoardConnected: true,
      lastUpdated: Date.now(),
    };

    return NextResponse.json({
      status: "ok",
      receivedAt: new Date().toISOString(),
      storageAlert: globalThis.__roboshare_telemetry.storageUsedGB >= 27.2,
      isShaking,
      storageUsedGB: globalThis.__roboshare_telemetry.storageUsedGB,
    });
  } catch {
    return NextResponse.json({ error: "Invalid JSON telemetry payload" }, { status: 400 });
  }
}
