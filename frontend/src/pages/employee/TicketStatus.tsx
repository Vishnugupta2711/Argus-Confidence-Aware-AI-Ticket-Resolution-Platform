import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTicketStatus, escalateTicketByUser } from "@/services/tickets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, AlertTriangle, Clock, Zap, Send, Users, Loader2, Timer } from "lucide-react";
import { motion } from "framer-motion";
import { TicketStatusSkeleton } from "@/components/ui/skeleton-loaders";

export const TicketStatus = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => getTicketStatus(id!),
    refetchInterval: (query) => query.state.data?.status === "processing" ? 3000 : false,
    enabled: !!id,
  });

  const escalateMutation = useMutation({
    mutationFn: () => escalateTicketByUser(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
    },
  });

  if (isLoading) {
    return <TicketStatusSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-4 mt-16">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: 'var(--argus-red-light)' }}
        >
          <AlertTriangle className="h-6 w-6" style={{ color: 'var(--argus-red)' }} />
        </div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--argus-text-primary)' }}>
          Ticket Not Found
        </h2>
        <p className="text-sm" style={{ color: 'var(--argus-text-muted)' }}>
          Could not find ticket #{id}. It may not exist or the service is unreachable.
        </p>
        <Button asChild variant="outline" className="mt-2">
          <Link to="/employee"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
        </Button>
      </div>
    );
  }

  const statusConfig = {
    processing: {
      accent: 'indigo',
      icon: <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--argus-indigo)' }} />,
      title: "Processing Request",
      desc: "Your ticket is being analyzed across policy checks, retrieval, and confidence signals.",
      badgeClass: 'status-processing',
    },
    auto_resolved: {
      accent: 'emerald',
      icon: <CheckCircle2 className="w-6 h-6" style={{ color: 'var(--argus-emerald)' }} />,
      title: "Resolved Automatically",
      desc: "A matching solution was found and applied.",
      badgeClass: 'status-auto_resolved',
    },
    escalated: {
      accent: 'amber',
      icon: <Users className="w-6 h-6" style={{ color: 'var(--argus-amber)' }} />,
      title: "Escalated",
      desc: "Routed to an IT specialist for manual review.",
      badgeClass: 'status-escalated',
    },
    resolved: {
      accent: 'emerald',
      icon: <CheckCircle2 className="w-6 h-6" style={{ color: 'var(--argus-emerald)' }} />,
      title: "Resolved",
      desc: "Your ticket has been resolved by the IT team.",
      badgeClass: 'status-resolved',
    },
  };

  const cfg = statusConfig[data.status as keyof typeof statusConfig] || statusConfig.escalated;

  const steps = [
    { label: 'Submitted', done: true, icon: Send },
    { label: 'Analysis', done: data.status !== 'processing', current: data.status === 'processing', icon: Zap },
    {
      label: data.status === 'auto_resolved' ? 'Resolved' : data.status === 'escalated' ? 'Escalated' : 'Pending',
      done: data.status !== 'processing',
      icon: data.status === 'auto_resolved' || data.status === 'resolved' ? CheckCircle2 : Clock
    },
  ];

  return (
    <motion.div
      className="max-w-2xl mx-auto space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >

      {/* Back link */}
      <Link
        to="/employee"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors hover:opacity-70"
        style={{ color: 'var(--argus-text-muted)' }}
      >
        <ArrowLeft size={14} />
        Back
      </Link>

      {/* Status Card */}
      <div
        className="rounded-xl border p-6"
        style={{ background: 'var(--argus-surface)', borderColor: 'var(--argus-border)', boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `var(--argus-${cfg.accent}-light)` }}
          >
            {cfg.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--argus-text-primary)' }}>
                {cfg.title}
              </h2>
              <Badge variant="outline" className={cfg.badgeClass}>
                {data.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-sm" style={{ color: 'var(--argus-text-muted)' }}>{cfg.desc}</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex items-center mt-6 pt-6 border-t" style={{ borderColor: 'var(--argus-border)' }}>
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${step.current ? 'animate-pulse' : ''}`}
                    style={{
                      background: step.done
                        ? `var(--argus-${cfg.accent})`
                        : step.current
                          ? `var(--argus-${cfg.accent}-light)`
                          : 'var(--argus-surface-2)',
                      color: step.done
                        ? '#fff'
                        : step.current
                          ? `var(--argus-${cfg.accent})`
                          : 'var(--argus-text-muted)',
                      border: step.current ? `2px solid var(--argus-${cfg.accent})` : 'none'
                    }}
                  >
                    <Icon size={14} />
                  </div>
                  <span
                    className="text-[11px] font-medium whitespace-nowrap"
                    style={{
                      color: step.done || step.current
                        ? `var(--argus-${cfg.accent})`
                        : 'var(--argus-text-muted)'
                    }}
                  >
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className="flex-1 h-px mx-3 mb-5"
                    style={{
                      background: steps[i + 1].done
                        ? `var(--argus-${cfg.accent})`
                        : 'var(--argus-border)'
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Details Card */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: 'var(--argus-surface)', borderColor: 'var(--argus-border)', boxShadow: 'var(--shadow-sm)' }}
      >
        {/* Card header */}
        <div
          className="px-5 py-3.5 border-b flex items-center justify-between"
          style={{ background: 'var(--argus-surface-2)', borderColor: 'var(--argus-border)' }}
        >
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--argus-text-primary)' }}>
              Ticket #{data.id.substring(0, 8)}
            </h3>
            <p className="text-[11px] mt-0.5 font-mono" style={{ color: 'var(--argus-text-muted)' }}>
              {new Date(data.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg" style={{ background: 'var(--argus-surface-2)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--argus-text-muted)' }}>
                Category
              </p>
              <p className="text-sm font-medium" style={{ color: 'var(--argus-text-primary)' }}>
                {data.category}
              </p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'var(--argus-surface-2)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--argus-text-muted)' }}>
                Priority
              </p>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded severity-${data.severity.toLowerCase()}`}>
                {data.severity}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--argus-text-muted)' }}>
              Description
            </p>
            <div
              className="text-sm leading-relaxed whitespace-pre-wrap p-3 rounded-lg"
              style={{ background: 'var(--argus-surface-2)', color: 'var(--argus-text-secondary)' }}
            >
              {data.description}
            </div>
          </div>

          {/* Resolution */}
          {data.status === "auto_resolved" && data.resolution && (
            <div
              className="p-4 rounded-lg border"
              style={{ background: 'var(--argus-emerald-light)', borderColor: 'rgba(5, 150, 105, 0.15)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={14} style={{ color: 'var(--argus-emerald)' }} />
                <h4 className="text-sm font-semibold" style={{ color: 'var(--argus-emerald)' }}>
                  Resolution
                </h4>
              </div>
              <div
                className="text-sm leading-relaxed whitespace-pre-wrap"
                style={{ color: 'var(--argus-text-secondary)' }}
              >
                {data.resolution}
              </div>

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
                    className="w-full sm:w-auto h-8 text-xs bg-white hover:bg-red-50 border-gray-200 hover:border-red-400 font-semibold"
                    style={{ backgroundColor: 'var(--argus-red-light)', color: 'var(--argus-red)', borderColor: 'var(--argus-red)' }}
                  >
                    {escalateMutation.isPending ? "Escalating..." : "✗ No, Escalate"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Latency footer */}
        {data.latency_ms && (
          <div
            className="px-5 py-3 border-t flex items-center gap-2 text-xs"
            style={{ background: 'var(--argus-surface-2)', borderColor: 'var(--argus-border)', color: 'var(--argus-text-muted)' }}
          >
            <Timer size={12} style={{ color: 'var(--argus-indigo)' }} />
            Processed in
            <span className="font-mono font-semibold" style={{ color: 'var(--argus-indigo)' }}>
              {data.latency_ms.toFixed(0)}ms
            </span>
          </div>
        )}
      </div>

      {/* Submit another */}
      <div className="text-center pt-2">
        <Link
          to="/employee"
          className="text-[13px] font-medium transition-colors hover:opacity-80"
          style={{ color: 'var(--argus-indigo)' }}
        >
          Submit another request &rarr;
        </Link>
      </div>
    </motion.div>
  );
};
