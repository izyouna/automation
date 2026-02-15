from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from datetime import datetime
import httpx
import asyncio
import logging
from typing import Optional, Dict, Any
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Phase 1 Gateway Service", version="1.0.0")

# Service URLs (configurable via environment variables)
UPLOAD_SERVICE_URL = os.getenv("UPLOAD_SERVICE_URL", "http://localhost:8001")
PROCESSING_SERVICE_URL = os.getenv("PROCESSING_SERVICE_URL", "http://localhost:8002")
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://localhost:8003")

class ProcessingRequest(BaseModel):
    enable_processing: bool = True
    processing_operation: str = "thumbnail"
    enable_ai_analysis: bool = True
    ai_analysis_type: str = "general"

class WorkflowResponse(BaseModel):
    workflow_id: str
    file_id: str
    upload_status: str
    processing_status: Optional[str] = None
    ai_analysis_status: Optional[str] = None
    total_time: float
    timestamp: str

@app.get("/health")
async def health_check():
    """Health check endpoint for gateway and all services"""
    start_time = datetime.now()
    
    # Check all services
    services = {
        "gateway": {"url": "http://localhost:8090/health", "status": "unknown"},
        "upload": {"url": f"{UPLOAD_SERVICE_URL}/health", "status": "unknown"},
        "processing": {"url": f"{PROCESSING_SERVICE_URL}/health", "status": "unknown"},
        "ai": {"url": f"{AI_SERVICE_URL}/health", "status": "unknown"}
    }
    
    async with httpx.AsyncClient(timeout=5.0) as client:
        for service_name, service_info in services.items():
            try:
                if service_name == "gateway":
                    service_info["status"] = "healthy"
                    continue
                    
                response = await client.get(service_info["url"])
                if response.status_code == 200:
                    service_info["status"] = "healthy"
                else:
                    service_info["status"] = f"unhealthy ({response.status_code})"
            except Exception as e:
                service_info["status"] = f"unreachable: {str(e)}"
    
    total_time = (datetime.now() - start_time).total_seconds()
    
    # Determine overall status
    overall_status = "healthy"
    if any(service["status"] != "healthy" for service in services.values() if service_name != "gateway"):
        overall_status = "degraded"
    
    return {
        "status": overall_status,
        "timestamp": datetime.now().isoformat(),
        "check_duration": total_time,
        "services": services
    }

@app.post("/process-file", response_model=WorkflowResponse)
async def process_file_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    processing_options: ProcessingRequest = ProcessingRequest()
):
    """Complete file processing workflow"""
    workflow_id = f"workflow_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    start_time = datetime.now()
    
    logger.info(f"Starting workflow {workflow_id} for file {file.filename}")
    
    try:
        # Step 1: Upload file
        logger.info(f"Step 1: Uploading file {file.filename}")
        upload_result = await upload_file(file)
        file_id = upload_result["file_id"]
        
        # Step 2: Process file (if enabled)
        processing_result = None
        if processing_options.enable_processing:
            logger.info(f"Step 2: Processing file {file_id}")
            processing_result = await process_file(file_id, processing_options.processing_operation)
        
        # Step 3: AI analysis (if enabled)
        ai_result = None
        if processing_options.enable_ai_analysis:
            logger.info(f"Step 3: AI analysis for file {file_id}")
            ai_result = await analyze_file(file_id, processing_options.ai_analysis_type)
        
        # Calculate total workflow time
        total_time = (datetime.now() - start_time).total_seconds()
        
        response = WorkflowResponse(
            workflow_id=workflow_id,
            file_id=file_id,
            upload_status="completed",
            processing_status=processing_result["status"] if processing_result else "skipped",
            ai_analysis_status=ai_result["status"] if ai_result else "skipped",
            total_time=total_time,
            timestamp=datetime.now().isoformat()
        )
        
        logger.info(f"Workflow {workflow_id} completed successfully in {total_time:.2f}s")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Workflow {workflow_id} failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Workflow failed: {str(e)}")

@app.post("/upload-only")
async def upload_only_endpoint(file: UploadFile = File(...)):
    """Upload file without processing"""
    return await upload_file(file)

@app.post("/process-existing/{file_id}")
async def process_existing_file(
    file_id: str,
    processing_options: ProcessingRequest = ProcessingRequest()
):
    """Process an existing file"""
    results = {}
    
    # Process file
    if processing_options.enable_processing:
        results["processing"] = await process_file(file_id, processing_options.processing_operation)
    
    # AI analysis
    if processing_options.enable_ai_analysis:
        results["ai_analysis"] = await analyze_file(file_id, processing_options.ai_analysis_type)
    
    return {
        "file_id": file_id,
        "results": results,
        "timestamp": datetime.now().isoformat()
    }

# Helper functions
async def upload_file(file: UploadFile) -> Dict[str, Any]:
    """Helper function to upload file to upload service"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            files = {"file": (file.filename, file.file, file.content_type)}
            
            response = await client.post(
                f"{UPLOAD_SERVICE_URL}/upload",
                files=files
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Upload service error: {response.text}"
                )
            
            return response.json()
            
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Upload service unavailable")
    except Exception as e:
        logger.error(f"Upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

async def process_file(file_id: str, operation: str) -> Dict[str, Any]:
    """Helper function to process file"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{PROCESSING_SERVICE_URL}/process/{file_id}",
                json={"operation": operation, "parameters": {}}
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Processing service error: {response.text}"
                )
            
            return response.json()
            
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Processing service unavailable")
    except Exception as e:
        logger.error(f"Processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

async def analyze_file(file_id: str, analysis_type: str) -> Dict[str, Any]:
    """Helper function to analyze file with AI"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{AI_SERVICE_URL}/analyze/{file_id}",
                json={"analysis_type": analysis_type, "confidence_threshold": 0.7}
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"AI service error: {response.text}"
                )
            
            return response.json()
            
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="AI service unavailable")
    except Exception as e:
        logger.error(f"AI analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

@app.get("/workflow/{workflow_id}")
async def get_workflow_status(workflow_id: str):
    """Get status of a workflow (mock implementation)"""
    return {
        "workflow_id": workflow_id,
        "status": "completed",  # In Phase 1, we assume success
        "timestamp": datetime.now().isoformat(),
        "note": "In Phase 1, workflows are synchronous and always successful"
    }

@app.get("/stats")
async def get_gateway_stats():
    """Get gateway statistics"""
    return {
        "service": "gateway",
        "version": "1.0.0",
        "phase": 1,
        "uptime": "mock-uptime",
        "total_workflows": "mock-count",
        "average_processing_time": "mock-time",
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)