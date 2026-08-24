from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID


class TicketSubmission(BaseModel):
    description: str
    category: Optional[str] = None
    severity: Optional[str] = "P3"  # AI will override
    user_email: str
    system_name: Optional[str] = None
    attachment: Optional[str] = None  # Base64 or URL


class TicketResponse(BaseModel):
    ticket_id: UUID
    status: str  # processing, auto_resolved, escalated, resolved
    resolution_message: Optional[str] = None
    resolution: Optional[str] = None
    resolved_at: Optional[datetime] = None
    decision_latency_ms: Optional[float] = None
