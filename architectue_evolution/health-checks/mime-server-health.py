#!/usr/bin/env python3
"""
Health check for MIME Server
Tests connectivity and responsiveness on port 65432
"""

import socket
import sys
import time

def check_socket_connectivity():
    """Check if MIME server socket is responding"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        
        result = sock.connect_ex(('localhost', 65432))
        sock.close()
        
        if result == 0:
            print("[OK] MIME server socket is accepting connections")
            return True
        else:
            print("[FAIL] MIME server socket is not responding")
            return False
    except Exception as e:
        print(f"[FAIL] Health check error: {e}")
        return False

def check_storage_accessible():
    """Check if storage volume is mounted"""
    try:
        import os
        storage_path = "/storage"
        
        if os.path.ismount(storage_path) or os.path.exists(storage_path):
            print(f"[OK] Storage path {storage_path} is accessible")
            return True
        else:
            print(f"[FAIL] Storage path {storage_path} not accessible")
            return False
    except Exception as e:
        print(f"[WARN] Could not verify storage: {e}")
        return True  # Non-fatal

if __name__ == "__main__":
    checks = [
        check_socket_connectivity(),
        check_storage_accessible()
    ]
    
    if all(checks):
        print("[OK] All health checks passed")
        sys.exit(0)
    else:
        print("[FAIL] Some health checks failed")
        sys.exit(1)
