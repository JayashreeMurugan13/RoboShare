"use client";

import React, { useState } from "react";
import { BlockchainLog } from "@/types";
import {
  X,
  ExternalLink,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  Cpu,
  Coins
} from "lucide-react";

interface MstExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: BlockchainLog[];
  contractAddress?: string;
}

export const MstExplorerModal: React.FC<MstExplorerModalProps> = ({
  isOpen,
  onClose,
  logs,
  contractAddress = "0xd1858875B6E178fE109Fb812035Af8667465485e",
}) => {
  const [activeTab, setActiveTab] = useState<"transactions" | "contract" | "events">("transactions");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Top Explorer Banner */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base font-mono">MSTScan Testnet Explorer</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Chain ID: 4646
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Official Ledger: https://testnet.mstscan.com/address/{contractAddress}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contract Overview Cards */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Smart Contract</span>
            <span className="font-mono text-xs font-bold text-slate-800 truncate block">
              RoboShareEscrow.sol
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold">Verified Source Code</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Contract TVL</span>
            <span className="font-mono text-xs font-bold text-blue-700 block">
              85.450 MST
            </span>
            <span className="text-[10px] text-slate-500">In Active Escrow</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Verified Offloads</span>
            <span className="font-mono text-xs font-bold text-slate-800 block">
              1,284 Proofs
            </span>
            <span className="text-[10px] text-slate-500">Merkle Verified</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Total Slashed</span>
            <span className="font-mono text-xs font-bold text-rose-600 block">
              45.000 MST
            </span>
            <span className="text-[10px] text-rose-500">Penalties Seized</span>
          </div>
        </div>

        {/* Explorer Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 flex gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("transactions")}
            className={`pb-3 px-1 border-b-2 transition-colors cursor-pointer ${
              activeTab === "transactions"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Transactions ({logs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("contract")}
            className={`pb-3 px-1 border-b-2 transition-colors cursor-pointer ${
              activeTab === "contract"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Contract ABI & Verification
          </button>
        </div>

        {/* Explorer Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {activeTab === "transactions" && (
            <div className="space-y-2">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[11px]">
                      <th className="pb-2">Tx Hash</th>
                      <th className="pb-2">Method</th>
                      <th className="pb-2">Block</th>
                      <th className="pb-2">Age</th>
                      <th className="pb-2">Value</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map((log) => {
                      let method = "depositEscrow";
                      let badge = "bg-blue-50 text-blue-700 border-blue-200";

                      if (log.type === "MERKLE_CHALLENGE_ISSUED") {
                        method = "issueChallenge";
                        badge = "bg-slate-100 text-slate-700 border-slate-200";
                      } else if (log.type === "VERIFIED_PAID") {
                        method = "verifyAndRelease";
                        badge = "bg-emerald-50 text-emerald-700 border-emerald-200";
                      } else if (log.type === "SLASHED_PENALIZED") {
                        method = "slashDeposit";
                        badge = "bg-rose-50 text-rose-700 border-rose-200 font-bold";
                      }

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 truncate max-w-[130px]">
                            <a
                              href={`https://testnet.mstscan.com/tx/${log.fullTxHash || log.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline font-semibold flex items-center gap-1"
                              title="View on MSTScan"
                            >
                              <span>{log.txHash}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] border border-slate-200">
                              {method}
                            </span>
                          </td>
                          <td className="py-2.5 text-slate-600">#{log.blockNumber}</td>
                          <td className="py-2.5 text-slate-400">{log.timestamp}</td>
                          <td className="py-2.5 text-slate-800 font-bold">
                            {log.mstAmount || (log.type === "SLASHED_PENALIZED" ? "5.000 MST" : "15.000 MST")}
                          </td>
                          <td className="py-2.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge}`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {log.tag}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "contract" && (
            <div className="space-y-4 font-mono text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
                <span className="text-[11px] text-slate-400 block mb-1">Contract Address</span>
                <span className="font-bold text-slate-900 break-all">{contractAddress}</span>
              </div>

              <div className="p-4 bg-slate-950 text-slate-300 rounded-xl overflow-x-auto text-[11px] leading-relaxed">
                <span className="text-slate-500">// Solidity Smart Contract Snippet (RoboShareEscrow.sol)</span>
                <br />
                <span className="text-purple-400">function</span>{" "}
                <span className="text-blue-400">slashHost</span>(bytes32 chunkHash, address hostNode) <span className="text-purple-400">external</span> &#123;
                <br />
                &nbsp;&nbsp;<span className="text-purple-400">require</span>(block.timestamp &gt; challengeDeadline[chunkHash], <span className="text-emerald-300">&quot;Challenge still active&quot;</span>);
                <br />
                &nbsp;&nbsp;<span className="text-purple-400">require</span>(!proofSubmitted[chunkHash], <span className="text-emerald-300">&quot;Proof was provided&quot;</span>);
                <br />
                &nbsp;&nbsp;<span className="text-slate-500">// Seize 5.000 MST security bond and refund robot</span>
                <br />
                &nbsp;&nbsp;uint256 penalty = hostSecurityDeposit[hostNode];
                <br />
                &nbsp;&nbsp;token.transfer(robotAddress[chunkHash], escrowDeposit[chunkHash] + penalty);
                <br />
                &nbsp;&nbsp;<span className="text-purple-400">emit</span> <span className="text-amber-400">HostSlashed</span>(hostNode, penalty, block.timestamp);
                <br />
                &#125;
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Connected to MST Sepolia Validator Node 03</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close Explorer
          </button>
        </div>
      </div>
    </div>
  );
};
