import { api } from "@/lib/api";
import { DashboardMetrics, CoverageMetrics, DriftData } from "@/types";

export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const { data } = await api.get<DashboardMetrics>("/metrics/dashboard");
  return data;
};

export const getCoverage = async (): Promise<CoverageMetrics> => {
  const { data } = await api.get<CoverageMetrics>("/metrics/coverage");
  return data;
};

export const getDrift = async (): Promise<DriftData> => {
  const { data } = await api.get<DriftData>("/metrics/drift");
  return data;
};
