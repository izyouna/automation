# Getting Started: Integrated Mockup-Infra Environment

## 🎯 Architectural Overview

Your `mockup-infra` environment is now a multi-week laboratory. It uses **Docker Compose Profiles** to isolate curriculum domains (Week 01, Week 03, etc.).

- **Infrastructure Core**: Nginx Gateway, Public Web, Intranet API (Always running)
- **Week 01 Profile**: MIME Server/Client for Layer 4 TCP study
- **Week 02 Profile**: Stateful/Stateless APIs for Session management (Deprecated)
- **Week 03 Profile**: Microservices (Upload, Processing, AI) for Distributed Systems

## 📋 What You Need to Do

### Step 1: Build the Services (First Time Only)
```bash
cd d:\boonsup\automation\mockup-infra
docker-compose build
```

**Expected output:**
```
Building mime-server ...
Building mime-client ...
Building public_app ...
Building intranet_api ...
Successfully tagged mime-server:latest
Successfully tagged mime-client:latest
```

### Step 2: Start the Environment (Current Week Focus)

For Week 03 students:
```powershell
podman-compose --profile week03 up -d
```

For Week 01 students:
```powershell
podman-compose --profile week01 up -d
```

**Expected output (Week 03):**
```
[+] Running 6/6
  ✔ Container mockup-gateway         Started
  ✔ Container mockup-public-web      Started
  ✔ Container mockup-intranet-api    Started
  ✔ Container upload-service         Started
  ✔ Container processing-service     Started
  ✔ Container ai-service             Started
```

### Step 3: Verify Everything is Running
```bash
docker-compose ps
```

**Expected output:**
```
NAME               COMMAND                  STATUS
mime-server        python server/...        Up (healthy)
mime-client        -                        Exited (expected - manual)
mockup-gateway     /docker-entrypoint.sh    Up
mockup-public-web  python /app/app.py       Up
mockup-intranet... python /app/api.py       Up
```

### Step 4: Test Server Connectivity (Optional)
```bash
docker exec mime-server ss -tlnp | grep 65432
```

**Expected output:**
```
LISTEN    127.0.0.1:65432    0    5    appuser    python
```

### Step 5: Launch the Interactive MIME Client
```bash
docker-compose --profile client-manual run --rm mime-client
```

**Expected prompt:**
```
Usage: python /app/client.py [OPTIONS]

Options:
  --send FILE          File to send
  --receive FILE       File to receive
  --list              List files on server
  --from HOST:PORT    Server address
  --to HOST:PORT      Server address
  --output FILE       Output file path
  --help              Show help message
```

### Step 6: Try a File Transfer

#### Option A: Send a File (Inside Client Container)
```bash
# Create a test file
docker exec mime-client bash -c 'echo "Hello from private network!" > /tmp/test.txt'

# Send it to the MIME server
docker exec mime-client python /app/client.py \
  --send /tmp/test.txt \
  --to mime-server:65432
```

#### Option B: List Files
```bash
docker exec mime-client python /app/client.py \
  --list --from mime-server:65432
```

#### Option C: Receive a File
```bash
docker exec mime-client python /app/client.py \
  --receive test.txt \
  --from mime-server:65432 \
  --output /tmp/received.txt
```

## 🧪 Quick Tests

### Test 1: Network Connectivity
```bash
# Can client reach server?
docker exec mime-client ping -c 1 mime-server

# Expected: "1 packet received"
```

### Test 2: DNS Resolution
```bash
# Does DNS resolve mime-server?
docker exec mime-client nslookup mime-server

# Expected: "Address: 172.18.0.4"
```

### Test 3: TCP Port Open
```bash
# Is port 65432 listening?
docker exec mime-client nc -zv mime-server 65432

# Expected: "Success!"
```

### Test 4: File Persistence
```bash
# Check storage after transfer
docker exec mime-server ls -lh /storage/

# Should show uploaded files
```

## 📚 Documentation

Three new guides have been created:

1. **[NETWORK_ARCHITECTURE_V2.md](./NETWORK_ARCHITECTURE_V2.md)** (600+ lines)
   - Complete network topology diagrams
   - Service definitions and roles
   - Communication flows
   - Configuration details
   - Troubleshooting guide

2. **[MIME_NETWORK_QUICK_REFERENCE.md](./MIME_NETWORK_QUICK_REFERENCE.md)** (400+ lines)
   - Quick start commands
   - Common operations
   - Debugging tips
   - Troubleshooting matrix
   - CI/CD integration examples

3. **[PHASE_8_COMPLETION_SUMMARY.md](./PHASE_8_COMPLETION_SUMMARY.md)**
   - What changed
   - Why it matters
   - How to use it
   - Next steps

## 🔧 Common Commands

```bash
# View all logs
docker-compose logs -f

# View just MIME server logs
docker-compose logs -f mime-server

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Restart a service
docker-compose restart mime-server

# Rebuild a single service
docker-compose build mime-server

# Run a command in a container
docker exec mime-server ls /storage/

# Interactive shell in container
docker exec -it mime-client bash
```

## ✅ Checklist for First-Time Setup

- [ ] Read this Getting Started guide
- [ ] Run `docker-compose build` in mockup-infra/
- [ ] Run `docker-compose up -d`
- [ ] Verify with `docker-compose ps`
- [ ] Test connectivity with ping test
- [ ] Launch client and try file transfer
- [ ] Check storage for uploaded files
- [ ] Review NETWORK_ARCHITECTURE_V2.md for details
- [ ] Keep MIME_NETWORK_QUICK_REFERENCE.md handy for operations

## 🆘 Troubleshooting Quick Fixes

| Problem | Quick Fix |
|---------|-----------|
| Services won't start | `docker-compose logs -f` to see error |
| Client can't reach server | `docker exec mime-client ping mime-server` |
| Port 65432 already in use | `docker-compose down -v` first |
| Storage file not found | Check path: should be in `/storage/` on server |
| Unicode/Emoji errors | Already fixed! UTF-8 encoding configured |
| Container exits immediately | Check logs: `docker-compose logs mime-client` |

## 📞 Need Help?

### For Architecture Questions
→ See [NETWORK_ARCHITECTURE_V2.md](./NETWORK_ARCHITECTURE_V2.md)

### For Operational Questions
→ See [MIME_NETWORK_QUICK_REFERENCE.md](./MIME_NETWORK_QUICK_REFERENCE.md)

### For Troubleshooting
→ Jump to troubleshooting section in either doc

### For Integration Details
→ See existing [INTEGRATION.md](./week01-mime-typing/INTEGRATION.md)

## 🚀 What's Next?

After successful deployment:

1. **Test with Large Files:** Upload 50-100 MB files to test bandwidth
2. **Configure Nginx Proxy:** Add `/upload` endpoint to gateway config (optional)
3. **Add Health Checks:** Implement `/health` endpoint in MIME server
4. **Enable TLS for Internal:** Add mutual TLS between services (optional)
5. **Setup Monitoring:** Add container metrics/logging (optional)
6. **Create CI/CD Pipeline:** Automate build and deployment

## 📊 Network Summary

```
╔═══════════════════════════════════╗
║    PUBLIC_NET (172.18.0.0/16)     ║
║  ╔─────────────────────────────╗  ║
║  │  Nginx Gateway              │  ║
║  │  • Ports: 8080, 443         │  ║
║  │  • IP: 172.18.0.2           │  ║
║  ╚─────────────────────────────╝  ║
║  ├─ Public App (172.18.0.3:80)    ║
║  └─ MIME Server (172.18.0.4:65432)║
╚═══════════════════════════════════╝
              ↕ (Docker Bridge)
╔═══════════════════════════════════╗
║   PRIVATE_NET (172.19.0.0/16)     ║
║  (internal: true, no external)    ║
║  ├─ Nginx Gateway (172.19.0.2)    ║
║  ├─ Intranet API (172.19.0.3:5000)║
║  └─ MIME Client (172.19.0.4)      ║
╚═══════════════════════════════════╝
```

## 💡 Key Features

✅ **Containerized:** MIME runs in isolated Docker containers  
✅ **Networked:** Proper network segmentation (public/private)  
✅ **Persistent:** Files survive container restarts (Docker volume)  
✅ **Secure:** Non-root user, isolated networks  
✅ **Manageable:** Single compose file controls everything  
✅ **Scalable:** Easy to add replicas or modify configuration  
✅ **Documented:** 1000+ lines of documentation  

## 🎓 Learning Points

This integration demonstrates:
- Docker multi-network architecture
- Service orchestration with docker-compose
- Cross-network container communication
- Docker DNS resolution
- Volume persistence
- Service dependencies
- Environment variable configuration
- Container security best practices

---

**Status:** ✅ Ready to Deploy

**First Command:** `cd mockup-infra && docker-compose build && docker-compose up -d`

**Estimated Time to First Success:** 10-15 minutes
