from typing import List, Dict, Any
from collections import Counter
from models.confidence import (
    GateResult,
    GateAction,
    SignalResult,
    ConfidenceReport,
    SignalStatus,
    ConfidenceDecision,
)


def compute_confidence(
    qdrant_results: List[Any],
    category: str,
    supabase_client,
    cluster_map: Dict[str, str],
) -> ConfidenceReport:
    """
    Layer 3: Confidence Engine.
    Evaluates three distinct signals to determine if an AI resolution is safe.
    qdrant_results: list of Qdrant ScoredPoint objects.
    supabase_client: initialized supabase_client or a mocked object with necessary methods.
    cluster_map: dictionary mapping resolution texts to cluster IDs.
    """
    from utils.cluster_map import get_resolution_cluster

    thresholds = supabase_client.get_category_thresholds(category)
    if not thresholds:
        thresholds = {
            "threshold_a": 0.75,
            "threshold_b": 0.60,
            "threshold_c": 0.70,
            "min_sample_size": 30,
        }

    # --- Signal A: Target Relevance (Max Similarity) ---
    score_a = qdrant_results[0].score if qdrant_results else 0.0
    passed_a = score_a >= thresholds["threshold_a"]
    signal_a = SignalResult(
        name="Signal A: Semantic Relevance",
        score=score_a,
        threshold=thresholds["threshold_a"],
        result=SignalStatus.PASS if passed_a else SignalStatus.FAIL,
    )

    total_results = len(qdrant_results)

    # Inspect retrieved results for auto_resolved flags
    retrieved_auto_resolved = None
    flags = []
    if total_results > 0:
        flags = [
            r.payload.get("auto_resolved", None)
            for r in qdrant_results
            if hasattr(r, "payload") and r.payload
        ]
        if all(f is False for f in flags):
            retrieved_auto_resolved = False
        elif all(f is True for f in flags):
            retrieved_auto_resolved = True

    top_result_verified = (
        qdrant_results[0].payload.get("verified", False)
        if qdrant_results
        and hasattr(qdrant_results[0], "payload")
        and qdrant_results[0].payload
        else False
    )

    high_similarity_verified = score_a >= 0.95 and top_result_verified

    # --- Signal B: Cohort Consensus ---
    if total_results > 0:
        clusters = []
        for res in qdrant_results:
            res_text = (
                res.payload.get("resolution", "")
                if hasattr(res, "payload") and res.payload
                else ""
            )
            cluster = get_resolution_cluster(res_text, cluster_map)
            clusters.append(cluster)
        counter = Counter(clusters)
        _, count = counter.most_common(1)[0]
        score_b = count / total_results
    else:
        score_b = 0.0

    passed_b = score_b >= thresholds["threshold_b"]
    signal_b = SignalResult(
        name="Signal B: Cohort Consensus",
        score=score_b,
        threshold=thresholds["threshold_b"],
        result=SignalStatus.PASS if passed_b else SignalStatus.FAIL,
    )

    # --- Signal C: Historical Success ---
    # Priority: ALL retrieved=false → FAIL | ALL retrieved=true → PASS | mixed/no-data → result-level rate → historical category data
    if retrieved_auto_resolved is False:
        score_c = 0.0
        passed_c = False
        signal_c = SignalResult(
            name="Signal C: Historical Success",
            score=0.0,
            threshold=thresholds["threshold_c"],
            result=SignalStatus.FAIL,
            note="All retrieved matches were historically escalated.",
        )
    elif retrieved_auto_resolved is True:
        score_c = 1.0
        passed_c = True
        signal_c = SignalResult(
            name="Signal C: Historical Success",
            score=1.0,
            threshold=thresholds["threshold_c"],
            result=SignalStatus.PASS,
            note="All retrieved matches were historically auto-resolved.",
        )
    else:
        # Mixed or no data: try result-level rate first
        result_level_c = None
        if flags:
            true_count = sum(1 for f in flags if f is True)
            false_count = sum(1 for f in flags if f is False)
            if true_count + false_count >= 2:
                result_level_c = true_count / (true_count + false_count)

        if result_level_c is not None:
            score_c = result_level_c
            passed_c = score_c >= thresholds["threshold_c"]
            signal_c = SignalResult(
                name="Signal C: Historical Success",
                score=score_c,
                threshold=thresholds["threshold_c"],
                result=SignalStatus.PASS if passed_c else SignalStatus.FAIL,
                note=f"Result-level auto-resolve rate: {score_c:.2f}.",
            )
        else:
            # Fall back to historical category data
            history = supabase_client.get_ticket_history(category, days=30)
            total_historical = len(history) if history else 0

            if total_historical == 0:
                score_c = 0.80
                passed_c = True
                signal_c = SignalResult(
                    name="Signal C: Historical Success",
                    score=score_c,
                    threshold=thresholds["threshold_c"],
                    result=SignalStatus.PASS,
                )
            elif total_historical < thresholds["min_sample_size"]:
                auto_resolved_count = sum(
                    1 for h in history if h.get("auto_resolved") == True
                )
                score_c = (
                    auto_resolved_count / total_historical
                    if total_historical > 0
                    else 0.0
                )
                passed_c = score_c >= thresholds["threshold_c"]
                signal_c = SignalResult(
                    name="Signal C: Historical Success",
                    score=score_c,
                    threshold=thresholds["threshold_c"],
                    result=SignalStatus.PASS if passed_c else SignalStatus.FAIL,
                )
            else:
                auto_resolved_count = sum(
                    1 for h in history if h.get("auto_resolved") == True
                )
                score_c = auto_resolved_count / total_historical
                passed_c = score_c >= thresholds["threshold_c"]
                signal_c = SignalResult(
                    name="Signal C: Historical Success",
                    score=score_c,
                    threshold=thresholds["threshold_c"],
                    result=SignalStatus.PASS if passed_c else SignalStatus.FAIL,
                )

    # --- Apply agent-verified override to Signal B only (NOT Signal C) ---
    # Signal B: cohort consensus — high similarity + verified match = trust the cluster consensus
    # Signal C: historical success — always stays accountable to the veto gate
    if high_similarity_verified:
        signal_b = SignalResult(
            name="Signal B: Cohort Consensus",
            score=1.0,
            threshold=thresholds["threshold_b"],
            result=SignalStatus.PASS,
        )

    # --- Veto Gate ---
    signals = {"A": signal_a, "B": signal_b, "C": signal_c}
    failed = {k: v for k, v in signals.items() if v.result == SignalStatus.FAIL}

    is_confident = len(failed) == 0
    decision = (
        ConfidenceDecision.CANARY if is_confident else ConfidenceDecision.ESCALATE
    )

    if failed:
        reason = "Veto gate triggered by a failing signal."
    elif high_similarity_verified:
        reason = "All signals passed. Signal B boosted by agent-verified high-similarity match (Signal A >= 0.95)."
    else:
        reason = "All signals passed."

    return ConfidenceReport(
        decision=decision, signals=signals, failed=failed, reason=reason
    )
