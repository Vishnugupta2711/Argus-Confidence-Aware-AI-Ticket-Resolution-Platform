from datetime import datetime
from typing import List, Dict, Any

class SandboxLogger:
    def __init__(self):
        self.logs: List[Dict[str, Any]] = []

    def add_log(self, action: str, target: str, success: bool, message: str):
        self.logs.append({
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "action": action,
            "target": target,
            "success": success,
            "message": message
        })

    def get_logs(self) -> List[Dict[str, Any]]:
        return self.logs

    def clear(self):
        self.logs.clear()

logger = SandboxLogger()
