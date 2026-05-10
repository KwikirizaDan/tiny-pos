"use client";
import { useState } from "react";
import {
  useReactTable, getCoreRowModel, getFilteredRowModel,
  getSortedRowModel, getPaginationRowModel, flexRender,
  createColumnHelper, type SortingState, type ColumnFiltersState,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ProductDialog } from "./product-dialog";
import { formatCurrency } from "@/lib/utils";
import type { Product, Category } from "@/types/pos";
import { deleteProduct } from "@/app/(dashboard)/products/actions";

const col = createColumnHelper<Product>();

export function ProductsClient({
  products: initialProducts,
  categories,
  vendorId,
}: {
  products: Product[];
  categories: Category[];
  vendorId: string;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      setProducts((p) => p.filter((x) => x.id !== id));
      toast.success("Product deleted");
    } catch (err) {
      toast.error("Failed to delete product");
    }
  };

  const handleSave = (product: Product) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = product;
        return next;
      }
      return [product, ...prev];
    });
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "—";
    return categories.find((c) => c.id === categoryId)?.name ?? "—";
  };

  const columns = [
    col.accessor("name", {
      header: ({ column }) => (
        <button className="flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Name <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: (info) => (
        <div>
          <p className="font-medium text-sm">{info.getValue()}</p>
          {info.row.original.sku && (
            <p className="text-xs text-muted-foreground">SKU: {info.row.original.sku}</p>
          )}
        </div>
      ),
    }),
    col.accessor("categoryId", {
      header: () => <span className="text-xs uppercase tracking-widest text-muted-foreground">Category</span>,
      cell: (info) => (
        <Badge variant="outline" className="text-xs capitalize">
          {getCategoryName(info.getValue())}
        </Badge>
      ),
    }),
    col.accessor("price", {
      header: ({ column }) => (
        <button className="flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Price <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: (info) => <span className="font-medium">{formatCurrency(Number(info.getValue()))}</span>,
    }),
    col.accessor("stockQuantity", {
      header: () => <span className="text-xs uppercase tracking-widest text-muted-foreground">Stock</span>,
      cell: (info) => {
        const qty = info.getValue() ?? 0;
        const low = info.row.original.lowStockAlert ?? 5;
        return (
          <Badge variant={qty === 0 ? "destructive" : qty <= low ? "warning" : "success"}>
            {qty} units
          </Badge>
        );
      },
    }),
    col.accessor("isActive", {
      header: () => <span className="text-xs uppercase tracking-widest text-muted-foreground">Status</span>,
      cell: (info) => (
        <Badge variant={info.getValue() ? "success" : "secondary"}>
          {info.getValue() ? "Active" : "Inactive"}
        </Badge>
      ),
    }),
    col.display({
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7"
            onClick={() => { setEditProduct(row.original); setDialogOpen(true); }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => setConfirmDelete(row.original)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: products,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products…" className="pl-8 h-9"
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
          />
        </div>
        <Button onClick={() => { setEditProduct(null); setDialogOpen(true); }} size="sm">
          <Plus className="h-4 w-4" /> Add product
        </Button>
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
                  No products yet. Add your first product.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{table.getFilteredRowModel().rows.length} products total</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <span className="text-xs">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editProduct}
        categories={categories}
        vendorId={vendorId}
        onSave={handleSave}
      />

      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete product "{confirmDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>No</Button>
            <Button variant="destructive" onClick={() => { if (confirmDelete) handleDelete(confirmDelete.id); setConfirmDelete(null); }}>Yes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
