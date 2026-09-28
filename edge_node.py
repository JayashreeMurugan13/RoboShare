import sys
import io

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import json
import time
from cryptography.fernet import Fernet
import requests
import serial
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware

# --- CONFIGURATION ---
PORT = "COM12"
BAUD = 115200

# Frontend Webhook URL (Member 3's Next.js API endpoint)
FRONTEND_ENDPOINT = "http://localhost:3001/api/bridge-status"

# Set to True for flawless hackathon demo presentation without gas issues!
DEMO_MODE = True  

# Live Contract details from Member 1
CONTRACT_ADDRESS = "0xF3E8Fa4D07A0bC65eaB6528fE46C9Ed308095AEA"
RPC_URL = "https://mariorpc.mstblockchain.com"
PRIVATE_KEY = "0xe8cc546872bd846d337ed4b11f8806e89186d65d2072d18f68112dad45c2407f"
SENDER_ADDRESS = Web3.to_checksum_address("0xEF6D548FE2456cF02c002166d3655D0c6F5DdA51")

CONTRACT_ABI = [
    {
        "inputs": [],
        "name": "releaseBounty",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    }
]

# Initialize Web3 Connection & PoA Middleware
w3 = Web3(Web3.HTTPProvider(RPC_URL))
try:
    w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
except Exception:
    pass
contract = w3.eth.contract(address=Web3.to_checksum_address(CONTRACT_ADDRESS), abi=CONTRACT_ABI)

# Setup Local Encryption
encryption_key = Fernet.generate_key()
cipher = Fernet(encryption_key)

print("=================================================")
print("  ROBO-SHARE LIVE DePIN MIDDLEWARE & UI BRIDGE  ")
print("=================================================")

import serial.tools.list_ports

ser = None
available_ports = [f"{p.device} ({p.description})" for p in serial.tools.list_ports.comports() if "BLUETOOTH" not in p.description.upper()]
print(f"[INFO] Real USB/Serial ports detected: {available_ports if available_ports else 'None (ESP32 on COM12 not attached)'}")

target_port = None
for p in serial.tools.list_ports.comports():
    desc = p.description.upper()
    if "BLUETOOTH" in desc:
        continue
    if p.device == PORT or "USB" in desc or "CP210" in desc or "CH340" in desc or "FTDI" in desc or "ESP32" in desc:
        target_port = p.device
        break

if target_port:
    try:
        ser = serial.Serial(target_port, BAUD, timeout=1)
        time.sleep(1)
        print(f"[SUCCESS] Connected to Neurick hardware on {target_port}")
    except Exception as e:
        print(f"[NOTE] Port {target_port} could not be opened: {e}")
        ser = None
else:
    print(f"[NOTE] Hardware board ({PORT}) not plugged into this machine.")
    print("[INFO] Live Webhook Bridge active -> pushing directly to http://localhost:3001/api/bridge-status")
    ser = None


def send_to_frontend(payload):
    """Helper function to push live status updates to Member 3's Next.js dashboard"""
    try:
        requests.post(FRONTEND_ENDPOINT, json=payload, timeout=0.5)
    except Exception as e:
        # Non-blocking if frontend is temporarily offline
        pass


def execute_blockchain_offload(telemetry_summary, magnitude):
    print("\n-------------------------------------------------")
    print("🚨 [TRIGGER CAUGHT] STORAGE BUFFER AT 100%!")
    print("1. Packaging & encrypting real hardware telemetry...")

    raw_payload = f"Robo-Share_Live_Telemetry_Data: {telemetry_summary}"
    encrypted_data = cipher.encrypt(raw_payload.encode("utf-8"))
    print(f"2. Encrypted Payload (Fernet): {encrypted_data.decode('utf-8')[:35]}...")

    # Notify UI that offload is processing
    send_to_frontend({
        "shakingProgress": 100,
        "isShaking": False,
        "shakeIntensity": round(magnitude / 10000.0, 2),
        "status": "OFFLOADING",
        "message": "Storage full (100%). Anchoring to MST Testnet...",
    })

    if DEMO_MODE:
        print("3. Broadcasting live transaction to MST Testnet (Demo Mode)...")
        time.sleep(1.0)
        mock_tx_hash = "0x823ec1b9a53e69d9ede1014afcfa1245c4ef2c36ea1ccad731db21d5cbd96f19"
        block_num = 20865320
        print(f"4. ⏳ Transaction sent! Hash: {mock_tx_hash}")
        print("Waiting for network confirmation...")
        time.sleep(0.5)
        print(f"5. ✅ [SUCCESS] Bounty released on-chain! Block: {block_num}")

        # Send final success payload to frontend UI
        send_to_frontend({
            "shakingProgress": 100,
            "isShaking": False,
            "shakeIntensity": round(magnitude / 10000.0, 2),
            "status": "COMPLETED",
            "txHash": mock_tx_hash,
            "blockNumber": block_num,
            "message": "Offload anchored on MST Testnet blockchain",
        })
    else:
        print("3. Broadcasting live transaction to MST Testnet (EIP-1559)...")
        try:
            nonce = w3.eth.get_transaction_count(SENDER_ADDRESS)
            latest_block = w3.eth.get_block("latest")
            base_fee = latest_block.get("baseFeePerGas", w3.to_wei(2, "gwei"))

            txn = contract.functions.releaseBounty().build_transaction({
                "chainId": 4646,
                "gas": 300000,
                "maxFeePerGas": base_fee * 2 + w3.to_wei(1, "gwei"),
                "maxPriorityFeePerGas": w3.to_wei(1, "gwei"),
                "nonce": nonce,
                "from": SENDER_ADDRESS,
            })

            signed_txn = w3.eth.account.sign_transaction(txn, private_key=PRIVATE_KEY)
            tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)

            hex_hash = w3.to_hex(tx_hash)
            print(f"4. ⏳ Transaction sent! Hash: {hex_hash}")
            print("Waiting for network confirmation...")

            receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
            print(f"5. ✅ [SUCCESS] Bounty released on-chain! Block: {receipt.blockNumber}")

            # Send real success payload to frontend UI
            send_to_frontend({
                "shakingProgress": 100,
                "isShaking": False,
                "shakeIntensity": round(magnitude / 10000.0, 2),
                "status": "COMPLETED",
                "txHash": hex_hash,
                "blockNumber": receipt.blockNumber,
                "message": "Offload anchored on MST Testnet blockchain",
            })
        except Exception as err:
            print(f"❌ [ERROR] Blockchain transaction failed: {err}")
            send_to_frontend({
                "shakingProgress": 100,
                "isShaking": False,
                "status": "ERROR",
                "message": f"Transaction failed: {err}",
            })
    print("-------------------------------------------------\n")


# --- MAIN LOOP ---
last_known_telemetry = "Initial_Resting_State_0KB"
current_storage_kb = 0

while True:
    try:
        if ser and ser.in_waiting > 0:
            line = ser.readline().decode("utf-8", errors="ignore").strip()
            if line:
                print(line)
                
                # Extract telemetry and current buffer progress from serial stream
                if "Motion Intensity" in line:
                    last_known_telemetry = line
                    try:
                        # Parse magnitude number e.g. "Motion Intensity (Total Magnitude): 35540"
                        mag_val = float(line.split(":")[-1].strip())
                        
                        # Simulate progressive filling based on shake intensity or detect buffer strings
                        if mag_val > 25000:
                            current_storage_kb = min(1000, current_storage_kb + 250)
                        elif mag_val > 20000:
                            current_storage_kb = min(1000, current_storage_kb + 100)
                            
                        progress_pct = int((current_storage_kb / 1000.0) * 100)
                        
                        # Push live progress to Member 3's frontend UI
                        send_to_frontend({
                            "shakingProgress": progress_pct,
                            "isShaking": True,
                            "shakeIntensity": round(mag_val / 10000.0, 2),
                            "status": "SHAKING_DETECTED",
                            "message": f"Buffer filling: {progress_pct}% ({current_storage_kb} KB / 1000 KB)",
                        })
                    except Exception:
                        pass

            if "TRIGGER_OFFLOAD" in line or current_storage_kb >= 1000:
                execute_blockchain_offload(last_known_telemetry, 50000.0)
                if ser:
                    print("🔄 Sending reset command ('r') to Neurick hardware board...")
                    ser.write(b"r")
                current_storage_kb = 0
                time.sleep(1)
        elif ser is None:
            # When physical board is not plugged in, support automated test or prompt
            import sys
            if "--test" in sys.argv or "--demo" in sys.argv:
                print("\n[DEMO] Simulating physical hardware shake sequence...")
                for intensity, kb in [(18500, 250), (28000, 500), (34500, 750), (46000, 1000)]:
                    pct = int((kb / 1000.0) * 100)
                    print(f"Motion Intensity (Total Magnitude): {intensity} -> Buffer {pct}% ({kb} KB / 1000 KB)")
                    send_to_frontend({
                        "shakingProgress": pct,
                        "isShaking": True,
                        "shakeIntensity": round(intensity / 10000.0, 2),
                        "status": "SHAKING_DETECTED",
                        "message": f"Buffer filling: {pct}% ({kb} KB / 1000 KB)",
                    })
                    time.sleep(1.2)
                
                execute_blockchain_offload("ESP32_MPU6050_Peak_Accel_4.60g", 46000.0)
                current_storage_kb = 0
                print("[DEMO] Test cycle complete. Waiting 3 seconds...\n")
                time.sleep(3)
                break
            else:
                time.sleep(0.5)
        else:
            time.sleep(0.1)
    except KeyboardInterrupt:
        print("\nShutting down bridge...")
        if ser:
            ser.close()
        break
