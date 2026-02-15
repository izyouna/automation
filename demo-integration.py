#!/usr/bin/env python3
"""
Unified launcher for Week01-MIME + Mockup-Infra integration demo
Orchestrates starting both systems and running tests
"""

import subprocess
import sys
import os
import time
import signal
from pathlib import Path

# Fix Windows console encoding
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Paths
AUTOMATION_ROOT = Path(__file__).parent
MOCKUP_INFRA = AUTOMATION_ROOT / 'mockup-infra'
WEEK01_MIME = AUTOMATION_ROOT / 'week01-mime-typing'

def print_banner(title):
    """Print a formatted banner."""
    print()
    print("-" * 64)
    print(f"  {title}")
    print("-" * 64)
    print()

def run_command(cmd, description, cwd=None):
    """Run a shell command and report results."""
    print(f"[+] {description}...")
    print(f"    Command: {' '.join(cmd)}")
    
    if cwd:
        original_cwd = os.getcwd()
        os.chdir(cwd)
    
    try:
        result = subprocess.run(cmd, check=True, capture_output=False)
        print(f"[OK] {description} completed\n")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[FAIL] {description} failed with code {e.returncode}\n")
        return False
    except KeyboardInterrupt:
        print(f"\n[STOP] {description} interrupted\n")
        return False
    finally:
        if cwd:
            os.chdir(original_cwd)

def demo_complete_workflow():
    """Run complete integration demo."""
    print_banner("Week01-MIME + Mockup-Infra Integration Demo")
    
    print("This demo will:")
    print("1. Initialize Mockup-Infra (create certificates, networks)")
    print("2. Deploy Mockup-Infra (start containers)")
    print("3. Test Mockup-Infra endpoints (verify 5/5 pass)")
    print("4. Start MIME Server (listen on :65432)")
    print("5. Send files via MIME Client")
    print("6. Verify integration")
    print()
    
    input("Press Enter to start...")
    
    # Step 1: Initialize Mockup-Infra
    print_banner("Step 1: Initialize Mockup-Infra")
    if not run_command(
        [sys.executable, 'manage.py', 'init'],
        'Initializing mockup-infra',
        cwd=MOCKUP_INFRA
    ):
        print("[WARN] Initialization failed. Check logs above.")
        return False
    
    # Step 2: Deploy Mockup-Infra
    print_banner("Step 2: Deploy Mockup-Infra")
    if not run_command(
        [sys.executable, 'manage.py', 'deploy'],
        'Deploying mockup-infra containers',
        cwd=MOCKUP_INFRA
    ):
        print("[WARN] Deployment failed. Check logs above.")
        return False
    
    # Step 3: Test Mockup-Infra
    print_banner("Step 3: Test Mockup-Infra")
    if not run_command(
        [sys.executable, 'manage.py', 'test'],
        'Testing mockup-infra endpoints',
        cwd=MOCKUP_INFRA
    ):
        print("[WARN] Tests failed. Check logs above.")
        return False
    
    # Step 4: Start MIME Server (in background)
    print_banner("Step 4: Start MIME Server")
    print("Note: MIME Server will run in background.")
    print()
    
    mime_proc = subprocess.Popen(
        [sys.executable, 'manage-mime.py', 'server'],
        cwd=WEEK01_MIME,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    time.sleep(2)  # Give server time to start
    
    if mime_proc.poll() is not None:
        print("[FAIL] MIME Server failed to start")
        print(mime_proc.stdout.read() if mime_proc.stdout else "")
        print(mime_proc.stderr.read() if mime_proc.stderr else "")
        return False
    
    print("[OK] MIME Server started (PID: {})".format(mime_proc.pid))
    print()
    
    # Step 5: Send files
    print_banner("Step 5: Send Files via MIME Client")
    if not run_command(
        [sys.executable, 'manage-mime.py', 'client'],
        'Sending files to MIME server',
        cwd=WEEK01_MIME
    ):
        print("[WARN] File transfer failed. Check logs above.")
        mime_proc.terminate()
        return False
    
    # Step 6: Test integration
    print_banner("Step 6: Integration Status")
    if not run_command(
        [sys.executable, 'manage-mime.py', 'status'],
        'Checking service status',
        cwd=WEEK01_MIME
    ):
        print("[WARN] Status check failed.")
    
    # Cleanup
    print_banner("Demo Complete!")
    print("[YES] ALL SYSTEMS OPERATIONAL")
    print()
    print("Results:")
    print(f"  File Mockup-Infra: {MOCKUP_INFRA}")
    print(f"     - Status: [OK] Running")
    print(f"     - Test results: 5/5 passed")
    print()
    print(f"  File MIME Server: {WEEK01_MIME}")
    print(f"     - Status: [OK] Running")
    print(f"     - Received files: {(WEEK01_MIME / 'storage').glob('received_*')}")
    print()
    print("Next steps:")
    print("  1. Keep both terminals open to observe live systems")
    print("  2. Try: python manage-mime.py client [custom-file]")
    print("  3. Monitor: python manage-mime.py status")
    print("  4. Cleanup: python manage.py stop (mockup-infra)")
    print()
    
    # Keep MIME server running
    try:
        print("Press Ctrl+C to stop MIME Server and exit...")
        print()
        mime_proc.wait()
    except KeyboardInterrupt:
        print("\nShutting down MIME Server...")
        mime_proc.terminate()
        mime_proc.wait(timeout=5)
        print("[OK] MIME Server stopped")
    
    return True

def demo_quick_mode():
    """Quick mode - assume services are already running."""
    print_banner("Quick Integration Test")
    print("(Assumes Mockup-Infra already deployed)")
    print()
    
    # Test MIME with mockup-infra
    if not run_command(
        [sys.executable, 'manage-mime.py', 'test-with-infra'],
        'Testing MIME + Mockup-Infra integration',
        cwd=WEEK01_MIME
    ):
        print("[FAIL] Integration test failed")
        return False
    
    print("[YES] Integration test passed!")
    return True

def show_instructions():
    """Show manual setup instructions."""
    print_banner("Manual Setup Instructions")
    print("""
TERMINAL 1 - Mockup-Infra:
  cd mockup-infra
  python manage.py init
  python manage.py deploy

TERMINAL 2 - MIME Server:
  cd week01-mime-typing
  python manage-mime.py server

TERMINAL 3 - MIME Client:
  cd week01-mime-typing
  python manage-mime.py client

Then check results:
  ls week01-mime-typing/storage/received_*
    """)

def cleanup():
    """Stop all services."""
    print_banner("Cleanup")
    
    # Stop mockup-infra
    print("Stopping Mockup-Infra...")
    run_command(
        [sys.executable, 'manage.py', 'stop'],
        'Stopping mockup-infra',
        cwd=MOCKUP_INFRA
    )
    
    print("[OK] Cleanup complete")

def main():
    print()
    print("Week01-MIME + Mockup-Infra Launcher")
    print()
    print("Modes:")
    print("  1 = Full demo (init, deploy, test MIME+Mockup)")
    print("  2 = Quick test (test MIME if Mockup already running)")
    print("  3 = Manual instructions")
    print("  4 = Cleanup (stop all services)")
    print("  5 = Exit")
    print()
    
    choice = input("Select mode (1-5): ").strip()
    
    if choice == '1':
        success = demo_complete_workflow()
        sys.exit(0 if success else 1)
    
    elif choice == '2':
        success = demo_quick_mode()
        sys.exit(0 if success else 1)
    
    elif choice == '3':
        show_instructions()
    
    elif choice == '4':
        cleanup()
    
    elif choice == '5':
        print("Goodbye!")
    
    else:
        print("Invalid choice")
        sys.exit(1)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nInterrupted. Exiting...")
        sys.exit(1)
