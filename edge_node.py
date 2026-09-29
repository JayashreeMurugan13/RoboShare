import io
import json
import re
import serial
import sys
import time
from cryptography.fernet import Fernet
import requests
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware

# --- CONSOLE ENCODING FIX ---
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# --- HARDWARE & BRIDGE CONFIGURATION ---
PORT = "COM12"
BAUD = 115200

# Set DEMO_MODE = True to bypass live gas broadcasting during quick offline tests
DEMO_MODE = False

# Web3 / MST Testnet Configuration
CONTRACT_ADDRESS = "0xF3E8Fa4D07A0bC65eaB6528fE46C9Ed308095AEA"
RPC_URL = "https://mariorpc.mstblockchain.com"
PRIVATE_KEY = "0xe8cc546872bd846d337ed4b11f8806e89186d65d2072d18f68112dad45c2407f"
SENDER_ADDRESS = Web3.to_checksum_address("0xEF6D548FE2456cF02c002166d3655D0c6F5DdA51")
CHAIN_ID = 4646

CONTRACT_ABI = [
    {
        "inputs": [],
        "name": "releaseBounty",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    }
]

# --- WEB3 CONNECTION INITIALIZATION ---
w3 = Web3(Web3.HTTPProvider(RPC_URL))
try:
    w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
except Exception:
    pass

contract = w3.eth.contract(
    address=Web3.to_checksum_address(CONTRACT_ADDRESS), abi=CONTRACT_ABI
)

# --- LOCAL AES ENCRYPTION ---
encryption_key = Fernet.generate_key()
cipher = Fernet(encryption_key)

print("=================================================")
print("  ROBO-SHARE LIVE DePIN MIDDLEWARE & UI BRIDGE  ")
print("=================================================")
print(f"[INIT] Hard-locking serial communication strictly to {PORT} at {BAUD} baud...")

# --- HANDSHAKE SIGNATURE PATTERNS ---
# Any line from the ESP32 firmware that matches one of these patterns is
# considered proof that a real Neurick board is streaming.
_VALID_SIGNATURE = re.compile(
    r"(Resting Gravity|STATUS:|Motion Intensity|X \(Lateral\))",
    re.I,
)
_HANDSHAKE_TIMEOUT = 3.0   # seconds to wait for first valid board packet
_HEARTBEAT_TIMEOUT = 2.0   # seconds of silence before flagging disconnected

# Establish physical connection to Neurick Hardware
ser = None
try:
    ser = serial.Serial(PORT, BAUD, timeout=1)
    time.sleep(1.5)  # allow ESP32 reset / boot to finish
except Exception as e:
    print("\n" + "*" * 75)
    print(f"🚨 CRITICAL HARDWARE ERROR: COULD NOT OPEN {PORT} AT {BAUD} BAUD! 🚨")
    print(f"Details: {e}")
    print("Troubleshooting checklist:")
    print("  1. Verify the Neurick ESP32 board is plugged firmly into USB.")
    print(f"  2. In Windows Device Manager, ensure it shows under Ports as {PORT}.")
    print(f"  3. Ensure no other tool (Arduino IDE, Serial Monitor) holds {PORT}.")
    print("*" * 75 + "\n")
    sys.exit(1)

# ---- STRICT HARDWARE HANDSHAKE (3-second window) -------------------------
# Opening a COM port on Windows succeeds for ANY device occupying that port
# (or even a ghost port). We MUST receive at least one valid Neurick packet
# before we claim the board is live.
print(f"[HANDSHAKE] Waiting up to {_HANDSHAKE_TIMEOUT:.0f}s for a valid Neurick data packet on {PORT}...")
_hs_deadline = time.time() + _HANDSHAKE_TIMEOUT
_handshake_ok = False

while time.time() < _hs_deadline:
    try:
        if ser.in_waiting > 0:
            _hs_line = ser.readline().decode("utf-8", errors="ignore").strip()
            if _hs_line:
                print(f"  [HS] {_hs_line}")
                if _VALID_SIGNATURE.search(_hs_line):
                    _handshake_ok = True
                    break
        else:
            time.sleep(0.05)
    except Exception as _hs_err:
        print(f"[HANDSHAKE] Read error during handshake: {_hs_err}")
        break

if not _handshake_ok:
    # Notify the frontend immediately so the UI shows disconnected
    for _url in [
        "http://localhost:3001/api/bridge-status",
        "http://localhost:3000/api/bridge-status",
    ]:
        try:
            requests.post(
                _url,
                json={
                    "isBoardConnected": False,
                    "status": "DISCONNECTED",
                    "message": f"No valid Neurick packet received from {PORT} within {_HANDSHAKE_TIMEOUT:.0f}s.",
                },
                timeout=0.5,
            )
        except Exception:
            pass
    print("\n" + "*" * 75)
    print(f"🚨 HANDSHAKE FAILED: No valid Neurick data received from {PORT}!")
    print("The COM port opened but no firmware signature was detected.")
    print("Possible causes:")
    print("  - USB cable is unplugged or is a charge-only cable.")
    print("  - A different device is occupying COM12 (check Device Manager).")
    print("  - ESP32 firmware has not started / is in a boot-loop.")
    print("*" * 75 + "\n")
    if ser:
        ser.close()
    sys.exit(1)

def send_to_frontend(payload):
    """Pushes real-time status & telemetry updates to Next.js API endpoints."""
    endpoints = [
        "http://localhost:3001/api/bridge-status",
        "http://localhost:3000/api/bridge-status",
        "http://localhost:3001/api/telemetry",
        "http://localhost:3000/api/telemetry",
    ]
    for url in endpoints:
        try:
            requests.post(url, json=payload, timeout=0.3)
        except Exception:
            pass


print("=================================================")
print(f"✅ [SUCCESS] Physical Neurick hardware VERIFIED & LIVE on {PORT}!")
print("=================================================")

send_to_frontend({
    "terminalLog": f"[{time.strftime('%H:%M:%S')}] ✅ [CONNECTED] Neurick ESP32-S3 verified on {PORT} at {BAUD} baud.",
    "isBoardConnected": True,
})


def execute_blockchain_offload(telemetry_summary, magnitude):
    """Encrypts local logs and anchors the offload on MST Blockchain."""
    print("\n-------------------------------------------------")
    print("🚨 [TRIGGER CAUGHT] STORAGE BUFFER AT 100%!")
    print("1. Packaging & encrypting real hardware telemetry...")

    raw_payload = f"Robo-Share_Live_Telemetry_Data: {telemetry_summary}"
    encrypted_data = cipher.encrypt(raw_payload.encode("utf-8"))
    print(f"2. Encrypted Payload (Fernet): {encrypted_data.decode('utf-8')[:35]}...")

    g_mag = (
        round(magnitude / 16384.0, 2)
        if magnitude > 100
        else round(magnitude / 10000.0, 2)
    )

    # Inform UI that transaction generation is under way
    send_to_frontend({
        "terminalLog": f"[{time.strftime('%H:%M:%S')}] 🚨 [OFFLOAD TRIGGERED] 100% full buffer! Fernet AES-256 encrypted payload packaging...",
        "shakingProgress": 100,
        "isShaking": False,
        "shakeIntensity": g_mag,
        "status": "OFFLOADING",
        "message": "Storage full (100%). Anchoring to MST Testnet...",
        "isBoardConnected": True,
    })

    if DEMO_MODE:
        print("3. Broadcasting live transaction to MST Testnet (Demo Mode)...")
        time.sleep(1.0)
        mock_tx_hash = (
            "0x823ec1b9a53e69d9ede1014afcfa1245c4ef2c36ea1ccad731db21d5cbd96f19"
        )
        block_num = 20865320
        print(f"4. ⏳ Transaction sent! Hash: {mock_tx_hash}")
        print("Waiting for network confirmation...")
        time.sleep(0.5)
        print(f"5. ✅ [SUCCESS] Bounty released on-chain! Block: {block_num}")

        send_to_frontend({
            "shakingProgress": 100,
            "isShaking": False,
            "shakeIntensity": g_mag,
            "status": "COMPLETED",
            "txHash": mock_tx_hash,
            "blockNumber": block_num,
            "message": "Offload anchored on MST Testnet blockchain",
            "isBoardConnected": True,
        })
    else:
        print("3. Broadcasting live transaction to MST Testnet (EIP-1559)...")
        try:
            nonce = w3.eth.get_transaction_count(SENDER_ADDRESS)
            latest_block = w3.eth.get_block("latest")
            base_fee = latest_block.get("baseFeePerGas", w3.to_wei(2, "gwei"))

            txn = contract.functions.releaseBounty().build_transaction({
                "chainId": CHAIN_ID,
                "gas": 300000,
                "maxFeePerGas": base_fee * 2 + w3.to_wei(1, "gwei"),
                "maxPriorityFeePerGas": w3.to_wei(1, "gwei"),
                "nonce": nonce,
                "from": SENDER_ADDRESS,
            })

            signed_txn = w3.eth.account.sign_transaction(
                txn, private_key=PRIVATE_KEY
            )
            tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)

            hex_hash = w3.to_hex(tx_hash)
            print(f"4. ⏳ Transaction sent! Hash: {hex_hash}")
            print("Waiting for network confirmation...")

            receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
            print(
                f"5. ✅ [SUCCESS] Bounty released on-chain! Block:"
                f" {receipt.blockNumber}"
            )

            send_to_frontend({
                "terminalLog": f"[{time.strftime('%H:%M:%S')}] ✅ [MINED ON-CHAIN] Tx: {hex_hash} | Block: {receipt.blockNumber} (Bounty released)",
                "shakingProgress": 100,
                "isShaking": False,
                "shakeIntensity": g_mag,
                "status": "COMPLETED",
                "txHash": hex_hash,
                "blockNumber": receipt.blockNumber,
                "message": "Offload anchored on MST Testnet blockchain",
                "isBoardConnected": True,
            })
        except Exception as err:
            print(f"❌ [ERROR] Blockchain transaction failed: {err}")
            send_to_frontend({
                "shakingProgress": 100,
                "isShaking": False,
                "status": "ERROR",
                "message": f"Transaction failed: {err}",
                "isBoardConnected": True,
            })
    print("-------------------------------------------------\n")


# --- MAIN TELEMETRY LISTENER LOOP ---
resting_gravity = 0.0
raw_x = 0.0
raw_y = 0.0
raw_z = 0.0
motion_intensity = 0.0
board_status = "IDLE"
storage_kb = 0
max_storage_kb = 1000
storage_pct = 0.0
last_known_telemetry = "COM12_Initial_Baseline"

# Heartbeat tracking — updated every time a valid serial line is parsed
last_data_time = time.time()      # initialised here so the first iteration is fair
_last_disconnect_notify = 0.0     # rate-limit the disconnected POST to once per 2 s

print(f"[STREAM] Listening for real physical telemetry lines on {PORT}...")

while True:
    try:
        if ser and ser.in_waiting > 0:
            line = ser.readline().decode("utf-8", errors="ignore").strip()
            if line:
                print(line)

                # 1. Parse Resting Gravity
                m1 = re.search(r"Resting Gravity[^:]*:\s*(-?\d+(?:\.\d+)?)", line, re.I)
                if m1:
                    resting_gravity = float(m1.group(1))

                # 2. Parse Directional Accel (X, Y, Z)
                m2 = re.search(
                    r"X \(Lateral\):\s*(-?\d+(?:\.\d+)?)\s*\|\s*Y"
                    r" \(Tilt/Roll\):\s*(-?\d+(?:\.\d+)?)\s*\|\s*Z"
                    r" \(Vertical\):\s*(-?\d+(?:\.\d+)?)",
                    line,
                    re.I,
                )
                if m2:
                    raw_x = float(m2.group(1))
                    raw_y = float(m2.group(2))
                    raw_z = float(m2.group(3))

                # 3. Parse Motion Magnitude
                m3 = re.search(r"Motion Intensity[^:]*:\s*(-?\d+(?:\.\d+)?)", line, re.I)
                if m3:
                    motion_intensity = float(m3.group(1))
                    last_known_telemetry = (
                        f"Resting:{resting_gravity}_X:{raw_x}_Y:{raw_y}_Z:{raw_z}_Mag:{motion_intensity}"
                    )

                # 4. Parse Status & Storage Usage
                m4 = re.search(
                    r"STATUS:\s*([A-Za-z_]+)\s*\|\s*Storage:\s*(\d+)\s*KB\s*/\s*(\d+)\s*KB\s*\(([0-9.]+)%\)",
                    line,
                    re.I,
                )
                if m4:
                    board_status = m4.group(1).upper()
                    storage_kb = int(m4.group(2))
                    max_storage_kb = int(m4.group(3))
                    storage_pct = float(m4.group(4))

                # Dispatch JSON packet to frontend on line match
                if m2 or m3 or m4:
                    # Valid packet received — reset heartbeat clock
                    last_data_time = time.time()

                    if abs(raw_z) > 100 or abs(raw_x) > 100 or abs(raw_y) > 100:
                        gx = round(raw_x / 16384.0, 3)
                        gy = round(raw_y / 16384.0, 3)
                        gz = round(raw_z / 16384.0, 3)
                    else:
                        gx = round(raw_x, 3)
                        gy = round(raw_y, 3)
                        gz = round(raw_z, 3)

                    g_intensity = (
                        round(motion_intensity / 16384.0, 2)
                        if motion_intensity > 100
                        else round(motion_intensity, 2)
                    )
                    is_shaking = (
                        motion_intensity > 20000 or board_status == "SHAKING"
                    )

                    telemetry_payload = {
                        "shakingProgress": int(storage_pct),
                        "isShaking": is_shaking,
                        "shakeIntensity": g_intensity,
                        "status": board_status,
                        "terminalLog": f"[{time.strftime('%H:%M:%S')}] {line}",
                        "message": (
                            f"{board_status} | Storage: {storage_kb} KB /"
                            f" {max_storage_kb} KB ({int(storage_pct)}%) | Mag:"
                            f" {int(motion_intensity)}"
                        ),
                        "restingGravity": resting_gravity,
                        "rawX": raw_x,
                        "rawY": raw_y,
                        "rawZ": raw_z,
                        "accelX": gx,
                        "accelY": gy,
                        "accelZ": gz,
                        "motionIntensity": motion_intensity,
                        "storageKb": storage_kb,
                        "maxStorageKb": max_storage_kb,
                        "isBoardConnected": True,
                    }
                    send_to_frontend(telemetry_payload)

                # Check for 100% full trigger signal
                if (
                    "TRIGGER_OFFLOAD" in line
                    or storage_kb >= max_storage_kb
                    or storage_pct >= 100
                ):
                    execute_blockchain_offload(
                        last_known_telemetry,
                        motion_intensity if motion_intensity > 0 else 50000.0,
                    )
                    print(
                        "🔄 Sending reset command ('r') to Neurick hardware"
                        " board..."
                    )
                    ser.write(b"r\n")
                    storage_kb = 0
                    storage_pct = 0.0
                    time.sleep(1)
        else:
            # ---- HEARTBEAT CHECK -------------------------------------------
            # If the port is open but we have seen no valid data for more than
            # _HEARTBEAT_TIMEOUT seconds, the board is likely unplugged or has
            # crashed. Push isBoardConnected=False so the UI updates instantly.
            _silence = time.time() - last_data_time
            if _silence > _HEARTBEAT_TIMEOUT:
                _now = time.time()
                if _now - _last_disconnect_notify >= _HEARTBEAT_TIMEOUT:
                    _last_disconnect_notify = _now
                    print(
                        f"⚠️  [HEARTBEAT] No data from {PORT} for "
                        f"{_silence:.1f}s — flagging board as DISCONNECTED."
                    )
                    send_to_frontend({
                        "isBoardConnected": False,
                        "status": "DISCONNECTED",
                        "terminalLog": f"[{time.strftime('%H:%M:%S')}] ⚠️ [HEARTBEAT SILENCE] No serial packets from {PORT} for {_silence:.1f}s.",
                        "message": (
                            f"No data received from {PORT} for "
                            f"{_silence:.0f}s. Check USB connection."
                        ),
                    })
            time.sleep(0.02)
    except KeyboardInterrupt:
        print("\n[STOP] Shutting down COM12 bridge...")
        if ser:
            ser.close()
        break
    except Exception as err:
        print(f"⚠️ [SERIAL WARNING] Reading exception on {PORT}: {err}")
        
        # Force frontend to flip to disconnected instantly on error
        send_to_frontend({
            "isBoardConnected": False,
            "status": "DISCONNECTED",
            "terminalLog": f"[{time.strftime('%H:%M:%S')}] 🚨 [SERIAL ERROR] {err}",
            "message": f"Serial error: {err}"
        })
        
        time.sleep(0.5)