"""
Phase 1 Compliance Tests

These tests verify that the Phase 1 implementation meets all requirements
for the toy model microservices system.
"""

import pytest
import httpx
import asyncio
import json
from pathlib import Path
import time
import os
from dotenv import load_dotenv

load_dotenv()

# Service URLs
GATEWAY_URL = os.getenv("GATEWAY_URL", "http://localhost:8090")
UPLOAD_URL = os.getenv("UPLOAD_SERVICE_URL", "http://localhost:8001")
PROCESSING_URL = os.getenv("PROCESSING_SERVICE_URL", "http://localhost:8002")
AI_URL = os.getenv("AI_SERVICE_URL", "http://localhost:8003")

# Test data directory
TEST_DATA_DIR = Path("test_data")
TEST_DATA_DIR.mkdir(exist_ok=True)

# Create test file if it doesn't exist
def create_test_file():
    test_file = TEST_DATA_DIR / "test_image.jpg"
    if not test_file.exists():
        # Create a simple mock image file
        test_file.write_text("Mock JPEG image content for testing")
    return test_file

@pytest.fixture
def test_file():
    return create_test_file()

@pytest.fixture
async def client():
    async with httpx.AsyncClient(timeout=30.0) as client:
        yield client

class TestPhase1Compliance:
    """Test suite for Phase 1 compliance"""
    
    # ========================================
    # Service Health Checks
    # ========================================
    
    @pytest.mark.asyncio
    async def test_upload_service_health(self, client):
        """Test upload service health endpoint"""
        response = await client.get(f"{UPLOAD_URL}/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "upload-service"
        assert "timestamp" in data
    
    @pytest.mark.asyncio
    async def test_processing_service_health(self, client):
        """Test processing service health endpoint"""
        response = await client.get(f"{PROCESSING_URL}/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "processing-service"
        assert "timestamp" in data
    
    @pytest.mark.asyncio
    async def test_ai_service_health(self, client):
        """Test AI service health endpoint"""
        response = await client.get(f"{AI_URL}/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "ai-service"
        assert "timestamp" in data
    
    @pytest.mark.asyncio
    async def test_gateway_health(self, client):
        """Test gateway health endpoint"""
        response = await client.get(f"{GATEWAY_URL}/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] in ["healthy", "degraded"]
        assert "services" in data
        assert "timestamp" in data
        
        # Check that all services are listed
        services = data["services"]
        assert "upload" in services
        assert "processing" in services
        assert "ai" in services
    
    # ========================================
    # Upload Service Tests
    # ========================================
    
    @pytest.mark.asyncio
    async def test_file_upload_success(self, client, test_file):
        """Test successful file upload"""
        with open(test_file, 'rb') as f:
            files = {"file": ("test_image.jpg", f, "image/jpeg")}
            response = await client.post(f"{UPLOAD_URL}/upload", files=files)
        
        assert response.status_code == 200
        
        data = response.json()
        assert "file_id" in data
        assert data["filename"] == "test_image.jpg"
        assert data["status"] == "uploaded"
        assert data["mime_type"] == "image/jpeg"
        assert "upload_timestamp" in data
        
        return data["file_id"]
    
    @pytest.mark.asyncio
    async def test_upload_metadata_retrieval(self, client, test_file):
        """Test retrieval of upload metadata"""
        # First upload a file
        file_id = await self.test_file_upload_success(client, test_file)
        
        # Get metadata
        response = await client.get(f"{UPLOAD_URL}/upload/{file_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["file_id"] == file_id
        assert data["filename"] == "test_image.jpg"
        assert data["status"] == "uploaded"
    
    @pytest.mark.asyncio
    async def test_upload_file_deletion(self, client, test_file):
        """Test file deletion"""
        # First upload a file
        file_id = await self.test_file_upload_success(client, test_file)
        
        # Delete the file
        response = await client.delete(f"{UPLOAD_URL}/upload/{file_id}")
        assert response.status_code == 200
        
        # Verify deletion
        response = await client.get(f"{UPLOAD_URL}/upload/{file_id}")
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_upload_nonexistent_file(self, client):
        """Test retrieval of nonexistent file"""
        fake_file_id = "nonexistent_file_123"
        response = await client.get(f"{UPLOAD_URL}/upload/{fake_file_id}")
        assert response.status_code == 404
    
    # ========================================
    # Processing Service Tests
    # ========================================
    
    @pytest.mark.asyncio
    async def test_file_processing_success(self, client, test_file):
        """Test successful file processing"""
        # First upload a file
        file_id = await self.test_file_upload_success(client, test_file)
        
        # Process the file
        processing_data = {
            "operation": "thumbnail",
            "parameters": {"width": 200, "height": 200}
        }
        response = await client.post(
            f"{PROCESSING_URL}/process/{file_id}",
            json=processing_data
        )
        
        assert response.status_code == 200
        
        data = response.json()
        assert data["file_id"] == file_id
        assert data["operation"] == "thumbnail"
        assert data["status"] == "completed"
        assert "processing_time" in data
        assert "output_file" in data
    
    @pytest.mark.asyncio
    async def test_processing_operations_list(self, client):
        """Test getting supported processing operations"""
        response = await client.get(f"{PROCESSING_URL}/process/operations")
        assert response.status_code == 200
        
        data = response.json()
        assert "operations" in data
        assert len(data["operations"]) > 0
        
        # Check that thumbnail operation exists
        operations = data["operations"]
        thumbnail_op = next((op for op in operations if op["name"] == "thumbnail"), None)
        assert thumbnail_op is not None
        assert "description" in thumbnail_op
    
    @pytest.mark.asyncio
    async def test_batch_processing(self, client, test_file):
        """Test batch processing of multiple files"""
        # Upload multiple files
        file_ids = []
        for i in range(3):
            file_id = await self.test_file_upload_success(client, test_file)
            file_ids.append(file_id)
        
        # Process batch
        batch_data = {"file_ids": file_ids, "operation": "thumbnail"}
        response = await client.post(f"{PROCESSING_URL}/process/batch", json=batch_data)
        
        assert response.status_code == 200
        
        data = response.json()
        assert data["total_files"] == 3
        assert data["successful"] > 0
        assert "results" in data
    
    # ========================================
    # AI Service Tests
    # ========================================
    
    @pytest.mark.asyncio
    async def test_ai_analysis_success(self, client, test_file):
        """Test successful AI analysis"""
        # First upload a file
        file_id = await self.test_file_upload_success(client, test_file)
        
        # Analyze the file
        analysis_data = {
            "analysis_type": "general",
            "confidence_threshold": 0.7
        }
        response = await client.post(
            f"{AI_URL}/analyze/{file_id}",
            json=analysis_data
        )
        
        assert response.status_code == 200
        
        data = response.json()
        assert data["file_id"] == file_id
        assert data["analysis_type"] == "general"
        assert "results" in data
        assert "confidence" in data
        assert data["confidence"] >= 0.0
        assert data["confidence"] <= 1.0
    
    @pytest.mark.asyncio
    async def test_ai_models_list(self, client):
        """Test getting available AI models"""
        response = await client.get(f"{AI_URL}/models")
        assert response.status_code == 200
        
        data = response.json()
        assert "models" in data
        assert len(data["models"]) > 0
        
        # Check that models have required fields
        for model in data["models"]:
            assert "name" in model
            assert "type" in model
            assert "description" in model
    
    @pytest.mark.asyncio
    async def test_batch_ai_analysis(self, client, test_file):
        """Test batch AI analysis"""
        # Upload multiple files
        file_ids = []
        for i in range(2):
            file_id = await self.test_file_upload_success(client, test_file)
            file_ids.append(file_id)
        
        # Analyze batch
        batch_data = {"file_ids": file_ids, "analysis_type": "general"}
        response = await client.post(f"{AI_URL}/analyze/batch", json=batch_data)
        
        assert response.status_code == 200
        
        data = response.json()
        assert data["total_files"] == 2
        assert data["successful"] > 0
        assert "results" in data
    
    # ========================================
    # Gateway Integration Tests
    # ========================================
    
    @pytest.mark.asyncio
    async def test_complete_workflow_success(self, client, test_file):
        """Test complete file processing workflow through gateway"""
        with open(test_file, 'rb') as f:
            files = {"file": ("test_image.jpg", f, "image/jpeg")}
            
            # Use default processing options
            processing_options = {
                "enable_processing": True,
                "processing_operation": "thumbnail",
                "enable_ai_analysis": True,
                "ai_analysis_type": "general"
            }
            
            response = await client.post(
                f"{GATEWAY_URL}/process-file",
                files=files,
                data={"processing_options": json.dumps(processing_options)}
            )
        
        assert response.status_code == 200
        
        data = response.json()
        assert "workflow_id" in data
        assert "file_id" in data
        assert data["upload_status"] == "completed"
        assert data["processing_status"] == "completed"
        assert data["ai_analysis_status"] == "completed"
        assert "total_time" in data
    
    @pytest.mark.asyncio
    async def test_upload_only_workflow(self, client, test_file):
        """Test upload-only workflow"""
        with open(test_file, 'rb') as f:
            files = {"file": ("test_image.jpg", f, "image/jpeg")}
            response = await client.post(f"{GATEWAY_URL}/upload-only", files=files)
        
        assert response.status_code == 200
        
        data = response.json()
        assert "file_id" in data
        assert data["status"] == "uploaded"
    
    @pytest.mark.asyncio
    async def test_process_existing_file(self, client, test_file):
        """Test processing existing file through gateway"""
        # First upload a file
        file_id = await self.test_file_upload_success(client, test_file)
        
        # Process existing file
        processing_options = {
            "enable_processing": True,
            "processing_operation": "thumbnail",
            "enable_ai_analysis": False
        }
        
        response = await client.post(
            f"{GATEWAY_URL}/process-existing/{file_id}",
            json=processing_options
        )
        
        assert response.status_code == 200
        
        data = response.json()
        assert data["file_id"] == file_id
        assert "processing" in data["results"]
        assert "ai_analysis" not in data["results"]
    
    # ========================================
    # Error Handling Tests
    # ========================================
    
    @pytest.mark.asyncio
    async def test_service_unavailable_handling(self, client):
        """Test handling of unavailable services"""
        # Test with fake service URL
        fake_url = "http://localhost:9999/health"
        
        try:
            response = await client.get(fake_url)
            assert response.status_code != 200  # Should fail
        except httpx.ConnectError:
            pass  # Expected behavior
    
    @pytest.mark.asyncio
    async def test_invalid_file_upload(self, client):
        """Test upload with invalid file"""
        # Test with no file
        response = await client.post(f"{UPLOAD_URL}/upload")
        assert response.status_code == 422  # FastAPI validation error
    
    @pytest.mark.asyncio
    async def test_large_file_rejection(self, client):
        """Test rejection of files larger than 10MB"""
        # Create a large mock file (simulate 11MB)
        large_content = b"x" * (11 * 1024 * 1024)
        
        files = {"file": ("large_file.bin", large_content, "application/octet-stream")}
        response = await client.post(f"{UPLOAD_URL}/upload", files=files)
        
        assert response.status_code == 413  # Payload too large
    
    # ========================================
    # Performance Tests
    # ========================================
    
    @pytest.mark.asyncio
    async def test_workflow_performance(self, client, test_file):
        """Test that complete workflow completes within reasonable time"""
        start_time = time.time()
        
        with open(test_file, 'rb') as f:
            files = {"file": ("test_image.jpg", f, "image/jpeg")}
            response = await client.post(f"{GATEWAY_URL}/process-file", files=files)
        
        end_time = time.time()
        duration = end_time - start_time
        
        assert response.status_code == 200
        assert duration < 30  # Should complete within 30 seconds
        
        data = response.json()
        assert data["total_time"] < 30  # Gateway should report reasonable time
    
    @pytest.mark.asyncio
    async def test_concurrent_uploads(self, client, test_file):
        """Test handling of concurrent uploads"""
        async def upload_single_file():
            with open(test_file, 'rb') as f:
                files = {"file": ("test_image.jpg", f, "image/jpeg")}
                return await client.post(f"{UPLOAD_URL}/upload", files=files)
        
        # Launch multiple concurrent uploads
        tasks = [upload_single_file() for _ in range(3)]
        responses = await asyncio.gather(*tasks)
        
        # All should succeed
        for response in responses:
            assert response.status_code == 200
            assert "file_id" in response.json()

if __name__ == "__main__":
    pytest.main([__file__, "-v"])