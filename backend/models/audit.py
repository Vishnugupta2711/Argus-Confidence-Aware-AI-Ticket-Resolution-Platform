from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from .evidence_card import EvidenceCard

class AuditEntry(BaseModel):
    id: UUID
    ticket_id: UUID
    decision: str
    evidence_card: dict  # JSONB representations
    audit_hash: str
    previous_hash: str
    latency_ms: int
    created_at: datetime
