from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from enum import Enum

class ResolutionType(str, Enum):
    verified = "verified"
    workaround = "workaround"
    uncertain = "uncertain"

class AgentResolution(BaseModel):
    ticket_id: UUID
    resolution_text: str
    resolution_type: ResolutionType
    override_reason: Optional[str] = None
