import pytest
import sys
import os
from unittest.mock import AsyncMock, MagicMock, patch

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from core.pipeline import process_ticket
from models.confidence import GateAction

@pytest.fixture
def mock_supabase():
    client = MagicMock()
    # Mock successful insert and return a fake ID
    client.insert_novel_ticket.return_value = None
    client.update_ticket.return_value = None
    client.add_ticket_comment.return_value = None
    client.get_last_audit_hash.return_value = "genesis_hash"
    client.get_category_thresholds.return_value = {
        "threshold_a": 0.85, "threshold_b": 0.60, "threshold_c": 0.70, "min_sample_size": 5
    }
    client.get_ticket_history.return_value = [{"outcome": "verified"}] * 10
    
    # Mock user and system
    from datetime import datetime
    import uuid
    client.get_user_by_email.return_value = {
        "id": str(uuid.uuid4()), "email": "user@example.com", "name": "Test", 
        "tier": "standard", "department": "IT", "created_at": datetime.utcnow()
    }
    client.get_system_by_name.return_value = {
        "id": str(uuid.uuid4()), "name": "TestApp", "category": "Software", 
        "change_freeze": False, "active_incident": False, "updated_at": datetime.utcnow()
    }
    
    return client

@pytest.fixture
def mock_qdrant():
    return AsyncMock()

@pytest.fixture
def test_cluster_map():
    return {"reset password": "pwd_reset"}

@pytest.fixture
def base_ticket():
    return {
        "id": "t123",
        "description": "Please reset my password",
        "category": "Login",
        "severity": "P3",
        "user_email": "user@example.com",
        "user_tier": "standard",
        "system_status": "operational"
    }

# Mocking external calls for the entire pipeline
@pytest.fixture(autouse=True)
def mock_pipeline_dependencies():
    with patch("core.pipeline.embed_ticket", new_callable=AsyncMock) as mock_embed, \
         patch("core.pipeline.retrieve_similar", new_callable=AsyncMock) as mock_retrieve, \
         patch("core.pipeline.test_in_sandbox", new_callable=AsyncMock) as mock_sandbox, \
         patch("core.pipeline.generate_evidence_card", new_callable=AsyncMock) as mock_evidence, \
         patch("core.pipeline.generate_resolution_message", new_callable=AsyncMock) as mock_res_msg:
        
        mock_embed.return_value = [0.1] * 1024
        
        mock_scored_point = MagicMock()
        mock_scored_point.score = 0.95
        mock_scored_point.payload = {"resolution": "reset password", "category": "Login"}
        mock_retrieve.return_value = [mock_scored_point] * 5
        
        mock_sandbox.return_value = {"success": True, "logs": ["ok"]}
        mock_evidence.return_value = "Mock Evidence"
        mock_res_msg.return_value = "Mock Resolution Msg"
        
        yield {
            "embed": mock_embed,
            "retrieve": mock_retrieve,
            "sandbox": mock_sandbox,
            "evidence": mock_evidence,
            "res_msg": mock_res_msg
        }

@pytest.mark.asyncio
async def test_happy_path_autoresolve(base_ticket, mock_supabase, mock_qdrant, test_cluster_map):
    result = await process_ticket(base_ticket, mock_supabase, mock_qdrant, test_cluster_map)
    assert result["status"] == "auto_resolved"
    assert result["action"] == GateAction.PROCEED

@pytest.mark.asyncio
async def test_vip_escalation(base_ticket, mock_supabase, mock_qdrant, test_cluster_map):
    from datetime import datetime
    import uuid
    mock_supabase.get_user_by_email.return_value = {
        "id": str(uuid.uuid4()), "email": "user@example.com", "name": "VIP User", 
        "tier": "vip", "department": "Exec", "created_at": datetime.utcnow()
    }
    result = await process_ticket(base_ticket, mock_supabase, mock_qdrant, test_cluster_map)
    assert result["status"] == "escalated"
    assert "VIP" in result["reason"]

@pytest.mark.asyncio
async def test_p1_escalation(base_ticket, mock_supabase, mock_qdrant, test_cluster_map):
    base_ticket["severity"] = "P1"
    result = await process_ticket(base_ticket, mock_supabase, mock_qdrant, test_cluster_map)
    assert result["status"] == "escalated"
    assert "P1" in result["reason"]

@pytest.mark.asyncio
async def test_novel_ticket(base_ticket, mock_supabase, mock_qdrant, test_cluster_map, mock_pipeline_dependencies):
    # Force low retrieval scores to trigger Layer 2 novelty escalate
    mock_scored_point = MagicMock()
    mock_scored_point.score = 0.20 # Below 0.50 threshold
    mock_pipeline_dependencies["retrieve"].return_value = [mock_scored_point]
    
    result = await process_ticket(base_ticket, mock_supabase, mock_qdrant, test_cluster_map)
    assert result["status"] == "escalated"
    assert "novelty threshold" in result["reason"]

@pytest.mark.asyncio
async def test_sandbox_failure(base_ticket, mock_supabase, mock_qdrant, test_cluster_map, mock_pipeline_dependencies):
    # Force sandbox to reject the action
    mock_pipeline_dependencies["sandbox"].return_value = {"success": False, "error": "Sandbox test failed validation."}
    
    result = await process_ticket(base_ticket, mock_supabase, mock_qdrant, test_cluster_map)
    assert result["status"] == "escalated"
    assert "Sandbox validation failed" in result["reason"]

@pytest.mark.asyncio
async def test_confidence_engine_failure(base_ticket, mock_supabase, mock_qdrant, test_cluster_map):
    # Make history empty to trigger Signal C cold start failure -> Escalate
    mock_supabase.get_ticket_history.return_value = []
    
    result = await process_ticket(base_ticket, mock_supabase, mock_qdrant, test_cluster_map)
    assert result["status"] == "escalated"
    assert "Veto gate triggered" in result["reason"]
    assert "confidence_report" in result

