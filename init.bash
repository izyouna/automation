#!/bin/bash

# Create complete mockup-infra directory structure with dual-network isolation
echo "Creating mockup-infra dual-network infrastructure..."
mkdir -p mockup-infra/{certs,gateway,services/public_app,services/intranet_api}

# Change to mockup-infra directory
cd mockup-infra || exit 1

# Create .env file with dual-network configuration
cat > .env << 'EOF'
# Host Configuration
HOST_PORT=8080
STAGE=mockup
API_VERSION=v1

# Network Configuration - Dual Network Isolation
PUBLIC_NET_SUBNET=172.18.0.0/16
PRIVATE_NET_SUBNET=172.19.0.0/16

# Service Ports
PUBLIC_APP_PORT=80
INTRANET_API_PORT=5000
GATEWAY_PORT=443

# TLS Configuration
TLS_ENABLED=true
CERT_COUNTRY=US
CERT_STATE=California
CERT_LOCATION=San Francisco
CERT_ORG="Mockup Infra"
CERT_CN=api.mockup.test
EOF

# Create requirements.txt with Flask and dependencies
cat > requirements.txt << 'EOF'
podman-compose>=1.0.3
cryptography>=41.0.0
python-dotenv>=1.0.0
flask>=2.3.0
requests>=2.31.0
EOF

# Create docker-compose.yml with dual-network isolation
cat > docker-compose.yml << 'EOF'
version: '3.8'

networks:
  public_net:
    driver: bridge
    ipam:
      config:
        - subnet: ${PUBLIC_NET_SUBNET:-172.18.0.0/16}
  
  private_net:
    driver: bridge
    internal: true  # Strict isolation - no external access
    ipam:
      config:
        - subnet: ${PRIVATE_NET_SUBNET:-172.19.0.0/16}

services:
  # Reverse Proxy / API Gateway - The Bridge between networks
  nginx-gateway:
    image: nginx:alpine
    container_name: mockup-gateway
    ports:
      - "${HOST_PORT}:80"
      - "${GATEWAY_PORT}:443"
    networks:
      public_net:
      private_net:
    volumes:
      - ./gateway/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    env_file: .env
    depends_on:
      - public_app
      - intranet_api

  # Public Internet Server - DMZ/Internet facing
  public_app:
    build:
      context: ./services/public_app
      dockerfile: Dockerfile
    container_name: mockup-public-web
    networks:
      - public_net
    expose:
      - "80"
    environment:
      - SERVICE_NAME=public_app
      - SERVICE_PORT=80
      - STAGE=${STAGE}
    volumes:
      - ./services/public_app:/app

  # Intranet API Server - Private/Isolated network
  intranet_api:
    build:
      context: ./services/intranet_api
      dockerfile: Dockerfile
    container_name: mockup-intranet-api
    networks:
      - private_net
    expose:
      - "5000"
    environment:
      - SERVICE_NAME=intranet_api
      - SERVICE_PORT=5000
      - STAGE=${STAGE}
    volumes:
      - ./services/intranet_api:/app
EOF

# Create manage.py with full infrastructure automation
cat > manage.py << 'EOF'
#!/usr/bin/env python3
"""
Mockup Infrastructure Manager
Bare Metal → L3 → L4 → L5/6 → L7 Full Stack Automation
"""

import os
import sys
import subprocess
import argparse
import json
import ipaddress
from pathlib import Path
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Cryptography imports for TLS certificate generation
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa

class NetworkLayers:
    """Implementation of OSI Layers 3-7"""
    
    L3_NETWORK = "IP/Podman Bridge"
    L4_TRANSPORT = "TCP"
    L5_SESSION = "TLS 1.3"
    L7_APPLICATION = "HTTP/HTTPS"

class InfraManager:
    def __init__(self):
        self.base_dir = Path(__file__).parent.absolute()
        self.env_file = self.base_dir / '.env'
        load_dotenv(self.env_file)
        
    def run_command(self, cmd, capture=False):
        """Run shell command and stream output"""
        print(f"🔧 Executing: {cmd}")
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE if capture else subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            shell=True
        )
        
        output = []
        for line in process.stdout:
            print(line, end='')
            output.append(line)
            
        process.wait()
        return process.returncode, ''.join(output)
    
    def generate_tls_certificates(self):
        """Generate self-signed TLS certificates for Session Layer (L5/6)"""
        print("\n🔐 [Layer 5/6 - Session] Generating TLS Certificates...")
        
        # Create certs directory
        cert_dir = self.base_dir / 'certs'
        cert_dir.mkdir(exist_ok=True)
        
        # Generate private key (RSA 2048)
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )
        
        # Certificate metadata from .env
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, os.getenv('CERT_COUNTRY', 'US')),
            x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, os.getenv('CERT_STATE', 'California')),
            x509.NameAttribute(NameOID.LOCALITY_NAME, os.getenv('CERT_LOCATION', 'San Francisco')),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, os.getenv('CERT_ORG', 'Mockup Infra')),
            x509.NameAttribute(NameOID.COMMON_NAME, os.getenv('CERT_CN', 'api.mockup.test')),
        ])
        
        # Subject Alternative Names for multiple domains
        san_list = [
            x509.DNSName(u"localhost"),
            x509.DNSName(u"api.mockup.test"),
            x509.DNSName(u"gateway.mockup.test"),
            x509.IPAddress(u"127.0.0.1"),
        ]
        
        # Build certificate
        cert = (
            x509.CertificateBuilder()
            .subject_name(subject)
            .issuer_name(issuer)
            .public_key(private_key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(datetime.utcnow())
            .not_valid_after(datetime.utcnow() + timedelta(days=365))
            .add_extension(x509.SubjectAlternativeName(san_list), critical=False)
            .sign(private_key, hashes.SHA256())
        )
        
        # Write private key
        key_path = cert_dir / 'server.key'
        with open(key_path, 'wb') as f:
            f.write(private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.TraditionalOpenSSL,
                encryption_algorithm=serialization.NoEncryption(),
            ))
        
        # Write certificate
        cert_path = cert_dir / 'server.crt'
        with open(cert_path, 'wb') as f:
            f.write(cert.public_bytes(serialization.Encoding.PEM))
        
        print(f"✅ Certificates generated:")
        print(f"   - Key: {key_path}")
        print(f"   - Cert: {cert_path}")
        print(f"   - CN: {os.getenv('CERT_CN', 'api.mockup.test')}")
        
        return 0
    
    def verify_network_isolation(self):
        """Test L3 network isolation"""
        print("\n🌐 [Layer 3 - Network] Testing Isolation...")
        
        # Check if private network is truly isolated
        result, output = self.run_command(
            "podman network inspect private_net | grep -i 'internal.*true'",
            capture=True
        )
        
        if "true" in output.lower():
            print("✅ Private network is isolated (internal: true)")
        else:
            print("⚠️  Private network may not be isolated")
        
        return 0
    
    def deploy_stack(self):
        """Deploy full infrastructure stack"""
        print("\n🚀 Deploying Mockup Infrastructure Stack")
        print("   Bare Metal → L3 → L4 → L5/6 → L7")
        print("=" * 50)
        
        # Generate certificates if they don't exist
        cert_file = self.base_dir / 'certs' / 'server.crt'
        if not cert_file.exists():
            self.generate_tls_certificates()
        
        # Deploy with podman-compose
        os.chdir(self.base_dir)
        return self.run_command("podman-compose up -d")[0]
    
    def stop_stack(self):
        """Stop all services"""
        print("\n🛑 Stopping Mockup Infrastructure...")
        os.chdir(self.base_dir)
        return self.run_command("podman-compose down")[0]
    
    def restart_stack(self):
        """Restart all services"""
        self.stop_stack()
        return self.deploy_stack()
    
    def status(self):
        """Show service status"""
        print("\n📊 Service Status:")
        print("=" * 50)
        os.chdir(self.base_dir)
        return self.run_command("podman-compose ps")[0]
    
    def logs(self, service=None):
        """Show service logs"""
        os.chdir(self.base_dir)
        cmd = "podman-compose logs"
        if service:
            cmd += f" {service}"
        return self.run_command(cmd)[0]
    
    def test_endpoints(self):
        """Test all endpoints through the gateway - Windows compatible"""
        print("\n🧪 Testing Layer 7 Endpoints:")
        print("=" * 50)
        
        # Wait for services to be ready
        import time
        time.sleep(5)
        
        tests = [
            ("Public Web (L7 HTML)", "http://localhost:8080/"),
            ("Intranet API Status (L7 JSON)", "https://localhost:443/status", "-k"),
            ("Intranet API Data (L7 JSON)", "https://localhost:443/data", "-k -X POST -H \"Content-Type: application/json\" -d \"{\\\"test\\\":\\\"data\\\"}\""),
            ("Intranet API Config (L7 JSON)", "https://localhost:443/config", "-k"),
            ("Health Check", "http://localhost:8080/health"),
        ]
        
        success_count = 0
        for name, url, *args in tests:
            cmd = f"curl -s -w '\\n%{{http_code}}' {' '.join(args)} {url}"
            print(f"\n📡 Testing: {name}")
            print(f"   URL: {url}")
            
            try:
                # Use explicit encoding to handle Windows charset issues
                result = subprocess.run(cmd, shell=True, capture_output=True, timeout=10)
                
                # Try multiple encodings to handle Windows output
                output = None
                for encoding in ['utf-8', 'cp1252', 'latin-1']:
                    try:
                        output = result.stdout.decode(encoding, errors='ignore')
                        break
                    except:
                        continue
                
                if output is None:
                    output = result.stdout.decode('utf-8', errors='replace')
                
                # Parse response and status code
                lines = output.strip().split('\n')
                if len(lines) >= 2:
                    status_code = lines[-1].strip().strip("'\"")
                    response = '\n'.join(lines[:-1])
                else:
                    status_code = "000"
                    response = output
                
                print(f"   Status Code: {status_code}")
                
                # Check for success (200-299 range)
                try:
                    status_int = int(status_code)
                    is_success = 200 <= status_int < 300
                except:
                    is_success = False
                
                if is_success:
                    print(f"   ✅ Success")
                    
                    # Try to parse and display response
                    if response:
                        try:
                            json_data = json.loads(response)
                            print(f"   Response: {json.dumps(json_data, indent=6)}")
                        except (json.JSONDecodeError, UnicodeDecodeError):
                            preview = response[:150].replace('\n', ' ')
                            print(f"   Response: {preview}...")
                    
                    success_count += 1
                else:
                    print(f"   ❌ Failed (HTTP {status_code})")
                    if response:
                        preview = response[:150].replace('\n', ' ')
                        print(f"   Response: {preview}...")
                        
            except subprocess.TimeoutExpired:
                print("   ⚠️  Timeout")
            except Exception as e:
                print(f"   ⚠️  Error: {str(e)[:100]}")
        
        print(f"\n📊 Test Results: {success_count}/{len(tests)} passed")
        return 0 if success_count == len(tests) else 1
    
    def inspect_tls(self):
        """Inspect TLS certificate (L5/6 Session Layer)"""
        print("\n🔒 [Layer 5/6 - Session] TLS Certificate Inspection:")
        print("=" * 50)
        return self.run_command("openssl s_client -connect localhost:443 -showcerts </dev/null 2>/dev/null | openssl x509 -noout -text | grep -E 'Subject:|Issuer:|DNS:'")[0]
    
    def init(self):
        """Initialize the complete infrastructure"""
        print("\n🔧 Initializing Mockup Infrastructure...")
        print("=" * 50)
        
        # Create necessary directories
        (self.base_dir / 'certs').mkdir(exist_ok=True)
        
        # Generate certificates
        self.generate_tls_certificates()
        
        # Verify network isolation
        self.verify_network_isolation()
        
        print("\n✅ Infrastructure initialized successfully")
        return 0

def main():
    parser = argparse.ArgumentParser(
        description="Mockup Infrastructure Manager - Full Stack (L3-L7)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
OSI Layer Implementation:
  L3 (Network)    : Podman Bridge Networks (public_net/private_net)
  L4 (Transport)  : TCP/IP via Podman
  L5/6 (Session)  : TLS 1.3 with self-signed certificates
  L7 (Application): HTTP/HTTPS with Nginx + Python services
        """
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Commands")
    
    # Core commands
    subparsers.add_parser("deploy", help="Deploy full stack")
    subparsers.add_parser("stop", help="Stop all services")
    subparsers.add_parser("restart", help="Restart all services")
    subparsers.add_parser("status", help="Show service status")
    subparsers.add_parser("logs", help="Show logs")
    subparsers.add_parser("init", help="Initialize infrastructure")
    
    # Security commands
    subparsers.add_parser("certs", help="Generate TLS certificates")
    subparsers.add_parser("tls", help="Inspect TLS certificate")
    
    # Testing commands
    subparsers.add_parser("test", help="Test all endpoints")
    subparsers.add_parser("isolate", help="Verify network isolation")
    
    args = parser.parse_args()
    
    manager = InfraManager()
    
    commands = {
        "deploy": manager.deploy_stack,
        "stop": manager.stop_stack,
        "restart": manager.restart_stack,
        "status": manager.status,
        "logs": lambda: manager.logs(None),
        "init": manager.init,
        "certs": manager.generate_tls_certificates,
        "tls": manager.inspect_tls,
        "test": manager.test_endpoints,
        "isolate": manager.verify_network_isolation,
    }
    
    if args.command in commands:
        sys.exit(commands[args.command]())
    else:
        parser.print_help()
        sys.exit(1)

if __name__ == "__main__":
    main()
EOF

# Make manage.py executable
chmod +x manage.py

# Create test_infra.py - Windows compatible test script
cat > test_infra.py << 'EOF'
#!/usr/bin/env python3
"""
Test Mockup Infrastructure Endpoints - Windows Compatible
"""

import subprocess
import json
import sys
import time
import re
import codecs

def test_endpoint(name, url, curl_args="", expect_json=False):
    """Test HTTP endpoint with curl - Windows compatible"""
    print(f"\n📡 Testing: {name}")
    print(f"   URL: {url}")
    
    cmd = f"curl -s -w '\\n%{{http_code}}' {curl_args} {url}"
    
    try:
        # Use explicit encoding to handle Windows charset issues
        result = subprocess.run(cmd, shell=True, capture_output=True, timeout=10)
        
        # Try multiple encodings to handle Windows output
        output = None
        for encoding in ['utf-8', 'cp1252', 'latin-1']:
            try:
                output = result.stdout.decode(encoding, errors='ignore')
                break
            except:
                continue
        
        if output is None:
            output = result.stdout.decode('utf-8', errors='replace')
        
        # Parse response and status code
        lines = output.strip().split('\n')
        if len(lines) >= 2:
            status_code = lines[-1].strip().strip("'\"")
            response = '\n'.join(lines[:-1])
        else:
            status_code = "000"
            response = output
        
        print(f"   Status Code: {status_code}")
        
        # Check for success (200-299 range)
        try:
            status_int = int(status_code)
            is_success = 200 <= status_int < 300
        except:
            is_success = False
        
        if is_success:
            print(f"   ✅ Success")
            
            # Try to parse and display response
            if response:
                try:
                    if expect_json:
                        json_data = json.loads(response)
                        print(f"   Response: {json.dumps(json_data, indent=6)}")
                    else:
                        # For HTML, extract title if present
                        title_match = re.search(r'<title>(.*?)</title>', response)
                        if title_match:
                            print(f"   Title: {title_match.group(1)}")
                        else:
                            # Show first 150 chars
                            preview = response[:150].replace('\n', ' ')
                            print(f"   Response preview: {preview}...")
                except (json.JSONDecodeError, UnicodeDecodeError):
                    preview = response[:150].replace('\n', ' ')
                    print(f"   Response: {preview}...")
            
            return True
        else:
            print(f"   ❌ Failed (HTTP {status_code})")
            if response:
                preview = response[:150].replace('\n', ' ')
                print(f"   Response: {preview}...")
            return False
            
    except subprocess.TimeoutExpired:
        print(f"   ⚠️  Timeout (10s)")
        return False
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return False

def main():
    print("=" * 70)
    print("Testing Mockup Infrastructure Endpoints (Windows Compatible)")
    print("=" * 70)
    
    # Wait for services to be ready
    print("\n⏳ Waiting for services to start...")
    time.sleep(5)
    
    tests = [
        ("Public Web (HTML)", "http://localhost:8080/", "", False),
        ("Public Health (JSON)", "http://localhost:8080/health", "", True),
        ("Intranet Status (JSON)", "https://localhost:443/status", "-k", True),
        ("Intranet Data POST (JSON)", "https://localhost:443/data", "-k -X POST -H \"Content-Type: application/json\" -d \"{\\\"test\\\":\\\"data\\\"}\"", True),
        ("Intranet Config (JSON)", "https://localhost:443/config", "-k", True),
    ]
    
    passed = 0
    failed = 0
    
    for name, url, args, expect_json in tests:
        if test_endpoint(name, url, args, expect_json):
            passed += 1
        else:
            failed += 1
    
    print("\n" + "=" * 70)
    print(f"📊 Test Results: {passed} passed, {failed} failed (Total: {len(tests)})")
    print("=" * 70)
    
    return 0 if passed == len(tests) else 1

if __name__ == "__main__":
    sys.exit(main())
EOF

# Make test_infra.py executable
chmod +x test_infra.py

# Create gateway/__init__.py with metadata
cat > gateway/__init__.py << 'EOF'
"""
Gateway Package - L7 Reverse Proxy Configuration
Acts as the bridge between public_net and private_net
"""

import os

# Absolute path for Nginx config
GATEWAY_ROOT = os.path.dirname(os.path.abspath(__file__))
CONF_PATH = os.path.join(GATEWAY_ROOT, "nginx.conf")

# Gateway metadata
PROXY_VERSION = "1.25-alpine"
PROXY_TYPE = "nginx"
ROLE = "L7 Reverse Proxy / API Gateway"

# Network bridging
NETWORKS = ["public_net", "private_net"]
INTERNAL_RESOLUTION = "podman_dns"

def get_gateway_info():
    return {
        "role": ROLE,
        "networks": NETWORKS,
        "config_path": CONF_PATH,
        "version": PROXY_VERSION
    }
EOF

# Create gateway/nginx.conf with dual-network routing
cat > gateway/nginx.conf << 'EOF'
# Layer 4: Transport (TCP)
events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

# Layer 7: Application (HTTP/HTTPS)
http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    # Logging format
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;
    
    # Layer 5/6: Session (TLS Configuration)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Upstream definitions - Service discovery via Podman DNS
    upstream public_backend {
        server public_app:80;
    }
    
    upstream intranet_backend {
        server intranet_api:5000;
    }
    
    # L7: HTTP redirect to HTTPS
    server {
        listen 80;
        server_name localhost api.mockup.test;
        
        # Redirect all HTTP to HTTPS
        location / {
            return 301 https://$host$request_uri;
        }
    }
    
    # L7: HTTPS Server with TLS
    server {
        listen 443 ssl http2;
        server_name api.mockup.test localhost;
        
        # L5/6: TLS Certificates
        ssl_certificate     /etc/nginx/certs/server.crt;
        ssl_certificate_key /etc/nginx/certs/server.key;
        
        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        
        # L3: Public Network Route (Internet-facing)
        location /public/ {
            proxy_pass http://public_backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # L4: TCP optimizations
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
        
        # L3: Private Network Route (Intranet API)
        location /status {
            proxy_pass http://intranet_backend/status;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        location /data {
            proxy_pass http://intranet_backend/data;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Health check endpoint
        location /health {
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
        
        # Default route
        location / {
            return 404 "Endpoint not found\n";
        }
    }
}
EOF

# Create services/__init__.py with service discovery
cat > services/__init__.py << 'EOF'
"""
Services Package - L7 Application Mockups
Tracks services across public_net and private_net
"""

import os
import socket
from pathlib import Path

# Service registry metadata
AVAILABLE_SERVICES = {
    "public": ["public_app"],
    "private": ["intranet_api"]
}

SERVICE_PORTS = {
    "public_app": 80,
    "intranet_api": 5000
}

SERVICE_PROTOCOLS = {
    "public_app": "HTTP",
    "intranet_api": "HTTP"
}

NETWORK_ISOLATION = {
    "public_app": "public_net",
    "intranet_api": "private_net"
}

def get_service_info(service_name=None):
    """Get metadata for services"""
    if service_name:
        if service_name in SERVICE_PORTS:
            return {
                "name": service_name,
                "port": SERVICE_PORTS[service_name],
                "protocol": SERVICE_PROTOCOLS[service_name],
                "network": NETWORK_ISOLATION[service_name]
            }
        return None
    
    return {
        "services": AVAILABLE_SERVICES,
        "total_public": len(AVAILABLE_SERVICES["public"]),
        "total_private": len(AVAILABLE_SERVICES["private"])
    }

def get_internal_ip():
    """Get container's internal L3 IP address"""
    try:
        hostname = socket.gethostname()
        return socket.gethostbyname(hostname)
    except:
        return "0.0.0.0"

# Create global service registry
registry = get_service_info()
EOF

# Create services/public_app/__init__.py
cat > services/public_app/__init__.py << 'EOF'
"""
Public Application Package
Internet-facing server mockup (L7 - HTML)
"""

SERVICE_NAME = "public_app"
INTERNAL_PORT = 80
PROTOCOL = "TCP"
NETWORK = "public_net"
CONTENT_TYPE = "text/html"

__all__ = ['SERVICE_NAME', 'INTERNAL_PORT', 'PROTOCOL', 'NETWORK']
EOF

# Create services/public_app/app.py with http.server
cat > services/public_app/app.py << 'EOF'
#!/usr/bin/env python3
"""
Public Internet Server - Layer 7 Application Mockup
Serves HTML content to simulate a public-facing website
Network: public_net (DMZ/Internet facing)
"""

import http.server
import socketserver
import socket
import os
import json
from datetime import datetime

PORT = int(os.environ.get('SERVICE_PORT', 80))
SERVICE_NAME = os.environ.get('SERVICE_NAME', 'public_app')

class MockPublicHandler(http.server.SimpleHTTPRequestHandler):
    """L7 HTTP Handler for public internet simulation"""
    
    def get_internal_ip(self):
        """Get container's L3 IP address"""
        try:
            hostname = socket.gethostname()
            return socket.gethostbyname(hostname)
        except:
            return "172.18.0.x"
    
    def do_GET(self):
        """Handle GET requests - L7 Application Layer"""
        
        if self.path == '/':
            # L7: Serve HTML homepage
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            
            html = f"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>🌐 Public Internet Server</title>
                <style>
                    body {{
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                        max-width: 800px;
                        margin: 40px auto;
                        padding: 20px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border-radius: 10px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                    }}
                    h1 {{ color: #fff; border-bottom: 2px solid #fff; padding-bottom: 10px; }}
                    .info-box {{
                        background: rgba(255,255,255,0.1);
                        padding: 20px;
                        border-radius: 8px;
                        margin: 20px 0;
                    }}
                    .layer {{
                        background: rgba(0,0,0,0.2);
                        padding: 10px;
                        margin: 10px 0;
                        border-left: 4px solid #ffd700;
                    }}
                    small {{ color: #ddd; display: block; margin-top: 20px; }}
                </style>
            </head>
            <body>
                <h1>🌐 Welcome to the Public Network</h1>
                
                <div class="info-box">
                    <h2>Server Information</h2>
                    <p><strong>Service:</strong> {SERVICE_NAME}</p>
                    <p><strong>Status:</strong> <span style="color: #a0ffa0;">🟢 Online</span></p>
                    <p><strong>Timestamp:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                </div>
                
                <div class="layer">
                    <h3>📡 Layer 3 (Network)</h3>
                    <p>Internal IP: <code>{self.get_internal_ip()}</code></p>
                    <p>Network: <code>public_net</code></p>
                </div>
                
                <div class="layer">
                    <h3>🔌 Layer 4 (Transport)</h3>
                    <p>Protocol: <code>TCP</code></p>
                    <p>Port: <code>{PORT}</code></p>
                </div>
                
                <div class="layer">
                    <h3>🌍 Layer 7 (Application)</h3>
                    <p>Protocol: <code>HTTP/1.1</code></p>
                    <p>Content-Type: <code>text/html</code></p>
                </div>
                
                <hr>
                <small>Connected via Nginx Reverse Proxy • Mockup Infrastructure</small>
            </body>
            </html>
            """
            self.wfile.write(html.encode('utf-8'))
            
        elif self.path == '/health':
            # L7: Health check endpoint
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            health = {
                'service': SERVICE_NAME,
                'status': 'healthy',
                'network': 'public_net',
                'timestamp': datetime.now().isoformat()
            }
            self.wfile.write(json.dumps(health).encode())
            
        elif self.path == '/api/info':
            # L7: JSON API endpoint
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            info = {
                'service': SERVICE_NAME,
                'type': 'internet-facing',
                'layer': '7 (Application)',
                'protocol': 'HTTP/1.1',
                'network': 'public_net',
                'internal_ip': self.get_internal_ip(),
                'endpoints': ['/', '/health', '/api/info']
            }
            self.wfile.write(json.dumps(info).encode())
            
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'404 - Not Found')
    
    def log_message(self, format, *args):
        """Override logging for cleaner output"""
        print(f"[{SERVICE_NAME}] {format % args}")

def run_server():
    """Start the HTTP server"""
    print(f"\n🌐 Starting Public Internet Server")
    print(f"   Service: {SERVICE_NAME}")
    print(f"   Network: public_net")
    print(f"   Port: {PORT}")
    print(f"   Protocol: HTTP/1.1")
    print("-" * 50)
    
    with socketserver.TCPServer(("0.0.0.0", PORT), MockPublicHandler) as httpd:
        httpd.serve_forever()

if __name__ == "__main__":
    run_server()
EOF

# Create services/public_app/Dockerfile
cat > services/public_app/Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# No external dependencies needed for http.server
COPY app.py .
COPY requirements.txt .

EXPOSE 80

CMD ["python", "app.py"]
EOF

# Create services/public_app/requirements.txt
cat > services/public_app/requirements.txt << 'EOF'
# No external dependencies - using Python's built-in http.server
EOF

# Create services/intranet_api/__init__.py
cat > services/intranet_api/__init__.py << 'EOF'
"""
Intranet API Package
Private backend service mockup (L7 - JSON)
Network: private_net (Isolated Intranet)
"""

SERVICE_NAME = "intranet_api"
INTERNAL_PORT = 5000
PROTOCOL = "TCP"
NETWORK = "private_net"
CONTENT_TYPE = "application/json"

__all__ = ['SERVICE_NAME', 'INTERNAL_PORT', 'PROTOCOL', 'NETWORK']
EOF

# Create services/intranet_api/api.py with Flask
cat > services/intranet_api/api.py << 'EOF'
#!/usr/bin/env python3
"""
Intranet API Server - Layer 7 Application Mockup
Serves JSON data to simulate a private backend API
Network: private_net (Isolated Intranet)
"""

from flask import Flask, jsonify, request
import socket
import os
from datetime import datetime

app = Flask(__name__)

SERVICE_NAME = os.environ.get('SERVICE_NAME', 'intranet_api')
PORT = int(os.environ.get('SERVICE_PORT', 5000))

def get_internal_ip():
    """Get container's L3 IP address"""
    try:
        hostname = socket.gethostname()
        return socket.gethostbyname(hostname)
    except:
        return "172.19.0.x"

@app.route('/status', methods=['GET'])
def get_status():
    """
    L7: Status endpoint showing network isolation
    Demonstrates L3 visibility and private network access
    """
    internal_ip = get_internal_ip()
    
    response = {
        "server_name": SERVICE_NAME,
        "network": "private_net",
        "internal_l3_ip": internal_ip,
        "layer_4_protocol": "TCP",
        "layer_7_payload": "application/json",
        "authenticated": True,
        "timestamp": datetime.now().isoformat(),
        "message": "Secure intranet endpoint - no external access",
        "headers": dict(request.headers)
    }
    
    app.logger.info(f"Status request from {request.remote_addr}")
    return jsonify(response), 200

@app.route('/data', methods=['POST'])
def post_data():
    """
    L7: Data ingestion endpoint
    Receives JSON payloads in the private network
    """
    try:
        data = request.get_json()
        
        response = {
            "message": "Data received in secure zone",
            "received": data,
            "timestamp": datetime.now().isoformat(),
            "network": "private_net",
            "status": "stored_securely"
        }
        
        app.logger.info(f"Data received from {request.remote_addr}")
        return jsonify(response), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/health', methods=['GET'])
def health():
    """L7: Health check endpoint"""
    return jsonify({
        "service": SERVICE_NAME,
        "status": "healthy",
        "network": "private_net",
        "timestamp": datetime.now().isoformat()
    }), 200

@app.route('/config', methods=['GET'])
def get_config():
    """
    L7: Internal configuration endpoint
    Demonstrates sensitive data only accessible within private_net
    """
    response = {
        "environment": "secure_intranet",
        "features": ["zero_trust", "encryption_at_rest", "audit_logging"],
        "api_version": "v1",
        "rate_limits": "1000/hour",
        "network_isolation": True
    }
    return jsonify(response), 200

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({"error": "Method not allowed"}), 405

if __name__ == "__main__":
    print(f"\n🔒 Starting Intranet API Server")
    print(f"   Service: {SERVICE_NAME}")
    print(f"   Network: private_net (isolated)")
    print(f"   Port: {PORT}")
    print(f"   Protocol: HTTP/1.1")
    print(f"   Isolation: internal: true")
    print("-" * 50)
    
    # Bind to all interfaces in the private network
    app.run(host='0.0.0.0', port=PORT, debug=False)
EOF

# Create services/intranet_api/Dockerfile
cat > services/intranet_api/Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Install Flask dependency
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY api.py .
COPY requirements.txt .

EXPOSE 5000

CMD ["python", "api.py"]
EOF

# Create services/intranet_api/requirements.txt
cat > services/intranet_api/requirements.txt << 'EOF'
Flask>=2.3.0
EOF

# Create certs placeholder
touch certs/__init__.py

echo "✅ Mockup Infrastructure created successfully!"
echo "=" * 50
echo ""
echo "📋 Full Stack Implementation (OSI Layers 3-7):"
echo "   L3 (Network)    : Podman bridge networks (public_net/private_net)"
echo "   L4 (Transport)  : TCP/IP with network isolation"
echo "   L5/6 (Session)  : TLS 1.3 with self-signed certificates"
echo "   L7 (Application): Nginx reverse proxy + Python HTTP/Flask"
echo ""
echo "📁 Repository Structure:"
echo "   mockup-infra/"
echo "   ├── manage.py           # Full stack automation"
echo "   ├── docker-compose.yml  # Dual-network IaC"
echo "   ├── gateway/            # L7 Reverse Proxy"
echo "   └── services/           # L7 Application Mockups"
echo "       ├── public_app/     # Internet server (http.server)"
echo "       └── intranet_api/   # Intranet API (Flask)"
echo ""
echo "🚀 Quick Start:"
echo "   cd mockup-infra"
echo "   pip install -r requirements.txt"
echo "   ./manage.py init        # Generate TLS certs"
echo "   ./manage.py deploy      # Start full stack"
echo "   ./manage.py test        # Test all endpoints"
echo "   ./manage.py tls         # Inspect TLS certificate"
echo "   ./manage.py isolate     # Verify network isolation"
echo ""
echo "🧪 Testing Commands:"
echo "   # Test L7 Public Web (HTML)"
echo "   curl -k https://localhost:443/public/"
echo ""
echo "   # Test L7 Intranet API Status (JSON + L3 IP)"
echo "   curl -k https://localhost:443/status"
echo ""
echo "   # Test L7 Intranet API Data (POST)"
echo "   curl -k -X POST -H 'Content-Type: application/json' \\"
echo "        -d '{\"test\":\"data\"}' https://localhost:443/data"
echo ""
echo "   # Inspect L5/6 TLS Session"
echo "   openssl s_client -connect localhost:443 -showcerts"
echo ""
echo "=" * 50