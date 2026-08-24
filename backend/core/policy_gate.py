from models.ticket import TicketSubmission
from models.user import User, System
from models.confidence import GateResult, GateAction

P1_KEYWORDS = [
    "entire building",
    "entire floor",
    "entire team",
    "all users",
    "all employees",
    "entire company",
    "mass outage",
    "entire procurement team",
    "entire department",
    "entire office",
    "completely down",
    "all staff",
    "all departments",
    "everyone affected",
    "all sites",
]

P2_KEYWORDS = [
    "multiple users",
    "several people",
    "several employees",
    "whole building",
    "whole floor",
    "whole team",
    "widespread",
]


def auto_detect_severity(description: str) -> str:
    """
    Auto-detect severity from ticket description.
    Returns 'P1', 'P2', or 'P3'.
    """
    desc_lower = (description or "").lower()
    if any(kw in desc_lower for kw in P1_KEYWORDS):
        return "P1"
    if any(kw in desc_lower for kw in P2_KEYWORDS):
        return "P2"
    return "P3"


def _severity_gate_reason(severity: str, description: str) -> str:
    desc_lower = (description or "").lower()
    if severity == "P1":
        if "entire building" in desc_lower:
            return "AI classified P1 — mass outage entire building"
        if "entire team" in desc_lower or "entire procurement team" in desc_lower:
            return "AI classified P1 — entire team affected"
        if "all users" in desc_lower or "all employees" in desc_lower:
            return "AI classified P1 — all users affected"
        if "completely down" in desc_lower:
            return "AI classified P1 — system completely down"
        return f"High severity ticket (P1). Manual handling required."
    if severity == "P2":
        return f"Medium severity ticket (P2). Manual handling required."
    return ""


def hard_policy_gate(
    ticket: TicketSubmission, user: User, system: System = None
) -> GateResult:
    """
    Layer 0: Pure deterministic business logic.
    Evaluates strict rules before any AI processing occurs.
    """

    # 1. VIP Tier Check
    if user.tier == "vip":
        return GateResult(
            action=GateAction.ESCALATE,
            reason="User is VIP tier. Manual handling required.",
        )

    # 2. Sev 1 / Sev 2 Check
    if ticket.severity in ["P1", "P2"]:
        return GateResult(
            action=GateAction.ESCALATE,
            reason=_severity_gate_reason(ticket.severity, ticket.description),
        )

    # System-specific checks
    if system:
        # 3. Active Incident Check
        if system.active_incident:
            return GateResult(
                action=GateAction.BATCH_ESCALATE,
                reason=f"System '{system.name}' has an active incident. Batching for major incident management.",
            )

        # 4. Change Freeze Check
        if system.change_freeze:
            return GateResult(
                action=GateAction.ESCALATE,
                reason=f"System '{system.name}' is currently under a change freeze.",
            )

    # Passed all hard policies
    return GateResult(action=GateAction.PROCEED)
