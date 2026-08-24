import pytest
import sys
import os
import httpx
from unittest.mock import patch, MagicMock

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from core import sandbox_client

@pytest.mark.asyncio
async def test_successful_action():
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"success": True, "logs": ["Action completed."]}
        mock_post.return_value = mock_response

        result = await sandbox_client.test_in_sandbox("reset_password", "user@example.com")
        assert result["success"] is True
        assert "logs" in result

@pytest.mark.asyncio
async def test_unknown_user_action():
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_response.json.return_value = {"success": False, "error": "User not found dalam sandbox."}
        mock_post.return_value = mock_response

        result = await sandbox_client.test_in_sandbox("reset_password", "ghost@example.com")
        assert result["success"] is False
        assert "error" in result

@pytest.mark.asyncio
async def test_unknown_action():
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.json.return_value = {"success": False, "error": "Invalid action."}
        mock_post.return_value = mock_response

        result = await sandbox_client.test_in_sandbox("launch_missiles", "server1")
        assert result["success"] is False
        assert "Invalid action" in result["error"]

@pytest.mark.asyncio
async def test_connection_timeout():
    with patch("httpx.AsyncClient.post", side_effect=httpx.TimeoutException("Timeout")):
        result = await sandbox_client.test_in_sandbox("reset_password", "user")
        assert result["success"] is False
        assert "timed out" in result["error"]

@pytest.mark.asyncio
async def test_connection_refused():
    with patch("httpx.AsyncClient.post", side_effect=httpx.ConnectError("Connection Refused")):
        result = await sandbox_client.test_in_sandbox("reset_password", "user")
        assert result["success"] is False
        assert "connection failed" in result["error"].lower()
