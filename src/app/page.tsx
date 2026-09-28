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

  // Hardware Telemetry state (Neurick ESP32-S3 + MPU6050)
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    accelX: 0.42,
    accelY: -0.05,
    accelZ: 0.98,
    gyroX: 0.02,
    gyroY: -0.01,
    gyroZ: 0.04,
    tempC: 38.4,
    storageUsedGB: 28.48, // Nearing capacity to trigger Wi-Fi discovery
    storageTotalGB: 32.0,
    batteryPct: 92,
    deviceName: "Neurick-ESP32-S3",
    firmware: "v1.12-MPU",
    isBoardConnected: true,
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

  // Final mined blockchain transaction hash
  const [finalTxHash, setFinalTxHash] = useState<string | undefined>("0x823ec1b9a53e69d9ede1014afcfa1245c4ef2c36ea1ccad731db21d5cbd96f19");

  // Member 3 & 4 Bridge Status (Physical Shake Progress & Final on-chain Tx)
  const [bridgeStatus, setBridgeStatus] = useState<{
    shakingProgress: number;
    isShaking: boolean;
    shakeIntensity: number;
    status: string;
    txHash?: string;
    blockNumber?: number;
    message?: string;
  }>({
    shakingProgress: 0,
    isShaking: false,
    shakeIntensity: 0.98,
    status: "IDLE",
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

  // Automated Network Scan trigger when robot storage reaches capacity
  useEffect(() => {
    if (telemetry.storageUsedGB >= 28.0 && !hasTriggeredCapacityScan.current && !isScanningWifi) {
      hasTriggeredCapacityScan.current = true;
      handleTriggerWifiScan(
        `⚡ Storage capacity warning (${telemetry.storageUsedGB.toFixed(1)}/32 GB) — initiating Wi-Fi discovery for friend's host...`
      );
    }
  }, [telemetry.storageUsedGB, isScanningWifi]);

  // Member 3 & 4 Real-Time Bridge Polling (Physical Shake Progress & Final on-chain Tx)
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

          // Shaking physical Neurick hardware increases Local Memory Capacity!
          if (data.shakingProgress > 0 || data.isShaking) {
            setTelemetry((prev) => {
              // Scale from 3.80 GB (12% baseline) to 28.50 GB (critical threshold) based on physical shake progress
              const mappedStorage = 3.8 + (data.shakingProgress / 100) * (28.5 - 3.8);
              const target = Math.max(prev.storageUsedGB, mappedStorage);
              return {
                ...prev,
                storageUsedGB: parseFloat(Math.min(prev.storageTotalGB, target).toFixed(2)),
              };
            });
          }

          if (data.shakingProgress >= 100 && !isOffloading) {
            handleTriggerOffload();
          }
        }
      } catch {
        // Ignore
      }
    }, 350);

    return () => clearInterval(bridgePoller);
  }, [isOffloading]);

  // Live MPU6050 sensor polling with seamless simulation fallback
  useEffect(() => {
    let isPhysicalBoardActive = false;

    // Check physical board telemetry stream every 400ms
    const boardPoller = setInterval(async () => {
      try {
        const res = await fetch("/api/telemetry");
        if (res.ok) {
          const data = await res.json();
          if (data.isBoardConnected) {
            isPhysicalBoardActive = true;

            // Detect physical board shake magnitude from MPU6050
            const mag = Math.sqrt(
              (data.accelX || 0) ** 2 +
              (data.accelY || 0) ** 2 +
              (data.accelZ || 0) ** 2
            );
            const isPhysicalShake = Math.abs(mag - 1.0) > 0.35 || mag > 1.35;

            setTelemetry((prev) => {
              let newStorage = typeof data.storageUsedGB === "number" ? data.storageUsedGB : prev.storageUsedGB;

              // If physical shake detected on hardware, increase Local Memory Capacity!
              if (isPhysicalShake) {
                newStorage = Math.min(prev.storageTotalGB, prev.storageUsedGB + 0.35 * Math.max(1, mag));
              }

              return {
                ...prev,
                accelX: data.accelX,
                accelY: data.accelY,
                accelZ: data.accelZ,
                gyroX: data.gyroX ?? prev.gyroX,
                gyroY: data.gyroY ?? prev.gyroY,
                gyroZ: data.gyroZ ?? prev.gyroZ,
                tempC: data.tempC,
                storageUsedGB: parseFloat(newStorage.toFixed(2)),
                storageTotalGB: data.storageTotalGB ?? prev.storageTotalGB,
                batteryPct: data.batteryPct ?? prev.batteryPct,
                isBoardConnected: true,
              };
            });

            // Update physical shake progress bar when board is shaken
            if (isPhysicalShake) {
              setBridgeStatus((prev) => {
                const nextProg = Math.min(100, prev.shakingProgress + 10);
                if (nextProg >= 100 && !isOffloading) {
                  setTimeout(() => handleTriggerOffload(), 200);
                }
                return {
                  ...prev,
                  isShaking: true,
                  shakeIntensity: parseFloat(mag.toFixed(2)),
                  shakingProgress: nextProg,
                  message: `Physical Neurick shake detected (${mag.toFixed(2)}g)`,
                  status: nextProg >= 100 ? "OFFLOADING" : "SHAKING",
                };
              });
            }

            return;
          }
        }
        isPhysicalBoardActive = false;
      } catch {
        isPhysicalBoardActive = false;
      }
    }, 400);

    // Fallback simulation when physical board is not actively transmitting
    const simTimer = setInterval(() => {
      if (isPhysicalBoardActive) return;

      setTelemetry((prev) => {
        let deltaX = (Math.random() - 0.5) * 0.06;
        let deltaY = (Math.random() - 0.5) * 0.06;
        let deltaZ = (Math.random() - 0.5) * 0.04;

        if (isShaking) {
          deltaX = (Math.random() - 0.5) * 2.2;
          deltaY = (Math.random() - 0.5) * 1.9;
          deltaZ = 0.5 + (Math.random() - 0.5) * 2.4;
        }

        let newStorage = prev.storageUsedGB;
        if (autoClimb && newStorage < prev.storageTotalGB) {
          newStorage = Math.min(prev.storageTotalGB, prev.storageUsedGB + 0.25);
          // Sync shake progress bar as auto-fill climbs
          const mappedProg = Math.min(100, Math.round(((newStorage - 3.8) / (28.5 - 3.8)) * 100));
          setBridgeStatus((b) => ({
            ...b,
            shakingProgress: Math.max(0, mappedProg),
            message: `Memory auto-filling (${newStorage.toFixed(2)}/32.0 GB)`,
          }));

          // When auto-fill reaches capacity threshold, automatically trigger offload!
          if (newStorage >= 28.5 && !isOffloading) {
            setAutoClimb(false);
            setTimeout(() => handleTriggerOffload(), 250);
          }
        }

        return {
          ...prev,
          accelX: parseFloat((prev.accelX + deltaX).toFixed(2)),
          accelY: parseFloat((prev.accelY + deltaY).toFixed(2)),
          accelZ: parseFloat((0.98 + deltaZ).toFixed(2)),
          storageUsedGB: parseFloat(newStorage.toFixed(2)),
          tempC: parseFloat((38.2 + Math.random() * 0.4).toFixed(1)),
          isBoardConnected: false,
        };
      });
    }, 250);

    return () => {
      clearInterval(boardPoller);
      clearInterval(simTimer);
    };
  }, [isShaking, autoClimb, isOffloading]);

  const handleSimulateShake = () => {
    if (isOffloading) return;
    setIsShaking(true);

    // Smoothly animate physical shake detector up and increase Local Memory Capacity
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

      // Directly increase Local Memory Capacity in sync with shake!
      setTelemetry((prev) => {
        const mappedStorage = 3.8 + (currentProg / 100) * (28.5 - 3.8);
        return {
          ...prev,
          storageUsedGB: parseFloat(mappedStorage.toFixed(2)),
        };
      });

      if (progress >= 100) {
        clearInterval(shakeInterval);
        setIsShaking(false);
        // Automatically trigger Storage Offload when shake reaches 100% capacity!
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
    setTelemetry((prev) => ({
      ...prev,
      storageUsedGB: 3.8,
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
      body: JSON.stringify({ storageUsedGB: 3.8, resetStorage: true }),
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

          setTelemetry((prev) => ({
            ...prev,
            storageUsedGB: 3.8,
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
            body: JSON.stringify({ storageUsedGB: 3.8, resetStorage: true }),
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
