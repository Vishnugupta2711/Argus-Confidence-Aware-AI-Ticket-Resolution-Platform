# Argus System Context & Architecture

**Last Updated**: 2026-04-16

This document is the ultimate, exhaustive architectural and operational specification of the Argus system. It serves as the absolute source of truth for AI agents and human developers, ensuring continuous coding alignment, architectural constraints, and historical design decisions. If you have any doubts about the project, refer to this file.

---

## 1. High-Level Architecture
Argus is a sophisticated 3-tier, Confidence-Based Human-in-the-Loop (HITL) system. It is designed to auto-resolve enterprise IT tickets while enforcing mathematically rigorous safety guarantees. It NEVER acts based on a single confidence score or LLM output. Instead, it relies on deterministic policy gates, a multi-signal confidence engine, and live sandbox validation.

- **Frontend**: React 18 / Vite / TypeScript. Styled with Tailwind CSS and `shadcn/ui`. Serves on Port 5173. Provides two distinct portals: Employee Portal (for submission) and Agent Portal (for review and oversight).
- **Main Backend (API + Pipeline)**: FastAPI / Python 3.11+. Serves on Port 8000. Orchestrates the ticket processing pipeline, interacts with databases, and exposes REST APIs.
- **Sandbox Environment**: An isolated mock execution server (FastAPI) on Port 8001. It evaluates candidate auto-resolutions practically before they are committed to production.

All three services are unified into a **Single Docker Container** with `supervisord` maintaining process lifecycle integrity.

---

## 2. Core Execution Pipeline (The 8-Stage Resolution Flow)

Codebase Location: `backend/core/pipeline.py`

Argus does not permit immediate auto-resolution. Every incoming ticket must survive the following sequential gates. If ANY condition fails, the system seamlessly escalates the issue to a Human Agent.

### Stage 1: Auto-Detection (Severity & Category)
The system uses LLMs (Gemma 3 27B) and keyword heuristics to classify the ticket's severity (P1-P4) and category based purely on the description. **The employee does not select severity.**

### Stage 2: Policy Gate (Hard Stop)
A deterministic set of business rules that run *before* any AI processing. No probability, no threshold tuning, no override mechanism:
- **Severity**: If P1 or P2, immediate escalation.
- **User Tier**: If the user is a `VIP`, immediate escalation.
- **Change Freeze**: If the affected system is under a change freeze, immediate escalation.
- **Active Incident**: If the affected system has an active P1 incident, the ticket is batch-escalated to the incident team.

### Stage 3: Embedding & Retrieval
If the ticket passes the policy gate, it is vectorized.
- **Image/File**: If the ticket contains an image/attachment, Gemma 3 27B (via OpenRouter) extracts a text description. This is appended to the ticket text.
- **Vectorization**: Jina AI (`jina-embeddings-v3`) converts the text into a vector.
- **Retrieval**: Qdrant Cloud searches the `resolved_tickets` collection for the top-5 historical tickets matching the embedding (filtering for `verified=true`).

### Stage 4: Novelty Check
Checks if the ticket is genuinely within the system's known domain.
- `max_similarity = max([r.score for r in qdrant_results])`
- If `max_similarity < 0.50` (configurable `novelty_threshold`), it is flagged as novel, escalated immediately, and logged in `novel_tickets`.

### Stage 5: Confidence Scoring (The 3-Signal Engine)
Three independent signals are computed. **All three must pass their per-category calibrated thresholds.**
- **Signal A (Semantic Similarity)**: Score of the rank-1 match from Qdrant. Checks if the ticket is genuinely close to a known resolved ticket (Default: 0.85).
- **Signal B (Resolution Consistency)**: Percentage of the top-5 results belonging to the same resolution cluster. Checks if past similar tickets were fixed the exact same way (Default: 0.60 or 3/5).
- **Signal C (Category Automation Accuracy)**: Percentage of successfully auto-resolved tickets in this category over the last 30 days from the Supabase `ticket_outcomes` table (Default: 0.70). **Cold Start Rule:** Fails automatically if < 30 tickets exist for the category.

### Stage 6: Canary Sandbox Validation
The candidate resolution is POSTed to the isolated Canary Sandbox (`http://localhost:8001/sandbox/execute`). 
- If the sandbox returns a 200 OK (success: true), the pipeline proceeds.
- If it fails/crashes, the ticket is escalated with the sandbox trace included.

### Stage 7: Finalization / Auto-Resolution
The action is "committed to production". An LLM generates a friendly, natural language resolution message for the employee. The outcome is recorded in Supabase.

### Stage 8: Audit & Cryptographic Logging
The system emits a highly structured Evidence Card payload to the `audit_log` table. Every decision is logged with a SHA-256 Merkle chain hash linking to the previous entry, providing a tamper-evident trail.

---

## 3. Human-in-the-Loop (HITL) Feedback Loop

When an auto-resolution is escalated or explicitly rejected by an employee (`TicketStatus.tsx -> Escalate to Agent`):
1. A human agent reviews the resolution in the Agent Portal (`EvidenceCardView.tsx`), which contains the Evidence Card, 3 candidate fixes, and the specific reason why the system escalated.
2. The agent types their own resolution and selects a type: `Verified reusable fix`, `Temporary workaround`, or `Uncertain`.
3. **Verification Gate**: Once marked "Verified" (or explicitly verified via the API), the backend generates a new embedding for the original ticket.
4. **Learning Loop**: The verified vector, ticket ID, and resolution payload are upserted to Qdrant. The outcome updates Supabase's `ticket_outcomes` table, directly improving future "Signal C" calculations.
5. **LLM Refinement**: An LLM refines the agent's raw technical fix into a professional user message for the employee.
6. **Retrospective Validation**: Even if an agent solves an escalated ticket, the system silently compares the agent's fix with the AI's hypothetical suggestion (`ai_suggestion`). If they match ≥80% (`retrospective_match=true`), it counts as a success toward the category's Signal C history.

---

## 4. Data Strategy & Database Design

Argus splits its data into two main locations: Supabase (PostgreSQL) for relational state and Qdrant for vector state.

### Supabase Tables
- **`users`**: System directory mapping emails to `tier` (standard, vip, contractor) and department.
- **`systems`**: Policy contexts per application (`change_freeze`, `active_incident`).
- **`tickets`**: Canonical state of every ticket submitted. Fields: `id`, `user_id`, `system_id`, `description`, `category`, `severity`, `status` (processing, auto_resolved, escalated, resolved), `attachment_url`, `attachment_text`. Note: `tickets` does NOT hold the `auto_resolved` boolean flag.
- **`ticket_outcomes`**: Stores pipeline execution results and confidence signals (`signal_a`, `signal_b`, `signal_c`, `auto_resolved`, `escalation_reason`, `resolution_cluster`, `retrospective_match`, `agent_verified`, `ai_suggestion`).
- **`audit_log`**: Immutable ledger of resolutions. Contains the `evidence_card` JSON, `decision`, `audit_hash`, and `previous_hash`.
- **`novel_tickets`**: Tracks tickets that failed the 0.50 novelty threshold.
- **`category_thresholds`**: Configurable thresholds for Signal A, B, C, and Novelty per category.

### Qdrant Collections
- **Name**: `resolved_tickets` (configurable via `QDRANT_COLLECTION_NAME`).
- **Vector Size**: 1024 (jina-embeddings-v3). Distance: COSINE.
- **Payload stored**: `ticket_id`, `description`, `category`, `severity`, `resolution`, `resolution_cluster`, `user_tier`, `verified` (boolean). We explicitly filter Qdrant queries to `verified=true`.

### Seed Data
The database is initially loaded from `argus_seed_data.csv` (500 rows), representing **shadow mode historical data**. 
- 82% of these rows are successful auto-resolutions (auto_resolved=true).
- They live in `ticket_outcomes` with `signal_a` set to `NULL` and `ticket_id`s not present in the `tickets` table. This allows Signal C to bootstrap successfully out of the box.

---

## 5. API Reference Summary

- **`http://localhost:8000/api`**: Base URL for Main Backend.
- **`POST /api/tickets/submit`**: Submits a new ticket and triggers the 8-stage pipeline.
- **`GET /api/tickets/{id}`**: Returns current status of the ticket.
- **`POST /api/tickets/{id}/escalate_user`**: Employee rejects auto-resolution and requests agent escalation.
- **`GET /api/tickets/agent/escalated`**: Get all escalated tickets.
- **`GET /api/tickets/{id}/evidence`**: Get the full Evidence Card, outcome, and hashes for a ticket.
- **`POST /api/tickets/{id}/resolve`**: Agent submits resolution (updating tickets, outcomes, and Qdrant if verified).
- **`POST /api/tickets/{id}/verify`**: Agent marks an auto-resolved ticket as verified.
- **`PATCH /api/tickets/{id}/correction`**: Agent corrects a faulty auto-resolution.
- **`/api/config/*`**: System health, threshold management (`PATCH /api/config/thresholds/{category}`), and a dry-run `POST /api/simulate` endpoint.
- **`/api/metrics/*`**: Dashboard aggregates, drift monitor (checking 7-day vs 14-day historical drop in accuracy), and KB coverage.

---

## 6. Security and Auditing (SHA-256 Merkle Chain)

Every time the pipeline concludes (`backend/core/pipeline.py:conclude()`), the system logs the full decision matrix (the Evidence Card) into the `audit_log` table.
- A SHA-256 hash is computed from the current JSON payload and the `previous_hash` of the last record in the table.
- This creates an unbroken, tamper-evident Merkle chain from the genesis block.
- The Agent UI displays this hash, allowing operators to verify the mathematical integrity of any auto-resolution.

---

## 7. UI/UX "Precision Design" System

Argus demands exceptionally premium, hyper-coordinated visuals.
- All core CSS tokens originate from `frontend/src/index.css`.
- **Positive States**: Action verbs affecting approval, verification, or "Yes" map directly to `--argus-emerald` and `--argus-emerald-light`.
- **Negative States**: Action verbs affecting escalation, rejection, or "No" map directly to `--argus-red` and `--argus-red-light`.
- Elements rely on raw `shadow` tags with hardcoded hex overrides when standard Tailwind utility variables do not precisely map.

---

## 8. Deployment / Infrastructure Specs

### Environment Variables Required
```env
SUPABASE_URL
SUPABASE_SERVICE_KEY
QDRANT_URL
QDRANT_API_KEY
QDRANT_COLLECTION_NAME (default: resolved_tickets)
JINA_API_KEY
GROQ_API_KEY / GROQ_MODEL
GOOGLE_GEMINI_API_KEY / GEMINI_MODEL
OPENROUTER_API_KEY / OPENROUTER_MODEL
SANDBOX_URL (default: http://localhost:8001)
```

### Docker Manifest (All-In-One Container)
- Provides individual selection via the `$SERVICE` Environment block (`frontend`, `backend`, `sandbox`, `all`).
- Multi-repo drift and CI pipeline complexity are eliminated by running all services simultaneously under `supervisord`.
- Uses Supabase service role key server-side, intentionally bypassing RLS for backend operations.

---

## 9. Constraints, Prohibitions, and Edge Cases

- **NEVER** subvert the Sandbox execution block. Safety must precede speed.
- **NEVER** edit `SOLUTION.md`. It holds the product-marketing definitions and philosophical architecture guidelines.
- **NEVER** alter internal Supabase UUID/Foreign Key generation manually; always rely on standard tools and `apply_migration`.
- **No Orphaned Tickets**: `conclude()` strictly INSERTs into `ticket_outcomes` BEFORE updating `tickets.status`. If the outcomes insert fails, the ticket forcefully escalates.
- **Missing Knowledge**: If a new ticket category is seen or similarity drops < 0.50, the system must immediately escalate. It relies on the cold start and novelty threshold logic to fail safe.
- **Dependencies**: `qdrant-client` runs with `check_version=False` intentionally on the async client to ignore minor mismatches.
- **FastAPI Validation**: Strict validation mapping exclusively to `models/ticket.py` schemas.
- **Signal C Safety (Retrospective Loop)**: Even if all tickets escalate, the system still compares the silent AI suggestion with the agent's actual resolution. If they match, `ticket_outcomes.retrospective_match = True`, allowing Signal C to rise and eventually escape a deadlock loop safely.
