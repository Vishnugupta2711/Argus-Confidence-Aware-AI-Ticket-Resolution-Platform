# AGENTS — Argus

> Instructions for AI coding agents working on this repository.

---

## 1. Project Context

Argus is an intelligent IT support ticket auto-handling system with confidence-based Human-in-the-Loop (HITL) escalation. Two web portals: **Employee** (submit tickets, view status) and **Agent** (review escalated tickets, submit resolutions, monitor metrics, run simulations, monitor system health), backed by a multi-layered decision pipeline that auto-resolves tickets only when three independent confidence signals pass AND a live sandbox test succeeds.

---

## 2. Source of Truth

| Document | Role |
|---|---|
| **`docs/SOLUTION.md`** | Read-only. Product intent, context, edge cases. Read for *why*. **Do not modify unless the user explicitly asks.** |
| **`docs/DATABASE.md`** | Database schema and table reference. |
| **`docs/API.md`** | API endpoint reference. |
| **`docs/SETUP.md`** | Local development and Docker setup guide. |
| **`AGENTS.md`** | This file — operational instructions for AI agents. |

---

## 3. Development Workflow

1. **Read the relevant spec file(s)** for the task at hand (e.g., `DATABASE.md` for schema changes).
2. **Work module-by-module.** Implement one module, verify it, then move on.
3. **Minimal first, robust second.** Happy path before error handling.
4. **Keep modules independent.** Backend `core/` modules must be testable in isolation with mocked services.

---

## 4. Using Agent Skills

**Before implementing complex functionality, check if a relevant skill exists.**

| Skill | When to Use |
|---|---|
| `shadcn-ui` | Installing, configuring, or customizing any shadcn/ui component. **Read this skill first before adding UI components.** |
| `react-components` | Converting designs into modular React components with proper structure. |
| `frontend-design` | Building polished, production-grade frontend pages that avoid generic aesthetics. |
| `web-design-guidelines` | Reviewing UI for accessibility, usability, and design best practices. |
| `find-skills` | Finding installable skills for specific tasks. |

- **Always prefer an existing skill** over recreating patterns from scratch.
- Read the skill's `SKILL.md` before using it.

### MCP Servers

| MCP Server | When to Use |
|---|---|
| **Supabase Argus (`supabase_argus_*`)** | Apply migrations, execute SQL, list tables — use instead of writing raw SQL by hand. |
| **Context7** | Look up library docs (FastAPI, Pydantic, Qdrant SDK, React, shadcn, etc.) before writing integration code. |
| **BrowserMCP** | Visually test and verify frontend pages. |
| **21st.dev Magic** | Generate or refine UI components. |
| **GitHub MCP** | Repo operations (create PRs, search code). |

---

## 5. Implementation Rules

- **Do not invent new architecture.** Follow the existing module boundaries and directory structure.
- **Respect the tech stack.** Python 3.11+, FastAPI, async. React 18+, TypeScript, Vite, shadcn/ui, Tailwind CSS.
- **Do not refactor broadly.** Avoid restructuring directories or changing data flow unless the task specifically requires it.
- **Preserve pipeline layer order.** The 9-stage pipeline (Severity Auto-Detection → Category Auto-Detection → Policy Gate → Embedding → Retrieval → Novelty → Confidence (A/B/C) → Sandbox → Finalization) must always execute in sequence.
- **Respect escalation safety.** If any component fails or is unavailable (Qdrant down, sandbox unreachable, LLM timeout), the system **must default to escalation**. Never auto-resolve when uncertain.
- **Audit trail.** Every decision must produce a SHA-256 hash chained to the previous entry in `audit_log`.

---

## 6. File Structure

```
argus/
├── docs/                 SOLUTION.md, DATABASE.md, API.md, SETUP.md
├── backend/
│   ├── api/routes/       FastAPI route handlers
│   │                     tickets.py, agent.py, config.py, metrics.py, audit.py
│   ├── core/             Pipeline logic
│   │                     pipeline.py, policy_gate.py, confidence.py, novelty.py
│   │                     embedder.py, retriever.py, resolution_mapper.py
│   │                     sandbox_client.py
│   ├── services/         External service clients
│   │                     supabase.py, qdrant.py, jina.py, llm.py, vision.py
│   │                     storage.py
│   ├── models/           Pydantic data models (ticket.py, user.py, etc.)
│   └── utils/            audit_hash.py, cluster_map.py, timestamps.py
├── sandbox/              Isolated sandbox server (port 8001)
│                        main.py, actions.py, environment.py
├── frontend/src/
│   ├── pages/agent/      EscalatedQueue.tsx, EvidenceCardView.tsx
│   │                     TicketHistory.tsx, SystemHealth.tsx
│   │                     MetricsDashboard.tsx, WhatIfSimulator.tsx, AuditLog.tsx
│   ├── pages/employee/   UserSelectGrid.tsx, SubmitTicket.tsx, TicketStatus.tsx
│   ├── pages/landing/    LandingPage.tsx
│   ├── layouts/          AgentLayout.tsx, EmployeeLayout.tsx
│   ├── components/       landing/*, motion/*, ui/*
│   ├── services/         agent.ts, tickets.ts, config.ts, metrics.ts, audit.ts
│   └── types/            TypeScript type definitions
├── tests/                pytest unit and integration tests
├── scripts/              seeding and operational scripts
├── data/                 seed data CSVs and cluster_map.json
└── database/             schema.sql
```

---

## 7. Safe Modification Guidelines

| Before modifying... | Do this first |
|---|---|
| Database schema (Supabase) | Use `supabase_argus_list_tables` to inspect. Apply migrations via `supabase_argus_apply_migration`. Check all modules that query those tables. |
| Pipeline stages (`core/`) | Verify the change doesn't break the layer execution order in `core/pipeline.py`. |
| Data models (`models/`) | Search for all usages across `api/`, `core/`, and `services/`. |
| API endpoints | Update corresponding frontend API calls and TypeScript types. |
| Frontend component types | Update `frontend/src/types/index.ts` and check all consumers. |

**General rule:** If you change a data model or schema, grep the codebase for usages and update them all in the same change.

---

## 8. Git Rules

- **Do NOT push to GitHub unless explicitly asked by the user.**
- Commit locally with clear, concise messages describing *what* changed and *why*.
- Push only when the user says to.

---

## 9. Key Technical Constraints

- **Two servers:** Main backend on port `8000`, sandbox on port `8001`
- **External services (free tier):** Jina AI, Qdrant Cloud, Supabase, Groq, Gemini, OpenRouter
- **Fail-safe principle:** Any error or unavailability → escalate to human. Never auto-resolve when uncertain.
- **Hardcode hex colors** in React components rather than CSS variables to avoid dark/light mode contrast issues.
- **Match the Argus design system:** `--argus-*` CSS variables, Inter font, DM Mono for monospace, Tailwind, Framer Motion.

---

## 10. Common Implementation Patterns

**Adding a new backend endpoint:**
1. Define Pydantic models in `models/`
2. Add route handler in `api/routes/`
3. Implement business logic in `core/` (pipeline) or `services/` (external)
4. Add test cases

**Adding a new frontend page:**
1. Read the `shadcn-ui` and `frontend-design` skills first
2. Create page component in `frontend/src/pages/agent/` or `frontend/src/pages/employee/`
3. Add API service function in `frontend/src/services/`
4. Add route in the router config (`App.tsx`)
5. Use shadcn/ui components — do not build custom UI primitives

**Database changes:**
1. Use `supabase_argus_*` MCP tools for all schema operations
2. Write migrations with `supabase_argus_apply_migration`
3. Never hardcode references to generated IDs in migrations
4. Verify RLS policies still allow required access after adding columns
