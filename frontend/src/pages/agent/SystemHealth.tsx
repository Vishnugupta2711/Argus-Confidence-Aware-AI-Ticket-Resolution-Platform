import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSystemHealth } from "@/services/config";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, AlertTriangle, XCircle, PauseCircle, RefreshCw, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const STORAGE_KEY = "argus:health-toggles";

const DEFAULT_ENABLED = {
  supabase: true,
  qdrant: true,
  sandbox: true,
  jina: true,
  groq: true,
  gemini: true,
  openrouter: true,
  pipeline: true,
};

const METHOD_COLORS: Record<string, { bg: string; text: string }> = {
  GET: { bg: "rgba(16, 185, 129, 0.1)", text: "#059669" },
  POST: { bg: "rgba(99, 102, 241, 0.1)", text: "#4F46E5" },
};

const STATUS_CONFIG = {
  operational: { dot: "#10B981", bg: "rgba(16, 185, 129, 0.06)", border: "rgba(16, 185, 129, 0.2)", text: "#059669", label: "Operational", Icon: CheckCircle2 },
  degraded: { dot: "#F59E0B", bg: "rgba(245, 158, 11, 0.06)", border: "rgba(245, 158, 11, 0.2)", text: "#92400E", label: "Degraded", Icon: AlertTriangle },
  down: { dot: "#EF4444", bg: "rgba(239, 68, 68, 0.06)", border: "rgba(239, 68, 68, 0.15)", text: "#991B1B", label: "Down", Icon: XCircle },
  disabled: { dot: "#94A3B8", bg: "rgba(148, 163, 184, 0.04)", border: "rgba(148, 163, 184, 0.15)", text: "#64748B", label: "Disabled", Icon: PauseCircle },
};

function loadToggles(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_ENABLED, ...JSON.parse(stored) };
  } catch {}
  return { ...DEFAULT_ENABLED };
}

function saveToggles(toggles: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toggles));
  } catch {}
}

function formatLatency(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "—";
  if (ms === 0) return "<1ms";
  return `${ms}ms`;
}

function latencyColor(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "var(--argus-text-muted)";
  if (ms < 100) return "#10B981";
  if (ms < 500) return "#F59E0B";
  return "#EF4444";
}

export default function SystemHealth() {
  const [toggles, setTogglesState] = useState<Record<string, boolean>>(loadToggles);
  const [masterOn, setMasterOn] = useState(() => Object.values(loadToggles()).some(Boolean));

  const setToggles = useCallback((updater: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => {
    setTogglesState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveToggles(next);
      return next;
    });
  }, []);

  const enabledIds = Object.entries(toggles)
    .filter(([, on]) => on)
    .map(([id]) => id);

  const queryEnabled = masterOn && enabledIds.length > 0;
  const servicesParam = queryEnabled ? enabledIds.join(",") : undefined;

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ["system-health", servicesParam],
    queryFn: () => getSystemHealth({ services: servicesParam } as Parameters<typeof getSystemHealth>[0]),
    enabled: queryEnabled,
    refetchInterval: queryEnabled ? 30_000 : false,
  });

  useEffect(() => {
    if (error) {
      toast.error("Health check failed", { description: String(error) });
    }
  }, [error]);

  const systems = data?.systems ?? [];
  const allUp = data?.all_operational ?? false;
  const lastChecked = data ? new Date().toLocaleTimeString() : null;

  const handleMasterToggle = (checked: boolean) => {
    setMasterOn(checked);
    if (!checked) {
      setToggles(Object.fromEntries(Object.keys(toggles).map((k) => [k, false])));
    } else {
      setToggles({ ...DEFAULT_ENABLED });
    }
  };

  const handleServiceToggle = (id: string, checked: boolean) => {
    setToggles((prev) => ({ ...prev, [id]: checked }));
  };

  const paidIds = ["jina", "groq", "gemini", "openrouter"];
  const freeIds = ["supabase", "qdrant", "sandbox", "pipeline"];

  const ServiceCard = ({ id }: { id: string }) => {
    const isOn = masterOn && toggles[id];
    const sysData = systems.find((s) => s.id === id);
    const status = sysData?.status ?? (isOn ? "disabled" : "disabled");
    const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.disabled;
    const StatusIcon = cfg.Icon;
    const methodColors = METHOD_COLORS[sysData?.method ?? "GET"] ?? METHOD_COLORS.GET;
    const latency = sysData?.latency_ms ?? null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border p-4 transition-all duration-200"
        style={{
          background: isOn ? cfg.bg : "var(--argus-surface-2)",
          borderColor: isOn ? cfg.border : "var(--argus-border)",
        }}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <StatusIcon size={16} style={{ color: cfg.dot, flexShrink: 0, marginTop: 2 }} />
            <div>
              <div className="text-sm font-semibold leading-tight" style={{ color: isOn ? cfg.text : "var(--argus-text-muted)" }}>
                {sysData?.name ?? id}
              </div>
              <div className="text-[11px] leading-tight mt-0.5" style={{ color: "var(--argus-text-muted)" }}>
                {sysData?.type ?? ""}
              </div>
            </div>
          </div>
          <Switch
            checked={toggles[id]}
            onCheckedChange={(checked) => handleServiceToggle(id, checked)}
            disabled={!masterOn}
          />
        </div>

        {/* Endpoint row */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-semibold tracking-wide"
            style={{ background: methodColors.bg, color: methodColors.text }}
          >
            {sysData?.method ?? "—"}
          </span>
          <span
            className="text-[11px] font-mono truncate max-w-[200px]"
            style={{ color: isOn ? "var(--argus-text-muted)" : "#94A3B8" }}
            title={sysData?.endpoint ?? ""}
          >
            {sysData?.endpoint ?? "—"}
          </span>
        </div>

        {/* Footer row: status + latency */}
        <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: isOn ? cfg.border : "var(--argus-border)" }}>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
            <span className="text-[11px] font-medium" style={{ color: cfg.text }}>
              {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[11px]" style={{ color: "var(--argus-text-muted)" }}>latency</span>
            <span
              className="text-[11px] font-mono font-semibold"
              style={{ color: isOn ? latencyColor(latency) : "#94A3B8" }}
            >
              {formatLatency(latency)}
            </span>
          </div>
        </div>

        {/* Error message */}
        {isOn && sysData?.error && (
          <div
            className="mt-2 text-[10px] px-2 py-1 rounded-md"
            style={{ background: "rgba(239,68,68,0.06)", color: "#991B1B", border: "1px solid rgba(239,68,68,0.15)" }}
          >
            {sysData.error}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--argus-text-primary)" }}>
          System Health
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--argus-text-muted)" }}>
          Real-time health checks for all Argus subsystems. Disable services to pause live monitoring and save API costs.
        </p>
      </div>

      {/* Master Toggle */}
      <div
        className="rounded-xl border p-5 flex items-center justify-between gap-4"
        style={{ background: "var(--argus-surface)", borderColor: "var(--argus-border)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: masterOn ? "rgba(16, 185, 129, 0.1)" : "rgba(148, 163, 184, 0.08)" }}
          >
            <Zap size={18} style={{ color: masterOn ? "#10B981" : "#94A3B8" }} />
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--argus-text-primary)" }}>
              {masterOn ? "Live Monitoring Active" : "Monitoring Paused"}
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--argus-text-muted)" }}>
              {masterOn
                ? `Polling ${enabledIds.length} services · every 30s`
                : "No API calls — health checks disabled"}
            </div>
          </div>
        </div>
        <Switch
          checked={masterOn}
          onCheckedChange={handleMasterToggle}
          className="scale-110"
        />
      </div>

      {/* Infrastructure group */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--argus-text-muted)" }}>
            Infrastructure
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(16,185,129,0.08)", color: "#059669" }}>
            no per-call cost
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {freeIds.map((id) => (
            <ServiceCard key={id} id={id} />
          ))}
        </div>
      </div>

      {/* Paid services group */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--argus-text-muted)" }}>
            External Services
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.08)", color: "#D97706" }}>
            per-call cost
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {paidIds.map((id) => (
            <ServiceCard key={id} id={id} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 pt-2">
        {isLoading || isFetching ? (
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--argus-text-muted)" }}>
            <RefreshCw size={12} className="animate-spin" />
            Checking services...
          </div>
        ) : lastChecked ? (
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--argus-text-muted)" }}>
            <CheckCircle2 size={12} style={{ color: allUp ? "#10B981" : "#F59E0B" }} />
            Checked at {lastChecked} ·{" "}
            <span style={{ color: allUp ? "#10B981" : "#F59E0B" }}>
              {allUp ? "All operational" : "Issues detected"}
            </span>
          </div>
        ) : !masterOn ? (
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--argus-text-muted)" }}>
            <PauseCircle size={12} />
            Enable services above to start monitoring.
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--argus-text-muted)" }}>
            Select at least one service to begin.
          </div>
        )}

        {queryEnabled && !isLoading && (
          <button
            onClick={() => refetch()}
            className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg border transition-colors cursor-pointer"
            style={{
              borderColor: "var(--argus-border)",
              color: "var(--argus-text-muted)",
              background: "var(--argus-surface-2)",
            }}
          >
            <RefreshCw size={11} /> Refresh
          </button>
        )}
      </div>
    </div>
  );
}
