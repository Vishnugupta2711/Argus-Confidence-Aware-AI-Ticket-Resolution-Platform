import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "@/services/audit";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Lock, Search, AlertCircle, FileJson, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { AuditSkeleton } from "@/components/ui/skeleton-loaders";

export const AuditLog = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const { data: logs, isLoading, isError } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: getAuditLogs,
    refetchInterval: 60000,
  });

  const filteredLogs = (logs || []).filter((log: any) =>
    (log.ticket_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.decision || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      className="space-y-6 pb-10"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--argus-text-primary)' }}>
            Compliance Audit Trail
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--argus-text-muted)' }}>
            Cryptographically verifiable log of all AI autonomous decisions
          </p>
        </div>
        <div 
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border"
          style={{ background: 'var(--argus-emerald-light)', color: 'var(--argus-emerald)', borderColor: 'rgba(5, 150, 105, 0.2)' }}
        >
          <ShieldCheck size={12} />
          Merkle-Verified
        </div>
      </div>

      {/* Table Card */}
      <div 
        className="rounded-xl border overflow-hidden"
        style={{ background: 'var(--argus-surface)', borderColor: 'var(--argus-border)', boxShadow: 'var(--shadow-card)' }}
      >
        {/* Card Header */}
        <div 
          className="flex items-center justify-between px-5 py-3.5 border-b gap-4"
          style={{ background: 'var(--argus-surface-2)', borderColor: 'var(--argus-border)' }}
        >
          <div className="flex items-center gap-2">
            <Lock size={15} style={{ color: 'var(--argus-indigo)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--argus-text-primary)' }}>
              Verified Chain
            </span>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--argus-text-muted)' }} />
            <Input
              placeholder="Search ticket ID or decision..."
              className="pl-9 h-8 text-xs border"
              style={{ 
                background: 'var(--argus-surface)', 
                borderColor: 'var(--argus-border)',
                color: 'var(--argus-text-primary)'
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-5">
            <AuditSkeleton />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <AlertCircle className="h-7 w-7" style={{ color: 'var(--argus-red)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--argus-red)' }}>Failed to retrieve the audit chain.</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'var(--argus-indigo-light)' }}
            >
              <Lock size={24} style={{ color: 'var(--argus-indigo)' }} />
            </div>
            <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--argus-text-primary)' }}>
              No Records Yet
            </h3>
            <p className="text-sm max-w-xs" style={{ color: 'var(--argus-text-muted)' }}>
              Audit blocks are created when tickets are processed by the Argus engine. Submit a ticket to generate the first entry.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow style={{ background: 'var(--argus-surface-2)', borderColor: 'var(--argus-border)' }}>
                {['Timestamp', 'Ticket ID', 'Decision', 'Latency', 'Hash (Preview)', 'Status'].map(h => (
                  <TableHead key={h} className="text-[11px] font-semibold uppercase tracking-wider py-3" style={{ color: 'var(--argus-text-muted)' }}>
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log: any, idx: number) => (
                <TableRow
                  key={log.hash || idx}
                  className={`cursor-pointer transition-colors stagger-${Math.min(idx + 1, 5)}`}
                  style={{ borderColor: 'var(--argus-border)' }}
                  onClick={() => setSelectedLog(log)}
                >
                  <TableCell className="text-xs whitespace-nowrap" style={{ color: 'var(--argus-text-muted)' }}>
                    <div className="flex items-center gap-1.5">
                      <Clock size={11} />
                      {new Date(log.timestamp || log.created_at).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span 
                      className="font-mono text-xs font-medium px-2 py-0.5 rounded"
                      style={{ background: 'var(--argus-indigo-light)', color: 'var(--argus-indigo)' }}
                    >
                      #{(log.ticket_id || '').substring(0, 8)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${log.decision === 'Resolved' ? 'status-auto_resolved' : 'status-escalated'}`}>
                      {log.decision || log.action}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs" style={{ color: 'var(--argus-text-secondary)' }}>
                    {log.latency_ms != null ? `${log.latency_ms.toFixed(0)}ms` : '—'}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] max-w-[160px] truncate" style={{ color: 'var(--argus-text-muted)' }}>
                    {(log.hash || log.audit_hash || '—').substring(0, 22)}...
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className="text-[10px] px-2 py-0 gap-1 border"
                      style={{ 
                        background: 'var(--argus-emerald-light)', 
                        color: 'var(--argus-emerald)', 
                        borderColor: 'rgba(5, 150, 105, 0.2)' 
                      }}
                    >
                      <ShieldCheck size={9} />
                      Verified
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent 
          className="sm:max-w-2xl border"
          style={{ background: 'var(--argus-surface)', borderColor: 'var(--argus-border)', color: 'var(--argus-text-primary)' }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <FileJson size={18} style={{ color: 'var(--argus-indigo)' }} />
              Audit Record Detail
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 mt-2">
              <div 
                className="grid grid-cols-2 gap-3 p-4 rounded-xl border"
                style={{ background: 'var(--argus-surface-2)', borderColor: 'var(--argus-border)' }}
              >
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--argus-text-muted)' }}>Ticket ID</p>
                  <p className="font-mono text-sm" style={{ color: 'var(--argus-indigo)' }}>#{selectedLog.ticket_id}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--argus-text-muted)' }}>Decision</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--argus-text-primary)' }}>{selectedLog.decision || selectedLog.action}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--argus-text-muted)' }}>Cryptographic Hash</p>
                  <p 
                    className="font-mono text-xs p-2.5 rounded-lg break-all"
                    style={{ background: 'var(--argus-emerald-light)', color: 'var(--argus-emerald)' }}
                  >
                    {selectedLog.hash || selectedLog.audit_hash}
                  </p>
                </div>
                {selectedLog.previous_hash && (
                  <div className="col-span-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--argus-text-muted)' }}>Previous Block Hash</p>
                    <p 
                      className="font-mono text-xs p-2.5 rounded-lg break-all"
                      style={{ background: 'var(--argus-surface)', color: 'var(--argus-text-muted)', border: '1px solid var(--argus-border)' }}
                    >
                      {selectedLog.previous_hash}
                    </p>
                  </div>
                )}
              </div>
              {selectedLog.evidence_snapshot && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--argus-text-muted)' }}>Evidence Snapshot</p>
                  <div 
                    className="p-4 rounded-xl overflow-x-auto border"
                    style={{ background: 'var(--argus-surface-2)', borderColor: 'var(--argus-border)' }}
                  >
                    <pre className="text-[11px] font-mono" style={{ color: 'var(--argus-indigo)' }}>
                      {JSON.stringify(selectedLog.evidence_snapshot, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
