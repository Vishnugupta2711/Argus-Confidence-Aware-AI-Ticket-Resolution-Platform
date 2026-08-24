import { api } from "@/lib/api";
import { SimulationResponse, ThresholdConfig, ThresholdUpdatePayload, ImpactPreview } from "@/types";

export const getThresholds = async (): Promise<ThresholdConfig[]> => {
  const { data } = await api.get<{ thresholds: ThresholdConfig[] }>("/config/thresholds");
  return data.thresholds;
};

export const getThreshold = async (category: string): Promise<ThresholdConfig> => {
  const { data } = await api.get<ThresholdConfig>(`/config/thresholds/${category}`);
  return data;
};

export const updateThreshold = async (
  category: string,
  payload: ThresholdUpdatePayload
): Promise<ThresholdConfig> => {
  const { data } = await api.patch<ThresholdConfig>(`/config/thresholds/${category}`, payload);
  return data;
};

export const getImpactPreview = async (): Promise<ImpactPreview> => {
  const { data } = await api.get<ImpactPreview>("/config/thresholds/impact");
  return data;
};

export const getSystems = async () => {
  const { data } = await api.get("/config/systems");
  return data;
};

export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  tier: string;
}

export const getUsers = async (): Promise<User[]> => {
  const { data } = await api.get("/config/users");
  return data;
};

export type SimulationRequestPayload = {
  description: string;
  user_tier: "standard" | "vip" | "contractor";
  severity: "P1" | "P2" | "P3" | "P4";
  system_id: string;
  active_incident_override: boolean;
  change_freeze_override: boolean;
};

export const simulate = async (params: SimulationRequestPayload): Promise<SimulationResponse> => {
  const { data } = await api.post<SimulationResponse>("/simulate", params);
  return data;
};

export type SystemHealthStatus = "operational" | "degraded" | "down" | "disabled";

export interface SystemHealth {
  id: string;
  name: string;
  type: string;
  method: string;
  endpoint: string;
  status: SystemHealthStatus;
  latency_ms: number | null;
  error?: string | null;
}

export type SystemHealthResponse = {
  all_operational: boolean;
  systems: SystemHealth[];
};

export const getSystemHealth = async (opts?: { services?: string }): Promise<SystemHealthResponse> => {
  const params = opts?.services ? { services: opts.services } : {};
  const { data } = await api.get<SystemHealthResponse>("/config/health", { params });
  return data;
};
