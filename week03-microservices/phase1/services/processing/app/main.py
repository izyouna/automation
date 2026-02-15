from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from datetime import datetime
import asyncio
import json
from pathlib import Path
import logging
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Phase 1 Processing Service", version="1.0.0")

# Mock processing output directory
PROCESSING_DIR = Path("mock_storage")
PROCESSING_DIR.mkdir(exist_ok=True)

class ProcessingRequest(BaseModel):
    operation: str = "thumbnail"  # thumbnail, resize, convert
    parameters: dict = {}

class ProcessingResponse(BaseModel):
    file_id: str
    operation: str
    status: str
    output_file: str
    processing_time: float
    timestamp: str

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "processing-service", "timestamp": datetime.now().isoformat()}

@app.post("/process/{file_id}", response_model=ProcessingResponse)
async def process_file(file_id: str, request: ProcessingRequest):
    """Process a file with specified operation"""
    start_time = datetime.now()
    
    try:
        # Simulate processing delay (2-5 seconds)
        processing_time = 2.0 + (hash(file_id) % 30) / 10.0
        await asyncio.sleep(processing_time)
        
        # Generate output filename
        output_filename = f"{file_id}_processed_{request.operation}.jpg"
        output_path = PROCESSING_DIR / output_filename
        
        # Mock processing - create a dummy output file
        mock_output_content = f"Processed with {request.operation} operation\n"
        mock_output_content += f"Original file: {file_id}\n"
        mock_output_content += f"Parameters: {json.dumps(request.parameters)}\n"
        mock_output_content += f"Processed at: {datetime.now().isoformat()}\n"
        
        # Write mock output
        with open(output_path, 'w') as f:
            f.write(mock_output_content)
        
        # Calculate processing time
        actual_processing_time = (datetime.now() - start_time).total_seconds()
        
        logger.info(f"File processed successfully: {file_id} with {request.operation}")
        
        return ProcessingResponse(
            file_id=file_id,
            operation=request.operation,
            status="completed",
            output_file=str(output_path),
            processing_time=actual_processing_time,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Processing failed for {file_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@app.get("/process/{file_id}/status")
async def get_processing_status(file_id: str):
    """Get processing status for a file"""
    # Look for processed files
    processed_files = list(PROCESSING_DIR.glob(f"{file_id}_processed_*"))
    
    if not processed_files:
        return {
            "file_id": file_id,
            "status": "not_processed",
            "message": "File has not been processed yet"
        }
    
    # Get the most recent processed file
    latest_file = max(processed_files, key=lambda x: x.stat().st_mtime)
    
    return {
        "file_id": file_id,
        "status": "processed",
        "output_file": str(latest_file),
        "processed_at": datetime.fromtimestamp(latest_file.stat().st_mtime).isoformat(),
        "file_size": latest_file.stat().st_size
    }

@app.post("/process/batch")
async def batch_process_files(file_ids: list[str], operation: str = "thumbnail"):
    """Process multiple files in batch"""
    results = []
    
    for file_id in file_ids:
        try:
            result = await process_file(file_id, ProcessingRequest(operation=operation))
            results.append({"file_id": file_id, "status": "success", "result": result})
        except Exception as e:
            results.append({"file_id": file_id, "status": "failed", "error": str(e)})
    
    return {
        "batch_id": str(uuid.uuid4()),
        "total_files": len(file_ids),
        "successful": len([r for r in results if r["status"] == "success"]),
        "failed": len([r for r in results if r["status"] == "failed"]),
        "results": results
    }

@app.get("/process/operations")
async def get_supported_operations():
    """Get list of supported processing operations"""
    return {
        "operations": [
            {
                "name": "thumbnail",
                "description": "Generate thumbnail image",
                "parameters": ["width", "height", "quality"]
            },
            {
                "name": "resize", 
                "description": "Resize image dimensions",
                "parameters": ["width", "height", "maintain_aspect_ratio"]
            },
            {
                "name": "convert",
                "description": "Convert between image formats",
                "parameters": ["output_format", "quality"]
            }
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)