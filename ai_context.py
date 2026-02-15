#!/usr/bin/env python3
"""
AI Context Library: Mockup-Infra + MIME-Typing Integration
Provides programmatic access to deployment state, configuration, and decision logic
Usage: from ai_context import * or podman run --entrypoint python CONTAINER /app/ai_context.py
"""

import json
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Tuple
from enum import Enum
from datetime import datetime

# ============================================================================
# DATA CLASSES
# ============================================================================

@dataclass
class ServiceEndpoint:
    """Represents a service endpoint configuration"""
    port: int
    protocol: str
    internal: bool = True

@dataclass
class NetworkConfig:
    """Represents a network configuration"""
    name: str
    subnet: str
    ipv4: str
    purpose: str

@dataclass
class Service:
    """Represents a container service"""
    name: str
    image: str
    role: str
    networks: List[NetworkConfig]
    status: str
    ports: Optional[List[ServiceEndpoint]] = None
    volumes: Optional[Dict[str, str]] = None
    environment: Optional[Dict[str, str]] = None
    dockerfile: Optional[str] = None

class ArchitectureDecision(Enum):
    """Architectural decision outcomes"""
    USE_DUAL_NETWORK = "service_needs_cross_network_access"
    USE_SINGLE_NETWORK = "service_isolated_to_one_network"
    GATEWAY_REQUIRED = "service_needs_l7_proxy"
    DIRECT_CONNECT = "service_direct_connection"
    ADD_LOGGING = "service_requires_audit_logging"

# ============================================================================
# DEPLOYMENT CONTEXT
# ============================================================================

class DeploymentContext:
    """Central context for the entire deployment"""
    
    def __init__(self):
        self.timestamp = "2026-02-13T09:22:06+07:00"
        self.runtime = "Podman 5.7.1"
        self.status = "operational"
        
        # Service Registry
        self.services: Dict[str, Service] = self._initialize_services()
        
        # Network Map
        self.networks = {
            "public_net": NetworkConfig(
                name="public_net",
                subnet="172.18.0.0/16",
                ipv4="172.18.0.2",  # Gateway
                purpose="External-facing services"
            ),
            "private_net": NetworkConfig(
                name="private_net",
                subnet="172.19.0.0/16",
                ipv4="172.19.0.2",  # Gateway
                purpose="Internal-only services"
            )
        }
        
        # Verification Record
        self.verified = {
            "file_transfer": True,
            "network_connectivity": True,
            "all_services_running": True,
            "logging_compliant": True
        }
    
    def _initialize_services(self) -> Dict[str, Service]:
        """Initialize all services"""
        return {
            "mockup-gateway": Service(
                name="mockup-gateway",
                image="nginx:alpine",
                role="L7 Reverse Proxy",
                networks=[
                    NetworkConfig("public_net", "172.18.0.0/16", "172.18.0.2", "External-facing"),
                    NetworkConfig("private_net", "172.19.0.0/16", "172.19.0.2", "Internal")
                ],
                status="running",
                ports=[
                    ServiceEndpoint(80, "http"),
                    ServiceEndpoint(443, "https")
                ],
                environment={"access_log": "/var/log/nginx/access.log"}
            ),
            
            "public_app": Service(
                name="public_app",
                image="python:3.11-slim",
                role="Public HTTP Service",
                networks=[
                    NetworkConfig("public_net", "172.18.0.0/16", "172.18.0.3", "External-facing")
                ],
                status="running",
                ports=[ServiceEndpoint(80, "http")],
                environment={"PYTHONIOENCODING": "utf-8"}
            ),
            
            "intranet_api": Service(
                name="intranet_api",
                image="python:3.11-slim",
                role="Private API Service",
                networks=[
                    NetworkConfig("private_net", "172.19.0.0/16", "172.19.0.3", "Internal")
                ],
                status="running",
                ports=[ServiceEndpoint(5000, "flask")],
                environment={"PYTHONIOENCODING": "utf-8"}
            ),
            
            "mime-server": Service(
                name="mime-server",
                image="python:3.11-slim",
                role="MIME File Transfer Daemon",
                networks=[
                    NetworkConfig("public_net", "172.18.0.0/16", "172.18.0.4", "External-facing"),
                    NetworkConfig("private_net", "172.19.0.0/16", "172.19.0.5", "Internal")
                ],
                status="running",
                ports=[ServiceEndpoint(65432, "socket", internal=True)],
                volumes={"mime_storage": "/storage"},
                environment={
                    "PYTHONIOENCODING": "utf-8",
                    "STORAGE_DIR": "/storage"
                },
                dockerfile="week01-mime-typing/Dockerfile.server"
            ),
            
            "mime-client": Service(
                name="mime-client",
                image="python:3.11-slim",
                role="MIME Client",
                networks=[
                    NetworkConfig("private_net", "172.19.0.0/16", "172.19.0.4", "Internal")
                ],
                status="running",
                ports=[],
                environment={
                    "PYTHONIOENCODING": "utf-8",
                    "MIME_SERVER_HOST": "mime-server",
                    "MIME_SERVER_PORT": "65432"
                },
                dockerfile="week01-mime-typing/Dockerfile.client"
            )
        }
    
    def get_service(self, name: str) -> Optional[Service]:
        """Get service by name"""
        return self.services.get(name)
    
    def get_services_on_network(self, network: str) -> List[Service]:
        """Get all services on a specific network"""
        return [
            svc for svc in self.services.values()
            if any(n.name == network for n in svc.networks)
        ]
    
    def get_cross_network_services(self) -> List[Service]:
        """Get services that span multiple networks"""
        return [svc for svc in self.services.values() if len(svc.networks) > 1]
    
    def decide_architecture(self, requirement: str) -> List[ArchitectureDecision]:
        """Make architectural decisions based on requirements"""
        decisions = []
        
        if "cross-network" in requirement.lower() or "bridge" in requirement.lower():
            decisions.append(ArchitectureDecision.USE_DUAL_NETWORK)
        
        if "isolated" in requirement.lower() or "private" in requirement.lower():
            decisions.append(ArchitectureDecision.USE_SINGLE_NETWORK)
        
        if "external" in requirement.lower() or "public" in requirement.lower():
            decisions.append(ArchitectureDecision.GATEWAY_REQUIRED)
        
        if "compliance" in requirement.lower() or "audit" in requirement.lower():
            decisions.append(ArchitectureDecision.ADD_LOGGING)
        
        return decisions
    
    def validate_deployment(self) -> Tuple[bool, List[str]]:
        """Validate current deployment"""
        issues = []
        
        # Check all services running
        for svc in self.services.values():
            if svc.status != "running":
                issues.append(f"{svc.name} is not running")
        
        # Check critical features
        mime_server = self.get_service("mime-server")
        if mime_server and len(mime_server.networks) != 2:
            issues.append("mime-server not on dual networks")
        
        return len(issues) == 0, issues
    
    def get_deployment_summary(self) -> Dict:
        """Get comprehensive deployment summary"""
        return {
            "timestamp": self.timestamp,
            "runtime": self.runtime,
            "status": self.status,
            "services_count": len(self.services),
            "services_running": sum(1 for s in self.services.values() if s.status == "running"),
            "networks_count": len(self.networks),
            "cross_network_services": len(self.get_cross_network_services()),
            "verified": self.verified
        }

# ============================================================================
# DECISION ENGINE
# ============================================================================

class ArchitectureDecisionEngine:
    """Helps make architectural decisions for new work"""
    
    def __init__(self, context: DeploymentContext):
        self.context = context
    
    def should_add_dual_network(self, service_name: str) -> bool:
        """Determine if a service should be on dual networks"""
        # Pattern: cross-network services like mime-server
        if "mime" in service_name or "bridge" in service_name or "gateway" in service_name:
            return True
        return False
    
    def should_expose_to_gateway(self, service_name: str, network: str) -> bool:
        """Determine if service should be exposed through gateway"""
        # Only public_net services exposed to gateway by default
        return network == "public_net"
    
    def recommend_configuration(self, service_type: str) -> Dict[str, any]:
        """Recommend configuration for new service"""
        recommendations = {
            "file-transfer": {
                "networks": ["public_net", "private_net"],
                "port": 65432,
                "storage": True,
                "logging": True
            },
            "api": {
                "networks": ["private_net"],
                "port": 5000,
                "storage": False,
                "logging": True
            },
            "web": {
                "networks": ["public_net"],
                "port": 80,
                "storage": False,
                "logging": True
            }
        }
        return recommendations.get(service_type, {})

# ============================================================================
# COMMAND BUILDER
# ============================================================================

class PodmanCommandBuilder:
    """Build Podman commands for various operations"""
    
    @staticmethod
    def service_status() -> str:
        """Command to check service status"""
        return "podman-compose ps"
    
    @staticmethod
    def start_services() -> str:
        """Command to start all services"""
        return "cd mockup-infra && podman-compose up -d"
    
    @staticmethod
    def stop_services() -> str:
        """Command to stop all services"""
        return "cd mockup-infra && podman-compose down"
    
    @staticmethod
    def view_logs(service: str) -> str:
        """Command to view service logs"""
        return f"podman-compose logs -f {service}"
    
    @staticmethod
    def exec_in_container(container: str, command: str) -> str:
        """Build exec command"""
        return f"podman exec {container} {command}"
    
    @staticmethod
    def test_file_transfer() -> str:
        """Command to test file transfer"""
        return (
            "podman run --rm --network mockup-infra_private_net --entrypoint bash mime-client:latest "
            "-c \"echo 'Test' > /tmp/test.txt && python /app/client.py --send /tmp/test.txt --to mime-server:65432\""
        )

# ============================================================================
# MAIN CONTEXT & EXPORTS
# ============================================================================

# Global deployment context
DEPLOYMENT = DeploymentContext()

# Global decision engine
DECISION_ENGINE = ArchitectureDecisionEngine(DEPLOYMENT)

# Command builder
COMMANDS = PodmanCommandBuilder()

# ============================================================================
# UTILITY FUNCTIONS FOR AI CONTEXT
# ============================================================================

def get_deployment_info() -> Dict:
    """Get all deployment information for AI context"""
    return {
        "deployment": DEPLOYMENT.get_deployment_summary(),
        "services": {
            name: asdict(svc) if hasattr(svc, '__dataclass_fields__') else svc
            for name, svc in DEPLOYMENT.services.items()
        },
        "networks": {
            name: asdict(net) if hasattr(net, '__dataclass_fields__') else net
            for name, net in DEPLOYMENT.networks.items()
        },
        "verification": DEPLOYMENT.verified,
        "operational": all(DEPLOYMENT.verified.values())
    }

def print_deployment_info():
    """Print deployment information to console"""
    print("\n" + "=" * 70)
    print("DEPLOYMENT CONTEXT INFORMATION".center(70))
    print("=" * 70)
    
    summary = DEPLOYMENT.get_deployment_summary()
    print(f"\nTimestamp: {summary['timestamp']}")
    print(f"Runtime: {summary['runtime']}")
    print(f"Status: {summary['status']}")
    print(f"Services: {summary['services_running']}/{summary['services_count']} running")
    print(f"Networks: {summary['networks_count']}")
    print(f"Cross-Network Services: {summary['cross_network_services']}")
    
    print("\n--- Services ---")
    for name, svc in DEPLOYMENT.services.items():
        networks = ", ".join(n.name for n in svc.networks)
        print(f"  {name:20} {svc.status:8} Networks: {networks}")
    
    print("\n--- Verification ---")
    for check, result in DEPLOYMENT.verified.items():
        status = "✓" if result else "✗"
        print(f"  {status} {check.replace('_', ' ').title()}")
    
    is_valid, issues = DEPLOYMENT.validate_deployment()
    print(f"\nDeployment Valid: {'✓ YES' if is_valid else '✗ NO (issues: ' + ', '.join(issues) + ')'}")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    print_deployment_info()
    print("\nUsage as library:")
    print("  from ai_context import DEPLOYMENT, DECISION_ENGINE, COMMANDS")
    print("  service = DEPLOYMENT.get_service('mime-server')")
    print("  decisions = DECISION_ENGINE.recommend_configuration('file-transfer')")
    print("  cmd = COMMANDS.test_file_transfer()")
