import pytest
import sys
import os

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from core.confidence import compute_confidence
from models.confidence import GateAction, ConfidenceDecision

class MockScoredPoint:
    def __init__(self, score: float, payload: dict):
        self.score = score
        self.payload = payload

class MockSupabaseClient:
    def __init__(self):
        self.history = []
        
    def get_category_thresholds(self, category):
        return {
            "threshold_a": 0.85,
            "threshold_b": 0.60,
            "threshold_c": 0.70,
            "min_sample_size": 30
        }
        
    def get_ticket_history(self, category, days):
        return self.history

@pytest.fixture
def mock_supabase():
    return MockSupabaseClient()

@pytest.fixture
def test_cluster_map():
    return {
        "reset password": "pwd_reset",
        "unlock okta": "okta_unlock"
    }

def build_history(total, verified):
    return [{"outcome": "verified"} for _ in range(verified)] + [{"outcome": "failed"} for _ in range(total - verified)]

def test_all_signals_pass(mock_supabase, test_cluster_map):
    mock_supabase.history = build_history(100, 80) # 80% success
    qdrant_results = [
        MockScoredPoint(0.90, {"resolution": "Reset password"}), # A=0.90
        MockScoredPoint(0.85, {"resolution": "reset password"}),
        MockScoredPoint(0.80, {"resolution": "Unlock okta"}),
        MockScoredPoint(0.75, {"resolution": "reset PASSWORD "}),
        MockScoredPoint(0.70, {"resolution": "reset password"})  # B=4/5 = 0.80
    ]
    report = compute_confidence(qdrant_results, "Login", mock_supabase, test_cluster_map)
    assert report.decision == ConfidenceDecision.CANARY
    assert len(report.failed) == 0

def test_signal_a_fails(mock_supabase, test_cluster_map):
    mock_supabase.history = build_history(100, 80)
    qdrant_results = [
        MockScoredPoint(0.80, {"resolution": "Reset password"}), # A=0.80 (below 0.85)
        MockScoredPoint(0.70, {"resolution": "Reset password"}),
        MockScoredPoint(0.60, {"resolution": "Reset password"})
    ]
    report = compute_confidence(qdrant_results, "Login", mock_supabase, test_cluster_map)
    assert report.decision == ConfidenceDecision.ESCALATE
    assert "A" in report.failed

def test_signal_b_fails(mock_supabase, test_cluster_map):
    mock_supabase.history = build_history(100, 80)
    qdrant_results = [
        MockScoredPoint(0.90, {"resolution": "Reset password"}),
        MockScoredPoint(0.80, {"resolution": "Unlock okta"}),
        MockScoredPoint(0.70, {"resolution": "reboot server"}),
        MockScoredPoint(0.60, {"resolution": "clear cache"}) # B is split
    ]
    report = compute_confidence(qdrant_results, "Login", mock_supabase, test_cluster_map)
    assert report.decision == ConfidenceDecision.ESCALATE
    assert "B" in report.failed

def test_signal_c_fails(mock_supabase, test_cluster_map):
    # History shows 50% success, below 0.70 threshold
    mock_supabase.history = build_history(100, 50) 
    qdrant_results = [MockScoredPoint(0.90, {"resolution": "Reset password"})] * 5
    report = compute_confidence(qdrant_results, "Login", mock_supabase, test_cluster_map)
    assert report.decision == ConfidenceDecision.ESCALATE
    assert "C" in report.failed

def test_cold_start_fails(mock_supabase, test_cluster_map):
    # Only 10 tickets in history, min size is 30
    mock_supabase.history = build_history(10, 10) 
    qdrant_results = [MockScoredPoint(0.90, {"resolution": "Reset password"})] * 5
    report = compute_confidence(qdrant_results, "Login", mock_supabase, test_cluster_map)
    assert report.decision == ConfidenceDecision.ESCALATE
    assert "C" in report.failed

def test_multiple_failures(mock_supabase, test_cluster_map):
    mock_supabase.history = build_history(10, 5) # C fails
    qdrant_results = [MockScoredPoint(0.80, {"resolution": "Reset password"})] * 5 # A fails
    report = compute_confidence(qdrant_results, "Login", mock_supabase, test_cluster_map)
    assert report.decision == ConfidenceDecision.ESCALATE
    assert len(report.failed) == 2
