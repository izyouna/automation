"""
Phase 1 Integration Tests

These tests verify end-to-end functionality and integration between services.
"""

import pytest
import httpx
import asyncio
import json
from pathlib import Path
import time

# Service URLs
GATEWAY_URL = "http://localhost:8080"
UPLOAD_URL = "http://localhost:8001"
PROCESSING_URL = "http://localhost:8002"
AI_URL = "http://localhost:8003"

# Test scenarios
TEST_SCENARIOS = [
    {
        "name": "Image Upload and Analysis",
        "file_content": "Mock JPEG image content for testing image processing",
        "filename": "test_image.jpg",
        "mime_type": "image/jpeg",
        "processing_operation": "thumbnail",
        "ai_analysis": "vision"
    },
    {
        "name": "Document Upload and Processing",
        "file_content": "This is a test document content for processing and analysis.",
        "filename": "test_document.txt",
        "mime_type": "text/plain",
        "processing_operation": "convert",
        "ai_analysis": "nlp"
    },
    {
        "name": "General File Upload",
        "file_content": "Binary data content for general file testing purposes.",
        "filename": "test_data.bin",
        "mime_type": "application/octet-stream",
        "processing_operation": "thumbnail",
        "ai_analysis": "general"
    }
]

@pytest.fixture
async def client():
    async with httpx.AsyncClient(timeout=30.0) as client:
        yield client

@pytest.fixture
def create_test_files():
    """Create test files for different scenarios"""
    test_dir = Path("test_data")
    test_dir.mkdir(exist_ok=True)
    
    files = []
    for scenario in TEST_SCENARIOS:
        file_path = test_dir / scenario["filename"]
        file_path.write_text(scenario["file_content"])
        files.append(file_path)
    
    return files

class TestPhase1Integration:
    """Integration tests for Phase 1"""
    
    @pytest.mark.asyncio
    async def test_complete_workflow_variations(self, client, create_test_files):
        """Test complete workflow with different file types"""
        for scenario in TEST_SCENARIOS:
            test_file = Path("test_data") / scenario["filename"]
            
            with open(test_file, 'rb') as f:
                files = {"file": (scenario["filename"], f, scenario["mime_type"])}
                
                # Test different processing options
                processing_options = {
                    "enable_processing": True,
                    "processing_operation": scenario["processing_operation"],
                    "enable_ai_analysis": True,
                    "ai_analysis_type": scenario["ai_analysis"]
                }
                
                response = await client.post(
                    f"{GATEWAY_URL}/process-file",
                    files=files,
                    data={"processing_options": json.dumps(processing_options)}
                )
            
            assert response.status_code == 200, f"Failed for {scenario['name']}"
            
            data = response.json()
            assert "workflow_id" in data
            assert "file_id" in data
            assert data["upload_status"] == "completed"
            assert data["processing_status"] == "completed"
            assert data["ai_analysis_status"] == "completed"
            
            print(f"✓ Completed workflow: {scenario['name']}")
    
    @pytest.mark.asyncio
    async def test_workflow_with_skipped_steps(self, client, create_test_files):
        """Test workflows with some steps disabled"""
        test_file = Path("test_data") / "test_image.jpg"
        
        # Test upload only
        with open(test_file, 'rb') as f:
            files = {"file": ("test_image.jpg", f, "image/jpeg")}
            processing_options = {
                "enable_processing": False,
                "enable_ai_analysis": False
            }
            
            response = await client.post(
                f"{GATEWAY_URL}/process-file",
                files=files,
                data={"processing_options": json.dumps(processing_options)}
            )
        
        assert response.status_code == 200
        data = response.json()
        assert data["upload_status"] == "completed"
        assert data["processing_status"] == "skipped"
        assert data["ai_analysis_status"] == "skipped"
        
        # Test processing only (no AI)
        with open(test_file, 'rb') as f:
            files = {"file": ("test_image.jpg", f, "image/jpeg")}
            processing_options = {
                "enable_processing": True,
                "processing_operation": "thumbnail",
                "enable_ai_analysis": False
            }
            
            response = await client.post(
                f"{GATEWAY_URL}/process-file",
                files=files,
                data={"processing_options": json.dumps(processing_options)}
            )
        
        assert response.status_code == 200
        data = response.json()
        assert data["upload_status"] == "completed"
        assert data["processing_status"] == "completed"
        assert data["ai_analysis_status"] == "skipped"
        
        # Test AI only (no processing)
        with open(test_file, 'rb') as f:
            files = {"file": ("test_image.jpg", f, "image/jpeg")}
            processing_options = {
                "enable_processing": False,
                "enable_ai_analysis": True,
                "ai_analysis_type": "vision"
            }
            
            response = await client.post(
                f"{GATEWAY_URL}/process-file",
                files=files,
                data={"processing_options": json.dumps(processing_options)}
            )
        
        assert response.status_code == 200
        data = response.json()
        assert data["upload_status"] == "completed"
        assert data["processing_status"] == "skipped"
        assert data["ai_analysis_status"] == "completed"
    
    @pytest.mark.asyncio
    async def test_error_recovery_workflow(self, client, create_test_files):
        """Test error handling and recovery in workflows"""
        test_file = Path("test_data") / "test_image.jpg"
        
        # Test with invalid processing operation
        with open(test_file, 'rb') as f:
            files = {"file": ("test_image.jpg", f, "image/jpeg")}
            processing_options = {
                "enable_processing": True,
                "processing_operation": "invalid_operation",
                "enable_ai_analysis": True,
                "ai_analysis_type": "general"
            }
            
            response = await client.post(
                f"{GATEWAY_URL}/process-file",
                files=files,
                data={"processing_options": json.dumps(processing_options)}
            )
        
        # Should handle error gracefully
        assert response.status_code == 200  # Gateway should handle errors gracefully
    
    @pytest.mark.asyncio
    async def test_concurrent_workflows(self, client, create_test_files):
        """Test multiple concurrent workflows"""
        test_file = Path("test_data") / "test_image.jpg"
        
        async def run_single_workflow():
            with open(test_file, 'rb') as f:
                files = {"file": ("test_image.jpg", f, "image/jpeg")}
                processing_options = {
                    "enable_processing": True,
                    "processing_operation": "thumbnail",
                    "enable_ai_analysis": True,
                    "ai_analysis_type": "vision"
                }
                
                return await client.post(
                    f"{GATEWAY_URL}/process-file",
                    files=files,
                    data={"processing_options": json.dumps(processing_options)}
                )
        
        # Run multiple workflows concurrently
        num_concurrent = 3
        tasks = [run_single_workflow() for _ in range(num_concurrent)]
        responses = await asyncio.gather(*tasks)
        
        # All should succeed
        for response in responses:
            assert response.status_code == 200
            data = response.json()
            assert data["upload_status"] == "completed"
            assert data["processing_status"] == "completed"
            assert data["ai_analysis_status"] == "completed"
    
    @pytest.mark.asyncio
    async def test_workflow_performance_benchmark(self, client, create_test_files):
        """Benchmark workflow performance"""
        test_file = Path("test_data") / "test_image.jpg"
        
        # Measure single workflow performance
        start_time = time.time()
        
        with open(test_file, 'rb') as f:
            files = {"file": ("test_image.jpg", f, "image/jpeg")}
            processing_options = {
                "enable_processing": True,
                "processing_operation": "thumbnail",
                "enable_ai_analysis": True,
                "ai_analysis_type": "vision"
            }
            
            response = await client.post(
                f"{GATEWAY_URL}/process-file",
                files=files,
                data={"processing_options": json.dumps(processing_options)}
            )
        
        end_time = time.time()
        total_time = end_time - start_time
        
        assert response.status_code == 200
        data = response.json()
        
        # Performance assertions
        assert total_time < 30  # Complete workflow under 30 seconds
        assert data["total_time"] < 30  # Gateway reports reasonable time
        
        print(f"✓ Single workflow completed in {total_time:.2f}s")
    
    @pytest.mark.asyncio
    async def test_service_integration_direct(self, client, create_test_files):
        """Test direct service-to-service integration"""
        test_file = Path("test_data") / "test_image.jpg"
        
        # Step 1: Upload file
        with open(test_file, 'rb') as f:
            files = {"file": ("test_image.jpg", f, "image/jpeg")}
            upload_response = await client.post(f"{UPLOAD_URL}/upload", files=files)
        
        assert upload_response.status_code == 200
        file_id = upload_response.json()["file_id"]
        
        # Step 2: Process file
        process_data = {"operation": "thumbnail", "parameters": {}}
        process_response = await client.post(
            f"{PROCESSING_URL}/process/{file_id}",
            json=process_data
        )
        
        assert process_response.status_code == 200
        
        # Step 3: AI analysis
        ai_data = {"analysis_type": "vision", "confidence_threshold": 0.7}
        ai_response = await client.post(
            f"{AI_URL}/analyze/{file_id}",
            json=ai_data
        )
        
        assert ai_response.status_code == 200
        
        # Verify integration
        ai_results = ai_response.json()
        assert ai_results["file_id"] == file_id
        assert "results" in ai_results
        assert ai_results["confidence"] > 0
    
    @pytest.mark.asyncio
    async def test_file_lifecycle_workflow(self, client, create_test_files):
        """Test complete file lifecycle: upload, process, analyze, delete"""
        test_file = Path("test_data") / "test_image.jpg"
        
        # 1. Upload file
        with open(test_file, 'rb') as f:
            files = {"file": ("test_image.jpg", f, "image/jpeg")}
            upload_response = await client.post(f"{UPLOAD_URL}/upload", files=files)
        
        assert upload_response.status_code == 200
        file_id = upload_response.json()["file_id"]
        
        # 2. Process file
        process_data = {"operation": "thumbnail", "parameters": {}}
        process_response = await client.post(
            f"{PROCESSING_URL}/process/{file_id}",
            json=process_data
        )
        
        assert process_response.status_code == 200
        
        # 3. Analyze file
        ai_data = {"analysis_type": "vision", "confidence_threshold": 0.7}
        ai_response = await client.post(
            f"{AI_URL}/analyze/{file_id}",
            json=ai_data
        )
        
        assert ai_response.status_code == 200
        
        # 4. Verify file status
        status_response = await client.get(f"{UPLOAD_URL}/upload/{file_id}")
        assert status_response.status_code == 200
        
        # 5. Delete file
        delete_response = await client.delete(f"{UPLOAD_URL}/upload/{file_id}")
        assert delete_response.status_code == 200
        
        # 6. Verify deletion
        verify_response = await client.get(f"{UPLOAD_URL}/upload/{file_id}")
        assert verify_response.status_code == 404
        
        print("✓ Complete file lifecycle test passed")
    
    @pytest.mark.asyncio
    async def test_error_handling_integration(self, client):
        """Test error handling across services"""
        
        # Test with non-existent file
        fake_file_id = "nonexistent_12345"
        
        # Processing non-existent file should fail gracefully
        process_response = await client.post(
            f"{PROCESSING_URL}/process/{fake_file_id}",
            json={"operation": "thumbnail", "parameters": {}}
        )
        
        # Should handle error (might succeed due to mock nature)
        assert process_response.status_code in [200, 404]
        
        # AI analysis of non-existent file
        ai_response = await client.post(
            f"{AI_URL}/analyze/{fake_file_id}",
            json={"analysis_type": "general", "confidence_threshold": 0.7}
        )
        
        # Should handle error (might succeed due to mock nature)
        assert ai_response.status_code in [200, 404]
    
    @pytest.mark.asyncio
    async def test_batch_operations_integration(self, client, create_test_files):
        """Test batch operations across services"""
        test_file = Path("test_data") / "test_image.jpg"
        
        # Upload multiple files
        file_ids = []
        for i in range(3):
            with open(test_file, 'rb') as f:
                files = {"file": (f"test_image_{i}.jpg", f, "image/jpeg")}
                upload_response = await client.post(f"{UPLOAD_URL}/upload", files=files)
            
            assert upload_response.status_code == 200
            file_ids.append(upload_response.json()["file_id"])
        
        # Batch process files
        batch_process_data = {"file_ids": file_ids, "operation": "thumbnail"}
        batch_process_response = await client.post(
            f"{PROCESSING_URL}/process/batch",
            json=batch_process_data
        )
        
        assert batch_process_response.status_code == 200
        process_data = batch_process_response.json()
        assert process_data["total_files"] == 3
        assert process_data["successful"] > 0
        
        # Batch AI analysis
        batch_ai_data = {"file_ids": file_ids, "analysis_type": "vision"}
        batch_ai_response = await client.post(
            f"{AI_URL}/analyze/batch",
            json=batch_ai_data
        )
        
        assert batch_ai_response.status_code == 200
        ai_data = batch_ai_response.json()
        assert ai_data["total_files"] == 3
        assert ai_data["successful"] > 0
        
        print("✓ Batch operations integration test passed")

if __name__ == "__main__":
    pytest.main([__file__, "-v"])