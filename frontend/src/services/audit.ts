import { api } from "@/lib/api";
import { AuditEntry } from "@/types";

export const getAuditLogs = async (): Promise<AuditEntry[]> => {
  const { data } = await api.get<AuditEntry[]>(`/audit/logs`);
  return data;
};
