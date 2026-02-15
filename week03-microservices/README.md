# Week 03: Cloud-Native Microservices Architecture

> **Key Concept**: Monoliths don't scale. Distributed systems do—but they require new thinking about protocols, resilience, state management, and observability.

## Learning Objectives

By the end of this week, you will understand:

1. **Microservice Decomposition** — Why and how to break monolithic applications into independent services
2. **Service Communication** — REST APIs, asynchronous messaging, gRPC, and when to use each
3. **Distributed State** — How to manage application state across multiple service instances
4. **Container Orchestration** — Docker Compose for local development, Kubernetes for production
5. **Resilience Patterns** — Retries, circuit breakers, timeouts, and graceful degradation
6. **Observability** — Structured logging, metrics, and distributed tracing in complex systems
7. **Event-Driven Architecture** — How services communicate through events rather than direct calls

## Project Structure

```
week03-microservices/
├── phase1/                            # Local mockup (Toy Model)
│   ├── services/                      # Microservice implementations
│   │   ├── upload/                    # File upload & metadata (SQLite)
│   │   ├── processing/                # Basic file processing (Mock)
│   │   ├── ai/                        # AI analysis (Mock)
│   │   └── gateway/                   # API gateway/orchestrator
│   ├── tests/                         # Integration tests
│   ├── mockup-infra-integration/      # [NEW] Configuration for mockup-infra
│   └── README.md
│
├── application_protocol_design.md     # Detailed protocol specification
├── Implementation_Guide.md            # Phase 2 Implementation (Postgres/Redis/RabbitMQ)
└── README.md                          # This file
```

## Quick Start: Phase 1 (Mockup Integration)

Phase 1 is now fully integrated into the **mockup-infra** environment. This allows you to test microservices with real network isolation and Nginx gateway routing.

### 1. Prerequisites
- Python 3.11+
- Podman and Podman Compose
- `mockup-infra` repository located at `../mockup-infra`

### 2. Start Services in mockup-infra
```powershell
cd ../mockup-infra
podman-compose --profile week03 up -d --build
```

### 3. Verify Integrated Services
Health checks are available through the Nginx gateway (Port 8080):
- **Upload Healthy?**: `curl http://localhost:8080/api/upload/health`
- **Processing Healthy?**: `curl http://localhost:8080/api/processing/health`
- **AI Healthy?**: `curl http://localhost:8080/api/ai/health`

### 4. Sample Integrated Workflow
```powershell
# Upload a file through the gateway
curl -X POST -F "file=@test_data/sample.jpg" http://localhost:8080/api/upload/upload
```

## Quick Start: Phase 2 (Production Architecture - Planned)

Phase 2 moves from the "Toy Model" to production-grade components. **Note: This requires full infrastructure setup described in the Implementation Guide.**

### 1. Start Full Infrastructure
```bash
docker-compose up --build
```
*Required services for Phase 2:*
- **PostgreSQL**: Metadata & Persistence
- **Redis**: Distributed Sessions
- **RabbitMQ**: Asynchronous Messaging
- **MinIO**: Persistent Object Storage


## Microservices Overview

### Core Services

#### 1. **Upload Service** (Port 8000)
Handles file reception and initial validation.

**Responsibilities**:
- Receive file uploads (HTTP multipart)
- Validate file size, type, content
- Call Storage Service to persist binary data
- Create metadata records
- Publish "file.uploaded" event
- Track upload statistics

**API Endpoints**:
```
POST   /files                 # Upload file
GET    /files/{file_id}       # Get file metadata
GET    /files/               # List user's files
DELETE /files/{file_id}       # Delete file
GET    /health               # Health check
```

**Dependencies**:
- PostgreSQL (metadata)
- Redis (cache, sessions)
- RabbitMQ (event queue)
- Storage Service (file persistence)

#### 2. **Storage Service** (MinIO)
Object storage for binary file content.

**Responsibilities**:
- Store binary file data
- Return signed URLs for secure retrieval
- Handle versioning and backups
- Compress/deduplicate files
- Support large file uploads (multipart)

**Not HTTP**: Accessed by other services via SDK, not direct HTTP.

**Considerations**:
- S3-compatible API
- Local deployment: MinIO
- Production: AWS S3, Azure Blob, GCS

#### 3. **Metadata Service** (Port 8001)
Tracks file properties and audit trail.

**Responsibilities**:
- Store file metadata (name, size, type, owner)
- Maintain audit trail of all access
- Index and search files
- Track processing status
- Provide analytics

**API Endpoints**:
```
GET    /files/{file_id}       # Get metadata
GET    /files                 # List files (with search)
PATCH  /files/{file_id}       # Update metadata
GET    /files/{file_id}/audit # Audit trail
GET    /health                # Health check
```

**Storage**:
- PostgreSQL (persistent)
- Redis (cache for hot metadata)

#### 4. **Processing Service** (Background Worker)
Transforms and analyzes file content.

**Responsibilities**:
- Consume "file.uploaded" events from queue
- Resize images, convert formats
- Extract text from documents
- Generate thumbnails
- Update metadata with results
- Publish "file.processed" events

**Not HTTP**: Consumes from RabbitMQ message queue.

**Technologies**:
- Celery (task queue)
- ffmpeg (video/audio)
- PIL (images)
- PyPDF2 (documents)

#### 5. **AI Service** (Port 8002)
Machine learning analysis and insights.

**Responsibilities**:
- Detect objects in images
- Classify documents
- Extract key information
- Identify sentiment
- Generate descriptions
- Cache models for performance

**API Endpoints**:
```
POST   /analyze/{file_id}     # Analyze file
GET    /jobs/{job_id}         # Check job status
GET    /models                # List available models
GET    /health                # Health check
```

**Technologies**:
- TensorFlow or PyTorch
- Pre-trained models (COCO, BERT, etc.)
- GPU acceleration (optional)

## Architecture Diagram

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│   API Gateway (NGINX)       │
│  • Rate limiting            │
│  • SSL termination          │
│  • Request routing          │
└──────────┬──────────────────┘
           │
    ┌──────┴──────────────┬──────────────┐
    │                     │              │
    ▼                     ▼              ▼
┌─────────────┐   ┌────────────┐   ┌──────────┐
│   Upload    │   │  Metadata  │   │    AI    │
│  Service    │   │  Service   │   │ Service  │
│  :8000      │   │  :8001     │   │  :8002   │
└──────┬──────┘   └──────┬─────┘   └──┬───────┘
       │                 │            │
       └─────────┬───────┴────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
    ┌────────┐      ┌──────────┐
    │Storage │      │PostgreSQL│
    │MinIO   │      │Metadata  │
    └────────┘      └──────────┘
        │
        ▼
    ┌──────────────┐
    │   RabbitMQ   │
    │ Event Queue  │
    └──────────────┘
        │
        ▼
    ┌─────────────┐
    │ Processing  │
    │  Service    │
    │(background) │
    └─────────────┘
```

## Communication Patterns

### Synchronous (REST) - For Immediate Response

```
Upload Service → [HTTP POST /store] → Storage Service
      ↓
   [signed_url, success]
      ↑
Storage Service
```

**When to use**:
- Need immediate response
- Operation is fast (<100ms)
- Can accept service downtime as failure

**Example**: Upload Service validates file, then stores immediately

### Asynchronous (Message Queue) - For Decoupling

```
Upload Service → [publish "file.uploaded"] → RabbitMQ
                                              ↓
         Processing Service ← [consume event]
         AI Service ← [consume event]
         Notification Service ← [consume event]
```

**When to use**:
- Long-running operations (>1 second)
- Can process later
- Want services to be independent
- Need to handle peaks gracefully

**Example**: 
```python
# Upload Service publishes event
rabbitmq.publish(
    exchange='files',
    routing_key='file.uploaded',
    body={
        'file_id': '550e8400-e29b-41d4-a716-446655440000',
        'filename': 'document.pdf',
        'owner_id': 'user123',
    }
)

# Processing Service subscribes
@queue.task(name='process_file')
def process_file(file_id, owner_id):
    # Download from storage
    # Process
    # Update metadata
    # May take minutes!
```

## Key Concepts

### 1. Service Independence

Each service:
- **Owns its data** (separate database)
- **Exposes interface** (API or events)
- **Fails independently** (doesn't crash others)
- **Scales independently** (run 1 or 10 instances)
- **Deploys independently** (update without downtime)

```python
# ✓ RIGHT: Each service owns its database
# Upload Service
PostgreSQL database: files, uploads

# Metadata Service
PostgreSQL database: metadata, audit_trail

# ✓ RIGHT: Updates are asynchronous
Upload Service: "File uploaded!"
  ↓ (publish event)
RabbitMQ
  ↓ (async processing)
Metadata Service: "Recording metadata..."
Processing Service: "Starting processing..."
```

### 2. Resilience Patterns

#### Retry Logic
```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10)
)
async def call_storage_service(file_data):
    return await httpx.AsyncClient().post(
        "http://storage-service:9000/store",
        data=file_data
    )

# Retries with exponential backoff:
# Attempt 1: immediate
# Attempt 2: wait 2 seconds
# Attempt 3: wait 4-10 seconds (exponential)
# If all fail: raise exception
```

#### Circuit Breaker
```python
from pybreaker import CircuitBreaker

storage_breaker = CircuitBreaker(
    fail_max=5,  # Fail 5 times in a row
    reset_timeout=60  # Then stop calling for 60 seconds
)

async def store_file(data):
    try:
        return await storage_breaker.call(
            call_storage_service, 
            data
        )
    except storage_breaker.CircuitBreakerOpenedListener:
        # Storage is down; queue for retry
        await queue_for_retry(data)
        return {"status": "queued"}
```

#### Timeout
```python
import asyncio

async def get_with_timeout(file_id):
    try:
        return await asyncio.wait_for(
            fetch_from_ai_service(file_id),
            timeout=30  # Max 30 seconds
        )
    except asyncio.TimeoutError:
        # Return cached result or empty
        return {"status": "timeout", "cached": True}
```

### 3. Distributed State with Redis

Problem: Service A creates a session, Service B needs to read it.

Solution: Store state in Redis, not in-process memory.

```python
# Service A: Upload
session_id = generate_id()
redis.setex(
    f"session:{session_id}",
    3600,  # 1 hour
    json.dumps({
        "user_id": "user123",
        "files_uploaded": [],
        "created_at": datetime.now().isoformat(),
    })
)

# Service B: Metadata (different process, different machine)
session_data = redis.get(f"session:{session_id}")
# Can retrieve even though created by different service!
```

### 4. Event-Driven Architecture

Services communicate through events, not direct calls.

```python
# OLD (Tightly coupled):
# Upload Service
def upload_file(file):
    storage.store(file)
    metadata.create(file.meta)  # Direct call
    processing.start(file.id)   # Direct call
    # If any service is down, entire upload fails!

# NEW (Loosely coupled):
def upload_file(file):
    storage.store(file)
    
    # Publish event
    event_bus.publish('file.uploaded', {
        'file_id': file.id,
        'owner': file.owner,
    })
    
    # Return immediately
    return {"file_id": file.id}

# Other services listen independently
@event_bus.on('file.uploaded')
async def on_file_uploaded(event):
    # Metadata Service updates records
    metadata.create(event['file_id'])

@event_bus.on('file.uploaded')
async def on_file_uploaded(event):
    # Processing Service starts job
    processing.start(event['file_id'])
    
# If Metadata Service is down, event is queued
# Processing still works!
```

### 5. Service Discovery

Problem: How does Upload Service know where Storage Service is?

Solutions:
- **Phase 1 (Simple)**: Hardcoded URLs in environment variables
- **Phase 2 (Production)**: Kubernetes DNS

```python
# Phase 1
STORAGE_URL = os.getenv("STORAGE_SERVICE_URL", "http://storage:9000")

# Phase 2 (Kubernetes)
STORAGE_URL = os.getenv("STORAGE_SERVICE_URL", "http://storage-service.default.svc.cluster.local:9000")
# Kubernetes DNS resolves automatically!
```

## Docker Compose Deep Dive

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: filedb
      POSTGRES_USER: fileuser
      POSTGRES_PASSWORD: filepass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U fileuser"]
      interval: 10s
      timeout: 5s
      retries: 5
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  rabbitmq:
    image: rabbitmq:3-management-alpine
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    ports:
      - "5672:5672"   # AMQP port
      - "15672:15672" # Management UI
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5

  upload-service:
    build: ./services/upload
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://fileuser:filepass@postgres:5432/filedb
      - REDIS_URL=redis://redis:6379
      - RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
      - STORAGE_SERVICE_URL=http://minio:9000
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    volumes:
      - ./services/upload:/app

# Other services similarly defined...

volumes:
  postgres_data:

# Key concepts:
# 1. Services can reference each other by name (postgres, redis, etc)
# 2. depends_on with healthcheck ensures startup order
# 3. volumes for persistent data
# 4. environment variables for configuration
# 5. ports expose services for testing
```

## Testing Microservices

### Unit Tests (Single Service)
```python
def test_upload_creates_metadata():
    file = upload_file(b"content")
    assert file.id is not None
    assert file.status == "uploaded"
```

### Integration Tests (Multiple Services)
```python
def test_upload_to_metadata_flow():
    # 1. Upload file
    response = client.post("/files", files={"file": test_file})
    file_id = response.json()["file_id"]
    
    # 2. Metadata should be created
    metadata = metadata_client.get(f"/files/{file_id}")
    assert metadata["status"] == "uploaded"
    
    # 3. Processing should complete
    process_file(file_id)
    metadata = metadata_client.get(f"/files/{file_id}")
    assert metadata["status"] == "processed"
```

### Load Testing
```python
import locust

class FileUploadUser(HttpUser):
    @task
    def upload_file(self):
        self.client.post("/files", files={"file": self.generate_file()})
    
    def generate_file(self):
        return io.BytesIO(b"test content")

# Run: locust -f locustfile.py --host=http://localhost:8000
```

## Observability

### Structured Logging
```python
import structlog

log = structlog.get_logger()

@app.post("/files")
async def upload_file(file: UploadFile):
    request_id = get_request_id()
    
    log.info(
        "upload_started",
        file_name=file.filename,
        file_size=file.size,
        request_id=request_id,
        user_id=get_user_id(),
    )
    
    try:
        file_id = save_file(file)
        log.info(
            "upload_completed",
            file_id=file_id,
            request_id=request_id,
        )
        return {"file_id": file_id}
    except Exception as e:
        log.error(
            "upload_failed",
            error=str(e),
            request_id=request_id,
        )
        raise

# All logs include request_id, allows tracing across services
```

### Distributed Tracing
```python
from opentelemetry import trace

tracer = trace.get_tracer(__name__)

@app.post("/files")
async def upload_file(file: UploadFile):
    with tracer.start_as_current_span("upload_file") as span:
        span.set_attribute("file.name", file.filename)
        span.set_attribute("file.size", file.size)
        
        # Call another service
        with tracer.start_as_current_span("call_storage") as storage_span:
            result = storage_service.store(file)
            storage_span.set_attribute("storage.url", result.url)
        
        return result

# Jaeger/Zipkin shows entire call tree:
# upload_file
#   └─ call_storage
#   └─ update_metadata
#   └─ publish_event
```

## Common Questions

**Q: Why not use a monolith?**  
A: Monoliths work for small systems. At scale:
- Can only scale the whole thing (buy expensive servers)
- One bug crashes everything
- Deploy takes forever (test everything)
- Teams get blocked on each other
Microservices solve these by independent scaling, failure isolation, fast deployments.

**Q: How do I avoid the "distributed system complexity" trap?**  
A: Start with a monolith or simple services. Add complexity only when needed. Measure, don't guess.

**Q: What's the difference between Kafka and RabbitMQ?**  
A: 
- **RabbitMQ**: Messages are consumed once, then deleted. Good for tasks.
- **Kafka**: Messages are stored, can be replayed. Good for event sourcing.

**Q: How do I debug issues across services?**  
A: Structured logging + request IDs. Every request gets unique ID; log it in every service. Find ID in logs, see entire flow.

**Q: What happens when a service crashes?**  
A: 
- Kubernetes restarts it automatically
- Clients get 503 error
- Queued messages wait for restart
- Implement circuit breakers to handle failures gracefully

## Deployment: Local to Production

### Phase 1 (Local Development)
```bash
docker-compose up
# Everything on your machine
```

### Phase 2 (Staging)
```bash
# Deploy to cloud (AWS, GCP, Azure)
# Same containers, real cloud services (RDS, ElastiCache)
kubectl apply -f deployment/kubernetes/
```

## Next Steps

1. **Run the mockup** — `docker-compose up` and try sample workflows
2. **Read API docs** — Swagger UI at each service
3. **Explore the code** — Services are well-commented
4. **Write tests** — Create integration test for your scenario
5. **Modify services** — Add new endpoints, try new features
6. **Deploy to k8s** — See Phase 2 implementation guide

## Troubleshooting

### Service won't start
```bash
# Check logs
docker-compose logs upload-service

# Verify dependencies
docker-compose ps

# Rebuild
docker-compose build --no-cache
```

### Database connection fails
```bash
# Check PostgreSQL is up
docker-compose exec postgres psql -U fileuser -d filedb

# Verify environment variables
docker-compose exec upload-service env | grep DATABASE_URL
```

### Tests fail
```bash
# Run with verbose output
pytest tests/ -vv -s

# Stop on first failure
pytest tests/ -x
```

## Additional Resources

- [Implementation Guide](Implementation_Guide.md) — Step-by-step with code
- [Application Protocol Design](application_protocol_design.md) — Deep protocol theory
- [Two Phase Guide](Two_Phase_Implementation_Guide.md) — Mockup to production roadmap
- [Week 03 Summary](../DETAILED_COURSE_SUMMARY.md#iv-week-03-cloud-native-microservices) — Comprehensive overview

---

**Last Updated**: February 2026  
**For Questions**: See implementation documentation or course materials

**Key Takeaway**: Microservices are not about technology; they're about **decomposing complexity** so teams can build, test, and deploy independently. Start simple, add tools only when you need them.
