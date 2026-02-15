#!/usr/bin/env python3
"""
Verification Script for MIME-Typing Network Integration
Tests all components of the integrated mockup-infra + week01-mime-typing system
"""

import subprocess
import sys
import json
from pathlib import Path

class Colors:
    """ANSI color codes for terminal output"""
    OK = '\033[92m'      # Green
    FAIL = '\033[91m'    # Red
    WARN = '\033[93m'    # Yellow
    INFO = '\033[94m'    # Blue
    END = '\033[0m'      # Reset

def print_header(text):
    """Print a formatted header"""
    print(f"\n{Colors.INFO}{'='*60}")
    print(f"{text:^60}")
    print(f"{'='*60}{Colors.END}\n")

def print_ok(text):
    """Print success message"""
    print(f"{Colors.OK}[OK]{Colors.END} {text}")

def print_fail(text):
    """Print failure message"""
    print(f"{Colors.FAIL}[FAIL]{Colors.END} {text}")

def print_warn(text):
    """Print warning message"""
    print(f"{Colors.WARN}[WARN]{Colors.END} {text}")

def print_info(text):
    """Print info message"""
    print(f"{Colors.INFO}[INFO]{Colors.END} {text}")

def run_command(cmd, shell=False, capture=True):
    """Run a command and return (success, output)"""
    try:
        if capture:
            result = subprocess.run(
                cmd, 
                shell=shell, 
                capture_output=True, 
                text=True, 
                timeout=5
            )
            return result.returncode == 0, result.stdout + result.stderr
        else:
            result = subprocess.run(
                cmd, 
                shell=shell, 
                timeout=5
            )
            return result.returncode == 0, ""
    except subprocess.TimeoutExpired:
        return False, "Command timeout"
    except Exception as e:
        return False, str(e)

def check_docker():
    """Check if Docker is installed and running"""
    print_header("DOCKER INSTALLATION CHECK")
    
    success, output = run_command(["docker", "--version"])
    if success:
        print_ok(f"Docker installed: {output.strip()}")
    else:
        print_fail("Docker not found. Install from https://www.docker.com")
        return False
    
    success, output = run_command(["docker", "ps"])
    if success:
        print_ok("Docker daemon is running")
    else:
        print_fail("Docker daemon is not running. Start Docker Desktop.")
        return False
    
    return True

def check_docker_compose():
    """Check if Docker Compose is installed"""
    print_header("DOCKER COMPOSE CHECK")
    
    success, output = run_command(["docker-compose", "--version"])
    if success:
        print_ok(f"Docker Compose installed: {output.strip()}")
    else:
        print_fail("docker-compose not found. Install from https://docs.docker.com/compose")
        return False
    
    return True

def check_workspace():
    """Check if workspace structure exists"""
    print_header("WORKSPACE STRUCTURE CHECK")
    
    base_path = Path("d:/boonsup/automation") if sys.platform == "win32" else Path("~/boonsup/automation").expanduser()
    
    required_dirs = [
        "mockup-infra",
        "week01-mime-typing",
    ]
    
    required_files = [
        "mockup-infra/docker-compose.yml",
        "week01-mime-typing/Dockerfile.server",
        "week01-mime-typing/Dockerfile.client",
    ]
    
    all_ok = True
    
    for dir_name in required_dirs:
        dir_path = base_path / dir_name
        if dir_path.exists():
            print_ok(f"Directory found: {dir_name}")
        else:
            print_fail(f"Directory missing: {dir_name}")
            all_ok = False
    
    for file_name in required_files:
        file_path = base_path / file_name
        if file_path.exists():
            print_ok(f"File found: {file_name}")
        else:
            print_fail(f"File missing: {file_name}")
            all_ok = False
    
    return all_ok

def check_containers():
    """Check status of containers"""
    print_header("CONTAINER STATUS CHECK")
    
    success, output = run_command(["docker-compose", "-f", "mockup-infra/docker-compose.yml", "ps"], shell=False)
    
    if success:
        print_ok("docker-compose ps command successful")
        print(output)
        return True
    else:
        print_warn("Could not get container status. Services may not be running yet.")
        print("Run: cd mockup-infra && docker-compose up -d")
        return False

def check_networks():
    """Check if docker networks exist"""
    print_header("DOCKER NETWORKS CHECK")
    
    success, output = run_command(["docker", "network", "ls"])
    
    if "public_net" in output and "private_net" in output:
        print_ok("Both public_net and private_net networks found")
        return True
    else:
        print_warn("Networks not found. They will be created when docker-compose starts.")
        print("Run: cd mockup-infra && docker-compose up -d")
        return False

def check_volumes():
    """Check if docker volumes exist"""
    print_header("DOCKER VOLUMES CHECK")
    
    success, output = run_command(["docker", "volume", "ls"])
    
    if "mime_storage" in output:
        print_ok("mime_storage volume found")
        return True
    else:
        print_warn("mime_storage volume not found. It will be created when docker-compose starts.")
        return False

def check_mime_server():
    """Check if MIME server is accessible"""
    print_header("MIME SERVER CHECK")
    
    # Check if container exists
    success, output = run_command(["docker", "ps", "-a"])
    
    if "mime-server" in output:
        print_ok("mime-server container found")
        
        # Check if running
        success, output = run_command(["docker", "ps"])
        if "mime-server" in output:
            print_ok("mime-server container is RUNNING")
            
            # Try to check if port is listening
            success, output = run_command(
                ["docker", "exec", "mime-server", "ss", "-tlnp"],
                shell=False
            )
            if success and "65432" in output:
                print_ok("MIME server listening on port 65432")
                return True
            else:
                print_warn("Could not verify port 65432 is listening")
                return False
        else:
            print_warn("mime-server container exists but is not running")
            print("Run: docker-compose -f mockup-infra/docker-compose.yml up -d")
            return False
    else:
        print_warn("mime-server container not found. Build with: docker-compose build")
        return False

def check_mime_client():
    """Check if MIME client container is available"""
    print_header("MIME CLIENT CHECK")
    
    success, output = run_command(["docker", "ps", "-a"])
    
    if "mime-client" in output:
        print_ok("mime-client container image found")
        
        # Check if it's running
        success_run, output_run = run_command(["docker", "ps"])
        if "mime-client" in output_run:
            print_ok("mime-client container is RUNNING (on-demand mode)")
        else:
            print_ok("mime-client container exists (will start on-demand with --profile client-manual)")
        
        return True
    else:
        print_warn("mime-client container not found. Build with: docker-compose build")
        return False

def check_cross_network_connectivity():
    """Check if client can reach server across networks"""
    print_header("CROSS-NETWORK CONNECTIVITY CHECK")
    
    # Check if mime-client is running
    success, output = run_command(["docker", "ps"])
    
    if "mime-client" in output:
        # Try ping
        success, output = run_command(
            ["docker", "exec", "mime-client", "ping", "-c", "1", "mime-server"],
            shell=False
        )
        
        if success:
            print_ok("mime-client can ping mime-server")
            return True
        else:
            print_warn("ping failed. Trying nc (netcat)...")
            
            success, output = run_command(
                ["docker", "exec", "mime-client", "nc", "-zv", "mime-server", "65432"],
                shell=False
            )
            
            if success:
                print_ok("mime-client can reach mime-server:65432 via netcat")
                return True
            else:
                print_warn("Could not verify connectivity (nc not available)")
                return False
    else:
        print_warn("mime-client not running. Start with: docker-compose --profile client-manual run mime-client")
        return False

def check_storage():
    """Check storage volume"""
    print_header("STORAGE VOLUME CHECK")
    
    success, output = run_command(
        ["docker", "exec", "mime-server", "ls", "-la", "/storage/"],
        shell=False
    )
    
    if success:
        print_ok("mime-server storage directory accessible")
        if output.strip():
            print(output)
        else:
            print("(Storage directory is empty)")
        return True
    else:
        print_warn("Could not access storage directory")
        return False

def check_nginx_gateway():
    """Check if Nginx gateway is running"""
    print_header("NGINX GATEWAY CHECK")
    
    success, output = run_command(["docker", "ps"])
    
    if "mockup-gateway" in output:
        print_ok("nginx-gateway (mockup-gateway) container is RUNNING")
        
        # Check ports
        success, output = run_command(
            ["docker", "exec", "mockup-gateway", "ss", "-tlnp"],
            shell=False
        )
        
        if success and "80" in output and "443" in output:
            print_ok("Nginx listening on ports 80 and 443")
            return True
        else:
            print_warn("Could not verify Nginx ports")
            return False
    else:
        print_warn("mockup-gateway not running")
        return False

def run_all_checks():
    """Run all verification checks"""
    print_header("MIME-TYPING NETWORK INTEGRATION VERIFICATION")
    print(f"System: {sys.platform}")
    print()
    
    results = {}
    
    # Essential checks
    print(f"{Colors.INFO}TIER 1: ESSENTIAL REQUIREMENTS{Colors.END}")
    results['docker'] = check_docker()
    results['docker_compose'] = check_docker_compose()
    results['workspace'] = check_workspace()
    
    if not all([results['docker'], results['docker_compose']]):
        print(f"\n{Colors.FAIL}Cannot proceed without Docker and docker-compose{Colors.END}")
        return results
    
    # Deployment checks
    print(f"\n{Colors.INFO}TIER 2: DEPLOYMENT STATUS{Colors.END}")
    results['containers'] = check_containers()
    results['networks'] = check_networks()
    results['volumes'] = check_volumes()
    
    if not results['containers']:
        print(f"\n{Colors.WARN}Services not deployed yet. Run: cd mockup-infra && docker-compose up -d{Colors.END}")
        return results
    
    # Service checks
    print(f"\n{Colors.INFO}TIER 3: SERVICE HEALTH{Colors.END}")
    results['mime_server'] = check_mime_server()
    results['mime_client'] = check_mime_client()
    results['nginx'] = check_nginx_gateway()
    
    # Connectivity checks (only if services running)
    if results['mime_server'] and 'mime-client' in open('mockup-infra/docker-compose.ps', 'a').name or True:
        print(f"\n{Colors.INFO}TIER 4: CONNECTIVITY{Colors.END}")
        results['cross_network'] = check_cross_network_connectivity()
        results['storage'] = check_storage()
    
    return results

def print_summary(results):
    """Print summary of all checks"""
    print_header("VERIFICATION SUMMARY")
    
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    failed = total - passed
    
    print(f"Total Checks: {total}")
    print(f"{Colors.OK}Passed: {passed}{Colors.END}")
    if failed > 0:
        print(f"{Colors.FAIL}Failed: {failed}{Colors.END}")
    
    print(f"\n{Colors.INFO}Status:{Colors.END}")
    for check, result in results.items():
        status = f"{Colors.OK}[OK]{Colors.END}" if result else f"{Colors.FAIL}[FAIL]{Colors.END}"
        check_name = check.replace('_', ' ').title()
        print(f"  {status} {check_name}")
    
    print()
    
    if passed == total:
        print(f"{Colors.OK}{'='*60}")
        print(f"{'ALL CHECKS PASSED!':^60}")
        print(f"Your system is ready for MIME file transfers.{'':<15}")
        print(f"{'='*60}{Colors.END}\n")
    else:
        print(f"{Colors.WARN}{'='*60}")
        print(f"{'SOME CHECKS FAILED':^60}")
        print(f"See messages above for details and fixes.{'':<16}")
        print(f"{'='*60}{Colors.END}\n")
    
    print(f"{Colors.INFO}Next Steps:{Colors.END}")
    print("  1. If Docker not installed: Install from https://www.docker.com")
    print("  2. If services not deployed: cd mockup-infra && docker-compose up -d")
    print("  3. If all checks pass: Try a file transfer with:")
    print("     docker-compose --profile client-manual run --rm mime-client")
    print()

if __name__ == "__main__":
    try:
        results = run_all_checks()
        print_summary(results)
    except KeyboardInterrupt:
        print(f"\n{Colors.WARN}Verification interrupted by user{Colors.END}\n")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Colors.FAIL}Verification error: {e}{Colors.END}\n")
        sys.exit(1)
