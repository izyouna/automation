# Week 02: Stateless vs Stateful Server Architecture

> **Key Concept**: TCP keeps connections alive. Applications decide whether conversations remember anything.  
> The Session Layer is where software chooses: *Am I talking once, or are we building a relationship?*

## Learning Objectives

By the end of this week, you will understand:

1. **Session Layer Responsibility** — The OSI Session Layer (Layer 5) is not a library; it's a *design responsibility*
2. **Stateless Trade-offs** — Why stateless systems scale horizontally but require verbose messaging
3. **Stateful Trade-offs** — Why stateful systems enable rich interactions but create coupling to server state
4. **Session Management** — How to implement session creation, validation, timeout, and cleanup
5. **TCP is Not Enough** — TCP provides connection reliability, not application-level session semantics
6. **Distributed Sessions** — How to move from in-process state to Redis-backed shared state

## Project Structure

```
week02-stateless-stateful/
├── phase1-mockup/           # Light mockup for concept validation
│   ├── src/
│   │   ├── stateless-server.js      # Express.js stateless server
│   │   ├── stateful-server.js       # Express.js stateful server
│   │   └── clients/                 # Test clients
│   ├── tests/                       # Jest test suite
│   ├── docs/
│   │   ├── api-reference.md         # All endpoints documented
│   │   ├── concepts.md              # Theory of stateless vs stateful
│   │   └── transition-to-phase2.md  # How Phase 1 maps to Phase 2
│   ├── package.json
│   ├── server.js                    # Run either server
│   └── README.md
│
├── phase2-production/       # Production-grade implementation
│   ├── app/
│   │   ├── main.py                  # FastAPI application
│   │   ├── api/                     # Route handlers
│   │   ├── models/                  # Database models (SQLAlchemy)
│   │   ├── services/                # Business logic
│   │   └── core/                    # Config, logging, security
│   ├── migrations/                  # Alembic database migrations
│   ├── tests/                       # Pytest suite
│   ├── docker-compose.yml           # Local development environment
│   ├── Dockerfile                   # Production container
│   ├── requirements.txt             # Python dependencies
│   ├── QUICK_START.md              # 5-minute setup guide
│   └── README.md
│
├── scripts/                         # Utility scripts
│   ├── validate-staging.ps1        # PowerShell validation
│   └── cleanup.sh                  # Docker cleanup
│
├── implementation_plan.md           # Detailed 8-week implementation plan
├── master_development_plan.md       # High-level roadmap
├── source.md                        # Original specification
└── README.md                        # This file
```

## Quick Start: Phase 1 (Mockup - Node.js/Express)

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Setup
```bash
cd phase1-mockup
npm install
```

### 2. Run Stateless Server
```bash
# Terminal 1
npm run server:stateless
# Server listening on http://localhost:3000
```

### 3. Run Stateful Server
```bash
# Terminal 2
npm run server:stateful
# Server listening on http://localhost:3001
```

### 4. Test with Client Examples
```bash
# Terminal 3
npm run test:client-stateless
npm run test:client-stateful
```

### 5. Run Full Test Suite
```bash
npm test
```

## Quick Start: Phase 2 (Production - Python/FastAPI)

### Prerequisites
- Python 3.11+
- Docker and Docker Compose
- PostgreSQL client (optional)

### 1. Setup Environment
```bash
cd phase2-production

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Start Services with Docker Compose
```bash
docker-compose up -d

# Services start:
# - PostgreSQL on localhost:5432
# - Redis on localhost:6379
# - API on localhost:8000
```

### 3. Initialize Database
```bash
cd app
alembic upgrade head
cd ..
```

### 4. Run Application
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. View API Documentation
```
http://localhost:8000/docs (Swagger UI)
http://localhost:8000/redoc (ReDoc)
```

### 6. Run Tests
```bash
pytest tests/ -v
```

## Architecture Overview

### Stateless Architecture (Phase 1)

```
REQUEST FLOW:
1. Client → [credentials + full state] → Server
2. Server processes, returns response
3. Connection closes or continues
4. Client must provide same credentials + state on next request

CHARACTERISTICS:
✓ No server storage per client
✓ Easy to scale horizontally
✓ Any server can handle any request
✓ Resilient to server crashes (no lost state)
✗ Verbose messaging (repeat context each time)
✗ Stateless server can't personalize
```

**Use Cases**:
- REST APIs (pure form)
- DNS queries
- Load-balanced systems without affinity
- Microservices with external session store

### Stateful Architecture (Phase 1)

```
REQUEST FLOW:
1. Client → [CONNECT] → Server
2. Server → [SESSION_ID: abc123] → Client
3. Client → [SESSION: abc123, action1] → Server
4. Server updates internal state, returns response
5. Client → [SESSION: abc123, action2] → Server (uses same session)
6. Client → [DISCONNECT] → Server
7. Server → [cleanup session] → done

CHARACTERISTICS:
✓ Rich, expressive protocols
✓ Context carried implicitly in session ID
✓ Server can personalize experience
✓ Efficient (don't repeat context each time)
✗ Server must maintain state
✗ Single point of failure (session loss = context loss)
✗ Harder to scale (servers must be sticky/affine)
✗ Complex cleanup on disconnect
```

**Use Cases**:
- Chat servers
- Online games
- SSH sessions
- Shopping carts
- File upload workflows

### Distributed Sessions (Phase 2)

```
REQUEST FLOW (with Redis):
1. Client → [credentials] → LoadBalancer → Server A
2. Server A → [SESSION_ID: xyz789] → Client
3. Server A stores in Redis: sessions:xyz789 = {user_id, state, timestamp}
4. Client → [SESSION: xyz789, action] → LoadBalancer → Server B
5. Server B retrieves from Redis, processes, updates Redis
6. Any server can answer; no affinity needed!

ADVANTAGES:
✓ Horizontal scaling (add servers easily)
✓ No single point of failure (Redis is replicated)
✓ Stateful semantics + stateless architecture
✓ Session state survives server restart
```

## Key Concepts

### 1. TCP vs Session Layer

| Level | Responsibility | Provides | Doesn't Provide |
|-------|-----------------|----------|-----------------|
| **TCP (Transport)** | Reliable delivery | Ordered bytes, retransmission | Message boundaries, application context |
| **Session (Application)** | Conversation continuity | Session ID, conversation context | Automatic timeout, cleanup |

**Critical Truth**: 
```python
# ❌ WRONG: Confusing TCP connection with session
socket_connection_1 = connect()  # TCP socket
socket_connection_1.send("hello")
socket_connection_1.close()

socket_connection_2 = connect()  # NEW TCP socket
# Server DOES NOT remember "hello" from connection 1
# Unless you implemented application-level session memory!
```

### 2. Session Lifecycle

```
BIRTH:
  Client → [CONNECT] → Server
  Server generates unique ID, initializes empty context
  
GROWTH:
  Client → [SESSION: ID, action1] → Server
  Server updates context in memory/Redis/database
  
MATURITY:
  Multiple actions with same ID
  Server maintains consistent state across requests
  
DEATH (4 scenarios):

  a) Normal: Client → [DISCONNECT] → Server cleans up
  
  b) Timeout: Server checks inactivity, deletes old sessions
  
  c) Explicit: Admin or security event triggers immediate termination
  
  d) Crash: Session lost (Phase 2 uses Redis to prevent this)
```

### 3. State Representation

**Phase 1 (In-Memory)**:
```javascript
// Simple object in server memory
const sessions = {
  'abc123': {
    user_id: 'john',
    created_at: 1502345678,
    files_uploaded: ['file1.txt', 'file2.png'],
    last_activity: 1502345900,
  }
};
```

**Phase 2 (Redis)**:
```python
# Serialized in Redis, accessed by any server
redis.setex(
    'session:abc123',
    3600,  # 1 hour expiration
    json.dumps({
        'user_id': 'john',
        'created_at': datetime.utcnow().isoformat(),
        'files_uploaded': ['file1.txt', 'file2.png'],
        'last_activity': datetime.utcnow().isoformat(),
    })
)
```

### 4. Session Timeout and Cleanup

```python
# When should a session expire?
TIMEOUT_SECONDS = 3600  # 1 hour of inactivity

# Option 1: Lazy cleanup (Phase 1)
@app.get("/files")
def get_files(session_id: str):
    session = sessions.get(session_id)
    if not session:
        raise SessionExpired()
    
    # Check if expired
    if time.time() - session['last_activity'] > TIMEOUT_SECONDS:
        del sessions[session_id]
        raise SessionExpired()
    
    session['last_activity'] = time.time()
    return list_files(session['user_id'])

# Option 2: Redis auto-expiration (Phase 2)
redis.setex(
    f'session:{session_id}',
    TIMEOUT_SECONDS,
    session_data
)
# Redis automatically deletes after timeout, no cleanup code needed!
```

## API Endpoints

### Stateless Mode

```
POST   /api/upload
       Body: {username, password, file}
       Response: {file_id, url}
       Note: Credentials sent every request

GET    /api/files/{file_id}
       Query: username, password  (must authenticate!)
       Response: {file_id, content}

DELETE /api/files/{file_id}
       Query: username, password
       Response: {message}
```

### Stateful Mode

```
POST   /api/session/start
       Body: {username, password}
       Response: {session_id, expires_in}

POST   /api/upload
       Headers: X-Session-ID: {session_id}
       Body: {file}
       Response: {file_id, url}

GET    /api/files/{file_id}
       Headers: X-Session-ID: {session_id}
       Response: {file_id, content}

POST   /api/session/end
       Headers: X-Session-ID: {session_id}
       Response: {message}
```

See [phase1-mockup/docs/api-reference.md](phase1-mockup/docs/api-reference.md) for complete specification.

## Testing Strategy

### Unit Tests
- Session creation and validation
- State serialization
- Expiration logic

### Integration Tests
- Stateless workflow (auth + upload + download + delete)
- Stateful workflow (session → upload → download → disconnect)
- Session timeout behavior
- Concurrent requests with same session

### Phase 2 Integration
- PostgreSQL persistence
- Redis cache layer
- Load balancer affinity testing
- Database recovery scenarios

Run tests:
```bash
# Phase 1
npm test

# Phase 2
pytest tests/ -v --cov=app
```

## Common Questions

**Q: If TCP keeps connections open, why do we need sessions?**  
A: TCP guarantees the connection exists and messages arrive in order. It does *not* guarantee the server remembers anything. Sessions are application-level memory.

**Q: When should I use stateless vs stateful?**  
A: **Stateless** for APIs, microservices, and simple CRUD operations. **Stateful** for chat, games, complex workflows. Most modern systems use *hybrid*: stateless execution + external session store (Redis).

**Q: What happens if my stateful server crashes?**  
A: Session memory is lost. **Phase 2 solves this**: store sessions in Redis (external), so any server can serve any client.

**Q: How do I scale stateful services?**  
A: Use Redis. Don't store state in server memory. This pattern is called "shared session store" and enables infinite horizontal scaling.

**Q: Is Phase 1 (Node.js) just a toy?**  
A: No. Phase 1 teaches concepts clearly with minimal infrastructure. Phase 2 is production-grade and demonstrates the same concepts at scale.

## Deployment

### Phase 1 (Development)
```bash
npm run server:stateless &
npm run server:stateful &
# Direct port access on localhost
```

### Phase 2 (Production)
```bash
# Docker Compose (staging/development)
docker-compose up -d

# Kubernetes (production)
# See phase2-production/deployment/ for Helm charts
kubectl apply -f deployment/kubernetes/
```

## Next Steps

1. **Understand the concepts** — Read [phase1-mockup/docs/concepts.md](phase1-mockup/docs/concepts.md)
2. **Run Phase 1** — Get the mockup working, see both patterns in action
3. **Study the difference** — Compare `stateless-server.js` and `stateful-server.js` line-by-line
4. **Write tests** — Create test cases that demonstrate statelessness and statefulness
5. **Build Phase 2** — Implement in Python with Redis for horizontal scaling
6. **Deploy** — Get it running on a real server

## Additional Resources

- [Phase 1 API Reference](phase1-mockup/docs/api-reference.md)
- [Concepts: Stateless vs Stateful](phase1-mockup/docs/concepts.md)
- [Phase 2 Quick Start](phase2-production/QUICK_START.md)
- [Master Development Plan](master_development_plan.md)
- [Implementation Plan](implementation_plan.md)

## Building Intuition: The Goldfish vs Long Memory Model

### Stateless (Goldfish)
Every request: "Hi, I'm user john. Here's my password. I want to upload a file called document.pdf."  
Server: "OK john, here's your file ID. Come back anytime."  
Next request: "Hi, I'm user john. Here's my password again. Give me my file."  
Server: "Which file? Tell me the ID again."

**Pro**: Can completely forget users (scales infinitely)  
**Con**: Lots of repetition (verbose)

### Stateful (Long Memory)
Request 1: "Hi, I'm user john. Here's my password."  
Server: "OK john, here's your session ID: abc123. You're logged in."  
Request 2: "Session abc123: upload file document.pdf"  
Server: "OK, saved. I remember you're john."  
Request 3: "Session abc123: list my files"  
Server: "You have document.pdf, photo.jpg, ..."

**Pro**: Rich interactions, efficient communication  
**Con**: Must remember john somewhere (harder to scale)

## Getting Help

- Check the [Phase 1 API Reference](phase1-mockup/docs/api-reference.md) for endpoint details
- Review test cases in `tests/` for working examples
- Read the [Concepts](phase1-mockup/docs/concepts.md) document for theory
- Consult [Week 02 Summary](../DETAILED_COURSE_SUMMARY.md#iii-week-02-stateless-vs-stateful-architecture) for deep dive

---

**Last Updated**: February 2026  
**For Questions**: See implementation documentation or course materials
