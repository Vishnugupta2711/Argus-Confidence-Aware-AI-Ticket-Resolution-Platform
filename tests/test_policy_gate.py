import pytest
import sys
import os
from datetime import datetime
from uuid import uuid4

# Add backend to path so we can import models and core
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from models.ticket import TicketSubmission
from models.user import User, System
from models.confidence import GateAction
from core.policy_gate import hard_policy_gate

@pytest.fixture
def base_user():
    return User(
        id=uuid4(),
        email="test@example.com",
        name="Test User",
        tier="standard",
        department="Engineering",
        created_at=datetime.utcnow()
    )

@pytest.fixture
def base_system():
    return System(
        id=uuid4(),
        name="TestApp",
        category="Software",
        change_freeze=False,
        active_incident=False,
        updated_at=datetime.utcnow()
    )

@pytest.fixture
def base_ticket():
    return TicketSubmission(
        description="I can't access TestApp",
        category="Software Install",
        severity="P3",
        user_email="test@example.com",
        system_name="TestApp"
    )

def test_p1_escalate(base_user, base_system, base_ticket):
    base_ticket.severity = "P1"
    result = hard_policy_gate(base_ticket, base_user, base_system)
    assert result.action == GateAction.ESCALATE
    assert "High severity" in result.reason

def test_p2_escalate(base_user, base_system, base_ticket):
    base_ticket.severity = "P2"
    result = hard_policy_gate(base_ticket, base_user, base_system)
    assert result.action == GateAction.ESCALATE

def test_vip_escalate(base_user, base_system, base_ticket):
    base_user.tier = "vip"
    result = hard_policy_gate(base_ticket, base_user, base_system)
    assert result.action == GateAction.ESCALATE
    assert "VIP tier" in result.reason

def test_change_freeze_escalate(base_user, base_system, base_ticket):
    base_system.change_freeze = True
    result = hard_policy_gate(base_ticket, base_user, base_system)
    assert result.action == GateAction.ESCALATE
    assert "change freeze" in result.reason

def test_active_incident_batch_escalate(base_user, base_system, base_ticket):
    base_system.active_incident = True
    result = hard_policy_gate(base_ticket, base_user, base_system)
    assert result.action == GateAction.BATCH_ESCALATE
    assert "active incident" in result.reason

def test_p3_standard_proceed(base_user, base_system, base_ticket):
    result = hard_policy_gate(base_ticket, base_user, base_system)
    assert result.action == GateAction.PROCEED
    assert result.reason is None

def test_p4_standard_proceed(base_user, base_system, base_ticket):
    base_ticket.severity = "P4"
    result = hard_policy_gate(base_ticket, base_user, base_system)
    assert result.action == GateAction.PROCEED
