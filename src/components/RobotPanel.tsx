"use client";

import React, { useState, useEffect } from "react";
import { TelemetryData } from "@/types";
import {
  Cpu,
  HardDrive,
  Activity,
  AlertCircle,
  Zap,
  RotateCcw,
  Sliders,
  Move3d,
  Layers,
  Sparkles,
  ArrowUpRight
} from "lucide-react";

interface RobotPanelProps {
  telemetry: TelemetryData;
  onTriggerOffload: () => void;
  isOffloading: boolean;
  onSimulateShake: () => void;
  onResetStorage: () => void;
  onToggleAutoClimb: () => void;
  autoClimb: boolean;
  shakingProgress?: number;
  finalTxHash?: string;
  shakeIntensity?: number;
  bridgeStatusMessage?: string;
}

export const RobotPanel: React.FC<RobotPanelProps> = ({
  telemetry,
  onTriggerOffload,
  isOffloading,
  onSimulateShake,
  onResetStorage,
  onToggleAutoClimb,
  autoClimb,
  shakingProgress = 0,
  finalTxHash,
  shakeIntensity = 0.98,
  bridgeStatusMessage,
}) => {
  const [history, setHistory] = useState<number[]>([]);

  // Keep a rolling history for mini waveform graph
  useEffect(() => {
    const magnitude = Math.sqrt(
      telemetry.accelX * telemetry.accelX +
      telemetry.accelY * telemetry.accelY +
      telemetry.accelZ * telemetry.accelZ
    );
    setHistory((prev) => [...prev.slice(-24), magnitude]);
  }, [telemetry.accelX, telemetry.accelY, telemetry.accelZ]);

  const storagePct = Math.min(
    100,
    Math.round((telemetry.storageUsedGB / telemetry.storageTotalGB) * 100)
  );

  const isStorageCritical = storagePct >= 85;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Header & Status Badge */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Connected Edge Device
              </h2>
              <p className="text-[11px] text-slate-500 font-mono">
                Hardware Node: Neurick-ESP32-S3
              </p>
            </div>
          </div>

          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              telemetry.isBoardConnected
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                telemetry.isBoardConnected
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-blue-500"
              }`}
            />
            <span>{telemetry.isBoardConnected ? "Neurick Hardware Live" : "Neurick Online"}</span>
          </div>
        </div>

        {/* Device Metadata Pill */}
        <div className="mt-4 grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 text-center">
          <div>
            <span className="block text-[10px] text-slate-400 uppercase font-mono">Firmware</span>
            <span className="text-xs font-semibold text-slate-800 font-mono">v1.12-MPU</span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 uppercase font-mono">Board Temp</span>
            <span className="text-xs font-semibold text-slate-800 font-mono">{telemetry.tempC.toFixed(1)}°C</span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 uppercase font-mono">Battery</span>
            <span className="text-xs font-semibold text-emerald-700 font-mono">{telemetry.batteryPct}%</span>
          </div>
        </div>

        {/* Internal Storage Capacity Section */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-slate-800">Local Memory Capacity</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-500 text-[11px]">
                {telemetry.storageUsedGB.toFixed(2)} GB / {telemetry.storageTotalGB.toFixed(2)} GB
              </span>
              <span
                className={`font-mono font-bold text-xs ${
                  isStorageCritical ? "text-amber-600" : "text-blue-600"
                }`}
              >
                {storagePct}% Full
              </span>
            </div>
          </div>

          {/* Progress Bar with Amber/Blue fill */}
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isStorageCritical
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-xs shadow-amber-500/50"
                  : "bg-gradient-to-r from-blue-500 to-indigo-600"
              }`}
              style={{ width: `${storagePct}%` }}
            />
          </div>

          {isStorageCritical && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Storage threshold reached! Offload recommended to prevent frame drops.</span>
            </div>
          )}

          {/* Mini Storage Simulation Helpers for Demo */}
          <div className="mt-2.5 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={onToggleAutoClimb}
              className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                autoClimb
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
              title="Automatically simulate storage accumulation"
            >
              <Zap className="w-3 h-3 text-blue-500" />
              <span>{autoClimb ? "Auto-Filling (Active)" : "Simulate Auto-Fill"}</span>
            </button>

            <button
              type="button"
              onClick={onResetStorage}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              title="Reset memory usage to baseline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Live Sensor Feed Widget (MPU6050 Accelerometer & Gyroscope) */}
        <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                MPU6050 Motion Feed
              </span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100/70 text-blue-700">
              I2C: 0x68
            </span>
          </div>

          {/* Coordinate Fields X, Y, Z */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs text-center">
              <span className="text-[10px] text-slate-400 font-mono block">AXIS X</span>
              <span className="text-sm font-bold text-slate-900 font-mono">
                {telemetry.accelX >= 0 ? `+${telemetry.accelX.toFixed(2)}` : telemetry.accelX.toFixed(2)}g
              </span>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs text-center">
              <span className="text-[10px] text-slate-400 font-mono block">AXIS Y</span>
              <span className="text-sm font-bold text-slate-900 font-mono">
                {telemetry.accelY >= 0 ? `+${telemetry.accelY.toFixed(2)}` : telemetry.accelY.toFixed(2)}g
              </span>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs text-center">
              <span className="text-[10px] text-slate-400 font-mono block">AXIS Z</span>
              <span className="text-sm font-bold text-blue-700 font-mono">
                {telemetry.accelZ >= 0 ? `+${telemetry.accelZ.toFixed(2)}` : telemetry.accelZ.toFixed(2)}g
              </span>
            </div>
          </div>

          {/* Mini Waveform visualization */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-mono">
              <span>ACCEL VECTOR MAGNITUDE</span>
              <span>LIVE 50Hz</span>
            </div>
            <div className="h-8 w-full bg-slate-900/5 rounded-md flex items-end gap-1 px-1 py-0.5 overflow-hidden">
              {history.map((val, idx) => {
                const heightPct = Math.min(100, Math.max(10, Math.round((val / 2.0) * 100)));
                return (
                  <div
                    key={idx}
                    className="flex-1 bg-blue-500 rounded-xs transition-all duration-150"
                    style={{ height: `${heightPct}%` }}
                  />
                );
              })}
            </div>
          </div>

          {/* Interactive Shake Demo Button */}
          <button
            type="button"
            onClick={onSimulateShake}
            className="mt-3 w-full py-2 px-3 rounded-lg text-xs font-medium text-blue-700 bg-white hover:bg-blue-50/80 border border-blue-200 shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Move3d className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            <span>Simulate Physical Board Shake / Motion</span>
          </button>

          {/* Physical Shake Accumulator / Progress (Member 3 & 4 Bridge) */}
          <div className="mt-3 p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${shakingProgress > 0 ? "bg-amber-500 animate-ping" : "bg-slate-300"}`} />
                PHYSICAL SHAKE DETECTOR
              </span>
              <span className="font-bold text-amber-600">
                {shakingProgress}% {shakingProgress >= 100 ? "• TRIGGERED" : ""}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  shakingProgress >= 80
                    ? "bg-gradient-to-r from-amber-500 to-emerald-500"
                    : "bg-gradient-to-r from-blue-400 to-amber-500"
                }`}
                style={{ width: `${shakingProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>{bridgeStatusMessage || (shakingProgress > 0 ? `Motion: ${shakeIntensity.toFixed(2)}g detected` : "Tilt or shake Neurick board")}</span>
              <span>Threshold: 100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Final Blockchain Transaction Banner (Member 3 & 4 Bridge) */}
      {finalTxHash && (
        <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 shadow-xs animate-fade-in">
          <div className="flex items-center justify-between font-mono mb-1">
            <span className="font-bold flex items-center gap-1.5 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Final Mined TxHash (MST Testnet)
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-200/60 text-emerald-800 font-semibold">
              Confirmed ✓
            </span>
          </div>
          <a
            href={`https://testnet.mstscan.com/tx/${finalTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] text-blue-700 hover:text-blue-900 underline flex items-center gap-1 break-all transition-colors"
            title="View verified transaction on MSTScan Testnet"
          >
            <span>{finalTxHash}</span>
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
          </a>
        </div>
      )}

      {/* Primary Action Button: Trigger Storage Offload */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onTriggerOffload}
          disabled={isOffloading}
          className={`w-full py-3 px-4 rounded-xl font-medium text-white text-sm shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
            isOffloading
              ? "bg-slate-700 opacity-90 cursor-wait"
              : isStorageCritical
              ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/25 active:scale-[0.99]"
              : "bg-slate-900 hover:bg-slate-800 shadow-slate-900/20 active:scale-[0.99]"
          }`}
        >
          {isOffloading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>Transmitting Encrypted Chunks...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Trigger Storage Offload</span>
              <ArrowUpRight className="w-4 h-4 opacity-75" />
            </>
          )}
        </button>
        <p className="text-[11px] text-center text-slate-400 mt-2 font-mono">
          Locks 15.00 MST in Smart Contract Escrow
        </p>
      </div>
    </div>
  );
};
