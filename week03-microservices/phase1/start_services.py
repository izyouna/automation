#!/usr/bin/env python3
"""
Phase 1 Service Startup Script

This script starts all Phase 1 services in the correct order and checks their health.
"""

import subprocess
import time
import sys
import signal
import os
from pathlib import Path
import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Define service URLs from environment
GATEWAY_URL = os.getenv("GATEWAY_URL", "http://localhost:8080")
UPLOAD_URL = os.getenv("UPLOAD_SERVICE_URL", "http://localhost:8001")
PROCESSING_URL = os.getenv("PROCESSING_SERVICE_URL", "http://localhost:8002")
AI_URL = os.getenv("AI_SERVICE_URL", "http://localhost:8003")

def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully"""
    print("\n🛑 Shutting down services...")
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

class ServiceManager:
    def __init__(self):
        self.processes = []
        self.services = [
            {
                "name": "Upload Service",
                "port": int(os.getenv("UPLOAD_PORT", 8001)),
                "module": "services.upload.app.main:app",
                "health_url": f"http://localhost:{os.getenv('UPLOAD_PORT', 8001)}/health",
                "process": None
            },
            {
                "name": "Processing Service", 
                "port": int(os.getenv("PROCESSING_PORT", 8002)),
                "module": "services.processing.app.main:app",
                "health_url": f"http://localhost:{os.getenv('PROCESSING_PORT', 8002)}/health",
                "process": None
            },
            {
                "name": "AI Service",
                "port": int(os.getenv("AI_PORT", 8003)),
                "module": "services.ai.app.main:app", 
                "health_url": f"http://localhost:{os.getenv('AI_PORT', 8003)}/health",
                "process": None
            },
            {
                "name": "Gateway Service",
                "port": int(os.getenv("GATEWAY_PORT", 8090)),
                "module": "services.gateway.app.main:app",
                "health_url": f"http://localhost:{os.getenv('GATEWAY_PORT', 8090)}/health",
                "process": None
            }
        ]
    
    def check_service_health(self, service):
        """Check if a service is healthy"""
        try:
            response = requests.get(service["health_url"], timeout=5)
            if response.status_code == 200:
                data = response.json()
                return data.get("status") == "healthy"
        except:
            pass
        return False
    
    def start_service(self, service):
        """Start a single service"""
        print(f"🚀 Starting {service['name']} on port {service['port']}...")
        
        cmd = [
            sys.executable, "-m", "uvicorn",
            service["module"],
            "--port", str(service["port"]),
            "--host", "0.0.0.0"
        ]
        
        try:
            process = subprocess.Popen(
                cmd,
                cwd=Path.cwd(),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            service["process"] = process
            return True
        except Exception as e:
            print(f"❌ Failed to start {service['name']}: {e}")
            return False
    
    def wait_for_service(self, service, max_attempts=30, delay=1):
        """Wait for service to become healthy"""
        print(f"⏳ Waiting for {service['name']} to become ready...")
        
        for attempt in range(max_attempts):
            if self.check_service_health(service):
                print(f"✅ {service['name']} is ready!")
                return True
            
            # Check if process is still running
            if service["process"] and service["process"].poll() is not None:
                print(f"❌ {service['name']} process died")
                return False
            
            time.sleep(delay)
        
        print(f"❌ {service['name']} failed to become ready after {max_attempts} attempts")
        return False
    
    def start_all_services(self):
        """Start all services in order"""
        print("🎯 Starting Phase 1 Microservices...")
        print("=" * 50)
        
        # Change to phase1 directory
        phase1_dir = Path(__file__).parent
        os.chdir(phase1_dir)
        
        # Start services sequentially
        for service in self.services:
            if not self.start_service(service):
                return False
            
            # Wait a bit between services
            time.sleep(2)
            
            if not self.wait_for_service(service):
                return False
        
        print("\n🎉 All services are running!")
        return True
    
    def check_system_health(self):
        """Check overall system health"""
        print("\n🔍 Checking system health...")
        
        try:
            response = requests.get(f"{GATEWAY_URL}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                print(f"System status: {data['status']}")
                
                for service_name, service_info in data["services"].items():
                    status = service_info["status"]
                    if status == "healthy":
                        print(f"  ✅ {service_name}: {status}")
                    else:
                        print(f"  ⚠️  {service_name}: {status}")
                
                return data["status"] == "healthy"
            else:
                print(f"❌ Health check failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Health check failed: {e}")
            return False
    
    def create_test_file(self):
        """Create a test file for testing"""
        test_dir = Path("test_data")
        test_dir.mkdir(exist_ok=True)
        
        test_file = test_dir / "sample.jpg"
        test_file.write_text("This is a test JPEG file for Phase 1 testing")
        print(f"📝 Created test file: {test_file}")
        return test_file
    
    def run_quick_test(self):
        """Run a quick integration test"""
        print("\n🧪 Running quick integration test...")
        
        try:
            # Create test file
            test_file = self.create_test_file()
            
            # Test upload through gateway
            with open(test_file, 'rb') as f:
                files = {'file': ('sample.jpg', f, 'image/jpeg')}
                data = {'processing_options': json.dumps({
                    'enable_processing': True,
                    'processing_operation': 'thumbnail',
                    'enable_ai_analysis': True,
                    'ai_analysis_type': 'vision'
                })}
                
                response = requests.post(f"{GATEWAY_URL}/process-file", files=files, data=data, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Quick test passed!")
                print(f"   Workflow ID: {result['workflow_id']}")
                print(f"   File ID: {result['file_id']}")
                print(f"   Total time: {result['total_time']:.2f}s")
                return True
            else:
                print(f"❌ Quick test failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Quick test failed: {e}")
            return False
    
    def cleanup(self):
        """Clean up processes"""
        print("\n🧹 Cleaning up...")
        for service in self.services:
            if service["process"]:
                try:
                    service["process"].terminate()
                    service["process"].wait(timeout=5)
                    print(f"✅ Stopped {service['name']}")
                except:
                    try:
                        service["process"].kill()
                    except:
                        pass
    
    def print_status(self):
        """Print current status"""
        print("\n📊 Service Status:")
        print("-" * 40)
        for service in self.services:
            status = "🟢 Running" if self.check_service_health(service) else "🔴 Stopped"
            print(f"{service['name']:<20} {status}")
    
    def run_interactive(self):
        """Run interactive mode"""
        if not self.start_all_services():
            print("❌ Failed to start all services")
            self.cleanup()
            return
        
        # Check system health
        if not self.check_system_health():
            print("⚠️  System health check failed")
        
        # Run quick test
        self.run_quick_test()
        
        print("\n🎯 Phase 1 Microservices are ready!")
        print("\nAvailable endpoints:")
        print(f"  Gateway:    {GATEWAY_URL}")
        print(f"  Upload:     {UPLOAD_URL}")
        print(f"  Processing: {PROCESSING_URL}")
        print(f"  AI:         {AI_URL}")
        print("\nTest commands:")
        print(f"  curl -X POST -F 'file=@test_data/sample.jpg' {GATEWAY_URL}/process-file")
        print(f"  pytest tests/test_phase1_compliance.py -v")
        
        print("\n🔄 Press Ctrl+C to stop all services...")
        
        try:
            while True:
                time.sleep(5)
                self.print_status()
        except KeyboardInterrupt:
            pass
        finally:
            self.cleanup()

def main():
    """Main function"""
    manager = ServiceManager()
    
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        # Quick test mode
        manager.run_quick_test()
    else:
        # Full interactive mode
        manager.run_interactive()

if __name__ == "__main__":
    main()