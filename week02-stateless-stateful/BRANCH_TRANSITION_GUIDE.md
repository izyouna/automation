# Week 02 Branch Status: Stateless vs Stateful Architecture

**Date:** February 13, 2026  
**Transition From:** Week 01 (MIME-Based Socket File Transfer) ✅  
**Transition To:** Week 02 (Stateless vs Stateful) 🟢 READY  

---

## Summary: Week 01 Complete → Week 02 Ready

### What You Accomplished in Week 01

✅ **Infrastructure:**
- Podman 5.7.1 with podman-compose deployed
- Dual-network architecture (public_net + private_net)
- Nginx gateway with TLS termination
- Comprehensive compliance logging

✅ **MIME-Typing System:**
- TCP socket file transfer with MIME type detection
- Cross-network communication (client on private_net, server on dual networks)
- Persistent file storage with Docker volumes
- File transfer verified: 24-byte test successful

✅ **Documentation:**
- System prompt codified (SYSTEM_PROMPT.md)
- Deployment state documented (AI_DIGEST.md → moved to docs/guides)
- Architecture Decision Records (ADRs) created
- Complete decision rationale documented

### Files Organized

```
d:\boonsup\automation\docs\guides\
├── AI_CONTEXT_README.md      ✅ (moved)
└── AI_DIGEST.md              ✅ (moved)
```

---

## Week 02 Project Structure

### Phase 1: Node.js/Express (Learning Mockup)
```
week02-stateless-stateful/phase1-mockup/
├── src/
│   ├── stateless-server.js      # JWT-based (no server memory)
│   ├── stateful-server.js       # Session-based (in-memory state)
│   └── clients/                 # Test clients
│
├── tests/
│   ├── stateless.test.js
│   ├── stateful.test.js
│   └── comparison.test.js
│
├── docs/
│   ├── concepts.md              # Theory
│   ├── api-reference.md         # Endpoints
│   └── transition-to-phase2.md  # Learning bridge
│
└── package.json
```

### Phase 2: Python/FastAPI (Production)
```
week02-stateless-stateful/phase2-production/
├── app/
│   ├── main.py                  # FastAPI application
│   ├── models/                  # SQLAlchemy ORM
│   ├── api/                     # Endpoints
│   └── services/                # Business logic
│
├── tests/
│   └── (pytest suite)
│
├── docker-compose.yml           # PostgreSQL + Redis
└── requirements.txt
```

---

## Integration with Mockup-Infra 🎯 NEW

**Week 02 Phase 1 is now integrated into mockup-infra's dual-network architecture!**

### What Changed

| Aspect | Before | Now |
|--------|--------|-----|
| **Deployment** | Standalone npm servers | Docker containers in mockup-infra |
| **Networks** | localhost only | Dual networks (public_net + private_net) |
| **Gateway** | Direct port access | Nginx L7 proxy routing |
| **Services** | Manual start/stop | docker-compose orchestration |
| **Logging** | Console output | Comprehensive nginx audit trail |

### Service Placement

```
PUBLIC_NET (172.18.0.0/16)              PRIVATE_NET (172.19.0.0/16)
    │                                           │
 [Gateway 172.18.0.2]  ←→ Gateway ←→  [Gateway 172.19.0.2]
    │                                           │
 stateless-api                             stateful-api
 172.18.0.6:3000                          172.19.0.6:3001
 (JWT sessions)                           (Session-based)
```

### How to Run on Mockup-Infra

**Quick Start (3 commands):**
```bash
cd d:\boonsup\automation\mockup-infra
docker-compose build
docker-compose up -d
```

**Verify Deployment:**
```bash
# Check services running
docker-compose ps | grep -E "(stateless|stateful)"

# Test endpoints
curl http://localhost:8080/api/stateless/health
curl -k https://localhost/api/stateful/health
```

**Full Documentation:** See [WEEK02_ON_MOCKUP_INFRA.md](../../mockup-infra/WEEK02_ON_MOCKUP_INFRA.md)

---

## Learning Path: Week 02

### Phase 1 Objectives (Days 1-3)
```
[Day 1] Understand the Problem
  → Read: phase1-mockup/docs/concepts.md
  → Concept: What is "session" really?
  → Why: TCP ≠ Application Session

[Day 2] See Both Patterns
  → Run: npm run server:stateless
  → Run: npm run server:stateful
  → Compare: Code and behavior differences

[Day 3] Test Failure Modes
  → Test: Single server behavior
  → Test: Multiples servers (scaling)
  → Test: Server restart scenarios
```

### Phase 2 Objectives (Week 2+)
```
[Week 2] Production Components
  → Database: User storage + authentication
  → Redis: Distributed session store
  → Kubernetes: Multiple replicas
  → Scale: From 1 to 100 servers
```

---

## Quick Start: Phase 1 (5 Minutes)

```bash
# 1. Navigate to Phase 1
cd d:\boonsup\automation\week02-stateless-stateful\phase1-mockup

# 2. Install dependencies
npm install

# 3. Read the concepts (10 min)
type docs\concepts.md

# 4. Run one server in each terminal:
# Terminal 1
npm run server:stateless

# Terminal 2
npm run server:stateful

# Terminal 3: Run tests
npm test
```

---

## Key Concepts: Quick Reference

| Aspect | Stateless (JWT) | Stateful (Memory) | Stateful (Redis) |
|--------|-----------------|-------------------|------------------|
| **How client authenticates** | JWT token in header | Session ID cookie | Session ID cookie |
| **Where data stored** | Client memory (token) | Server memory | Redis (external) |
| **Server failure** | ✅ No data loss | ❌ Sessions lost | ✅ Sessions survive |
| **Horizontal scaling** | ✅ Easy (any server OK) | ⚠️ Need affinity | ✅ Easy (shared store) |
| **Typical use** | REST APIs, microservices | Web applications | Enterprise apps |

---

## Critical Learning Question

**Before Week 02 starts, ask yourself:**

> "When USER A makes request 1 on SERVER 1, then request 2 on SERVER 2, how does SERVER 2 know USER A is the same person?"

Three answers:
- **Stateless**: "USER A sends a JWT proving identity"
- **Stateful (memory)**: "I remember USER A in my memory" (but SERVER 2 has no memory!)
- **Stateful (Redis)**: "I look up USER A in Redis" (which both servers share)

**Phase 1 teaches A & B deeply.**  
**Phase 2 teaches A + B + C at scale.**

---

## Integration with Week 01

### What Week 01 Taught You
- TCP sockets and message framing → Week 02 uses HTTP (built on TCP)
- Cross-network communication → Week 02 uses gateway routing
- Container orchestration → Week 02 uses same docker-compose model
- Persistent storage → Week 02 uses Redis (same persistence concept)

### What Week 02 Adds
- **Session Layer** (OSI Layer 5) vs Transport Layer (Layer 4)
- **Stateful vs Stateless** tradeoffs
- **Scaling implications** (horizontal vs vertical)
- **Database persistence** (PostgreSQL in Phase 2)

### Why This Order
- Week 01: "Can I send data reliably?" → Week 02: "Can I remember who sent it?"
- Week 01: Single server focus → Week 02: Multiple servers with same user
- Week 01: File transfer → Week 02: User sessions

---

## Test Strategy Overview

### Phase 1 Tests
```bash
npm test
# Output:
#   ✓ Stateless: Login returns JWT
#   ✓ Stateless: JWT validates on protected endpoint
#   ✓ Stateful: Login creates session
#   ✓ Stateful: Session found on protected endpoint
#   ✓ Scaling: Stateless works across servers
#   ✗ Scaling: Stateful fails without affinity  ← KEY INSIGHT
#   ✓ Scaling: Stateful + affinity works
```

### Phase 2 Tests (with Redis)
```bash
pytest tests/ -v
# Output:
#   ✓ Database: User stored and retrieved
#   ✓ Redis: Session created and retrieved
#   ✓ Scaling: 5 servers sharing Redis sessions
#   ✓ Failure: Redis fails → graceful degradation
#   ✓ Performance: <100ms per request
```

---

## Success Criteria: When You've Learned Week 02

✅ **Conceptual** (Explain without code)
- Difference between stateless and stateful
- Why stateless scales better
- Why stateful needs session affinity or external store
- When to use each pattern

✅ **Practical** (Can run & modify code)
- Run both Phase 1 servers simultaneously
- Modify an endpoint
- Write a test case
- Demonstrate failure mode with scaling

✅ **Analytical** (Make architectural decisions)
- Given requirements, choose session strategy
- Justify tradeoffs
- Estimate performance impact
- Plan scaling strategy

---

## Documentation Moved

As of February 13, 2026:

```
Before:
  d:\boonsup\automation\
    ├── AI_CONTEXT_README.md
    └── AI_DIGEST.md

After:
  d:\boonsup\automation\docs\guides\
    ├── AI_CONTEXT_README.md      ✅
    └── AI_DIGEST.md              ✅
```

Both Week 01 context documents are now in the centralized docs/guides directory for easy access across branches.

---

## Next Steps

1. **Week 02 Day 1:**
   ```bash
   cd d:\boonsup\automation\mockup-infra
   docker-compose build && docker-compose up -d
   cd ../week02-stateless-stateful/phase1-mockup
   cat docs/concepts.md
   ```

2. **Week 02 Day 2:**
   ```bash
   cd ../../mockup-infra
   curl http://localhost:8080/api/stateless/health
   curl -k https://localhost/api/stateful/health
   ```

3. **Week 02 Day 3+:**
   ```bash
   # Run tests or modify servers
   cd ../week02-stateless-stateful/phase1-mockup
   npm test
   ```

4. **Week 02 Week 2+:**
   - Move to Phase 2 (Python/FastAPI)
   - Add PostgreSQL and Redis to mockup-infra
   - Implement distributed session store
   - Deploy with kubernetes manifests

---

## Timeline: Mockup-Infra Integration

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 1 Setup on mockup-infra | 1 day | Services running in docker-compose |
| Phase 1 Learning | 2 days | Understand concepts, compare patterns |
| Phase 1 Exercises | 2 days | Write tests, design scenarios |
| Phase 2 with Redis | 3 days | Distributed session store |
| Phase 2 with K8s | 2 days | Kubernetes deployment |
| **Total** | **~2 weeks** | Production-grade system |

---

## Final Checklist Before Starting

- [ ] Read BRANCH_TRANSITION_GUIDE.md (this file) ✅
- [ ] Located week02-stateless-stateful directory ✅
- [ ] Located mockup-infra directory ✅
- [ ] Docker/Podman available (`docker --version` or `podman --version`)
- [ ] Node.js 18+ installed (for npm if running standalone)
- [ ] Plan first 3 hours on mockup-infra integration
- [ ] Have Week 01 context files available (docs/guides/)

---

**Status:** 🟢 READY TO BEGIN WEEK 02 ON MOCKUP-INFRA

Start here:
```bash
cd d:\boonsup\automation\mockup-infra
docker-compose build
```

Questions? Review the [WEEK02_ON_MOCKUP_INFRA.md](../../mockup-infra/WEEK02_ON_MOCKUP_INFRA.md) guide.

**Good luck! Week 02 will solidify your understanding of application state management.** 🚀

---

**Last Updated:** February 13, 2026  
**Status:** ✅ Mockup-Infra integration complete  
**Next Check-In:** After Phase 1 completion (2-3 days)
