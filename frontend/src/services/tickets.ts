import { api } from "@/lib/api";
import { TicketResponse, TicketStatusDetail } from "@/types";

export const submitTicket = async (formData: FormData): Promise<TicketResponse> => {
  // Uses FormData for multipart/form-data upload
  const { data } = await api.post<TicketResponse>("/tickets/submit", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

export const getTicketStatus = async (id: string): Promise<TicketStatusDetail> => {
  const { data } = await api.get<TicketStatusDetail>(`/tickets/${id}`);
  return data;
};

export const escalateTicketByUser = async (id: string): Promise<{ ticket_id: string; status: string }> => {
  const { data } = await api.post<{ ticket_id: string; status: string }>(`/tickets/${id}/escalate_user`);
  return data;
};
