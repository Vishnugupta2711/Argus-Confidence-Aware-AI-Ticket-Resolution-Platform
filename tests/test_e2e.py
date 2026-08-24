import json
from fastapi.testclient import TestClient
from api.main import app

def test_full_pipeline_standard_user():
    with TestClient(app) as client:
        payload = {
            "description": "I need a password reset for my SAP account immediately",
            "category": "Auth/SSO",
            "severity": "P3",
            "user_email": "john.doe@argus.local",
            "system_name": "SAP"
        }
        print("Testing auto-resolve path...")
        
        response = client.post("/api/tickets/submit", data=payload)
        print(f"Status Code: {response.status_code}")
        print("Submit Response:", response.json() if response.status_code == 200 else response.text)

def test_full_pipeline_vip_user():
    with TestClient(app) as client:
        payload = {
            "description": "I am traveling and cannot access email",
            "category": "Email Access",
            "severity": "P2",
            "user_email": "ceo@argus.local",
            "system_name": "Email"
        }
        print("\nTesting VIP user escalation path...")
        response = client.post("/api/tickets/submit", data=payload)
        print(f"Status Code: {response.status_code}")
        print("Submit Response:", response.json() if response.status_code == 200 else response.text)

def test_get_escalated_queue():
    with TestClient(app) as client:
        print("\nTesting Escalate Queue GET...")
        response = client.get("/api/tickets/agent/escalated")
        print(f"Status Code: {response.status_code}")
        
def test_dashboard_metrics():
    with TestClient(app) as client:
        print("\nTesting Metrics Dashboard GET...")
        response = client.get("/api/metrics/dashboard")
        print(f"Status Code: {response.status_code}")


if __name__ == "__main__":
    test_full_pipeline_standard_user()
    test_full_pipeline_vip_user()
    test_get_escalated_queue()
    test_dashboard_metrics()