"use client";
import { useState } from "react";
import { useReactTable, getCoreRowModel, getFilteredRowModel, getSortedRowModel, getPaginationRowModel, flexRender, createColumnHelper, type SortingState } from "@tanstack/react-table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, ArrowUpDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CustomerDialog } from "./customer-dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Customer } from "@/db/schema";
import { deleteCustomer } from "@/app/(dashboard)/customers/actions";

const col = createColumnHelper<Customer>();

export function CustomersClient({ customers: init }: { customers: Customer[] }) {
  const [customers, setCustomers] = useState(init);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteCustomer(id);
      setCustomers((p) => p.filter((c) => c.id !== id));
      toast.success("Customer deleted");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to delete");
    }
  };

  const handleSave = (customer: Customer) => {
    setCustomers((prev) => {
      const idx = prev.findIndex((c) => c.id === customer.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = customer; return next; }
      return [customer, ...prev];
    });
  };

  const columns = [
    col.accessor("name", {
      header: ({ column }) => <button className="flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Name <ArrowUpDown className="h-3 w-3" /></button>,
      cell: (i) => <span className="font-medium text-sm">{i.getValue() ?? "—"}</span>,
    }),
    col.accessor("phone", {
      header: () => <span className="text-xs uppercase tracking-widest text-muted-foreground">Phone</span>,
      cell: (i) => <span className="text-sm">{i.getValue() ?? "—"}</span>,
    }),
    col.accessor("email", {
      header: () => <span className="text-xs uppercase tracking-widest text-muted-foreground">Email</span>,
      cell: (i) => <span className="text-sm text-muted-foreground">{i.getValue() ?? "—"}</span>,
    }),
    col.accessor("loyaltyPoints", {
      header: () => <span className="text-xs uppercase tracking-widest text-muted-foreground">Points</span>,
      cell: (i) => <span className="text-sm font-medium text-violet-400">{i.getValue() ?? 0} pts</span>,
    }),
    col.accessor("totalSpent", {
      header: ({ column }) => <button className="flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Total Spent <ArrowUpDown className="h-3 w-3" /></button>,
      cell: (i) => <span className="font-medium text-sm">{formatCurrency(i.getValue() ?? 0)}</span>,
    }),
    col.accessor("createdAt", {
      header: () => <span className="text-xs uppercase tracking-widest text-muted-foreground">Joined</span>,
      cell: (i) => <span className="text-xs text-muted-foreground">{formatDate(i.getValue()!)}</span>,
    }),
    col.display({
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditCustomer(row.original); setDialogOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(row.original.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({ data: customers, columns, state: { sorting, globalFilter }, onSortingChange: setSorting, onGlobalFilterChange: setGlobalFilter, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageSize: 20 } } });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search customers…" className="pl-8 h-9" value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} />
        </div>
        <Button size="sm" onClick={() => { setEditCustomer(null); setDialogOpen(true); }}><Plus className="h-4 w-4" /> Add customer</Button>
      </div>

      {customers.length === 0 && !globalFilter ? (
        <div className="border p-12 text-center">
          <Users className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-sm text-muted-foreground">No customers yet</p>
        </div>
      ) : (
        <div className="border">
          <Table>
            <TableHeader>{table.getHeaderGroups().map((hg) => <TableRow key={hg.id} className="hover:bg-transparent">{hg.headers.map((h) => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => <TableRow key={row.id}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground text-sm">No customers found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{table.getFilteredRowModel().rows.length} customers</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
          <span className="text-xs">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
        </div>
      </div>

      <CustomerDialog open={dialogOpen} onOpenChange={setDialogOpen} customer={editCustomer} onSave={handleSave} />
    </div>
  );
}
