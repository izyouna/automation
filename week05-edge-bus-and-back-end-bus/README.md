# Week 05: Edge Bus & Back-End Bus Architecture

> **Key Concept**: Real systems have two faces: a *safe public face* (Edge Bus) and a *fast private fabric* (Back-End Bus).
> Week 05 teaches you how to design this boundary so clients can safely push data into complex internal systems.

## Learning Objectives

By the end of this week, you will understand:

1. **The Two-Bus Architecture** — Why separating public ingress from private services is essential for security and scalability
2. **Protocol Adaptation** — How to translate client-friendly protocols (HTTP, JSI) into efficient internal protocols (gRPC)
3. **Binary Streaming** — How to efficiently transfer large files using gRPC streaming (upgrading Week 01's chunking)
4. **Service Mesh at the Boundary** — How the Edge Bus enforces governance, authorization, and audit (continuing Week 04's security)
5. **Event-Driven Pipelines** — How the Back-End Bus uses async events to coordinate work (extending Week 03's patterns)
6. **Observability Across Buses** — How trace IDs and structured logging flow from client → edge → backend

## The Problem We're Solving

**Week 04 Reality**: Your system is secure, but architecture is exposed.

```
Client (public internet)
  ↓ HTTPS
[API Gateway]
  ↓ mTLS gRPC
[Metadata Service] [Upload Service] [Processing Service] [AI Service]
  ↓ (network visible)
[Internal message bus]
```

**Problems**:
- Every internal service is directly accessible
- Security perimeter extends to every service
- Hard to change internal architecture without breaking clients
- gRPC requires custom configuration for firewalls/load balancers
- Synchronous calls create bottlenecks

**Week 05 Solution**: Hide internal topology behind a single gateway.

```
Client (public internet)
  ↓ HTTPS (any protocol)
┌─────────────────────────────┐
│      EDGE BUS               │
│ • Single entry point        │
│ • Protocol translation      │
│ • Auth/authz enforcement    │
│ • Routing to backends       │
│ • Audit logging             │
└──────────────┬──────────────┘
         ↓ mTLS gRPC (internal only)
┌─────────────────────────────┐
│      BACK-END BUS           │
│ • Fast gRPC services        │
│ • Async event pipelines     │
│ • Internal topology hidden  │
│ • Can scale/change freely   │
└─────────────────────────────┘
```

**Benefits**:
- Clients see *one service*, internals are hidden
- Change internal architecture without client impact
- Security enforcement centralized at boundary
- High-performance internal fabric
- Easy to scale individual services
- Resilient to internal failures

This is how major companies (Google, Netflix, Uber) operate their systems. Week 05 teaches you why and how.

---

## How Week 05 Builds on Previous Weeks

```
Week 01: Binary framing & message boundaries
   ↓ "TCP is just bytes, you must define where messages end"
   
Week 02: Stateless vs stateful, session management
   ↓ "Some systems need memory across requests"
   
Week 03: Microservices & distributed systems
   ↓ "Decompose into independent services, coordinate with events"
   
Week 04: Zero-trust security & governance
   ↓ "Every request must be verified, every action logged"
   
Week 05: Edge Bus ↔ Back-End Bus
   ↓ "Hide complexity behind a single, secure gateway"
   = Combines ALL previous weeks into a complete real-world architecture
```

---

## Project Structure

```
week05-edge-bus-and-back-end-bus/
├── edge-bus/                        # Public-facing gateway
│   ├── gateway/
│   │   ├── main.py                 # FastAPI gateway
│   │   ├── middleware/             # Auth, audit, rate limiting
│   │   └── translators/            # Protocol adapters
│   ├── tests/
│   ├── Dockerfile
│   └── README.md
│
├── back-end-bus/                    # Private service fabric
│   ├── services/
│   │   ├── upload_service/         # gRPC upload handler
│   │   ├── metadata_service/       # Continues from Week 03
│   │   └── processing_service/     # Event-driven processing
│   ├── protobuf/                   # Protocol definitions
│   │   ├── upload.proto
│   │   ├── events.proto
│   │   └── generated/
│   ├── event_bus/                  # Async coordination
│   │   ├── event_publisher.py
│   │   └── event_handlers.py
│   ├── tests/
│   ├── docker-compose.yml
│   └── README.md
│
├── jsi-client/                      # Optional: JSI bridge example
│   ├── native/                      # Native module (Rust/C++)
│   ├── js/                          # JavaScript wrapper
│   └── example.js
│
├── docs/
│   ├── architecture.md             # Detailed architecture
│   ├── protocol.md                 # Protobuf & gRPC design
│   └── deployment.md               # How to run
│
└── README.md                        # This file
```

---

## Quick Start: Running Both Buses

### Prerequisites
- Python 3.11+
- Docker and Docker Compose
- protobuf compiler (`protoc`)

### 1. Start Everything

```bash
cd week05-edge-bus-and-back-end-bus

# Start all services
docker-compose up --build

# Services:
# - Edge Bus:           http://localhost:8000
# - Back-End Services:  (internal, gRPC only)
# - AsyncIO Event Bus:  (internal)
```

### 2. Test the Edge Bus

```bash
# Upload a file through the Edge Bus
curl -X POST http://localhost:8000/files \
  -H "Authorization: Bearer $(get_token)" \
  -F "file=@document.pdf"

# Response:
# {
#   "file_id": "550e8400-e29b-41d4-a716-446655440000",
#   "status": "uploaded",
#   "message": "File queued for processing"
# }
```

### 3. Check What's Inside

```bash
# Edge Bus only knows what to forward to
curl http://localhost:8000/health
# {"status": "ok", "backend": "connected"}

# Back-end services are NOT directly accessible
curl http://localhost:9000/files
# Connection refused (good!)
```

### 4. Watch Events Flow

```bash
# View event stream (see file moving through pipeline)
docker-compose logs -f event-bus | grep "file.uploaded"
```

### 5. Run Tests

```bash
pytest tests/ -v
docker-compose run tests pytest
```

---

## Architecture 1: The Edge Bus

### What Is It?

The Edge Bus is a **single, public endpoint** that:
1. Accepts client requests (HTTP, gRPC, WebSocket)
2. Enforces security (authentication, authorization, audit)
3. Translates to internal protocols (gRPC)
4. Routes to appropriate back-end services

### Why Not Just API Gateway?

An API Gateway forwards requests. An Edge Bus *translates and governs*.

**API Gateway**:
```
GET /metadata/users
  → directly calls Metadata Service (exposes topology)
```

**Edge Bus**:
```
GET /users
  → Edge Bus consults policy: "Is user authorized?"
  → Edge Bus: "Call MetadataService internally, but don't expose that name"
  → Edge Bus: "Log this access"
  → Client sees a single service; never knows about MetadataService
```

### Critical Responsibilities

#### 1. **Protocol Translation**

```python
# Client sends JSON over HTTPS
POST /files HTTP/1.1
Content-Type: application/json

{
  "filename": "document.pdf",
  "bytes": "<base64>"
}

# Edge Bus translates to efficient gRPC internally
UploadStream(
  UploadChunk {
    filename: "document.pdf",
    data: <raw bytes>,  # More efficient than base64
  }
)
```

#### 2. **Centralized Security** (Week 04 continuation)

```python
@app.post("/files")
async def upload_file(
    file: UploadFile,
    token: str = Header(...)
):
    # 1. Authenticate
    user = verify_token(token)  # OAuth 2.1
    
    # 2. Authorize
    can_upload = check_policy(
        user=user,
        action="file.upload",
        resource=file.filename
    )  # OPA
    
    if not can_upload:
        # Pre-log denial
        await audit_log("upload_denied", {
            "user": user,
            "file": file.filename,
            "reason": "insufficient_permissions"
        })
        raise HTTPException(403, "Forbidden")
    
    # 3. Forward to back-end
    file_id = await backend_upload.stream(file)
    
    # 4. Audit success
    await audit_log("upload_accepted", {
        "user": user,
        "file": file.filename,
        "file_id": file_id
    })
    
    return {"file_id": file_id}
```

#### 3. **Audit Logging**

Every request is logged at the boundary:
- What was requested
- Who requested it
- Was it allowed?
- What was returned?

This creates a forensic trail at the trust boundary.

### Implementation Pattern

```python
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer
import grpc

app = FastAPI()
security = HTTPBearer()

# gRPC channel to back-end (internal only)
backend_channel = grpc.aio.insecure_channel("backend-service:50051")
upload_stub = UploadServiceStub(backend_channel)

@app.post("/files")
async def upload_file(
    file: UploadFile,
    token: HTTPAuthCredentials = Depends(security)
):
    # 1. Verify auth
    user = await verify_token(token.credentials)
    
    # 2. Check policy
    allowed = await opa_policy(
        user_id=user.id,
        action="file:upload",
        resource=file.filename
    )
    
    if not allowed:
        await audit_log("denied", ...)
        raise HTTPException(403, "Forbidden")
    
    # 3. Forward to back-end via gRPC streaming
    request_id = uuid4()
    chunks = chunk_file(file)
    
    async def stream_gen():
        for chunk in chunks:
            yield UploadChunk(
                request_id=request_id,
                data=chunk,
            )
    
    response = await upload_stub.UploadStream(stream_gen())
    
    # 4. Audit success
    await audit_log("accepted", {
        "request_id": request_id,
        "file_id": response.file_id,
        "size": file.size
    })
    
    return {"file_id": response.file_id}
```

---

## Architecture 2: The Back-End Bus

### What Is It?

The Back-End Bus is the *private service fabric* where:
1. Services communicate efficiently via gRPC
2. Async work is coordinated via event bus
3. Internal topology is hidden from clients
4. Performance and reliability are optimized

### Two Parallel Planes

**gRPC Plane** (Synchronous):
```
UploadService
  ↓ (calls synchronously)
StorageService.Store()
  ↓ (stores file)
MetadataService.Create()
  ↓ (creates metadata)
"Upload complete"
```

**Event Plane** (Asynchronous):
```
UploadService publishes "file.uploaded" event
  ↓ (published to message bus)
ProcessingService consumes → starts processing
AIService consumes → starts analysis
NotificationService consumes → sends notification
(All happen asynchronously, independently)
```

### Why Both?

| Plane | Use Case | Benefit |
|-------|----------|---------|
| **gRPC** | "I need this response now" | Fast, low latency, request-reply |
| **Events** | "Please do this, but don't care when" | Decoupled, parallel, resilient |

Example:
```python
# Upload flow
async def upload_file(file_data):
    # Synchronous: store file immediately
    file_id = await storage.put(file_id, file_data)
    
    # Asynchronous: trigger processing pipeline
    await event_bus.publish("file.uploaded", {
        "file_id": file_id,
        "size": len(file_data),
    })
    
    # Return immediately (don't wait for processing)
    return {"file_id": file_id, "status": "queued"}

# Processing happens later, without blocking upload
@event_bus.on("file.uploaded")
async def on_file_uploaded(event):
    file_id = event["file_id"]
    
    # Time-consuming work
    await processing.scan_for_malware(file_id)
    await ai_service.analyze(file_id)
    await metadata_service.update_status(file_id, "processed")
    
    # Publish next event
    await event_bus.publish("file.processed", {"file_id": file_id})
```

### gRPC Streaming (Week 01 Elevated)

**Week 01**: Manual chunking over TCP
```
Chunk 1: [size=1024][data...]
Chunk 2: [size=1024][data...]
Chunk 3: [size=512][data...]
```

**Week 05**: Streaming with automatic framing
```protobuf
service UploadService {
  rpc UploadStream(stream UploadChunk) returns (UploadAck);
}

message UploadChunk {
  bytes data = 1;
  uint32 sequence = 2;
  bytes checksum = 3;
}

message UploadAck {
  string file_id = 1;
  uint64 bytes_received = 2;
}
```

**Why gRPC Streaming?**
- HTTP/2 multiplexing (multiple uploads simultaneously)
- Automatic flow control (backpressure)
- Efficient binary encoding (protobuf)
- Built-in compression
- Type-safe contracts

**Implementation**:
```python
async def upload_stream(
    request_iterator: AsyncIterator[UploadChunk],
    context: grpc.aio.ServicerContext
) -> UploadAck:
    file_id = str(uuid4())
    bytes_received = 0
    
    # Process chunks as they arrive
    async for chunk in request_iterator:
        # Verify sequence and checksum
        if chunk.sequence != expected_seq:
            raise RpcError("Out of sequence")
        
        # Store chunk
        await storage.append_chunk(file_id, chunk.data)
        bytes_received += len(chunk.data)
        
        # Report progress
        context.set_trailing_metadata([
            ("bytes_received", str(bytes_received))
        ])
    
    # All chunks received; finalize
    await metadata_service.create(file_id, {"size": bytes_received})
    await event_bus.publish("file.uploaded", {"file_id": file_id})
    
    return UploadAck(
        file_id=file_id,
        bytes_received=bytes_received,
        status="stored"
    )
```

---

## Key Concepts

### 1. Protocol Contracts (Protobuf)

**Week 01**: JSON header + binary payload (manual framing)
```json
{"mime_type": "application/pdf", "size": 1024}
[newline]
[1024 bytes of binary data]
```

**Week 05**: Protobuf (automatic, typed, efficient)
```protobuf
message UploadChunk {
  bytes data = 1;
  uint32 sequence = 2;
  bytes checksum = 3;
  map<string,string> metadata = 4;
}
```

**Why This Matters**:
- **Explicit**: Types and sizes are baked in
- **Efficient**: Binary encoding, no string escaping
- **Evolvable**: Can add fields without breaking clients
- **Validated**: Any message that doesn't match schema is rejected

### 2. Boundary Enforcement

The Edge Bus is where the security perimeter lives.

```
Outside the perimeter:    [Client] (don't trust)
                            ↓
Perimeter:                [Edge Bus] (verify everything)
                            ↓
Inside the perimeter:     [Back-End Services] (trust)
```

**Critical**: Inside services don't re-verify (already done at Edge Bus). This prevents cascade of security checks and improves performance.

### 3. Trace IDs Across Boundaries

Request enters Edge Bus → assigned a unique trace ID → passed to Back-End Services → logged everywhere.

This allows debugging end-to-end:
```
Client request
  → Edge Bus receives: trace_id=abc123
  → Edge Bus calls Upload Service: trace_id=abc123
  → Upload Service calls Storage: trace_id=abc123
  → Storage calls Metadata: trace_id=abc123

Later: "What happened to request X?"
  → Search logs for trace_id=abc123
  → See entire request flow across all services
```

### 4. Failure Isolation

If a Back-End Service crashes:

**Without Back-End Bus**:
```
Client → API Gateway → Down Service
Result: Client gets 503, upload fails completely
```

**With Back-End Bus + Events**:
```
Client → Edge Bus → Accepts & queues
  → Returns immediately: "File queued for processing"
  → ProcessingService is down, but: event is stored
  → ProcessingService comes back online
  → Event is retried and processed
Result: Client gets success; processing happens later
```

---

## Testing Strategy

### Unit Tests (Single Component)

```python
def test_upload_stream_chunks_in_order():
    """gRPC UploadStream enforces sequence"""
    chunks = [
        UploadChunk(data=b"chunk1", sequence=1),
        UploadChunk(data=b"chunk2", sequence=3),  # Out of order!
        UploadChunk(data=b"chunk3", sequence=2),
    ]
    
    with pytest.raises(RpcError):
        list(upload_stream(chunks))
```

### Integration Tests (Edge ↔ Back-End)

```python
@pytest.mark.asyncio
async def test_file_upload_edge_to_backend():
    """File flows from Edge Bus through Back-End"""
    # 1. Edge Bus receives
    response = await edge_bus.upload(
        file=b"test content",
        auth_token=valid_token
    )
    
    # 2. Back-End processes
    assert response.file_id is not None
    
    # 3. Metadata service received it
    metadata = await metadata_service.get(response.file_id)
    assert metadata.size == len(b"test content")
    
    # 4. Event was published
    assert event_bus.contains("file.uploaded", response.file_id)
```

### End-to-End Tests (Client → Edge → Back-End → DB)

```python
@pytest.mark.asyncio
async def test_complete_upload_workflow():
    """Complete workflow: upload → process → complete"""
    
    # Client uploads
    file_id = await upload_file(b"document.pdf")
    
    # Event bus processes
    await event_bus.wait_for("file.processed", timeout=10)
    
    # Result is in storage and metadata
    stored_file = await storage.get(file_id)
    assert stored_file == b"document.pdf"
    
    metadata = await metadata_service.get(file_id)
    assert metadata.status == "processed"
```

---

## Common Questions

**Q: Isn't the Edge Bus a bottleneck?**  
A: It's designed to be fast. Edge Bus does minimal work (auth/translate/forward). Back-End does heavy lifting. Edge Bus scales horizontally; add more instances if needed.

**Q: Why gRPC and not REST between Edge and Back-End?**  
A: HTTP/2 + multiplexing + protobuf is much faster for internal use. REST is client-friendly but wasteful for service-to-service.

**Q: What if a Back-End Service is down?**  
A: Depends on operation:
- *Synchronous* (RPC): Edge Bus returns error (client retries)
- *Asynchronous* (event): Event is queued; service catches up when it comes online

**Q: How do I deploy this?**  
A: Edge Bus on public network, Back-End on private network. See deployment.md.

**Q: Can I use different protocols for different clients?**  
A: Yes! Edge Bus can accept HTTP, gRPC, GraphQL, etc. All translate to internal gRPC.

**Q: What about observability?**  
A: Trace IDs propagate across boundary. Logs are structured. Metrics track latency/errors at each layer.

---

## Next Steps

1. **Understand the problem** — Read the architecture.md
2. **Study the protocols** — Review protocol.md (protobuf definitions)
3. **Build the Edge Bus** — Implement authentication & authorization middleware
4. **Build the Back-End** — Implement gRPC streaming upload service
5. **Add the event bus** — Connect services with async coordination
6. **Test end-to-end** — Client → Edge → Back-End → Event Pipeline
7. **Deploy** — See deployment.md

## Building Intuition: The Restaurant Analogy

### Without Two-Bus Architecture
```
Customer arrives at restaurant
Customer talks directly to warehouse guy
Customer talks directly to kitchen staff
Customer talks directly to dishwashers
Everyone visible and confused
```

### With Two-Bus Architecture (Edge & Back-End)
```
Customer arrives
Customer talks to Receptionist ("I'd like to order pasta")
  → Receptionist is the EDGE BUS
  → Receptionist verifies they have a reservation (auth)
  → Receptionist is polite and consistent (governance)
  
Behind the scenes:
Receptionist sends to kitchen: "Cook pasta"
Kitchen tells prep: "Chop vegetables"
Prep tells dishwashers: "Get pans ready"
(All internal, customer never knows details)
  → Kitchen, prep, etc. are BACK-END BUS
  
Customer sees only Receptionist (one interface)
But complex work happens invisibly behind
```

---

## Additional Resources

- [Architecture Deep Dive](docs/architecture.md) — Detailed design
- [Protocol Specification](docs/protocol.md) — Protobuf & gRPC definition
- [Deployment Guide](docs/deployment.md) — How to run
- [Week 05 Summary](../DETAILED_COURSE_SUMMARY.md) — Course context

---

**Last Updated**: February 2026  
**For Questions**: See documentation or course materials

**Key Takeaway**: The Edge Bus is where **security, governance, and client-friendliness** live. The Back-End Bus is where **performance, scalability, and hidden complexity** live. Together, they let you build systems that are both safe and fast.

