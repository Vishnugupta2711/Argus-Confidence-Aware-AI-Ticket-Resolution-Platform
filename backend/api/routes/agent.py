import logging
import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from services.supabase import get_supabase
from services.jina import generate_embedding
from services.llm import generate_resolution_message
from utils.audit_hash import log_to_audit

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/tickets", tags=["agent"])


# Retry configuration for handling Supabase connection drops
async def _retry_operation(operation, max_retries=3, base_delay=0.5):
    """Retry an operation with exponential backoff"""
    for attempt in range(max_retries):
        try:
            return operation()
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            delay = base_delay * (2**attempt)
            await asyncio.sleep(delay)


@router.get("/agent/escalated")
async def get_escalated_tickets():
    """
    Returns all escalated tickets, joined with evidence cards from audit_log,
    sorted by severity then creation time.

    Uses batched queries to avoid N+1 problem and connection exhaustion.
    """
    supabase = get_supabase()
    try:
        # Query 1: Get all escalated tickets
        tickets_res = (
            supabase.table("tickets")
            .select("*")
            .in_("status", ["escalated"])
            .order("created_at", desc=False)
            .execute()
        )
        tickets = tickets_res.data

        if not tickets:
            return []

        ticket_ids = [t["id"] for t in tickets]

        # Query 2: Get latest audit_log entries for all tickets (batched)
        audit_logs = {}
        if ticket_ids:
            try:
                audit_res = (
                    supabase.table("audit_log")
                    .select(
                        "ticket_id, evidence_card, audit_hash, latency_ms, created_at"
                    )
                    .in_("ticket_id", ticket_ids)
                    .order("created_at", desc=True)
                    .execute()
                )
                # Group by ticket_id and keep only latest (first one after desc order)
                for record in audit_res.data:
                    if record["ticket_id"] not in audit_logs:
                        audit_logs[record["ticket_id"]] = record
            except Exception as e:
                logger.warning(f"Failed to fetch audit logs: {e}")
                audit_logs = {}

        # Query 3: Get outcomes for all tickets (batched)
        outcomes = {}
        if ticket_ids:
            try:
                outcome_res = (
                    supabase.table("ticket_outcomes")
                    .select(
                        "ticket_id, signal_a, signal_b, signal_c, escalation_reason"
                    )
                    .in_("ticket_id", ticket_ids)
                    .execute()
                )
                for record in outcome_res.data:
                    outcomes[record["ticket_id"]] = record
            except Exception as e:
                logger.warning(f"Failed to fetch outcomes: {e}")
                outcomes = {}

        # Join in memory - no more DB queries
        enriched = []
        for t in tickets:
            ticket_id = t["id"]
            audit_entry = audit_logs.get(ticket_id)
            outcome = outcomes.get(ticket_id)

            enriched.append(
                {
                    **t,
                    "ticket_id": ticket_id,
                    "evidence_card": audit_entry.get("evidence_card")
                    if audit_entry
                    else None,
                    "decision_latency_ms": audit_entry.get("latency_ms")
                    if audit_entry
                    else None,
                    "escalation_reason": outcome.get("escalation_reason")
                    if outcome
                    else None,
                }
            )

        # Sort by urgency then created_at (oldest first)
        enriched.sort(
            key=lambda x: (0 if x.get("is_urgent") else 1, x.get("created_at", ""))
        )

        return enriched

    except Exception as e:
        logger.error(f"Failed to get escalated tickets: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{ticket_id}/evidence")
async def get_ticket_evidence(ticket_id: str):
    """
    Returns the full evidence card for a single ticket by its UUID.
    Used by EvidenceCardView to load a specific ticket without fetching the whole queue.
    """
    supabase = get_supabase()
    try:
        ticket_res = supabase.table("tickets").select("*").eq("id", ticket_id).execute()
        if not ticket_res.data:
            raise HTTPException(status_code=404, detail="Ticket not found.")
        t = ticket_res.data[0]

        # Try to get the latest audit/evidence entry
        audit_res = (
            supabase.table("audit_log")
            .select("evidence_card, audit_hash, latency_ms, created_at")
            .eq("ticket_id", ticket_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )

        evidence_card = audit_res.data[0]["evidence_card"] if audit_res.data else None
        latency_ms = audit_res.data[0]["latency_ms"] if audit_res.data else None
        audit_log = audit_res.data[0] if audit_res.data else None

        # Fetch outcome data for signals and escalation context
        outcome_res = (
            supabase.table("ticket_outcomes")
            .select("*")
            .eq("ticket_id", ticket_id)
            .execute()
        )
        outcome = outcome_res.data[0] if outcome_res.data else None

        # Fetch thresholds for this ticket category
        thresholds = None
        if t.get("category"):
            th_res = (
                supabase.table("category_thresholds")
                .select("threshold_a, threshold_b, threshold_c, min_sample_size")
                .eq("category", t.get("category"))
                .limit(1)
                .execute()
            )
            thresholds = th_res.data[0] if th_res.data else None

        candidate_fixes = []
        if isinstance(evidence_card, dict):
            candidate_fixes = evidence_card.get("candidate_fixes") or []

        decision_latency = None
        if isinstance(evidence_card, dict):
            raw_latency = evidence_card.get("decision_latency")
            if isinstance(raw_latency, (int, float)):
                decision_latency = float(raw_latency)
            elif isinstance(raw_latency, dict):
                total_ms = raw_latency.get("total_ms")
                if isinstance(total_ms, (int, float)):
                    decision_latency = float(total_ms)
        if decision_latency is None and latency_ms is not None:
            decision_latency = float(latency_ms)

        escalation_reason = None
        if outcome and outcome.get("escalation_reason"):
            escalation_reason = outcome.get("escalation_reason")
        elif isinstance(evidence_card, dict):
            escalation_reason = evidence_card.get("escalation_reason")

        # Approximate layer for UI trace when explicit layer is unavailable
        # Check layers in upstream-to-downstream order (Policy Gate is layer 1, first check)
        layer_intercepted = None
        if isinstance(evidence_card, dict):
            layer_intercepted = evidence_card.get("layer_intercepted")
        if layer_intercepted is None and t.get("status") == "escalated":
            reason_text = (escalation_reason or "").lower()
            sig_a = outcome.get("signal_a") if outcome else None
            sig_b = outcome.get("signal_b") if outcome else None
            sig_c = outcome.get("signal_c") if outcome else None
            th_a = thresholds.get("threshold_a") if thresholds else None
            th_b = thresholds.get("threshold_b") if thresholds else None
            th_c = thresholds.get("threshold_c") if thresholds else None

            # Layer 1: Policy Gate (VIP, P1/P2 severity, policy keywords) — CHECK FIRST
            if (
                "vip" in reason_text
                or "p1" in reason_text
                or "p2" in reason_text
                or "freeze" in reason_text
                or "policy" in reason_text
            ):
                layer_intercepted = 1
            # Layer 2: Novel issue detection
            elif "novel" in reason_text:
                layer_intercepted = 2
            # Layer 3: Signal A (Semantic Similarity)
            elif sig_a is not None and th_a is not None and sig_a < th_a:
                layer_intercepted = 3
            # Layer 4: Signal B (Resolution Consistency)
            elif sig_b is not None and th_b is not None and sig_b < th_b:
                layer_intercepted = 4
            # Layer 5: Signal C (Category Accuracy)
            elif sig_c is not None and th_c is not None and sig_c < th_c:
                layer_intercepted = 5
            # Layer 6: Sandbox Execution — CHECK LAST
            elif outcome and outcome.get("sandbox_passed") is False:
                layer_intercepted = 6

        return {
            **t,
            "ticket_id": t["id"],
            "evidence_card": evidence_card,
            "decision_latency_ms": latency_ms,
            "outcome": outcome,
            "audit_log": audit_log,
            "candidate_fixes": candidate_fixes,
            "resolution_applied": (outcome.get("resolution") if outcome else None)
            or (
                evidence_card.get("resolution_applied")
                if isinstance(evidence_card, dict)
                else None
            ),
            "sandbox_passed": outcome.get("sandbox_passed") if outcome else None,
            "escalation_reason": escalation_reason,
            "signal_a": outcome.get("signal_a") if outcome else None,
            "signal_b": outcome.get("signal_b") if outcome else None,
            "signal_c": outcome.get("signal_c") if outcome else None,
            "threshold_a": thresholds.get("threshold_a") if thresholds else None,
            "threshold_b": thresholds.get("threshold_b") if thresholds else None,
            "threshold_c": thresholds.get("threshold_c") if thresholds else None,
            "max_similarity": outcome.get("signal_a") if outcome else None,
            "layer_intercepted": layer_intercepted,
            "total_latency_ms": decision_latency,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch evidence card for {ticket_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class AgentResolution(BaseModel):
    resolution_text: str
    resolution_type: str  # "verified", "workaround", or "uncertain"
    override_reason: Optional[str] = None
    accept_suggestion: bool = False

    model_config = {"extra": "ignore"}


@router.post("/{ticket_id}/resolve")
async def resolve_ticket(ticket_id: str, resolution: AgentResolution):
    """
    Agent submits a resolution for an escalated ticket.
    If verified: embeds resolution into Qdrant with the correct cluster ID,
    inserts outcome, updates ticket status.
    """
    from api.main import app_state

    supabase = get_supabase()

    try:
        # Fetch original ticket
        ticket_res = supabase.table("tickets").select("*").eq("id", ticket_id).execute()
        if not ticket_res.data:
            raise HTTPException(status_code=404, detail="Ticket not found.")
        ticket = ticket_res.data[0]

        # Refine message via LLM
        try:
            resolution_msg = await generate_resolution_message(
                resolution.resolution_text, ticket.get("description", "")
            )
        except Exception:
            resolution_msg = resolution.resolution_text  # fallback

        # Check AI Suggestion for retrospective match
        outcome_res = (
            supabase.table("ticket_outcomes")
            .select("ai_suggestion")
            .eq("ticket_id", ticket_id)
            .execute()
        )
        ai_suggestion = (
            outcome_res.data[0].get("ai_suggestion") if outcome_res.data else None
        )

        retrospective_match = False
        auto_resolved_retro = False
        if resolution.accept_suggestion:
            retrospective_match = True
            auto_resolved_retro = True
        elif ai_suggestion:
            from difflib import SequenceMatcher

            similarity = SequenceMatcher(
                None, ai_suggestion.lower(), resolution.resolution_text.lower()
            ).ratio()
            if similarity > 0.80:
                retrospective_match = True
                auto_resolved_retro = True

        # Upsert ticket outcome (insert if missing, update if exists)
        outcome_payload = {
            "ticket_id": ticket_id,
            "resolution": resolution.resolution_text,
            "agent_verified": resolution.resolution_type == "verified",
            "override_reason": resolution.override_reason,
            "retrospective_match": retrospective_match,
            "auto_resolved": auto_resolved_retro if retrospective_match else False,
        }
        existing_outcome = (
            supabase.table("ticket_outcomes")
            .select("id")
            .eq("ticket_id", ticket_id)
            .execute()
        )
        if existing_outcome.data:
            supabase.table("ticket_outcomes").update(outcome_payload).eq(
                "ticket_id", ticket_id
            ).execute()
        else:
            supabase.table("ticket_outcomes").insert(outcome_payload).execute()

        # If verified, embed and upsert into Qdrant with the correct cluster
        if resolution.resolution_type == "verified":
            try:
                import services.qdrant as qdrant_svc
                from utils.cluster_map import get_resolution_cluster

                cluster_map = app_state.get("cluster_map", {})

                # Embed the ticket description (not the resolution — we want similarity to future descriptions)
                vector = await generate_embedding(ticket.get("description", ""))

                # Determine cluster: first try exact lookup, then fall back to top similar result's cluster
                resolution_cluster = get_resolution_cluster(
                    resolution.resolution_text, cluster_map
                )
                if not resolution_cluster or resolution_cluster == "unknown_cluster":
                    similar = await qdrant_svc.search_similar(vector, top_k=1)
                    if similar and similar[0].payload:
                        resolution_cluster = similar[0].payload.get(
                            "resolution_cluster", "agent_verified"
                        )
                    else:
                        resolution_cluster = "agent_verified"

                await qdrant_svc.upsert_ticket(
                    ticket_id=ticket_id,
                    vector=vector,
                    payload={
                        "category": ticket.get("category"),
                        "description": ticket.get("description"),
                        "resolution": resolution.resolution_text,
                        "resolution_cluster": resolution_cluster,
                        "severity": ticket.get("severity"),
                        "auto_resolved": False,
                        "verified": True,
                    },
                )
                logger.info(
                    f"Upserted verified resolution into Qdrant with cluster '{resolution_cluster}'"
                )
            except Exception as e:
                logger.warning(f"Qdrant upsert failed for verified resolution: {e}")

        # Log to audit (non-blocking — audit failures should not break resolution)
        try:
            evidence = {
                "resolution": resolution.resolution_text,
                "type": resolution.resolution_type,
                "override_reason": resolution.override_reason,
            }
            log_to_audit(ticket_id, "AGENT_RESOLVED", evidence, supabase)
        except Exception as e:
            logger.warning(f"Audit log failed for ticket {ticket_id}: {e}")

        # Update ticket status
        try:
            from datetime import datetime, timezone

            supabase.table("tickets").update(
                {
                    "status": "resolved",
                    "resolved_at": datetime.now(timezone.utc).isoformat(),
                }
            ).eq("id", ticket_id).execute()
        except Exception as e:
            logger.error(f"Failed to update ticket {ticket_id} status: {e}")
            raise HTTPException(
                status_code=500, detail=f"Failed to update ticket status: {e}"
            )

        return {
            "ticket_id": ticket_id,
            "status": "resolved",
            "resolution_message": resolution_msg,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to resolve ticket {ticket_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{ticket_id}/verify")
async def verify_auto_resolution(ticket_id: str):
    """
    Mark an auto-resolved ticket as verified by an agent.
    """
    from services.jina import generate_embedding
    from services.qdrant import upsert_ticket as qdrant_upsert

    supabase = get_supabase()
    try:
        outcome_res = (
            supabase.table("ticket_outcomes")
            .select("*")
            .eq("ticket_id", ticket_id)
            .execute()
        )
        if not outcome_res.data:
            raise HTTPException(status_code=404, detail="Ticket outcome not found.")

        outcome = outcome_res.data[0]

        supabase.table("ticket_outcomes").update({"agent_verified": True}).eq(
            "ticket_id", ticket_id
        ).execute()

        # Push to Qdrant to improve future auto-resolutions
        ticket_res = supabase.table("tickets").select("*").eq("id", ticket_id).execute()
        if ticket_res.data:
            ticket = ticket_res.data[0]
            vector = await generate_embedding(ticket.get("description", ""))
            await qdrant_upsert(
                ticket_id=ticket_id,
                vector=vector,
                payload={
                    "resolution": outcome.get("resolution"),
                    "resolution_cluster": outcome.get("resolution_cluster") or "agent_verified",
                    "verified": True,
                    "category": ticket.get("category"),
                    "severity": ticket.get("severity")
                }
            )

        return {"ticket_id": ticket_id, "agent_verified": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to mark agent_verified for {ticket_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{ticket_id}/correction")
async def submit_correction(ticket_id: str, payload: dict):
    """
    Agent submits a corrected resolution for an auto-resolved ticket.
    Expects JSON: { corrected_resolution: str, resolution_type: 'verified'|'workaround' }
    """
    from services.jina import generate_embedding
    from services.qdrant import upsert_ticket as qdrant_upsert

    supabase = get_supabase()
    try:
        corrected = payload.get("corrected_resolution")
        resolution_type = payload.get("resolution_type", "workaround")
        if not corrected or not isinstance(corrected, str):
            raise HTTPException(
                status_code=400, detail="corrected_resolution is required"
            )

        # fetch existing outcome to preserve original AI resolution
        outcome_res = (
            supabase.table("ticket_outcomes")
            .select("*")
            .eq("ticket_id", ticket_id)
            .execute()
        )
        if not outcome_res.data:
            raise HTTPException(status_code=404, detail="Ticket outcome not found.")
        outcome = outcome_res.data[0]

        original_ai = outcome.get("resolution") or outcome.get("ai_suggestion")

        # update outcome: set ai_suggestion to the original AI resolution, write corrected resolution
        supabase.table("ticket_outcomes").update(
            {
                "ai_suggestion": original_ai,
                "resolution": corrected,
                "retrospective_match": False,
                "agent_verified": True,
                "auto_resolved": False,
                "override_reason": "Agent corrected the auto-resolution",
            }
        ).eq("ticket_id", ticket_id).execute()

        # Sync tickets table: status
        from datetime import datetime, timezone

        supabase.table("tickets").update(
            {
                "status": "resolved",
                "resolved_at": datetime.now(timezone.utc).isoformat(),
            }
        ).eq("id", ticket_id).execute()

        # If agent marked as verified reusable, upsert into Qdrant so AI learns the corrected fix
        if resolution_type == "verified":
            try:
                # embed ticket description (prefer description from tickets table)
                ticket_res = (
                    supabase.table("tickets")
                    .select("description, category, severity")
                    .eq("id", ticket_id)
                    .execute()
                )
                ticket = ticket_res.data[0] if ticket_res.data else {"description": ""}
                vector = await generate_embedding(ticket.get("description", ""))
                payload = {
                    "category": ticket.get("category"),
                    "description": ticket.get("description"),
                    "resolution": corrected,
                    "resolution_cluster": outcome.get("resolution_cluster")
                    or "agent_verified",
                    "severity": ticket.get("severity"),
                    "auto_resolved": False,
                    "verified": True,
                }
                await qdrant_upsert(ticket_id=ticket_id, vector=vector, payload=payload)
            except Exception as e:
                logger.warning(f"Qdrant upsert during correction failed: {e}")

        # Log to audit for traceability
        log_to_audit(
            ticket_id,
            "AGENT_CORRECTION",
            {"corrected_resolution": corrected, "resolution_type": resolution_type},
            supabase,
        )

        return {"ticket_id": ticket_id, "status": "correction_recorded"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to submit correction for {ticket_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agent/all")
async def get_all_tickets():
    """
    Returns history of all tickets allowing admins to see what Argus resolved vs escalated.
    Includes audit_log data for verification status display.
    Uses batched queries to avoid N+1 problem.
    """
    supabase = get_supabase()
    try:
        tickets_res = (
            supabase.table("tickets")
            .select(
                "id, user_id, description, category, severity, status, created_at, resolved_at, users(email)"
            )
            .order("created_at", desc=True)
            .limit(250)
            .execute()
        )

        tickets = tickets_res.data
        if not tickets:
            return []

        ticket_ids = [t["id"] for t in tickets]

        # Batch fetch audit_log for all tickets (not in a loop)
        audit_logs = {}
        if ticket_ids:
            try:
                audit_res = (
                    supabase.table("audit_log")
                    .select("ticket_id, audit_hash, created_at")
                    .in_("ticket_id", ticket_ids)
                    .order("created_at", desc=True)
                    .execute()
                )
                # Group by ticket_id and keep only latest
                for record in audit_res.data:
                    if record["ticket_id"] not in audit_logs:
                        audit_logs[record["ticket_id"]] = record
            except Exception as e:
                logger.warning(f"Failed to fetch audit logs: {e}")
                audit_logs = {}

        # Join in memory
        enriched = []
        for t in tickets:
            audit_log = audit_logs.get(t["id"])
            enriched.append({**t, "audit_log": audit_log})

        return enriched
    except Exception as e:
        logger.error(f"Failed to fetch all tickets: {e}")
        raise HTTPException(status_code=500, detail=str(e))
