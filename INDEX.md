# 📚 Complete Project Index & Navigation

## Quick Navigation

### 🚀 Getting Started (Pick One)

| Goal | File | Time |
|------|------|------|
| **Run everything immediately** | [QUICK_START.md](./QUICK_START.md) | 2 min |
| **Understand architecture** | [ARCHITECTURE.md](./ARCHITECTURE.md) | 10 min |
| **Full guided integration** | [INTEGRATION.md](./week01-mime-typing/INTEGRATION.md) | 30 min |
| **Learn about Mockup-Infra** | [mockup-infra/README.md](./mockup-infra/README.md) | 20 min |
| **Learn about MIME-Typing** | [week01-mime-typing/README.md](./week01-mime-typing/README.md) | 15 min |

---

## 📁 Project Structure

```
D:\boonsup\automation\
│
├── 🎯 MAIN PROJECTS
│
├── mockup-infra/                      ← OSI Layers 3-7 simulation
│   ├── manage.py                      (🟢 Main orchestrator)
│   ├── README.md                      (📖 Full documentation)
│   ├── SHELL_INTEGRATION.md           (⚙️ Shell setup guides)
│   ├── docker-compose.yml             (🐳 Container config)
│   ├── services/                      (📦 App containers)
│   │   ├── public_app/               (HTTP server)
│   │   └── intranet_api/             (REST API)
│   ├── gateway/nginx.conf            (🌐 Reverse proxy)
│   ├── certs/                        (🔐 TLS certificates)
│   ├── .bashrc                       (⚙️ Bash integration)
│   ├── init-powershell.ps1           (⚙️ PowerShell integration)
│   ├── manage.bat                    (⚙️ CMD wrapper)
│   └── init.bash                     (🔧 Complete setup script)
│
├── week01-mime-typing/                ← TCP file transfer
│   ├── manage-mime.py                (🟢 NEW: Main orchestrator)
│   ├── README.md                     (📖 Original documentation)
│   ├── INTEGRATION.md                (🔗 NEW: Integration guide)
│   ├── server/                       (📦 Server implementations)
│   │   ├── main.py                  (Basic version)
│   │   ├── main_enhanced.py         (Enhanced version)
│   │   └── main_threaded.py         (Concurrent version)
│   ├── client/                       (📦 Client implementations)
│   │   ├── main.py                  (Basic version)
│   │   └── main_enhanced.py         (Enhanced version)
│   ├── shared/                       (📦 Shared protocol)
│   │   └── protocol.py              (MIME protocol definition)
│   ├── assets/                       (📁 Test files)
│   │   ├── notes.txt                (Sample text)
│   │   └── sample.png               (Sample image)
│   └── storage/                      (📁 Received files)
│
├── week01-tcp-client-server-basic/    ← Basic TCP concepts
│   ├── README.md                     (📖 Documentation)
│   ├── server.py                     (Single-threaded server)
│   ├── server_threaded.py            (Multi-threaded server)
│   ├── client.py                     (TCP client)
│   ├── config.py                     (Shared config)
│   └── test_concurrent.py            (Unit tests)
│
├── 📖 DOCUMENTATION (TOP-LEVEL)
│
├── QUICK_START.md                    (⭐ Start here!)
├── ARCHITECTURE.md                   (System design overview)
├── INDEX.md                          (This file)
├── demo-integration.py               (🟢 Interactive launcher)
│
├── 🔧 SHELL SCRIPTS
│
├── init.bash                         (Bash initialization)
├── init-powershell.ps1              (PowerShell initialization)
├── manage.bat                        (CMD wrapper)
│
└── 📁 OTHER DIRECTORIES
    ├── fix_test.py                  (Utility)
    ├── fix_infra.py                 (Utility)
    └── .git/                        (Version control)
```

---

## 🎓 Learning Paths

### Path 1: Quick Demo (5 minutes)

1. Open [QUICK_START.md](./QUICK_START.md)
2. Run three terminal commands
3. See both systems working together
4. Observe files transferred

### Path 2: Understand Architecture (20 minutes)

1. Read [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Review OSI layers diagram
3. Understand each component
4. See how they integrate

### Path 3: Full Guided Setup (1 hour)

1. Read [QUICK_START.md](./QUICK_START.md)
2. Follow [mockup-infra/README.md](./mockup-infra/README.md) setup
3. Follow [week01-mime-typing/INTEGRATION.md](./week01-mime-typing/INTEGRATION.md) integration
4. Run tests: `python manage-mime.py test-with-infra`
5. Review logs and results

### Path 4: Deep Dive (2-3 hours)

1. Study [mockup-infra/README.md](./mockup-infra/README.md) (15 min)
2. Review Nginx config in `mockup-infra/gateway/nginx.conf` (10 min)
3. Study [week01-mime-typing/README.md](./week01-mime-typing/README.md) (15 min)
4. Review protocol specs in `shared/protocol.py` (10 min)
5. Read code:
   - `mockup-infra/manage.py` (30 min)
   - `week01-mime-typing/manage-mime.py` (30 min)
6. Run interactive demo: `python demo-integration.py` (30 min)

### Path 5: Shell Integration (30 minutes)

1. Read [mockup-infra/SHELL_INTEGRATION.md](./mockup-infra/SHELL_INTEGRATION.md)
2. Choose your shell (PowerShell, Bash, or CMD)
3. Run setup commands
4. Use quick aliases: `minit`, `mdeploy`, `mtest`

---

## 🚀 Executable Commands

### Management CLIs

| Project | Command | Purpose |
|---------|---------|---------|
| Mockup-Infra | `python manage.py COMMAND` | Orchestrate network stack |
| MIME-Typing | `python manage-mime.py COMMAND` | Manage file transfer |
| Integration | `python demo-integration.py` | Launch guided demo |

### Common Workflows

```powershell
# === MOCKUP-INFRA ===
cd mockup-infra
python manage.py init           # Initialize (certs, networks)
python manage.py deploy         # Deploy containers
python manage.py test           # Test 5 endpoints (should see 5/5)
python manage.py status         # Check running services
python manage.py stop           # Stop containers
python manage.py help           # See all commands

# === MIME-TYPING ===
cd week01-mime-typing
python manage-mime.py server              # Start server (:65432)
python manage-mime.py client              # Send default files
python manage-mime.py client file1 file2  # Send custom files
python manage-mime.py test-integration    # Test MIME protocol
python manage-mime.py test-with-infra     # Test with mockup-infra
python manage-mime.py status              # Check services
python manage-mime.py clean               # Clean received files

# === SHELL SHORTCUTS (if integrated) ===
minit                           # mockup-infra init
mdeploy                         # mockup-infra deploy
mtest                           # mockup-infra test
mstatus                         # Check status
mlogs                           # View logs

# === INTEGRATION DEMO ===
cd ..
python demo-integration.py      # Interactive guided demo
```

---

## 📊 Status Monitoring

### Check Everything

```powershell
# From week01-mime-typing directory
python manage-mime.py status

# Output shows:
# ✓ MIME Server RUNNING (127.0.0.1:65432)
# ✓ Mockup-Infra RUNNING (127.0.0.1:8080)
```

### View Service Details

```powershell
# Mockup-Infra
cd mockup-infra
python manage.py status         # Show containers

# MIME Server
cd week01-mime-typing
python manage-mime.py status    # Show port status
```

---

## 🧪 Testing Strategy

| Test | Command | Validates |
|------|---------|-----------|
| **Basic** | `python manage-mime.py test-basic` | MIME protocol works |
| **Integration** | `python manage-mime.py test-integration` | Server + client work |
| **With Infra** | `python manage-mime.py test-with-infra` | Both systems work together |
| **Mockup** | `python manage.py test` | All 5 endpoints (must show 5/5) |

---

## 📚 Documentation Map

### For Different Audiences

| Audience | Start Here | Then Read | Finally Try |
|----------|-----------|-----------|-------------|
| **Impatient User** | [QUICK_START.md](./QUICK_START.md) | Nothing | Run immediately |
| **Developer** | [ARCHITECTURE.md](./ARCHITECTURE.md) | Code files | Run tests |
| **Student** | [mockup-infra/README.md](./mockup-infra/README.md) | [ARCHITECTURE.md](./ARCHITECTURE.md) | Follow path 3 |
| **System Admin** | [mockup-infra/README.md](./mockup-infra/README.md) | [SHELL_INTEGRATION.md](./mockup-infra/SHELL_INTEGRATION.md) | Setup shells |
| **Network Engineer** | [ARCHITECTURE.md](./ARCHITECTURE.md) | Nginx config | Analyze traffic |

---

## 🔧 Customization

### Change Ports

**Mockup-Infra:**
```bash
# Edit mockup-infra/.env
HOST_PORT=8080          # Change HTTP port
GATEWAY_PORT=443        # Change HTTPS port
```

**MIME Server:**
```bash
# Edit manage-mime.py → server_start()
# Change port in function call
python manage-mime.py server --port 9999
```

### Add Custom Files to Transfer

```bash
# Copy files to week01-mime-typing/assets/
cp myfile.txt week01-mime-typing/assets/

# Then use:
python manage-mime.py client ../assets/myfile.txt

# Or send any file:
python manage-mime.py client /path/to/file.zip
```

### Change Storage Location

```bash
# Edit manage-mime.py
# Change STORAGE_DIR = PROJECT_ROOT / 'storage'
# To: STORAGE_DIR = Path('/custom/path')
```

---

## ❓ FAQ

**Q: Can I run both without 3 terminals?**
A: Yes, use `demo-integration.py` which manages everything.

**Q: How do I stop services?**
A: Mockup-Infra: `python manage.py stop`
   MIME: Ctrl+C or use `netstat` to find PID

**Q: What if ports conflict?**
A: Use `python manage-mime.py server --port XXXX` for custom port

**Q: Can I integrate MIME into mockup-infra's docker?**
A: Yes, add to `docker-compose.yml` and modify nginx config (advanced)

**Q: Where do received files go?**
A: `week01-mime-typing/storage/received_XXXX.ext`

**Q: How do I clean up?**
A: `python manage-mime.py clean` for files
   `python manage.py stop` for mockup-infra

---

## 🎯 Recommended Starting Point

### For Everyone: 5-Minute Quick Start

```powershell
# Step 1: Open QUICK_START.md
cat QUICK_START.md

# Step 2: Terminal 1 - Mockup-Infra
cd mockup-infra && python manage.py deploy

# Step 3: Terminal 2 - MIME Server  
cd week01-mime-typing && python manage-mime.py server

# Step 4: Terminal 3 - MIME Client
cd week01-mime-typing && python manage-mime.py client

# Step 5: Verify
cd week01-mime-typing && python manage-mime.py status
```

Result: Both systems running, files transferred! ✅

---

## 📞 Support

- **Mockup-Infra issues:** See [mockup-infra/README.md](./mockup-infra/README.md) → Troubleshooting
- **MIME issues:** See [week01-mime-typing/INTEGRATION.md](./week01-mime-typing/INTEGRATION.md) → Troubleshooting
- **Integration issues:** See [ARCHITECTURE.md](./ARCHITECTURE.md) → Troubleshooting Flow

---

## 📈 Next Steps After Initial Success

1. **Explore:** Read ARCHITECTURE.md to understand design
2. **Customize:** Modify ports, files, or configuration
3. **Extend:** Add features to either system
4. **Integrate:** Connect MIME to mockup-infra's HTTP layer (advanced)
5. **Deploy:** Use Podman to containerize MIME server

---

**Version:** 1.0 | **Status:** ✅ Complete & Ready
**Last Updated:** February 2026
**Platforms:** Windows (PowerShell/CMD), Linux, macOS

---

## Quick Links

- 🚀 [QUICK_START.md](./QUICK_START.md) - Start here!
- 📐 [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- 🔗 [week01-mime-typing/INTEGRATION.md](./week01-mime-typing/INTEGRATION.md) - Full integration guide
- 📖 [mockup-infra/README.md](./mockup-infra/README.md) - Network stack docs
- ⚙️ [mockup-infra/SHELL_INTEGRATION.md](./mockup-infra/SHELL_INTEGRATION.md) - Shell setup
- 🎮 [demo-integration.py](./demo-integration.py) - Interactive demo

---

**⭐ If you found this helpful, the architecture demonstrates how real infrastructure is built: Independent systems, clear interfaces, no magic!**
