import logging
from datetime import datetime, timezone
from typing import Dict, Any
from enum import Enum

from core.policy_gate import hard_policy_gate, auto_detect_severity
from core.embedder import embed_ticket
from core.retriever import retrieve_similar
from core.novelty import check_novelty
from core.confidence import compute_confidence
from core.resolution_mapper import map_resolution_to_action
from core.sandbox_client import test_in_sandbox
from utils.timestamps import start_timer, stop_timer
from utils.audit_hash import log_to_audit
from services.llm import (
    generate_evidence_card,
    generate_resolution_message,
    generate_text,
)

from models.confidence import GateAction, ConfidenceDecision
from models.user import User, System
from models.ticket import TicketSubmission

logger = logging.getLogger(__name__)


def _json_safe(value: Any) -> Any:
    """Recursively normalize values to JSON-serializable primitives."""
    if hasattr(value, "model_dump"):
        return _json_safe(value.model_dump())
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, dict):
        return {str(k): _json_safe(v) for k, v in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_json_safe(v) for v in value]
    return value


def _format_ticket_ref(point_id: Any, payload: Dict[str, Any]) -> str:
    payload_ref = payload.get("ticket_id") if isinstance(payload, dict) else None
    if payload_ref:
        return str(payload_ref)

    if isinstance(point_id, int):
        return f"INC-{point_id:05d}"

    if isinstance(point_id, str):
        s = point_id.strip()
        if s.isdigit():
            return f"INC-{int(s):05d}"
        return s

    return "N/A"


def _top_candidate_fixes(qdrant_results: list, top_k: int = 3) -> list:
    items = []
    for item in qdrant_results[:top_k]:
        if isinstance(item, dict):
            score = item.get("score")
            point_id = item.get("point_id") or item.get("id")
            payload = item.get("payload", item)
        else:
            score = getattr(item, "score", None)
            point_id = getattr(item, "id", None)
            payload = getattr(item, "payload", {}) or {}

        resolution = payload.get("resolution")
        if not resolution:
            continue

        items.append(
            {
                "ticket_id": _format_ticket_ref(point_id, payload),
                "similarity_score": float(score)
                if isinstance(score, (int, float))
                else None,
                "similarity": float(score) if isinstance(score, (int, float)) else None,
                "resolution": resolution,
            }
        )

    return items


async def process_ticket(
    ticket: Dict[str, Any], supabase_client, qdrant_client, cluster_map: Dict[str, str]
) -> Dict[str, Any]:
    """
    The main Argus Pipeline Orchestrator.
    Executes Layer 0 -> Layer 4 sequentially, updating the database as needed.
    """
    pipeline_start = start_timer()
    logs = []

    async def conclude(
        status: str, action: GateAction, reason: str, extra: dict = None
    ) -> Dict[str, Any]:
        latency = stop_timer(pipeline_start)

        # Extract action_payload before building result dict
        action_payload = extra.get("action_payload", {}) if extra else {}
        result = {
            "ticket_id": ticket["id"],
            "status": status,
            "action": _json_safe(action),
            "reason": reason,
            "latency_ms": latency,
            "logs": logs,
            "resolution": action_payload.get("resolution")
            if status == "auto_resolved"
            else None,
        }
        if extra:
            result.update(_json_safe(extra))

        # Extract properties from extra for saving to DB
        qdrant_results = extra.get("qdrant_results", []) if extra else []
        conf_report = extra.get("confidence_report", {}) if extra else {}
        if hasattr(conf_report, "model_dump"):
            conf_report = conf_report.model_dump()
        signals = (
            conf_report.get("signals", {})
            if conf_report
            else {"A": None, "B": None, "C": None}
        )
        action_payload = extra.get("action_payload", {}) if extra else {}
        sandbox_passed = extra.get("sandbox_passed", False) if extra else False
        resolution_message = extra.get("resolution_message") if extra else None
        
        candidate_fixes = _top_candidate_fixes(qdrant_results, top_k=3)

        # Build ticket_outcomes dict
        outcome_data = {
            "ticket_id": ticket["id"],
            "category": ticket.get("category"),
            "description": ticket.get("description"),
            "resolution": action_payload.get("resolution"),
            "resolution_cluster": action_payload.get("cluster_id"),
            "auto_resolved": (status == "auto_resolved"),
            "sandbox_passed": sandbox_passed,
            "signal_a": signals.get("A", {}).get("score")
            if isinstance(signals.get("A"), dict)
            else (signals.get("A").score if signals.get("A") else None),
            "signal_b": signals.get("B", {}).get("score")
            if isinstance(signals.get("B"), dict)
            else (signals.get("B").score if signals.get("B") else None),
            "signal_c": signals.get("C", {}).get("score")
            if isinstance(signals.get("C"), dict)
            else (signals.get("C").score if signals.get("C") else None),
            "escalation_reason": reason if status != "auto_resolved" else None,
            "agent_verified": None,
            "ai_suggestion": None
            if status == "auto_resolved"
            else (
                candidate_fixes[0].get("resolution")
                if candidate_fixes and isinstance(candidate_fixes[0], dict)
                else None
            ),
            "retrospective_match": None,
        }

        # INSERT ticket_outcomes FIRST — before touching ticket status.
        # If this fails, the ticket must NOT be marked auto_resolved.
        try:
            supabase_client.table("ticket_outcomes").insert(outcome_data).execute()
        except Exception as e:
            logger.error(f"Failed to insert ticket_outcome: {e}", exc_info=True)
            # Re-raise so ticket status never gets set to auto_resolved without an outcome row.
            # Return an escalation result instead.
            error_result = {
                "ticket_id": ticket["id"],
                "status": "escalated",
                "action": _json_safe(action),
                "reason": f"System error: outcome record failed to write. Original reason: {reason}",
                "latency_ms": latency,
                "logs": logs,
                "resolution": None,
            }
            if extra:
                error_result.update(_json_safe(extra))
            # Write the outcome with the error reason
            error_outcome = {
                **outcome_data,
                "auto_resolved": False,
                "escalation_reason": f"System error: {e}",
            }
            try:
                supabase_client.table("ticket_outcomes").insert(error_outcome).execute()
            except Exception:
                pass  # Already logged; cannot recover further
            return error_result

        # Only update ticket status after ticket_outcomes is confirmed written.
        ticket_updates = {"status": status}
        if status in ("auto_resolved", "resolved"):
            ticket_updates["resolved_at"] = datetime.now(timezone.utc).isoformat()
        supabase_client.update_ticket(ticket["id"], ticket_updates)

        # Generate evidence card and write audit log for ALL tickets
        try:
            if status == "auto_resolved":
                evidence_card_dict = {
                    "decision": "AUTO_RESOLVED",
                    "signals": {
                        k: (v.model_dump() if hasattr(v, "model_dump") else v)
                        for k, v in signals.items()
                    }
                    if signals
                    else {},
                    "sandbox_passed": sandbox_passed,
                    "resolution_applied": action_payload.get("resolution", "Unknown"),
                    "resolution_cluster": action_payload.get("cluster_id", "Unknown"),
                    "candidate_fixes": candidate_fixes,
                    "decision_latency": latency,
                    "resolution_message": resolution_message,
                }
            else:
                evidence_card_dict = await generate_evidence_card(
                    ticket=ticket,
                    signals=signals,
                    qdrant_results=candidate_fixes,
                    escalation_reason=reason,
                )
                # Enforce deterministic candidate fixes from Qdrant (not LLM hallucinated structure)
                evidence_card_dict["candidate_fixes"] = candidate_fixes

            # Write to audit_log (does NOT try to write evidence_card to tickets table)
            audit_hash = log_to_audit(
                ticket["id"],
                "AUTO_RESOLVED" if status == "auto_resolved" else "ESCALATED",
                evidence_card_dict,
                supabase_client,
                latency_ms=int(latency),
            )
            result["audit_hash"] = audit_hash
            result["evidence_card"] = evidence_card_dict
        except Exception as e:
            logger.error(f"Failed to generate/log evidence card: {e}", exc_info=True)

        if resolution_message:
            result["resolution_message"] = resolution_message

        return result

    # --- Category Auto-Detection ---
    if not ticket.get("category"):
        logs.append("No category provided. Auto-detecting category via LLM...")
        try:
            # Fetch valid categories from database
            valid_categories_res = (
                supabase_client.table("category_thresholds")
                .select("category")
                .execute()
            )
            valid_categories = (
                [row["category"] for row in valid_categories_res.data]
                if valid_categories_res.data
                else []
            )

            if not valid_categories:
                # Fallback to hardcoded list if database fetch fails
                valid_categories = [
                    "Auth/SSO",
                    "SAP Issues",
                    "Email Access",
                    "VPN Problems",
                    "Printer Issues",
                    "Software Install",
                    "Network/Connectivity",
                    "Permissions/Access",
                ]

            categories_list = ", ".join([f"'{cat}'" for cat in valid_categories])
            sys_prompt = f"You are an IT helpdesk classifier. Classify the ticket description into exactly ONE of these categories only: {categories_list}. Return ONLY the exact category name, nothing else. Do not include any reasoning or explanation."
            detected_category = await generate_text(
                f"Ticket Description: {ticket.get('description', '')}", sys_prompt
            )

            # Parse response - remove thinking tokens and explanations
            detected_category = detected_category.strip()
            if "<think>" in detected_category.lower():
                parts = detected_category.lower().split("</think>")
                if len(parts) > 1:
                    detected_category = parts[1].strip()

            detected_category = detected_category.strip("\"'\n ")

            matched_category = None
            for cat in valid_categories:
                if cat.lower() in detected_category.lower():
                    matched_category = cat
                    break

            if matched_category:
                detected_category = matched_category
            elif detected_category not in valid_categories:
                logger.warning(
                    f"AI returned invalid category '{detected_category}'. Valid categories: {valid_categories}"
                )
                detected_category = valid_categories[0]

            ticket["category"] = detected_category
            logs.append(f"Auto-detected category: {detected_category}")
        except Exception as e:
            logger.error(
                f"Category auto-detection failed: {e}. Trying keyword-based fallback..."
            )
            description = (ticket.get("description") or "").lower()
            system_name = (ticket.get("system_name") or "").lower()

            keyword_map = {
                "SAP Issues": ["sap", "commerce"],
                "Email Access": ["email", "outlook", "mailbox", "mail", "inbox"],
                "VPN Problems": ["vpn", "remote"],
                "Printer Issues": ["printer", "print"],
                "Software Install": [
                    "install",
                    "software",
                    "app",
                    "license",
                    "uninstall",
                ],
                "Network/Connectivity": [
                    "network",
                    "internet",
                    "wifi",
                    "connected",
                    "connectivity",
                    "dns",
                    "gateway",
                    "ethernet",
                ],
                "Permissions/Access": [
                    "access",
                    "permission",
                    "unauthorized",
                    "denied",
                    "share",
                    "folder",
                    "group",
                ],
                "Auth/SSO": [
                    "password",
                    "sso",
                    "mfa",
                    "2fa",
                    "authenticat",
                    "locked",
                    "unlock",
                ],
            }

            detected_category = None
            for category, keywords in keyword_map.items():
                for keyword in keywords:
                    if keyword in system_name:
                        detected_category = category
                        break
                if detected_category:
                    break

            if not detected_category:
                category_scores = {}
                for category, keywords in keyword_map.items():
                    score = 0
                    for keyword in keywords:
                        if keyword in description:
                            score += 1
                    if score > 0:
                        category_scores[category] = score

                if category_scores:
                    detected_category = max(
                        category_scores.items(), key=lambda x: x[1]
                    )[0]

            if not detected_category:
                try:
                    valid_categories_res = (
                        supabase_client.table("category_thresholds")
                        .select("category")
                        .execute()
                    )
                    if valid_categories_res.data:
                        detected_category = valid_categories_res.data[0]["category"]
                    else:
                        detected_category = "Auth/SSO"
                except:
                    detected_category = "Auth/SSO"

            ticket["category"] = detected_category
            logs.append(f"Keyword-based detection: {detected_category}")

        try:
            supabase_client.update_ticket(
                ticket["id"], {"category": ticket["category"]}
            )
        except Exception:
            pass

    # --- Severity Auto-Detection ---
    if not ticket.get("severity") or ticket.get("severity") == "P3":
        detected_severity = auto_detect_severity(ticket.get("description", ""))
        if detected_severity != "P3":
            ticket["severity"] = detected_severity
            logs.append(f"Auto-detected severity: {detected_severity}")
            try:
                supabase_client.update_ticket(
                    ticket["id"], {"severity": detected_severity}
                )
            except Exception:
                pass

    # --- Layer 0: Hard Policy Gate ---
    logs.append("Running Layer 0: Hard Policy Gate")
    user_data = supabase_client.get_user_by_email(ticket.get("user_email"))
    system_data = (
        supabase_client.get_system_by_name(ticket.get("system_name"))
        if ticket.get("system_name")
        else None
    )

    user_model = User(**user_data) if user_data else None
    system_model = System(**system_data) if system_data else None
    submission_data = {
        k: v
        for k, v in ticket.items()
        if k
        in [
            "description",
            "category",
            "severity",
            "user_email",
            "system_name",
            "attachment_url",
        ]
    }
    ticket_model = TicketSubmission(**submission_data)

    policy_res = hard_policy_gate(ticket_model, user_model, system_model)
    # We evaluate the gate, but do not exit immediately if it fails.
    # We MUST fetch embeddings and retrieve similar tickets so the human agent receives candidate fixes.

    # --- Layer 1a: Embedding ---
    logs.append("Running Layer 1a: Embedding ticket context")
    try:
        url = (
            ticket.get("attachments", [None])[0] if ticket.get("attachments") else None
        )
        vector = await embed_ticket(ticket["description"], attachment_url=url)
    except Exception as e:
        logger.error(f"Embedding failed: {e}")
        # If policy already escalated, prefer reporting the policy reason.
        if policy_res.action != GateAction.PROCEED:
            return await conclude("escalated", policy_res.action, policy_res.reason)
        return await conclude(
            "escalated", GateAction.ESCALATE, f"Embedding generation failed: {e}"
        )

    # --- Layer 1b: Retrieval ---
    logs.append("Running Layer 1b: Retrieving similar past tickets")
    try:
        qdrant_results = await retrieve_similar(vector, top_k=5)
    except Exception as e:
        logger.error(f"Retrieval failed: {e}")
        if policy_res.action != GateAction.PROCEED:
            return await conclude("escalated", policy_res.action, policy_res.reason)
        return await conclude(
            "escalated", GateAction.ESCALATE, f"Vector DB retrieval failed: {e}"
        )

    # Convert ScoredPoint payloads to plain dicts for JSON serialization
    extra_state = {
        "qdrant_results": [
            {
                "point_id": getattr(r, "id", None),
                "score": getattr(r, "score", None),
                **(getattr(r, "payload", None) or {}),
            }
            for r in qdrant_results
        ]
    }

    # Now that we have qdrant_results (and therefore candidate fixes for the UI),
    # enforce the Policy Gate exit if it failed.
    if policy_res.action != GateAction.PROCEED:
        return await conclude("escalated", policy_res.action, policy_res.reason, extra_state)

    # --- Layer 2: Novelty Detection ---
    logs.append("Running Layer 2: Novelty Detection")
    novelty_res = check_novelty(qdrant_results, threshold=0.50)
    if novelty_res.action == GateAction.ESCALATE:
        supabase_client.insert_novel_ticket(
            ticket["id"], qdrant_results[0].score if qdrant_results else 0.0
        )
        return await conclude(
            "escalated", GateAction.ESCALATE, novelty_res.reason, extra_state
        )

    # --- Layer 3: Confidence Engine ---
    logs.append("Running Layer 3: Confidence Engine")
    conf_report = compute_confidence(
        qdrant_results, ticket.get("category", "General"), supabase_client, cluster_map
    )
    extra_state["confidence_report"] = conf_report
    if conf_report.decision == ConfidenceDecision.ESCALATE:
        return await conclude(
            "escalated", GateAction.ESCALATE, conf_report.reason, extra_state
        )

    # --- Layer 4: Resolution Mapping & Sandbox Execution ---
    logs.append("Running Layer 4: Action Mapping & Sandbox")
    action_payload = map_resolution_to_action(
        qdrant_results[0],
        cluster_map,
        ticket.get("user_email", "unknown@domain.com"),
        ticket.get("category", ""),
    )
    extra_state["action_payload"] = action_payload

    sandbox_res = await test_in_sandbox(
        action_payload["action"], action_payload["target"]
    )
    if not sandbox_res.get("success", False):
        return await conclude(
            "escalated",
            GateAction.ESCALATE,
            f"Sandbox validation failed: {sandbox_res.get('error', 'Unknown Error')}",
            extra_state,
        )

    extra_state["sandbox_passed"] = True

    # --- Layer 5: Finalization & Audit Logging ---
    logs.append("All gates passed. Compiling evidence card and auto-resolving.")

    # Generate final user-facing resolution message
    resolution_text = action_payload.get("resolution", "Issue resolved")
    ticket_description = ticket.get("description", "")
    try:
        resolution_msg = await generate_resolution_message(
            resolution_text, ticket_description
        )
    except Exception as e:
        logger.warning(
            f"Resolution message generation failed: {e}. Using raw resolution text."
        )
        resolution_msg = resolution_text

    extra_state["resolution_message"] = resolution_msg

    # Store resolution_message in ticket_outcomes (via the resolution field)
    # This is handled in conclude() through action_payload["resolution"]

    return await conclude(
        "auto_resolved", GateAction.PROCEED, "Successfully auto-resolved.", extra_state
    )
