# Week 03 Starter Kit - Implementation Guide

## Quick Start: From Zero to Running System in 60 Minutes

This guide provides complete starter code to get students up and running quickly while still requiring them to implement core functionality.

---

## 1. Project Setup (10 minutes)

### 1.1 Directory Structure
```bash
# Create project structure
mkdir -p week03-microservices/{services/{upload,processing,storage,metadata,ai},k8s,tests,docs}
cd week03-microservices

# Create subdirectories
cd services
for svc in upload processing storage metadata ai; do
    mkdir -p $svc/{app,tests}
    touch $svc/{Dockerfile,requirements.txt,README.md}
    touch $svc/app/{__init__.py,main.py,config.py,models.py}
done
cd ..
```

### 1.2 Root Configuration Files

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  # Infrastructure
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: fileprocessing
      POSTGRES_USER: fileuser
      POSTGRES_PASSWORD: filepass123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U fileuser"]
      interval: 10s
      timeout: 5s
      retries: 5

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
      - "5672:5672"   # AMQP
      - "15672:15672" # Management UI
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    ports:
      - "9000:9000"   # API
      - "9001:9001"   # Console
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Application Services
  upload-service:
    build: ./services/upload
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://fileuser:filepass123@postgres:5432/fileprocessing
      - REDIS_URL=redis://redis:6379
      - RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
      - MINIO_ENDPOINT=minio:9000
      - MINIO_ACCESS_KEY=minioadmin
      - MINIO_SECRET_KEY=minioadmin123
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
      minio:
        condition: service_healthy
    volumes:
      - ./services/upload:/app

  processing-service:
    build: ./services/processing
    environment:
      - RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
      - MINIO_ENDPOINT=minio:9000
      - MINIO_ACCESS_KEY=minioadmin
      - MINIO_SECRET_KEY=minioadmin123
      - REDIS_URL=redis://redis:6379
    depends_on:
      rabbitmq:
        condition: service_healthy
      minio:
        condition: service_healthy
    volumes:
      - ./services/processing:/app

  metadata-service:
    build: ./services/metadata
    ports:
      - "8001:8000"
    environment:
      - DATABASE_URL=postgresql://fileuser:filepass123@postgres:5432/fileprocessing
      - REDIS_URL=redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./services/metadata:/app

  ai-service:
    build: ./services/ai
    ports:
      - "8002:8000"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - REDIS_URL=redis://redis:6379
      - RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
    depends_on:
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    volumes:
      - ./services/ai:/app

  # Monitoring
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana-dashboards:/etc/grafana/provisioning/dashboards
    depends_on:
      - prometheus

volumes:
  postgres_data:
  minio_data:
  prometheus_data:
  grafana_data:

networks:
  default:
    name: microservices-network
```

**.env.example**:
```bash
# Copy this to .env and fill in your values
ANTHROPIC_API_KEY=your-api-key-here

# Database
POSTGRES_DB=fileprocessing
POSTGRES_USER=fileuser
POSTGRES_PASSWORD=filepass123

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123

# Environment
ENVIRONMENT=development
LOG_LEVEL=INFO
```

---

## 2. Upload Service (Complete Starter Code)

**services/upload/requirements.txt**:
```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6
aiofiles==23.2.1
asyncpg==0.29.0
redis==5.0.1
aio-pika==9.3.1
minio==7.2.3
pydantic==2.5.3
pydantic-settings==2.1.0
prometheus-client==0.19.0
python-json-logger==2.0.7
```

**services/upload/Dockerfile**:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

**services/upload/app/config.py**:
```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Service
    service_name: str = "upload-service"
    environment: str = "development"
    log_level: str = "INFO"
    
    # Database
    database_url: str = "postgresql://fileuser:filepass123@localhost:5432/fileprocessing"
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    
    # RabbitMQ
    rabbitmq_url: str = "amqp://guest:guest@localhost:5672/"
    
    # MinIO
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin123"
    minio_secure: bool = False
    minio_bucket: str = "uploads"
    
    # Upload Configuration
    max_file_size: int = 100 * 1024 * 1024  # 100MB
    chunk_size: int = 5 * 1024 * 1024  # 5MB
    allowed_mime_types: list = [
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "application/pdf", "text/plain", "text/csv",
        "application/zip", "application/x-tar"
    ]
    
    # Session Configuration (from Week 02)
    session_timeout: int = 3600  # 1 hour
    
    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings():
    return Settings()
```

**services/upload/app/models.py**:
```python
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid

class UploadStatus(str, Enum):
    INITIATED = "initiated"
    UPLOADING = "uploading"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class UploadInitiateRequest(BaseModel):
    filename: str = Field(..., min_length=1, max_length=255)
    size: int = Field(..., gt=0)
    mime_type: str
    user_id: Optional[str] = None
    metadata: Optional[dict] = None

class UploadInitiateResponse(BaseModel):
    upload_id: str
    chunk_size: int
    total_chunks: int
    expires_at: datetime
    upload_url: str

class ChunkUploadResponse(BaseModel):
    upload_id: str
    chunk_index: int
    chunks_uploaded: int
    total_chunks: int
    percentage: float

class UploadCompleteResponse(BaseModel):
    file_id: str
    upload_id: str
    filename: str
    size: int
    mime_type: str
    storage_url: str
    status: UploadStatus
    processing_job_id: Optional[str] = None

class UploadMetadata(BaseModel):
    id: str
    filename: str
    size: int
    mime_type: str
    user_id: Optional[str]
    status: UploadStatus
    chunks_uploaded: int
    total_chunks: int
    created_at: datetime
    updated_at: datetime
    expires_at: datetime

class HealthResponse(BaseModel):
    status: str
    service: str
    timestamp: datetime
    dependencies: dict
```

**services/upload/app/main.py**:
```python
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response
import logging
from datetime import datetime, timedelta
import uuid
import asyncio
import aiofiles
import os
from typing import Optional, Dict
import json

from .config import get_settings, Settings
from .models import (
    UploadInitiateRequest, UploadInitiateResponse,
    ChunkUploadResponse, UploadCompleteResponse,
    UploadMetadata, UploadStatus, HealthResponse
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "service": "upload-service", "message": "%(message)s"}'
)
logger = logging.getLogger(__name__)

# Prometheus metrics
upload_counter = Counter('uploads_total', 'Total upload attempts', ['status'])
upload_duration = Histogram('upload_duration_seconds', 'Upload duration')
chunk_counter = Counter('chunks_uploaded_total', 'Total chunks uploaded')

# Initialize FastAPI
app = FastAPI(
    title="Upload Service",
    description="File upload microservice with chunked transfer support",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for upload sessions (TODO: Move to Redis)
upload_sessions: Dict[str, UploadMetadata] = {}

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, upload_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[upload_id] = websocket
        logger.info(f"WebSocket connected for upload {upload_id}")
    
    def disconnect(self, upload_id: str):
        if upload_id in self.active_connections:
            del self.active_connections[upload_id]
            logger.info(f"WebSocket disconnected for upload {upload_id}")
    
    async def send_progress(self, upload_id: str, progress: dict):
        if upload_id in self.active_connections:
            try:
                await self.active_connections[upload_id].send_json(progress)
            except Exception as e:
                logger.error(f"Error sending progress: {e}")
                self.disconnect(upload_id)

manager = ConnectionManager()

# Dependency injection
def get_upload_session(upload_id: str) -> UploadMetadata:
    """TODO: Implement Redis-backed session retrieval"""
    if upload_id not in upload_sessions:
        raise HTTPException(status_code=404, detail="Upload session not found")
    return upload_sessions[upload_id]

# Endpoints
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for Kubernetes liveness/readiness probes"""
    # TODO: Add actual dependency checks (database, redis, minio)
    return HealthResponse(
        status="healthy",
        service="upload-service",
        timestamp=datetime.utcnow(),
        dependencies={
            "database": "connected",
            "redis": "connected",
            "minio": "connected"
        }
    )

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.post("/v1/uploads/initiate", response_model=UploadInitiateResponse, status_code=201)
async def initiate_upload(request: UploadInitiateRequest, settings: Settings = Depends(get_settings)):
    """
    Initiate a new file upload session.
    
    TODO for students:
    1. Validate MIME type against allowed list
    2. Check file size against max limit
    3. Store session in Redis (currently in-memory)
    4. Generate pre-signed URL for MinIO
    """
    logger.info(f"Initiating upload: {request.filename} ({request.size} bytes)")
    
    # Validate MIME type
    if request.mime_type not in settings.allowed_mime_types:
        upload_counter.labels(status='rejected_mime').inc()
        raise HTTPException(
            status_code=415,
            detail=f"MIME type {request.mime_type} not allowed"
        )
    
    # Validate file size
    if request.size > settings.max_file_size:
        upload_counter.labels(status='rejected_size').inc()
        raise HTTPException(
            status_code=413,
            detail=f"File size exceeds maximum of {settings.max_file_size} bytes"
        )
    
    # Create upload session
    upload_id = str(uuid.uuid4())
    total_chunks = (request.size + settings.chunk_size - 1) // settings.chunk_size
    expires_at = datetime.utcnow() + timedelta(seconds=settings.session_timeout)
    
    upload_metadata = UploadMetadata(
        id=upload_id,
        filename=request.filename,
        size=request.size,
        mime_type=request.mime_type,
        user_id=request.user_id,
        status=UploadStatus.INITIATED,
        chunks_uploaded=0,
        total_chunks=total_chunks,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        expires_at=expires_at
    )
    
    # TODO: Store in Redis instead of in-memory
    upload_sessions[upload_id] = upload_metadata
    
    upload_counter.labels(status='initiated').inc()
    
    return UploadInitiateResponse(
        upload_id=upload_id,
        chunk_size=settings.chunk_size,
        total_chunks=total_chunks,
        expires_at=expires_at,
        upload_url=f"/v1/uploads/{upload_id}/chunk"
    )

@app.put("/v1/uploads/{upload_id}/chunk", response_model=ChunkUploadResponse)
async def upload_chunk(
    upload_id: str,
    chunk_index: int,
    file: UploadFile = File(...),
    session: UploadMetadata = Depends(get_upload_session)
):
    """
    Upload a single file chunk.
    
    TODO for students:
    1. Validate chunk index
    2. Save chunk to MinIO or temporary storage
    3. Update session progress in Redis
    4. Send WebSocket progress update
    5. Handle chunk reassembly
    """
    logger.info(f"Uploading chunk {chunk_index} for upload {upload_id}")
    
    # Validate chunk index
    if chunk_index < 0 or chunk_index >= session.total_chunks:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid chunk index {chunk_index}"
        )
    
    # TODO: Save chunk to temporary storage
    chunk_path = f"/tmp/uploads/{upload_id}/chunk_{chunk_index}"
    os.makedirs(os.path.dirname(chunk_path), exist_ok=True)
    
    async with aiofiles.open(chunk_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    # Update session
    session.chunks_uploaded += 1
    session.updated_at = datetime.utcnow()
    session.status = UploadStatus.UPLOADING
    
    # TODO: Update in Redis
    upload_sessions[upload_id] = session
    
    chunk_counter.inc()
    
    # Calculate progress
    percentage = (session.chunks_uploaded / session.total_chunks) * 100
    
    # Send WebSocket update
    await manager.send_progress(upload_id, {
        'upload_id': upload_id,
        'chunks_uploaded': session.chunks_uploaded,
        'total_chunks': session.total_chunks,
        'percentage': percentage,
        'status': session.status.value
    })
    
    return ChunkUploadResponse(
        upload_id=upload_id,
        chunk_index=chunk_index,
        chunks_uploaded=session.chunks_uploaded,
        total_chunks=session.total_chunks,
        percentage=percentage
    )

@app.post("/v1/uploads/{upload_id}/complete", response_model=UploadCompleteResponse)
async def complete_upload(
    upload_id: str,
    session: UploadMetadata = Depends(get_upload_session),
    settings: Settings = Depends(get_settings)
):
    """
    Finalize the upload by reassembling chunks.
    
    TODO for students:
    1. Verify all chunks are uploaded
    2. Reassemble chunks into final file
    3. Upload to MinIO
    4. Create metadata record in database
    5. Publish processing job to message queue
    6. Clean up temporary chunks
    """
    logger.info(f"Completing upload {upload_id}")
    
    with upload_duration.time():
        # Verify all chunks uploaded
        if session.chunks_uploaded != session.total_chunks:
            upload_counter.labels(status='incomplete').inc()
            raise HTTPException(
                status_code=400,
                detail=f"Only {session.chunks_uploaded}/{session.total_chunks} chunks uploaded"
            )
        
        # TODO: Reassemble chunks
        final_path = f"/tmp/uploads/{upload_id}/final"
        async with aiofiles.open(final_path, 'wb') as final_file:
            for i in range(session.total_chunks):
                chunk_path = f"/tmp/uploads/{upload_id}/chunk_{i}"
                async with aiofiles.open(chunk_path, 'rb') as chunk_file:
                    content = await chunk_file.read()
                    await final_file.write(content)
        
        # TODO: Upload to MinIO
        file_id = str(uuid.uuid4())
        storage_url = f"s3://{settings.minio_bucket}/files/{file_id}"
        
        # TODO: Save metadata to database
        
        # TODO: Publish processing job
        processing_job_id = str(uuid.uuid4())
        
        # Update session
        session.status = UploadStatus.COMPLETED
        session.updated_at = datetime.utcnow()
        upload_sessions[upload_id] = session
        
        upload_counter.labels(status='completed').inc()
        
        logger.info(f"Upload {upload_id} completed successfully as file {file_id}")
        
        return UploadCompleteResponse(
            file_id=file_id,
            upload_id=upload_id,
            filename=session.filename,
            size=session.size,
            mime_type=session.mime_type,
            storage_url=storage_url,
            status=session.status,
            processing_job_id=processing_job_id
        )

@app.delete("/v1/uploads/{upload_id}")
async def cancel_upload(
    upload_id: str,
    session: UploadMetadata = Depends(get_upload_session)
):
    """
    Cancel an in-progress upload.
    
    TODO for students:
    1. Clean up temporary chunks
    2. Update session status
    3. Notify via WebSocket
    """
    logger.info(f"Cancelling upload {upload_id}")
    
    # TODO: Clean up chunks
    
    session.status = UploadStatus.CANCELLED
    session.updated_at = datetime.utcnow()
    upload_sessions[upload_id] = session
    
    upload_counter.labels(status='cancelled').inc()
    
    return {"message": "Upload cancelled", "upload_id": upload_id}

@app.get("/v1/uploads/{upload_id}/status", response_model=UploadMetadata)
async def get_upload_status(
    upload_id: str,
    session: UploadMetadata = Depends(get_upload_session)
):
    """Get current upload status"""
    return session

@app.websocket("/v1/uploads/{upload_id}/progress")
async def upload_progress_websocket(websocket: WebSocket, upload_id: str):
    """
    WebSocket endpoint for real-time upload progress.
    
    TODO for students:
    1. Implement authentication
    2. Send initial state on connection
    3. Handle reconnection
    """
    await manager.connect(upload_id, websocket)
    try:
        # Send initial status
        if upload_id in upload_sessions:
            session = upload_sessions[upload_id]
            await websocket.send_json({
                'upload_id': upload_id,
                'chunks_uploaded': session.chunks_uploaded,
                'total_chunks': session.total_chunks,
                'percentage': (session.chunks_uploaded / session.total_chunks) * 100,
                'status': session.status.value
            })
        
        # Keep connection alive
        while True:
            data = await websocket.receive_text()
            # Echo back for heartbeat
            await websocket.send_text(data)
    except WebSocketDisconnect:
        manager.disconnect(upload_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## 3. Student TODO Checklist

### 3.1 Upload Service (Priority: HIGH)
- [ ] Implement Redis-backed session storage (replace in-memory dict)
- [ ] Add MinIO integration for chunk and final file storage
- [ ] Implement database persistence for file metadata
- [ ] Add RabbitMQ message publishing for processing jobs
- [ ] Implement proper cleanup of temporary files
- [ ] Add authentication/authorization
- [ ] Write unit tests for each endpoint
- [ ] Add integration tests with mocked dependencies

### 3.2 Processing Service (Priority: HIGH)
- [ ] Create Celery worker setup
- [ ] Implement RabbitMQ consumer
- [ ] Add image processing (format conversion)
- [ ] Add document processing (PDF operations)
- [ ] Implement job result callbacks
- [ ] Add retry logic with exponential backoff
- [ ] Implement idempotency checks
- [ ] Add monitoring and metrics

### 3.3 Metadata Service (Priority: MEDIUM)
- [ ] Create database schema and migrations
- [ ] Implement CRUD endpoints for file metadata
- [ ] Add Redis caching layer
- [ ] Implement search functionality
- [ ] Add GraphQL endpoint (optional)
- [ ] Implement audit logging
- [ ] Add pagination for list endpoints

### 3.4 AI Service (Priority: MEDIUM)
- [ ] Set up Claude API client
- [ ] Implement vision analysis endpoint
- [ ] Implement document analysis endpoint
- [ ] Add response caching
- [ ] Implement cost tracking
- [ ] Add HITL workflow
- [ ] Create confidence threshold logic

### 3.5 Infrastructure (Priority: MEDIUM)
- [ ] Create Kubernetes manifests
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Configure Prometheus metrics
- [ ] Create Grafana dashboards
- [ ] Set up distributed tracing
- [ ] Implement centralized logging
- [ ] Add health check aggregation

### 3.6 Testing & Documentation (Priority: LOW but IMPORTANT)
- [ ] Write API documentation (OpenAPI/Swagger)
- [ ] Create architecture diagram
- [ ] Write deployment guide
- [ ] Create troubleshooting runbook
- [ ] Write end-to-end tests
- [ ] Conduct load testing
- [ ] Create demo video

---

## 4. Development Workflow

### 4.1 Day-by-Day Plan

**Day 1-2: Setup & Upload Service**
- Morning: Set up project structure, Docker Compose
- Afternoon: Complete Upload Service TODOs
- Evening: Test with Postman, write unit tests

**Day 3-4: Processing & Storage**
- Morning: Build Processing Service
- Afternoon: Integrate MinIO, implement job queue
- Evening: Test end-to-end upload → process flow

**Day 5-6: Metadata & AI**
- Morning: Database schema, Metadata Service
- Afternoon: Claude API integration
- Evening: Test AI analysis pipeline

**Day 7-8: Kubernetes Deployment**
- Morning: Write K8s manifests
- Afternoon: Deploy to local cluster (minikube)
- Evening: Test service discovery, scaling

**Day 9-10: Observability**
- Morning: Add Prometheus metrics to all services
- Afternoon: Create Grafana dashboards
- Evening: Test alerting, logging

**Day 11-12: CI/CD & Hardening**
- Morning: Set up GitHub Actions
- Afternoon: Add authentication, rate limiting
- Evening: Security review, penetration testing

**Day 13-14: Testing & Polish**
- Morning: Integration tests, load tests
- Afternoon: Documentation, code cleanup
- Evening: Sprint retrospective

**Day 15: Demo & Presentation**
- Morning: Final testing
- Afternoon: Demo preparation
- Evening: Present to class

---

## 5. Testing Guide

### 5.1 Manual Testing Script

**Terminal 1: Start services**
```bash
docker-compose up -d
docker-compose logs -f upload-service
```

**Terminal 2: Test upload flow**
```bash
# 1. Initiate upload
UPLOAD_RESPONSE=$(curl -X POST http://localhost:8000/v1/uploads/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test.png",
    "size": 1048576,
    "mime_type": "image/png",
    "user_id": "test-user"
  }')

echo $UPLOAD_RESPONSE
UPLOAD_ID=$(echo $UPLOAD_RESPONSE | jq -r '.upload_id')

# 2. Upload chunks
dd if=/dev/urandom of=/tmp/test.png bs=1M count=1

# Split file into chunks
split -b 5M /tmp/test.png /tmp/chunk_

# Upload each chunk
for i in {0..0}; do
  curl -X PUT "http://localhost:8000/v1/uploads/$UPLOAD_ID/chunk?chunk_index=$i" \
    -F "file=@/tmp/chunk_aa"
done

# 3. Complete upload
curl -X POST "http://localhost:8000/v1/uploads/$UPLOAD_ID/complete"

# 4. Check status
curl "http://localhost:8000/v1/uploads/$UPLOAD_ID/status"
```

### 5.2 Automated Tests

**services/upload/tests/test_main.py**:
```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_initiate_upload():
    response = client.post("/v1/uploads/initiate", json={
        "filename": "test.txt",
        "size": 1024,
        "mime_type": "text/plain"
    })
    assert response.status_code == 201
    data = response.json()
    assert "upload_id" in data
    assert data["chunk_size"] > 0

def test_invalid_mime_type():
    response = client.post("/v1/uploads/initiate", json={
        "filename": "test.exe",
        "size": 1024,
        "mime_type": "application/x-msdownload"
    })
    assert response.status_code == 415

def test_file_too_large():
    response = client.post("/v1/uploads/initiate", json={
        "filename": "huge.zip",
        "size": 200 * 1024 * 1024,  # 200MB
        "mime_type": "application/zip"
    })
    assert response.status_code == 413

# TODO: Add more tests
# - test_upload_chunk
# - test_complete_upload
# - test_cancel_upload
# - test_websocket_progress
```

Run tests:
```bash
cd services/upload
pytest tests/ -v --cov=app --cov-report=html
```

---

## 6. Debugging Tips

### 6.1 Common Issues

**Issue: Container won't start**
```bash
# Check logs
docker-compose logs service-name

# Check if port already in use
lsof -i :8000

# Rebuild if dependencies changed
docker-compose build --no-cache service-name
```

**Issue: Services can't communicate**
```bash
# Check network
docker network ls
docker network inspect microservices-network

# Test from inside container
docker-compose exec upload-service ping postgres
docker-compose exec upload-service curl http://metadata-service:8000/health
```

**Issue: Database connection fails**
```bash
# Check if postgres is ready
docker-compose exec postgres pg_isready -U fileuser

# Connect to database
docker-compose exec postgres psql -U fileuser -d fileprocessing
```

### 6.2 Useful Commands

```bash
# View all container logs
docker-compose logs -f

# Restart single service
docker-compose restart upload-service

# Execute command in container
docker-compose exec upload-service python -c "import redis; print(redis.Redis().ping())"

# Check resource usage
docker stats

# Clean up everything
docker-compose down -v
docker system prune -af
```

---

## 7. Next Steps

After completing the starter code:
1. Review code with team
2. Identify additional features to implement
3. Create sprint backlog
4. Assign tasks
5. Start daily standups
6. Track progress in project board
7. Iterate and improve

---

**Remember**: The goal is not to build perfect code, but to understand distributed systems concepts through hands-on implementation. Focus on learning, collaboration, and incremental progress.

Good luck! 🚀
