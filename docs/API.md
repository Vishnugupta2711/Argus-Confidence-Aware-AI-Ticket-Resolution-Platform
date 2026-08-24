# API Reference

This document describes all HTTP APIs used by the Argus frontend and backend.

## Base URLs
- Backend: `http://localhost:8000`
- Frontend API client (`frontend/src/lib/api.ts`): `http://localhost:8000/api`

---

## Health

### GET /health
App readiness check.

Response:
```json
{ "status": "ok", "qdrant_connected": true, "cluster_map_loaded": true }
```

---

## Tickets

### POST /api/tickets/submit
Submit a new ticket and run the full pipeline.

Content-Type: `multipart/form-data`

Form fields:
- `description` (required) — ticket description text
- `user_email` (required) — submitter email
- `category` (optional; auto-detected if blank)
- `severity` (optional; default `P3`; one of `P1`, `P2`, `P3`, `P4`)
- `system_name` (optional; system name string)
- `urgent` (optional; `true`/`false`, default `false`)
- `attachment` (optional file)

Response (`TicketResponse`):
```json
{
  "ticket_id": "uuid",
  "status": "processing|auto_resolved|escalated",
  "resolution": "string|null",
  "resolution_message": "string|null",
  "resolved_at": null,
  "decision_latency_ms": 1234.56
}
```

### GET /api/tickets/{ticket_id}
Returns current ticket state and resolution.

### POST /api/tickets/{ticket_id}/escalate_user
Called by an employee to escalate an auto-resolved ticket they are unsatisfied with. Updates status to "escalated", sets "auto_resolved" to False in `ticket_outcomes` and records the escalation.

---

## Agent APIs

### GET /api/tickets/agent/escalated
Returns all `status='escalated'` tickets, sorted by `is_urgent` DESC then `created_at` ASC.

### GET /api/tickets/{ticket_id}/evidence
Returns the full Evidence Card payload:
- ticket fields (description, category, severity, status, user_email, created_at)
- `outcome` from `ticket_outcomes` (ai_suggestion, resolution, signal_a/b/c, sandbox_passed, etc.)
- `evidence_card` from `audit_log` (candidate_fixes, escalation_reason, layer_intercepted)
- `category_thresholds` (threshold_a/b/c)
- `total_latency_ms`

### POST /api/tickets/{ticket_id}/resolve
Agent resolves an escalated ticket.

Body:
```json
{
  "resolution_text": "...",
  "resolution_type": "verified|workaround|uncertain",
  "override_reason": "optional string",
  "accept_suggestion": false
}
```

Behavior:
- `accept_suggestion=true` skips similarity check → `retrospective_match=True`, `auto_resolved=True`
- Otherwise: fuzzy match `resolution_text` vs `ai_suggestion` — ≥80% similarity → `retrospective_match=True`
- Updates `ticket_outcomes`: resolution, agent_verified, override_reason, retrospective_match, auto_resolved
- Updates `tickets`: status='resolved', resolved_at, auto_resolved (mirrors outcome value)
- If `resolution_type=verified`: upserts payload into Qdrant
- Writes audit entry

### POST /api/tickets/{ticket_id}/verify
Marks an auto-resolved ticket as verified by an agent.
Upserts the ticket resolution and embedding into Qdrant to improve future auto-resolutions.

### PATCH /api/tickets/{ticket_id}/correction
Agent corrects an auto-resolved ticket marked incorrect.

Body:
```json
{
  "corrected_resolution": "...",
  "resolution_type": "verified|workaround|uncertain"
}
```

Behavior:
- Sets `retrospective_match=False`, `agent_verified=True`, `auto_resolved=False`
- Updates ticket status to `resolved`
- If `resolution_type=verified`: upserts corrected resolution into Qdrant
- Writes audit entry with action `AGENT_CORRECTION`

### GET /api/tickets/agent/all
Returns all tickets (history view) with latest outcome context, for the Agent All Tickets page.

---

## Configuration APIs

### GET /api/config/health
Returns health status for all 8 Argus subsystems.

Query param: `?services=id1,id2,...` — checks only listed services; others return `status: "disabled"`.

Response:
```json
{
  "all_operational": true,
  "systems": [
    {
      "id": "supabase",
      "name": "Supabase",
      "type": "Database",
      "method": "GET",
      "endpoint": "PostgreSQL — SELECT 1",
      "status": "operational",
      "latency_ms": 42,
      "error": null
    }
  ]
}
```

Services: `supabase`, `qdrant`, `sandbox`, `jina`, `groq`, `gemini`, `openrouter`, `pipeline`.

### GET /api/config/users
Returns all users: `id, name, email, department, tier`.

### GET /api/config/systems
Returns all systems: `id, name`.

### GET /api/config/thresholds
Returns all category thresholds.

### GET /api/config/thresholds/{category}
Returns thresholds for one category.

### PATCH /api/config/thresholds/{category}
Updates thresholds for a specific category. All fields are optional — only provided fields are updated.

Body (`ThresholdUpdate`):
```json
{
  "threshold_a": 0.85,
  "threshold_b": 0.60,
  "threshold_c": 0.70,
  "novelty_threshold": 0.50,
  "min_sample_size": 30
}
```

### GET /api/config/thresholds/impact
Returns a preview of how many tickets would auto-resolve vs escalate under the current thresholds, for dashboard display.

### POST /api/simulate
Dry-run the full pipeline with custom parameters. No DB writes.

Body:
```json
{
  "description": "...",
  "user_tier": "standard|vip|contractor",
  "severity": "P1|P2|P3|P4",
  "system_id": "uuid",
  "active_incident_override": false,
  "change_freeze_override": false
}
```

Returns 8-step trace with PASS/FAIL/SKIPPED per step, candidate fixes, signal values, and final decision.

---

## Metrics APIs

### GET /api/metrics/dashboard
Returns dashboard aggregates: `system_performance`, `override_analysis`, `knowledge_base_coverage`, `drift_monitor`.

### GET /api/metrics/coverage
Returns vector count, category coverage, and average signal scores.

### GET /api/metrics/drift
Returns per-category recent vs previous accuracy drift.

---

## Audit APIs

### GET /api/audit/logs
Returns latest global audit log entries (paginated).

### GET /api/audit/{ticket_id}
Returns full audit hash chain for a specific ticket.

---

## Frontend Service Mapping

| Service file | Endpoints |
|---|---|
| `frontend/src/services/tickets.ts` | `POST /api/tickets/submit`, `GET /api/tickets/{id}`, `POST /api/tickets/{id}/escalate_user` |
| `frontend/src/services/agent.ts` | `GET /api/tickets/agent/escalated`, `GET /api/tickets/{id}/evidence`, `POST /api/tickets/{id}/resolve`, `POST /api/tickets/{id}/verify`, `PATCH /api/tickets/{id}/correction`, `GET /api/tickets/agent/all` |
| `frontend/src/services/config.ts` | `GET /api/config/health`, `GET /api/config/users`, `GET /api/config/systems`, `GET /api/config/thresholds`, `GET /api/config/thresholds/{category}`, `PATCH /api/config/thresholds/{category}`, `GET /api/config/thresholds/impact`, `POST /api/simulate` |
| `frontend/src/services/metrics.ts` | `GET /api/metrics/dashboard`, `GET /api/metrics/coverage`, `GET /api/metrics/drift` |
| `frontend/src/services/audit.ts` | `GET /api/audit/logs`, `GET /api/audit/{ticket_id}` |

---

## Error Handling

- The backend has a global exception handler returning a generic internal error.
- Route-level `HTTPException` details are surfaced for specific failures.
- Employee submit UI surfaces backend `detail` when available.