import { NextRequest, NextResponse } from "next/server";
import { TelemetryData } from "@/types";

declare global {
  // eslint-disable-next-line no-var
  var __roboshare_telemetry: TelemetryData & { lastUpdated: number };
}

// Clean zero-mock fallback telemetry state
const DEFAULT_TELEMETRY: TelemetryData & { lastUpdated: number } = {
  accelX: 0,
  accelY: 0,
  accelZ: 0,
  gyroX: 0,
  gyroY: 0,
  gyroZ: 0,
  tempC: 0,
  storageUsedGB: 0,
  storageTotalGB: 32.0,
  batteryPct: 100,
  deviceName: "Neurick-ESP32-S3",
  firmware: "v1.12-MPU",
  isBoardConnected: false,
  restingGravity: 0,
  rawX: 0,
  rawY: 0,
  rawZ: 0,
  motionIntensity: 0,
  storageKb: 0,
  maxStorageKb: 1000,
  lastUpdated: 0,
};

if (!globalThis.__roboshare_telemetry) {
  globalThis.__roboshare_telemetry = { ...DEFAULT_TELEMETRY };
}

/**
 * GET /api/telemetry
 * Returns the latest live telemetry from the Neurick ESP32 board.
 * If no packet has been received in the last 1.5 seconds, marks isBoardConnected: false instantly.
 */
export async function GET() {
  const current = globalThis.__roboshare_telemetry;
  
  // Strict 1.5-second threshold: if Python bridge stops or crashes, UI flips to disconnected immediately
  const isFresh = Date.now() - current.lastUpdated < 1500;

  return NextResponse.json({
    ...current,
    isBoardConnected: isFresh,
  });
}

/**
 * POST /api/telemetry
 * Receives JSON telemetry data directly from the Neurick ESP32 over local Wi-Fi or COM12 bridge.
 */
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const ax = typeof data.accelX === "number" ? data.accelX : (globalThis.__roboshare_telemetry?.accelX ?? 0);
    const ay = typeof data.accelY === "number" ? data.accelY : (globalThis.__roboshare_telemetry?.accelY ?? 0);
    const az = typeof data.accelZ === "number" ? data.accelZ : (globalThis.__roboshare_telemetry?.accelZ ?? 0);
    const mag = typeof data.motionIntensity === "number" ? data.motionIntensity : Math.sqrt(ax * ax + ay * ay + az * az);
    const isShaking = data.isShaking !== undefined ? Boolean(data.isShaking) : (mag > 20000 || Math.abs(mag - 1.0) > 0.35);

    let storageUsedGB = typeof data.storageUsedGB === "number"
      ? data.storageUsedGB
      : (data.storageKb !== undefined ? parseFloat(((data.storageKb / 1000.0) * 32.0).toFixed(2)) : (globalThis.__roboshare_telemetry?.storageUsedGB ?? 0));

    if (data.resetStorage) {
      storageUsedGB = 0;
    }

    // Allow explicit disconnect command from bridge script
    const forceConnected = data.isBoardConnected !== undefined ? Boolean(data.isBoardConnected) : true;

    globalThis.__roboshare_telemetry = {
      accelX: ax,
      accelY: ay,
      accelZ: az,
      gyroX: typeof data.gyroX === "number" ? data.gyroX : (globalThis.__roboshare_telemetry?.gyroX ?? 0),
      gyroY: typeof data.gyroY === "number" ? data.gyroY : (globalThis.__roboshare_telemetry?.gyroY ?? 0),
      gyroZ: typeof data.gyroZ === "number" ? data.gyroZ : (globalThis.__roboshare_telemetry?.gyroZ ?? 0),
      tempC: typeof data.tempC === "number" ? data.tempC : (globalThis.__roboshare_telemetry?.tempC ?? 0),
      storageUsedGB: parseFloat(storageUsedGB.toFixed(2)),
      storageTotalGB: typeof data.storageTotalGB === "number" ? data.storageTotalGB : 32.0,
      batteryPct: typeof data.batteryPct === "number" ? data.batteryPct : 100,
      deviceName: data.deviceName || "Neurick-ESP32-S3",
      firmware: data.firmware || "v1.12-MPU",
      isBoardConnected: forceConnected,
      restingGravity: typeof data.restingGravity === "number" ? data.restingGravity : globalThis.__roboshare_telemetry.restingGravity,
      rawX: typeof data.rawX === "number" ? data.rawX : globalThis.__roboshare_telemetry.rawX,
      rawY: typeof data.rawY === "number" ? data.rawY : globalThis.__roboshare_telemetry.rawY,
      rawZ: typeof data.rawZ === "number" ? data.rawZ : globalThis.__roboshare_telemetry.rawZ,
      motionIntensity: typeof data.motionIntensity === "number" ? data.motionIntensity : globalThis.__roboshare_telemetry.motionIntensity,
      storageKb: typeof data.storageKb === "number" ? data.storageKb : globalThis.__roboshare_telemetry.storageKb,
      maxStorageKb: typeof data.maxStorageKb === "number" ? data.maxStorageKb : 1000,
      lastUpdated: forceConnected ? Date.now() : 0, // If explicitly disconnected, zero out timestamp
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