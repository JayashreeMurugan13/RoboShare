"use client";

import React from "react";
import { UserRole } from "@/types";
import {
  Radio,
  Cpu,
  HardDrive,
  LogOut,
  Repeat,
  Activity,
  Layers,
  ExternalLink,
  BookOpen
} from "lucide-react";

interface NavbarProps {
  role: UserRole;
  onLogout: () => void;
  onSwitchRole: () => void;
  onOpenExplorer: () => void;
  onOpenDemoGuide: () => void;
  walletAddress?: string;
  isHostOnline?: boolean;
  hostDeviceName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  role,
  onLogout,
  onSwitchRole,
  onOpenExplorer,
  onOpenDemoGuide,
  walletAddress = "0x4F82...3B91",
  isHostOnline = true,
  hostDeviceName,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left Side: Brand Logo & Dynamic Role Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm border border-blue-400/20">
              <Radio className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                  RoboShare
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  Enterprise
                </span>
              </div>
              <span className="hidden sm:inline-block text-[11px] text-slate-500 font-mono">
                Decentralized Autonomous Edge Protocol
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Dynamic Role Badge */}
          <div className="flex items-center">
            {role === "operator" ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-xs">
                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden md:inline">Active Workspace:</span>
                <span>Fleet Operator - Unit #4</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden md:inline">Active Workspace:</span>
                <span>{hostDeviceName ? `Host – ${hostDeviceName}` : "Storage Host Vault"}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isHostOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                  }`}
                  title={isHostOnline ? "Node Online" : "Node Slashed/Offline"}
                />
              </span>
            )}
          </div>
        </div>

        {/* Center: Live System Operational Ticker */}
        <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 font-mono">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-slate-800 font-semibold">mariorpc.mstblockchain.com</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">Chain: 4646</span>
          <span className="text-slate-300">|</span>
          <span className="text-emerald-700 font-semibold">Block: #20,865,290</span>
          <span className="text-slate-300">|</span>
          <span className="text-blue-600 font-medium">Auto-Bound EVM</span>
        </div>

        {/* Right Side: Active Wallet Address, Guide & Role Switch / Disconnect */}
        <div className="flex items-center gap-2.5">
          {/* BMS Pitch / Demo Cheatsheet Guide button */}
          <button
            type="button"
            onClick={onOpenDemoGuide}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 transition-colors cursor-pointer"
            title="Open Demo Script & Climax Guide"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
            <span>Demo Script</span>
          </button>

          {/* Quick Explorer Link button */}
          <button
            type="button"
            onClick={onOpenExplorer}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-colors cursor-pointer"
            title="View MST Testnet Explorer"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Explorer</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>

          {/* Active Wallet Address Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">{walletAddress}</span>
          </div>

          {/* Quick Switch Role button */}
          <button
            type="button"
            onClick={onSwitchRole}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-100 transition-colors cursor-pointer"
            title={`Switch to ${role === "operator" ? "Host Node Provider" : "Robot Fleet Operator"}`}
          >
            <Repeat className="w-4 h-4" />
          </button>

          {/* Disconnect / Logout */}
          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
            title="Disconnect / Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
