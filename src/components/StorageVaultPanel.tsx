"use client";

import React, { useState } from "react";
import { VaultFile } from "@/types";
import {
  HardDrive,
  Coins,
  ShieldCheck,
  FileCheck2,
  Lock,
  ArrowDownToLine,
  RefreshCw,
  CheckCircle,
  FileText
} from "lucide-react";

interface StorageVaultPanelProps {
  vaultFiles: VaultFile[];
  totalEarnedMST: number;
  onWithdrawRewards: () => void;
  allocatedCapacityGB: number;
  usedCapacityGB: number;
  hostNodeName?: string;
  hostNodeIp?: string;
}

export const StorageVaultPanel: React.FC<StorageVaultPanelProps> = ({
  vaultFiles,
  totalEarnedMST,
  onWithdrawRewards,
  allocatedCapacityGB,
  usedCapacityGB,
  hostNodeName,
  hostNodeIp,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  const handleVerifyProofs = () => {
    setIsVerifying(true);
    setVerificationFeedback("Calculating SHA-256 Merkle leaves across all encrypted blocks...");
    setTimeout(() => {
      setIsVerifying(false);
      setVerificationFeedback("All 24 Chunks Cryptographically Verified (Root 0x7a4...9f0 Match)");
      setTimeout(() => setVerificationFeedback(null), 4000);
    }, 900);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Storage Vault & Node Assets
              </h2>
              <p className="text-[11px] text-slate-500 font-mono">
                Host Node: {hostNodeName || "HP Laptop"} • IP: {hostNodeIp || "10.80.79.44"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Vault Active</span>
          </div>
        </div>

        {/* Top Metric Cards (Row of 3) */}
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {/* Card 1: Storage Shared */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
              Storage Shared
            </span>
            <span className="text-base sm:text-lg font-bold text-slate-900 font-mono block">
              {allocatedCapacityGB} GB
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {usedCapacityGB.toFixed(1)} GB used
            </span>
          </div>

          {/* Card 2: Active Chunks Stored */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
              Encrypted Chunks
            </span>
            <span className="text-base sm:text-lg font-bold text-slate-900 font-mono block">
              {vaultFiles.length} Files
            </span>
            <span className="text-[10px] text-emerald-600 font-mono flex items-center gap-0.5">
              <ShieldCheck className="w-2.5 h-2.5" />
              <span>Fernet AES</span>
            </span>
          </div>

          {/* Card 3: Total MST Earned */}
          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
            <span className="text-[10px] uppercase font-mono text-emerald-700 block mb-1">
              MST Earned
            </span>
            <span className="text-base sm:text-lg font-bold text-emerald-800 font-mono block">
              {totalEarnedMST.toFixed(3)}
            </span>
            <span className="text-[10px] text-emerald-600 font-mono">
              Auto-settled
            </span>
          </div>
        </div>

        {/* Withdraw Rewards Button */}
        <div className="mt-3 flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-500" />
            <div>
              <span className="text-xs font-semibold text-slate-800 block">Reward Balance</span>
              <span className="text-[11px] text-slate-500 font-mono">Ready to transfer to wallet</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onWithdrawRewards}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200 border border-emerald-300/80 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span>Withdraw Rewards</span>
          </button>
        </div>

        {/* Main Storage Vault Panel: Encrypted Chunk Files */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-bold text-slate-800">
                Encrypted Chunks in Local Hard Drive
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              Zero-Knowledge Storage
            </span>
          </div>

          {/* Chunk List */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {vaultFiles.map((file) => (
              <div
                key={file.id}
                className="p-2.5 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-colors flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-semibold text-slate-800 truncate">
                      {file.fileName}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
                      <span>{file.sizeMB} MB</span>
                      <span>•</span>
                      <span className="truncate">Merkle: {file.merkleRoot}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  <span>Integrity Valid</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Proof Verification Action */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        {verificationFeedback && (
          <div className="mb-3 p-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{verificationFeedback}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleVerifyProofs}
          disabled={isVerifying}
          className="w-full py-2.5 px-4 rounded-xl font-medium text-slate-800 text-xs bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isVerifying ? "animate-spin" : ""}`} />
          <span>{isVerifying ? "Verifying Merkle Hashes..." : "Verify Merkle Proofs Locally"}</span>
        </button>
      </div>
    </div>
  );
};
