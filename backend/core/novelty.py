from typing import List
from models.confidence import GateResult, GateAction

# Mock type for Qdrant's ScoredPoint so this module is easily testable
# without strictly requiring the qdrant_client in tests if we mock the items.
# We will assume each item in qdrant_results has a `.score` attribute.

def check_novelty(qdrant_results: List, threshold: float = 0.50) -> GateResult:
    """
    Layer 2: Novelty Detection.
    Computes the maximum similarity score from the retrieved Qdrant results.
    If the max score is below the threshold, the issue is considered novel (too unique)
    and routed for human review (ESCALATE).
    """
    if not qdrant_results:
        return GateResult(
            action=GateAction.ESCALATE,
            reason="No similar past tickets found (novel issue)."
        )

    # ScoredPoint objects from qdrant_client have a 'score' attribute.
    # In Cosine distance, scores range from -1.0 to 1.0 (with 1.0 being identical).
    max_score = max(result.score for result in qdrant_results)
    
    if max_score < threshold:
        return GateResult(
            action=GateAction.ESCALATE,
            reason=f"Max similarity score ({max_score:.2f}) is below novelty threshold ({threshold}). Novel issue."
        )

    # Ticket is not novel, proceed to confidence engine
    return GateResult(action=GateAction.PROCEED)
