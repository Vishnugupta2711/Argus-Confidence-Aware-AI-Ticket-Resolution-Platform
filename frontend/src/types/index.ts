export interface ConfidenceSignal {
  value: number | null;
  threshold: number | null;
  passed: boolean;
}

export interface AgentResolution {
  ticket_id: string;
  resolution_text: string;
  resolution_type: "verified" | "workaround" | "uncertain";
  override_reason?: string | null;
  accept_suggestion?: boolean;
}

export interface TicketSubmission {
  description: string;
  category: string;
  severity: "P1" | "P2" | "P3" | "P4";
  user_email: string;
  system: string;
}

export interface TicketResponse {
  ticket_id: string;
  status: "processing" | "auto_resolved" | "escalated" | "resolved";
  resolution_message?: string | null;
  resolution?: string | null;
  decision_latency_ms?: number | null;
}

export interface TicketStatusDetail {
  id: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  created_at: string;
  resolution?: string;
  escalation_reason?: string;
  latency_ms?: number;
}

export interface EvidenceCard {
  ticket_id: string; // from backend explicitly added as ticket_id: t["id"]
  id?: string;
  description: string;
  category: string;
  severity: string;
  created_at: string;
  user_tier: string;
  status: string;
  resolved_at?: string | null;
  user_email?: string;
  
  evidence_card?: {
    layer_intercepted: number | null;
    escalation_reason?: string;
    signals?: Record<string, ConfidenceSignal>;
    is_novel?: boolean;
    candidate_fixes?: Array<{
      ticket_id: string;
      similarity: number;
      resolution: string;
      success_rate: number;
    }>;
    sandbox_passed?: boolean;
    resolution?: string;
    resolution_applied?: string;
    decision_latency?: number | { total_ms?: number };
  };
  
  outcome?: any;
  decision_latency_ms?: number;
  candidate_fixes?: Array<{
    ticket_id?: string;
    similarity?: number;
    similarity_score?: number;
    resolution: string;
    success_rate?: number;
  }>;
  resolution_applied?: string | null;
  sandbox_passed?: boolean | null;
  escalation_reason?: string | null;
  signal_a?: number | null;
  signal_b?: number | null;
  signal_c?: number | null;
  threshold_a?: number | null;
  threshold_b?: number | null;
  threshold_c?: number | null;
  max_similarity?: number | null;
  layer_intercepted?: number | null;
  total_latency_ms?: number | null;
  audit_log?: {
    audit_hash: string;
    created_at: string;
  } | null;
}

export interface AgentQueueTicket {
  ticket_id: string;
  id?: string;
  description: string;
  category: string;
  severity: string;
  is_urgent?: boolean;
  created_at: string;
  status: string;
  user_tier?: string;
  escalation_reason?: string | null;
  decision_latency_ms?: number | null;
  evidence_card?: {
    escalation_reason?: string;
  };
}

export interface SimulationStep {
  index: number;
  name: string;
  status: "PASS" | "FAIL" | "SKIPPED";
  value?: string | number | boolean | null;
  threshold?: string | number | null;
  details?: string | null;
}

export interface SimulationResponse {
  layer_intercepted: number | null;
  reason: string;
  steps: SimulationStep[];
  candidate_fixes: Array<{
    ticket_id: string;
    resolution: string;
    similarity_score: number;
  }>;
  signals?: {
    A?: number | null;
    B?: number | null;
    C?: number | null;
  };
  decision: {
    outcome: "AUTO RESOLVED" | "HUMAN ESCALATION REQUIRED";
    reason: string;
  };
}

export interface AuditEntry {
  id: string;
  ticket_id: string;
  action: string;
  decision: string;
  layer: number;
  details: any;
  actor: string;
  created_at: string;
  timestamp: string;
  latency_ms: number;
  previous_hash: string;
  hash: string;
}

export interface DashboardMetrics {
  system_performance: {
    total_tickets: number;
    auto_resolved_count: number;
    escalated_count: number;
    sandbox_failures: number;
  };
  override_analysis: Record<string, number>;
  knowledge_base_coverage: {
    total_vectors: number;
    categories_covered: number;
    avg_similarity: number;
    coverage_level: "High" | "Moderate" | "Low";
  };
  drift_monitor: Record<string, any>;
}

export interface CoverageMetrics {
  total_vectors: number;
  categories_covered: number;
  coverage_status: "High" | "Moderate" | "Low";
}

export interface CategoryDrift {
  category: string;
  accuracy_change: number;
  status: "stable" | "drifting" | "improving";
}

export interface DriftData {
  analyzed_categories: number;
  drift_detected: number;
  categories: CategoryDrift[];
}

export interface ThresholdConfig {
  id: string;
  category: string;
  threshold_a: number;
  threshold_b: number;
  threshold_c: number;
  novelty_threshold: number;
  min_sample_size: number;
  updated_at: string;
}

export interface ThresholdUpdatePayload {
  threshold_a?: number;
  threshold_b?: number;
  threshold_c?: number;
  novelty_threshold?: number;
  min_sample_size?: number;
}

export interface ImpactPreview {
  total_tickets: number;
  auto_resolved_count: number;
  escalated_count: number;
  auto_resolve_rate: number;
  previous_rate: number;
  delta: number;
  categories: Record<string, {
    tickets: number;
    auto_resolved: number;
    escalated: number;
    new_rate: number;
    previous_rate: number;
  }>;
}

export interface TicketHistoryRow {
  id: string;
  user_id: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  users: { email: string } | null;
  audit_log?: {
    audit_hash: string;
    created_at: string;
  } | null;
}
