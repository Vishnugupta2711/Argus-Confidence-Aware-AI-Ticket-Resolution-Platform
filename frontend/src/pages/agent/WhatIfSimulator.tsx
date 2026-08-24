import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getSystems, simulate, SimulationRequestPayload } from "@/services/config";
import { SimulationResponse } from "@/types";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Play, GitMerge, FileText, ArrowRightCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type SystemRow = { id: string; name: string };

type FormState = {
  description: string;
  user_tier: "standard" | "vip" | "contractor";
  severity: "P1" | "P2" | "P3" | "P4";
  system_id: string;
  active_incident_override: boolean;
  change_freeze_override: boolean;
};

const badgeStyle = (status: "PASS" | "FAIL" | "SKIPPED") => {
  if (status === "PASS") {
    return { bg: "var(--argus-emerald-light)", color: "var(--argus-emerald)", border: "rgba(5,150,105,0.25)" };
  }
  if (status === "FAIL") {
    return { bg: "var(--argus-red-light)", color: "var(--argus-red)", border: "rgba(220,38,38,0.25)" };
  }
  return { bg: "var(--argus-surface-2)", color: "var(--argus-text-muted)", border: "var(--argus-border)" };
};

export const WhatIfSimulator = () => {
  const { data: systems = [], isLoading: loadingSystems } = useQuery<SystemRow[]>({
    queryKey: ["systems-for-simulator"],
    queryFn: getSystems,
  });

  const [formData, setFormData] = useState<FormState>({
    description: "",
    user_tier: "standard",
    severity: "P3",
    system_id: "",
    active_incident_override: false,
    change_freeze_override: false,
  });

  const mutation = useMutation<SimulationResponse, Error, SimulationRequestPayload>({
    mutationFn: simulate,
  });

  const handleSimulate = () => {
    mutation.mutate({
      description: formData.description,
      user_tier: formData.user_tier,
      severity: formData.severity,
      system_id: formData.system_id,
      active_incident_override: formData.active_incident_override,
      change_freeze_override: formData.change_freeze_override,
    });
  };

  return (
    <motion.div
      className="space-y-6 max-w-7xl mx-auto"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--argus-text-primary)" }}>What-If Simulator</h1>
        <p className="text-sm mt-1" style={{ color: "var(--argus-text-muted)" }}>Runs full pipeline logic in dry-run mode without writing to database tables.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border overflow-hidden" style={{ background: "var(--argus-surface)", borderColor: "var(--argus-border)", boxShadow: "var(--shadow-card)" }}>
          <div className="px-5 py-3.5 border-b flex items-center gap-2" style={{ background: "var(--argus-surface-2)", borderColor: "var(--argus-border)" }}>
            <FileText size={15} style={{ color: "var(--argus-indigo)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--argus-text-primary)" }}>Simulation Parameters</span>
          </div>

          <div className="p-5 space-y-5">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium" style={{ color: "var(--argus-text-secondary)" }}>Ticket Description</Label>
              <Textarea
                placeholder="Describe the hypothetical issue..."
                className="h-32 resize-none text-sm"
                style={{ background: "var(--argus-surface-2)", borderColor: "var(--argus-border)", color: "var(--argus-text-primary)" }}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium" style={{ color: "var(--argus-text-secondary)" }}>System Context</Label>
              <Select value={formData.system_id} onValueChange={(v: string) => setFormData({ ...formData, system_id: v })}>
                <SelectTrigger style={{ background: "var(--argus-surface-2)", borderColor: "var(--argus-border)", color: "var(--argus-text-primary)" }}>
                  <SelectValue placeholder={loadingSystems ? "Loading systems..." : "Select system"} />
                </SelectTrigger>
                <SelectContent style={{ background: "var(--argus-surface)", borderColor: "var(--argus-border)" }}>
                  {systems.map((s) => (
                    <SelectItem key={s.id} value={s.id} style={{ color: "var(--argus-text-primary)" }}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium" style={{ color: "var(--argus-text-secondary)" }}>User Tier</Label>
                <Select value={formData.user_tier} onValueChange={(v: "standard" | "vip" | "contractor") => setFormData({ ...formData, user_tier: v })}>
                  <SelectTrigger style={{ background: "var(--argus-surface-2)", borderColor: "var(--argus-border)", color: "var(--argus-text-primary)" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: "var(--argus-surface)", borderColor: "var(--argus-border)" }}>
                    <SelectItem value="standard" style={{ color: "var(--argus-text-primary)" }}>Standard</SelectItem>
                    <SelectItem value="vip" style={{ color: "var(--argus-text-primary)" }}>VIP</SelectItem>
                    <SelectItem value="contractor" style={{ color: "var(--argus-text-primary)" }}>Contractor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium" style={{ color: "var(--argus-text-secondary)" }}>Severity</Label>
                <Select value={formData.severity} onValueChange={(v: "P1" | "P2" | "P3" | "P4") => setFormData({ ...formData, severity: v })}>
                  <SelectTrigger style={{ background: "var(--argus-surface-2)", borderColor: "var(--argus-border)", color: "var(--argus-text-primary)" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: "var(--argus-surface)", borderColor: "var(--argus-border)" }}>
                    <SelectItem value="P1" style={{ color: "var(--argus-red)" }}>P1</SelectItem>
                    <SelectItem value="P2" style={{ color: "var(--argus-amber)" }}>P2</SelectItem>
                    <SelectItem value="P3" style={{ color: "var(--argus-text-primary)" }}>P3</SelectItem>
                    <SelectItem value="P4" style={{ color: "var(--argus-text-muted)" }}>P4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-xl border p-4 space-y-4" style={{ background: "var(--argus-surface-2)", borderColor: "var(--argus-border)" }}>
              <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--argus-text-muted)" }}>Override States</h4>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium" style={{ color: "var(--argus-text-primary)" }}>Active Incident Override</Label>
                  <p className="text-xs mt-0.5" style={{ color: "var(--argus-text-muted)" }}>Force active incident irrespective of DB flag.</p>
                </div>
                <Switch checked={formData.active_incident_override} onCheckedChange={(c: boolean) => setFormData({ ...formData, active_incident_override: c })} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium" style={{ color: "var(--argus-text-primary)" }}>Change Freeze Override</Label>
                  <p className="text-xs mt-0.5" style={{ color: "var(--argus-text-muted)" }}>Force change freeze irrespective of DB flag.</p>
                </div>
                <Switch checked={formData.change_freeze_override} onCheckedChange={(c: boolean) => setFormData({ ...formData, change_freeze_override: c })} />
              </div>
            </div>

            <Button
              onClick={handleSimulate}
              disabled={mutation.isPending || !formData.description || !formData.system_id}
              className="w-full gradient-btn font-semibold border-0 text-white h-11"
            >
              {mutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Running Simulation...</>
              ) : (
                <><Play className="w-4 h-4 mr-2 fill-current" />Run Simulation</>
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border overflow-hidden h-full flex flex-col" style={{ background: "var(--argus-surface)", borderColor: "var(--argus-border)", boxShadow: "var(--shadow-card)" }}>
            <div className="px-5 py-3.5 border-b flex items-center gap-2" style={{ background: "var(--argus-surface-2)", borderColor: "var(--argus-border)" }}>
              <GitMerge size={15} style={{ color: "var(--argus-indigo)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--argus-text-primary)" }}>Pipeline Execution Trace</span>
            </div>

            <div className="p-5 flex-1 flex flex-col">
              <AnimatePresence mode="wait">
                {!mutation.data && !mutation.isPending ? (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center text-center py-16">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--argus-indigo-light)" }}>
                      <Play size={22} style={{ color: "var(--argus-indigo)" }} />
                    </div>
                    <p className="text-sm max-w-xs" style={{ color: "var(--argus-text-muted)" }}>Run a dry simulation to see every pipeline stage result without writing to DB.</p>
                  </motion.div>
                ) : mutation.isPending ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-9 h-9 animate-spin" style={{ color: "var(--argus-indigo)" }} />
                    <p className="text-sm font-medium" style={{ color: "var(--argus-indigo)" }}>Evaluating policy + retrieval + confidence...</p>
                  </motion.div>
                ) : mutation.data ? (
                  <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
                    <div className="p-4 rounded-xl border flex items-start gap-3" style={{ background: mutation.data.decision.outcome === "AUTO RESOLVED" ? "var(--argus-emerald-light)" : "var(--argus-amber-light)", borderColor: mutation.data.decision.outcome === "AUTO RESOLVED" ? "rgba(5,150,105,0.2)" : "rgba(217,119,6,0.2)" }}>
                      <ArrowRightCircle size={18} className="mt-0.5 flex-shrink-0" style={{ color: mutation.data.decision.outcome === "AUTO RESOLVED" ? "var(--argus-emerald)" : "var(--argus-amber)" }} />
                      <div>
                        <h4 className="font-semibold text-sm" style={{ color: mutation.data.decision.outcome === "AUTO RESOLVED" ? "var(--argus-emerald)" : "var(--argus-amber)" }}>{mutation.data.decision.outcome}</h4>
                        <p className="text-sm mt-0.5" style={{ color: "var(--argus-text-secondary)" }}>{mutation.data.decision.reason}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {mutation.data.steps.map((s) => {
                        const styles = badgeStyle(s.status);
                        const valueText = typeof s.value === "number"
                          ? (s.value <= 1 && s.value >= 0 ? s.value.toFixed(3) : s.value.toString())
                          : (s.value === null || s.value === undefined ? "-" : String(s.value));
                        const thresholdText = s.threshold === null || s.threshold === undefined ? null : String(s.threshold);

                        return (
                          <div key={s.index} className="rounded-xl border p-3.5" style={{ background: "var(--argus-surface-2)", borderColor: "var(--argus-border)" }}>
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <h4 className="text-sm font-semibold" style={{ color: "var(--argus-text-primary)" }}>{s.index}. {s.name}</h4>
                                <p className="text-xs mt-0.5" style={{ color: "var(--argus-text-muted)" }}>{s.details || "-"}</p>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border" style={{ background: styles.bg, color: styles.color, borderColor: styles.border }}>
                                {s.status}
                              </span>
                            </div>
                            <div className="mt-2 text-xs" style={{ color: "var(--argus-text-secondary)" }}>
                              Value: <span className="font-mono" style={{ color: "var(--argus-text-primary)" }}>{valueText}</span>
                              {thresholdText ? <> | Threshold: <span className="font-mono" style={{ color: "var(--argus-text-primary)" }}>{thresholdText}</span></> : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {mutation.data.candidate_fixes && mutation.data.candidate_fixes.length > 0 ? (
                      <div className="p-4 rounded-xl border" style={{ background: "var(--argus-surface-2)", borderColor: "var(--argus-border)" }}>
                        <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--argus-text-muted)" }}>Top Candidate Fixes</h4>
                        <div className="space-y-2">
                          {mutation.data.candidate_fixes.slice(0, 3).map((fix, idx) => (
                            <button
                              key={`${fix.ticket_id}-${idx}`}
                              type="button"
                              className="w-full text-left rounded-lg border p-2.5"
                              style={{ borderColor: "var(--argus-border)", background: "var(--argus-surface)" }}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-mono" style={{ color: "var(--argus-indigo)" }}>#{fix.ticket_id}</span>
                                <span className="text-[10px] font-semibold" style={{ color: "var(--argus-emerald)" }}>{(fix.similarity_score * 100).toFixed(1)}% match</span>
                              </div>
                              <p className="text-xs mt-1" style={{ color: "var(--argus-text-secondary)" }}>{fix.resolution}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg border text-xs" style={{ background: "var(--argus-surface-2)", borderColor: "var(--argus-border)", color: "var(--argus-text-muted)" }}>
                        No candidate solutions available for this simulation run.
                      </div>
                    )}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WhatIfSimulator;
