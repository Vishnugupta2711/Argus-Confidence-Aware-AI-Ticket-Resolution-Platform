import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { getEscalatedTickets } from "@/services/agent";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, ShieldCheck, ArrowRight, Inbox, Radio, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { QueueSkeleton } from "@/components/ui/skeleton-loaders";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const row = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
};

export const EscalatedQueue = () => {
  const navigate = useNavigate();
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [waitingFilter, setWaitingFilter] = useState<string>("all");
  const [urgentFilter, setUrgentFilter] = useState<boolean>(false);

  const { data: tickets, isLoading, isError } = useQuery({
    queryKey: ["agent-queue"],
    queryFn: getEscalatedTickets,
    refetchInterval: 10000,
  });

  const formatTimeWaiting = (dateString: string) => {
    const diff = new Date().getTime() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
  };

  const getMinutesWaiting = (dateString: string) => {
    const diff = new Date().getTime() - new Date(dateString).getTime();
    return Math.floor(diff / 60000);
  };

  const getEscalationReason = (ticket: { escalation_reason?: string | null; evidence_card?: { escalation_reason?: string } }) => {
    return ticket.escalation_reason || ticket.evidence_card?.escalation_reason || "Escalated by policy gate";
  };

  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    
    return tickets.filter(ticket => {
      // Severity filter
      if (severityFilter !== "all" && ticket.severity !== severityFilter) return false;
      
      // Waiting time filter
      if (waitingFilter !== "all") {
        const minutesWaiting = getMinutesWaiting(ticket.created_at);
        if (waitingFilter === "30min" && minutesWaiting > 30) return false;
        if (waitingFilter === "1hour" && minutesWaiting > 60) return false;
        if (waitingFilter === "1day" && minutesWaiting > 1440) return false;
      }
      
      // Urgent filter
      if (urgentFilter && !ticket.is_urgent) return false;
      
      return true;
    });
  }, [tickets, severityFilter, waitingFilter, urgentFilter]);

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--argus-text-primary)' }}>
            Escalated Queue
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--argus-text-muted)' }}>
            Tickets requiring human review — sorted by priority
          </p>
        </div>
        {filteredTickets && filteredTickets.length > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3, type: 'spring' }}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border"
            style={{ 
              background: 'var(--argus-red-light)', 
              color: 'var(--argus-red)',
              borderColor: 'rgba(220, 38, 38, 0.2)'
            }}
          >
            <Radio size={14} className="animate-pulse" />
            {filteredTickets.length} Pending
          </motion.div>
        )}
      </div>

      {/* Filters */}
      <div 
        className="flex gap-3 flex-wrap items-center p-4 rounded-xl border"
        style={{ background: 'var(--argus-surface-2)', borderColor: 'var(--argus-border)' }}
      >
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[160px] h-9" style={{ background: 'var(--argus-surface)', borderColor: 'var(--argus-border)' }}>
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent style={{ background: 'var(--argus-surface)', borderColor: 'var(--argus-border)' }}>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="P1">P1 (Critical)</SelectItem>
            <SelectItem value="P2">P2 (High)</SelectItem>
            <SelectItem value="P3">P3 (Medium)</SelectItem>
            <SelectItem value="P4">P4 (Low)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={waitingFilter} onValueChange={setWaitingFilter}>
          <SelectTrigger className="w-[160px] h-9" style={{ background: 'var(--argus-surface)', borderColor: 'var(--argus-border)' }}>
            <SelectValue placeholder="Waiting" />
          </SelectTrigger>
          <SelectContent style={{ background: 'var(--argus-surface)', borderColor: 'var(--argus-border)' }}>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="30min">Last 30 min</SelectItem>
            <SelectItem value="1hour">Last 1 hour</SelectItem>
            <SelectItem value="1day">Last 24 hours</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={() => setUrgentFilter(!urgentFilter)}
          variant={urgentFilter ? "default" : "outline"}
          className={`h-9 ${urgentFilter ? 'border-0 text-white' : ''}`}
          style={urgentFilter ? { background: 'var(--argus-red)' } : { borderColor: 'var(--argus-border)', color: 'var(--argus-text-primary)' }}
        >
          {urgentFilter ? '✓ Urgent Only' : 'Urgent'}
        </Button>

        {(severityFilter !== 'all' || waitingFilter !== 'all' || urgentFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSeverityFilter('all'); setWaitingFilter('all'); setUrgentFilter(false); }}
            style={{ color: 'var(--argus-text-muted)' }}
          >
            <X size={14} className="mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Table Card */}
      <div 
        className="rounded-xl border overflow-hidden hover-lift"
        style={{ background: 'var(--argus-surface)', borderColor: 'var(--argus-border)', boxShadow: 'var(--shadow-card)' }}
      >
        {/* Card Header */}
        <div 
          className="flex items-center justify-between px-5 py-3.5 border-b"
          style={{ background: 'var(--argus-surface-2)', borderColor: 'var(--argus-border)' }}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} style={{ color: 'var(--argus-indigo)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--argus-text-primary)' }}>
              Pending Review
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--argus-text-muted)' }}>
            <span className="live-indicator" />
            Auto-updates every 10s
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="p-5">
            <QueueSkeleton />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <AlertCircle className="h-8 w-8" style={{ color: 'var(--argus-red)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--argus-red)' }}>Failed to load the escalated queue.</p>
            <p className="text-xs" style={{ color: 'var(--argus-text-muted)' }}>Please check your connection and try again.</p>
          </div>
        ) : !filteredTickets || filteredTickets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center py-24 text-center px-4"
          >
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'var(--argus-emerald-light)' }}
            >
              <Inbox size={28} style={{ color: 'var(--argus-emerald)' }} />
            </div>
            <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--argus-text-primary)' }}>
              {tickets && tickets.length === 0 ? 'Queue is Empty' : 'No tickets match filters'}
            </h3>
            <p className="text-sm max-w-xs" style={{ color: 'var(--argus-text-muted)' }}>
              {tickets && tickets.length === 0 ? 'All tickets have been resolved or are being auto-processed. You\'re fully caught up!' : 'Try adjusting your filter criteria.'}
            </p>
          </motion.div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow style={{ background: 'var(--argus-surface-2)', borderColor: 'var(--argus-border)' }}>
                {['Ticket ID', 'Description', 'Category', 'Severity', 'Urgent', 'Escalation Reason', 'Waiting'].map(h => (
                  <TableHead 
                    key={h}
                    className="text-[11px] font-semibold uppercase tracking-wider py-3"
                    style={{ color: 'var(--argus-text-muted)' }}
                  >
                    {h}
                  </TableHead>
                ))}
                <TableHead />
              </TableRow>
            </TableHeader>
            <motion.tbody variants={stagger} initial="hidden" animate="show">
              {filteredTickets.map((ticket) => (
                <motion.tr
                  key={ticket.ticket_id}
                  variants={row}
                  className="cursor-pointer group border-b transition-colors duration-150"
                  style={{ borderColor: 'var(--argus-border)' }}
                  onClick={() => navigate(`/agent/ticket/${ticket.ticket_id}`, { state: { from: '/agent' } })}
                  whileHover={{ backgroundColor: 'var(--argus-surface-2)' }}
                >
                  <TableCell>
                    <span 
                      className="font-mono text-xs font-medium px-2 py-1 rounded"
                      style={{ 
                        background: 'var(--argus-indigo-light)', 
                        color: 'var(--argus-indigo)'
                      }}
                    >
                      #{ticket.ticket_id.substring(0, 8)}
                    </span>
                  </TableCell>
                  <TableCell 
                    className="max-w-[260px] text-sm font-medium"
                    style={{ color: 'var(--argus-text-primary)' }}
                  >
                    <span className="line-clamp-2">{ticket.description}</span>
                  </TableCell>
                  <TableCell>
                    <span 
                      className="text-xs px-2.5 py-1 rounded-full border font-medium"
                      style={{ 
                        background: 'var(--argus-surface-2)', 
                        color: 'var(--argus-text-secondary)',
                        borderColor: 'var(--argus-border)'
                      }}
                    >
                      {ticket.category}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide severity-${ticket.severity.toLowerCase()}`}>
                      {ticket.severity}
                    </span>
                    {ticket.user_tier === "VIP" && (
                      <span 
                        className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase"
                        style={{ background: '#EDE9FE', color: '#7C3AED' }}
                      >
                        VIP
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {ticket.is_urgent ? (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide"
                        style={{ background: 'var(--argus-red)', color: '#fff' }}
                      >
                        URGENT
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="flex items-start gap-1.5">
                      <AlertCircle size={12} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--argus-amber)' }} />
                      <span className="text-xs line-clamp-2" style={{ color: 'var(--argus-text-secondary)' }}>
                        {getEscalationReason(ticket)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums text-xs" style={{ color: 'var(--argus-text-muted)' }}>
                    {formatTimeWaiting(ticket.created_at)}
                  </TableCell>
                  <TableCell>
                    <ArrowRight 
                      size={16} 
                      className="opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5"
                      style={{ color: 'var(--argus-indigo)' }} 
                    />
                  </TableCell>
                </motion.tr>
              ))}
            </motion.tbody>
          </Table>
        )}
      </div>
    </motion.div>
  );
};
