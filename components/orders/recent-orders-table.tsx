import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Sale } from "@/types/pos";

const statusVariant: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  completed: "success", pending: "warning", refunded: "secondary", cancelled: "destructive",
};

export function RecentOrdersTable({ orders }: { orders: Sale[] }) {
  if (!orders.length) {
    return (
      <div className="border p-8 text-center text-sm text-muted-foreground">
        No sales yet. Start selling from the{" "}
        <a href="/pos" className="text-primary underline underline-offset-2">POS Terminal</a>.
      </div>
    );
  }
  return (
    <div className="border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">Order ID</TableHead>
            <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">Date</TableHead>
            <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</TableHead>
            <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">Payment</TableHead>
            <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-mono text-xs font-medium">{order.id.slice(0, 8).toUpperCase()}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{formatDate(order.createdAt!)}</TableCell>
              <TableCell>
                <Badge variant={statusVariant[order.status ?? "pending"] ?? "secondary"} className="capitalize text-[10px]">
                  {order.status}
                </Badge>
              </TableCell>
              <TableCell className="text-xs capitalize">{order.paymentMethod}</TableCell>
              <TableCell className="text-right font-medium text-sm">{formatCurrency(Number(order.totalAmount))}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
