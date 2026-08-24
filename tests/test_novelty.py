import pytest
import sys
import os

# Add backend to path so we can import models and core
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from core.novelty import check_novelty
from models.confidence import GateAction

class MockScoredPoint:
    def __init__(self, score: float):
        self.score = score

def test_empty_results():
    """If no results are returned, it should escalate due to novelty."""
    result = check_novelty([], threshold=0.50)
    assert result.action == GateAction.ESCALATE
    assert "No similar past tickets found" in result.reason

def test_all_below_threshold():
    """If all scores are below the threshold, it should escalate."""
    results = [MockScoredPoint(0.2), MockScoredPoint(0.4), MockScoredPoint(0.1)]
    result = check_novelty(results, threshold=0.50)
    assert result.action == GateAction.ESCALATE
    assert "below novelty threshold" in result.reason

def test_exactly_at_threshold():
    """If the max score is exactly at the threshold, it should proceed."""
    results = [MockScoredPoint(0.2), MockScoredPoint(0.50), MockScoredPoint(0.1)]
    result = check_novelty(results, threshold=0.50)
    assert result.action == GateAction.PROCEED
    assert result.reason is None

def test_well_above_threshold():
    """If the max score is well above the threshold, it should proceed."""
    results = [MockScoredPoint(0.85), MockScoredPoint(0.2), MockScoredPoint(0.4)]
    result = check_novelty(results, threshold=0.50)
    assert result.action == GateAction.PROCEED
    assert result.reason is None
