"use client";

import React from "react";
import { X, CheckCircle, Flame, Cpu, Network, ShieldCheck } from "lucide-react";

interface PresentationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerOffload: () => void;
  onTriggerSlashingDemo: () => void;
}

export const PresentationGuideModal: React.FC<PresentationGuideModalProps> = ({
  isOpen,
  onClose,
  onTriggerOffload,
  onTriggerSlashingDemo,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h2 className="font-bold text-sm sm:text-base">
              BMS College of Engineering — 3-Minute Live Demo Script
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[80vh] text-xs text-slate-700 leading-relaxed">
          {/* Step 1 */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-1">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">1</span>
              <span>Show Physical Hardware (Neurick Board + MPU6050)</span>
            </div>
            <p className="text-slate-600 pl-7">
              Point to the Neurick hardware board on your table. Shake it slightly or click <strong>&quot;Simulate Physical Board Shake&quot;</strong> in Column 1. Show the judges the live Accelerometer X, Y, Z coordinates and waveform moving live on screen.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-1">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">2</span>
              <span>Trigger Storage Offload & P2P Encryption</span>
            </div>
            <p className="text-slate-600 pl-7">
              Show memory capacity at 89% Full. Click <strong>&quot;Trigger Storage Offload&quot;</strong>. Point to Column 2 showing data chunks being split, encrypted with Fernet AES-256, and transmitted across local Wi-Fi to the selected MacBook or Dell peer laptop.
            </p>
            <div className="pl-7 mt-2">
              <button
                type="button"
                onClick={() => {
                  onTriggerOffload();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Run Step 2 Now: Trigger Offload
              </button>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-1">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">3</span>
              <span>Show Blockchain Escrow & Merkle Challenges</span>
            </div>
            <p className="text-slate-600 pl-7">
              Point to Column 3 (Dark Console). Explain how 15 MST tokens were locked in smart contract escrow <span className="font-mono text-blue-600">[ESCROW_LOCKED]</span>, and the contract issued a Merkle challenge <span className="font-mono text-slate-600">[MERKLE_CHALLENGE_ISSUED]</span>. When the host proves integrity, funds release automatically <span className="font-mono text-emerald-600">[VERIFIED &amp; PAID]</span>.
            </p>
          </div>

          {/* Step 4: The Killer Climax */}
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
            <div className="flex items-center gap-2 font-bold text-rose-900 text-sm mb-1">
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-xs flex items-center justify-center">4</span>
              <span>The Killer Climax: Slashing Demo (Host Laptop Drop)</span>
            </div>
            <p className="text-rose-700 pl-7">
              Tell the judges: <em>&quot;What if the host laptop unplugs or tries to steal data?&quot;</em>. Simulate closing the laptop or click the button below. The connection drops, Merkle challenge fails, and the terminal flips bright red: <strong className="font-mono">[SLASHED / PENALIZED]</strong>, seizing their 5.000 MST security deposit automatically!
            </p>
            <div className="pl-7 mt-2">
              <button
                type="button"
                onClick={() => {
                  onTriggerSlashingDemo();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Run Step 4 Now: Trigger Slashing Demo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
