# AI CONTEXT ASSETS: Quick Start Guide

**Last Updated:** February 13, 2026  
**Status:** Ready for next branch  
**Files Created:** 5 comprehensive context documents

---

## What's in This AI Context Package?

After successful deployment of mockup-infra + mime-typing integration, the following AI-ready assets have been created:

### 1. **SYSTEM_PROMPT.md** (Primary System Prompt)
The main document for AI context. Contains:
- Complete system overview
- Service descriptions and network architecture
- Configuration state and parameters
- Verified operations and testing results
- Common operations and troubleshooting
- Interface points for new work

**Use:** Load this first when starting new work

### 2. **AI_DIGEST.md** (Executive Summary)
High-level digest of the entire system. Contains:
- System state at a glance
- Architecture diagram
- Deployment inventory
- Verification & testing results
- Logging system documentation
- Critical design decisions
- Decision matrix for new work

**Use:** Quick reference for system overview

### 3. **DEPLOYMENT_STATE.py** (Code-based State)
Python module capturing deployment state as executable code. Contains:
- Service definitions as dictionaries
- Network configurations
- Verified operations record
- Helper functions for querying
- Validation logic
- Pretty-printing functions

**Use:** Programmatic access to deployment state; can be imported or executed

### 4. **ARCHITECTURE_MANIFEST.json** (Machine-Readable Config)
JSON manifest of complete deployment. Contains:
- Service configurations
- Network definitions
- Volume specifications
- Verification checklist
- Deployment commands
- Critical success criteria

**Use:** Machine parsing, API integration, CI/CD pipelines

### 5. **ai_context.py** (Importable Library)
Python library providing programmatic interface to all deployment information. Contains:
- DeploymentContext class (central context object)
- Service and NetworkConfig data classes
- ArchitectureDecisionEngine (architectural recommendations)
- PodmanCommandBuilder (command generation)
- Utility functions for AI systems
- Can be imported: `from ai_context import DEPLOYMENT, DECISION_ENGINE, COMMANDS`

**Use:** Write Python code that needs to understand/interact with the deployment

---

## Quick Start Workflow

### For AI Systems Starting New Work:

1. **Load Context**
   ```python
   from ai_context import DEPLOYMENT, DECISION_ENGINE
   
   # Get service info
   mime_server = DEPLOYMENT.get_service('mime-server')
   print(f"MIME Server IP on private_net: {[n.ipv4 for n in mime_server.networks if 'private' in n.name]}")
   
   # Get architectural recommendation
   recommendations = DECISION_ENGINE.recommend_configuration('file-transfer')
   ```

2. **Review System State**
   ```bash
   python DEPLOYMENT_STATE.py
   ```

3. **Understand Architecture**
   - Read: SYSTEM_PROMPT.md (Sections: Architecture Diagram, Logging & Compliance)
   - Reference: ARCHITECTURE_MANIFEST.json (networks, services, volumes)

4. **Verify Current State**
   ```bash
   podman-compose ps
   podman exec mime-client ping mime-server
   ```

5. **Document New Changes**
   - If adding service: Update docker-compose.yml, SYSTEM_PROMPT.md
   - If adding endpoint: Update nginx.conf, SYSTEM_PROMPT.md
   - If changing config: Update DEPLOYMENT_STATE.py, ai_context.py

---

## File References

### Know What You Need?

**"I need to know what services are running"**
→ Read: SYSTEM_PROMPT.md (Component 1 & 2 sections)
→ Run: `python DEPLOYMENT_STATE.py`
→ Command: `podman-compose ps`

**"I need to add a new service"**
→ Read: AI_DIGEST.md (Decision Matrix for New Work)
→ Review: ARCHITECTURE_MANIFEST.json (services section)
→ Edit: mockup-infra/docker-compose.yml + update ai_context.py

**"I need to expose a service externally"**
→ Read: SYSTEM_PROMPT.md (Key Configuration Parameters)
→ Edit: mockup-infra/gateway/nginx.conf (add upstream + location)
→ Reference: AI_DIGEST.md (Network Isolation section)

**"I need to understand the file transfer"**
→ Read: SYSTEM_PROMPT.md (Component 2: MIME-Typing)
→ Check: AI_DIGEST.md (Verification & Testing section)
→ Command: `podman run --rm --network mockup-infra_private_net --entrypoint bash mime-client:latest -c "echo 'Test' > /tmp/test.txt && python /app/client.py --send /tmp/test.txt --to mime-server:65432"`

**"I need logging information"**
→ Read: SYSTEM_PROMPT.md (Logging & Compliance section)
→ Reference: ARCHITECTURE_MANIFEST.json (logging section)
→ Command: `podman exec mockup-gateway tail -f /var/log/nginx/audit.log | jq .`

**"I need to understand network layout"**
→ Read: DEPLOYED ASSETS (Architecture Diagram section)
→ Review: ARCHITECTURE_MANIFEST.json (networks section)
→ Reference: ai_context.py (NetworkConfig dataclass)

---

## Context Asset Cheat Sheet

### When Starting New Code:

```python
# Import the AI context library
from ai_context import DEPLOYMENT, DECISION_ENGINE, COMMANDS

# 1. Get current deployment state
summary = DEPLOYMENT.get_deployment_summary()
print(f"Services running: {summary['services_running']}/{summary['services_count']}")

# 2. Get specific service
mime_server = DEPLOYMENT.get_service('mime-server')
gateway = DEPLOYMENT.get_service('mockup-gateway')

# 3. Find services on a network
public_services = DEPLOYMENT.get_services_on_network('public_net')
private_services = DEPLOYMENT.get_services_on_network('private_net')

# 4. Get architectural recommendations
config = DECISION_ENGINE.recommend_configuration('file-transfer')
print(f"Recommended networks: {config['networks']}")
print(f"Recommended port: {config['port']}")

# 5. Build commands
status_cmd = COMMANDS.service_status()
test_cmd = COMMANDS.test_file_transfer()

# 6. Validate deployment
is_valid, issues = DEPLOYMENT.validate_deployment()

# 7. Make architectural decisions
decisions = DECISION_ENGINE.should_add_dual_network('my-new-service')
```

### When Consulting Docs:

| Need | Document | Section |
|------|----------|---------|
| Full context | SYSTEM_PROMPT.md | - |
| Quick overview | AI_DIGEST.md | - |
| Architecture details | ARCHITECTURE_MANIFEST.json | - |
| Code access | ai_context.py | - |
| Validation | DEPLOYMENT_STATE.py | - |

---

## Critical Information for New Branches

### Must Know:
1. **MIME server is on BOTH networks** (172.18.0.4 and 172.19.0.5)
2. **Nginx bridges the two networks** (dual-homed)
3. **File transfer verified:** 24-byte test file ✅
4. **All 4 services operational:** gateway, public_app, intranet_api, mime-server
5. **Logging:** 15+ files, Thailand DCA compliant

### File Locations:
- Services deployed at: `d:\boonsup\automation\mockup-infra\docker-compose.yml`
- Gateway config: `d:\boonsup\automation\mockup-infra\gateway\nginx.conf`
- MIME apps: `d:\boonsup\automation\week01-mime-typing\`
- Context assets: This directory

### Key Commands:
```bash
# Status
podman-compose ps

# Create test file and transfer
podman run --rm --network mockup-infra_private_net --entrypoint bash mime-client:latest \
  -c "echo 'Hello' > /tmp/test.txt && python /app/client.py --send /tmp/test.txt --to mime-server:65432"

# View logs
podman exec mockup-gateway tail -f /var/log/nginx/audit.log | jq .

# Check storage
podman exec mime-server ls -lah /storage/
```

---

## Using This Package

### Option 1: As AI System Prompt
Copy SYSTEM_PROMPT.md into your AI system prompt context at the start of each new task.

### Option 2: As Code Library
```python
from ai_context import DEPLOYMENT, DECISION_ENGINE, COMMANDS
# Write code that uses DEPLOYMENT object as knowledge base
```

### Option 3: As JSON Configuration
Parse ARCHITECTURE_MANIFEST.json for machine-readable deployment state:
```bash
jq '.services | keys' ARCHITECTURE_MANIFEST.json
```

### Option 4: As Documentation
Reference AI_DIGEST.md for quick lookup of deployment facts.

---

## Before Starting Your Next Branch

1. ✅ Read SYSTEM_PROMPT.md (2-3 min)
2. ✅ Run `python DEPLOYMENT_STATE.py` (verify all systems)
3. ✅ Check `podman-compose ps` (confirm services running)
4. ✅ Review ARCHITECTURE_MANIFEST.json (understand current config)
5. ✅ Decide: What's new? (service? endpoint? change?)
6. ✅ Reference appropriate section in ai_context.py
7. ✅ Code your changes
8. ✅ Update DEPLOYMENT_STATE.py and ai_context.py with new info
9. ✅ Document in code comments and this README

---

## Performance Notes

- File transfer: sub-second for small files (24 bytes tested ✅)
- Service startup: ~5 seconds (podman-compose up -d)
- Network connectivity: Immediate (DNS + bridge)
- Logging: Real-time (32KB buffer, 5-sec flush)

---

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| Services not running | `podman-compose up -d` |
| Can't connect to mime-server | Check: `podman exec mime-client ping mime-server` |
| Files not stored | Check: `podman exec mime-server ls /storage/` |
| Nginx errors | Check: `podman exec mockup-gateway tail /var/log/nginx/error.log` |
| Need to rebuild | `podman-compose build --no-cache SERVICE` |

---

## File Structure

```
d:\boonsup\automation\
├── SYSTEM_PROMPT.md              ← PRIMARY AI CONTEXT
├── AI_DIGEST.md                  ← EXECUTIVE SUMMARY
├── DEPLOYMENT_STATE.py           ← STATE AS CODE
├── ARCHITECTURE_MANIFEST.json    ← MACHINE-READABLE CONFIG
├── ai_context.py                 ← IMPORTABLE LIBRARY
├── AI_CONTEXT_README.md          ← THIS FILE
│
├── mockup-infra/                 ← DEPLOYED INFRASTRUCTURE
│   ├── docker-compose.yml
│   ├── gateway/
│   │   └── nginx.conf
│   └── [services...]
│
└── week01-mime-typing/           ← MIME APPLICATION
    ├── Dockerfile.server
    ├── Dockerfile.client
    └── [source files...]
```

---

## Context Artifact Metadata

| File | Lines | Type | Load Time |
|------|-------|------|-----------|
| SYSTEM_PROMPT.md | 350 | Text | Fast (read as needed) |
| AI_DIGEST.md | 400 | Text | Fast (read as needed) |
| DEPLOYMENT_STATE.py | 250+ | Code | Immediate (import) |
| ARCHITECTURE_MANIFEST.json | 200+ | JSON | Immediate (parse) |
| ai_context.py | 300+ | Code | Immediate (import) |

**Total:** ~1500 lines of AI-ready documentation and code

---

## Contact & Extension

To extend these assets for new deployments:

1. Update ai_context.py with new Service definitions
2. Add new sections to SYSTEM_PROMPT.md
3. Update ARCHITECTURE_MANIFEST.json with new configs
4. Extend DEPLOYMENT_STATE.py with new validation

All files are designed for easy updates and expansion.

---

**Status:** ✅ READY FOR NEXT PHASE
**Verified:** February 13, 2026
**All Systems:** OPERATIONAL

Begin new work with confidence. All context assets loaded and verified.

