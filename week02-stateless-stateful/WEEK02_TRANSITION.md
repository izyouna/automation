# Week 02 Transition: From MIME-Typing to Stateless vs Stateful

**Status:** 🟢 READY TO BEGIN  
**Date:** February 13, 2026  
**Previous:** Week 01 - MIME-Based Socket File Transfer (✅ COMPLETE)  
**Current:** Week 02 - Stateless vs Stateful Server Architecture  
**Next:** Week 03 - Cloud-Native Microservices  

---

## App Domain Definition by Week

### Week 01: TCP & Protocol Communication (MIME-Typing)
**Domain:** File transfer protocols, type detection, cross-network communication
**Core Services:**
- `mime-server` (Port 65432) - MIME-aware file transfer server
- `mime-client` - File transfer client
- **Status for Week 02:** ⚠️ **DEPRECATED** - Not used in Week 02 architecture

### Week 02: Application State Management (Stateless vs Stateful)
**Domain:** Session management, authentication patterns, horizontal scaling
**Core Services:**
- `stateless-api` (Port 3000) - JWT-based stateless authentication
- `stateful-api` (Port 3001) - Session-based stateful authentication
- `nginx-gateway` (Port 80/443) - Request routing and TLS termination
- **Excluded Services:** MIME-server, MIME-client (NOT part of Week 02 curriculum)

### Week 03: Microservices Architecture (Planned)
**Domain:** Service coordination, message queues, distributed systems
**Will Include:** Service discovery, inter-service communication, state synchronization

---

## Context: What You Know From Week 01

From Week 01 (MIME-Typing), you learned:
- **TCP Basics**: Sockets, message framing, reliable delivery
- **Protocol Design**: MIME-aware file transfer with type detection
- **Cross-Network Communication**: Client-server patterns across isolated networks
- **Container Orchestration**: Podman + docker-compose for service deployment

These concepts are prerequisites for understanding session management in Week 02.

---

## Week 02 Core Question

**"When a user makes TWO requests, how does the server remember the user is the SAME person?"**

Three answers:
1. **Stateless**: "Tell me who you are every time" (JWT tokens)
2. **Stateful (In-Memory)**: "I keep you in my memory" (Session objects)
3. **Stateful (External)**: "I write you to Redis" (Distributed sessions)

### Real Impact

| Scenario | Stateless | Stateful Memory | Stateful Redis |
|----------|-----------|-----------------|---------------|
| Scale from 1 to 10 servers | ✅ Works instantly | ❌ Users get logged out | ✅ Works with affinity |
| One server crashes | ✅ Other servers handle it | ❌ All sessions lost | ✅ Sessions survive |
| 100,000 concurrent users | ✅ Easy | ❌ Memory explosion | ✅ Manageable |

---

## Project Structure Overview

**NOTE:** Week 02 focuses exclusively on stateless vs stateful patterns. MIME-server from Week 01 is **NOT** included in this architecture.

```
week02-stateless-stateful/
│
├── phase1-mockup/          # Node.js/Express learning environment
│   ├── src/
│   │   ├── stateless-server.js     ← Learn JWT-based sessions
│   │   ├── stateful-server.js      ← Learn in-memory sessions
│   │   └── clients/
│   │       ├── stateless-client.js
│   │       └── stateful-client.js
│   │
│   ├── tests/                      # Jest test suite
│   │   ├── stateless.test.js
│   │   ├── stateful.test.js
│   │   └── comparison.test.js
│   │
│   ├── docs/
│   │   ├── api-reference.md        # All endpoints
│   │   ├── concepts.md              # Theory deep dive
│   │   └── concepts.md
│   │
│   ├── package.json
│   └── server.js
│
├── phase2-production/      # Python/FastAPI production system
│   ├── app/
│   │   ├── main.py                 # FastAPI application
│   │   ├── models/                 # SQLAlchemy ORM
│   │   ├── api/                    # Endpoints
│   │   ├── services/               # Business logic
│   │   └── core/                   # Config, logging
│   │
│   ├── tests/                      # Pytest suite
│   ├── docker-compose.yml          # With PostgreSQL + Redis
│   ├── requirements.txt
│   └── QUICK_START.md
│
├── README.md               # Main curriculum document
├── master_development_plan.md  # Overall roadmap
└── implementation_plan.md      # Detailed breakdown
```

---

## Getting Started: Phase 1 on Mockup-Infra (5 minutes)

**UPDATE:** Week 02 Phase 1 now runs integrated within mockup-infra's dual-network architecture!  
**IMPORTANT:** MIME-server is per-Week 01 only. Week 02 uses stateless-api and stateful-api services instead.

### Step 1: Navigate to mockup-infra
```bash
cd d:\boonsup\automation\mockup-infra
```

**Services Running in Week 02:**
- `nginx-gateway` - Reverse proxy (routes /api/stateless/ and /api/stateful/)
- `stateless-api` - JWT authentication server (Week 02 focus)
- `stateful-api` - Session authentication server (Week 02 focus)
- `mime-server` ⚠️ Still running (from Week 01) but **deprecated for Week 02** curriculum

### Step 2: Build Services
```bash
# Build all services (including Week 02 APIs)
docker-compose build

# Output includes:
# Building stateless-api ...
# Building stateful-api ...
```

### Step 3: Start All Services
```bash
# Start in daemon mode
docker-compose up -d

# Verify
docker-compose ps | grep -E "(stateless|stateful|gateway)"
```

### Step 4: Read the Theory
```bash
# From Week 02 directory:
cd d:\boonsup\automation\week02-stateless-stateful\phase1-mockup
cat docs/concepts.md
cat docs/api-reference.md
```

### Step 5: Test Week 02 APIs (Ignore MIME-Server)
```bash
# Week 02: Stateless API (HTTP via public network)
curl http://localhost:8080/api/stateless/health

# Week 02: Stateful API (HTTPS via private network)
curl -k https://localhost/api/stateful/health

# Both should return healthy status

# Week 01 Service (Still running, but NOT part of Week 02 curriculum):
# curl http://localhost:65432/...  # mime-server (DEPRECATED for Week 02)
```

**See [WEEK02_ON_MOCKUP_INFRA.md](../../mockup-infra/WEEK02_ON_MOCKUP_INFRA.md) for detailed testing.**

---

## Alternative: Standalone Phase 1 Development

If you prefer to develop Phase 1 standalone (without mockup-infra):

### Step 1: Install Dependencies
```bash
cd d:\boonsup\automation\week02-stateless-stateful\phase1-mockup
npm install
```

### Step 2: Run Both Servers
```bash
# Terminal 1: Stateless (JWT-based)
npm run server:stateless
# Output: Server listening on http://localhost:3000

# Terminal 2: Stateful (Session-based)
npm run server:stateful
# Output: Server listening on http://localhost:3001
```

### Step 3: Run Full Test Suite
```bash
npm test
```

---

## Legacy: Getting Started Steps (Reference)

### Step 1: Read the Theory
```bash
# Open and read:
cat docs/concepts.md
cat docs/api-reference.md
```

### Step 2: Test with Clients
```bash
# Terminal 3:
npm run test:client-stateless
npm run test:client-stateful
```

---

## Key Learning Activities

### Activity 1: Understanding the Difference (Conceptual)
**Goal:** Understand WHAT changes between stateless and stateful

**Read:**
1. `phase1-mockup/docs/concepts.md` - Theory
2. Compare line-by-line:
   - `phase1-mockup/src/stateless-server.js` (JWT verification)
   - `phase1-mockup/src/stateful-server.js` (Session lookup)

**Observe:** What data is sent in each request?

---

### Activity 2: Single Server Behavior (Practical)
**Goal:** See both patterns working on a single server

**Run:**
```bash
# Both servers simultaneously
npm run server:stateless &
npm run server:stateful &
npm run test:client-stateless
npm run test:client-stateful
```

**Measurements:**
- How long does login take? (Should be similar)
- How long does subsequent request take? (Should be similar)
- What happens if you restart the server?
  - Stateless: Tokens still work ✅
  - Stateful: Sessions lost ❌

---

### Activity 3: Horizontal Scaling (What Breaks)
**Goal:** Simulate scaling to 3 servers, see what fails

**Docker-Compose Simulation:**
```bash
cd phase1-mockup
npm run simulation:scale-stateless
npm run simulation:scale-stateful
npm run simulation:scale-compare
```

**What You'll Observe:**
- **Stateless**: Client switched to different server, token still works ✅
- **Stateful (no affinity)**: Client switched to different server, session lost ❌
- **Stateful (with affinity)**: Client sticky to same server, works ✅

---

### Activity 4: Performance Under Load
**Goal:** Measure latency and throughput differences

**Run:**
```bash
npm run test:performance
# Output:
# [Stateless] 1000 requests in 2.3s (434 req/s)
# [Stateful]  1000 requests in 2.1s (476 req/s)
# [Difference] Stateful slightly faster (no crypto), but both fast!
```

---

## Phase 2 Preview (Production Grade)

After mastering Phase 1 concepts, Phase 2 will add:
- **FastAPI** instead of Express (production Python framework)
- **PostgreSQL** for persistent data (users, sessions)
- **Redis** for session store (distributed, fast)
- **Database Migrations** (Alembic - like Django migrations)
- **Authentication** (bcrypt password hashing)
- **Kubernetes** ready (multi-container orchestration)

**Same concepts, production-grade infrastructure.**

---

## Assessment: How You'll Know You've Learned Week 02

### Conceptual Level ✅
- [ ] Explain difference between stateless and stateful
- [ ] Describe failure modes of each pattern
- [ ] Identify which pattern solves horizontal scaling

### Code Level ✅
- [ ] Run both Phase 1 servers without errors
- [ ] Write a test that demonstrates session loss on scale
- [ ] Modify server to add a new endpoint (exercise)

### Analysis Level ✅
- [ ] Compare performance: stateless vs stateful
- [ ] Explain why Redis solves scaling problems
- [ ] Design session strategy for hypothetical app

---

## From Week 01 to Week 02: Knowledge Build

```
WEEK 01 FOUNDATION (TCP & Protocols)
│
├── Learned: How TCP connection != application session
├── Built: MIME-server that runs forever on port 65432
├── Understood: Message framing and reliable delivery
│
↓ TRANSITION POINT (YOU ARE HERE)
│
┌─ Decide: Does app need to remember clients?
│
├─ NO → Stateless (Week 02 Path A)
│   ├─ Every request: Full credentials
│   ├─ Server: Verify + respond
│   ├─ Scale: Horizontal (add servers)
│   └─ Example: REST APIs, microservices
│
├─ YES → Stateful (Week 02 Path B)
│   ├─ First request: Create session
│   ├─ Later requests: Reference session ID
│   ├─ Scale: External store (Redis)
│   └─ Example: Chat, games, shopping carts
│
WEEK 03 (Microservices)
│
├─ How to coordinate stateless services
├─ How to scale stateful services (Redis)
├─ Service-to-service communication
└─ Multiple databases
```

---

## Quick Reference: Commands

### Running on Mockup-Infra (Recommended)

```bash
# Start all services
cd mockup-infra
docker-compose up -d

# Test endpoints
curl http://localhost:8080/api/stateless/health
curl -k https://localhost/api/stateful/health

# View logs
docker-compose logs -f stateless-api
docker-compose logs -f stateful-api

# Stop all
docker-compose down
```

### Running Standalone Phase 1 (Optional)

```bash
cd phase1-mockup

# Setup
npm install

# Development
npm run server:stateless      # Start stateless server
npm run server:stateful       # Start stateful server

# Testing
npm test                       # Run all tests
npm run test:performance       # Load testing
npm run test:debug            # Verbose output

# Cleanup
npm run cleanup               # Reset all state
```

---

## Week 02 Curriculum: Files to Study (In Order)

**SKIP Week 01 Files:** Do not study MIME-server, mime-client, or Week 01 protocols.  
**FOCUS ONLY ON:** Week 02 stateless vs stateful patterns.

1. **START HERE** → This document (WEEK02_TRANSITION.md)
2. **THEORY** → `phase1-mockup/docs/concepts.md` (state management theory)
3. **API SPEC** → `phase1-mockup/docs/api-reference.md` (both API endpoints)
4. **STATELESS CODE** → `phase1-mockup/src/stateless-server.js` (JWT implementation)
5. **STATEFUL CODE** → `phase1-mockup/src/stateful-server.js` (session implementation)
6. **TESTS** → `phase1-mockup/tests/` (state management tests)
7. **COMPARISON** → See side-by-side differences in both server.js files

---

## Common Questions

**Q: What about MIME-server in Week 02?**  
A: MIME-server is **Week 01 only**. It's still in mockup-infra for other labs, but it's **deprecated for Week 02 curriculum**. Focus exclusively on stateless-api and stateful-api.

**Q: Why Node.js for Phase 1 instead of Python?**  
A: Node.js is clearer for learning concurrency. Express handles sessions obviously. Phase 2 moves to FastAPI with production patterns.

**Q: Do I need to understand Week 01 fully before Week 02?**  
A: Not deeply. Week 01 taught you protocols and deployment. Week 02 teaches application state management. Skills compound, don't worry about gaps.

**Q: How long should Phase 1 take?**  
A: 2-3 days to understand, 1 week to master with exercises.

**Q: When do I move to Phase 2?**  
A: When you can:
- Run both servers without errors
- Explain why stateful has affinity
- Write a test demonstrating failure modes
- Design a session strategy

**Q: Is Phase 2 required?**  
A: For production YES. For learning concepts NO. Phase 1 teaches the ideas clearly.

---

## Success Checklist

Before moving to Week 03, verify:

- [ ] Phase 1 installed and all tests passing
- [ ] Can run both stateless and stateful servers simultaneously
- [ ] Understand why stateless needs no server affinity
- [ ] Understand why stateful memory breaks on scale
- [ ] Can explain Redis as solution to distributed sessions
- [ ] Wrote at least one custom test case
- [ ] Modified a server endpoint
- [ ] Ran performance comparison

---

## Environment Setup Validation

```bash
# Verify Node.js
node --version    # Should be 18+

# Verify npm
npm --version     # Should be 8+

# Verify Docker (for later phases)
docker --version
docker-compose --version

# Verify Python (for Phase 2)
python --version  # Should be 3.11+
```

---

## Next Week Preview

**Week 03: Cloud-Native Microservices**

By time you finish Week 02, you'll know:
- Stateless systems scale horizontally
- Stateful systems need affinity or external storage
- Session management is critical at scale

Week 03 will teach:
- Break monolith into independent services
- Each service handles one concern
- Services communicate via messages/APIs
- Coordinate state across service boundaries

**Teaser:** Redis (Session Store) becomes Message Broker (between services).

---

## Final Thought

**Week 01** taught you TCP: *"How do I send bytes reliably?"*  
**Week 02** teaches you Sessions: *"How do I remember who you are?"*  
**Week 03** will teach you Services: *"How do multiple servers work together?"*

Each week builds on previous. The learning spirals upward.

---

**Ready?** Start with:
```bash
cd d:\boonsup\automation\mockup-infra
docker-compose up -d
curl http://localhost:8080/api/stateless/health
```

That command starts your Week 02 journey. 🚀

**Or, for standalone development:**
```bash
cd d:\boonsup\automation\week02-stateless-stateful\phase1-mockup
npm install
npm run server:stateless
```

Both approaches teach the same concepts. Choose based on your preference:
- **Mockup-Infra:** Integrated deployment, production-like setup
- **Standalone:** Faster iteration, simpler debugging

---

**Last Updated:** February 13, 2026  
**Status:** Ready for lab work (Mockup-Infra Integration Complete)  
**Difficulty:** Intermediate (builds on Week 01)  
**Time Estimate:** 1 week (Phase 1), 2 weeks (Phase 2)
