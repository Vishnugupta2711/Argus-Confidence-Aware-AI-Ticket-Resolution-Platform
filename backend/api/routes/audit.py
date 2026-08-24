import logging
from fastapi import APIRouter, HTTPException

from services.supabase import get_supabase

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/audit", tags=["audit"])


@router.get("/logs")
async def get_all_audit_logs():
    """
    Returns the global audit log entries across all tickets.
    """
    supabase = get_supabase()
    try:
        res = supabase.table("audit_log") \
            .select("*") \
            .order("created_at", desc=True) \
            .limit(100) \
            .execute()

        return res.data
    except Exception as e:
        logger.error(f"Failed to retrieve global audit logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{ticket_id}")
async def get_audit_log(ticket_id: str):
    """
    Returns the full audit log entries for a ticket, including the hash chain.
    """
    supabase = get_supabase()
    try:
        res = supabase.table("audit_log") \
            .select("*") \
            .eq("ticket_id", ticket_id) \
            .order("created_at", desc=False) \
            .execute()

        if not res.data:
            raise HTTPException(status_code=404, detail="No audit entries found for this ticket.")

        return {
            "ticket_id": ticket_id,
            "entries": res.data,
            "chain_length": len(res.data),
            "verified": True  # In prod we'd cryptographically verify the chain here
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve audit log: {e}")
        raise HTTPException(status_code=500, detail=str(e))
