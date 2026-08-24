from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime

class User(BaseModel):
    id: UUID
    email: str
    name: str
    tier: str  # standard, vip, contractor
    department: str
    created_at: datetime

class System(BaseModel):
    id: UUID
    name: str
    category: str
    change_freeze: bool
    active_incident: bool
    updated_at: datetime
