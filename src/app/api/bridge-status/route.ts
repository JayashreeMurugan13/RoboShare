import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export interface BridgeStatus {
  shakingProgress: number; // 0 to 100
  isShaking: boolean;
  shakeIntensity: number; // Accel magnitude in g
  status: "IDLE" | "SHAKING" | "OFFLOADING" | "COMPLETED" | "SLASHED" | string;
  txHash?: string;
  blockNumber?: number;
  message?: string;
  lastUpdated?: number;
  restingGravity?: number;
  rawX?: number;
  rawY?: number;
  rawZ?: number;
  accelX?: number;
  accelY?: number;
  accelZ?: number;
  motionIntensity?: number;
  storageKb?: number;
  maxStorageKb?: number;
  isBoardConnected?: boolean;
  terminalLogs?: string[];
}

declare global {
  // eslint-disable-next-line no-var
  var __roboshare_bridge_status: BridgeStatus;
  // eslint-disable-next-line no-var
  var __roboshare_terminal_logs: string[];
}

if (!globalThis.__roboshare_terminal_logs) {
  globalThis.__roboshare_terminal_logs = [
    "[SYSTEM] RoboShare DePIN Middleware v1.12 initialized",
    "[SERIAL] Monitoring COM12 at 115200 baud for ESP32-S3 + MPU6050...",
  ];
}

const DEFAULT_STATUS: BridgeStatus = {
  shakingProgress: 0,
  isShaking: false,
  shakeIntensity: 0,
  status: "IDLE",
  txHash: undefined,
  blockNumber: undefined,
  message: "COM12 Hardware Disconnected",
  lastUpdated: 0,
  restingGravity: 0,
  rawX: 0,
  rawY: 0,
  rawZ: 0,
  accelX: 0,
  accelY: 0,
  accelZ: 0,
  motionIntensity: 0,
  storageKb: 0,
  maxStorageKb: 1000,
  isBoardConnected: false,
  terminalLogs: [],
};

if (!globalThis.__roboshare_bridge_status) {
  globalThis.__roboshare_bridge_status = { ...DEFAULT_STATUS };
}

/**
 * GET /api/bridge-status
 * Reads real-time shaking progress, live hardware metrics, and terminal logs.
 * Enforces strict 2.0-second freshness window for isBoardConnected.
 */
export async function GET() {
  const filePath = path.join(process.cwd(), "status.json");

  // If status.json exists on disk and is fresher than in-memory cache, read it
  if (fs.existsSync(filePath)) {
    try {
      const stats = fs.statSync(filePath);
      const fileModifiedTime = stats.mtimeMs;

      if (fileModifiedTime > (globalThis.__roboshare_bridge_status.lastUpdated || 0)) {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(fileContent);

        globalThis.__roboshare_bridge_status = {
          ...globalThis.__roboshare_bridge_status,
          ...parsed,
          lastUpdated: fileModifiedTime,
        };
      }
    } catch {
      // Ignore file reading errors
    }
  }

  // Strict 2-second heartbeat freshness window
  const isFresh = Date.now() - (globalThis.__roboshare_bridge_status.lastUpdated || 0) < 2000;
  const isConnected = Boolean(globalThis.__roboshare_bridge_status.isBoardConnected && isFresh);

  return NextResponse.json({
    ...globalThis.__roboshare_bridge_status,
    isBoardConnected: isConnected,
    terminalLogs: globalThis.__roboshare_terminal_logs || [],
  });
}

/**
 * POST /api/bridge-status
 * Edge node bridge pushes live physical COM12 telemetry and terminal logs directly here!
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Append terminal log if provided
    if (body.terminalLog && typeof body.terminalLog === "string") {
      if (!globalThis.__roboshare_terminal_logs) {
        globalThis.__roboshare_terminal_logs = [];
      }
      globalThis.__roboshare_terminal_logs.push(body.terminalLog);
      if (globalThis.__roboshare_terminal_logs.length > 80) {
        globalThis.__roboshare_terminal_logs.shift();
      }
    }

    if (Array.isArray(body.terminalLogs)) {
      if (!globalThis.__roboshare_terminal_logs) {
        globalThis.__roboshare_terminal_logs = [];
      }
      for (const log of body.terminalLogs) {
        if (typeof log === "string") {
          globalThis.__roboshare_terminal_logs.push(log);
        }
      }
      while (globalThis.__roboshare_terminal_logs.length > 80) {
        globalThis.__roboshare_terminal_logs.shift();
      }
    }

    const forceConnected = body.isBoardConnected !== undefined ? Boolean(body.isBoardConnected) : true;

    const updated: BridgeStatus = {
      shakingProgress: typeof body.shakingProgress === "number" ? Math.min(100, Math.max(0, body.shakingProgress)) : globalThis.__roboshare_bridge_status.shakingProgress,
      isShaking: Boolean(body.isShaking),
      shakeIntensity: typeof body.shakeIntensity === "number" ? body.shakeIntensity : globalThis.__roboshare_bridge_status.shakeIntensity,
      status: body.status || "IDLE",
      txHash: body.txHash || globalThis.__roboshare_bridge_status.txHash,
      blockNumber: body.blockNumber || globalThis.__roboshare_bridge_status.blockNumber,
      message: body.message || (forceConnected ? "Streaming live from COM12" : "Hardware Disconnected"),
      lastUpdated: forceConnected ? Date.now() : 0,
      restingGravity: typeof body.restingGravity === "number" ? body.restingGravity : globalThis.__roboshare_bridge_status.restingGravity,
      rawX: typeof body.rawX === "number" ? body.rawX : globalThis.__roboshare_bridge_status.rawX,
      rawY: typeof body.rawY === "number" ? body.rawY : globalThis.__roboshare_bridge_status.rawY,
      rawZ: typeof body.rawZ === "number" ? body.rawZ : globalThis.__roboshare_bridge_status.rawZ,
      accelX: typeof body.accelX === "number" ? body.accelX : globalThis.__roboshare_bridge_status.accelX,
      accelY: typeof body.accelY === "number" ? body.accelY : globalThis.__roboshare_bridge_status.accelY,
      accelZ: typeof body.accelZ === "number" ? body.accelZ : globalThis.__roboshare_bridge_status.accelZ,
      motionIntensity: typeof body.motionIntensity === "number" ? body.motionIntensity : globalThis.__roboshare_bridge_status.motionIntensity,
      storageKb: typeof body.storageKb === "number" ? body.storageKb : globalThis.__roboshare_bridge_status.storageKb,
      maxStorageKb: typeof body.maxStorageKb === "number" ? body.maxStorageKb : 1000,
      isBoardConnected: forceConnected,
      terminalLogs: globalThis.__roboshare_terminal_logs || [],
    };

    globalThis.__roboshare_bridge_status = updated;

    // Sync directly into global telemetry cache for 100% data consistency
    if (globalThis.__roboshare_telemetry) {
      globalThis.__roboshare_telemetry = {
        ...globalThis.__roboshare_telemetry,
        accelX: updated.accelX ?? globalThis.__roboshare_telemetry.accelX,
        accelY: updated.accelY ?? globalThis.__roboshare_telemetry.accelY,
        accelZ: updated.accelZ ?? globalThis.__roboshare_telemetry.accelZ,
        storageUsedGB: updated.storageKb !== undefined ? parseFloat(((updated.storageKb / 1000.0) * 32.0).toFixed(2)) : globalThis.__roboshare_telemetry.storageUsedGB,
        isBoardConnected: forceConnected,
        restingGravity: updated.restingGravity,
        rawX: updated.rawX,
        rawY: updated.rawY,
        rawZ: updated.rawZ,
        motionIntensity: updated.motionIntensity,
        storageKb: updated.storageKb,
        maxStorageKb: updated.maxStorageKb,
        lastUpdated: forceConnected ? Date.now() : 0,
      };
    }

    return NextResponse.json({
      success: true,
      data: globalThis.__roboshare_bridge_status,
    });
  } catch {
    return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
  }
}

