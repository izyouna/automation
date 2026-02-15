# Mockup-Infra + MIME-Typing Network Architecture v2.0

## Overview

This document describes the integrated architecture where the week01-mime-typing system is deployed as containerized services within mockup-infra's Podman docker-compose network.

## Network Topology

```
┌─────────────────────────────────────────────────────────────────────┐
│                     DOCKER BRIDGE NETWORKS                          │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ PUBLIC_NET (172.18.0.0/16) - External Accessible            │  │
│  │                                                               │  │
│  │  ┌─────────────────────────────────────────────────────┐    │  │
│  │  │ 172.18.0.2 - Nginx Gateway (nginx:alpine)          │    │  │
│  │  │   - Port 8080 → HTTP (public_app)                  │    │  │
│  │  │   - Port 443  → HTTPS/TLS (all services)          │    │  │
│  │  │   - Port 65432 → MIME Server (optional proxy)      │    │  │
│  │  └─────────────────────────────────────────────────────┘    │  │
│  │           ↓     ↓              ↓                             │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐
│  │  │ 172.18.0.3       │  │ 172.18.0.4       │  │ 172.18.0.5     │
│  │  │ public_app:80    │  │ mime-server:65432│  │ [Reserved]     │
│  │  │ (Python http)    │  │ (MIME Protocol)  │  │                │
│  │  └──────────────────┘  └──────────────────┘  └────────────────┘
│  │                                                                   │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ PRIVATE_NET (172.19.0.0/16) - Internal Only                 │  │
│  │                                                               │  │
│  │  ┌─────────────────────────────────────────────────────┐    │  │
│  │  │ 172.19.0.2 - Nginx Gateway (same as public_net)    │    │  │
│  │  │   - Dual-mode: L4 gateway & service endpoint       │    │  │
│  │  └─────────────────────────────────────────────────────┘    │  │
│  │           ↓              ↓                                    │  │
│  │  ┌──────────────────┐   ┌──────────────────┐               │  │
│  │  │ 172.19.0.3       │   │ 172.19.0.4       │               │  │
│  │  │ intranet_api:5000│   │ mime-client      │               │  │
│  │  │ (Python Flask)   │   │ (MIME Client)    │               │  │
│  │  └──────────────────┘   └──────────────────┘               │  │
│  │                                                               │  │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

        ↓ (Host System)

┌──────────────────────────────────────────────────────────────────┐
│ HOST MACHINE (Windows)                                            │
│                                                                    │
│  - localhost:8080 → Nginx Gateway (HTTP)                         │
│  - localhost:443  → Nginx Gateway (HTTPS/TLS)                    │
│  - localhost:65432 → Optional direct MIME access (if exposed)    │
│                                                                    │
│ Storage (Docker Named Volume)                                     │
│  - mime_storage: ← /app/storage (mime-server)                    │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

## Service Definitions

### PUBLIC_NET Services

#### 1. Nginx Gateway (172.18.0.2:80,443)
- **Role:** L7 Reverse Proxy & TLS Termination
- **Ports:** 8080→80, 443→443 (host mapped)
- **Connections:**
  - Forwards HTTP to public_app (172.18.0.3:80)
  - Forwards HTTPS to public_app via TLS (172.18.0.3:80)
  - Optional: Routes `/upload` to mime-server (172.18.0.4:65432)
- **Certs:** Self-signed RSA 2048, TLS 1.3, ./certs/ mounted

#### 2. Public App (172.18.0.3:80)
- **Role:** Public-facing HTTP service
- **Tech:** Python http.server (simple)
- **Network:** public_net only
- **Endpoints:**
  - GET `/` - Simple response
  - GET `/api/public` - JSON response
  - GET `/status` - Service status

#### 3. MIME Server (172.18.0.4:65432)
- **Role:** File transfer daemon on public network
- **Tech:** Python TCP socket server (custom protocol)
- **Network:** public_net
- **Protocol:** MIME (JSON headers + binary payload)
- **Storage:** Docker volume `mime_storage` → /app/storage
- **Commands:**
  - SEND: Client uploads file to server
  - RECEIVE: Client downloads file from server
  - LIST: Client requests file listing
- **Access:** Via Nginx proxy or direct IP (internal only, no host exposure by default)

### PRIVATE_NET Services

#### 4. Nginx Gateway (172.19.0.2:80,443)
- **Role:** Same dual-network gateway (connected to both networks)
- **Security:** Sitting on isolated private_net, prevents direct external access
- **Connections:**
  - Routes to intranet_api (172.19.0.3:5000)
  - Can reach mime-server via cross-network bridge
  - Blocks external traffic (private_net has `internal: true`)

#### 5. Intranet API (172.19.0.3:5000)
- **Role:** Internal-only API service
- **Tech:** Python Flask
- **Network:** private_net only
- **Endpoints:**
  - GET `/` - API info
  - GET `/api/private` - Requires authentication (mocked)
  - GET `/status` - Service status

#### 6. MIME Client (172.19.0.4)
- **Role:** Interactive client for file transfers
- **Tech:** Python TCP socket client (custom protocol)
- **Network:** private_net
- **Startup:** On-demand with `docker-compose --profile client-manual up`
- **Environment Variables:**
  - `MIME_SERVER_HOST=mime-server` (resolves to 172.18.0.4)
  - `MIME_SERVER_PORT=65432`
- **Interactive:** TTY attached for user input

## Network Communication Flows

### Flow 1: Client → Server (MIME File Transfer)
```
[mime-client: 172.19.0.4]
    ↓ (TCP :65432)
    ↓ (Docker DNS resolves mime-server → 172.18.0.4)
    ↓ (Cross-bridge routing via docker daemon)
[mime-server: 172.18.0.4:65432]
    ↓ (stores/retrieves file)
[mime_storage volume]
```

### Flow 2: Host → Public Services (Web)
```
[Host: localhost:8080]
    ↓ (Port mapping 8080→80)
[nginx-gateway: 172.18.0.2:80]
    ↓ (L7 routing)
[public_app: 172.18.0.3:80]
    ↓ (HTTP response)
[Host browser]
```

### Flow 3: Host → Public Services (TLS)
```
[Host: localhost:443]
    ↓ (Port mapping 443→443)
[nginx-gateway: 172.18.0.2:443 - TLS termination]
    ↓ (Decrypts HTTPS, forwards HTTP)
[public_app: 172.18.0.3:80]
    ↓ (HTTP response back to gateway)
[nginx-gateway - Re-encrypts with TLS]
    ↓ (TLS handshake 1.3)
[Host browser]
```

### Flow 4: MIME Proxy (Optional)
```
[External Client]
    ↓ (HTTP POST /upload)
[nginx-gateway: 172.18.0.2:80/443]
    ↓ (Nginx rule: /upload → mime-server:65432)
[mime-server: 172.18.0.4:65432]
    ↓ (MIME protocol)
[mime_storage]
```

## Docker-Compose Configuration

### Volumes
```yaml
volumes:
  mime_storage: {}  # Named volume for MIME server persistent storage
```

### Networks
```yaml
networks:
  public_net:
    driver: bridge
    ipam:
      config:
        - subnet: 172.18.0.0/16

  private_net:
    driver: bridge
    internal: true  # Prevents external access
    ipam:
      config:
        - subnet: 172.19.0.0/16
```

### Service Dependencies
```
nginx-gateway (depends_on: public_app, intranet_api, mime-server)
    ├─ public_app
    ├─ intranet_api
    └─ mime-server

mime-server (depends_on: nginx-gateway)
    └─ [starts after nginx]

mime-client (depends_on: mime-server, profile: client-manual)
    └─ [on-demand startup]
```

## Deployment Steps

### 1. Build All Services
```bash
cd mockup-infra
docker-compose build
```

### 2. Start Core Services (server only)
```bash
docker-compose up -d
# Starts: nginx-gateway, public_app, intranet_api, mime-server
```

### 3. Verify Services Running
```bash
docker-compose ps

# Expected output:
# NAME                COMMAND                  STATUS
# mime-server         python /app/server.py    Up (healthy)
# mime-client         -                        Exited (profile=client-manual)
# mockup-gateway      /docker-entrypoint.sh    Up
# mockup-public-web   python /app/app.py       Up
# mockup-intranet-api python /app/api.py       Up
```

### 4. Launch MIME Client (Interactive)
```bash
docker-compose --profile client-manual run --rm mime-client \
  --send /path/to/file.txt --to mime-server:65432
```

### 5. Test Cross-Network Communication
```bash
# From host, verify connectivity
docker exec mime-client ping mime-server
# Should resolve to 172.18.0.4 and succeed

# From client, connect to server
docker exec mime-client python -c "
import socket
s = socket.socket()
s.connect(('mime-server', 65432))
s.close()
print('Connected successfully')
"
```

## DNS Resolution Inside Containers

Docker provides built-in DNS service (127.0.0.11:53) that handles:

1. **Service Names:** `mime-server` resolves to service IP (172.18.0.4)
2. **Cross-Network:** mime-client (private_net) can reach mime-server (public_net) via docker's internal routing
3. **Host Resolution:** `host.docker.internal` available in newer versions

Example:
```bash
docker exec mime-client nslookup mime-server
# Server: 127.0.0.11
# Address: 127.0.0.11:53
# 
# Name: mime-server
# Address: 172.18.0.4
```

## Security Model

### Network Isolation
- **Public Net:** Externally accessible (host port mapping)
- **Private Net:** Internal only, no external access (`internal: true`)
- **Cross-Network:** Nginx gateway bridges both (acts as firewall)

### Access Control
1. **Public Services:**
   - Exposable via port mapping (8080, 443)
   - Accessible from host and external clients

2. **Private Services:**
   - No port mapping
   - Only accessible from within docker network
   - intranet_api requires authentication for sensitive endpoints

3. **MIME Server:**
   - On public_net (internal docker IP: 172.18.0.4)
   - Not directly exposed to host (no port mapping in standard config)
   - Accessible via:
     - Nginx proxy (/upload route)
     - Direct docker network access (mime-client)
     - Can enable with `ports: ["65432:65432"]` if needed

### TLS/Encryption
- **Nginx → Host:** TLS 1.3, self-signed RSA 2048
- **Docker Network:** Unencrypted (internal/trusted network)
- **Internal Services:** Optional encryption via HTTPS or application-level

## Troubleshooting

### MIME Server Not Reachable
```bash
# Check if service started
docker-compose logs mime-server

# Test connectivity from client
docker exec mime-client ping mime-server

# Test TCP port
docker exec mime-client nc -zv mime-server 65432
```

### Cross-Network Communication Failing
```bash
# Verify networks created
docker network ls | grep mockup

# Check service IP assignments
docker network inspect mockup-infra_public_net
docker network inspect mockup-infra_private_net

# Verify routing
docker exec mime-client ip route show
```

### Client Container Won't Start
```bash
# Check profile activation
docker-compose --profile client-manual ps

# Run with verbose output
docker-compose --profile client-manual up --build mime-client
```

## Configuration Files

### Dockerfile (MIME Server)
Path: `week01-mime-typing/Dockerfile`
- Base: python:3.11-slim
- Entrypoint: `python /app/server.py --host 0.0.0.0 --port 65432`
- Volumes: /app/storage (connected to mime_storage)

### Dockerfile.client (MIME Client)
Path: `week01-mime-typing/Dockerfile.client`
- Base: python:3.11-slim
- Entrypoint: Interactive shell with client script
- Environment: MIME_SERVER_HOST, MIME_SERVER_PORT

### docker-compose.yml (Main Orchestration)
Path: `mockup-infra/docker-compose.yml`
- 5 services (nginx-gateway, public_app, intranet_api, mime-server, mime-client)
- 2 networks (public_net, private_net)
- 1 volume (mime_storage)
- Service dependencies and health checks

## What's New in v2.0

| Feature | v1.0 | v2.0 |
|---------|------|------|
| MIME Deployment | Standalone on localhost | Containerized in docker-compose |
| Server Location | localhost:65432 | 172.18.0.4:65432 (public_net) |
| Client Location | localhost | 172.19.0.4 (private_net) |
| Storage | Local filesystem | Docker named volume |
| Network Access | Single machine | Cross-bridge docker networks |
| Scalability | Limited (one server) | Easy (add replicas via compose) |
| Isolation | None | Full network isolation |
| Proxy Support | No | Yes (Nginx optional) |

## Future Extensions

1. **Multiple MIME Servers:** Add replicas with load balancing
2. **Nginx Routes:** Add `/upload` → mime-server proxy rules
3. **Health Checks:** Implement HEALTH endpoint in MIME server
4. **Metrics:** Add Prometheus metrics export
5. **Logging:** Centralized logging via Docker logging drivers
6. **TLS for Internal:** Add mutual TLS between services
