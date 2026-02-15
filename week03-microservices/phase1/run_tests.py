import subprocess
import time
import sys
import os
from pathlib import Path
import signal

# Configuration
SERVICES = [
    {"name": "Upload", "port": 8001, "app": "services.upload.app.main:app"},
    {"name": "Processing", "port": 8002, "app": "services.processing.app.main:app"},
    {"name": "AI", "port": 8003, "app": "services.ai.app.main:app"},
    {"name": "Gateway", "port": 8090, "app": "services.gateway.app.main:app"},
]

PROCESSES = []

def start_services():
    print("[INFO] Starting services...")
    # Get python executable from current environment (venv)
    python_exe = sys.executable
    
    for service in SERVICES:
        print(f"  Starting {service['name']} on port {service['port']}...")
        cmd = [
            python_exe, "-m", "uvicorn",
            service["app"],
            "--port", str(service["port"]),
            "--host", "0.0.0.0"
        ]
        
        # Start process
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        PROCESSES.append(proc)
        
    print("[INFO] Waiting 3s for services to initialize...", flush=True)
    for i in range(3):
        print(f"Tick {i}", flush=True)
        time.sleep(1)
    print("[INFO] Sleep finished", flush=True)

def stop_services():
    print("\n[INFO] Stopping services...")
    for proc in PROCESSES:
        try:
            proc.terminate()
        except:
            pass
            
    # Wait for termination
    try:
        for proc in PROCESSES:
            proc.wait(timeout=2)
    except:
        for proc in PROCESSES:
            proc.kill()
    print("[INFO] Services stopped")

def run_tests():
    print("\n[INFO] Running compliance tests...", flush=True)
    python_exe = sys.executable
    print(f"[INFO] Using python: {python_exe}", flush=True)
    
    # Run pytest with -v to see detailed output
    result = subprocess.run(
        [python_exe, "-m", "pytest", "tests/", "-v"],
        cwd=os.getcwd()
    )
    return result.returncode

def main():
    try:
        start_services()
        return_code = run_tests()
        sys.exit(return_code)
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        sys.exit(1)
    finally:
        stop_services()

if __name__ == "__main__":
    main()
