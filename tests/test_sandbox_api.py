import pytest
from fastapi.testclient import TestClient

import sys
import os

# Add root folder to pythonpath manually for module imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sandbox.main import app

client = TestClient(app)

def test_sandbox_starts():
    # Implicitly checked if TestClient(app) initializes correctly
    assert app.title == "Argus Sandbox API"

def test_initial_status():
    response = client.get("/sandbox/status")
    assert response.status_code == 200
    data = response.json()
    assert "john.doe" in data["users"]
    assert data["users"]["john.doe"]["status"] == "locked"

def test_unlock_account_action():
    payload = {"action": "unlock_account", "target": "john.doe"}
    response = client.post("/sandbox/execute", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "john.doe" in data["message"]

    # Verify status changed
    status_response = client.get("/sandbox/status")
    assert status_response.json()["users"]["john.doe"]["status"] == "active"

def test_unknown_user():
    payload = {"action": "unlock_account", "target": "ghost.user"}
    response = client.post("/sandbox/execute", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert "not found" in data["message"]

def test_unknown_action():
    payload = {"action": "delete_database", "target": "prod"}
    response = client.post("/sandbox/execute", json=payload)
    
    assert response.status_code == 400
    assert "not supported" in response.json()["detail"]

def test_reset_sandbox():
    # Corrupt environment first
    client.post("/sandbox/execute", json={"action": "unlock_account", "target": "john.doe"})
    
    response = client.post("/sandbox/reset")
    assert response.status_code == 200
    
    # Verify rollback
    status_response = client.get("/sandbox/status")
    assert status_response.json()["users"]["john.doe"]["status"] == "locked"

def test_logs_tracked():
    # Make sure logs are empty first
    client.post("/sandbox/reset")
    
    # Do an action
    client.post("/sandbox/execute", json={"action": "restart_service", "target": "VPN"})
    
    # Check logs
    response = client.get("/sandbox/logs")
    assert response.status_code == 200
    logs = response.json()
    assert len(logs) == 1
    assert logs[0]["action"] == "restart_service"
    assert logs[0]["success"] is True
