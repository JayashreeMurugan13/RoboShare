export type UserRole = 'operator' | 'host';

export interface AuthSession {
  role: UserRole;
  method: 'MST Wallet' | 'SARAL SSO' | 'Web3 Google';
  address: string;
  identityLabel: string;
  rbacToken: string;
  onChainVerified?: boolean;
  blockVerified?: number;
}

export interface TelemetryData {
  accelX: number;
  accelY: number;
  accelZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
  tempC: number;
  storageUsedGB: number;
  storageTotalGB: number;
  batteryPct: number;
  deviceName: string;
  firmware: string;
  isBoardConnected: boolean;
}

export interface HostNode {
  id: string;
  name: string;
  deviceType: string;
  storageFreeGB: number;
  rateMST: number;
  latencyMs: number;
  status: 'Ready' | 'Selected' | 'Busy' | 'Offline';
  ipAddress: string;
  verifiedProofs: number;
  contractAddress?: string;
  rssi?: number;
  discoveredAt?: string;
  macAddress?: string;
}

export interface StorageChunk {
  id: string;
  name: string;
  sizeMB: number;
  progress: number;
  status: 'pending' | 'encrypting' | 'transmitting' | 'verified' | 'slashed';
  encryptionType: string;
  merkleRoot: string;
  fernetKey?: string;
}

export interface BlockchainLog {
  id: string;
  timestamp: string;
  type: 'ESCROW_LOCKED' | 'MERKLE_CHALLENGE_ISSUED' | 'VERIFIED_PAID' | 'SLASHED_PENALIZED' | 'SYSTEM_INFO';
  tag: string;
  tagColor: 'blue' | 'gray' | 'green' | 'red' | 'purple';
  txHash: string;
  fullTxHash?: string;
  message: string;
  details?: string;
  mstAmount?: string;
  blockNumber: number;
}

export interface VaultFile {
  id: string;
  fileName: string;
  sizeMB: number;
  merkleRoot: string;
  timestamp: string;
  integrity: 'Valid' | 'Challenged' | 'Compromised';
  rewardEarnedMST: number;
}

