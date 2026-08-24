from pydantic import BaseModel
from typing import Dict, List, Any, Optional
from uuid import UUID
from datetime import datetime
from .confidence import SignalResult

class EvidenceCard(BaseModel):
    ticket_id: UUID
    submitted_by: str
    category: str
    description: str
    escalation_reason: str
    signals: Dict[str, SignalResult]
    novelty_check: Dict[str, Any]
    why_not_automated: str
    candidate_fixes: List[Dict[str, Any]]
    decision_latency: Dict[str, int]
    audit_hash: str
    previous_hash: str
    timestamp: datetime
