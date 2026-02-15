from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from datetime import datetime
import uuid
import json
from pathlib import Path
import logging
import random

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Phase 1 AI Service", version="1.0.0")

# Mock AI analysis directory
AI_DIR = Path("mock_storage")
AI_DIR.mkdir(exist_ok=True)

class AIRequest(BaseModel):
    analysis_type: str = "general"  # general, vision, nlp, classification
    confidence_threshold: float = 0.7

class AIResponse(BaseModel):
    file_id: str
    analysis_type: str
    results: dict
    confidence: float
    model_version: str
    timestamp: str

# Mock AI responses for different file types
MOCK_AI_RESPONSES = {
    "image": {
        "objects": ["person", "dog", "tree", "car", "building"],
        "scene": "outdoor",
        "dominant_colors": ["#FF6B35", "#004E89", "#1A659E"],
        "quality_score": 0.85,
        "metadata": {
            "width": 1920,
            "height": 1080,
            "format": "JPEG",
            "size_kb": 1024
        }
    },
    "document": {
        "text_content": "This is a sample document containing various pieces of text that might be found in a typical document file.",
        "language": "en",
        "word_count": 25,
        "reading_time_minutes": 2,
        "key_topics": ["sample", "document", "text"],
        "sentiment": "neutral"
    },
    "general": {
        "file_type": "unknown",
        "size_category": "medium",
        "entropy": 0.75,
        "patterns_detected": ["binary_data", "structured_content"],
        "recommendation": "Further analysis needed"
    }
}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ai-service", "timestamp": datetime.now().isoformat()}

@app.post("/analyze/{file_id}", response_model=AIResponse)
async def analyze_file(file_id: str, request: AIRequest):
    """Analyze a file using mock AI models"""
    try:
        # Simulate AI processing delay (1-3 seconds)
        import asyncio
        await asyncio.sleep(random.uniform(1, 3))
        
        # Determine analysis type based on file_id (mock logic)
        if "image" in file_id.lower() or file_id.startswith("img"):
            analysis_category = "image"
        elif "doc" in file_id.lower() or file_id.startswith("doc"):
            analysis_category = "document"
        else:
            analysis_category = "general"
        
        # Generate mock results
        base_results = MOCK_AI_RESPONSES.get(analysis_category, MOCK_AI_RESPONSES["general"])
        
        # Add some randomness to make results more realistic
        confidence = random.uniform(0.6, 0.95)
        processing_time = random.uniform(0.5, 2.0)
        
        # Create results with variation
        results = base_results.copy()
        results.update({
            "confidence": confidence,
            "processing_time": processing_time,
            "analysis_id": str(uuid.uuid4()),
            "model": f"mock-ai-{analysis_category}-v1.0",
            "version": "1.0.0"
        })
        
        # Add analysis-specific results
        if request.analysis_type == "classification":
            results["classification"] = {
                "category": random.choice(["personal", "business", "educational", "entertainment"]),
                "subcategory": random.choice(["document", "media", "archive", "other"]),
                "tags": random.sample(["important", "draft", "final", "shared"], 2)
            }
        elif request.analysis_type == "vision":
            results["vision_analysis"] = {
                "object_detection": [
                    {"object": obj, "confidence": random.uniform(0.7, 0.95)}
                    for obj in random.sample(MOCK_AI_RESPONSES["image"]["objects"], 3)
                ],
                "scene_classification": random.choice(["indoor", "outdoor", "nature", "urban"]),
                "nsfw_score": random.uniform(0.0, 0.1)  # Low for demo
            }
        elif request.analysis_type == "nlp":
            results["nlp_analysis"] = {
                "entities": [
                    {"text": "Sample Corp", "label": "ORG"},
                    {"text": "John Doe", "label": "PERSON"},
                    {"text": "New York", "label": "LOC"}
                ],
                "summary": "This document contains sample business content.",
                "keywords": ["business", "sample", "document"]
            }
        
        logger.info(f"AI analysis completed for {file_id} with {request.analysis_type}")
        
        return AIResponse(
            file_id=file_id,
            analysis_type=request.analysis_type,
            results=results,
            confidence=confidence,
            model_version="mock-ai-v1.0",
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"AI analysis failed for {file_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

@app.get("/analyze/{file_id}/history")
async def get_analysis_history(file_id: str):
    """Get analysis history for a file (mock implementation)"""
    # Generate mock history
    history = []
    for i in range(random.randint(1, 5)):
        history.append({
            "analysis_id": str(uuid.uuid4()),
            "analysis_type": random.choice(["general", "vision", "nlp", "classification"]),
            "timestamp": (datetime.now() - timedelta(hours=i)).isoformat(),
            "confidence": random.uniform(0.6, 0.9),
            "model_version": f"mock-ai-v1.{i}"
        })
    
    return {
        "file_id": file_id,
        "total_analyses": len(history),
        "history": history
    }

@app.get("/models")
async def get_available_models():
    """Get list of available AI models"""
    return {
        "models": [
            {
                "name": "mock-vision-v1.0",
                "type": "vision",
                "description": "Image analysis and object detection",
                "supported_formats": ["jpg", "png", "gif", "webp"],
                "max_file_size": "50MB",
                "accuracy": 0.85
            },
            {
                "name": "mock-nlp-v1.0", 
                "type": "nlp",
                "description": "Natural language processing and text analysis",
                "supported_formats": ["txt", "pdf", "docx"],
                "max_file_size": "10MB",
                "accuracy": 0.78
            },
            {
                "name": "mock-classifier-v1.0",
                "type": "classification", 
                "description": "General file classification and categorization",
                "supported_formats": ["*"],
                "max_file_size": "100MB",
                "accuracy": 0.82
            }
        ]
    }

@app.post("/analyze/batch")
async def batch_analyze_files(file_ids: list[str], analysis_type: str = "general"):
    """Analyze multiple files in batch"""
    results = []
    
    for file_id in file_ids:
        try:
            result = await analyze_file(file_id, AIRequest(analysis_type=analysis_type))
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

if __name__ == "__main__":
    import uvicorn
    from datetime import timedelta
    uvicorn.run(app, host="0.0.0.0", port=8003)