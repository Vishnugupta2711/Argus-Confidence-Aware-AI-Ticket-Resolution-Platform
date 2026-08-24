import logging
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from typing import Optional

from models.ticket import TicketSubmission, TicketResponse
from services.supabase import get_supabase
from services.storage import upload_attachment

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/tickets", tags=["tickets"])


@router.post("/submit", response_model=TicketResponse)
async def submit_ticket(
    description: str = Form(...),
    user_email: str = Form(...),
    category: Optional[str] = Form(""),
    severity: Optional[str] = Form("P3"),
    urgent: Optional[bool] = Form(False),
    is_urgent: Optional[bool] = Form(None),
    system_id: Optional[str] = Form(None),
    attachment: Optional[UploadFile] = File(None),
):
    """
    Submit a new support ticket. Runs the full Argus pipeline.
    """
    from api.main import app_state  # lazy import to access lifespan state
    from core.pipeline import process_ticket

    attachment_url = None
    if attachment and attachment.filename:
        try:
            file_bytes = await attachment.read()
            attachment_url = await upload_attachment(
                file_name=attachment.filename,
                file_bytes=file_bytes,
                mime_type=attachment.content_type,
            )
        except Exception as e:
            logger.warning(
                f"Attachment upload failed: {e}. Proceeding without attachment."
            )

    supabase = get_supabase()
    category_clean = (category or "").strip()
    urgent_flag = bool(is_urgent) if is_urgent is not None else bool(urgent)

    # Get system_name from system_id if provided
    system_name = None
    if system_id:
        try:
            system_res = (
                supabase.table("systems").select("name").eq("id", system_id).execute()
            )
            if system_res.data:
                system_name = system_res.data[0]["name"]
        except Exception as e:
            logger.warning(
                f"Failed to fetch system name for system_id '{system_id}': {e}"
            )

    ticket = {
        "description": description,
        "category": category_clean if category_clean else None,
        "severity": severity,
        "user_email": user_email,
        "system_name": system_name,
        "attachment_url": attachment_url,
    }

    # Insert the raw ticket first (status: processing)
    try:
        user_data = (
            supabase.table("users").select("id").eq("email", user_email).execute()
        )
        user_id = user_data.data[0]["id"] if user_data.data else None
        if not user_id:
            raise HTTPException(
                status_code=404,
                detail=f"User with email '{user_email}' not found. Please register first.",
            )

        ticket_row = {
            "user_id": user_id,
            "description": description,
            # DB column is NOT NULL. Keep a placeholder until pipeline auto-detects and overwrites it.
            "category": ticket["category"] or "Unclassified",
            "severity": severity,
            "is_urgent": urgent_flag,
            "status": "processing",
            "attachment_url": attachment_url,
        }
        insert_res = supabase.table("tickets").insert(ticket_row).execute()
        ticket["id"] = insert_res.data[0]["id"]
        ticket["created_at"] = insert_res.data[0]["created_at"]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to insert ticket: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create ticket: {e}")

    # Run the full pipeline
    try:
        result = await process_ticket(
            ticket, supabase, app_state["qdrant_client"], app_state["cluster_map"]
        )
    except Exception as e:
        logger.error(f"Pipeline execution failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Pipeline error: {e}")

    return TicketResponse(
        ticket_id=ticket["id"],
        status=result["status"],
        resolution_message=result.get("resolution_message"),
        resolution=result.get("resolution"),
        decision_latency_ms=result.get("latency_ms"),
    )


@router.get("/{ticket_id}")
async def get_ticket_status(ticket_id: str):
    """
    Get the current status, resolution, and latency for a ticket.
    """
    supabase = get_supabase()
    try:
        ticket_res = supabase.table("tickets").select("*").eq("id", ticket_id).execute()
        if not ticket_res.data:
            raise HTTPException(status_code=404, detail="Ticket not found.")

        ticket = ticket_res.data[0]

        outcome_res = (
            supabase.table("ticket_outcomes")
            .select("resolution, signal_a, signal_b, signal_c")
            .eq("ticket_id", ticket_id)
            .execute()
        )
        outcome = outcome_res.data[0] if outcome_res.data else None

        audit_res = (
            supabase.table("audit_log")
            .select("latency_ms, evidence_card")
            .eq("ticket_id", ticket_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        audit = audit_res.data[0] if audit_res.data else None
        latency = audit["latency_ms"] if audit else None

        return {
            "id": ticket_id,
            "ticket_id": ticket_id,
            "description": ticket.get("description", ""),
            "status": ticket["status"],
            "category": ticket["category"],
            "severity": ticket["severity"],
            "created_at": ticket["created_at"],
            "resolved_at": ticket.get("resolved_at"),
            "resolution": outcome["resolution"] if outcome else None,
            "decision_latency_ms": latency,
            "evidence_card": audit["evidence_card"] if audit else None,
            "latency_ms": latency,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{ticket_id}/escalate_user")
async def escalate_ticket_by_user(ticket_id: str):
    """
    Called by an employee to escalate an auto-resolved ticket they are unsatisfied with.
    """
    from utils.audit_hash import log_to_audit
    supabase = get_supabase()
    try:
        # Check if the ticket exists
        ticket_res = supabase.table("tickets").select("*").eq("id", ticket_id).execute()
        if not ticket_res.data:
            raise HTTPException(status_code=404, detail="Ticket not found.")
        
        ticket = ticket_res.data[0]
        if ticket["status"] != "auto_resolved":
            raise HTTPException(status_code=400, detail="Only auto-resolved tickets can be manually escalated.")

        # Update tickets table
        supabase.table("tickets").update({"status": "escalated"}).eq("id", ticket_id).execute()

        # Update ticket_outcomes table
        reason = "User stated the auto-resolution did not resolve the issue"
        supabase.table("ticket_outcomes").update({
            "auto_resolved": False,
            "agent_verified": None,
            "escalation_reason": reason
        }).eq("ticket_id", ticket_id).execute()

        # Get existing evidence card if available to log it again
        audit_res = (
            supabase.table("audit_log")
            .select("evidence_card")
            .eq("ticket_id", ticket_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        evidence_card = audit_res.data[0]["evidence_card"] if audit_res.data else {}
        if isinstance(evidence_card, dict):
            evidence_card["decision"] = "ESCALATED_BY_USER"
            evidence_card["escalation_reason"] = reason

        # Log to audit 
        log_to_audit(
            ticket_id=ticket_id,
            decision="ESCALATED_BY_USER",
            evidence_card=evidence_card,
            supabase_client=supabase
        )

        return {"ticket_id": ticket_id, "status": "escalated", "message": "Ticket escalated to human agent."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to manually escalate ticket {ticket_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
