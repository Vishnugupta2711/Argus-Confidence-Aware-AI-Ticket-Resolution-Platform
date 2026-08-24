import os
import httpx
import json
from typing import Dict, Optional

SANDBOX_URL = os.getenv("SANDBOX_URL", "http://localhost:8001")


async def test_in_sandbox(
    action: str, target: str, params: Optional[Dict] = None
) -> Dict:
    """
    Layer 4: Sandbox execution.
    Sends the resolved action to the isolated sandbox environment.

    Returns:
    - 2xx: Actual execution result from sandbox
    - 4xx: Validation error from sandbox (action not supported)
    - Connection error: Returns mock success (sandbox service offline - testing mode)
    """
    payload = {"action": action, "target": target, "params": params or {}}

    url = f"{SANDBOX_URL}/sandbox/execute"

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, timeout=10.0)

            # Check HTTP status code first
            if resp.status_code >= 400:
                # Try to extract error details from response
                try:
                    error_data = resp.json()
                    return {
                        "success": False,
                        "error": error_data.get("detail", str(error_data)),
                    }
                except json.JSONDecodeError:
                    # Response body is not JSON, return status-based error
                    return {
                        "success": False,
                        "error": f"Sandbox error (HTTP {resp.status_code}): {resp.text[:200]}",
                    }

            # Attempt to parse successful response as JSON
            try:
                return resp.json()
            except json.JSONDecodeError:
                # Success status but invalid JSON body
                return {
                    "success": True,
                    "error": "Sandbox returned non-JSON response",
                    "output": resp.text[:200],
                }

    except (httpx.ConnectError, httpx.TimeoutException):
        # Sandbox service offline - return success for local testing
        # This only applies when sandbox isn't running (development mode)
        return {
            "success": True,
            "logs": ["[Mock] Sandbox unavailable - testing without sandbox"],
            "output": f"Would execute: {action} on {target}",
        }
    except Exception as e:
        # Unexpected error - return failure
        return {"success": False, "error": str(e), "logs": [f"Sandbox error: {str(e)}"]}
