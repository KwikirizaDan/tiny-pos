"use client";
import { useState } from "react";
import {
  useReactTable, getCoreRowModel, getFilteredRowModel,
  getSortedRowModel, getPaginationRowModel, flexRender,
  createColumnHelper, type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, Search, Printer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReceiptPrint } from "@/components/receipt/receipt-print";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Sale } from "@/types/pos";

const col = createColumnHelper<Sale>();

const statusVariant: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  completed: "success", pending: "warning", refunded: "secondary", cancelled: "destructive",
};

export function OrdersClient({
  orders: initialOrders,
  storeName,
  storePhone,
  receiptFooter,
}: {
  orders: Sale[];
  storeName?: string;
  storePhone?: string;
  receiptFooter?: string;
}) {
  const [orders] = useState(initialOrders);
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = [
    col.accessor("id", {
      header: () => <span className="text-xs uppercase tracking-widest text-muted-foreground">Order ID</span>,
      cell: (i) => <span className="font-mono text-xs font-medium">{i.getValue().slice(0, 8).toUpperCase()}</span>,
    }),
    col.accessor("createdAt", {
      header: ({ column }) => (
        <button className="flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Date <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: (i) => <span className="text-sm text-muted-foreground">{formatDate(i.getValue()!)}</span>,
    }),
    col.accessor("status", {
      header: () => <span className="text-xs uppercase tracking-widest text-muted-foreground">Status</span>,
      cell: (i) => (
        <Badge variant={statusVariant[i.getValue() ?? "pending"] ?? "secondary"} className="capitalize text-xs">
          {i.getValue()}
        </Badge>
      ),
    }),
    col.accessor("paymentMethod", {
      header: () => <span className="text-xs uppercase tracking-widest text-muted-foreground">Payment</span>,
      cell: (i) => <span className="text-sm capitalize">{i.getValue()}</span>,
    }),
    col.accessor("totalAmount", {
      header: ({ column }) => (
        <button className="flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Total <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: (i) => <span className="font-medium">{formatCurrency(Number(i.getValue()))}</span>,
    }),
    col.display({
      id: "receipt",
      cell: ({ row }) => (
        <ReceiptPrint
          sale={row.original}
          storeName={storeName ?? "TinyPOS"}
          storePhone={storePhone}
          footer={receiptFooter}
        />
      ),
    }),
  ];

  const table = useReactTable({
    data: orders,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search orders…" className="pl-8 h-9"
            value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} />
        </div>
        <span className="text-sm text-muted-foreground ml-auto">
          {table.getFilteredRowModel().rows.length} orders
        </span>
      </div>

      <div className="border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground text-sm">
                  No orders yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
        <span className="text-xs text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
      </div>
    </div>
  );
}
