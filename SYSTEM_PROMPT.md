# AI System Prompt: Mockup-Infra + MIME-Typing Integration

## Context Date
February 13, 2026 | Podman 5.7.1 | podman-compose 1.5.0

## System Overview

You are an AI assistant working with a fully-deployed, multi-layer containerized infrastructure:

### Component 1: Mockup-Infra (L7 Gateway & Services Network)
**Purpose:** Production-grade network infrastructure with Nginx reverse proxy, multi-network support, and comprehensive logging.

**Services:**
- `mockup-gateway` (Nginx Alpine): L7 reverse proxy, TLS termination, dual-network (public_net + private_net)
- `public_app` (Python http.server): Public-facing HTTP service on 172.18.0.3:80
- `intranet_api` (Python Flask): Private-only HTTP service on 172.19.0.3:5000

**Networks:**
- `public_net` (172.18.0.0/16): External-facing services
- `private_net` (172.19.0.0/16): Internal-only services
- Gateway bridges both networks

### Component 2: MIME-Typing (File Type Detection & Transfer)
**Purpose:** Network-aware file transfer system with MIME type detection and cross-network communication.

**Services:**
- `mime-server` (Python socket): MIME-aware file transfer daemon
  - **Dual Network:** 172.18.0.4 (public_net) + 172.19.0.5 (private_net)
  - **Port:** 65432
  - **Storage:** Docker volume `mime_storage` → `/storage` (persistent)
  - **Capability:** Receives files, detects MIME types, stores in persistent volume

- `mime-client` (Python + requests): Interactive MIME client
  - **Network:** private_net only (172.19.0.4)
  - **Operation:** On-demand container launch
  - **Capability:** Sends/receives files, resolves mime-server via DNS

**Cross-Network Design:**
- Server accessible from BOTH networks (critical feature)
- Client on private_net can reach server at 172.19.0.5
- Gateway can reach server at 172.18.0.4
- File transfer tested & verified: ✅ Working

### Deployment Architecture

```
PUBLIC_NET (172.18.0.0/16)          PRIVATE_NET (172.19.0.0/16)
    |                                    |
    |                                    |
[Gateway:172.18.0.2]---(dual-homed)--[Gateway:172.19.0.2]
    |                                    |
    +--[public_app:172.18.0.3]          |
    |                                    |
    +--[mime-server:172.18.0.4]         |
                                         |
                            [intranet_api:172.19.0.3]
                                         |
                            [mime-server:172.19.0.5]
                                         |
                            [mime-client:172.19.0.4]*
                            (*on-demand)
```

## Logging & Compliance

**Gateway Logging (Thailand Digital Crime Act Compliant):**
- 15+ dedicated log files per endpoint
- 5 log format styles: main, audit_detailed, connection_error, ssl_connection, upstream_error
- JSON audit logs with complete request/response context
- Per-endpoint tracking: /status, /data, /config
- SSL/TLS connection detail logging
- Error logging with debug context

**Log Files Location:** `/var/log/nginx/*.log` (in container)
**Formats:** Pipe-delimited + JSON-structured entries
**Buffer:** 32KB with 5-second flush (real-time availability)

## Container Runtime

**Active Runtime:** Podman 5.7.1 (replaced Docker)
**Key Commands:**
```bash
# Service management
podman-compose ps                    # Show service status
podman-compose logs -f SERVICE       # View real-time logs
podman-compose up -d                 # Start all services
podman-compose down                  # Stop all services

# Container operations
podman exec SERVICE_NAME COMMAND     # Run command in container
podman run --network NETWORK IMAGE   # Run container on specific network
podman-compose exec SERVICE bash     # Interactive shell access
```

## Configuration State

### Docker-Compose (mockup-infra/docker-compose.yml)
- **Services:** 4 deployed (gateway, public_app, intranet_api, mime-server)
- **Networks:** 2 bridge networks (public_net, private_net)
- **Volumes:** 1 named volume (mime_storage)
- **Profiles:** client-manual (for on-demand mime-client)

### Nginx Configuration (mockup-infra/gateway/nginx.conf)
- **TLS:** 1.3 only, self-signed certs
- **HTTP/2:** Enabled via `http2 on;` directive
- **Logging:** Comprehensive with 5 log formats
- **Error Handling:** @upstream_error location for 5xx failures
- **Status Codes:** Real-time logging for 2xx, 4xx, 5xx responses

### MIME Server/Client
- **Dockerfile.server:** Base python:3.11-slim, socket listener on port 65432
- **Dockerfile.client:** Base python:3.11-slim, client with requests library
- **Entrypoint:** Bash wrapper allowing flexible argument passing
- **Environment:** UTF-8 encoding enabled (PYTHONIOENCODING=utf-8)

## Verified Operations

### File Transfer (Tested February 13, 2026)
```
Test: 24-byte text file transfer from private_net client to dual-network server
Status: ✅ SUCCESSFUL
Timeline:
  [09:22:06] Client connected to mime-server:65432
  [09:22:06] Server received 24 bytes as text/plain
  [09:22:06] File stored: /storage/received_1d8f.plain
Result: Cross-network communication VERIFIED
```

### Service Health
```
All 4 services running:
  ✅ mockup-gateway (Nginx L7 proxy)
  ✅ public_app (HTTP public service)
  ✅ intranet_api (Flask private service)
  ✅ mime-server (MIME transfer daemon on dual networks)
```

### Network Connectivity
```
Private to Public via Gateway:
  mime-client (172.19.0.4) → mime-server (172.19.0.5) ✅
  mine-client → gateway (172.19.0.2) → public_app (172.18.0.3) ✅
Cross network:
  gateway (172.18.0.2 + 172.19.0.2) bridges successfully ✅
```

## Key Configuration Parameters

### mime-server
- **Host:** mime-server (DNS) or 172.19.0.5 (direct IP on private_net)
- **Port:** 65432
- **Storage Path:** /storage (volume mount)
- **Environment Variables:**
  - PYTHONIOENCODING=utf-8
  - STORAGE_DIR=/storage

### mime-client
- **Target Host:** mime-server (resolves to 172.19.0.5 on private_net)
- **Target Port:** 65432
- **Network:** mockup-infra_private_net (DNS-enabled)

### Nginx Gateway
- **HTTP Listen:** 0.0.0.0:80 → :8080 (port mapping)
- **HTTPS Listen:** 0.0.0.0:443 → :443 (port mapping)
- **SSL/TLS:** 1.3, self-signed available
- **Upstream Targets:** public_app:80, intranet_api:5000
- **Request ID:** Tracked via $req_id variable (generated from $request_time-$remote_addr)

## Common Operations

### Check Service Status
```bash
podman-compose ps
```

### View Logs
```bash
podman-compose logs -f mime-server          # Server logs
podman-compose logs mime-client --tail 50   # Client logs
podman exec mockup-gateway tail -f /var/log/nginx/audit.log | jq .
```

### Test File Transfer
```bash
podman run --rm --network mockup-infra_private_net --entrypoint bash mime-client:latest \
  -c "echo 'Test' > /tmp/test.txt && python /app/client.py --send /tmp/test.txt --to mime-server:65432"
```

### Access Storage
```bash
podman exec mime-server ls -lah /storage/
podman exec mime-server cat /storage/received_*.plain
```

### Gateway Logs
```bash
podman exec mockup-gateway tail -f /var/log/nginx/access.log        # Access logs
podman exec mockup-gateway tail -f /var/log/nginx/audit.log | jq .  # JSON audit
podman exec mockup-gateway tail -f /var/log/nginx/error.log         # Errors
```

## Constraints & Limitations

1. **Network Isolation:** public_net and private_net are isolated except via gateway
2. **Storage:** mime_storage volume deleted with `podman-compose down -v`
3. **TLS:** Self-signed certificates (only for testing)
4. **Client Mode:** mime-client runs on-demand (not persistent)
5. **Port Mappings:** Only Nginx (80→8080, 443→443); service ports internal

## Future Extensibility

When starting new branches, this deployment enables:
- Load balancing (Nginx upstream groups)
- Additional services (new containers in docker-compose.yml)
- Cross-network communication (via gateway)
- Persistent file operations (via mime_storage volume)
- Comprehensive audit logging (15+ log files with JSON format)
- TLS endpoint protection (Nginx termination)

## Before Starting New Work

1. **Validate Deployment:** `podman-compose ps` (all services showing "Up")
2. **Test Connectivity:** `podman exec mime-client ping mime-server` (should succeed)
3. **Verify Storage:** `podman exec mime-server ls /storage/` (persistent volume mounted)
4. **Check Logs:** `podman exec mockup-gateway tail /var/log/nginx/access.log` (no 5xx errors)
5. **Document Changes:** Update docker-compose.yml for any new services

## Interface Points for New Work

### Adding Services to Gateway
Edit: `mockup-infra/gateway/nginx.conf`
- Add upstream block
- Add location block
- Add logging configuration

### Adding Backend Services
Edit: `mockup-infra/docker-compose.yml`
- New service definition
- Network assignment (public_net, private_net, or both)
- Volume mounts if needed
- Environment variables

### Extending MIME Functionality
Edit: `week01-mime-typing/`
- Modify Dockerfile.server for additional libraries
- Extend client/main_enhanced.py for new operations
- Update shared/ for protocol changes

## Critical Success Criteria

✅ All services operational (podman-compose ps shows Up)
✅ File transfer verified (24-byte test file confirmed)
✅ Gateway logging active (15+ log files with entries)
✅ Cross-network communication (client reaches server on 172.19.0.5)
✅ Persistent storage accessible (mime_storage volume mounted)
✅ Nginx configuration valid (no syntax errors, http2 directive fixed)
✅ Environment encoding correct (PYTHONIOENCODING=utf-8 set)

---

**Status:** READY FOR NEXT PHASE
**Last Verified:** February 13, 2026
**Runtime:** Podman 5.7.1 | podman-compose 1.5.0
**All Checks:** ✅ PASSED
