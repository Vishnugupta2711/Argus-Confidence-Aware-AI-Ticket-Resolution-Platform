import { api } from "@/lib/api";
import { EvidenceCard, AgentResolution, AgentQueueTicket } from "@/types";

// EscalatedQueue displays a lighter version of evidence cards, but for simplicity
// we map the GET /api/tickets/agent/escalated response which returns List[EvidenceCard]
export const getEscalatedTickets = async (): Promise<AgentQueueTicket[]> => {
  const { data } = await api.get<AgentQueueTicket[]>("/tickets/agent/escalated");
  return data;
};

export const getTicketEvidence = async (ticketId: string): Promise<EvidenceCard> => {
  const { data } = await api.get<EvidenceCard>(`/tickets/${ticketId}/evidence`);
  return data;
};

export const resolveTicket = async (resolution: AgentResolution): Promise<{ ticket_id: string; status: string; resolution_message: string }> => {
  const { data } = await api.post(`/tickets/${resolution.ticket_id}/resolve`, {
    resolution_text: resolution.resolution_text,
    resolution_type: resolution.resolution_type,
    override_reason: resolution.override_reason ?? null,
    accept_suggestion: resolution.accept_suggestion ?? false,
  });
  return data;
};

export const submitCorrection = async (ticketId: string, correctedResolution: string, resolution_type: string): Promise<any> => {
  const { data } = await api.patch(`/tickets/${ticketId}/correction`, {
    corrected_resolution: correctedResolution,
    resolution_type,
  });
  return data;
};

export const markAgentVerified = async (ticketId: string): Promise<any> => {
  const { data } = await api.post(`/tickets/${ticketId}/verify`);
  return data;
};

export const getAllTickets = async (): Promise<import("@/types").TicketHistoryRow[]> => {
  const { data } = await api.get<import("@/types").TicketHistoryRow[]>("/tickets/agent/all");
  return data;
};
