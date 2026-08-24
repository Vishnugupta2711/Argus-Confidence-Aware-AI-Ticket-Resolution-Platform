import { useQuery } from "@tanstack/react-query";
import { getDashboardMetrics } from "@/services/metrics";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { AlertCircle, TrendingUp, TrendingDown, Minus, Database, Activity, Zap, Layout } from "lucide-react";
import { motion } from "framer-motion";
import { MetricsSkeleton } from "@/components/ui/skeleton-loaders";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

const KpiCard = ({ label, value, sub, accent, icon: Icon }: any) => (
  <motion.div className={`kpi-card ${accent}`} variants={fadeUp}>
    <div className="flex items-start justify-between mb-3">
      <p className="text-sm font-medium" style={{ color: 'var(--argus-text-muted)' }}>{label}</p>
      <div 
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `var(--argus-${accent}-light)` }}
      >
        <Icon size={16} style={{ color: `var(--argus-${accent})` }} />
      </div>
    </div>
    <div className="text-3xl font-bold tracking-tight metric-value" style={{ color: 'var(--argus-text-primary)' }}>
      {value}
    </div>
    {sub && <p className="text-xs mt-1.5" style={{ color: 'var(--argus-text-muted)' }}>{sub}</p>}
  </motion.div>
);

export const MetricsDashboard = () => {
  const { data: metrics, isLoading, isError } = useQuery({
    queryKey: ["agent-metrics"],
    queryFn: getDashboardMetrics,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return <MetricsSkeleton />;
  }

  if (isError || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <AlertCircle className="h-10 w-10" style={{ color: 'var(--argus-red)' }} />
        <p className="font-medium" style={{ color: 'var(--argus-red)' }}>Failed to load dashboard metrics.</p>
      </div>
    );
  }

  const resolutionRate = metrics.system_performance.total_tickets > 0
    ? Math.round((metrics.system_performance.auto_resolved_count / metrics.system_performance.total_tickets) * 100)
    : 0;

  const pieData = [
    { name: 'Auto-Resolved', value: metrics.system_performance.auto_resolved_count, color: '#059669' },
    { name: 'Escalated', value: metrics.system_performance.escalated_count, color: '#D97706' },
    { name: 'Sandbox Failed', value: metrics.system_performance.sandbox_failures, color: '#DC2626' },
  ];

  const overrideData = Object.entries(metrics.override_analysis).map(([key, value]) => ({
    name: key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
    count: value as number,
  }));

  const getDriftIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp size={14} style={{ color: 'var(--argus-emerald)' }} />;
    if (trend === 'down') return <TrendingDown size={14} style={{ color: 'var(--argus-red)' }} />;
    return <Minus size={14} style={{ color: 'var(--argus-text-muted)' }} />;
  };

  return (
    <motion.div
      className="space-y-6 pb-10"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--argus-text-primary)' }}>
          Metrics Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--argus-text-muted)' }}>
          Real-time system telemetry and autonomous resolution performance
        </p>
      </div>

      {/* KPI Row */}
      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4" variants={stagger} initial="hidden" animate="show">
        <KpiCard
          label="Resolution Rate"
          value={`${resolutionRate}%`}
          sub={`${metrics.system_performance.auto_resolved_count} resolved without humans`}
          accent="emerald"
          icon={Activity}
        />
        <KpiCard
          label="Total Analyzed"
          value={metrics.system_performance.total_tickets}
          sub="Tickets in this window"
          accent="indigo"
          icon={Layout}
        />
        <KpiCard
          label="Knowledge Base"
          value={metrics.knowledge_base_coverage.total_vectors.toLocaleString()}
          sub={`${metrics.knowledge_base_coverage.categories_covered} categories · ${metrics.knowledge_base_coverage.coverage_level} coverage`}
          accent="cyan"
          icon={Database}
        />
        <KpiCard
          label="Avg Similarity"
          value={`${(metrics.knowledge_base_coverage.avg_similarity * 100).toFixed(1)}%`}
          sub="Semantic match confidence"
          accent="amber"
          icon={Zap}
        />
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Pie Chart */}
        <div 
          className="rounded-xl border p-5"
          style={{ background: 'var(--argus-surface)', borderColor: 'var(--argus-border)', boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} style={{ color: 'var(--argus-indigo)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--argus-text-primary)' }}>Resolution Breakdown</h3>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ 
                    background: 'var(--argus-surface)', 
                    border: '1px solid var(--argus-border)', 
                    borderRadius: '8px',
                    color: 'var(--argus-text-primary)',
                    fontSize: '12px',
                    boxShadow: 'var(--shadow-md)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2 mt-2">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                  <span style={{ color: 'var(--argus-text-secondary)' }}>{d.name}</span>
                </div>
                <span className="font-semibold font-mono" style={{ color: 'var(--argus-text-primary)' }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Override Reasons Bar Chart */}
        <div 
          className="rounded-xl border p-5"
          style={{ background: 'var(--argus-surface)', borderColor: 'var(--argus-border)', boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={16} style={{ color: 'var(--argus-amber)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--argus-text-primary)' }}>Override Reasons</h3>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overrideData} layout="vertical" barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--argus-border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--argus-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10, fill: 'var(--argus-text-muted)' }} axisLine={false} tickLine={false} />
                <RechartsTooltip
                  contentStyle={{ 
                    background: 'var(--argus-surface)', 
                    border: '1px solid var(--argus-border)', 
                    borderRadius: '8px', 
                    color: 'var(--argus-text-primary)',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="count" fill="var(--argus-indigo)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Drift Monitor */}
      <div 
        className="rounded-xl border p-5"
        style={{ background: 'var(--argus-surface)', borderColor: 'var(--argus-border)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown size={16} style={{ color: 'var(--argus-red)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--argus-text-primary)' }}>Model Drift Monitor</h3>
          <span className="ml-auto text-xs" style={{ color: 'var(--argus-text-muted)' }}>Last 7 days vs prior period</span>
        </div>

        {Object.keys(metrics.drift_monitor).length === 0 ? (
          <div className="text-center py-8 text-sm" style={{ color: 'var(--argus-text-muted)' }}>
            Insufficient data for drift analysis
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(metrics.drift_monitor).map(([category, data]: [string, any]) => (
              <div 
                key={category} 
                className="flex items-center gap-4 px-4 py-3 rounded-lg border"
                style={{ background: 'var(--argus-surface-2)', borderColor: 'var(--argus-border)' }}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getDriftIcon(data.trend_direction)}
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--argus-text-primary)' }}>
                    {category}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs flex-shrink-0">
                  <div className="text-right">
                    <div style={{ color: 'var(--argus-text-muted)' }}>Signal</div>
                    <div className="font-mono font-semibold" style={{ color: 'var(--argus-text-primary)' }}>
                      {(data.signal_trend * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div style={{ color: 'var(--argus-text-muted)' }}>Baseline</div>
                    <div className="font-mono font-semibold" style={{ color: 'var(--argus-text-primary)' }}>
                      {(data.baseline * 100).toFixed(1)}%
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    data.status === 'stable' 
                      ? 'status-auto_resolved' 
                      : data.status === 'warning' 
                        ? 'status-escalated' 
                        : 'severity-p1'
                  }`}>
                    {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
