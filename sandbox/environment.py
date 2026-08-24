from typing import Dict, Any

class SandboxEnvironment:
    """
    In-memory mock environment simulating corporate IT systems.
    """
    def __init__(self):
        self.users: Dict[str, Dict[str, Any]] = {}
        self.services: Dict[str, str] = {}
        self.permissions: Dict[str, list[str]] = {}
        self.reset()

    def reset(self):
        """Restores the environment to its initial mock state."""
        # 10 mock users with mixed statuses
        self.users = {
            "john.doe": {"status": "locked", "password_expired": False},
            "jane.smith": {"status": "active", "password_expired": True},
            "system.admin": {"status": "active", "password_expired": False},
            "test.user1": {"status": "expired", "password_expired": True},
            "test.user2": {"status": "locked", "password_expired": False},
            "ceo.user": {"status": "active", "password_expired": False},
            "new.hire": {"status": "pending", "password_expired": False},
            "contractor.1": {"status": "active", "password_expired": False},
            "contractor.2": {"status": "locked", "password_expired": True},
            "service.account": {"status": "active", "password_expired": False},
        }

        # Mock systems/services
        self.services = {
            "SAP": "running",
            "VPN": "stopped",
            "Email": "running",
            "Network": "running",
            "Printer": "error",
            "Active Directory": "running"
        }

        # Mock roles/permissions per user
        self.permissions = {
            "john.doe": ["basic_access"],
            "jane.smith": ["basic_access", "sap_access"],
        }
    
    def get_state(self) -> Dict[str, Any]:
        return {
            "users": self.users,
            "services": self.services,
            "permissions": self.permissions
        }

# Global singleton instance for the FastAPI app
env = SandboxEnvironment()
