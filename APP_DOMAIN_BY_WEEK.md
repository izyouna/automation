# Application Domain Structure by Week

**Last Updated:** February 13, 2026  
**Purpose:** Define which services, concepts, and technologies belong to each week's curriculum

---

## Overview: The Three-Week Journey

```
WEEK 01 (Completed)
└─ Focus: TCP Protocols & File Transfer
   ├─ Protocol: MIME-typing (content detection)
   ├─ Services: mime-server, mime-client
   └─ Goal: Master TCP reliability and message framing

         ↓ KNOWLEDGE TRANSFERS TO

WEEK 02 (Completed)
└─ Focus: Application State Management
   ├─ Problem: How does server remember client?
   ├─ Services: stateless-api, stateful-api, nginx-gateway
   └─ Goal: Understand session management patterns

         ↓ KNOWLEDGE TRANSFERS TO

WEEK 03 (Current Focus)
└─ Focus: Distributed Microservices
   ├─ Problem: How do multiple services coordinate?
   ├─ Services: upload-service, processing-service, ai-service
   └─ Goal: Master service-to-service communication
```

---

## Week 01: TCP & Protocol Communication

### Domain
**File Transfer over TCP with Content Type Detection**

### Core Services
| Service | Port | Role | Status |
|---------|------|------|--------|
| mime-server | 65432 | MIME-aware file transfer | ✅ Week 01 Only |
| mime-client | N/A | File transfer client | ✅ Week 01 Only |

### Key Concepts
- TCP socket programming
- Message framing and delimiters
- MIME type detection
- Cross-network communication (public/private networks)
- Container orchestration basics

### Technologies
- Python 3.11
- Socket programming (stdlib)
- Podman containers
- Dual-network Docker Compose

### Status: ✅ COMPLETE
- All protocols implemented
- All tests passing
- Integrated into mockup-infra permanently
- **DEPRECATED: Use as reference only for Week 03**

### Location
```
d:\boonsup\automation\
├── week01-mime-typing/
│   ├── Dockerfile.server
│   ├── Dockerfile.client
│   ├── server.py
│   └── client.py
└── mockup-infra/
    ├── services/mime-server/  (DEPRECATED for Week 02)
    └── docker-compose.yml     (includes mime services)
```

---

## Week 02: Application State Management

### Domain
**Stateless vs Stateful Authentication & Session Management**

### Core Services
| Service | Port | Role | Status |
|---------|------|------|--------|
| stateless-api | 3000 | JWT-based auth (no memory) | ✅ Week 02 Focus |
| stateful-api | 3001 | Session-based auth (with memory) | ✅ Week 02 Focus |
| nginx-gateway | 80/443 | Request routing & TLS | ✅ Supporting |
| mime-server | 65432 | File transfer | ⚠️ **DEPRECATED FOR THIS WEEK** |

### Key Concepts
- Stateless architecture (JWT tokens)
- Stateful architecture (session objects)
- Horizontal scaling implications
- Authentication vs Authorization
- Session affinity and sticky sessions
- Token-based authentication

### Technologies
- Node.js 18 (Express)
- JWT (jsonwebtoken)
- In-memory session storage
- Nginx reverse proxy
- Docker/Podman
- Dual-network architecture

### Status: ✅ COMPLETE
- Core servers implemented
- Mock-infra integration complete
- All Phase 1 objectives met
- **DEPRECATED: Use as reference only for Week 03**

### Location
```
d:\boonsup\automation\
├── week02-stateless-stateful/
│   ├── phase1-mockup/
│   │   ├── src/
│   │   │   ├── stateless-server.js  (JWT implementation)
│   │   │   ├── stateful-server.js   (Session implementation)
│   │   │   └── shared/              (Shared utilities)
│   │   ├── tests/
│   │   ├── docs/
│   │   │   ├── concepts.md
│   │   │   └── api-reference.md
│   │   └── docker-compose.yml
│   ├── phase2-production/           (Python/FastAPI version)
│   ├── WEEK02_TRANSITION.md
│   └── README.md
└── mockup-infra/
    ├── docker-compose.yml           (includes Week 02 services)
    └── gateway/nginx.conf           (routes to Week 02 APIs)
```

### Endpoints (In mockup-infra)
```
# Stateless API (HTTP)
http://localhost:8080/api/stateless/health
http://localhost:8080/api/stateless/login
http://localhost:8080/api/stateless/dashboard
http://localhost:8080/api/stateless/logout

# Stateful API (HTTPS)
https://localhost/api/stateful/health
https://localhost/api/stateful/login
https://localhost/api/stateful/dashboard
https://localhost/api/stateful/logout
```

### External Services: DEPRECATED for Week 03

⚠️ **Week 01 Services** (mime-server, mime-client)
- Available in mockup-infra with `--profile week01`
- **NOT part of Week 03 curriculum**
- Use for TCP protocol review only

⚠️ **Week 02 Services** (stateless-api, stateful-api)
- Available in mockup-infra with `--profile week02`
- **NOT part of Week 03 curriculum**
- Use for session management review only

---

## Week 03: Distributed Microservices

### Domain
**File Processing Microservices with Event-Driven Architecture**

### Core Services
| Service | Port | Role | Status |
|---------|------|------|--------|
| upload-service | 8000 | File upload and metadata | ✅ Week 03 Phase 1 |
| processing-service | 8000 | File processing operations | ✅ Week 03 Phase 1 |
| ai-service | 8000 | AI analysis (mock) | ✅ Week 03 Phase 1 |
| nginx-gateway | 80/443 | Request routing & TLS | ✅ Supporting |

### Key Concepts
- Microservices architecture
- Service-to-service communication
- Network isolation (public vs private)
- API gateway pattern
- Event-driven workflows
- Distributed state management (planned)
- Message queues (planned)

### Technologies
- Python 3.11 (FastAPI)
- Docker/Podman containers
- Nginx reverse proxy
- Dual-network architecture
- Mock processing and AI responses

### Status: 🚀 IN PROGRESS (Current Week)
- Core microservices implemented
- Mock-infra integration complete
- Network isolation configured
- Gateway routing operational
- Health checks passing
- **ACTIVE CURRICULUM FOCUS**

### Location
```
d:\boonsup\automation\
├── week03-microservices/
│   ├── phase1/
│   │   ├── services/
│   │   │   ├── upload/          (File upload service)
│   │   │   ├── processing/      (Processing service)
│   │   │   └── ai/              (AI analysis service)
│   │   ├── tests/
│   │   ├── README.md
│   │   └── Implementation_Guide.md
│   └── docker-compose.yml       (Standalone version)
└── mockup-infra/
    ├── docker-compose.yml       (includes Week 03 services)
    └── gateway/nginx.conf       (routes to Week 03 APIs)
```

### Endpoints (In mockup-infra)
```
# Upload Service (HTTP - Public Network)
http://localhost:8080/api/upload/health
http://localhost:8080/api/upload/upload

# Processing Service (HTTP - Private Network via Gateway)
http://localhost:8080/api/processing/health
http://localhost:8080/api/processing/process/{file_id}

# AI Service (HTTP - Private Network via Gateway)
http://localhost:8080/api/ai/health
http://localhost:8080/api/ai/analyze/{file_id}
```

### Network Architecture
- **upload-service**: public_net (172.18.0.7) - Direct internet access
- **processing-service**: private_net (172.19.0.7) - Internal only
- **ai-service**: private_net (172.19.0.8) - Internal only
- **nginx-gateway**: Both networks - Routes between public and private

### Next Steps (Phase 2)
- RabbitMQ for async messaging
- Redis for session management
- MinIO for persistent storage
- PostgreSQL for metadata
- Prometheus/Grafana monitoring

---

## Domain Isolation Rules

### ✅ DO: Focus on Week-Specific Content
- **Week 01 students:** Study TCP, MIME-typing, file transfer (COMPLETE)
- **Week 02 students:** Study state management, authentication patterns (COMPLETE)
- **Week 03 students:** Study microservices, service orchestration, API gateway (CURRENT)

### ❌ DON'T: Mix Curriculum Across Weeks
- **Week 03 students:** Do NOT focus on MIME-server (Week 01)
- **Week 03 students:** Do NOT get distracted by session APIs (Week 02)
- Focus exclusively on microservices architecture and service coordination

### 📚 DO: Build Knowledge Sequentially
- Week 02 required understanding Week 01 TCP basics ✅
- Week 03 requires understanding Week 02 session management ✅
- Each week's concepts enable the next

---

## Hybrid Setup: mockup-infra

The mockup-infra contains services from multiple weeks:

```yaml
mockup-infra/docker-compose.yml:
services:
  # Week 01 Services (Optional Reference)
  mime-server:       # Port 65432 - DEPRECATED for Week 02
  mime-client:       # Manual execution - DEPRECATED for Week 02
  
  # Week 02 Services (Primary Focus)
  stateless-api:     # Port 3000 - FOCUS HERE
  stateful-api:      # Port 3001 - FOCUS HERE
  nginx-gateway:     # Port 80/443 - Supporting
  
  # Week 01 Context Services (Always Running)
  public_app:        # Port 80
  intranet_api:      # Port 5000
```

### Usage by Week

**For Week 03 Students (CURRENT WEEK):**
```bash
# Start mockup-infra with Week 03 services ONLY
cd mockup-infra
podman-compose --profile week03 up -d

# Test Week 03 services
curl http://localhost:8080/api/upload/health
curl http://localhost:8080/api/processing/health
curl http://localhost:8080/api/ai/health

# Stop Week 03 services
podman-compose --profile week03 down
```

**For Reference: Week 02 Services (DEPRECATED)**
```bash
# Start Week 02 services for review only
cd mockup-infra
podman-compose --profile week02 up -d

# Test Week 02 services
curl http://localhost:8080/api/stateless/health
curl https://localhost/api/stateful/health

# Stop Week 02 services
podman-compose --profile week02 down
```

**For Running Multiple Weeks (Advanced):**
```bash
# Start both Week 02 and Week 03 services
podman-compose --profile week02 --profile week03 up -d

# Or start all services (all weeks)
podman-compose --profile week01 --profile week02 --profile week03 up -d
```

**Base Services (Always Available):**
The following services run without profiles and are always available:
- `nginx-gateway` (Port 80/443) - Gateway and TLS termination
- `public_app` (Port 80) - Public web context service
- `intranet_api` (Port 5000) - Private network context service


---

## Service Ownership Matrix

| Service | Week 01 | Week 02 | Week 03 | Profile | Active |
|---------|---------|---------|---------|---------|--------|
| mime-server | ✅ Primary | ⚠️ Deprecated | ❌ N/A | week01 | Yes (Ref only) |
| mime-client | ✅ Primary | ⚠️ Deprecated | ❌ N/A | week01 | Yes (Ref only) |
| stateless-api | ❌ N/A | ✅ Primary | ⚠️ Optional | week02 | Yes |
| stateful-api | ❌ N/A | ✅ Primary | ⚠️ Optional | week02 | Yes |
| upload-service | ❌ N/A | ❌ N/A | ✅ Primary | week03 | Yes |
| processing-service | ❌ N/A | ❌ N/A | ✅ Primary | week03 | Yes |
| ai-service | ❌ N/A | ❌ N/A | ✅ Primary | week03 | Yes |
| nginx-gateway | ❌ N/A | ✅ Supporting | ✅ Supporting | (none) | Yes |
| public_app | ✅ Context | ✅ Context | ✅ Context | (none) | Yes |
| intranet_api | ✅ Context | ✅ Context | ✅ Context | (none) | Yes |

---

## Learning Paths

### Path 1: Sequential (Recommended)
```
Week 01 → Week 02 → Week 03
  ✅         ✅        📋
Complete   In Progress  Planned
```

### Path 2: Week 02 Only (Standalone)
```
Jump directly to Week 02 Phase 1
- Requires: Basic TCP knowledge (or crash course)
- Time: 1 week
- Skips: Full Week 01 protocol deep-dive
```

### Path 3: Week 02 + Phase 2 Production
```
Week 02 Phase 1 (Node.js) → Phase 2 (Python/FastAPI)
- Same concepts, production-grade infrastructure
- Adds: Database, Redis, migrations
- Time: 2-3 weeks
```

---

## Summary: What to Do This Week

### ✅ This Week (Week 03 - CURRENT)
1. Study microservices architecture in `week03-microservices/README.md`
2. Run `upload-service`, `processing-service`, and `ai-service`
3. Understand API gateway pattern and service orchestration
4. Explore network isolation (public vs private networks)
5. Complete Phase 1 exercises and file upload workflow

### 📚 Reference (Previous Weeks if Needed)
**Week 02 (Session Management):**
1. Stateless vs stateful patterns
2. JWT and session-based authentication
3. Horizontal scaling implications

**Week 01 (TCP Protocols):**
1. TCP protocol details
2. MIME-server for protocol examples
3. Message framing concepts

---

**Curriculum Design Principle:**
Each week focuses on ONE architectural concern. Don't mix concerns across weeks. This isolation ensures clear learning and prevents cognitive overload.

**Last Updated:** February 13, 2026  
**Curriculum Starts:** January 2026  
**Current Week:** Week 03 - Distributed Microservices  
**Week 03 Progress:** Phase 1 Complete (Core infrastructure ready, curriculum study starting)
