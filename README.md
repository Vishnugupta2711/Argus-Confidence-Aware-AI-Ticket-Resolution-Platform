<div align="center">

![Argus Logo](./frontend/src/assets/argus-logo.png)

# Argus

[![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB?style=for-the-badge&logo=react&logoColor=222)](frontend/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](frontend/)
[![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](backend/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-336791?style=for-the-badge&logo=supabase&logoColor=white)](DATABASE.md)
[![Qdrant](https://img.shields.io/badge/Vector%20DB-Qdrant-EA4AAA?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI0VBNEFBQSIgZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6Ii8+PC9zdmc+)](DATABASE.md)
[![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)](#cicd-pipeline)
[![Docker](https://img.shields.io/badge/Container-GHCR-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://ghcr.io/kr1shnasomani/argus)
[![Tests](https://img.shields.io/badge/Tests-pytest-0A9EDC?style=for-the-badge&logo=pytest&logoColor=white)](tests/)

</div>

Automatically resolves IT support tickets using confidence-based AI decision pipeline backed by vector search, LLM reasoning, and live sandbox validation.

---

## Table of Contents

1. [What Argus Does](#what-argus-does)
2. [Production Deployment](#production-deployment)
3. [Local Development Setup](#local-development-setup)
4. [Architecture Overview](#architecture-overview)
5. [The 8-Stage Pipeline](#the-8-stage-pipeline)
6. [Environment Variables](#environment-variables)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Documentation Index](#documentation-index)

---

## What Argus Does

Argus runs a **multi-stage confidence pipeline** to automatically handle IT tickets:

```
Ticket Submitted → Policy Gate → Vector Search → Confidence Signals → Sandbox Test → Decision
                                                                      ↓
                                                    Auto-Resolve (✓) OR Escalate (→ Agent)
```

### For Employees
- Submit IT support tickets via the **Employee Portal**
- Track ticket status in real-time
- View resolution details or agent notes if escalated

### For IT Agents
- Review escalated tickets in the **Agent Portal** with full confidence evidence
- Approve or override auto-resolution decisions
- Submit verified resolutions back to the system
- Monitor system health and run what-if simulations
- View complete audit trails

---

## Production Deployment

| Component | Platform | Status | URL |
|-----------|----------|--------|-----|
| **Frontend** | Vercel | ✅ Live | [argus-frontend.vercel.app](https://argus-4xv8a19a9-kr1shnasomani-preview.vercel.app) |
| **Backend API** | Render | ✅ Live | [https://argus-okop.onrender.com](https://argus-okop.onrender.com) |
| **Sandbox** | Render | ✅ Live | [https://argus-1-y489.onrender.com](https://argus-1-y489.onrender.com) |
| **Database** | Supabase | ✅ Live | PostgreSQL + Qdrant Vector DB |

---

## Local Development Setup

The easiest way to run Argus is via the **published Docker image** on GitHub Container Registry — no local build required.

### 1. Prerequisites
- **Docker Desktop**
- A Supabase project (for PostgreSQL)
- A Qdrant Cloud cluster (for vector search)

### 2. Environment Variables
```bash
cp .env.example .env
# Fill in your Supabase, Qdrant, Jina, and LLM API keys
```

### 3. Pull and run
```bash
docker compose pull
docker compose up
```

This pulls `ghcr.io/kr1shnasomani/argus:latest` and starts **3 separate containers** in Docker Desktop:

| Container | URL |
|---|---|
| `argus-frontend` | [http://localhost:5173](http://localhost:5173) |
| `argus-backend` | [http://localhost:8005/docs](http://localhost:8005/docs) |
| `argus-sandbox` | [http://localhost:8001/docs](http://localhost:8001/docs) |

To stop: `docker compose down`

You can target a single service with the `SERVICE` variable:
```bash
docker run --env-file .env -e SERVICE=backend -p 8005:8005 ghcr.io/kr1shnasomani/argus:latest
```
*(Valid targets: `backend`, `frontend`, `sandbox`, `all`)*

*For manual setup without Docker, see [docs/SETUP.md](docs/SETUP.md).*

---

## Architecture Overview

Argus is a **3-tier distributed system**:

### Tier 1: Frontend (Vercel)
- React SPA with Employee & Agent portals
- shadcn/ui components + Tailwind CSS
- All API calls routed through `/services/` layer

### Tier 2: Backend (Render)
- FastAPI application orchestrating the 8-stage pipeline
- Connects to Supabase (PostgreSQL), Qdrant (vector DB), LLM services
- Routes: tickets, agent actions, configuration, metrics, audit logs

### Tier 3: Sandbox (Render)
- Isolated FastAPI service for action validation
- Executes proposed ticket resolutions in controlled environment

### Data Layer
- **Supabase PostgreSQL:** Ticket metadata, users, resolutions, audit logs
- **Qdrant Vector DB:** Embedding-based retrieval of similar historical tickets

---

## The 8-Stage Pipeline

Every ticket flows through this deterministic pipeline:

| Stage | Component | Decision |
|-------|-----------|----------|
| **1. Policy Gate** | `policy_gate.py` | VIP/P1/P2/freeze checks → Pass/Escalate |
| **2. Category Detection** | `policy_gate.py` | Classify ticket domain |
| **3. Embedding** | `embedder.py` | Convert ticket to vector (Jina AI) |
| **4. Retrieval** | `retriever.py` | Find similar resolved tickets (Qdrant) |
| **5. Novelty Check** | `novelty.py` | Ensure sufficient precedent exists |
| **6. Signal A** | `confidence.py` | Semantic similarity confidence (0–1) |
| **7. Signal B** | `confidence.py` | Resolution consistency (0–1) |
| **8. Signal C** | `confidence.py` | Category success rate (0–1) |
| **Sandbox** | `sandbox_client.py` | Execute & validate action |
| **Decision** | `pipeline.py` | If (A≥0.8 AND B≥0.8 AND C≥0.8) AND sandbox success → auto-resolve |

**Fail-Safe:** If any component fails or is unavailable, the system escalates. Never auto-resolve when uncertain.

---

## Environment Variables

### Backend Required

```bash
# Supabase PostgreSQL
SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_KEY=[service-role-key]

# Qdrant Vector Database
QDRANT_URL=https://[cluster]-qdrant.a1.quarkus-codegen.ts.net:6333
QDRANT_API_KEY=[api-key]
QDRANT_COLLECTION_NAME=resolved_tickets

# Embeddings (Jina AI)
JINA_API_KEY=[jina-api-key]

# LLM Providers (at least one required)
GROQ_API_KEY=[groq-api-key]
GROQ_MODEL=mixtral-8x7b-32768

GOOGLE_GEMINI_API_KEY=[gemini-api-key]
GEMINI_MODEL=gemini-pro

OPENROUTER_API_KEY=[openrouter-api-key]
OPENROUTER_MODEL=openrouter/auto

# Sandbox URL
SANDBOX_URL=https://argus-1-y489.onrender.com  # production
# or
SANDBOX_URL=http://localhost:8001  # local development
```

---

## CI/CD Pipeline

Argus uses **GitHub Actions** for continuous integration and deployment:

| Workflow | Trigger | Tasks |
|----------|---------|-------|
| **backend-ci.yml** | Push/PR on `backend/**` | Linting, type checking, pytest |
| **frontend-ci.yml** | Push/PR on `frontend/**` | ESLint, TypeScript, build verification |
| **docker-image-ci.yml** | Push/PR touching Dockerfile or source | Build-only Docker image check (no push) |
| **docker-publish.yml** | Push to `main` or version tag | Builds & pushes `ghcr.io/kr1shnasomani/argus` to GHCR |
| **codeql.yml** | Push/PR to `main` + weekly | Security scanning (Python, TypeScript, Actions) |
| **deploy.yml** | Push to `main` + CI passes | Auto-deploy to Render & Vercel |

---

## Documentation Index

| Document | Purpose |
|----------|---------|
| **[docs/API.md](docs/API.md)** | Complete API endpoint reference |
| **[docs/DATABASE.md](docs/DATABASE.md)** | Supabase + Qdrant schema |
| **[docs/SOLUTION.md](docs/SOLUTION.md)** | Authoritative design blueprint (read-only) |
| **[docs/SETUP.md](docs/SETUP.md)** | Local development and Docker setup |
| **[AGENTS.md](AGENTS.md)** | AI agent development instructions |
