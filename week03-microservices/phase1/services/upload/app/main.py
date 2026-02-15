from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from datetime import datetime
import uuid
import json
import aiofiles
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Phase 1 Upload Service", version="1.0.0")

# Mock storage directories
UPLOAD_DIR = Path("mock_storage")
METADATA_DIR = Path("mock_metadata")

# Ensure directories exist
UPLOAD_DIR.mkdir(exist_ok=True)
METADATA_DIR.mkdir(exist_ok=True)

class UploadResponse(BaseModel):
    file_id: str
    filename: str
    size: int
    mime_type: str
    status: str
    upload_timestamp: str

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "upload-service", "timestamp": datetime.now().isoformat()}

@app.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """Upload a file to mock storage"""
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        # Generate unique file ID
        file_id = str(uuid.uuid4())
        
        # Read file content
        content = await file.read()
        file_size = len(content)
        
        # Validate file size (max 10MB for Phase 1)
        if file_size > 10 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large (max 10MB)")
        
        # Save file to mock storage
        file_path = UPLOAD_DIR / f"{file_id}_{file.filename}"
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        # Create metadata
        metadata = {
            "file_id": file_id,
            "filename": file.filename,
            "size": file_size,
            "mime_type": file.content_type or "application/octet-stream",
            "status": "uploaded",
            "upload_timestamp": datetime.now().isoformat(),
            "file_path": str(file_path)
        }
        
        # Save metadata
        metadata_path = METADATA_DIR / f"{file_id}.json"
        async with aiofiles.open(metadata_path, 'w') as f:
            await f.write(json.dumps(metadata, indent=2))
        
        logger.info(f"File uploaded successfully: {file_id} ({file.filename})")
        
        return UploadResponse(**metadata)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.get("/upload/{file_id}")
async def get_upload_status(file_id: str):
    """Get upload status and metadata"""
    metadata_path = METADATA_DIR / f"{file_id}.json"
    
    if not metadata_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        async with aiofiles.open(metadata_path, 'r') as f:
            metadata = json.loads(await f.read())
        
        return metadata
    except Exception as e:
        logger.error(f"Failed to retrieve metadata: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve metadata: {str(e)}")

@app.delete("/upload/{file_id}")
async def delete_upload(file_id: str):
    """Delete an uploaded file and its metadata"""
    metadata_path = METADATA_DIR / f"{file_id}.json"
    
    if not metadata_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        # Read metadata to get file path
        async with aiofiles.open(metadata_path, 'r') as f:
            metadata = json.loads(await f.read())
        
        # Delete file
        file_path = Path(metadata["file_path"])
        if file_path.exists():
            file_path.unlink()
        
        # Delete metadata
        metadata_path.unlink()
        
        logger.info(f"File deleted successfully: {file_id}")
        
        return {"message": "File deleted successfully", "file_id": file_id}
        
    except Exception as e:
        logger.error(f"Deletion failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Deletion failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)