"use client";
import { useState } from "react";
import { Search, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { AuditLog } from "@/types/pos";

const PAGE_SIZE = 10;

export function AuditClient({ logs }: { logs: AuditLog[] }) {
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);

  const filtered = logs.filter((l) =>
    !filter || l.action.toLowerCase().includes(filter.toLowerCase()) ||
    (l.tableName ?? "").toLowerCase().includes(filter.toLowerCase())
  );

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedLogs = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const actionColor: Record<string, string> = {
    CREATE: "text-emerald-500", UPDATE: "text-violet-400",
    DELETE: "text-red-500", LOGIN: "text-blue-400",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Filter by action or table…" className="pl-8 h-9" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
        <span className="text-sm text-muted-foreground ml-auto">{filtered.length} entries</span>
      </div>

      {logs.length === 0 ? (
        <div className="border p-12 text-center">
          <Shield className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-sm text-muted-foreground">No audit events yet</p>
        </div>
      ) : (
        <div className="border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Date</TableHead>
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Action</TableHead>
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Table</TableHead>
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Record ID</TableHead>
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLogs.length ? paginatedLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(log.createdAt!)}</TableCell>
                  <TableCell><span className={`text-xs font-medium font-mono ${actionColor[log.action] ?? "text-foreground"}`}>{log.action}</span></TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px] font-mono">{log.tableName ?? "—"}</Badge></TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{log.recordId?.slice(0, 8).toUpperCase() ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{log.ipAddress ?? "—"}</TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={5} className="h-16 text-center text-muted-foreground text-sm">No matching entries.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{filtered.length} entries</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Previous</Button>
            <span className="text-xs">Page {page + 1} of {pageCount}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
