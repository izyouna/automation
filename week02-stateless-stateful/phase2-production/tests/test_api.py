"""API tests for Phase 2 production"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config.settings import settings
import json

client = TestClient(app)


class TestHealthEndpoints:
    """Test health check endpoints"""
    
    def test_shared_health(self):
        """Test shared health endpoint"""
        response = client.get("/api/v1/shared/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert "version" in data
        assert "components" in data
    
    def test_stateless_health(self):
        """Test stateless health endpoint"""
        response = client.get("/api/v1/stateless/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["components"]["stateless_mode"] == "enabled"
    
    def test_stateful_health(self):
        """Test stateful health endpoint"""
        response = client.get("/api/v1/stateful/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["components"]["stateful_mode"] == "enabled"


class TestStatelessAPI:
    """Test stateless API endpoints"""
    
    def test_stateless_info(self):
        """Test stateless info endpoint"""
        response = client.get("/api/v1/stateless/info")
        assert response.status_code == 200
        data = response.json()
        assert data["mode"] == "stateless"
        assert "capabilities" in data
        assert "endpoints" in data
    
    def test_calculate_add(self):
        """Test calculation endpoint - addition"""
        payload = {"operation": "add", "operand1": 5, "operand2": 3}
        response = client.post("/api/v1/stateless/calculate", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["result"] == 8
        assert data["operation"] == "add"
    
    def test_calculate_divide_by_zero(self):
        """Test calculation endpoint - division by zero"""
        payload = {"operation": "divide", "operand1": 5, "operand2": 0}
        response = client.post("/api/v1/stateless/calculate", json=payload)
        assert response.status_code == 400
        assert "Division by zero" in response.json()["detail"]
    
    def test_random_numbers(self):
        """Test random data generation - numbers"""
        response = client.get("/api/v1/stateless/random?type=number&count=3&min_value=1&max_value=10")
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "number"
        assert len(data["data"]) == 3
        assert all(1 <= num <= 10 for num in data["data"])
    
    def test_random_strings(self):
        """Test random data generation - strings"""
        response = client.get("/api/v1/stateless/random?type=string&count=2")
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "string"
        assert len(data["data"]) == 2
        assert all(isinstance(s, str) for s in data["data"])


class TestStatefulAPI:
    """Test stateful API endpoints"""
    
    def test_create_session(self):
        """Test session creation"""
        response = client.post("/api/v1/stateful/sessions?user_id=1")
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["user_id"] == 1
        assert data["visit_count"] == 1
        assert data["is_active"] is True
        
        # Store session ID for subsequent tests
        TestStatefulAPI.session_id = data["id"]
    
    def test_get_session(self):
        """Test getting session by ID"""
        if not hasattr(TestStatefulAPI, 'session_id'):
            pytest.skip("No session ID available")
        
        response = client.get(f"/api/v1/stateful/sessions/{TestStatefulAPI.session_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == TestStatefulAPI.session_id
        assert data["user_id"] == 1
    
    def test_update_session(self):
        """Test updating session"""
        if not hasattr(TestStatefulAPI, 'session_id'):
            pytest.skip("No session ID available")
        
        payload = {"session_data": {"test_key": "test_value"}}
        response = client.put(f"/api/v1/stateful/sessions/{TestStatefulAPI.session_id}", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["session_data"]["test_key"] == "test_value"
    
    def test_add_to_cart(self):
        """Test adding items to cart"""
        if not hasattr(TestStatefulAPI, 'session_id'):
            pytest.skip("No session ID available")
        
        response = client.post(f"/api/v1/stateful/cart/{TestStatefulAPI.session_id}?product_id=1&quantity=2")
        assert response.status_code == 200
        data = response.json()
        assert "cart" in data
        assert len(data["cart"]) == 1
        assert data["cart"][0]["product_id"] == 1
        assert data["cart"][0]["quantity"] == 2
    
    def test_get_cart(self):
        """Test getting cart contents"""
        if not hasattr(TestStatefulAPI, 'session_id'):
            pytest.skip("No session ID available")
        
        response = client.get(f"/api/v1/stateful/cart/{TestStatefulAPI.session_id}")
        assert response.status_code == 200
        data = response.json()
        assert "cart" in data
        assert len(data["cart"]) >= 1


class TestSharedAPI:
    """Test shared API endpoints"""
    
    def test_metrics(self):
        """Test metrics endpoint"""
        response = client.get("/api/v1/shared/metrics")
        assert response.status_code == 200
        data = response.json()
        assert "metrics" in data
        assert "timestamp" in data
        assert "active_sessions" in data["metrics"]
    
    def test_app_info(self):
        """Test application info endpoint"""
        response = client.get("/api/v1/shared/info")
        assert response.status_code == 200
        data = response.json()
        assert data["version"] == "2.0.0"
        assert "architecture" in data
        assert "endpoints" in data
        assert "features" in data


if __name__ == "__main__":
    pytest.main([__file__])
