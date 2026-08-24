# Database Reference

This document covers both Argus data stores:
- Supabase Postgres (system of record)
- Qdrant (vector knowledge base)

## 1) Supabase (Postgres)

### Tables
- `users` — directory of allowed submitters and their policy tier
- `systems` — policy context for target systems (change freeze, active incident)
- `tickets` — canonical ticket lifecycle record, one row per submitted ticket
- `ticket_outcomes` — per-ticket pipeline outputs, signal scores, and feedback loop data (also holds 500 seed rows for Signal C bootstrap)
- `audit_log` — immutable SHA-256 chained decision log, one row per ticket
- `category_thresholds` — per-category confidence thresholds for the 3-signal engine
- `novel_tickets` — tickets flagged as too dissimilar for AI processing (max_similarity < 0.50)

### users
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `email` | text | unique |
| `name` | text | |
| `tier` | text | `standard`, `vip`, or `contractor` |
| `department` | text | |
| `created_at` | timestamptz | |

### systems
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | unique |
| `category` | text | |
| `change_freeze` | boolean | |
| `active_incident` | boolean | |
| `updated_at` | timestamptz | |

### tickets
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → users.id |
| `system_id` | uuid | FK → systems.id, nullable |
| `description` | text | |
| `category` | text | NOT NULL |
| `severity` | text | `P1`, `P2`, `P3`, `P4` |
| `status` | text | `processing`, `auto_resolved`, `escalated`, `resolved` |
| `is_urgent` | boolean | employee-flagged urgent; does NOT affect AI pipeline, only bumps queue sort order |
| `attachment_url` | text | nullable, from Supabase storage |
| `attachment_text` | text | nullable, OCR extracted by Gemma vision model |
| `created_at` | timestamptz | |
| `resolved_at` | timestamptz | nullable; set when status moves to auto_resolved or resolved |

### ticket_outcomes
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `ticket_id` | uuid | References tickets.id for live rows. For seed rows, this is a random UUID not in tickets table. |
| `category` | text | NOT NULL; used to GROUP BY for Signal C |
| `description` | text | nullable; ticket description text, for agent dashboard display |
| `auto_resolved` | boolean | NOT NULL. **The Signal C column.** true = AI or agent successfully resolved. false = escalated or incorrect auto-resolution. |
| `sandbox_passed` | boolean | nullable; true/false from canary sandbox. NULL for seed rows and policy-gate escalations. |
| `signal_a` | float | semantic similarity score. NULL = seed row (not a live pipeline row) |
| `signal_b` | float | resolution consistency score. NULL = seed row. |
| `signal_c` | float | result-level auto-resolution rate from retrieved Qdrant matches (priority), falling back to category accuracy score. NULL = seed row. |
| `escalation_reason` | text | nullable; plain English reason for escalation. NULL if auto_resolved. |
| `resolution` | text | nullable; final resolution text applied or submitted by agent |
| `resolution_cluster` | text | nullable; cluster label for Qdrant upsert (e.g. `password_reset`) |
| `agent_verified` | boolean | nullable; true = agent confirmed correct, false = agent corrected it, NULL = not yet reviewed |
| `override_reason` | text | nullable; why agent overrode AI suggestion |
| `ai_suggestion` | text | nullable; what the AI silently would have resolved this as. **Only populated for escalated tickets, never for auto-resolved or policy-gate escalations.** |
| `retrospective_match` | boolean | nullable; true = agent resolution matched ai_suggestion (≥80% similarity). When true, auto_resolved is also updated to true for Signal C improvement. NULL = not yet computed. |
| `created_at` | timestamptz | |

**Two types of rows:**
- **Seed rows** (`signal_a IS NULL`): 500 rows representing shadow mode historical data. Bootstrap Signal C. `ticket_id` is a random UUID not in `tickets` table.
- **Live rows** (`signal_a IS NOT NULL`): Created by the pipeline for every real ticket. `ticket_id` references a real ticket.

**Signal C historical fallback query:**
Used when no result-level data is available. For live Signal C computation, see `PIPELINE_STAGES.md`.
```sql
SELECT COUNT(*) FILTER (WHERE auto_resolved = true)::float / COUNT(*)
FROM ticket_outcomes
WHERE category = :category
AND signal_a IS NOT NULL
AND created_at >= NOW() - INTERVAL '30 days'
```

Notes:
- `ai_suggestion` is NULL for auto-resolved tickets and policy-gate escalations (no Qdrant query ran)
- `retrospective_match` is computed via fuzzy string match against `ai_suggestion` (≥80% similarity = match)
- Dashboard metrics must filter `signal_a IS NOT NULL` to exclude seed rows

### audit_log
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `ticket_id` | uuid | FK → tickets.id |
| `decision` | text | `AUTO_RESOLVED`, `HUMAN_ESCALATION`, `AGENT_RESOLVED`, `AGENT_CORRECTION` |
| `evidence_card` | jsonb | full pipeline trace and candidate fixes |
| `audit_hash` | text | SHA-256 of current entry |
| `previous_hash` | text | SHA-256 of previous entry (chain) |
| `latency_ms` | integer | pipeline execution time |
| `created_at` | timestamptz | |

### novel_tickets
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `ticket_id` | uuid | FK → tickets.id CASCADE DELETE |
| `max_similarity` | float | NOT NULL; highest cosine similarity score found across all Qdrant results. Will always be below `novelty_threshold` (0.50). |
| `reviewed` | boolean | NOT NULL DEFAULT false; false = pending admin review, true = reviewed and actioned |
| `created_at` | timestamptz | |

**Purpose:** Logs tickets that scored below the novelty threshold across all Qdrant results. These tickets are completely unknown to the system — no historical case is similar enough to process safely. They are hard-escalated and flagged here for knowledge base expansion review.

**Written by:** Pipeline when `max_similarity < novelty_threshold` (0.50).
**Read by:** Admin dashboard novel tickets review panel.

### category_thresholds
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `category` | text | unique |
| `threshold_a` | float | semantic similarity pass threshold |
| `threshold_b` | float | resolution consistency threshold |
| `threshold_c` | float | category accuracy threshold |
| `novelty_threshold` | float | minimum similarity for novelty check |
| `min_sample_size` | integer | minimum rows for Signal C |
| `updated_at` | timestamptz | |

### Indexes
- `idx_tickets_user_id`, `idx_tickets_status`
- `idx_ticket_outcomes_category`, `idx_ticket_outcomes_created_at`
- `idx_audit_log_ticket_id`
- `idx_novel_tickets_reviewed`

### Cascade Delete
Deleting a row from `tickets` automatically deletes linked rows in:
- `audit_log` — via FK CASCADE
- `novel_tickets` — via FK CASCADE
- `ticket_outcomes` — via trigger (cannot use FK CASCADE because seed rows have ticket_ids not in tickets table)

---

## 2) Qdrant (Vector DB)

### Collection
- Name: from env `QDRANT_COLLECTION_NAME` (default `resolved_tickets`)
- Vector size: `1024`
- Distance: `COSINE`

### Stored Payload
- `ticket_id` — display format `INC-XXXXX`
- `description`, `category`, `severity`, `resolution`
- `resolution_cluster`, `user_tier`, `verified`

### Point ID
- May be integer or string. Evidence card normalizes integer IDs to `INC-XXXXX` display format.

### Operations
- `embed_ticket(text)` — Jina AI embeddings
- `retrieve_similar(vector, top_k)` — Qdrant nearest-neighbor search
- `upsert_ticket(ticket_id, vector, payload)` — verified fix insertion

---

## 3) Data Flow

1. Employee submits ticket → `tickets` row created, status=`processing`
2. Pipeline runs 9 stages (Severity Auto-Detection → Category Auto-Detection → Policy Gate → Embedding → Retrieval → Novelty → Confidence Signals A/B/C → Sandbox → Finalization)
3. `conclude()`: INSERT into `ticket_outcomes` FIRST (if this fails, ticket escalates), then UPDATE `tickets.status`
4. Evidence and latency written to `audit_log` with SHA-256 hash chain
5. Agent resolves escalated ticket → `retrospective_match` computed, verified fixes upserted to Qdrant
6. Agent corrects auto-resolved ticket → `auto_resolved=False`, corrected resolution upserted

---

## 4) Environment Variables

```
SUPABASE_URL, SUPABASE_SERVICE_KEY
QDRANT_URL, QDRANT_API_KEY, QDRANT_COLLECTION_NAME
JINA_API_KEY
GROQ_API_KEY, GROQ_MODEL
GOOGLE_GEMINI_API_KEY, GEMINI_MODEL
OPENROUTER_API_KEY, OPENROUTER_MODEL
SANDBOX_URL (defaults to http://localhost:8001)
```

---

## 5) Operational Notes

- Backend uses Supabase service role key — bypasses RLS in server-side operations.
- `tickets.category` is NOT NULL; submit flow inserts `Unclassified` before LLM auto-detection updates it.
- `ticket_outcomes.signal_a/b/c` are NULL for seed rows — always filter with `signal_a IS NOT NULL` in metrics queries to get live pipeline data only.
- No orphaned tickets: `conclude()` INSERTs into `ticket_outcomes` BEFORE updating `tickets.status`. If the INSERT fails, the ticket is escalated with reason "System error: outcome record failed to write" — never silently marked auto_resolved without an outcome row.
- `tickets` table does NOT have an `auto_resolved` column. This field lives exclusively in `ticket_outcomes`.
- Seed rows in `ticket_outcomes` have `ticket_id` values that are random UUIDs not present in `tickets`. This is intentional — they represent shadow mode historical data and are never shown as live tickets in the UI.
- Cascade delete is active: deleting a ticket from `tickets` removes linked rows from `audit_log` (FK CASCADE), `novel_tickets` (FK CASCADE), and `ticket_outcomes` (trigger-based). Seed rows in `ticket_outcomes` are unaffected since their ticket_ids don't exist in `tickets`.
- All 500 seed rows in `ticket_outcomes` have `verified=true` and `signal_a IS NULL`. They are loaded into Qdrant (all 500) and into Supabase `ticket_outcomes` for Signal C bootstrapping.