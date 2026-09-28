import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export interface BridgeStatus {
  shakingProgress: number; // 0 to 100
  isShaking: boolean;
  shakeIntensity: number; // Accel magnitude (e.g. 1.2 to 3.5g)
  status: "IDLE" | "SHAKING" | "OFFLOADING" | "COMPLETED" | "SLASHED";
  txHash?: string;
  blockNumber?: number;
  message?: string;
  lastUpdated?: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __roboshare_bridge_status: BridgeStatus;
}

const DEFAULT_STATUS: BridgeStatus = {
  shakingProgress: 0,
  isShaking: false,
  shakeIntensity: 0.98,
  status: "IDLE",
  txHash: undefined,
  blockNumber: undefined,
  message: "Listening for Python bridge...",
  lastUpdated: 0,
};

if (!globalThis.__roboshare_bridge_status) {
  globalThis.__roboshare_bridge_status = { ...DEFAULT_STATUS };
}

/**
 * GET /api/bridge-status
 * Member 3's frontend calls this to get real-time shaking progress and the final txHash.
 * Reads from memory cache (if POSTed by Python) OR from project root `status.json` (if written by Python).
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

  return NextResponse.json(globalThis.__roboshare_bridge_status);
}

/**
 * POST /api/bridge-status
 * Member 4's Python bridge can simply HTTP POST its updates directly here!
 * 
 * Payload example:
 * {
 *   "shakingProgress": 65,
 *   "isShaking": true,
 *   "shakeIntensity": 2.45,
 *   "status": "SHAKING",
 *   "txHash": "0x823ec1b9a53e69d9ede1014afcfa1245c4ef2c36ea1ccad731db21d5cbd96f19",
 *   "blockNumber": 20865320,
 *   "message": "Physical board shake in progress"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    globalThis.__roboshare_bridge_status = {
      shakingProgress: typeof body.shakingProgress === "number" ? Math.min(100, Math.max(0, body.shakingProgress)) : globalThis.__roboshare_bridge_status.shakingProgress,
      isShaking: Boolean(body.isShaking),
      shakeIntensity: typeof body.shakeIntensity === "number" ? body.shakeIntensity : globalThis.__roboshare_bridge_status.shakeIntensity,
      status: body.status || "IDLE",
      txHash: body.txHash || globalThis.__roboshare_bridge_status.txHash,
      blockNumber: body.blockNumber || globalThis.__roboshare_bridge_status.blockNumber,
      message: body.message || "Updated by Python bridge",
      lastUpdated: Date.now(),
    };

    return NextResponse.json({
      success: true,
      data: globalThis.__roboshare_bridge_status,
    });
  } catch {
    return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
  }
}
