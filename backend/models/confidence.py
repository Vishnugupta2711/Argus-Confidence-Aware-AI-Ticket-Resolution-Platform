from pydantic import BaseModel
from typing import Dict, Optional
from enum import Enum


class GateAction(str, Enum):
    PROCEED = "PROCEED"
    ESCALATE = "ESCALATE"
    BATCH_ESCALATE = "BATCH_ESCALATE"


class GateResult(BaseModel):
    action: GateAction
    reason: Optional[str] = None


class SignalStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"


class SignalResult(BaseModel):
    name: str
    score: float
    threshold: float
    result: SignalStatus
    note: Optional[str] = None


class ConfidenceDecision(str, Enum):
    CANARY = "CANARY"
    ESCALATE = "ESCALATE"


class ConfidenceReport(BaseModel):
    decision: ConfidenceDecision
    signals: Dict[str, SignalResult]
    failed: Dict[str, SignalResult]
    reason: Optional[str] = None
