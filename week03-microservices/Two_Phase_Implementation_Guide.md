# Week 03 Microservices Implementation: Two-Phase Approach

## Overview

This guide reframes the microservices implementation into two progressive phases, allowing students to build understanding incrementally while working toward production-ready systems.

---

## Phase 1: Mockup/Toy Model - "Understanding the Language"

**Duration**: 2-3 days  
**Goal**: Build a functional prototype that demonstrates core microservice concepts without production complexity  
**Philosophy**: *"First learn to speak, then learn to scale"*

### Phase 1 Objectives

1. **Protocol Understanding**: Master RESTful APIs, WebSocket connections, and basic message passing
2. **Service Decomposition**: Understand how to break monolithic functionality into discrete services
3. **Basic Communication**: Implement service-to-service communication using simple HTTP calls
4. **Data Flow**: Visualize how files move through a distributed system
5. **Error Handling**: Learn distributed system failure patterns and basic recovery

### Phase 1 Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │   CLI Client    │    │   Python SDK    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │    Mock API Gateway       │
                    │    (FastAPI only)         │
                    └─────────────┬─────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
┌───────▼────────┐    ┌─────────▼────────┐    ┌─────────▼────────┐
│  Upload Service  │    │Processing Service│    │ Metadata Service │
│  (In-memory)     │    │ (Synchronous)   │    │  (SQLite)       │
└───────┬──────────┘    └─────────┬────────┘    └─────────┬────────┘
        │                         │                         │
        │              ┌───────────▼───────────┐            │
        └──────────────►   Mock Storage       │◄───────────┘
                       │   (Local Files)       │
                       └───────────────────────┘
```

### Phase 1 Technology Stack

- **Services**: FastAPI applications running in **Podman/Docker containers**
- **Infrastructure**: Integrated into **mockup-infra** environment
- **Storage**: Mock storage (local filesystem inside containers)
- **Database**: SQLite with JSON metadata (integrated into services)
- **Communication**: HTTP calls through **Nginx Gateway**
- **Networking**: Isolated `public_net` (Upload) and `private_net` (Processing/AI)
- **Deployment**: `podman-compose --profile week03 up -d`

### Phase 1 Implementation Steps

#### Step 1: Core Service Setup (Day 1)

1. **Create Mock Upload Service**
   ```python
   # services/upload/app/main.py - Phase 1
   from fastapi import FastAPI, UploadFile, File
   import json
   import uuid
   from pathlib import Path
   
   app = FastAPI()
   UPLOAD_DIR = Path("./mock_storage")
   METADATA_DIR = Path("./mock_metadata")
   
   @app.post("/upload")
   async def upload_file(file: UploadFile = File(...)):
       file_id = str(uuid.uuid4())
       
       # Save file to mock storage
       file_path = UPLOAD_DIR / f"{file_id}_{file.filename}"
       content = await file.read()
       
       with open(file_path, "wb") as f:
           f.write(content)
       
       # Create mock metadata
       metadata = {
           "file_id": file_id,
           "filename": file.filename,
           "size": len(content),
           "mime_type": file.content_type,
           "status": "uploaded",
           "upload_timestamp": datetime.now().isoformat()
       }
       
       # Save metadata
       with open(METADATA_DIR / f"{file_id}.json", "w") as f:
           json.dump(metadata, f)
       
       return {"file_id": file_id, "status": "uploaded"}
   ```

2. **Create Mock Processing Service**
   ```python
   # services/processing/app/main.py - Phase 1
   from fastapi import FastAPI
   import subprocess
   from pathlib import Path
   
   app = FastAPI()
   
   @app.post("/process/{file_id}")
   async def process_file(file_id: str, operation: str = "thumbnail"):
       # Mock processing - just create a dummy output
       input_path = Path(f"./mock_storage/{file_id}_input.jpg")
       output_path = Path(f"./mock_storage/{file_id}_output.jpg")
       
       # Simulate processing delay
       await asyncio.sleep(2)
       
       # Create mock output file
       output_path.write_text("processed content")
       
       return {
           "file_id": file_id,
           "operation": operation,
           "status": "completed",
           "output_file": str(output_path)
       }
   ```

3. **Create Mock AI Service**
   ```python
   # services/ai/app/main.py - Phase 1
   from fastapi import FastAPI
   
   app = FastAPI()
   
   @app.post("/analyze/{file_id}")
   async def analyze_file(file_id: str):
       # Mock AI analysis with hardcoded responses
       mock_responses = {
           "image": {"objects": ["cat", "dog"], "confidence": 0.95},
           "document": {"text": "Sample document text", "language": "en"},
           "default": {"type": "unknown", "size": "1MB"}
       }
       
       return {
           "file_id": file_id,
           "analysis": mock_responses.get("image", mock_responses["default"]),
           "ai_model": "mock-v1.0",
           "timestamp": datetime.now().isoformat()
       }
   ```

#### Step 2: Service Integration (Day 2)

1. **Create Simple API Gateway**
   ```python
   # services/gateway/app/main.py - Phase 1
   from fastapi import FastAPI, UploadFile, File
   import httpx
   
   app = FastAPI()
   
   # Service URLs (local development)
   UPLOAD_SERVICE = "http://localhost:8001"
   PROCESS_SERVICE = "http://localhost:8002"
   AI_SERVICE = "http://localhost:8003"
   
   @app.post("/process-file")
   async def process_file_endpoint(file: UploadFile = File(...)):
       # Step 1: Upload file
       async with httpx.AsyncClient() as client:
           upload_response = await client.post(
               f"{UPLOAD_SERVICE}/upload",
               files={"file": (file.filename, file.file, file.content_type)}
           )
           file_id = upload_response.json()["file_id"]
           
           # Step 2: Process file
           process_response = await client.post(
               f"{PROCESS_SERVICE}/process/{file_id}"
           )
           
           # Step 3: AI analysis (optional)
           ai_response = await client.post(
               f"{AI_SERVICE}/analyze/{file_id}"
           )
           
           return {
               "file_id": file_id,
               "upload": upload_response.json(),
               "processing": process_response.json(),
               "ai_analysis": ai_response.json()
           }
   ```

2. **Add Basic Error Handling**
   ```python
   # Enhanced error handling in gateway
   @app.post("/process-file")
   async def process_file_endpoint(file: UploadFile = File(...)):
       try:
           # ... existing code ...
           pass
       except httpx.ConnectError:
           return {"error": "Service unavailable", "service": "upload"}
       except Exception as e:
           return {"error": str(e), "file_id": file_id}
   ```

#### Step 3: Basic Testing and Validation (Day 3)

1. **Create Simple Test Suite**
   ```python
   # tests/test_phase1.py
   import pytest
   import httpx
   from pathlib import Path
   
   @pytest.mark.asyncio
   async def test_file_processing_workflow():
       """Test complete file processing workflow"""
       async with httpx.AsyncClient() as client:
           # Upload test file
           test_file = Path("test_data/sample.jpg")
           with open(test_file, "rb") as f:
               response = await client.post(
                   "http://localhost:8080/process-file",
                   files={"file": ("test.jpg", f, "image/jpeg")}
               )
           
           assert response.status_code == 200
           data = response.json()
           assert "file_id" in data
           assert data["upload"]["status"] == "uploaded"
           assert data["processing"]["status"] == "completed"
   ```

2. **Create Basic Documentation**
   ```markdown
   # Phase 1 Documentation
   
   ## Running the Toy Model
   
   ```bash
   # Terminal 1: Start Upload Service
   cd services/upload && uvicorn app.main:app --port 8001
   
   # Terminal 2: Start Processing Service
   cd services/processing && uvicorn app.main:app --port 8002
   
   # Terminal 3: Start AI Service
   cd services/ai && uvicorn app.main:app --port 8003
   
   # Terminal 4: Start Gateway
   cd services/gateway && uvicorn app.main:app --port 8080
   
   # Test the system
   curl -X POST -F "file=@test.jpg" http://localhost:8080/process-file
   ```

### Phase 1 Learning Outcomes

- ✅ Understand microservice communication patterns
- ✅ Implement basic REST APIs
- ✅ Handle file uploads and processing
- ✅ Experience distributed system challenges
- ✅ Build confidence with working system

---

## Phase 2: Real Server Deployment - "Scaling to Production"

**Duration**: 3-4 days  
**Goal**: Transform the toy model into production-ready cloud infrastructure  
**Philosophy**: *"From toy to enterprise"*

### Phase 2 Objectives

1. **Containerization**: Package services with Docker for consistent deployment
2. **Orchestration**: Use Docker Compose for local multi-service coordination
3. **Production Storage**: Implement S3-compatible object storage (MinIO)
4. **Async Processing**: Replace synchronous calls with message queues
5. **Real Databases**: Use PostgreSQL for metadata and Redis for caching
6. **Load Balancing**: Implement Nginx for reverse proxy and load balancing
7. **Monitoring**: Add logging, metrics, and health checks
8. **Security**: Implement proper authentication and authorization

### Phase 2 Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │   CLI Client    │    │   Python SDK    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      Nginx Proxy          │
                    │   (Load Balancer)        │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │     API Gateway           │
                    │   (FastAPI + Kong)        │
                    └─────────────┬─────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
┌───────▼────────┐    ┌─────────▼────────┐    ┌─────────▼────────┐
│  Upload Service│    │Processing Service│    │ Metadata Service │
│  (Dockerized)   │    │ (Celery Workers)  │    │  (PostgreSQL)   │
└───────┬────────┘    └─────────┬────────┘    └─────────┬────────┘
        │              ┌───────────▼───────────┐            │
        │              │    RabbitMQ Queue   │            │
        └──────────────►   (Async Processing) │◄───────────┘
                       └───────────┬───────────┘
                                   │
                       ┌───────────▼───────────┐
                       │      MinIO/S3         │
                       │   (Object Storage)    │
                       └───────────────────────┘
```

### Phase 2 Technology Stack

- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose with health checks
- **Message Queue**: RabbitMQ for async processing
- **Database**: PostgreSQL with connection pooling
- **Cache**: Redis for session and metadata caching
- **Storage**: MinIO (S3-compatible object storage)
- **Load Balancer**: Nginx with SSL termination
- **Monitoring**: Prometheus + Grafana
- **AI Integration**: Real Claude API with proper error handling

### Phase 2 Implementation Steps

#### Step 1: Containerize All Services (Day 1)

1. **Create Production Dockerfiles**
   ```dockerfile
   # services/upload/Dockerfile - Phase 2
   FROM python:3.11-slim as builder
   
   # Build stage
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install --user --no-cache-dir -r requirements.txt
   
   # Runtime stage
   FROM python:3.11-slim
   
   # Create non-root user
   RUN useradd -m -u 1000 appuser
   WORKDIR /app
   
   # Copy dependencies from builder
   COPY --from=builder /root/.local /home/appuser/.local
   
   # Copy application code
   COPY --chown=appuser:appuser app/ ./app/
   
   # Health check
   HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
     CMD python -c "import httpx; httpx.get('http://localhost:8000/health').raise_for_status()"
   
   USER appuser
   EXPOSE 8000
   
   CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
   ```

2. **Update Service Configuration**
   ```python
   # services/upload/app/config.py - Phase 2
   from pydantic_settings import BaseSettings
   from functools import lru_cache
   
   class Settings(BaseSettings):
       # Service configuration
       service_name: str = "upload-service"
       environment: str = "production"
       log_level: str = "INFO"
       
       # Database with connection pooling
       database_url: str = "postgresql://fileuser:filepass123@postgres:5432/fileprocessing"
       database_pool_size: int = 10
       database_max_overflow: int = 20
       
       # Redis cluster
       redis_url: str = "redis://redis:6379"
       redis_cluster_nodes: list = []
       
       # RabbitMQ with clustering
       rabbitmq_url: str = "amqp://guest:guest@rabbitmq:5672/"
       rabbitmq_exchange: str = "file-processing"
       rabbitmq_queue: str = "upload-queue"
       
       # MinIO/S3 configuration
       minio_endpoint: str = "minio:9000"
       minio_access_key: str = "minioadmin"
       minio_secret_key: str = "minioadmin123"
       minio_bucket: str = "uploads"
       minio_secure: bool = False
       minio_region: str = "us-east-1"
       
       # Production settings
       max_file_size: int = 500 * 1024 * 1024  # 500MB
       chunk_size: int = 10 * 1024 * 1024  # 10MB
       upload_timeout: int = 300  # 5 minutes
       
       # Security
       jwt_secret: str = "your-jwt-secret-key"
       api_rate_limit: int = 100  # requests per minute
       
       # Monitoring
       metrics_port: int = 9090
       health_check_interval: int = 30
       
       class Config:
           env_file = ".env"
           case_sensitive = False
   
   @lru_cache()
   def get_settings():
       return Settings()
   ```

#### Step 2: Implement Async Processing (Day 2)

1. **Set up RabbitMQ and Celery**
   ```python
   # services/processing/app/worker.py
   from celery import Celery
   import aiohttp
   import asyncio
   from minio import Minio
   
   celery_app = Celery(
       'processing-worker',
       broker='amqp://guest:guest@rabbitmq:5672/',
       backend='redis://redis:6379'
   )
   
   @celery_app.task
   def process_file_async(file_id: str, operation: str):
       """Async file processing task"""
       loop = asyncio.get_event_loop()
       return loop.run_until_complete(process_file(file_id, operation))
   
   async def process_file(file_id: str, operation: str):
       # Download from MinIO
       minio_client = Minio(
           "minio:9000",
           access_key="minioadmin",
           secret_key="minioadmin123",
           secure=False
       )
       
       # Process file based on operation
       if operation == "thumbnail":
           result = await generate_thumbnail(file_id, minio_client)
       elif operation == "ocr":
           result = await perform_ocr(file_id, minio_client)
       else:
           result = await convert_format(file_id, operation, minio_client)
       
       return result
   ```

2. **Update Upload Service for Async Processing**
   ```python
   # services/upload/app/main.py - Phase 2
   from fastapi import FastAPI, UploadFile, File, BackgroundTasks
   import aio_pika
   import json
   
   app = FastAPI()
   
   @app.post("/v1/uploads")
   async def upload_file(
       background_tasks: BackgroundTasks,
       file: UploadFile = File(...),
       processing_options: dict = None
   ):
       """Upload file with optional async processing"""
       
       # Upload to MinIO
       file_id = await upload_to_minio(file)
       
       # Queue processing if requested
       if processing_options:
           background_tasks.add_task(
               queue_processing_job,
               file_id,
               processing_options
           )
       
       return {
           "file_id": file_id,
           "status": "uploaded",
           "processing_queued": bool(processing_options)
       }
   
   async def queue_processing_job(file_id: str, options: dict):
       """Queue file processing job to RabbitMQ"""
       connection = await aio_pika.connect_robust("amqp://guest:guest@rabbitmq:5672/")
       
       async with connection:
           channel = await connection.channel()
           
           message = {
               "file_id": file_id,
               "operations": options.get("operations", []),
               "callback_url": options.get("callback_url")
           }
           
           await channel.default_exchange.publish(
               aio_pika.Message(json.dumps(message).encode()),
               routing_key="processing-queue"
           )
   ```

#### Step 3: Production Deployment Setup (Day 3)

1. **Create Production Docker Compose**
   ```yaml
   # docker-compose.prod.yml
   version: '3.8'
   
   services:
     nginx:
       image: nginx:alpine
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - ./nginx/nginx.conf:/etc/nginx/nginx.conf
         - ./nginx/ssl:/etc/nginx/ssl
       depends_on:
         - gateway
       restart: unless-stopped
   
     postgres:
       image: postgres:15
       environment:
         POSTGRES_DB: fileprocessing
         POSTGRES_USER: fileuser
         POSTGRES_PASSWORD: ${DB_PASSWORD}
       volumes:
         - postgres_data:/var/lib/postgresql/data
         - ./init-scripts:/docker-entrypoint-initdb.d
       command: >
         postgres
         -c max_connections=200
         -c shared_buffers=256MB
         -c effective_cache_size=1GB
       restart: unless-stopped
   
     redis:
       image: redis:7-alpine
       command: redis-server --appendonly yes --maxmemory 256mb
       volumes:
         - redis_data:/data
       restart: unless-stopped
   
     rabbitmq:
       image: rabbitmq:3-management-alpine
       environment:
         RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER}
         RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASS}
       volumes:
         - rabbitmq_data:/var/lib/rabbitmq
       restart: unless-stopped
   
     minio:
       image: minio/minio:latest
       command: server /data --console-address ":9001"
       environment:
         MINIO_ROOT_USER: ${MINIO_USER}
         MINIO_ROOT_PASSWORD: ${MINIO_PASS}
       volumes:
         - minio_data:/data
       restart: unless-stopped
   
     # Application services with health checks
     upload-service:
       build:
         context: ./services/upload
         dockerfile: Dockerfile.prod
       environment:
         - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/fileprocessing
         - REDIS_URL=redis://redis:6379
         - RABBITMQ_URL=amqp://${RABBITMQ_USER}:${RABBITMQ_PASS}@rabbitmq:5672/
       depends_on:
         postgres:
           condition: service_healthy
         redis:
           condition: service_healthy
       restart: unless-stopped
       deploy:
         replicas: 2
   ```

2. **Configure Nginx Load Balancer**
   ```nginx
   # nginx/nginx.conf
   upstream gateway {
       server gateway:8000 weight=1 max_fails=3 fail_timeout=30s;
   }
   
   upstream upload_service {
       server upload-service:8000 weight=1 max_fails=3 fail_timeout=30s;
       server upload-service-2:8000 weight=1 max_fails=3 fail_timeout=30s;
   }
   
   server {
       listen 80;
       server_name api.yourdomain.com;
       
       # Redirect HTTP to HTTPS
       return 301 https://$server_name$request_uri;
   }
   
   server {
       listen 443 ssl http2;
       server_name api.yourdomain.com;
       
       ssl_certificate /etc/nginx/ssl/cert.pem;
       ssl_certificate_key /etc/nginx/ssl/key.pem;
       
       # Rate limiting
       limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
       limit_req zone=api burst=20 nodelay;
       
       # API Gateway
       location /api/ {
           proxy_pass http://gateway;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           
           # Timeouts
           proxy_connect_timeout 30s;
           proxy_send_timeout 30s;
           proxy_read_timeout 30s;
       }
       
       # File uploads (direct to upload service)
       location /api/v1/uploads {
           client_max_body_size 500M;
           proxy_pass http://upload_service;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           
           # Longer timeouts for file uploads
           proxy_connect_timeout 300s;
           proxy_send_timeout 300s;
           proxy_read_timeout 300s;
       }
       
       # Health check endpoint
       location /health {
           access_log off;
           return 200 "healthy\n";
           add_header Content-Type text/plain;
       }
   }
   ```

#### Step 4: Monitoring and Observability (Day 4)

1. **Set up Prometheus and Grafana**
   ```yaml
   # monitoring/prometheus.yml
   global:
     scrape_interval: 15s
     evaluation_interval: 15s
   
   scrape_configs:
     - job_name: 'upload-service'
       static_configs:
         - targets: ['upload-service:9090']
       metrics_path: /metrics
       scrape_interval: 10s
       
     - job_name: 'processing-service'
       static_configs:
         - targets: ['processing-service:9090']
       metrics_path: /metrics
       scrape_interval: 10s
       
     - job_name: 'postgres'
       static_configs:
         - targets: ['postgres-exporter:9187']
       scrape_interval: 10s
       
     - job_name: 'redis'
       static_configs:
         - targets: ['redis-exporter:9121']
       scrape_interval: 10s
   ```

2. **Add Application Metrics**
   ```python
   # services/upload/app/metrics.py
   from prometheus_client import Counter, Histogram, Gauge
   import time
   
   # Metrics
   upload_counter = Counter('file_uploads_total', 'Total number of file uploads')
   upload_errors = Counter('file_upload_errors_total', 'Total number of upload errors')
   upload_duration = Histogram('file_upload_duration_seconds', 'File upload duration')
   active_uploads = Gauge('active_file_uploads', 'Number of active file uploads')
   
   class MetricsMiddleware:
       def __init__(self, app):
           self.app = app
       
       async def __call__(self, scope, receive, send):
           if scope["type"] == "http":
               start_time = time.time()
               
               # Track active requests
               active_uploads.inc()
               
               try:
                   await self.app(scope, receive, send)
                   upload_counter.inc()
               except Exception:
                   upload_errors.inc()
                   raise
               finally:
                   # Record duration
                   duration = time.time() - start_time
                   upload_duration.observe(duration)
                   active_uploads.dec()
           else:
               await self.app(scope, receive, send)
   ```

### Phase 2 Deployment Commands

```bash
# Production deployment
export $(cat .env.prod | xargs)
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale upload-service=3
docker-compose -f docker-compose.prod.yml up -d --scale processing-worker=5

# View logs
docker-compose -f docker-compose.prod.yml logs -f upload-service

# Monitor health
curl https://api.yourdomain.com/health

# View metrics
curl http://localhost:9090/metrics
```

### Phase 2 Learning Outcomes

- ✅ Production containerization with Docker
- ✅ Async processing with message queues
- ✅ Load balancing and reverse proxy configuration
- ✅ Database connection pooling and optimization
- ✅ Monitoring and observability
- ✅ Production security best practices
- ✅ Horizontal scaling strategies

---

## Phase Comparison Summary

| Aspect | Phase 1 (Toy Model) | Phase 2 (Production) |
|--------|-------------------|---------------------|
| **Storage** | Local filesystem | MinIO/S3-compatible |
| **Database** | SQLite | PostgreSQL with pooling |
| **Processing** | Synchronous HTTP | Async Celery workers |
| **Communication** | Direct HTTP calls | Message queues (RabbitMQ) |
| **Deployment** | Local development | Docker containers |
| **Load Balancing** | None | Nginx reverse proxy |
| **Monitoring** | Basic logging | Prometheus + Grafana |
| **Security** | Basic validation | JWT + rate limiting |
| **Scalability** | Single instance | Horizontal scaling |
| **File Size Limit** | 10MB | 500MB+ |
| **AI Integration** | Mock responses | Real Claude API |

---

## Assessment Criteria

### Phase 1 Assessment (30%)
- [ ] All services start successfully
- [ ] File upload workflow functions
- [ ] Basic error handling implemented
- [ ] Services communicate via HTTP
- [ ] Simple test suite passes

### Phase 2 Assessment (70%)
- [ ] All services containerized
- [ ] Docker Compose orchestration works
- [ ] Async processing with RabbitMQ
- [ ] PostgreSQL integration functional
- [ ] MinIO storage working
- [ ] Nginx load balancing configured
- [ ] Monitoring dashboards accessible
- [ ] Production deployment successful
- [ ] System handles concurrent requests
- [ ] Proper error handling and logging

---

## Next Steps

After completing both phases, students will have:

1. **Practical Experience**: Built working microservice systems at two complexity levels
2. **Production Skills**: Deployed containerized applications with monitoring
3. **Architecture Understanding**: Designed distributed systems with proper separation of concerns
4. **Troubleshooting Ability**: Diagnosed issues in both simple and complex environments
5. **Career Readiness**: Portfolio project demonstrating cloud-native development skills

The two-phase approach ensures students build confidence with working systems before tackling production complexity, following the pedagogical principle of *"crawl, walk, run"* in distributed systems education.