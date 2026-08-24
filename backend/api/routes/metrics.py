import logging
from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta, timezone

from services.supabase import get_supabase

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/metrics", tags=["metrics"])


@router.get("/dashboard")
async def get_dashboard_metrics():
    """
    Returns auto-resolved count, escalated count, and sandbox-failed count
    for the last 100 tickets.
    """
    from api.main import app_state

    supabase = get_supabase()
    try:
        # Fetch last 100 live pipeline outcomes only (signal_a IS NOT NULL).
        # Seed data rows have signal_a=NULL and must NOT be counted.
        res = (
            supabase.table("ticket_outcomes")
            .select(
                "auto_resolved, sandbox_passed, escalation_reason, override_reason, category, signal_a, created_at"
            )
            .gte("signal_a", 0)
            .order("created_at", desc=True)
            .limit(100)
            .execute()
        )
        outcomes = res.data

        auto_resolved = sum(1 for o in outcomes if o.get("auto_resolved"))
        escalated = sum(1 for o in outcomes if not o.get("auto_resolved"))
        sandbox_failed = sum(1 for o in outcomes if o.get("sandbox_passed") is False)

        system_performance = {
            "total_tickets": len(outcomes),
            "auto_resolved_count": auto_resolved,
            "escalated_count": escalated,
            "sandbox_failures": sandbox_failed,
        }

        # override_analysis
        override_analysis = {
            "missing_context": sum(
                1 for o in outcomes if o.get("override_reason") == "missing_context"
            ),
            "incorrect_suggestion": sum(
                1
                for o in outcomes
                if o.get("override_reason") == "incorrect_suggestion"
            ),
            "vip_policy": sum(
                1 for o in outcomes if o.get("override_reason") == "vip_policy"
            ),
            "novel_issue": sum(
                1 for o in outcomes if o.get("override_reason") == "novel_issue"
            ),
        }

        # knowledge_base_coverage
        import services.qdrant as qdrant_svc

        try:
            vector_count = (
                await qdrant_svc.count_vectors()
                if app_state.get("qdrant_client")
                else 0
            )
        except Exception as qdrant_err:
            logger.warning(
                f"Qdrant unavailable, returning default metrics: {qdrant_err}"
            )
            vector_count = 0
        categories = list(set(o["category"] for o in outcomes if o.get("category")))
        signal_a_rows = [o for o in outcomes if o.get("signal_a") is not None]
        avg_signal_a = (
            (sum(o.get("signal_a", 0) for o in signal_a_rows) / len(signal_a_rows))
            if signal_a_rows
            else 0.0
        )

        if vector_count >= 300:
            coverage = "High"
        elif vector_count >= 100:
            coverage = "Moderate"
        else:
            coverage = "Low"

        # drift_monitor
        drift_monitor = {}
        for cat in categories[:5]:
            drift_monitor[cat] = {
                "signal_trend": 0.85,
                "baseline": 0.88,
                "trend_direction": "down",
                "status": "warning",
            }

        return {
            "system_performance": system_performance,
            "override_analysis": override_analysis,
            "knowledge_base_coverage": {
                "total_vectors": vector_count,
                "categories_covered": len(categories),
                "avg_similarity": round(avg_signal_a, 4),
                "coverage_level": coverage,
            },
            "drift_monitor": drift_monitor,
        }
    except Exception as e:
        logger.error(f"Dashboard metrics failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/coverage")
async def get_coverage_metrics():
    """
    Returns vector count, categories covered, avg signal_a, and coverage level.
    """
    from api.main import app_state

    supabase = get_supabase()
    qdrant_client = app_state["qdrant_client"]
    try:
        import services.qdrant as qdrant_svc

        try:
            vector_count = await qdrant_svc.count_vectors()
        except Exception as qdrant_err:
            logger.warning(f"Qdrant unavailable: {qdrant_err}")
            vector_count = 0

        # Unique categories from recent outcomes
        res = (
            supabase.table("ticket_outcomes")
            .select("category, signal_a")
            .order("created_at", desc=True)
            .limit(50)
            .execute()
        )
        outcomes = res.data
        categories = list(set(o["category"] for o in outcomes if o.get("category")))
        avg_signal_a = (
            (sum(o.get("signal_a", 0) for o in outcomes) / len(outcomes))
            if outcomes
            else 0.0
        )

        if vector_count >= 300:
            coverage = "High"
        elif vector_count >= 100:
            coverage = "Moderate"
        else:
            coverage = "Low"

        return {
            "vector_count": vector_count,
            "categories_covered": categories,
            "avg_similarity_signal": round(avg_signal_a, 4),
            "coverage_level": coverage,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/drift")
async def get_drift_metrics():
    """
    For each category, compares accuracy over last 7 days vs the 7 days before.
    Flags categories with drift > 10%.
    """
    supabase = get_supabase()
    try:
        now = datetime.now(timezone.utc)
        last_7 = (now - timedelta(days=7)).isoformat()
        prev_7 = (now - timedelta(days=14)).isoformat()

        # Last 7 days
        recent = (
            supabase.table("ticket_outcomes")
            .select("category, auto_resolved")
            .gte("created_at", last_7)
            .execute()
            .data
        )
        # Previous 7 days
        older = (
            supabase.table("ticket_outcomes")
            .select("category, auto_resolved")
            .gte("created_at", prev_7)
            .lt("created_at", last_7)
            .execute()
            .data
        )

        def accuracy(records):
            if not records:
                return {}
            by_cat = {}
            for r in records:
                cat = r.get("category", "Unknown")
                if cat not in by_cat:
                    by_cat[cat] = {"total": 0, "resolved": 0}
                by_cat[cat]["total"] += 1
                if r.get("auto_resolved"):
                    by_cat[cat]["resolved"] += 1
            return {
                k: v["resolved"] / v["total"]
                for k, v in by_cat.items()
                if v["total"] > 0
            }

        recent_acc = accuracy(recent)
        older_acc = accuracy(older)

        drift_results = []
        all_cats = set(recent_acc.keys()) | set(older_acc.keys())
        for cat in all_cats:
            r = recent_acc.get(cat, 0.0)
            o = older_acc.get(cat, 0.0)
            drift = r - o
            drift_results.append(
                {
                    "category": cat,
                    "recent_7d_accuracy": round(r, 4),
                    "prev_7d_accuracy": round(o, 4),
                    "drift": round(drift, 4),
                    "status": "⚠️ Drifting" if abs(drift) > 0.10 else "✅ Stable",
                }
            )

        drift_results.sort(key=lambda x: x["drift"])
        return drift_results

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
