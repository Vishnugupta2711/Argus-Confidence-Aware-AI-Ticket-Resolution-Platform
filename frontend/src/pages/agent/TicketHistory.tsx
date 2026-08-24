import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { getAllTickets } from "@/services/agent";
import { Table, TableCell, TableHead, TableHeader, TableRow, TableBody } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { QueueSkeleton } from "@/components/ui/skeleton-loaders";
import { X, Lock } from "lucide-react";

export const TicketHistory = () => {
  const navigate = useNavigate();
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const { data: tickets, isLoading, isError } = useQuery({
    queryKey: ["agent-all-tickets"],
    queryFn: getAllTickets,
    refetchInterval: 15000,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  const getDaysAgo = (dateString: string) => {
    const ticketDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - ticketDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    
    return tickets.filter(ticket => {
      // Severity filter
      if (severityFilter !== "all" && ticket.severity !== severityFilter) return false;
      
      // Status filter
      if (statusFilter !== "all" && ticket.status !== statusFilter) return false;
      
      // Date filter
      if (dateFilter !== "all") {
        const daysAgo = getDaysAgo(ticket.created_at);
        if (dateFilter === "today" && daysAgo > 1) return false;
        if (dateFilter === "week" && daysAgo > 7) return false;
        if (dateFilter === "month" && daysAgo > 30) return false;
      }
      
      return true;
    });
  }, [tickets, severityFilter, statusFilter, dateFilter]);

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Ticket History</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            View all tickets across the system, including system auto-resolutions and human-escalated cases.
          </p>
        </div>
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

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-9" style={{ background: 'var(--argus-surface)', borderColor: 'var(--argus-border)' }}>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent style={{ background: 'var(--argus-surface)', borderColor: 'var(--argus-border)' }}>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="auto_resolved">Auto Resolved</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[160px] h-9" style={{ background: 'var(--argus-surface)', borderColor: 'var(--argus-border)' }}>
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent style={{ background: 'var(--argus-surface)', borderColor: 'var(--argus-border)' }}>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>

        {(severityFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSeverityFilter('all'); setStatusFilter('all'); setDateFilter('all'); }}
            style={{ color: 'var(--argus-text-muted)' }}
          >
            <X size={14} className="mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="rounded-xl border bg-card/50 backdrop-blur-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <QueueSkeleton />
        ) : isError ? (
          <div className="p-8 text-center text-destructive">
            Failed to load ticket history. Please check your connection.
          </div>
        ) : !filteredTickets || filteredTickets.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
            <h4 className="text-lg font-medium text-foreground mb-1">{tickets && tickets.length === 0 ? 'No tickets found' : 'No tickets match filters'}</h4>
            <p className="max-w-sm">{tickets && tickets.length === 0 ? 'No tickets have been recorded in the system yet.' : 'Try adjusting your filter criteria.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead className="w-[120px]">Ticket ID</TableHead>
                  <TableHead className="w-[140px]">Date</TableHead>
                  <TableHead className="w-[200px]">User</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">Severity</TableHead>
                  <TableHead className="w-[120px] text-right">Status</TableHead>
                  <TableHead className="w-[100px] text-center">Audit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((t) => (
                  <TableRow 
                    key={t.id}
                    className="cursor-pointer group hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/agent/ticket/${t.id}`, { state: { from: '/agent/history' } })}
                  >
                    <TableCell className="font-medium text-xs font-mono text-muted-foreground">
                      {t.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDate(t.created_at)}
                    </TableCell>
                    <TableCell className="text-sm truncate max-w-[200px]">
                      {t.users?.email || t.user_id}
                    </TableCell>
                    <TableCell className="text-sm truncate max-w-[300px]">
                      {t.description}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide"
                        style={
                          t.severity === "P1" ? { background: '#FEE2E2', color: '#DC2626' } :
                          t.severity === "P2" ? { background: '#FFEDD5', color: '#EA580C' } :
                          { background: 'var(--argus-surface-2)', color: 'var(--argus-text-muted)' }
                        }
                      >
                        {t.severity}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide"
                        style={
                          t.status === "resolved" || t.status === "auto_resolved" ? { background: 'rgba(16,185,129,0.1)', color: '#059669' } :
                          t.status === "escalated" ? { background: 'rgba(245,158,11,0.1)', color: '#92400E' } :
                          { background: 'var(--argus-surface-2)', color: 'var(--argus-text-muted)' }
                        }
                      >
                        {t.status.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="text-center relative group">
                      {t.audit_log ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <Lock size={14} style={{ color: '#059669' }} />
                          <span className="text-xs font-medium" style={{ color: '#059669' }}>Verified</span>
                          {/* Tooltip */}
                          <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 z-10 pointer-events-none"
                            style={{ background: '#1E293B', color: 'white', borderRadius: '8px', whiteSpace: 'nowrap' }}>
                            <div className="font-mono text-[10px]">
                              SHA-256: {t.audit_log.audit_hash?.slice(0, 16)}...
                            </div>
                            <div className="text-[10px]" style={{ color: '#CBD5E1' }}>
                              {new Date(t.audit_log.created_at).toLocaleString(undefined, {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" style={{ borderTopColor: '#1E293B' }} />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--argus-text-muted)' }}>—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TicketHistory;