"use client";

import React, { useState } from "react";
import { UserRole, HostNode, StorageChunk } from "@/types";
import {
  Network,
  Laptop,
  CheckCircle2,
  Lock,
  Wifi,
  Sliders,
  Power,
  Layers,
  ArrowRight,
  Shield,
  Clock,
  Radio,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Search,
  Key,
  Database,
  Hash,
  Activity,
  Check,
  Zap,
  Plus,
  Compass,
} from "lucide-react";

interface MarketplacePanelProps {
  role: UserRole;
  hosts: HostNode[];
  selectedHostId: string;
  onSelectHost: (id: string, autoInitiate?: boolean) => void;
  isOffloading: boolean;
  transferChunks: StorageChunk[];
  currentChunkIndex: number;
  overallTransferProgress: number;
  isHostOnline: boolean;
  onToggleHostOnline: () => void;
  allocatedCapacityGB: number;
  onUpdateAllocatedCapacity: (capacity: number) => void;
  hostRateMST: number;
  onUpdateHostRate: (rate: number) => void;
  activeContractAddress?: string;
  // Real Wi-Fi Network Props
  wifiSubnet?: string;
  hostPortalUrl?: string;
  isScanning?: boolean;
  onTriggerScan?: () => void;
  scanMessage?: string;
  lockedIpAddress?: string;
  onRegisterFriendIp?: (ip: string, name?: string) => void;
}

export const MarketplacePanel: React.FC<MarketplacePanelProps> = ({
  role,
  hosts,
  selectedHostId,
  onSelectHost,
  isOffloading,
  transferChunks,
  currentChunkIndex,
  overallTransferProgress,
  isHostOnline,
  onToggleHostOnline,
  allocatedCapacityGB,
  onUpdateAllocatedCapacity,
  hostRateMST,
  onUpdateHostRate,
  activeContractAddress = "0xd1858875B6E178fE109Fb812035Af8667465485e",
  wifiSubnet = "10.80.0.0/16",
  hostPortalUrl = "http://10.80.79.244:3001",
  isScanning = false,
  onTriggerScan,
  scanMessage = "Listening on local Wi-Fi subnet...",
  lockedIpAddress,
  onRegisterFriendIp,
}) => {
  const [restrictedNotice, setRestrictedNotice] = useState(false);
  const [showManualConnect, setShowManualConnect] = useState(false);
  const [friendIpInput, setFriendIpInput] = useState("10.80.79.112");
  const [friendDeviceName, setFriendDeviceName] = useState("Friend's Laptop");

  const handleRestrictedAction = () => {
    setRestrictedNotice(true);
    setTimeout(() => setRestrictedNotice(false), 3000);
  };

  const selectedHost = hosts.find((h) => h.id === selectedHostId) || hosts[0];
  const activeIp = lockedIpAddress || selectedHost?.ipAddress || "10.80.79.112";

  // Circular progress calculations for SVG ring
  const ringRadius = 46;
  const circumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = circumference - (overallTransferProgress / 100) * circumference;

  const currentChunk = transferChunks[currentChunkIndex] || {
    name: "chunk_rover_cam_f09a.enc",
    sizeMB: 28.4,
    merkleRoot: "0x9e88...a214",
    fernetKey: "gAAAAABmX89eK2j9w_3zL0pQ8rTvY4u1A==",
  };

  const handleConnectFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (onRegisterFriendIp && friendIpInput.trim()) {
      onRegisterFriendIp(friendIpInput.trim(), friendDeviceName.trim());
      setShowManualConnect(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                {role === "operator"
                  ? "Real Wi-Fi Host Discovery & Stream"
                  : "Host Node Resource Manager"}
              </h2>
              <p className="text-[11px] text-slate-500 font-mono">
                {role === "operator"
                  ? "Live P2P Peer Sync • Same Wi-Fi Network"
                  : "Active P2P Listener & Pricing Hub"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {role === "operator" && onTriggerScan && (
              <button
                type="button"
                onClick={onTriggerScan}
                disabled={isScanning || isOffloading}
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                title="Rescan local Wi-Fi subnet for peer host"
              >
                <RefreshCw className={`w-3 h-3 ${isScanning ? "animate-spin text-blue-600" : ""}`} />
                <span>{isScanning ? "Probing..." : "Scan Wi-Fi"}</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <Wifi className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-mono">{wifiSubnet}</span>
            </div>
          </div>
        </div>

        {/* RESTRICTED ACCESS NOTICE (RBAC Demo Guarantee) */}
        {restrictedNotice && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 animate-bounce">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>
              <strong>RBAC Permission Denied:</strong> Robot Fleet Operators cannot modify marketplace pricing or host storage limits.
            </span>
          </div>
        )}

        {/* ======================================================== */}
        {/* ROLE A: ROBOT FLEET OPERATOR VIEW */}
        {/* ======================================================== */}
        {role === "operator" && (
          <div className="mt-4">
            {/* Real Network Interface & Peer Status Banner */}
            <div className="mb-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isScanning
                      ? "bg-blue-600 animate-ping"
                      : hosts.length > 0
                      ? "bg-emerald-500"
                      : "bg-amber-500 animate-pulse"
                  }`}
                />
                <span className="text-[11px] font-mono text-slate-600 truncate max-w-[280px]">
                  {scanMessage}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-semibold">
                {hosts.length} Real Device{hosts.length === 1 ? "" : "s"}
              </span>
            </div>

            {/* Active Transfer Progress View with Live Progress Ring */}
            {isOffloading ? (
              <div className="p-4 rounded-xl bg-gradient-to-b from-blue-50/80 to-slate-50 border border-blue-200 space-y-4 shadow-xs">
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-600 text-white text-xs font-mono font-bold shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>[Encrypted P2P Transfer Active]</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-700">
                    {overallTransferProgress}%
                  </span>
                </div>

                {/* Target Local IP Lock Banner */}
                <div className="p-2.5 bg-white rounded-lg border border-blue-200 text-xs font-mono flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-slate-500">Locked Socket:</span>
                    <span className="font-bold text-slate-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      {activeIp}:8443
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Direct Socket TLS</span>
                  </span>
                </div>

                {/* Live Circular Progress Ring & Speed Metric */}
                <div className="flex items-center justify-around py-2">
                  {/* SVG Animated Circular Progress Ring */}
                  <div className="relative flex items-center justify-center">
                    <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 110 110">
                      <circle
                        cx="55"
                        cy="55"
                        r={ringRadius}
                        stroke="#e2e8f0"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="55"
                        cy="55"
                        r={ringRadius}
                        stroke="url(#blueGradient)"
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-300 ease-out"
                      />
                      <defs>
                        <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#2563eb" />
                          <stop offset="100%" stopColor="#4f46e5" />
                        </linearGradient>
                      </defs>
                    </svg>

                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-xl font-extrabold font-mono text-slate-900 leading-none">
                        {overallTransferProgress}%
                      </span>
                      <span className="text-[9px] font-mono text-blue-600 font-semibold mt-0.5">
                        STREAMING
                      </span>
                    </div>
                  </div>

                  {/* Transfer Metrics Column */}
                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 block">Transfer Rate</span>
                      <span className="text-sm font-bold text-blue-600 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        48.2 MB/s
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 block">Chunk Progress</span>
                      <span className="text-xs font-bold text-slate-800">
                        {currentChunkIndex + 1} of {transferChunks.length || 4} Chunks
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cryptographic Encryption Details */}
                <div className="p-3 bg-white rounded-xl border border-blue-200/80 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-800">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Fernet AES-256 Key:</span>
                    </span>
                    <span className="text-[10px] text-slate-500 truncate max-w-[150px]">
                      {currentChunk.fernetKey || "gAAAAABmX89eK2j9w_3z..."}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-800">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Merkle Root Hash Anchor:</span>
                    </span>
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                      {currentChunk.merkleRoot || "0x9e88...a214"}
                    </span>
                  </div>

                  <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Active Payload:</span>
                    <span className="font-semibold text-slate-700 truncate max-w-[180px]">
                      {currentChunk.name || "chunk_rover_cam_f09a.enc"}
                    </span>
                  </div>
                </div>
              </div>
            ) : hosts.length > 0 ? (
              /* REAL HOST DEVICE CARD (ONLY the device on the same Wi-Fi) */
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                  <span className="uppercase text-[11px] font-mono tracking-wider text-slate-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>DISCOVERED WI-FI DEVICES ({hosts.length})</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-600 font-medium">
                    <span className="text-emerald-700 font-bold">{hosts.filter(h => h.contractAddress).length} Bonded Host (Has Contract)</span>
                    <span className="text-slate-400"> • </span>
                    <span>{hosts.filter(h => !h.contractAddress).length} Unbonded Peers</span>
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1.5 scroll-smooth [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]">
                  {hosts.map((host) => {
                    const isSelected = host.id === selectedHostId;
                    const hasContract = Boolean(host.contractAddress);

                    return (
                      <div
                        key={host.id}
                        onClick={() => onSelectHost(host.id, true)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                          hasContract
                            ? isSelected
                              ? "border-emerald-500 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20"
                              : "border-emerald-200 bg-emerald-50/25 hover:border-emerald-300 hover:bg-emerald-50/50"
                            : isSelected
                            ? "border-blue-500 bg-blue-50/60 shadow-sm ring-2 ring-blue-500/20"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                hasContract
                                  ? isSelected ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                  : isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              <Laptop className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5 flex-wrap">
                                <span>{host.name}</span>
                                {hasContract ? (
                                  <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                                    HAS CONTRACT ✓
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 text-[10px] font-medium border border-slate-200">
                                    NO CONTRACT
                                  </span>
                                )}
                                <span className="text-[11px] text-slate-500 font-mono font-normal">
                                  ({host.deviceType})
                                </span>
                              </div>

                              <div className="text-[11px] font-mono text-slate-600 flex items-center gap-2 flex-wrap mt-0.5">
                                <span className="font-bold text-slate-800">
                                  {host.storageFreeGB}GB Free
                                </span>
                                <span>•</span>
                                <span className="text-blue-700 bg-blue-100/70 px-1.5 py-0.2 rounded font-bold border border-blue-200">
                                  IP: {host.ipAddress}
                                </span>
                                <span>•</span>
                                <span className="text-slate-500">{host.latencyMs}ms</span>
                                {host.rssi && (
                                  <>
                                    <span>•</span>
                                    <span className="text-emerald-700 font-semibold">
                                      {host.rssi} dBm
                                    </span>
                                  </>
                                )}
                                {host.macAddress && (
                                  <>
                                    <span>•</span>
                                    <span className="text-slate-400 text-[10px] uppercase tracking-tight">
                                      MAC: {host.macAddress.toUpperCase().slice(0, 8)}
                                    </span>
                                  </>
                                )}
                              </div>

                              {/* Prominent Smart Contract ID Display */}
                              {hasContract ? (
                                <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-100/80 border border-emerald-300 text-[10px] font-mono text-emerald-900 font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                  <span>
                                    Contract ID: {host.contractAddress} • Bonded Staker (5.0 MST)
                                  </span>
                                </div>
                              ) : (
                                <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-500">
                                  <span>No Contract ID — Unbonded Wi-Fi Device (Raw P2P Only)</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {isSelected ? (
                              <span className={`px-2.5 py-1 rounded text-[10px] font-bold shadow-2xs flex items-center gap-1 text-white ${hasContract ? "bg-emerald-600" : "bg-blue-600"}`}>
                                <Lock className="w-3 h-3" />
                                <span>Locked</span>
                              </span>
                            ) : (
                              <span className={`px-2.5 py-1 rounded text-[10px] font-semibold border transition-colors ${
                                hasContract
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-600 hover:text-white"
                                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-600 hover:text-white"
                              }`}>
                                {hasContract ? "Click to Lock & Encrypt" : "Click to Lock IP"}
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-slate-500">
                              {host.rateMST} MST/GB
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-[11px]">
                      Click the card to lock onto your friend&apos;s local IP &amp; begin streaming chunks
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowManualConnect(!showManualConnect)}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 underline cursor-pointer shrink-0"
                  >
                    Change Peer IP
                  </button>
                </div>
              </div>
            ) : (
              /* NO PEER CONNECTED YET: Real Wi-Fi Listening Radar & Friend Pairing Prompt */
              <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 text-center space-y-3">
                <div className="w-10 h-10 mx-auto rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 animate-pulse">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">
                    Listening for Friend&apos;s Host Laptop on Wi-Fi
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono mt-1">
                    Subnet: {wifiSubnet} • Contract: {activeContractAddress.slice(0, 10)}...
                  </p>
                </div>

                {/* Instructions to friend */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-left space-y-1.5 text-xs">
                  <span className="font-bold text-slate-900 block text-[11px]">
                    To connect your friend&apos;s laptop:
                  </span>
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-800 font-mono text-[11px] flex items-center justify-between select-all">
                    <span>{hostPortalUrl}</span>
                    <span className="text-[10px] text-blue-600 font-bold">Open on Friend&apos;s Laptop</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    When your friend opens that URL on the same Wi-Fi and logs in as &quot;Host Node Provider&quot;, their real laptop will instantly appear here!
                  </p>
                </div>

                {/* Or enter friend's IP directly */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowManualConnect(!showManualConnect)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
                  >
                    Or enter friend&apos;s laptop IP address manually
                  </button>
                </div>
              </div>
            )}

            {/* Manual Connect / Peer IP Form */}
            {showManualConnect && (
              <form
                onSubmit={handleConnectFriend}
                className="mt-3 p-3 bg-white rounded-xl border border-blue-300 space-y-2 animate-fade-in text-xs font-mono"
              >
                <div className="flex items-center justify-between text-slate-800 font-bold text-[11px]">
                  <span>Connect Friend&apos;s Real Device by Wi-Fi IP</span>
                  <button
                    type="button"
                    onClick={() => setShowManualConnect(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">
                      Friend&apos;s Wi-Fi IP:
                    </label>
                    <input
                      type="text"
                      value={friendIpInput}
                      onChange={(e) => setFriendIpInput(e.target.value)}
                      placeholder="10.80.79.112"
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">
                      Laptop Brand / Name:
                    </label>
                    <input
                      type="text"
                      value={friendDeviceName}
                      onChange={(e) => setFriendDeviceName(e.target.value)}
                      placeholder="Friend's Laptop (Dell/HP/Mac)"
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-mono"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Verify &amp; Show Real Device
                </button>
              </form>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* ROLE B: HOST NODE PROVIDER VIEW (ACTIVE CONTROL HUB) */}
        {/* ======================================================== */}
        {role === "host" && (
          <div className="mt-4 space-y-4">
            {/* Host Status Switch & Slashing Demo Control */}
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                isHostOnline
                  ? "bg-emerald-50/60 border-emerald-200"
                  : "bg-rose-50 border-rose-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Host Node Connection Status
                  </span>
                  <span
                    className={`text-[11px] font-mono ${
                      isHostOnline ? "text-emerald-700 font-semibold" : "text-rose-700 font-bold"
                    }`}
                  >
                    {isHostOnline
                      ? "🟢 Online & Broadcasting on Wi-Fi (Port 8443)"
                      : "🔴 OFFLINE / DISCONNECTED (Slashing Risk)"}
                  </span>
                </div>

                {/* Status Toggle Button */}
                <button
                  type="button"
                  onClick={onToggleHostOnline}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                    isHostOnline
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                  title="Toggle node connectivity to demonstrate smart contract slashing"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{isHostOnline ? "Simulate Disconnect" : "Reconnect Node"}</span>
                </button>
              </div>

              {!isHostOnline && (
                <div className="mt-2 text-[11px] text-rose-800 bg-white/70 p-2 rounded-lg border border-rose-200">
                  ⚠️ Host laptop disconnected from mesh. The MST smart contract challenge will fail if proof is not submitted within 10 seconds!
                </div>
              )}
            </div>

            {/* Storage Allocation Slider */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">
                  Allocated Disk Space to RoboShare
                </span>
                <span className="font-mono font-bold text-blue-600">
                  {allocatedCapacityGB} GB
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="500"
                step="10"
                value={allocatedCapacityGB}
                onChange={(e) => onUpdateAllocatedCapacity(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>20 GB (Min)</span>
                <span>250 GB</span>
                <span>500 GB (Max)</span>
              </div>
            </div>

            {/* Rental Rate Configuration */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-800">Your Storage Lending Rate</span>
                <span className="font-mono font-bold text-emerald-700">
                  {hostRateMST} MST / GB
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[0.0006, 0.0008, 0.0012].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => onUpdateHostRate(rate)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-mono border transition-colors cursor-pointer ${
                      hostRateMST === rate
                        ? "bg-white border-blue-500 text-blue-700 font-bold shadow-2xs"
                        : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white"
                    }`}
                  >
                    {rate} MST
                  </button>
                ))}
              </div>
            </div>

            {/* Live Incoming Chunk Listener Stream */}
            <div className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>P2P LISTENER PORT: 8443</span>
                </span>
                <span>TCP TLS ENCRYPTED</span>
              </div>
              <p className="text-slate-300">
                &gt; Handshake OK with rover 0x4F82...3B91
              </p>
              <p className="text-emerald-400">
                &gt; Heartbeat synced with MST contract {activeContractAddress.slice(0, 10)}...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span className="flex items-center gap-1">
          <Shield className="w-3 h-3 text-slate-400" />
          <span>Zero-Knowledge Proofs</span>
        </span>
        <span>Target Socket: {activeIp}:8443</span>
      </div>
    </div>
  );
};
