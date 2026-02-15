# Phase 1 Microservices - Mockup Integration

This directory contains the Phase 1 implementation of the microservices system as a toy model. It is designed to be run within the **mockup-infra** environment to simulate real-world networking and security.

## Primary Usage: mockup-infra Integration

The recommended way to run Phase 1 is via the `mockup-infra` repository.

1. **Start Services**:
   ```powershell
   cd ../../mockup-infra
   podman-compose --profile week03 up -d
   ```

2. **Access via Gateway (Port 8080)**:
   - **Upload**: `http://localhost:8080/api/upload/`
   - **Processing**: `http://localhost:8080/api/processing/`
   - **AI**: `http://localhost:8080/api/ai/`

3. **Test Workflow**:
   ```bash
   curl -X POST -F "file=@test_data/sample.jpg" http://localhost:8080/api/upload/upload
   ```

## Alternative: Standalone Execution (Development Only)

If you need to test services without the full infrastructure:

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Start services manually**:
   ```bash
   python -m uvicorn services.upload.app.main:app --port 8001
   python -m uvicorn services.processing.app.main:app --port 8002
   python -m uvicorn services.ai.app.main:app --port 8003
   ```


## Architecture

Phase 1 uses a simplified architecture:
- **Local storage** instead of cloud storage
- **Direct HTTP calls** instead of message queues
- **SQLite** instead of PostgreSQL
- **Mock AI responses** instead of real API calls
- **Synchronous processing** instead of async workers

## Services

1. **Upload Service** (port 8001): Handles file uploads to local storage
2. **Processing Service** (port 8002): Performs basic file processing
3. **AI Service** (port 8003): Provides mock AI analysis
4. **Gateway Service** (port 8080): Orchestrates the workflow

## Testing

```bash
# Run compliance tests
pytest tests/test_phase1_compliance.py -v

# Run integration tests
pytest tests/test_phase1_integration.py -v
```