#!/usr/bin/env python3
"""
Replay recorded traffic patterns for load testing
Useful for validating SLA compliance
"""

import socket
import time
import random
import sys
from pathlib import Path

class TrafficReplayer:
    def __init__(self, host='mime-server', port=65432):
        self.host = host
        self.port = port
        self.session_id = random.randint(1000, 9999)
    
    def generate_test_file(self, size_kb=10):
        """Generate random test file data"""
        return b'X' * (size_kb * 1024)
    
    def send_file(self, file_data, retry_count=3):
        """Send file with retry logic"""
        for attempt in range(retry_count):
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(10)
                sock.connect((self.host, self.port))
                sock.sendall(file_data)
                sock.close()
                return True
            except Exception as e:
                print(f"  Attempt {attempt + 1}/{retry_count} failed: {e}")
                time.sleep(1)
        return False
    
    def replay_normal_load(self, duration_seconds=60, files_per_second=1):
        """Replay normal traffic pattern"""
        print(f"Replaying normal load: {files_per_second} files/sec for {duration_seconds}s")
        start_time = time.time()
        success_count = 0
        failure_count = 0
        
        while time.time() - start_time < duration_seconds:
            file_data = self.generate_test_file(random.randint(1, 100))
            if self.send_file(file_data):
                success_count += 1
            else:
                failure_count += 1
            
            time.sleep(1.0 / files_per_second)
        
        return success_count, failure_count
    
    def replay_spike_load(self, spike_duration=10, files_per_second=10):
        """Replay spike traffic pattern"""
        print(f"Replaying spike load: {files_per_second} files/sec for {spike_duration}s")
        start_time = time.time()
        success_count = 0
        failure_count = 0
        
        while time.time() - start_time < spike_duration:
            file_data = self.generate_test_file(random.randint(1, 500))
            if self.send_file(file_data):
                success_count += 1
            else:
                failure_count += 1
            
            time.sleep(1.0 / files_per_second)
        
        return success_count, failure_count

if __name__ == '__main__':
    replayer = TrafficReplayer()
    
    print("=== Load Test: Normal Traffic ===")
    success, failures = replayer.replay_normal_load(duration_seconds=30, files_per_second=2)
    print(f"Results: {success} success, {failures} failures")
    
    print("\n=== Load Test: Spike Traffic ===")
    success, failures = replayer.replay_spike_load(spike_duration=10, files_per_second=5)
    print(f"Results: {success} success, {failures} failures")
