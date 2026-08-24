-- Phase 1: Argus Database Schema
-- Applied on 2026-03-10 via Supabase MCP

-- 1. Create `users` table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    tier TEXT NOT NULL DEFAULT 'standard' CHECK (tier IN ('standard', 'vip', 'contractor')),
    department TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create `systems` table
CREATE TABLE systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    change_freeze BOOLEAN NOT NULL DEFAULT false,
    active_incident BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create `tickets` table
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    system_id UUID REFERENCES systems(id),
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('P1', 'P2', 'P3', 'P4')),
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'auto_resolved', 'escalated', 'resolved')),
    is_urgent BOOLEAN NOT NULL DEFAULT false,
    attachment_url TEXT,
    attachment_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

CREATE TABLE ticket_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id),
    category TEXT NOT NULL,
    auto_resolved BOOLEAN NOT NULL,
    sandbox_passed BOOLEAN,
    signal_a FLOAT,
    signal_b FLOAT,
    signal_c FLOAT,
    escalation_reason TEXT,
    resolution TEXT,
    resolution_cluster TEXT,
    agent_verified BOOLEAN,
    override_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create `audit_log` table
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id),
    decision TEXT NOT NULL,
    evidence_card JSONB NOT NULL,
    audit_hash TEXT NOT NULL,
    previous_hash TEXT NOT NULL,
    latency_ms INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Create `category_thresholds` table
CREATE TABLE category_thresholds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT UNIQUE NOT NULL,
    threshold_a FLOAT NOT NULL DEFAULT 0.85,
    threshold_b FLOAT NOT NULL DEFAULT 0.60,
    threshold_c FLOAT NOT NULL DEFAULT 0.70,
    novelty_threshold FLOAT NOT NULL DEFAULT 0.50,
    min_sample_size INTEGER NOT NULL DEFAULT 30,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Create `novel_tickets` table
CREATE TABLE novel_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id),
    max_similarity FLOAT NOT NULL,
    reviewed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Add required indexes for performance
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_ticket_outcomes_category ON ticket_outcomes(category);
CREATE INDEX idx_ticket_outcomes_created_at ON ticket_outcomes(created_at);
CREATE INDEX idx_audit_log_ticket_id ON audit_log(ticket_id);
CREATE INDEX idx_novel_tickets_reviewed ON novel_tickets(reviewed);

-- 9. Seed default category thresholds
INSERT INTO category_thresholds (category) VALUES
  ('Auth/SSO'),
  ('SAP Issues'),
  ('Email Access'),
  ('VPN Problems'),
  ('Printer Issues'),
  ('Software Install'),
  ('Network/Connectivity'),
  ('Permissions/Access')
ON CONFLICT (category) DO NOTHING;
