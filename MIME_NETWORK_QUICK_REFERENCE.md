# MIME-Typing Network Integration: Quick Reference

**Runtime:** Podman 5.7.1 | **Orchestration:** podman-compose 1.5.0

## Status Check

```bash
# Check all services running
podman-compose ps

# View logs
podman-compose logs -f mime-server
podman-compose logs -f mime-client

# Check MIME server is listening on both networks
podman exec mime-server ss -tlnp

# Verify network connectivity from client
podman exec mime-client ping -c 1 mime-server
```

## Quick Start: Full Integration

### 1. Initial Setup (First Time Only)
```bash
cd d:\boonsup\automation\mockup-infra

# Build all services
podman-compose build

# Start core services
podman-compose up -d

# Verify all running (4 services: gateway, public_app, intranet_api, mime-server)
podman-compose ps
```

### 2. Test File Transfer

#### Option A: Via Manual MIME Client Container
```bash
# Start interactive client on private_net
podman-compose --profile client-manual run --rm mime-client

# Inside container shell:
# python /app/client.py --send /path/to/file.txt --to mime-server:65432
# python /app/client.py --receive filename.txt --from mime-server:65432
# python /app/client.py --list --from mime-server:65432
```

#### Option B: Via Host Command
```bash
# Send file from host (requires local MIME client)
cd d:\boonsup\automation\week01-mime-typing
python client/main_enhanced.py --send C:\path\to\file.txt --to localhost:65432
```

#### Option C: Direct Podman Run (Verified Working)
```bash
# Run client directly on private_net
podman run --rm --network mockup-infra_private_net mime-client:latest \
  python /app/client.py --send /tmp/test.txt --to mime-server:65432

# Use entrypoint bash wrapper for flexibility
podman run --rm --network mockup-infra_private_net --entrypoint bash mime-client:latest \
  -c "echo 'Test data' > /tmp/test.txt && python /app/client.py --send /tmp/test.txt --to mime-server:65432"
```

## Service Startup/Shutdown

### Start All Services
```bash
cd mockup-infra
podman-compose up -d
```

### Stop All Services
```bash
podman-compose down
```

### Stop with Volume Cleanup
```bash
podman-compose down -v  # Removes named volumes
```

### Restart Specific Service
```bash
podman-compose restart mime-server
podman-compose restart mime-client
```

## Client Interaction Examples

### List Files on Server
```bash
# From private_net container (uses 172.19.0.5)
podman exec mime-client python /app/client.py --list --from mime-server:65432

# Or connect directly to private_net IP
podman exec mime-client python /app/client.py --list --from 172.19.0.5:65432

# Expected output:
# [OK] Connected to mime-server:65432
# [LIST] Files on server:
#   - document.pdf (2.5 MB, 2024-01-15)
#   - archive.zip (500 KB, 2024-01-14)
#   - received_1d8f.plain (24 bytes, 2026-02-13)
```

### Send File from Private to Public Network (Tested & Working)
```bash
# Create test file in client container
podman exec mime-client bash -c 'echo "Hello from MIME client!" > /tmp/test.txt'

# Send to server on private_net (172.19.0.5)
podman exec mime-client python /app/client.py \
  --send /tmp/test.txt \
  --to mime-server:65432

# Expected output:
# [09:22:06] INFO: Starting client with 1 files to mime-server:65432
# [09:22:06] INFO: Connected to mime-server:65432
# [09:22:06] INFO: Sent /tmp/test.txt (24 bytes) as text/plain
# [09:22:06] INFO: Connection closed. Sent: 1, Failed: 0
# [OK] File transferred successfully
```

### Receive File from Public to Private Network
```bash
# List available files on server
podman exec mime-client python /app/client.py --list --from mime-server:65432

# Download specific file
podman exec mime-client python /app/client.py \
  --receive "received_1d8f.plain" \
  --from mime-server:65432 \
  --output /tmp/downloaded.txt

# Verify
podman exec mime-client cat /tmp/downloaded.txt
```

## Debugging

### Check Service Logs
```bash
# MIME Server
podman-compose logs mime-server

# All services
podman-compose logs -f

# Specific line count
podman logs mime-server --tail 50
```

### Verify Network Connectivity
```bash
# From inside mime-client container (on private_net)
podman exec mime-client bash -c "
  echo 'Testing connectivity to mime-server...'
  ping -c 1 mime-server && echo '[OK] Ping successful'
  nc -zv mime-server 65432 && echo '[OK] Port 65432 open'
  nslookup mime-server
"

# Or directly to private_net IP
podman exec mime-client ping -c 1 172.19.0.5
```

### Check Podman Network Status
```bash
# List networks
podman network ls | grep mockup

# Inspect network details
podman network inspect mockup-infra_public_net
podman network inspect mockup-infra_private_net

# Check IP assignments (note: mime-server dual-network)
podman inspect mime-server | grep -i ipaddr
podman inspect mime-client | grep -i ipaddr

# Expected mime-server IPs:
# - public_net:  172.18.0.4
# - private_net: 172.19.0.5
```

### Container Exit Codes
```bash
# Check exit status
podman-compose ps mime-client

# View container logs on exit
podman-compose logs mime-client --tail 100

# Run in foreground to see errors
podman-compose --profile client-manual run --rm mime-client python /app/client.py --help
```

## Performance Monitoring

### Check Container Resource Usage
```bash
podman stats mime-server mime-client
```

### Monitor File Transfer
```bash
# Large file transfer (test bandwidth)
podman exec mime-server dd if=/dev/zero of=/app/storage/largefile.bin bs=1M count=100

podman exec mime-client python /app/client.py \
  --receive largefile.bin \
  --from mime-server:65432 \
  --output /tmp/received.bin

# Check transfer time and size
podman exec mime-client ls -lh /tmp/received.bin
```

## Advanced: Environment Variables

### MIME Server (Dual Network: public_net + private_net)
```bash
# In docker-compose.yml or via -e flag
PYTHONIOENCODING=utf-8           # UTF-8 console output
STORAGE_DIR=/storage             # Storage directory (volume mount)
MIME_STORAGE_PATH=/app/storage   # Storage directory (alternate path)
TLS_USE_HTTPS=false              # Optional future feature
TLS_CERT=/app/certs/server.crt   # Optional future feature

# Network Configuration:
# public_net:  172.18.0.4  (connected to Nginx gateway)
# private_net: 172.19.0.5  (reachable by mime-client)
```

### MIME Client (Private Network Only)
```bash
MIME_SERVER_HOST=mime-server      # Server hostname on private_net
MIME_SERVER_PORT=65432           # Server port
PYTHONIOENCODING=utf-8            # UTF-8 console output
CLIENT_TIMEOUT=30                 # Connection timeout (seconds)

# Network Configuration:
# private_net: 172.19.0.4 (can reach mime-server at 172.19.0.5)
```

## Cleanup & Maintenance

### Remove Stopped Containers
```bash
podman-compose down
podman container prune  # Removes stopped containers
```

### Clear MIME Storage Volume
```bash
# WARNING: This deletes all stored files
podman-compose down -v

# Or selective cleanup
podman exec mime-server rm -rf /storage/*
```

### Rebuild Services
```bash
# Full rebuild (invalidates cache)
podman-compose build --no-cache mime-server mime-client

# Then restart
podman-compose up -d
```

### Check Disk Usage
```bash
# Podman volumes
podman volume ls
podman volume inspect mockup-infra_mime_storage

# Calculate size
podman run --rm -v mockup-infra_mime_storage:/volume alpine \
  du -sh /volume
```

## Service Health Check

### MIME Server Health Check (Direct Connection)
```bash
# Connect to private_net IP from client
podman exec mime-client bash -c "
  (echo 'PING' && sleep 1) | nc 172.19.0.5 65432 && echo '[OK] Server responding'
"

# Alternative: Connect via hostname on private_net
podman exec mime-client bash -c "
  (echo 'PING' && sleep 1) | nc mime-server 65432 && echo '[OK] Server responding'
"
```

### Verify File Storage
```bash
# Check files stored on mime-server (mounted at /storage)
podman exec mime-server ls -lah /storage/

# Check file size and modification time
podman exec mime-server stat /storage/received_1d8f.plain
```

## Integration with CI/CD

### Health Check Script
```bash
#!/bin/bash
# Check all services running
podman-compose ps | grep "Up" || exit 1

# Test MIME connectivity from private_net
podman exec mime-client timeout 5 bash -c \
  "(echo 'PING' && sleep 1) | nc mime-server 65432" || exit 2

echo "[OK] All health checks passed"
```

### Automated Integration Test
```bash
cd mockup-infra

# Start services
podman-compose up -d

# Wait for startup
sleep 5

# Run MIME file transfer test
podman run --rm --network mockup-infra_private_net --entrypoint bash mime-client:latest \
  -c "echo 'Test data' > /tmp/test.txt && python /app/client.py --send /tmp/test.txt --to mime-server:65432"

# Verify file received
podman exec mime-server ls -lah /storage/

# Cleanup
podman-compose down
```

## Quick Troubleshooting Matrix

| Problem | Solution |
|---------|----------|
| MIME Server won't start | Check logs: `podman-compose logs mime-server` |
| Client can't reach server | Verify DNS: `podman exec mime-client nslookup mime-server` |
| Client on different network? | Check mime-server dual-network config - should have 172.19.0.5 on private_net |
| File transfer timeout | Check storage volume: `podman exec mime-server ls -la /storage/` |
| Port 65432 already in use | Change port in docker-compose.yml or kill process on host |
| Unicode/Emoji errors | Verify `PYTHONIOENCODING=utf-8` environment variable set |
| Container exits immediately | Check entrypoint script: `podman logs mime-client` |
| Storage not persisting | Verify volume mount: `podman inspect mime-server \| grep -A 5 Mounts` |

## Useful Podman Compose Commands

```bash
# View service definition
podman-compose config --services

# Validate compose file
podman-compose config

# Build specific service
podman-compose build mime-server

# Pull only (don't build local)
podman-compose pull

# Force recreate containers
podman-compose up -d --force-recreate

# View resource usage
podman stats

# Exec into container
podman-compose exec mime-server bash
```

## Network Architecture Summary

**public_net (172.18.0.0/16):**
- Nginx Gateway: 172.18.0.2
- Public App: 172.18.0.3
- MIME Server: 172.18.0.4 (reachable from Nginx)

**private_net (172.19.0.0/16):**
- Nginx Gateway: 172.19.0.2
- Intranet API: 172.19.0.3
- MIME Server: 172.19.0.5 (reachable from Client)
- MIME Client: 172.19.0.4 (on-demand)

**Critical:** MIME Server on BOTH networks enables cross-network file transfer.

## Next Steps

1. **Verify Services Running:**
   ```bash
   podman-compose ps
   ```

2. **Test Basic Connectivity:**
   ```bash
   podman exec mime-client ping mime-server
   ```

3. **Try File Transfer:**
   ```bash
   podman exec mime-client python /app/client.py --help
   ```

4. **Check Logs for Errors:**
   ```bash
   podman-compose logs --tail 50
   ```

5. **Monitor File Storage:**
   - Check received files: `podman exec mime-server ls -lah /storage/`
   - View file contents: `podman exec mime-server cat /storage/received_*.plain`
