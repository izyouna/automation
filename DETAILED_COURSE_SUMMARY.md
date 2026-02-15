# Comprehensive Course Summary: Systems Architecture & AI Governance (10 Weeks)

## I. Introduction

This 10-week course teaches modern systems architecture and AI governance by progressively building from fundamental protocols through production-grade, AI-native systems. Rather than teaching abstract concepts, students solve real problems that exist in production systems and learn why certain architectural patterns matter.

The course spirals upward through multiple dimensions:

**Technical Dimension** (Weeks 01-04):
- Protocols and reliability (Week 01)
- State management (Week 02)
- Service decomposition (Week 03)
- Security & compliance (Week 04)

**Architectural Dimension** (Weeks 05-06):
- Boundary design (Week 05)
- Reasoning about systems (Week 06)

**AI-Native Dimension** (Weeks 07-09):
- Governing individual AI systems (Week 07)
- Coordinating multiple AIs (Week 08)
- Making systems auditable & trustworthy (Week 09)

**Professional Dimension** (Week 10):
- Integrating everything into a defensible architecture
- Presenting as a senior architect

---

## II. Week 01: MIME-Based Socket File Transfer

### 2.1 Learning Objectives

After Week 01, students understand:
- How TCP provides reliable stream delivery but not message boundaries
- How to design application-level protocols with clear message framing
- How to handle binary data transmission safely
- How to implement blocking socket operations correctly
- The importance of shared protocol specifications between client and server

### 2.2 Problem Statement

Raw TCP is a *stream* of bytes—it doesn't understand messages, file boundaries, or data types. Sending a file from client to server requires:

1. **Framing Problem**: How does the receiver know where one message ends and another begins?
2. **Type Problem**: How does the receiver know what type of data to expect?
3. **Sizing Problem**: How many bytes should be read before considering the message complete?

### 2.3 Architecture and Design

**Shared Protocol** (`shared/protocol.py`):
```
Message Format:
┌─────────────────────────────────────────────────────────────┐
│ JSON Header (UTF-8)        │ Newline │ Binary Payload      │
│ {"mime_type": "...",       │ '\n'    │ (raw bytes)         │
│  "size": 1024}             │         │                     │
└─────────────────────────────────────────────────────────────┘
```

This approach:
- **Solves framing**: Newline terminates header
- **Solves typing**: MIME type specifies data interpretation
- **Solves sizing**: `size` field tells receiver how many payload bytes to read
- **Improves extensibility**: JSON structure allows adding fields (timestamp, encryption, etc.)

**Key Helper Functions**:
- `prepare_packet(mime_type, data)`: Wraps data with header
- `read_exactly(socket, n)`: Ensures we read exactly n bytes (prevents short reads from TCP buffer)

### 2.4 Implementation Variants

**Basic Server** (`server/main.py`):
- Single connection
- Sequential file reception
- Synchronous processing
- Files saved with sanitized names

**Enhanced Server** (`server/main_enhanced.py`):
- Command-line configuration (host, port, storage directory)
- Error handling and soft shutdown (SIGINT)
- Optional acknowledgment messages
- Logging with verbosity control
- Configurable timeouts

**Threaded Server** (`server/main_threaded.py`):
- Concurrent client handling with threading
- Thread-safe file operations
- Graceful connection cleanup
- Foundation for Week 03 horizontal scaling

**Basic Client** (`client/main.py`):
- Hardcoded file paths
- Automatic MIME type detection
- Sequential file transmission
- Simple error reporting

**Enhanced Client** (`client/main_enhanced.py`):
- CLI arguments for files, host, port
- Retry logic with exponential backoff
- Timeout configuration
- Connection pooling preparation

### 2.5 Key Learning: The Unreliable Receiver Problem

A critical lesson: **TCP guarantees delivery, but not atomicity at the application layer**.

```python
# ❌ WRONG - Assumes one recv() = one message
def receive_file(sock):
    header = sock.recv(1024)  # May not read full header!
    payload = sock.recv(1024) # May read only partial payload!
    
# ✅ RIGHT - Read exactly what we need
def receive_file(sock):
    header_line = sock.readline()      # Use makefile('rb')
    header = json.loads(header_line)
    payload = read_exactly(sock, header['size'])  # Loop until complete
```

### 2.6 Testing Strategy

- **Unit Tests** (`test_basic.py`): Protocol serialization/deserialization
- **Integration Tests** (`test_integration.py`): Client-server end-to-end with threading
- **Docker Testing** (`Dockerfile.server`): Container deployment verification

### 2.7 Deliverables

- ✅ Working client and server with protocol specification
- ✅ Shared protocol module demonstrating DRY principle
- ✅ Three server variants (basic, enhanced, threaded)
- ✅ Test suite with >80% coverage
- ✅ Complete README with quick-start guide

---

## III. Week 02: Stateless vs Stateful Architecture

### 3.1 Learning Objectives

After Week 02, students understand:
- **TCP provides connection persistence, but applications choose memory**
- The Session Layer (OSI Layer 5) is a *design responsibility*, not a library
- Architectural tradeoffs between stateless and stateful systems
- Session management patterns: creation, validation, timeout, cleanup
- When to use each approach and what happens when you choose poorly

### 3.2 Conceptual Foundation

**Critical Insight**: TCP guarantees the connection stays open. It does NOT guarantee the server remembers anything.

The Session Layer decides:
- *Am I talking to the same client as before?*
- *Do I remember what they said last?*
- *What happens if they disconnect halfway through?*

### 3.3 Stateless Interaction Pattern

**Mental Model**: Every request carries all context; server has amnesia

**Characteristics**:
- No server memory per client
- Easy to scale (any server can answer any request)
- Easy to replicate (no state to synchronize)
- Harder to personalize (must send full context each time)

**Example Flow**:
```
CLIENT → [authentication credentials + file metadata] → SERVER
SERVER → [ACK] → (connection may close)
(If client reconnects, provide auth credentials again)
```

**Real-World Examples**:
- REST APIs (pure form)
- DNS queries
- HTTP GET requests
- Load-balanced healthcare systems (each request is independent)

**Failure Mode**: 
```
Client assumes: "The server remembers I uploaded 500MB yesterday"
Server reality: "I have no idea who you are beyond this request"
Result: Client must re-authenticate, re-upload metadata, waste bandwidth
```

### 3.4 Stateful Interaction Pattern

**Mental Model**: The conversation has context; server remembers the relationship

**Characteristics**:
- Server maintains per-client session state
- Enables rich, expressive protocols
- Single point of failure (session gets lost if server crashes)
- Harder to scale (state must be replicated/distributed)

**Example Flow**:
```
CLIENT → [CONNECT request] → SERVER
SERVER → [SESSION_ID: abc123] → CLIENT
CLIENT → [SESSION: abc123, action1] → SERVER
SERVER → [RESPONSE, update internal state] → CLIENT
CLIENT → [SESSION: abc123, action2] → SERVER
...
CLIENT → [SESSION: abc123, DISCONNECT] → SERVER
SERVER → [CLEANUP session abc123] → CLIENT
```

**Real-World Examples**:
- Chat servers (track conversation history, member list)
- Online games (track player state, inventory, location)
- SSH sessions (authenticate once, multiple commands thereafter)
- Shopping carts (track items across multiple page views)

**Failure Mode**:
```
Client disconnects unexpectedly
Server: "Do I wait for reconnection? How long? Delete the session?
        What if they reconnected to a different server?"
Complexity explodes.
```

### 3.5 TCP Does NOT Provide Application-Level Statefulness

This is where students get confused. TCP provides:
- Sequence numbers (ordering)
- Acknowledgments (reliability)
- Connection identification (same socket)

TCP does **NOT** provide:
- Session identity across connections
- Application context preservation
- Automatic cleanup on disconnect

**Example Confusion**:
```python
# ❌ WRONG: Thinking TCP connection = session
socket_1 = connect_to_server()  # TCP maintains this socket
socket_1.send("FILE1")
socket_1.close()

socket_2 = connect_to_server()  # NEW TCP connection, but...
# Does server remember "FILE1"? NO! Different TCP connection
# The server's session store MIGHT remember, but that's application code
```

### 3.6 Implementation Architecture

**Phase 1: Mockup** (Node.js/Express)
- In-memory session store
- JSON-based state persistence
- API specification for stateless and stateful endpoints
- Client examples demonstrating both modes

**Phase 2: Production** (Python/FastAPI with Redis)
- Distributed session store (Redis) for scalability
- Session timeout and cleanup mechanisms
- Database persistence for long-lived state
- Load balancer forwarding to session-aware servers

**Session Management Components**:
1. **Session Creator**: Generate unique session ID
2. **Session Validator**: Check if session exists and is valid
3. **Session Accessor**: Retrieve/update session state
4. **Session Cleaner**: Remove expired sessions

### 3.7 Stateless Implementation Example

```python
# Stateless: Each request includes full context
@app.post("/upload")
async def upload_stateless(request: UploadRequest):
    # Must include credentials, file metadata
    authenticate(request.username, request.password)
    
    # Process immediately
    file_id = save_file(request.file)
    
    # Return everything needed for next request
    return {
        "file_id": file_id,
        "status": "uploaded",
        "next_action": "process",  # Client must send this next time
    }
```

**Pros**: Scales easily, simple to reason about  
**Cons**: Repeated work, higher client complexity, verbose messages  

### 3.8 Stateful Implementation Example

```python
# Stateful: Session ID carries context
sessions = {}  # In practice: Redis

@app.post("/session/start")
async def create_session(creds: Credentials):
    authenticate(creds.username, creds.password)
    
    session_id = generate_id()
    sessions[session_id] = {
        "user_id": creds.username,
        "created_at": now(),
        "files_uploaded": [],
    }
    return {"session_id": session_id}

@app.post("/upload")
async def upload_stateful(session_id: str, file: UploadFile):
    if session_id not in sessions:
        raise SessionExpired()
    
    file_id = save_file(file)
    sessions[session_id]["files_uploaded"].append(file_id)
    
    return {"file_id": file_id, "session_status": "active"}
```

**Pros**: Rich context, efficient communication  
**Cons**: Server must manage state, session failures are painful  

### 3.9 Testing and Validation

**Stateless Verification**:
- Close connection between requests
- Server should still process correctly
- No server-side side effects expected

**Stateful Verification**:
- Session IDs are unique
- Session expires after timeout
- Disconnection triggers cleanup
- Multiple clients get separate sessions

### 3.10 Deliverables

- ✅ Dual-mode serverss (stateless and stateful)
- ✅ Complete API specification (OpenAPI/Swagger)
- ✅ Session management system with timeouts
- ✅ Client examples demonstrating both patterns
- ✅ Integration tests verifying architectural properties
- ✅ Documentation explaining tradeoffs

---

## IV. Week 03: Cloud-Native Microservices

### 4.1 Learning Objectives

After Week 03, students understand:
- Microservice decomposition principles
- Distributed system communication patterns (REST, async queues, events)
- Service mesh concepts and inter-service authentication
- Container orchestration fundamentals
- How distributed state management differs from monolithic applications
- Resilience patterns: retries, timeouts, circuit breakers

### 4.2 From Monolith to Microservices

**Week 01-02 Reality**: Single server handles uploads and state  
**Week 03 Challenge**: Decompose into independent, deployable services

**Monolithic Architecture**:
```
File Transfer System:
├── Authentication
├── File Validation  
├── File Storage
├── Metadata Management
├── Processing Logic
├── Notifications
└── All in one process
```

**Microservice Architecture**:
```
Upload Service      →   Validates files, receives uploads
Processing Service  →   Transforms/analyzes content
Metadata Service    →   Tracks file information, status
Storage Service     →   Manages persistent storage
AI Service          →   Performs ML-based analysis
Notification Service→   Sends alerts and status updates
```

### 4.3 Why This Matters

**Scaling Problem**: Monolith must scale the entire application; microservices scale services independently

**Example**:
```
Scenario: 1000 files upload daily, but only 10 need AI analysis

Monolith: Buy server 100x larger than needed (oversizes for AI)
Microservices: 
  - Upload Service: 2 instances
  - AI Service: 1 instance
  Cost 20x lower, better resource utilization
```

**Failure Isolation**: One service's bug doesn't crash the entire system

**Technology Flexibility**: Different services can use different databases, languages, frameworks

**Deployment Independence**: Update metadata service without touching upload service

### 4.4 Microservice Architecture

**Core Services**:

1. **Upload Service** (FastAPI)
   - HTTP endpoint: `/files` (POST to upload)
   - Validates file size, type, content
   - Delegates to storage service
   - Publishes "file.uploaded" event
   - Returns file metadata

2. **Storage Service** (MinIO object storage)
   - Stores binary file content
   - Implements versioning and backup
   - Provides signed URLs for retrieval
   - Handles compression and deduplication

3. **Metadata Service** (PostgreSQL + FastAPI)
   - Tracks file properties
   - Maintains audit trail
   - Indexes for search
   - Updates based on processing results

4. **Processing Service** (Celery + FastAPI)
   - Consumes file.uploaded events
   - Performs transformations (resize, convert, etc.)
   - Stores results
   - Updates metadata service

5. **AI Service** (Python/FastAPI)
   - Analyzes file content
   - Detects objects, sentiment, key information
   - Returns insights for metadata
   - Handles inference requests

6. **Metadata Service** (PostgreSQL + FastAPI)
   - Records all events and state changes
   - Enables audit capabilities
   - Supports tracing and debugging

### 4.5 Communication Patterns

**Synchronous (REST)** - Used when immediate response needed:
```
Upload Service → [HTTP POST] → Storage Service
                   ← [file_url] ←
```

**Asynchronous (Message Queue)** - Used when loose coupling needed:
```
Upload Service → [publish "file.uploaded"] → RabbitMQ
                                               ↓
                   Processing Service ← [consume event]
                   AI Service         ← [consume event]
```

**Benefits of Async**:
- Upload Service doesn't wait for processing
- Processing and AI can fail independently  
- Services can be scaled/restarted without affecting upload
- Queue acts as backpressure buffer

### 4.6 Containerization (Docker)

**Problem**: "Works on my machine" syndrome

**Solution**: Package entire service with OS, dependencies, code

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY ./app .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0"]
```

**Advantages**:
- Development, staging, production use identical images
- Services can be deployed to any Docker host
- Version control for entire environment
- Easy horizontal scaling

### 4.7 Orchestration (Docker Compose for Phase 1, Kubernetes for Phase 2)

**Phase 1: Integrated Mockup (Toy Model)**:
- Containerized services (Upload, Processing, AI) in `mockup-infra`
- Local storage simulation using Docker volumes
- Nginx-based API Gateway for service orchestration
- Strictly isolated networks for "Public" vs "Private" services
- Podman-compose profiles for domain-specific execution

**Phase 2 (Production)**:
```yaml
# Kubernetes manifest
apiVersion: apps/v1
kind: Deployment
metadata:
  name: upload-service
spec:
  replicas: 3
  template:
    containers:
    - name: upload-service
      image: registry.example.com/upload-service:latest
      resources:
        requests:
          memory: "256Mi"
          cpu: "250m"
        limits:
          memory: "512Mi"
          cpu: "500m"
      livenessProbe:
        httpGet:
          path: /health
          port: 8000
        initialDelaySeconds: 30
        periodSeconds: 10
```

### 4.8 Distributed State Management

**Critical Change from Weeks 1-2**:
- Can no longer store session state in process memory
- Must use external store (Redis, database)
- Must handle service restarts/failures gracefully

**Session Management with Redis**:
```python
import redis

redis_client = redis.Redis(host='redis', port=6379)

@app.post("/session/start")
async def create_session(creds: Credentials):
    session_id = generate_id()
    session_data = {
        "user_id": creds.username,
        "created_at": datetime.now().isoformat(),
        "service_instance": os.environ.get("HOSTNAME"),
    }
    
    # Store in Redis with 1-hour expiration
    redis_client.setex(
        f"session:{session_id}",
        3600,
        json.dumps(session_data)
    )
    
    return {"session_id": session_id}

@app.post("/upload")
async def upload_file(session_id: str, file: UploadFile):
    # Session can be retrieved from ANY service instance
    session_data = redis_client.get(f"session:{session_id}")
    
    if not session_data:
        raise SessionExpired()
    
    # Rest of logic...
```

**Key Insight**: Service A can create a session, service B can retrieve it

### 4.9 Resilience Patterns

**Retry Logic**:
```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10)
)
async def call_storage_service(file_data):
    async with httpx.AsyncClient() as client:
        return await client.post(
            "http://storage-service:8001/store",
            data=file_data
        )
```

**Circuit Breaker**:
```python
# If service fails 5 times in a row, stop calling it temporarily
from pybreaker import CircuitBreaker

storage_breaker = CircuitBreaker()

async def store_file(data):
    try:
        return await storage_breaker.call(call_storage_service, data)
    except CircuitBreaker.CircuitBreakerListener.CircuitBreakerOpenedListener:
        # Circuit is open, service is down
        # Queue the request for later retry
        await queue_for_retry(data)
```

**Timeout**:
```python
async def process_with_timeout(file_id: str):
    try:
        return await asyncio.wait_for(
            AI_SERVICE.analyze(file_id),
            timeout=30  # AI must respond in 30 seconds
        )
    except asyncio.TimeoutError:
        # Return partial results or fallback
        return {"status": "timeout", "file_id": file_id}
```

### 4.10 Testing Distributed Systems

**Component Testing**: Unit tests for each service in isolation

**Integration Testing**: Test service-to-service communication
```python
def test_upload_to_metadata_flow():
    # 1. Upload file
    response = client.post("/files", files={"file": test_file})
    file_id = response.json()["file_id"]
    
    # 2. Metadata should be created
    metadata = get_metadata(file_id)
    assert metadata["status"] == "uploaded"
    
    # 3. Processing should update status
    process_file(file_id)
    metadata = get_metadata(file_id)
    assert metadata["status"] == "processed"
```

**Chaos Engineering**: Intentionally break things to verify resilience
```python
# Simulate storage service being down
@patch("storage_service.store")
def test_upload_with_storage_down(mock_store):
    mock_store.side_effect = ConnectionError()
    
    response = upload_file(test_file)
    
    # Should queue for retry, not crash
    assert response.status_code == 202  # Accepted
    assert request_in_retry_queue(response.json()["request_id"])
```

### 4.11 Observability

**Problem**: Distributed systems make debugging hard

**Solution**: Structured logging and tracing across services

**Logging Example**:
```python
import structlog

log = structlog.get_logger()

@app.post("/files")
async def upload_file(file: UploadFile):
    log.info(
        "upload_started",
        file_name=file.filename,
        file_size=file.size,
        request_id=get_request_id(),
    )
    
    try:
        file_id = save_file(file)
        log.info(
            "upload_completed",
            file_id=file_id,
            request_id=get_request_id(),
        )
        return {"file_id": file_id}
    except Exception as e:
        log.error(
            "upload_failed",
            error=str(e),
            request_id=get_request_id(),
        )
        raise
```

**Distributed Tracing** (Jaeger/Zipkin):
```
Client Request: "upload file.pdf"
  ↓
Upload Service (span: handle_upload)
  → calls Storage Service (span: store_file)
    → calls Metadata Service (span: create_metadata)
All spans linked by trace_id, enabling end-to-end debugging
```

### 4.12 Deliverables

- ✅ Five microservices with clear responsibilities
- ✅ Docker Compose setup for local development
- ✅ Kubernetes manifests for production deployment
- ✅ API documentation for inter-service communication
- ✅ End-to-end test suite verifying workflows
- ✅ Observable logging and tracing infrastructure

---

## V. Week 04: Secure Governance and Compliance

### 5.1 Learning Objectives

After Week 04, students understand:
- **Security is not a feature; it's an architectural foundation**
- Zero-trust network principles
- Privacy-by-design implementation
- Regulatory compliance (GDPR, PDPA, HIPAA patterns)
- Audit logging for legal/forensic use
- Encryption at rest, in transit, and in use
- Identity and access management in distributed systems

### 5.2 The Security Evolution

**Week 01-03 Reality**: "Make it work"  
**Week 04 Reality**: "Make it work securely, auditably, and compliantly"

**From Functional to Governed**:
```
Week 03: File Processing + AI Analysis
Week 04: File Processing + AI Analysis + GDPR/PDPA + Encryption + Audit Log

Who can access data?
  Week 03: "Anyone with the file ID"
  Week 04: "Only the owner, with explicit consent, and every access is logged"

Who can see what data is processed?
  Week 03: "The system"
  Week 04: "The system (encrypted), the user (their own rights), auditors (logs only)"
```

### 5.3 Zero-Trust Architecture

**Traditional Trust Model** (Perimeter Security):
```
Internet  ← [FIREWALL] → Internal Network
         (assumed unsafe)      (assumed safe)
```

**Problem**: Compromised internal service can access everything

**Zero-Trust Model**:
```
Every request requires:
1. Identity verification (who are you?)
2. Device verification (is your device secure?)
3. Authorization check (do you have permission?)
4. Encryption (can't be snooped)
5. Audit logging (who did what, when)

Even between internal services
```

### 5.4 Components of Zero-Trust Architecture

**5.4.1 Identity Provider (Keycloak/OAuth 2.1)**

```
Client Login:
1. Client → IdP: "I'm user@example.com"
2. IdP: "Prove it—enter password"
3. Client → IdP: [password]
4. IdP: "Also, enter 2FA code"
5. Client → IdP: [2FA code]
6. IdP → Client: [access_token + refresh_token]

Service Request:
7. Client → Service: [Authorization: Bearer {access_token}]
8. Service → verify endpoint: "Is this token valid?"
9. Verify endpoint → Service: {user_id, roles, scopes}
10. Service: "Yes, authorized" → [response]
```

**Tokens are Short-Lived** (15 minutes):
- If token is stolen, its window of use is limited
- Long-lived access is refreshed using refresh tokens (only stored on server)

**Step-up Authentication** for sensitive ops:
```python
@app.delete("/users/{user_id}")
async def delete_user(user_id: str, token: str):
    # Verify standard auth
    user = verify_token(token)
    
    # Require additional verification for dangerous operation
    if not user.has_stepup_auth("delete_user"):
        raise NeedsMFA(
            message="Delete requires multi-factor auth",
            redirect_to="/mfa/challenge"
        )
    
    delete_user_data(user_id)
```

**5.4.2 Policy Engine (Open Policy Agent - OPA)**

Define authorization rules as reusable policies:

```rego
package api_authorization

# Users can read their own files
allow if {
    input.method == "GET"
    input.path = ["files", file_id]
    input.user.id == data.files[file_id].owner_id
}

# Admins can read any file, but must log it
allow if {
    input.method == "GET"
    input.path = ["files", file_id]
    input.user.role == "admin"
    log_access("admin_access", input)
}

# AI services can only read files marked as "processable"
allow if {
    input.method == "GET"
    input.service.type == "ai_processor"
    data.files[file_id].status == "processable"
}

# Default: deny everything not explicitly allowed
default allow := false
```

**Advantage**: Authorization rules are centralized, versionable, auditable

### 5.5 Privacy and Data Protection

**5.5.1 Data Classification**

Every data element is classified:
```python
# Personal Identifiable Information
class PII(BaseModel):
    user_id: str          # Restricted
    email: str            # Confidential
    phone: str            # Restricted
    home_address: str     # Restricted
    credit_card: str      # Restricted (never store!)
    purchase_history: str # Confidential
```

**Impact**: Different handling based on classification
- Restricted data: Encrypted at rest and in transit
- Confidential: Encrypted at rest and in transit, access logged
- Internal: Encrypted at rest, access not always logged
- Public: No encryption required

**5.5.2 PII Detection and Redaction**

```python
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine

analyzer = AnalyzerEngine()
anonymizer = AnonymizerEngine()

text = "John Smith's email is john@example.com and phone is 555-1234"

# Detect PII
results = analyzer.analyze(text=text, language="en")
# Results: [
#   PII(entity_type='PERSON', start=0, end=9),
#   PII(entity_type='EMAIL_ADDRESS', start=33, end=49),
#   PII(entity_type='PHONE_NUMBER', start=59, end=68),
# ]

# Redact
redacted = anonymizer.anonymize(
    text=text,
    analyzer_results=results
)
# Result: "<PERSON>'s email is <EMAIL_ADDRESS> and phone is <PHONE_NUMBER>"
```

**Consent-Based Redaction**:
```python
async def get_user_profile(user_id: str, requester_id: str):
    if requester_id != user_id and not is_admin(requester_id):
        # Non-owners see redacted profile
        return redact_profile(user_data)
    
    # Owners and admins see full profile
    return full_profile(user_data)
```

**5.5.3 Encryption**

**At-Rest Encryption** (PostgreSQL stored data):
```python
from cryptography.fernet import Fernet

class EncryptedField(TypeDecorator):
    cache_ok = True
    
    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        key = get_encryption_key()
        f = Fernet(key)
        return f.encrypt(value.encode()).decode()
    
    def process_result_value(self, value, dialect):
        if value is None:
            return None
        key = get_encryption_key()
        f = Fernet(key)
        return f.decrypt(value.encode()).decode()

# Usage:
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    email = Column(EncryptedField)  # Stored encrypted in DB
    phone = Column(EncryptedField)
```

**In-Transit Encryption** (TLS 1.3):
```nginx
# NGINX configuration
server {
    listen 443 ssl http2;
    ssl_protocols TLSv1.3 TLSv1.2;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    
    # Force HTTPS
    if ($scheme != "https") {
        return 301 https://$server_name$request_uri;
    }
}
```

**In-Use Encryption** (Client-side):
```javascript
// Browser detects sensitive field, encrypts before sending
async function uploadSensitiveFile(file) {
    const publicKey = await fetch("/crypto/public-key").then(r => r.json());
    const encryptedBlob = await encryptWithPublicKey(file, publicKey);
    
    return await fetch("/files", {
        method: "POST",
        body: encryptedBlob,
    });
}

// Server stores encrypted, never decrypts unless user explicitly requests
// User's browser has private key, only they can decrypt
```

### 5.6 Regulatory Compliance

**5.6.1 GDPR Compliance** (European privacy regulation)

Key requirements matted to technical implementation:

| GDPR Requirement | Technical Implementation |
|------------------|-------------------------|
| Lawful Basis (Article 6) | OPA policy requires consent before processing |
| Data Subject Rights (Articles 12-23) | Self-service portal for access, deletion, portability |
| Data Protection Impact Assessment (Article 35) | Risk assessment doc in repo; automatic tests check compliance |
| Data Minimization (Article 5) | Privacy gateway redacts unnecessary PII |
| Privacy by Design (Article 25) | Encryption by default, consent before collection |
| Breach Notification (Articles 33-34) | Automated alerts trigger within 72 hours |

**5.6.2 PDPA Compliance** (Thailand privacy regulation)

Thailand-specific requirements:

```python
# PDPA Section 19: Explicit Consent Required
class ConsentRecord(Base):
    __tablename__ = "consent_records"
    
    user_id = Column(String)
    purpose = Column(String)  # "marketing", "analytics", "customer_support"
    status = Column(String)   # "granted" or "withdrawn"
    timestamp = Column(DateTime)
    ip_address = Column(String)
    method = Column(String)   # "web_form", "mobile_app", "phone_call"
    
    # Proof of consent for legal disputes

# PDPA Section 27: Cross-border transfer rules
async def transfer_data_to_cloud(data: UserData, destination: str):
    # Thailand: Only transfer if destination is PDPC-approved
    if destination not in APPROVED_JURISDICTIONS:
        raise CrossBorderTransferDenied(
            f"Cannot transfer to {destination}. "
            "Must use Standard Contractual Clauses or PDPC approval."
        )
    
    # Log the transfer
    audit_log(
        "data_transfer",
        user_id=data.user_id,
        purpose="cloud_storage",
        destination=destination,
    )

# PDPA Section 5(3): Thai National ID (13-digit) is highly restricted
def validate_thai_id_handling(file_data: bytes):
    pattern = r"\d{13}"  # Thai ID format
    
    if re.search(pattern, file_data):
        raise RestrictedDataDetected(
            "Thai National IDs cannot be processed without explicit consent."
        )
```

### 5.7 Audit Logging

**Goal**: Every action is logged immutably for:
- **Legal liability** (proof of who accessed what, when)
- **Forensic analysis** (what went wrong and when)
- **Compliance demonstration** (show regulators you're compliant)

**Immutable Log Design**:
```python
# Use write-once storage (S3 Object Lock)
class ImmutableAuditLog:
    def __init__(self, bucket: str):
        self.s3 = boto3.client("s3")
        self.bucket = bucket
    
    async def append_entry(self, event: dict):
        # Add timestamp and signature
        entry = {
            **event,
            "timestamp": datetime.utcnow().isoformat(),
            "sequence_number": await get_next_sequence(),
        }
        
        # Sign with organization's certificate
        entry["signature"] = sign_with_key(
            json.dumps(entry),
            get_organization_private_key()
        )
        
        # Write to S3 with immutability enabled
        # Once written, cannot be modified or deleted
        key = f"audit-logs/{entry['sequence_number']}.json"
        self.s3.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=json.dumps(entry),
            ObjectLockMode="GOVERNANCE",  # Immutable for 7 years
            ObjectLockRetainUntilDate=datetime.now() + timedelta(days=365*7),
        )
```

**What Gets Logged**:
```python
async def handle_sensitive_operation(user_id: str, operation: str, data: dict):
    # Log BEFORE operation (proof of intent)
    await audit_log(
        event="operation_started",
        user_id=user_id,
        operation=operation,
        ip_address=request.client.host,
        user_agent=request.headers["user-agent"],
        timestamp=datetime.utcnow(),
    )
    
    try:
        result = await perform_operation(operation, data)
        
        # Log AFTER operation (proof of outcome)
        await audit_log(
            event="operation_completed",
            user_id=user_id,
            operation=operation,
            result_status="success",
            timestamp=datetime.utcnow(),
        )
        return result
    except Exception as e:
        # Log ANY failures (critical for debugging)
        await audit_log(
            event="operation_failed",
            user_id=user_id,
            operation=operation,
            error=str(e),
            error_type=type(e).__name__,
            timestamp=datetime.utcnow(),
        )
        raise
```

### 5.8 Secrets Management

**Problem**: Applications need database passwords, API keys, encryption keys

**Naive Approach** (❌ DANGEROUS):
```python
# ❌ WRONG - Never do this!
DATABASE_URL = "postgresql://user:password123@db.example.com/mydb"
API_KEY = "sk_live_1234567890abcdef"

# If code is leaked, attacker has everything
```

**Right Approach**: Use secrets manager (Vault, AWS Secrets Manager)

```python
import hvac  # HashiCorp Vault client

def get_database_password():
    client = hvac.Client(url="https://vault.example.com", token=get_vault_token())
    
    secret = client.secrets.kv.v2.read_secret_version(path="database/prod/password")
    return secret["data"]["data"]["password"]

# Vault handles:
# - Encryption at rest
# - Audit logging of secret access
# - Automatic rotation of secrets
# - Fine-grained access control (only this app can read database password)
```

**Kubernetes Secrets with External Secrets Operator**:
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
  target:
    name: app-secrets
    creationPolicy: Owner
  data:
  - secretKey: database-url
    remoteRef:
      key: secret/database
      property: connection-string
  - secretKey: jwt-secret
    remoteRef:
      key: secret/jwt
      property: signing-key
```

### 5.9 Service Mesh (Istio)

**Problem**: Service-to-service communication in microservices is unencrypted by default

**Solution**: Inject sidecar proxies that enforce mTLS (mutual TLS)

```yaml
# Enable automatic mTLS between all services
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
spec:
  mtls:
    mode: STRICT  # Require mTLS for all communications

# Upload Service can only talk to Storage Service if both present valid certificates
```

**Benefits**:
- Every service-to-service communication is encrypted
- Certificate rotation is automatic
- Service identity is cryptographically proven
- Man-in-the-middle attacks prevented

### 5.10 Testing Security

```python
def test_unauthorized_access_denied():
    """Verify that users can't access others' files"""
    # User A's token
    token_a = create_jwt_token(user_id="user_a")
    
    # User B's file ID
    file_b = create_file(owner_id="user_b")
    
    # User A tries to access User B's file
    response = client.get(
        f"/files/{file_b.id}",
        headers={"Authorization": f"Bearer {token_a}"}
    )
    
    assert response.status_code == 403  # Forbidden

def test_admin_access_is_logged():
    """Verify that admin access to user data is logged"""
    token = create_jwt_token(user_id="admin", role="admin")
    
    response = client.get(
        f"/users/user_123/sensitive_data",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Should succeed
    assert response.status_code == 200
    
    # Should be logged
    audit_entries = query_audit_log(
        user_id="admin",
        action="read_sensitive_data"
    )
    assert len(audit_entries) > 0

def test_encryption_key_rotation():
    """Verify encrypted data remains accessible after key rotation"""
    # Store encrypted data with key v1
    user_data = User(email="john@example.com")
    db.add(user_data)
    db.commit()
    
    # Rotate to key v2
    rotate_encryption_keys()
    
    # Encrypted data should still be accessible with new key
    retrieved = db.query(User).first()
    assert retrieved.email == "john@example.com"

def test_gdpr_right_to_erasure():
    """Verify 'right to be forgotten' works completely"""
    user_id = "user_123"
    
    # Create extensive user data
    create_user_profile(user_id)
    upload_files(user_id, count=10)
    create_audit_logs(user_id)
    
    # Request deletion
    response = client.post(
        "/users/{user_id}/delete",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    
    # Verify complete erasure
    assert not user_exists(user_id)
    assert not files_exist_for_user(user_id)
    assert not logs_reference_user(user_id)  # Except hash of ID for compliance
```

### 5.11 Deployment Security

**Container Scanning**:
```bash
# Scan image for vulnerabilities before deployment
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
    aquasec/trivy image myregistry.azurecr.io/upload-service:v1.0.0
```

**Network Policies**:
```yaml
# Kubernetes NetworkPolicy: metadata service can ONLY communicate with database
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: metadata-service-network-policy
spec:
  podSelector:
    matchLabels:
      app: metadata-service
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: api-gateway
    ports:
    - protocol: TCP
      port: 8000
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - namespaceSelector: {}
      podSelector:
        matchLabels:
          app: kube-dns
    ports:
    - protocol: UDP
      port: 53
```

### 5.12 Deliverables

- ✅ Identity provider (Keycloak) configured with OAuth 2.1, MFA
- ✅ Open Policy Agent policies for all authorization rules
- ✅ Data encryption (at-rest, in-transit, in-use)
- ✅ PII detection and redaction pipeline
- ✅ Immutable audit logging with cryptographic signatures
- ✅ GDPR compliance demonstrators (consent management, right to erasure, data portability)
- ✅ PDPA/Thailand-specific compliance (Thai ID detection, cross-border transfer controls)
- ✅ Secrets management (Vault integration)
- ✅ Service mesh (Istio) with mTLS
- ✅ Security testing suite (authorization, encryption, compliance)
- ✅ Comprehensive security documentation and runbooks

---

## V. Weeks 05-10: Architecture, AI Governance, and Integration

The course continues with five weeks focused on architectural thinking, AI integration, and professional systems design. Rather than introducing new protocols, these weeks deepen understanding of how systems should be designed at scale.

### Week 05: Edge Bus & Back-End Bus Architecture

**Core Concept**: Systems need two distinct communication planes—one for security enforcement, one for performance.

**Key Learning**:
- Edge Bus (public-facing): Enforces authentication, authorization, audit logging, rate limiting
- Back-End Bus (private): High-performance gRPC with automatic multiplexing
- Why separation prevents security perimeter from extending to every service
- Protocol translation at boundaries

**Student Outcomes**:
- Understand why monolithic services fail at scale
- Design boundaries that hide internal topology
- Implement gRPC streaming for efficient data transfer
- Create protocol contracts with protobuf

**Capstone Element**: Students incorporate Edge/Back-End Bus into their final system design.

### Week 06: Architecture Reasoning & Evolution

**Core Concept**: Senior engineers don't just build—they justify *why* systems are built certain ways.

**Key Learning**:
- How to write Architecture Decision Records (ADRs)
- Trade-off matrices: latency vs. consistency, cost vs. reliability, security vs. usability
- Strangler Fig pattern for safe migrations
- Feature flags and shadow traffic for reversible deployments
- How systems evolve without becoming unmaintainable

**Student Outcomes**:
- Think like an architect, not just a coder
- Justify decisions explicitly
- Plan safe evolution of systems
- Recognize when rewriting is necessary vs. avoiding it

**Capstone Element**: Students must justify every major decision with an ADR.

### Week 07: AI-Native Architecture & Governance

**Core Concept**: When systems include AI, decisions shift from deterministic to probabilistic, requiring new governance models.

**Key Learning**:
- Autonomy levels: when AI decides alone, when humans approve, when both
- Anchors: hard constraints AI can never violate (encoded in types)
- Budgets: exploration limits for AI
- Anticipative systems: detecting problems before they impact users
- Human-in-the-loop design: when and how humans re-enter

**Student Outcomes**:
- Design AI systems that are safe AND adaptive
- Encode governance into system structure
- Balance automation with human oversight
- Prevent emergent failure modes

**Capstone Element**: If capstone includes AI, students specify autonomy levels for each decision type.

### Week 08: Multi-Agent Collective AI Systems

**Core Concept**: Multiple AIs with different goals must coordinate without central control, yet remain governable.

**Key Learning**:
- Agent roles and visibility boundaries
- Coordination patterns: sequential, parallel (voting), centralized
- Emergent failures: feedback loops, collusion, mode collapse
- Collective anchors: system-level invariants vs. agent-level rules
- Humans as meta-agents: resolving agent disagreements

**Student Outcomes**:
- Design systems where multiple AIs work together safely
- Detect emergent failures before they affect users
- Enforce system-level constraints across distributed agents
- Keep humans in control even with many AI actors

**Capstone Element**: Multi-agent capability is advanced; optional for most capstones.

### Week 09: AI Audits, Accountability & Regulation

**Core Concept**: Systems that cannot be audited cannot be trusted, regardless of performance.

**Key Learning**:
- Auditability as an architectural property (not added later)
- Accountability chains: who did what, when, under which policy
- Evidence pipelines: immutable logs, structural metadata, forensic readiness
- Incident replay: reconstructing decisions for post-incident analysis
- Regulatory translation: laws → system constraints

**Student Outcomes**:
- Design systems that produce forensic evidence
- Explain decisions to auditors and regulators
- Investigate failures safely and responsibly
- Build trust through transparency

**Capstone Element**: All capstones must show audit architecture and accountability model.

### Week 10: Capstone Integration & Architecture Defense

**Core Concept**: Professional systems architects design, justify, and defend their decisions.

**What Students Do**:
1. Choose a real problem domain (cloud optimization, regulated decisions, content moderation, etc.)
2. Design a complete system incorporating weeks 01-09 concepts
3. Write ADRs justifying every major decision
4. Document scenarios showing the system in action (normal, failure, regulatory inquiry, learning)
5. Present in a professional architecture review (20 minutes + Q&A)

**Evaluation Criteria**:
- Clarity of architectural thinking
- Justification of decisions
- Integration of AI governance where appropriate
- Audit/accountability design
- Professional presentation

**Career Impact**:
- Portfolio piece for job interviews
- Proof of readiness for senior/staff engineer roles
- Demonstration of architectural thinking

---

## VII. Integrated Learning Outcomes

### 7.1 Technical Competencies (All 10 Weeks)

By completion, students will master:

1. **Protocol Design** (Week 01)
   - TCP reliability patterns
   - Binary message framing
   - JSON header conventions
   - Protocol versioning

2. **State Management** (Week 02)
   - Stateless architecture patterns (scalability)
   - Stateful architecture patterns (expressiveness)
   - Session lifecycle management
   - Distributed state with Redis

3. **Distributed Systems** (Week 03)
   - Microservice decomposition
   - REST, async messaging, gRPC communication
   - Docker containerization
   - Kubernetes orchestration
   - Event-driven architecture
   - Resilience patterns (retries, circuit breakers, timeouts)

4. **Security & Governance** (Week 04)
   - Zero-trust architecture
   - Identity and access management
   - Encryption (symmetric, asymmetric, hashing)
   - Privacy-by-design implementation
   - Regulatory compliance (GDPR, PDPA)
   - Audit logging for legal/forensic use

5. **Boundary Architecture** (Week 05)
   - Edge Bus design for security enforcement
   - Back-End Bus design for performance
   - gRPC streaming and protocol buffers
   - API gateway patterns
   - Protocol translation

6. **Architectural Reasoning** (Week 06)
   - Architecture Decision Records (ADRs)
   - Trade-off analysis and documentation
   - Safe evolution patterns (strangler fig, feature flags, shadow traffic)
   - Systems thinking at scale

7. **AI-Native Systems** (Week 07)
   - Autonomy level design
   - Anchors and budgets for AI
   - Anticipative pattern detection
   - Human-in-the-loop integration
   - Failure prevention

8. **Multi-Agent Coordination** (Week 08)
   - Agent role definition and boundaries
   - Coordination patterns
   - Emergent failure detection
   - Collective constraint enforcement

9. **Audit & Accountability** (Week 09)
   - Evidence pipeline architecture
   - Immutable logging design
   - Incident replay capabilities
   - Regulatory compliance mapping
   - Forensic readiness

10. **Professional Architecture** (Week 10)
    - System design at production scale
    - Boundary placement decisions
    - Trade-off justification
    - Cross-functional communication
    - Defense of architectural choices

### 7.2 Soft Skills (All 10 Weeks)

1. **Systems Thinking**
   - Understanding tradeoffs across multiple dimensions
   - Holistic problem solving
   - Long-term thinking about evolution

2. **Communication**
   - Writing clear Architecture Decision Records
   - Explaining technical choices to non-technical stakeholders
   - Presenting system designs professionally
   - Defending decisions under scrutiny

3. **Judgment**
   - Knowing what you know
   - Admitting unknowns
   - Recognizing when perfection isn't required
   - Balancing innovation with stability

4. **Research & Learning**
   - Investigating unfamiliar technologies
   - Reading specifications and frameworks
   - Learning from production incidents
   - Staying current with architectural patterns

### 7.3 Career Preparation

Upon completion, students are prepared for roles:
- **Senior Software Engineer**: Designing scalable, secure systems
- **Staff Engineer**: Thinking about systems company-wide
- **AI Systems Architect**: Integrating AI safely into production
- **Platform Engineer**: Designing infrastructure others build on
- **Technical Lead**: Guiding teams through architectural decisions
- **Principal Engineer**: Industry-level systems thinking

---

## VIII. Key Insights & Philosophy

### 8.1 Core Teaching Insights

1. **TCP is not enough**: Raw TCP provides only delivery reliability, not application semantics
2. **State is complexity**: Stateful systems are more expressive but harder to scale and debug
3. **Distribution is hard**: Distributed systems require new thinking about consensus, consistency, failure
4. **Security is foundational**: Security cannot be added later; it must be architected from the start
5. **Privacy is legal**: Privacy is not just technical; it's a regulatory requirement
6. **AI requires governance**: Intelligence without oversight creates new risks at scale
7. **Auditability matters**: Systems that can't be inspected can't be trusted
8. **Architecture is discipline**: Senior engineers justify decisions, not just make them

### 8.2 Pedagogical Philosophy

- **Learn by doing**: Abstract concepts are taught through building working systems
- **Progressive complexity**: Each week builds incrementally on previous weeks
- **Real-world constraints**: Course addresses actual deployment, security, compliance challenges
- **Tradeoff awareness**: Students understand why different systems make different choices
- **Problem-first**: Start with real problems, then show architectural solutions
- **Sustainable pace**: Realistic timeline that maintains quality and prevents burnout
- **Scaffolded difficulty**: Increasing sophistication with appropriate support

### 8.3 The Big Picture: Learning Spiral

```
Week 01: Protocol Design
         ↓ "How do systems talk reliably?"
         
Week 02: State Management
         ↓ "Where does memory belong?"
         
Week 03: Service Decomposition
         ↓ "How do independent services work together?"
         
Week 04: Security Architecture
         ↓ "How do we stay safe at scale?"
         
Week 05: Boundary Design
         ↓ "Where are the trust boundaries?"
         
Week 06: Architectural Thinking
         ↓ "Why should this system be built this way?"
         
Week 07: AI Integration
         ↓ "How do we let AI decide safely?"
         
Week 08: Multi-Agent Coordination
         ↓ "How do many AIs work together?"
         
Week 09: Auditability & Trust
         ↓ "How do we prove this is trustworthy?"
         
Week 10: Professional Defense
         ↓ INTEGRATION: "I understand systems."
```

Students progress from:
- **Implementers** (weeks 01-04): "How do I build it?"
- **Architects** (weeks 05-06): "Why is it built this way?"
- **Governors** (weeks 07-09): "How do we keep it safe as it adapts?"
- **Leaders** (week 10): "Why should anyone trust this system?"

### 8.4 Core Values

The course embodies these values:

1. **Clarity over cleverness**: A straightforward solution beats brilliant complexity
2. **Justification over assumption**: Explain why, don't assume people will understand
3. **Learning over perfection**: Admitting unknowns beats pretending to know
4. **Safety over speed**: A slow, auditable system beats a fast system nobody trusts
5. **Humility over confidence**: Great architects know what can go wrong
6. **Mission alignment**: Systems serve human purposes, not the reverse
- **Cloud Engineers** (Week 03): How do systems cooperate at scale?
- **Security Engineers** (Week 04): How do systems protect what matters?
- **Architects** (Weeks 05-06): How should systems be designed?
- **AI Systems Engineers** (Weeks 07-08): How do we govern intelligence?
- **Compliance Engineers** (Week 09): How do we prove systems are trustworthy?
- **Technical Leaders** (Week 10): How do we defend these choices professionally?

The progression is not accidental—each week's skills are foundational for the next level of complexity.

---

## IX. Conclusion: From Protocols to Professional Architecture

This **10-week course** provides a comprehensive journey from basic socket programming through enterprise-scale, secure, AI-integrated systems. Rather than treating these topics in isolation, the course demonstrates their deep interconnection.

### The Learning Arc

**Foundation Phase (Weeks 01-04)**: Students learn how working systems are built
- Week 01: Understand reliable communication
- Week 02: Understand state and session management
- Week 03: Understand distribution and scaling
- Week 04: Understand security and compliance

**Architecture Phase (Weeks 05-06)**: Students think like architects
- Week 05: Understand boundary design at scale
- Week 06: Justify design decisions and evolve safely

**Governance Phase (Weeks 07-09)**: Students govern intelligent systems
- Week 07: Integrate AI responsibly
- Week 08: Coordinate multiple AI agents
- Week 09: Audit and prove trustworthiness

**Integration Phase (Week 10)**: Students design professionally
- Week 10: Defend complete system architectures

### What Students Understand

By course completion, students understand:

1. **Technical reality**: How modern distributed systems actually work in production
2. **Design discipline**: Why certain architecture patterns exist and when to apply them
3. **Risk management**: How to build safe systems even when they include AI
4. **Regulatory thinking**: How technical systems satisfy legal requirements
5. **Career progression**: The path from implementing to leading to governing systems
6. **Systems thinking**: How to reason about tradeoffs across multiple dimensions

### Career Impact

Students completing this course are prepared for:
- **Senior Software Engineer**: Designing and building systems others will rely on
- **Staff Engineer**: Influencing architecture decisions across teams or organizations
- **AI Systems Architect**: Integrating machine learning into production safely
- **Platform Engineer**: Building infrastructure that others build on
- **Technical Lead**: Guiding teams through complex architectural decisions
- **Principal/Distinguished Engineer**: Company-wide or industry-level systems thinking

### Why This Course Matters

The course is demanding because real-world systems are demanding. Students do not just learn concepts—they build working implementations, understand failure modes, and justify decisions.

The journey is structured so that students at any starting level (junior engineers, career-changers, domain experts new to systems) can progress from understanding basic TCP mechanics to architecting secure, scalable, governance-aware microservices with integrated AI.

Most importantly: students understand not just *how* systems work, but *why* they work that way—and why those reasons matter for building systems people can trust.
