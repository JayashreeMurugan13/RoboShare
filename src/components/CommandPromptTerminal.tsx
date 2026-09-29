"use client";

import React, { useState, useEffect, useRef } from "react";
import { Terminal, Maximize2, Minimize2, Trash2, ArrowDownCircle, Cpu, Wifi, Activity } from "lucide-react";
import { TelemetryData } from "@/types";

interface CommandPromptTerminalProps {
  telemetry: TelemetryData;
  isBoardConnected: boolean;
  terminalLogs: string[];
  shakingProgress: number;
  shakeIntensity: number;
  isShaking: boolean;
  onSimulateShake?: () => void;
}

export const CommandPromptTerminal: React.FC<CommandPromptTerminalProps> = ({
  telemetry,
  isBoardConnected,
  terminalLogs,
  shakingProgress,
  shakeIntensity,
  isShaking,
  onSimulateShake,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [cleared, setCleared] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminalLogs, telemetry.accelX, telemetry.accelY, telemetry.accelZ, autoScroll]);

  const handleClear = () => {
    setCleared(true);
    setTimeout(() => setCleared(false), 5000);
  };

  return (
    <div id="cmd-terminal" className="mt-4 rounded-xl border border-slate-800 bg-[#090d16] text-slate-200 shadow-xl overflow-hidden font-mono text-xs transition-all scroll-mt-6">
      {/* Windows Command Prompt Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#121824] border-b border-slate-800 select-none">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-black/60 border border-slate-700 flex items-center justify-center text-cyan-400">
            <Terminal className="w-3 h-3" />
          </div>
          <span className="text-[11px] font-semibold text-slate-300 tracking-tight">
            Administrator: Command Prompt — python edge_node.py [COM12 @ 115200]
          </span>
        </div>

        {/* Live Hardware Connection Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/40 border border-slate-700/80">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isBoardConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
              }`}
            />
            <span className={isBoardConnected ? "text-emerald-400" : "text-rose-400"}>
              {isBoardConnected ? "COM12 LIVE (50Hz)" : "COM12 OFFLINE"}
            </span>
          </div>

          {/* Window Control Buttons */}
          <div className="flex items-center gap-1 text-slate-400">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-slate-700/60 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
              title={isExpanded ? "Restore Normal View" : "Maximize Console View"}
            >
              <Maximize2 className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-slate-700/60 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
              title={isMinimized ? "Expand Terminal" : "Minimize Terminal"}
            >
              <Minimize2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Terminal Toolbar */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#0d121e] border-b border-slate-800/80 text-[10px] text-slate-400">
            <div className="flex items-center gap-3">
              <span className="text-slate-500">DEVICE: Neurick-ESP32-S3</span>
              <span className="text-slate-500">I2C: MPU6050 (0x68)</span>
              <span className="text-cyan-400">BAUD: 115200 8-N-1</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAutoScroll(!autoScroll)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                  autoScroll ? "text-cyan-400 bg-cyan-950/40" : "text-slate-500 hover:text-slate-300"
                }`}
                title="Toggle Auto Scroll"
              >
                <ArrowDownCircle className="w-2.5 h-2.5" />
                <span>Auto-Scroll</span>
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                title="Clear screen buffer"
              >
                <Trash2 className="w-2.5 h-2.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Terminal Console Output */}
          <div
            ref={scrollRef}
            className={`p-3 overflow-y-auto space-y-1 select-text bg-[#070a10] scrollbar-thin scrollbar-thumb-slate-800 transition-all ${
              isExpanded ? "h-96" : "h-56"
            }`}
          >
            {/* Command Prompt Shell Header */}
            <div className="text-slate-400 text-[11px] mb-2">
              <p>Microsoft Windows [Version 10.0.22631.4317]</p>
              <p>(c) Microsoft Corporation. All rights reserved.</p>
              <p className="mt-1 text-slate-200">
                C:\RoboShare&gt; <span className="text-cyan-300">python edge_node.py --port COM12 --baud 115200</span>
              </p>
            </div>

            <div className="text-slate-500 text-[10px]">
              <p>=================================================</p>
              <p>  ROBO-SHARE LIVE DePIN MIDDLEWARE &amp; UI BRIDGE  </p>
              <p>=================================================</p>
              <p className="text-blue-400">[INIT] Hard-locking serial communication strictly to COM12 at 115200 baud...</p>
              <p className="text-blue-400">[WEB3] Connected to MST Testnet (Chain ID: 4646)</p>
              <p className="text-blue-400">[CIPHER] Fernet AES-256 local telemetry cipher ready</p>
            </div>

            {/* Offline or Handshake Warning */}
            {!isBoardConnected && (
              <div className="py-1 px-2 my-1 rounded bg-rose-950/40 border border-rose-900/60 text-rose-300 text-[11px]">
                <p className="font-semibold">🚨 [COM12 NOT CONNECTED / AWAITING SERIAL STREAM]</p>
                <p className="text-[10px] text-rose-400 mt-0.5">
                  &gt; ser.Serial(&quot;COM12&quot;, 115200) waiting for physical ESP32-S3 USB connection...
                </p>
                <p className="text-[10px] text-slate-400">
                  Plug in your Neurick Kit USB cable to COM12. Once physical packets arrive, live MPU6050 data streams below.
                </p>
              </div>
            )}

            {/* Live Buffer Logs from Backend or Hardware */}
            {!cleared && terminalLogs.length > 0 && (
              <div className="space-y-0.5">
                {terminalLogs.slice(-25).map((log, idx) => (
                  <p
                    key={idx}
                    className={`leading-relaxed ${
                      log.includes("SHAKE") || log.includes("TRIGGER")
                        ? "text-amber-300 font-bold bg-amber-950/30 px-1 rounded"
                        : log.includes("SUCCESS") || log.includes("VERIFIED")
                        ? "text-emerald-400"
                        : log.includes("CRITICAL") || log.includes("ERROR") || log.includes("DISCONNECTED")
                        ? "text-rose-400 font-semibold"
                        : log.includes("RAW") || log.includes("X (Lateral)")
                        ? "text-slate-300"
                        : "text-slate-400"
                    }`}
                  >
                    {log}
                  </p>
                ))}
              </div>
            )}

            {/* Real-time Hardware Telemetry Line when Live */}
            {isBoardConnected && (
              <>
                <p className="text-emerald-400 font-semibold">
                  ✅ [SUCCESS] Physical Neurick hardware VERIFIED &amp; STREAMING on COM12!
                </p>
                <div className="p-1.5 my-1 rounded bg-slate-900/80 border border-slate-800 text-[11px]">
                  <span className="text-cyan-400 font-bold">&gt; [LIVE COM12 MPU6050]</span>{" "}
                  <span className="text-slate-200">
                    X: <span className="text-cyan-300 font-bold">{telemetry.accelX >= 0 ? `+${telemetry.accelX.toFixed(2)}` : telemetry.accelX.toFixed(2)}g</span> |{" "}
                    Y: <span className="text-cyan-300 font-bold">{telemetry.accelY >= 0 ? `+${telemetry.accelY.toFixed(2)}` : telemetry.accelY.toFixed(2)}g</span> |{" "}
                    Z: <span className="text-cyan-300 font-bold">{telemetry.accelZ >= 0 ? `+${telemetry.accelZ.toFixed(2)}` : telemetry.accelZ.toFixed(2)}g</span>
                  </span>
                  <div className="mt-0.5 text-[10px] text-slate-400 flex items-center gap-3">
                    <span>Motion Mag: <span className="text-amber-400 font-bold">{shakeIntensity.toFixed(2)}g</span></span>
                    <span>Storage: <span className="text-blue-400 font-bold">{telemetry.storageKb || 0} KB</span> / {telemetry.maxStorageKb || 1000} KB</span>
                    <span>Shake Progress: <span className="text-amber-400 font-bold">{shakingProgress}%</span></span>
                  </div>
                </div>
              </>
            )}

            {/* Real-time Shake Spike notification in terminal */}
            {(isShaking || shakingProgress > 0) && (
              <p className="text-amber-300 font-bold animate-pulse text-[11px]">
                ⚡ [MOTION SPIKE DETECTED] Accelerometer delta &gt; threshold | Shaking progress: {shakingProgress}% | Intensity: {shakeIntensity.toFixed(2)}g
              </p>
            )}

            {/* Blinking CMD Prompt Cursor */}
            <div className="flex items-center gap-1 text-slate-300 pt-1">
              <span className="text-emerald-500 font-bold">C:\RoboShare&gt;</span>
              <span className="w-2 h-3.5 bg-emerald-400 inline-block animate-pulse" />
            </div>
          </div>

          {/* Terminal Footer with Quick Shake Test Button */}
          <div className="px-3 py-1.5 bg-[#0e1320] border-t border-slate-800 flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-2 text-slate-400">
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>Real-Time Sensor Sync: {isBoardConnected ? "Active (COM12)" : "Awaiting Physical Input"}</span>
            </div>
            {onSimulateShake && (
              <button
                type="button"
                onClick={onSimulateShake}
                className="px-2 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-[10px] transition-colors cursor-pointer"
                title="Send simulated motion pulse into terminal buffer"
              >
                Test Shake Pulse
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
