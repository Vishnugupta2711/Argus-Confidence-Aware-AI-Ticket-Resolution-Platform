import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { submitTicket, escalateTicketByUser } from "@/services/tickets";
import { getSystems } from "@/services/config";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  UploadCloud,
  AlertCircle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  GitBranch,
  Users,
  Clock,
  Zap,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

type System = {
  id: string;
  name: string;
};

export const SubmitTicket = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedEmail = searchParams.get("email") || "";

  const [systems, setSystems] = useState<System[]>([]);
  const [loadingSystems, setLoadingSystems] = useState(true);
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);
  const [submittedStatus, setSubmittedStatus] = useState<string | null>(null);
  const [submittedResolution, setSubmittedResolution] = useState<string | null>(null);
  const [submittedLatency, setSubmittedLatency] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    description: "",
    category: "",
    user_email: preselectedEmail,
    system_id: "",
    urgent: false,
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchSystems = async () => {
      try {
        setLoadingSystems(true);
        const data = await getSystems();
        setSystems(data);
      } catch (error) {
        console.error("Failed to load systems:", error);
        toast.error("Failed to load systems", {
          description: "Please refresh and try again.",
        });
      } finally {
        setLoadingSystems(false);
      }
    };

    fetchSystems();
  }, []);

  const mutation = useMutation({
    mutationFn: submitTicket,
    onSuccess: (data) => {
      toast.success("Request submitted", {
        description: `Ticket ${data.ticket_id} is being processed.`,
      });
      setSubmittedTicketId(data.ticket_id);
      setSubmittedStatus(data.status);
      setSubmittedResolution(data.resolution || null);
      setSubmittedLatency(data.decision_latency_ms ?? null);
    },
    onError: (error: unknown) => {
      let description = "Please check your connection and try again.";
      if (axios.isAxiosError(error)) {
        const apiDetail = error.response?.data?.detail;
        if (typeof apiDetail === "string" && apiDetail.trim()) {
          description = apiDetail;
        }
      }
      toast.error("Submission failed", {
        description,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("description", formData.description);
    if (formData.category) fd.append("category", formData.category);
    fd.append("urgent", formData.urgent.toString());
    fd.append("user_email", formData.user_email);
    fd.append("system_id", formData.system_id);
    if (file) fd.append("file", file);
    mutation.mutate(fd);
  };

  const categories = [
    "Password Reset", "Email Access", "Hardware Issue",
    "Software Installation", "Network Connectivity",
    "Authentication (2FA)", "VPN Access", "Application Bug",
  ];

  const toggleUrgent = () => {
    setFormData((prev) => ({ ...prev, urgent: !prev.urgent }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-7"
    >
      <section
        className="relative overflow-hidden rounded-2xl border px-5 py-6 sm:px-7 sm:py-7"
        style={{
          background:
            "linear-gradient(140deg, rgba(79,70,229,0.08) 0%, rgba(8,145,178,0.06) 38%, rgba(255,255,255,0.95) 100%)",
          borderColor: "var(--argus-border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="absolute -top-16 right-[-90px] w-[250px] h-[250px] rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(99,102,241,0.16)" }} />

        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-[0.14em] mb-4"
              style={{ borderColor: "var(--argus-border-subtle)", color: "var(--argus-indigo)", background: "rgba(79,70,229,0.08)" }}>
              <Sparkles size={12} />
              Employee Request Console
            </div>
            <h1 className="text-[30px] sm:text-[36px] font-bold leading-[1.05] tracking-[-0.02em]" style={{ color: "var(--argus-text-primary)" }}>
              Submit a new IT request
            </h1>
            <p className="mt-3 text-[15px] sm:text-[16px] leading-relaxed" style={{ color: "var(--argus-text-secondary)" }}>
              Share issue details once. Argus evaluates policy, similarity, and sandbox safety before auto-resolution or escalation.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-left w-full max-w-[420px]">
            <div className="rounded-xl border px-3 py-2.5 min-h-[72px] flex flex-col justify-between" style={{ borderColor: "var(--argus-border)", background: "var(--argus-surface)" }}>
              <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--argus-text-muted)" }}>Checks</p>
              <p className="text-[20px] font-bold mt-1" style={{ color: "var(--argus-text-primary)" }}>5</p>
            </div>
            <div className="rounded-xl border px-3 py-2.5 min-h-[72px] flex flex-col justify-between" style={{ borderColor: "var(--argus-border)", background: "var(--argus-surface)" }}>
              <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--argus-text-muted)" }}>Signals</p>
              <p className="text-[20px] font-bold mt-1" style={{ color: "var(--argus-text-primary)" }}>3</p>
            </div>
            <div className="rounded-xl border px-3 py-2.5 min-h-[72px] flex flex-col justify-between" style={{ borderColor: "var(--argus-border)", background: "var(--argus-surface)" }}>
              <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--argus-text-muted)" }}>Mode</p>
              <p className="text-[13px] font-semibold mt-1" style={{ color: "var(--argus-text-primary)" }}>HITL + Auto</p>
            </div>
          </div>
        </div>
      </section>

      {submittedTicketId ? (
        <TicketResultCard
          ticketId={submittedTicketId}
          status={submittedStatus!}
          resolution={submittedResolution}
          latencyMs={submittedLatency}
          onViewTicket={() => navigate(`/agent/ticket/${submittedTicketId}`)}
          onReturn={() => navigate("/employee")}
          onSubmitAnother={() => {
            setSubmittedTicketId(null);
            setSubmittedStatus(null);
            setSubmittedResolution(null);
            setSubmittedLatency(null);
            setFormData({ ...formData, description: "", category: "" });
            setFile(null);
          }}
          onStatusChange={(newStatus) => setSubmittedStatus(newStatus)}
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
          <div
            className="rounded-2xl border overflow-hidden"
          style={{
            background: "var(--argus-surface)",
            borderColor: "var(--argus-border)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div className="h-[3px]" style={{ background: "linear-gradient(90deg, var(--argus-indigo), var(--argus-cyan))" }} />

          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="space-y-2 md:col-span-7">
                <Label htmlFor="email" className="text-[13px] font-semibold" style={{ color: "var(--argus-text-secondary)" }}>
                  Work Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={formData.user_email}
                  onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
                  className="h-11"
                  style={{
                    background: "var(--argus-surface-2)",
                    borderColor: "var(--argus-border)",
                    color: "var(--argus-text-primary)",
                  }}
                />
              </div>

              <div className="space-y-2 md:col-span-5">
                <Label className="text-[13px] font-semibold" style={{ color: "var(--argus-text-secondary)" }}>
                  System
                </Label>
                <Select value={formData.system_id} onValueChange={(val) => setFormData({ ...formData, system_id: val })}>
                  <SelectTrigger className="h-11" style={{ background: "var(--argus-surface-2)", borderColor: "var(--argus-border)", color: "var(--argus-text-primary)" }} disabled={loadingSystems}>
                    <SelectValue placeholder={loadingSystems ? "Loading systems..." : "Select a system"} />
                  </SelectTrigger>
                  <SelectContent style={{ background: "var(--argus-surface)", borderColor: "var(--argus-border)" }}>
                    {systems.map((system) => (
                      <SelectItem key={system.id} value={system.id} style={{ color: "var(--argus-text-primary)" }}>
                        {system.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="space-y-2 md:col-span-7">
                  <Label className="text-[13px] font-semibold" style={{ color: "var(--argus-text-secondary)" }}>
                    Category (optional — AI will detect)
                  </Label>
                  <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                    <SelectTrigger className="h-11" style={{ background: "var(--argus-surface-2)", borderColor: "var(--argus-border)", color: "var(--argus-text-primary)" }}>
                      <SelectValue placeholder="Select issue category" />
                    </SelectTrigger>
                    <SelectContent style={{ background: "var(--argus-surface)", borderColor: "var(--argus-border)" }}>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat} style={{ color: "var(--argus-text-primary)" }}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[12px] opacity-70" style={{ color: "var(--argus-text-muted)" }}>
                    Leave blank and Argus will classify automatically.
                  </p>
              </div>

              <button
                type="button"
                onClick={toggleUrgent}
                className={`md:col-span-5 emp-urgent-panel min-h-[98px] ${formData.urgent ? "is-active" : ""}`}
                aria-pressed={formData.urgent}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-left">
                    <p className="text-[13px] font-semibold" style={{ color: "var(--argus-text-primary)" }}>
                      Mark as urgent
                    </p>
                    <p className="text-[11.5px] mt-1 leading-snug" style={{ color: "var(--argus-text-muted)" }}>
                      Prioritizes queue visibility for manual review.
                    </p>
                  </div>
                  <Switch
                    id="urgent-toggle"
                    checked={formData.urgent}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, urgent: checked }))}
                    onClick={(e) => e.stopPropagation()}
                    className="emp-urgent-switch"
                  />
                </div>
              </button>
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] font-semibold" style={{ color: "var(--argus-text-secondary)" }}>
                Issue description
              </Label>
              <Textarea
                required
                rows={5}
                placeholder="Include error text, what changed, steps to reproduce, and impacted users or systems..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="resize-none"
                style={{ background: "var(--argus-surface-2)", borderColor: "var(--argus-border)", color: "var(--argus-text-primary)" }}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] font-semibold" style={{ color: "var(--argus-text-secondary)" }}>
                Attachment <span style={{ color: "var(--argus-text-muted)", fontWeight: 500 }}>(optional)</span>
              </Label>
              <div
                className="border-2 border-dashed rounded-xl min-h-[112px] px-4 py-4 text-center cursor-pointer transition-all flex flex-col justify-center"
                style={{
                  borderColor: file ? "var(--argus-indigo)" : "var(--argus-border)",
                  background: file ? "var(--argus-indigo-light)" : "transparent",
                }}
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <UploadCloud className="mx-auto h-[18px] w-[18px] mb-1.5" style={{ color: file ? "var(--argus-indigo)" : "var(--argus-text-muted)" }} />
                <p className="text-[12.5px] font-medium leading-snug" style={{ color: file ? "var(--argus-indigo)" : "var(--argus-text-muted)" }}>
                  {file ? file.name : "Drop screenshot/log or click to upload"}
                </p>
                <input id="file-upload" type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>
            </div>

            {mutation.isError && (
              <div
                className="flex items-center gap-2.5 p-3 rounded-lg border text-sm"
                style={{ background: "var(--argus-red-light)", borderColor: "rgba(220, 38, 38, 0.15)", color: "var(--argus-red)" }}
              >
                <AlertCircle size={14} />
                Failed to submit. Please check backend connection.
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-[14px] font-semibold emp-btn-primary"
              disabled={mutation.isPending || !formData.description || !formData.user_email || !formData.system_id}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing request...
                </>
              ) : (
                <>
                  Submit Request
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        <div className="space-y-4 xl:sticky xl:top-[76px]">
          <div className="emp-context-card">
            <h3 className="text-[13px] font-semibold mb-4" style={{ color: "var(--argus-text-primary)" }}>
              Processing flow
            </h3>
            <div className="space-y-4">
              {[
                { icon: ShieldCheck, title: "Policy checks", desc: "Severity, VIP, incident, and freeze gates." },
                { icon: Cpu, title: "Confidence engine", desc: "Similarity + consistency + category accuracy." },
                { icon: CheckCircle2, title: "Outcome", desc: "Auto-resolve or route to IT agent with evidence." },
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--argus-indigo-light)", color: "var(--argus-indigo)" }}>
                    <item.icon size={14} />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold leading-tight" style={{ color: "var(--argus-text-primary)" }}>
                      {item.title}
                    </p>
                    <p className="text-[11.5px] mt-1 leading-snug" style={{ color: "var(--argus-text-muted)" }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="emp-context-card">
            <div className="flex items-center gap-2 mb-1">
              <GitBranch size={13} style={{ color: "var(--argus-indigo)" }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--argus-text-muted)" }}>
                Decision mode
              </span>
            </div>
            <p className="text-lg font-bold tracking-tight" style={{ color: "var(--argus-text-primary)" }}>
              Deterministic + confidence-based
            </p>
            <p className="text-[11px] mt-1" style={{ color: "var(--argus-text-muted)" }}>
              Auto-resolve only when all checks pass, otherwise route to agent review.
            </p>
          </div>

          <div className="emp-context-card">
            <h3 className="text-[13px] font-semibold mb-3" style={{ color: "var(--argus-text-primary)" }}>
              Faster triage tips
            </h3>
            <ul className="space-y-2.5 text-[12px]" style={{ color: "var(--argus-text-muted)" }}>
              <li className="flex items-start gap-2">
                <Sparkles size={11} className="mt-0.5 flex-shrink-0" style={{ color: "var(--argus-indigo)" }} />
                Include exact error messages verbatim
              </li>
              <li className="flex items-start gap-2">
                <Sparkles size={11} className="mt-0.5 flex-shrink-0" style={{ color: "var(--argus-indigo)" }} />
                Mention when the issue first started
              </li>
              <li className="flex items-start gap-2">
                <Sparkles size={11} className="mt-0.5 flex-shrink-0" style={{ color: "var(--argus-indigo)" }} />
                Add screenshots if the issue is visual
              </li>
            </ul>
          </div>
        </div>
        </div>
      )}
    </motion.div>
  );
};

// ── Ticket Result Card ───────────────────────────────────────────

interface TicketResultCardProps {
  ticketId: string;
  status: string;
  resolution: string | null;
  latencyMs?: number | null;
  onViewTicket: () => void;
  onReturn: () => void;
  onSubmitAnother: () => void;
  onStatusChange?: (newStatus: string) => void;
}

const STATUS_CONFIG = {
  auto_resolved: {
    heading: "Your issue has been fixed.",
    subheading: "Argus identified a matching solution and resolved it automatically.",
    icon: CheckCircle2,
    accent: "#059669",
    accentLight: "#D1FAE5",
    accentBorder: "rgba(5,150,105,0.25)",
    badgeLabel: "Auto-Resolved",
  },
  escalated: {
    heading: "Ticket escalated to an IT agent.",
    subheading: "A human specialist has been notified and will review your request shortly.",
    icon: Users,
    accent: "#D97706",
    accentLight: "#FEF3C7",
    accentBorder: "rgba(217,119,6,0.25)",
    badgeLabel: "Escalated",
  },
  resolved: {
    heading: "Your ticket has been resolved.",
    subheading: "The IT team has addressed your request.",
    icon: CheckCircle2,
    accent: "#059669",
    accentLight: "#D1FAE5",
    accentBorder: "rgba(5,150,105,0.25)",
    badgeLabel: "Resolved",
  },
  processing: {
    heading: "Your request is being analyzed.",
    subheading: "Argus is evaluating policy, similarity, and confidence signals.",
    icon: Zap,
    accent: "#4F46E5",
    accentLight: "#EEF2FF",
    accentBorder: "rgba(79,70,229,0.25)",
    badgeLabel: "Processing",
  },
};

function TicketResultCard({
  ticketId,
  status,
  resolution,
  latencyMs,
  onViewTicket,
  onReturn,
  onSubmitAnother,
  onStatusChange,
}: TicketResultCardProps) {
  const escalateMutation = useMutation({
    mutationFn: () => escalateTicketByUser(ticketId),
    onSuccess: () => {
      onStatusChange?.("escalated");
      toast.success("Escalated to Agent");
    },
    onError: (error: any) => {
      toast.error("Escalation failed", {
        description: error.response?.data?.detail || "Please try again later."
      });
    }
  });

  const cfg =
    STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.processing;
  const ResultIcon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-xl mx-auto"
    >
      {/* White card on argus-bg */}
      <div className="bg-white rounded-2xl border border-[#E2E5EE] overflow-hidden" style={{ boxShadow: "var(--shadow-lg)" }}>

        {/* Top accent strip — status color */}
        <div className="h-[3px] w-full" style={{ background: cfg.accent }} />

        <div className="px-7 py-8 space-y-5">

          {/* Icon + heading */}
          <div className="flex items-start gap-4">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 20 }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: cfg.accentLight, color: cfg.accent }}
            >
              <ResultIcon size={28} />
            </motion.div>

            <div className="flex-1 min-w-0 pt-1">
              <h2 className="text-[22px] font-bold tracking-tight text-[#0F172A] mb-1">
                {cfg.heading}
              </h2>
              <p className="text-[14px] leading-relaxed text-[#475569]">
                {cfg.subheading}
              </p>
            </div>
          </div>

          {/* Ticket ID row */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#F0F1F7] border border-[#E2E5EE] rounded-xl">
            <div className="flex items-center gap-3">
              <span
                className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg"
                style={{ background: cfg.accentLight, color: cfg.accent }}
              >
                #{ticketId.slice(0, 8).toUpperCase()}
              </span>
              <span className="text-[12px] text-[#94A3B8]">
                <Clock size={11} className="inline mr-1" />
                {new Date().toLocaleTimeString()}
              </span>
            </div>
            <span
              className="text-[11px] font-bold px-3 py-1 rounded-full border"
              style={{
                background: cfg.accentLight,
                color: cfg.accent,
                borderColor: cfg.accentBorder,
              }}
            >
              {cfg.badgeLabel}
            </span>
          </div>

          {/* Resolution / Escalation panel */}
          {(status === "auto_resolved" || status === "resolved") && resolution ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
              className="space-y-2"
            >
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">
                Resolution applied
              </p>
              <div
                className="p-4 rounded-xl leading-relaxed text-[14px] text-[#0F172A]"
                style={{
                  background: cfg.accentLight,
                  border: `1px solid ${cfg.accentBorder}`,
                }}
              >
                {resolution}
              </div>
              {latencyMs != null && (
                <p className="text-[11px] text-[#94A3B8]">
                  Resolved in{" "}
                  <span className="font-mono font-bold" style={{ color: cfg.accent }}>
                    {latencyMs.toFixed(0)}ms
                  </span>
                </p>
              )}
              
              {/* Escalation Prompt */}
              {status === "auto_resolved" && (
                <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: 'rgba(5, 150, 105, 0.15)' }}>
                  <span className="text-xs font-semibold" style={{ color: 'var(--argus-emerald)' }}>
                    Did this fix your issue?
                  </span>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => escalateMutation.mutate()}
                      disabled={escalateMutation.isPending}
                      className="w-full sm:w-auto h-8 text-xs font-semibold hover:bg-red-50"
                      style={{ backgroundColor: 'var(--argus-red-light)', color: 'var(--argus-red)', borderColor: 'var(--argus-red)' }}
                    >
                      {escalateMutation.isPending ? "Escalating..." : "✗ No, Escalate"}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
              className="flex items-start gap-3 p-4 rounded-xl"
              style={{
                background: cfg.accentLight,
                border: `1px solid ${cfg.accentBorder}`,
              }}
            >
              <ResultIcon size={16} className="mt-0.5 flex-shrink-0" style={{ color: cfg.accent }} />
              <div>
                <p className="text-[13px] font-bold" style={{ color: cfg.accent }}>
                  {status === "processing" ? "Analysis in progress" : "Human escalation triggered"}
                </p>
                <p className="text-[12px] mt-0.5 text-[#475569]">
                  {status === "processing"
                    ? "The Argus engine is running policy, confidence, and sandbox checks. You'll be notified once a decision is reached."
                    : "An IT specialist has been automatically notified. Expect a response within your SLA window."}
                </p>
              </div>
            </motion.div>
          )}

          {/* Divider */}
          <div className="h-px w-full bg-[#E2E5EE]" />

          {/* Action buttons — always visible */}
          <div className="flex items-center gap-3">
            {/* View Ticket — solid colored button */}
            <button
              onClick={onViewTicket}
              className="flex-1 h-11 rounded-xl font-semibold text-[14px] text-white flex items-center justify-center gap-2 cursor-pointer transition-all"
              style={{
                background: cfg.accent,
                boxShadow: `0 4px 14px ${cfg.accent}30`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = "brightness(1.1)";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = `0 6px 20px ${cfg.accent}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "";
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = `0 4px 14px ${cfg.accent}30`;
              }}
            >
              View Ticket
              <ArrowRight size={14} />
            </button>

            {/* User Select — outline button */}
            <button
              onClick={onReturn}
              className="flex-1 h-11 px-4 rounded-xl font-medium text-[14px] text-[#475569] flex items-center justify-center gap-2 cursor-pointer border border-[#E2E5EE] bg-white hover:border-[#4F46E5] hover:text-[#4F46E5] transition-all"
            >
              <ArrowLeft size={13} />
              User Select
            </button>
          </div>

          {/* Submit another */}
          <div className="text-center pt-1">
            <button
              onClick={onSubmitAnother}
              className="text-[13px] font-medium text-[#4F46E5] hover:underline cursor-pointer bg-transparent border-none"
            >
              Submit another request &rarr;
            </button>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
