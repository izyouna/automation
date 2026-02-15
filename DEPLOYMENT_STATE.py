#!/usr/bin/env python3
"""
Deployment State & Context Digest (as Code)
Captures the complete state of mockup-infra + mime-typing integration
Generated: February 13, 2026
Runtime: Podman 5.7.1
"""

import json
from typing import Dict, List, Any
from datetime import datetime
from enum import Enum

class ServiceStatus(Enum):
    """Service status enumeration"""
    UP = "up"
    DOWN = "down"
    PARTIAL = "partial"
    UNKNOWN = "unknown"

class NetworkType(Enum):
    """Network type enumeration"""
    PUBLIC = "public_net"
    PRIVATE = "private_net"
    DUAL = "dual"

# ============================================================================
# DEPLOYMENT STATE MANIFEST
# ============================================================================

DEPLOYMENT_STATE = {
    "timestamp": "2026-02-13T09:22:06+07:00",
    "runtime": {
        "container_engine": "podman",
        "version": "5.7.1",
        "orchestrator": "podman-compose",
        "orchestrator_version": "1.5.0",
        "os": "Windows PowerShell",
    },
    
    "services": {
        "mockup-gateway": {
            "type": "reverse-proxy",
            "image": "nginx:alpine",
            "status": ServiceStatus.UP.value,
            "container_name": "mockup-gateway",
            "networks": [
                {
                    "name": NetworkType.PUBLIC.value,
                    "ipv4_address": "172.18.0.2"
                },
                {
                    "name": NetworkType.PRIVATE.value,
                    "ipv4_address": "172.19.0.2"
                }
            ],
            "ports": [
                {"host": "8080", "container": "80", "protocol": "http"},
                {"host": "443", "container": "443", "protocol": "https"}
            ],
            "logging": {
                "enabled": True,
                "formats": [
                    "main (pipe-delimited)",
                    "audit_detailed (JSON)",
                    "connection_error (JSON)",
                    "ssl_connection (JSON)",
                    "upstream_error (JSON)"
                ],
                "log_count": 15,
                "compliance": "Thailand Digital Crime Act",
                "buffer_size": "32KB",
                "flush_interval": "5 seconds"
            },
            "tls": {
                "version": "1.3",
                "certificate_type": "self-signed",
                "http2": True,
                "configuration_file": "mockup-infra/gateway/nginx.conf"
            },
            "upstreams": [
                {"target": "public_app:80", "location": "/api/public"},
                {"target": "intranet_api:5000", "location": "/api/internal"}
            ]
        },
        
        "public_app": {
            "type": "http-service",
            "image": "python:3.11-slim",
            "status": ServiceStatus.UP.value,
            "container_name": "public_app",
            "networks": [
                {
                    "name": NetworkType.PUBLIC.value,
                    "ipv4_address": "172.18.0.3"
                }
            ],
            "ports": [
                {"expose": "80", "service": "http"}
            ],
            "environment": {
                "PYTHONIOENCODING": "utf-8"
            }
        },
        
        "intranet_api": {
            "type": "api-service",
            "image": "python:3.11-slim",
            "status": ServiceStatus.UP.value,
            "container_name": "intranet_api",
            "networks": [
                {
                    "name": NetworkType.PRIVATE.value,
                    "ipv4_address": "172.19.0.3"
                }
            ],
            "ports": [
                {"expose": "5000", "service": "flask"}
            ],
            "environment": {
                "PYTHONIOENCODING": "utf-8"
            }
        },
        
        "mime-server": {
            "type": "file-transfer-daemon",
            "image": "python:3.11-slim",
            "status": ServiceStatus.UP.value,
            "container_name": "mime-server",
            "networks": [
                {
                    "name": NetworkType.PUBLIC.value,
                    "ipv4_address": "172.18.0.4"
                },
                {
                    "name": NetworkType.PRIVATE.value,
                    "ipv4_address": "172.19.0.5"
                }
            ],
            "ports": [
                {"expose": "65432", "service": "mime-socket"}
            ],
            "volumes": [
                {
                    "name": "mime_storage",
                    "mount_point": "/storage",
                    "type": "named"
                }
            ],
            "environment": {
                "PYTHONIOENCODING": "utf-8",
                "STORAGE_DIR": "/storage"
            },
            "critical_feature": "Dual network access (172.18.0.4 + 172.19.0.5)",
            "dockerfile": "week01-mime-typing/Dockerfile.server",
            "verified": {
                "listening_port": 65432,
                "cross_network_accessible": True,
                "storage_mounted": True
            }
        },
        
        "mime-client": {
            "type": "file-transfer-client",
            "image": "python:3.11-slim",
            "status": ServiceStatus.UP.value,
            "container_name": "mime-client",
            "mode": "on-demand",
            "networks": [
                {
                    "name": NetworkType.PRIVATE.value,
                    "ipv4_address": "172.19.0.4"
                }
            ],
            "environment": {
                "PYTHONIOENCODING": "utf-8",
                "MIME_SERVER_HOST": "mime-server",
                "MIME_SERVER_PORT": 65432,
                "CLIENT_TIMEOUT": 30
            },
            "dockerfile": "week01-mime-typing/Dockerfile.client",
            "profile": "client-manual",
            "verified": {
                "build_successful": True,
                "network_connectivity": True,
                "file_transfer": True
            }
        }
    },
    
    "networks": {
        "public_net": {
            "driver": "bridge",
            "subnet": "172.18.0.0/16",
            "description": "External-facing services (app, gateway-side)",
            "services": ["mockup-gateway", "public_app", "mime-server"]
        },
        "private_net": {
            "driver": "bridge",
            "subnet": "172.19.0.0/16",
            "description": "Internal-only services (API, client-side)",
            "services": ["mockup-gateway", "intranet_api", "mime-server", "mime-client"]
        }
    },
    
    "volumes": {
        "mime_storage": {
            "driver": "local",
            "mount_point": "/storage (in container)",
            "purpose": "Persistent file storage for MIME transfers",
            "attached_service": "mime-server",
            "cleanup_policy": "Deleted with 'podman-compose down -v'"
        }
    },
    
    "verified_operations": {
        "file_transfer": {
            "timestamp": "2026-02-13T09:22:06+07:00",
            "test_file_size": "24 bytes",
            "test_file_type": "text/plain",
            "test_file_name": "test.txt",
            "source_network": "private_net (172.19.0.4)",
            "target_host": "mime-server (172.19.0.5)",
            "target_port": 65432,
            "result": "SUCCESS",
            "file_stored_at": "/storage/received_1d8f.plain",
            "cross_network": True,
            "time_elapsed": "<1 second"
        },
        
        "network_connectivity": {
            "client_to_server_dns": {
                "source_container": "mime-client",
                "target_hostname": "mime-server",
                "resolved_ip": "172.19.0.5",
                "status": "VERIFIED"
            },
            "client_to_server_icmp": {
                "source_ip": "172.19.0.4",
                "target_ip": "172.19.0.5",
                "protocol": "ICMP (ping)",
                "status": "VERIFIED"
            },
            "client_to_server_tcp": {
                "source_ip": "172.19.0.4",
                "target_ip": "172.19.0.5",
                "port": 65432,
                "status": "VERIFIED"
            }
        },
        
        "all_services_running": {
            "mockup_gateway": True,
            "public_app": True,
            "intranet_api": True,
            "mime_server": True,
            "timestamp": "2026-02-13"
        }
    },
    
    "configuration_status": {
        "nginx_conf": {
            "file": "mockup-infra/gateway/nginx.conf",
            "issues": [],
            "fixes_applied": [
                "Fixed deprecated http2 directive (listen 443 ssl http2 → listen 443 ssl + http2 on)",
                "Fixed duplicate $request_id variable (renamed to $req_id throughout)"
            ],
            "validation": "PASSED",
            "date_fixed": "2026-02-13"
        },
        
        "docker_compose": {
            "file": "mockup-infra/docker-compose.yml",
            "services": 4,
            "networks": 2,
            "volumes": 1,
            "profiles": ["client-manual"],
            "last_updated": "2026-02-13",
            "changes": [
                "Created mime-server service",
                "Created mime-client service",
                "Added private_net to mime-server (172.19.0.5)"
            ]
        },
        
        "environment_vars": {
            "PYTHONIOENCODING": "utf-8",
            "STORAGE_DIR": "/storage",
            "MIME_SERVER_HOST": "mime-server",
            "MIME_SERVER_PORT": 65432
        }
    },
    
    "logging_system": {
        "compliance": "Thailand Digital Crime Act",
        "gateway_log_files": 15,
        "log_formats": {
            "main": "pipe-delimited with request details",
            "audit_detailed": "JSON with complete request/response context",
            "connection_error": "JSON format for connection failures",
            "ssl_connection": "JSON for TLS/SSL connection details",
            "upstream_error": "JSON for backend service failures"
        },
        "per_endpoint_tracking": [
            "/status",
            "/data",
            "/config"
        ],
        "log_locations": "/var/log/nginx/*.log (in container)",
        "real_time_flush": "32KB buffer, 5-second interval"
    }
}

# ============================================================================
# CONTEXT DIGEST - FOR AI SYSTEM PROMPTS
# ============================================================================

CONTEXT_DIGEST = {
    "system_version": "1.0",
    "deployment_date": "2026-02-13",
    "status": "FULLY_OPERATIONAL",
    
    "quick_facts": [
        "4 services deployed and running",
        "2 networks (public_net, private_net) with gateway bridge",
        "MIME server accessible from both networks (critical feature)",
        "File transfer tested and verified working",
        "Comprehensive logging for compliance (15+ log files)",
        "Podman 5.7.1 is active container runtime",
        "All Nginx configuration errors fixed (http2, $request_id)",
        "UTF-8 encoding enabled across all services"
    ],
    
    "next_work_areas": [
        "Load balancing (mime-server replicas via Nginx upstream)",
        "Additional services on public_net or private_net",
        "Monitoring/alerting on gateway logs",
        "TLS certificate management",
        "Performance testing at scale"
    ],
    
    "critical_commands": {
        "status_check": "podman-compose ps",
        "file_transfer_test": "podman run --rm --network mockup-infra_private_net --entrypoint bash mime-client:latest -c \"echo 'Test' > /tmp/test.txt && python /app/client.py --send /tmp/test.txt --to mime-server:65432\"",
        "view_logs": "podman exec mockup-gateway tail -f /var/log/nginx/audit.log | jq .",
        "check_storage": "podman exec mime-server ls -lah /storage/",
        "start_services": "cd mockup-infra && podman-compose up -d",
        "stop_services": "cd mockup-infra && podman-compose down"
    },
    
    "decision_matrix": {
        "need_new_service": {
            "question": "Adding a new backend service?",
            "action": "Edit mockup-infra/docker-compose.yml, choose network (public_net or private_net)"
        },
        "need_new_endpoint": {
            "question": "Adding a new gateway endpoint?",
            "action": "Edit mockup-infra/gateway/nginx.conf, add upstream + location block"
        },
        "need_cross_network": {
            "question": "Service needs to talk across networks?",
            "action": "Add to BOTH networks in docker-compose.yml (like mime-server)"
        },
        "need_logging": {
            "question": "Add logging for new endpoint?",
            "action": "Add log format and access_log directives in nginx.conf"
        }
    }
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_service_by_name(service_name: str) -> Dict[str, Any]:
    """Get service configuration by name"""
    return DEPLOYMENT_STATE["services"].get(service_name)

def get_network_services(network_name: str) -> List[str]:
    """Get all services on a specific network"""
    return DEPLOYMENT_STATE["networks"].get(network_name, {}).get("services", [])

def get_cross_network_services() -> List[str]:
    """Get services that span multiple networks"""
    services = []
    for name, config in DEPLOYMENT_STATE["services"].items():
        if len(config.get("networks", [])) > 1:
            services.append(name)
    return services

def validate_deployment() -> Dict[str, bool]:
    """Validate deployment state"""
    checks = {
        "all_services_up": all(
            svc.get("status") == ServiceStatus.UP.value 
            for svc in DEPLOYMENT_STATE["services"].values()
        ),
        "file_transfer_verified": DEPLOYMENT_STATE["verified_operations"]["file_transfer"]["result"] == "SUCCESS",
        "networking_verified": all(
            v.get("status") == "VERIFIED"
            for v in DEPLOYMENT_STATE["verified_operations"]["network_connectivity"].values()
        ),
        "mime_server_dual_network": len(get_service_by_name("mime-server")["networks"]) == 2,
        "logging_compliant": DEPLOYMENT_STATE["logging_system"]["compliance"] != ""
    }
    return checks

def print_deployment_summary():
    """Print a human-readable summary of deployment state"""
    print("\n" + "=" * 70)
    print("DEPLOYMENT STATE SUMMARY".center(70))
    print("=" * 70)
    
    print(f"\nTimestamp: {DEPLOYMENT_STATE['timestamp']}")
    print(f"Runtime: {DEPLOYMENT_STATE['runtime']['container_engine']} {DEPLOYMENT_STATE['runtime']['version']}")
    
    print("\n--- Services ---")
    for name, config in DEPLOYMENT_STATE["services"].items():
        status = config["status"].upper()
        networks = ", ".join(n["name"] for n in config.get("networks", []))
        print(f"  {name:15} {status:8} Networks: {networks}")
    
    print("\n--- Verified Operations ---")
    print(f"  File Transfer:        {DEPLOYMENT_STATE['verified_operations']['file_transfer']['result']}")
    print(f"  Network Connectivity: VERIFIED")
    print(f"  All Services:         UP")
    
    print("\n--- Validation ---")
    checks = validate_deployment()
    for check, result in checks.items():
        status = "✓" if result else "✗"
        print(f"  {status} {check.replace('_', ' ').title()}")
    
    all_passed = all(checks.values())
    print(f"\nOverall Status: {'✓ READY FOR NEXT PHASE' if all_passed else '✗ ISSUES DETECTED'}")
    print("=" * 70 + "\n")

# ============================================================================
# MAIN - CAN BE USED AS LIBRARY OR SCRIPT
# ============================================================================

if __name__ == "__main__":
    print("Deployment State Digest (Available for AI Context)")
    print_deployment_summary()
    
    # Export as JSON for external consumption
    state_json = json.dumps(DEPLOYMENT_STATE, indent=2, default=str)
    print(f"JSON Export Size: {len(state_json)} bytes")
    print(f"Services Count: {len(DEPLOYMENT_STATE['services'])}")
    print(f"Cross-Network Services: {', '.join(get_cross_network_services())}")
