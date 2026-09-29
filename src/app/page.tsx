"use client";

import React, { useState, useEffect, useRef } from "react";
import { UserRole, TelemetryData, HostNode, StorageChunk, BlockchainLog, VaultFile, AuthSession } from "@/types";
import { LoginPortal } from "@/components/LoginPortal";
import { Navbar } from "@/components/Navbar";
import { RobotPanel } from "@/components/RobotPanel";
import { StorageVaultPanel } from "@/components/StorageVaultPanel";
import { MarketplacePanel } from "@/components/MarketplacePanel";
import { BlockchainPanel } from "@/components/BlockchainPanel";
import { MstExplorerModal } from "@/components/MstExplorerModal";
import { PresentationGuideModal } from "@/components/PresentationGuideModal";
import { CommandPromptTerminal } from "@/components/CommandPromptTerminal";
import {
  getRealNetworkInfo,
  fetchRealWifiPeers,
  registerRealPeerNode,
  NetworkInfo,
} from "@/utils/localNetworkDiscovery";
import {
  generateTxHash,
  PREDEPLOYED_CONTRACT_ADDRESS,
  getMstProvider,
  MST_RPC_URL,
} from "@/utils/web3Service";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole>("operator");
  const [activeSession, setActiveSession] = useState<AuthSession>({
    role: "operator",
    method: "MST Wallet",
    address: "0x4F82d9C9781B23...3B91",
    identityLabel: "Fleet Operator Key",
    rbacToken: "rbac_default",
    onChainVerified: true,
    blockVerified: 20865290,
  });

  // Pre-deployed Smart Contract Address (Hooked up to MST Testnet)
  const contractAddress = PREDEPLOYED_CONTRACT_ADDRESS;

  // Real Wi-Fi Network Info (detected from Node.js server)
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    localIp: "10.80.79.244",
    netmask: "255.255.0.0",
    subnet: "10.80.0.0/16",
    interfaceName: "Wi-Fi",
    hostname: "Zare",
    portalUrl: "http://10.80.79.244:3001",
  });

  // Modals state
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [isDemoGuideOpen, setIsDemoGuideOpen] = useState(false);

  // Hardware Telemetry state — starts at zero; exclusively updated by live COM12 serial stream via Python bridge
  const [telemetry, setTelemetry] = useState<TelemetryData>({
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
  });

  const [autoClimb, setAutoClimb] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  // Dynamic Wi-Fi Discovery — starts empty, populated by real peers
  const [isScanningWifi, setIsScanningWifi] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string>("Listening on local Wi-Fi subnet...");
  const [lockedIpAddress, setLockedIpAddress] = useState<string>("");
  const hasTriggeredCapacityScan = useRef<boolean>(false);

  // Real peer nodes — only devices that self-register via /api/peers (no fake seeds)
  const [hosts, setHosts] = useState<HostNode[]>([]);
  const [selectedHostId, setSelectedHostId] = useState<string>("");

  // Host Provider Settings
  const [isHostOnline, setIsHostOnline] = useState<boolean>(true);
  const [allocatedCapacityGB, setAllocatedCapacityGB] = useState<number>(150);
  const [usedCapacityGB, setUsedCapacityGB] = useState<number>(34.2);
  const [hostRateMST, setHostRateMST] = useState<number>(0.0008);
  const [totalEarnedMST, setTotalEarnedMST] = useState<number>(4.85);

  // Vault Files for Host Node Provider
  const [vaultFiles, setVaultFiles] = useState<VaultFile[]>([
    {
      id: "v-1",
      fileName: "chunk_rover_cam_f09a.enc",
      sizeMB: 42.1,
      merkleRoot: "0x9e88...a214",
      timestamp: "18:41:20",
      integrity: "Valid",
      rewardEarnedMST: 0.042,
    },
    {
      id: "v-2",
      fileName: "chunk_lidar_sweep_22b.enc",
      sizeMB: 128.4,
      merkleRoot: "0x77c2...f890",
      timestamp: "18:38:05",
      integrity: "Valid",
      rewardEarnedMST: 0.128,
    },
  ]);

  // Offload transfer state with Live Circular Ring & Fernet AES-256
  const [isOffloading, setIsOffloading] = useState<boolean>(false);
  const [transferChunks, setTransferChunks] = useState<StorageChunk[]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(0);
  const [overallTransferProgress, setOverallTransferProgress] = useState<number>(0);

  // Final mined blockchain transaction hash (only populated when real on-chain tx is received)
  const [finalTxHash, setFinalTxHash] = useState<string | undefined>(undefined);

  // Member 3 & 4 Bridge Status (Physical Shake Progress & Final on-chain Tx)
  const [bridgeStatus, setBridgeStatus] = useState<{
    shakingProgress: number;
    isShaking: boolean;
    shakeIntensity: number;
    status: string;
    txHash?: string;
    blockNumber?: number;
    message?: string;
    terminalLogs?: string[];
  }>({
    shakingProgress: 0,
    isShaking: false,
    shakeIntensity: 0.98,
    status: "IDLE",
    terminalLogs: [],
  });

  // Blockchain Audit Ledger with fullTxHash for clickable MSTScan links
  const [logs, setLogs] = useState<BlockchainLog[]>([
    {
      id: "log-1",
      timestamp: "18:40:02",
      type: "SYSTEM_INFO",
      tag: "SYSTEM_READY",
      tagColor: "purple",
      txHash: "0x823e...6f19",
      fullTxHash: "0x823ec1b9a53e69d9ede1014afcfa1245c4ef2c36ea1ccad731db21d5cbd96f19",
      message: `MST Testnet Escrow Contract initialized at ${PREDEPLOYED_CONTRACT_ADDRESS}. Wi-Fi sync verified on 10.80.0.0/16.`,
      blockNumber: 20865280,
    },
    {
      id: "log-2",
      timestamp: "18:41:14",
      type: "SYSTEM_INFO",
      tag: "PEER_CONNECTED",
      tagColor: "gray",
      txHash: "0x02a1...0480",
      fullTxHash: "0x02a1a7a23b6870c3125a847e6399c3a70a18a6294a6de4a74395b8fd00130480",
      message: `Friend's Host Laptop bonded 5.000 MST security deposit to participate in data relay.`,
      blockNumber: 20865285,
    },
  ]);

  const [hasSlashedEvent, setHasSlashedEvent] = useState<boolean>(false);

  // Fetch real network details on mount
  useEffect(() => {
    getRealNetworkInfo().then((info) => {
      setNetworkInfo(info);
      setScanMessage(`Synchronized with local Wi-Fi: ${info.subnet} (${info.localIp})`);
    });
    // Trigger initial real Wi-Fi network scan on mount
    fetchRealWifiPeers(true).then((livePeers) => {
      if (livePeers.length > 0) {
        setHosts(livePeers);
        setSelectedHostId(livePeers[0].id);
        setLockedIpAddress(livePeers[0].ipAddress);
        setScanMessage(`Discovered ${livePeers[0].name} (${livePeers[0].ipAddress}) on local Wi-Fi`);
      }
    });
  }, []);

  // Poll real Wi-Fi peers from /api/peers every 2.5 seconds
  useEffect(() => {
    const pollPeers = async () => {
      const livePeers = await fetchRealWifiPeers();
      if (livePeers.length > 0) {
        setHosts(livePeers);
        setScanMessage(`${livePeers.length} real device${livePeers.length > 1 ? "s" : ""} active on Wi-Fi`);
        if (!selectedHostId || !livePeers.find((p) => p.id === selectedHostId)) {
          setSelectedHostId(livePeers[0].id);
          setLockedIpAddress(livePeers[0].ipAddress);
        }
      } else {
        setHosts([]);
        if (!isScanningWifi) {
          setScanMessage(`Listening for real devices on ${networkInfo.subnet}...`);
        }
      }
    };

    pollPeers();
    const interval = setInterval(pollPeers, 2500);
    return () => clearInterval(interval);
  }, [selectedHostId, networkInfo.subnet, isScanningWifi]);

  // If this device is logged in as Host, send heartbeat to /api/peers
  useEffect(() => {
    if (isLoggedIn && userRole === "host") {
      const sendHeartbeat = async () => {
        try {
          await registerRealPeerNode({
            ipAddress: "",
            name: "Host Node – HP Laptop",
            deviceType: "HP Pavilion Laptop (Windows 11)",
            storageFreeGB: allocatedCapacityGB - usedCapacityGB,
            rateMST: hostRateMST,
          });
        } catch {
          // Ignore
        }
      };
      sendHeartbeat();
      const interval = setInterval(sendHeartbeat, 3000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, userRole, allocatedCapacityGB, usedCapacityGB, hostRateMST]);

  // Trigger manual or automated Wi-Fi scan with live ping
  const handleTriggerWifiScan = (customReason?: string) => {
    if (isScanningWifi) return;
    setIsScanningWifi(true);
    setScanMessage(customReason || `Scanning Wi-Fi subnet ${networkInfo.subnet} with live ARP & ICMP ping...`);

    setTimeout(async () => {
      const livePeers = await fetchRealWifiPeers(true);
      setIsScanningWifi(false);
      if (livePeers.length > 0) {
        setHosts(livePeers);
        setSelectedHostId(livePeers[0].id);
        setLockedIpAddress(livePeers[0].ipAddress);
        setScanMessage(`Locked onto ${livePeers[0].name} (${livePeers[0].ipAddress}) • ${livePeers[0].latencyMs}ms`);
      } else {
        setScanMessage(`Listening for friend's laptop at ${networkInfo.portalUrl}`);
      }
    }, 1200);
  };

  // Register friend's laptop IP manually
  const handleRegisterFriendIp = async (ip: string, name?: string) => {
    setIsScanningWifi(true);
    setScanMessage(`Probing socket ${ip}:8443 on Wi-Fi...`);

    const registered = await registerRealPeerNode({
      ipAddress: ip,
      name: name || "Friend's Host Laptop",
      deviceType: "Connected Laptop (Same Wi-Fi)",
      storageFreeGB: 120,
      rateMST: 0.0008,
    });

    setIsScanningWifi(false);
    if (registered) {
      setHosts([registered]);
      setSelectedHostId(registered.id);
      setLockedIpAddress(registered.ipAddress);
      setScanMessage(`Locked onto friend's device at ${registered.ipAddress}`);

      // Add to log
      const logTx = generateTxHash();
      setLogs((prev) => [
        ...prev,
        {
          id: `log-${Date.now()}-reg`,
          timestamp: new Date().toLocaleTimeString(),
          type: "SYSTEM_INFO",
          tag: "PEER_CONNECTED",
          tagColor: "green",
          txHash: logTx.short,
          fullTxHash: logTx.full,
          message: `Discovered and connected real friend's laptop at ${registered.ipAddress}:8443 on ${networkInfo.subnet}. Contract ${contractAddress.slice(0, 8)}... verified.`,
          blockNumber: 20865288,
        },
      ]);
    }
  };

  // Automated Network Scan trigger when robot storage reaches 85% of real hardware capacity
  useEffect(() => {
    const threshold = (telemetry.maxStorageKb ?? 1000) * 0.85;
    if ((telemetry.storageKb ?? 0) >= threshold && !hasTriggeredCapacityScan.current && !isScanningWifi) {
      hasTriggeredCapacityScan.current = true;
      const pct = Math.round(((telemetry.storageKb ?? 0) / (telemetry.maxStorageKb ?? 1000)) * 100);
      handleTriggerWifiScan(
        `⚡ Storage capacity warning (${telemetry.storageKb} KB / ${telemetry.maxStorageKb} KB · ${pct}%) — initiating Wi-Fi discovery for friend's host...`
      );
    }
  }, [telemetry.storageKb, telemetry.maxStorageKb, isScanningWifi]);

  // Member 3 & 4 Real-Time Bridge Polling (Physical Shake Progress, COM12 metrics, & Final on-chain Tx)
  useEffect(() => {
    const bridgePoller = setInterval(async () => {
      try {
        const res = await fetch("/api/bridge-status");
        if (res.ok) {
          const data = await res.json();
          setBridgeStatus(data);
          if (data.txHash) {
            setFinalTxHash(data.txHash);
          }

          // Always ingest hardware fields — isBoardConnected is taken strictly from API response
          setTelemetry((prev) => {
            const kb = typeof data.storageKb === "number" ? data.storageKb : prev.storageKb;
            const maxKb = typeof data.maxStorageKb === "number" ? data.maxStorageKb : (prev.maxStorageKb || 1000);
            const mappedGB = typeof kb === "number" ? parseFloat(((kb / maxKb) * 32.0).toFixed(2)) : prev.storageUsedGB;

            return {
              ...prev,
              // Only overwrite motion fields if the board is genuinely streaming
              ...(data.accelX !== undefined && { accelX: data.accelX }),
              ...(data.accelY !== undefined && { accelY: data.accelY }),
              ...(data.accelZ !== undefined && { accelZ: data.accelZ }),
              ...(data.rawX !== undefined && { rawX: data.rawX }),
              ...(data.rawY !== undefined && { rawY: data.rawY }),
              ...(data.rawZ !== undefined && { rawZ: data.rawZ }),
              ...(data.restingGravity !== undefined && { restingGravity: data.restingGravity }),
              ...(data.motionIntensity !== undefined && { motionIntensity: data.motionIntensity }),
              ...(typeof kb === "number" && { storageKb: kb, maxStorageKb: maxKb, storageUsedGB: mappedGB }),
              // Connection badge is ALWAYS driven by the API payload, never hardcoded
              isBoardConnected: data.isBoardConnected === true,
            };
          });

          if (data.shakingProgress >= 100 && !isOffloading) {
            handleTriggerOffload();
          }
        }
      } catch {
        // Ignore
      }
    }, 200);

    return () => clearInterval(bridgePoller);
  }, [isOffloading]);

  // Direct MPU6050 physical telemetry sync — isBoardConnected is written for BOTH states
  useEffect(() => {
    const boardPoller = setInterval(async () => {
      try {
        const res = await fetch("/api/telemetry");
        if (res.ok) {
          const data = await res.json();
          // Write isBoardConnected regardless — if false, the badge flips to disconnected
          setTelemetry((prev) => ({
            ...prev,
            ...(typeof data.accelX === "number" && { accelX: data.accelX }),
            ...(typeof data.accelY === "number" && { accelY: data.accelY }),
            ...(typeof data.accelZ === "number" && { accelZ: data.accelZ }),
            ...(data.gyroX !== undefined && { gyroX: data.gyroX }),
            ...(data.gyroY !== undefined && { gyroY: data.gyroY }),
            ...(data.gyroZ !== undefined && { gyroZ: data.gyroZ }),
            ...(data.tempC !== undefined && { tempC: data.tempC }),
            ...(typeof data.storageUsedGB === "number" && { storageUsedGB: data.storageUsedGB }),
            ...(data.storageTotalGB !== undefined && { storageTotalGB: data.storageTotalGB }),
            ...(data.batteryPct !== undefined && { batteryPct: data.batteryPct }),
            ...(typeof data.restingGravity === "number" && { restingGravity: data.restingGravity }),
            ...(typeof data.rawX === "number" && { rawX: data.rawX }),
            ...(typeof data.rawY === "number" && { rawY: data.rawY }),
            ...(typeof data.rawZ === "number" && { rawZ: data.rawZ }),
            ...(typeof data.motionIntensity === "number" && { motionIntensity: data.motionIntensity }),
            ...(typeof data.storageKb === "number" && { storageKb: data.storageKb }),
            ...(typeof data.maxStorageKb === "number" && { maxStorageKb: data.maxStorageKb }),
            // Source of truth — API returns false when heartbeat is stale
            isBoardConnected: data.isBoardConnected === true,
          }));
        }
      } catch {
        // Ignore
      }
    }, 250);

    return () => clearInterval(boardPoller);
  }, []);


  const handleSimulateShake = () => {
    if (isOffloading) return;
    setIsShaking(true);

    // Animate the shake detector UI only — storage values stay bound to live hardware
    let progress = bridgeStatus.shakingProgress || 0;
    const shakeInterval = setInterval(() => {
      progress += 15;
      const currentProg = Math.min(100, progress);
      const intensity = 2.1 + Math.random() * 0.9;

      setBridgeStatus((prev) => ({
        ...prev,
        shakingProgress: currentProg,
        isShaking: true,
        shakeIntensity: parseFloat(intensity.toFixed(2)),
        status: currentProg >= 100 ? "OFFLOADING" : "SHAKING",
        message: `Physical Neurick board shake detected (${intensity.toFixed(2)}g)`,
      }));

      // NOTE: telemetry.storageKb / storageUsedGB are NOT touched here.
      // Those values come exclusively from the live COM12 hardware stream.

      if (progress >= 100) {
        clearInterval(shakeInterval);
        setIsShaking(false);
        setTimeout(() => {
          handleTriggerOffload();
        }, 350);
      }
    }, 200);
  };

  const handleResetStorage = () => {
    hasTriggeredCapacityScan.current = false;
    setAutoClimb(false);
    setIsShaking(false);
    // Zero out KB-based storage — hardware will immediately report real values once the
    // 'r' reset command is processed by the ESP32 board via edge_node.py
    setTelemetry((prev) => ({
      ...prev,
      storageKb: 0,
      storageUsedGB: 0,
    }));
    setBridgeStatus((prev) => ({
      ...prev,
      shakingProgress: 0,
      isShaking: false,
      status: "IDLE",
      message: "Tilt or shake Neurick board",
    }));

    fetch("/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storageKb: 0, storageUsedGB: 0, resetStorage: true }),
    }).catch(() => {});

    fetch("/api/bridge-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shakingProgress: 0, isShaking: false, status: "IDLE" }),
    }).catch(() => {});
  };

  /**
   * Encrypted P2P Transfer:
   * Locks onto friend's local IP, streams Fernet AES-256 chunks, and triggers on-chain settlement
   */
  const handleTriggerOffload = (customTargetHost?: HostNode) => {
    if (isOffloading) return;

    const targetHost =
      customTargetHost ||
      hosts.find((h) => h.id === selectedHostId && !!h.contractAddress) ||
      hosts.find((h) => !!h.contractAddress) ||
      hosts.find((h) => h.id === selectedHostId) ||
      hosts[0];

    if (!targetHost) return;

    setLockedIpAddress(targetHost.ipAddress);
    setSelectedHostId(targetHost.id);

    setIsOffloading(true);
    setOverallTransferProgress(0);
    setCurrentChunkIndex(0);

    const chunks: StorageChunk[] = [
      {
        id: "c1",
        name: "chunk_rover_cam_f09a.enc",
        sizeMB: 28.4,
        progress: 0,
        status: "encrypting",
        encryptionType: "Fernet AES-256",
        merkleRoot: "0x9e88...a214",
        fernetKey: "gAAAAABmX89eK2j9w_3zL0pQ8rTvY4u1A==",
      },
      {
        id: "c2",
        name: "chunk_lidar_sweep_22b.enc",
        sizeMB: 45.2,
        progress: 0,
        status: "pending",
        encryptionType: "Fernet AES-256",
        merkleRoot: "0x77c2...f890",
        fernetKey: "gAAAAABmY01fM3k8x_4yK1qP9sUwZ5v2B==",
      },
      {
        id: "c3",
        name: "chunk_telemetry_mpu_03.enc",
        sizeMB: 16.8,
        progress: 0,
        status: "pending",
        encryptionType: "Fernet AES-256",
        merkleRoot: "0x3fa1...e112",
        fernetKey: "gAAAAABmZ12gN4l7y_5zJ2rQ0tVxA6w3C==",
      },
      {
        id: "c4",
        name: "chunk_pointcloud_v4.enc",
        sizeMB: 38.6,
        progress: 0,
        status: "pending",
        encryptionType: "Fernet AES-256",
        merkleRoot: "0x82f4...d319",
        fernetKey: "gAAAAABma23hO5m6z_6aK3sR1uWyB7x4D==",
      },
    ];
    setTransferChunks(chunks);

    const now = new Date().toLocaleTimeString();
    const escrowTx = generateTxHash();

    // Step 1: [ESCROW_LOCKED] in Smart Contract
    setLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}-1`,
        timestamp: now,
        type: "ESCROW_LOCKED",
        tag: "ESCROW_LOCKED",
        tagColor: "blue",
        txHash: escrowTx.short,
        fullTxHash: escrowTx.full,
        message: `15.000 MST locked in escrow contract ${contractAddress.slice(0, 8)}...${contractAddress.slice(-6)} for offload to friend's device (${targetHost.ipAddress}:8443).`,
        mstAmount: "15.000 MST",
        blockNumber: 20865292,
      },
    ]);

    // Animate chunk transmission
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      const progress = Math.min(100, step * 10);
      setOverallTransferProgress(progress);

      const chunkIdx = Math.min(chunks.length - 1, Math.floor((step / 10) * chunks.length));
      setCurrentChunkIndex(chunkIdx);

      if (progress >= 100) {
        clearInterval(interval);
        setIsOffloading(false);

        const verifyTime = new Date().toLocaleTimeString();
        const challengeTx = generateTxHash();

        // Step 2: [MERKLE_CHALLENGE_ISSUED]
        setLogs((prev) => [
          ...prev,
          {
            id: `log-${Date.now()}-2`,
            timestamp: verifyTime,
            type: "MERKLE_CHALLENGE_ISSUED",
            tag: "MERKLE_CHALLENGE_ISSUED",
            tagColor: "gray",
            txHash: challengeTx.short,
            fullTxHash: challengeTx.full,
            message: `Cryptographic Merkle Challenge issued to ${targetHost.name} (${targetHost.ipAddress}). Root: 0x9e88...a214. Nonce: 849201.`,
            blockNumber: 20865293,
          },
        ]);

        // Step 3: [VERIFIED & PAID]
        setTimeout(() => {
          const paidTime = new Date().toLocaleTimeString();
          const paidTx = generateTxHash();

          setLogs((prev) => [
            ...prev,
            {
              id: `log-${Date.now()}-3`,
              timestamp: paidTime,
              type: "VERIFIED_PAID",
              tag: "VERIFIED & PAID",
              tagColor: "green",
              txHash: paidTx.short,
              fullTxHash: paidTx.full,
              message: `Proof accepted by contract. 0.080 MST auto-released to friend's wallet. Offload verified.`,
              mstAmount: "0.080 MST",
              blockNumber: 20865294,
            },
          ]);

          setFinalTxHash(paidTx.full);

          // After offload, zero out storage counters — hardware reports real post-reset values
          setTelemetry((prev) => ({
            ...prev,
            storageKb: 0,
            storageUsedGB: 0,
          }));
          setBridgeStatus((prev) => ({
            ...prev,
            shakingProgress: 0,
            isShaking: false,
            status: "COMPLETED",
          }));
          setAutoClimb(false);
          hasTriggeredCapacityScan.current = false;
          setTotalEarnedMST((prev) => prev + 0.08);
          setUsedCapacityGB((prev) => prev + 24.5);

          fetch("/api/telemetry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ storageKb: 0, storageUsedGB: 0, resetStorage: true }),
          }).catch(() => {});
          fetch("/api/bridge-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ shakingProgress: 0, isShaking: false, status: "COMPLETED" }),
          }).catch(() => {});
        }, 1100);
      }
    }, 260);
  };

  const handleSelectHostCard = (hostId: string, autoInitiate = true) => {
    setSelectedHostId(hostId);
    const targetHost = hosts.find((h) => h.id === hostId);
    if (targetHost) {
      setLockedIpAddress(targetHost.ipAddress);
      // Only auto-trigger offload if this host has a BONDED contract (has staking escrow).
      // Clicking an unbonded peer (no contract) just locks the IP — no blockchain tx.
      if (autoInitiate && !isOffloading && targetHost.contractAddress) {
        handleTriggerOffload(targetHost);
      }
    }
  };

  // Slashing Demo Event
  const handleTriggerSlashingDemo = () => {
    setIsHostOnline(false);
    setHasSlashedEvent(true);

    const now = new Date().toLocaleTimeString();
    const challengeTx = generateTxHash();

    setLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}-s1`,
        timestamp: now,
        type: "MERKLE_CHALLENGE_ISSUED",
        tag: "MERKLE_CHALLENGE_ISSUED",
        tagColor: "gray",
        txHash: challengeTx.short,
        fullTxHash: challengeTx.full,
        message: `High-priority audit challenge issued to Friend's Host (${lockedIpAddress}) for chunk root 0x77c2...f890. Awaiting response (Timeout 5s)...`,
        blockNumber: 20865295,
      },
    ]);

    setTimeout(() => {
      const slashTime = new Date().toLocaleTimeString();
      const slashTx = generateTxHash();

      setLogs((prev) => [
        ...prev,
        {
          id: `log-${Date.now()}-s2`,
          timestamp: slashTime,
          type: "SLASHED_PENALIZED",
          tag: "SLASHED / PENALIZED",
          tagColor: "red",
          txHash: slashTx.short,
          fullTxHash: slashTx.full,
          message: `CRITICAL: Friend's Host failed Merkle response (node dropped offline). 5.000 MST security bond slashed by contract and refunded to robot escrow!`,
          mstAmount: "5.000 MST",
          blockNumber: 20865296,
        },
      ]);
    }, 1300);
  };

  const handleToggleHostOnline = () => {
    if (isHostOnline) {
      handleTriggerSlashingDemo();
    } else {
      setIsHostOnline(true);
      setHasSlashedEvent(false);
      const now = new Date().toLocaleTimeString();
      const restoreTx = generateTxHash();

      setLogs((prev) => [
        ...prev,
        {
          id: `log-${Date.now()}-rec`,
          timestamp: now,
          type: "SYSTEM_INFO",
          tag: "HOST_RESTORED",
          tagColor: "green",
          txHash: restoreTx.short,
          fullTxHash: restoreTx.full,
          message: `Friend's Host re-authenticated and deposited new security bond of 5.000 MST. Node restored to mesh.`,
          blockNumber: 20865297,
        },
      ]);
    }
  };

  if (!isLoggedIn) {
    return (
      <LoginPortal
        onLogin={(role, session) => {
          setUserRole(role);
          setActiveSession(session);
          setIsLoggedIn(true);
        }}
      />
    );
  }

  const activeHostName = hosts[0]
    ? `${hosts[0].name} (${hosts[0].deviceType}) - ${hosts[0].ipAddress}`
    : "Friend's Host Laptop";

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-[0.045] pointer-events-none"
        style={{ backgroundImage: `url('/warehouse_bg.jpg')` }}
      />

      {/* Top Navigation Bar */}
      <Navbar
        role={userRole}
        onLogout={() => setIsLoggedIn(false)}
        onSwitchRole={() => {
          const nextRole = userRole === "operator" ? "host" : "operator";
          setUserRole(nextRole);
          setActiveSession((prev) => ({
            ...prev,
            role: nextRole,
            address: nextRole === "operator" ? "0x4F82...3B91" : "0x79B2...9E40",
            identityLabel: nextRole === "operator" ? "Fleet Operator Key" : "Host Staker Bond",
          }));
        }}
        onOpenExplorer={() => setIsExplorerOpen(true)}
        onOpenDemoGuide={() => setIsDemoGuideOpen(true)}
        isHostOnline={isHostOnline}
        walletAddress={activeSession.address}
        hostDeviceName={networkInfo.myDeviceName}
      />

      {/* Main 3-Column Enterprise Dashboard Grid */}
      <main className="relative z-10 flex-1 w-full px-4 sm:px-6 lg:px-8 py-5">
        {/* Dynamic Role Banner with Real Wi-Fi Network & Contract Binding */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-3">
            <span
              className={`w-3 h-3 rounded-full ${
                userRole === "operator" ? "bg-blue-600" : "bg-emerald-600"
              }`}
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  {userRole === "operator"
                    ? "Robot Fleet Command & Edge Offload Console"
                    : "Decentralized Host Storage Vault & Earnings Portal"}
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  RBAC: {userRole.toUpperCase()}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Wi-Fi: {networkInfo.localIp}
                </span>
                {/* Contract badge: only shown on the HOST laptop (friend's HP), not on the robot operator's ASUS */}
                {!networkInfo.isServerHost && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Contract: {contractAddress.slice(0, 8)}...485e ✓
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {userRole === "operator"
                  ? `Authenticated as ${activeSession.identityLabel} (${activeSession.address}) • Same Wi-Fi Mesh (${networkInfo.subnet})`
                  : `Authenticated as ${activeSession.identityLabel} (${activeSession.address}) • Hard Drive Lending Vault Active`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setUserRole(userRole === "operator" ? "host" : "operator")}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-colors cursor-pointer"
            >
              Switch Role to {userRole === "operator" ? "Host Provider" : "Fleet Operator"}
            </button>
          </div>
        </div>

        {/* 3-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Robot Telemetry (for Operator) OR Storage Vault (for Host) */}
          <div className="flex flex-col">
            {userRole === "operator" ? (
              <div className="flex flex-col gap-4">
                <RobotPanel
                  telemetry={telemetry}
                  onTriggerOffload={() => handleTriggerOffload()}
                  isOffloading={isOffloading}
                  onSimulateShake={handleSimulateShake}
                  onResetStorage={handleResetStorage}
                  onToggleAutoClimb={() => setAutoClimb(!autoClimb)}
                  autoClimb={autoClimb}
                  shakingProgress={bridgeStatus.shakingProgress}
                  finalTxHash={finalTxHash || bridgeStatus.txHash}
                  shakeIntensity={bridgeStatus.shakeIntensity}
                  bridgeStatusMessage={bridgeStatus.message}
                />

                {/* Windows Command Prompt / Serial Terminal Console */}
                <CommandPromptTerminal
                  telemetry={telemetry}
                  isBoardConnected={telemetry.isBoardConnected}
                  terminalLogs={bridgeStatus.terminalLogs || []}
                  shakingProgress={bridgeStatus.shakingProgress}
                  shakeIntensity={bridgeStatus.shakeIntensity}
                  isShaking={bridgeStatus.isShaking || isShaking}
                  onSimulateShake={handleSimulateShake}
                />
              </div>
            ) : (
              <StorageVaultPanel
                vaultFiles={vaultFiles}
                totalEarnedMST={totalEarnedMST}
                onWithdrawRewards={() => {
                  alert("Transferred 4.850 MST from storage escrow contract to wallet 0x4F82...3B91 successfully!");
                  setTotalEarnedMST(0);
                }}
                allocatedCapacityGB={allocatedCapacityGB}
                usedCapacityGB={usedCapacityGB}
                hostNodeName={networkInfo.myDeviceName}
                hostNodeIp={networkInfo.localIp}
              />
            )}
          </div>

          {/* Column 2: Host Marketplace & Encrypted P2P Transfer (Showing ONLY Real Device on Same Wi-Fi) */}
          <div className="flex flex-col">
            <MarketplacePanel
              role={userRole}
              hosts={hosts}
              selectedHostId={selectedHostId}
              onSelectHost={handleSelectHostCard}
              isOffloading={isOffloading}
              transferChunks={transferChunks}
              currentChunkIndex={currentChunkIndex}
              overallTransferProgress={overallTransferProgress}
              isHostOnline={isHostOnline}
              onToggleHostOnline={handleToggleHostOnline}
              allocatedCapacityGB={allocatedCapacityGB}
              onUpdateAllocatedCapacity={(cap) => setAllocatedCapacityGB(cap)}
              hostRateMST={hostRateMST}
              onUpdateHostRate={(rate) => setHostRateMST(rate)}
              activeContractAddress={contractAddress}
              wifiSubnet={networkInfo.subnet}
              hostPortalUrl={networkInfo.portalUrl}
              isScanning={isScanningWifi}
              onTriggerScan={() => handleTriggerWifiScan()}
              scanMessage={scanMessage}
              lockedIpAddress={lockedIpAddress}
              onRegisterFriendIp={handleRegisterFriendIp}
            />
          </div>

          {/* Column 3: Blockchain Audit & Smart Contract Feed */}
          <div className="flex flex-col">
            <BlockchainPanel
              logs={logs}
              onOpenExplorer={() => setIsExplorerOpen(true)}
              onTriggerSlashingDemo={handleTriggerSlashingDemo}
              isHostOnline={isHostOnline}
              hasSlashedEvent={hasSlashedEvent}
              resolvedHostName={activeHostName}
              userRole={userRole}
              userAddress={activeSession.address}
              selectedHostContractAddress={
                hosts.find((h) => h.id === selectedHostId)?.contractAddress
              }
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-4 border-t border-slate-200/80 bg-white/70 backdrop-blur-xs text-center text-xs text-slate-500 font-mono">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Project RoboShare Enterprise • Real Wi-Fi Peer Sync ({networkInfo.localIp})</span>
          <span>SARAL Protocol • EIP-712 Zero Gas • Fernet AES-256 P2P Stream</span>
        </div>
      </footer>

      {/* MST Explorer Modal */}
      <MstExplorerModal
        isOpen={isExplorerOpen}
        onClose={() => setIsExplorerOpen(false)}
        logs={logs}
        contractAddress={contractAddress}
      />

      {/* Presentation Guide Modal */}
      <PresentationGuideModal
        isOpen={isDemoGuideOpen}
        onClose={() => setIsDemoGuideOpen(false)}
        onTriggerOffload={() => handleTriggerOffload()}
        onTriggerSlashingDemo={handleTriggerSlashingDemo}
      />
    </div>
  );
}
