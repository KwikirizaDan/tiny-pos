"use client";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Download, FileSpreadsheet, FileText, TrendingUp,
  ShoppingCart, DollarSign, Banknote, CreditCard, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ReportData {
  summary: {
    totalSales: number;
    totalRevenue: number;
    totalTax: number;
    totalDiscount: number;
    avgSale: number;
    cashSales: number;
    cardSales: number;
  };
  sales: any[];
  topProducts: { productName: string; totalQty: number; totalRevenue: string }[];
  daily: { date: string; totalRevenue: string; totalCount: number }[];
}

export function ReportsClient({ vendorName }: { vendorName: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?from=${from}&to=${to}`);
      if (!res.ok) throw new Error("Failed to load report");
      setData(await res.json());
    } catch { toast.error("Failed to load report"); }
    finally { setLoading(false); }
  }, [from, to]);

  // ── PDF Export ──────────────────────────────────────────────────
  const exportPDF = async () => {
    if (!data) return;
    setExporting("pdf");
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const VIO = [124, 58, 237];
      const DARK = [9, 9, 11];
      const GRAY = [113, 113, 122];
      const W = 210;

      // Header bar
      doc.setFillColor(...(DARK as [number,number,number]));
      doc.rect(0, 0, W, 28, "F");
      doc.setFillColor(...(VIO as [number,number,number]));
      doc.rect(0, 28, W, 1.5, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("TinyPOS — Sales Report", 14, 12);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...(GRAY as [number,number,number]));
      doc.text(`${vendorName}  ·  ${from} to ${to}  ·  Generated ${new Date().toLocaleString()}`, 14, 21);

      let y = 38;

      // Summary cards
      const summaryItems = [
        { label: "Total Sales", value: String(data.summary.totalSales) },
        { label: "Total Revenue", value: formatCurrency(data.summary.totalRevenue) },
        { label: "Avg. Sale", value: formatCurrency(data.summary.avgSale) },
        { label: "Tax Collected", value: formatCurrency(data.summary.totalTax) },
        { label: "Cash Sales", value: String(data.summary.cashSales) },
        { label: "Card Sales", value: String(data.summary.cardSales) },
      ];

      const cardW = (W - 28 - 10) / 3;
      summaryItems.forEach((item, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = 14 + col * (cardW + 5);
        const cy = y + row * 22;
        doc.setFillColor(24, 24, 27);
        doc.roundedRect(x, cy, cardW, 18, 2, 2, "F");
        doc.setTextColor(...(GRAY as [number,number,number]));
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(item.label.toUpperCase(), x + 4, cy + 6);
        doc.setTextColor(139, 92, 246);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(item.value, x + 4, cy + 14);
      });

      y += 50;

      // Top products table
      doc.setTextColor(...(DARK as [number,number,number]));
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Top Products", 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [["Product", "Qty Sold", "Revenue"]],
        body: data.topProducts.map((p) => [
          p.productName,
          String(p.totalQty),
          formatCurrency(Number(p.totalRevenue)),
        ]),
        headStyles: { fillColor: VIO as [number, number, number], textColor: [255,255,255], fontStyle: "bold", fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: [30,30,30] },
        alternateRowStyles: { fillColor: [244,244,245] },
        columnStyles: { 2: { halign: "right" } },
        margin: { left: 14, right: 14 },
      });

      y = (doc as any).lastAutoTable.finalY + 10;

      // Daily breakdown
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...(DARK as [number,number,number]));
      doc.text("Daily Breakdown", 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [["Date", "Sales Count", "Revenue"]],
        body: data.daily.map((d) => [
          d.date,
          String(d.totalCount),
          formatCurrency(Number(d.totalRevenue)),
        ]),
        headStyles: { fillColor: VIO as [number, number, number], textColor: [255,255,255], fontStyle: "bold", fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: [30,30,30] },
        alternateRowStyles: { fillColor: [244,244,245] },
        columnStyles: { 2: { halign: "right" } },
        margin: { left: 14, right: 14 },
      });

      y = (doc as any).lastAutoTable.finalY + 10;

      // All sales table
      if (y < 240) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...(DARK as [number,number,number]));
        doc.text("All Transactions", 14, y);
        y += 4;

        autoTable(doc, {
          startY: y,
          head: [["Order ID", "Date", "Payment", "Status", "Total"]],
          body: data.sales.slice(0, 100).map((s) => [
            s.id.slice(0, 8).toUpperCase(),
            formatDate(s.createdAt),
            s.paymentMethod ?? "—",
            s.status ?? "—",
            formatCurrency(Number(s.totalAmount)),
          ]),
          headStyles: { fillColor: VIO as [number, number, number], textColor: [255,255,255], fontStyle: "bold", fontSize: 8 },
          bodyStyles: { fontSize: 7, textColor: [30,30,30] },
          alternateRowStyles: { fillColor: [244,244,245] },
          columnStyles: { 4: { halign: "right" } },
          margin: { left: 14, right: 14 },
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFillColor(...(DARK as [number,number,number]));
        doc.rect(0, 287, W, 10, "F");
        doc.setTextColor(...(GRAY as [number,number,number]));
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(`TinyPOS · by Binary Labs · Page ${i} of ${pageCount}`, 14, 293);
        doc.text(new Date().toLocaleString(), W - 14, 293, { align: "right" });
      }

      doc.save(`tinypos-report-${from}-to-${to}.pdf`);
      toast.success("PDF downloaded");
    } catch (e: any) {
      console.error(e);
      toast.error("PDF export failed");
    } finally {
      setExporting(null);
    }
  };

  // ── Excel Export ────────────────────────────────────────────────
  const exportExcel = async () => {
    if (!data) return;
    setExporting("excel");
    try {
      const { default: ExcelJS } = await import("exceljs");

      const wb = new ExcelJS.Workbook();
      wb.creator = "TinyPOS";

      // Summary sheet
      const ws = wb.addWorksheet("Summary");
      ws.addRow(["TinyPOS Sales Report"]);
      ws.addRow([`Store: ${vendorName}`]);
      ws.addRow([`Period: ${from} to ${to}`]);
      ws.addRow([`Generated: ${new Date().toLocaleString()}`]);
      ws.addRow([]);
      ws.addRow(["Metric", "Value"]);
      ws.addRow(["Total Sales", data.summary.totalSales]);
      ws.addRow(["Total Revenue (UGX)", Number(data.summary.totalRevenue)]);
      ws.addRow(["Average Sale (UGX)", Number(data.summary.avgSale.toFixed(0))]);
      ws.addRow(["Tax Collected (UGX)", Number(data.summary.totalTax)]);
      ws.addRow(["Discount Given (UGX)", Number(data.summary.totalDiscount)]);
      ws.addRow(["Cash Sales", data.summary.cashSales]);
      ws.addRow(["Card Sales", data.summary.cardSales]);
      ws.getColumn(1).width = 28;
      ws.getColumn(2).width = 20;

      // Transactions sheet
      const wsTx = wb.addWorksheet("Transactions");
      wsTx.addRow(["Order ID", "Date", "Payment Method", "Status", "Subtotal (UGX)", "Tax (UGX)", "Discount (UGX)", "Total (UGX)"]);
      data.sales.forEach((s) =>
        wsTx.addRow([
          s.id.slice(0, 8).toUpperCase(),
          formatDate(s.createdAt),
          s.paymentMethod ?? "",
          s.status ?? "",
          Number(s.subtotal),
          Number(s.taxAmount ?? 0),
          Number(s.discountAmount ?? 0),
          Number(s.totalAmount),
        ])
      );
      wsTx.getColumn(1).width = 14;
      wsTx.getColumn(2).width = 20;
      wsTx.getColumn(3).width = 16;
      wsTx.getColumn(4).width = 12;
      [5, 6, 7, 8].forEach((i) => (wsTx.getColumn(i).width = 16));

      // Top Products sheet
      const wsProd = wb.addWorksheet("Top Products");
      wsProd.addRow(["Product Name", "Qty Sold", "Revenue (UGX)"]);
      data.topProducts.forEach((p) =>
        wsProd.addRow([p.productName, p.totalQty, Number(p.totalRevenue)])
      );
      wsProd.getColumn(1).width = 30;
      wsProd.getColumn(2).width = 12;
      wsProd.getColumn(3).width = 18;

      // Daily sheet
      const wsDaily = wb.addWorksheet("Daily Breakdown");
      wsDaily.addRow(["Date", "Sales Count", "Revenue (UGX)"]);
      data.daily.forEach((d) =>
        wsDaily.addRow([d.date, d.totalCount, Number(d.totalRevenue)])
      );
      wsDaily.getColumn(1).width = 14;
      wsDaily.getColumn(2).width = 14;
      wsDaily.getColumn(3).width = 18;

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tinypos-report-${from}-to-${to}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Excel downloaded");
    } catch (e: any) {
      console.error(e);
      toast.error("Excel export failed");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Date range + generate */}
      <div className="border bg-card p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40 h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40 h-9" />
          </div>
          <Button onClick={fetchReport} disabled={loading} size="sm">
            <Calendar className="h-4 w-4" />
            {loading ? "Loading…" : "Generate report"}
          </Button>
          {data && (
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={exportExcel} disabled={exporting === "excel"}>
                <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                {exporting === "excel" ? "Exporting…" : "Excel"}
              </Button>
              <Button variant="outline" size="sm" onClick={exportPDF} disabled={exporting === "pdf"}>
                <FileText className="h-4 w-4 text-red-400" />
                {exporting === "pdf" ? "Exporting…" : "PDF"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {!data && !loading && (
        <div className="border p-12 text-center text-muted-foreground">
          <BarChart3 className="h-8 w-8 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Select a date range and click Generate report</p>
        </div>
      )}

      {loading && (
        <div className="border p-12 text-center text-muted-foreground text-sm">
          Loading report data…
        </div>
      )}

      {data && !loading && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { title: "Total Sales", value: String(data.summary.totalSales), icon: ShoppingCart, color: "text-violet-400" },
              { title: "Revenue", value: formatCurrency(data.summary.totalRevenue), icon: DollarSign, color: "text-emerald-500" },
              { title: "Avg. Sale", value: formatCurrency(data.summary.avgSale), icon: TrendingUp, color: "text-violet-400" },
              { title: "Tax", value: formatCurrency(data.summary.totalTax), icon: DollarSign, color: "text-zinc-400" },
              { title: "Cash", value: String(data.summary.cashSales), icon: Banknote, color: "text-amber-400" },
              { title: "Card", value: String(data.summary.cardSales), icon: CreditCard, color: "text-blue-400" },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title} className="border bg-card">
                  <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
                    <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{stat.title}</CardTitle>
                    <Icon className={`h-3.5 w-3.5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="text-lg font-bold tracking-tight">{stat.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top products */}
            <div className="border bg-card">
              <div className="px-4 py-3 border-b">
                <p className="font-medium text-sm">Top Products</p>
              </div>
              <div className="p-4 space-y-2">
                {data.topProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No data</p>
                ) : data.topProducts.map((p, i) => {
                  const max = Number(data.topProducts[0].totalRevenue);
                  const pct = max > 0 ? (Number(p.totalRevenue) / max) * 100 : 0;
                  return (
                    <div key={p.productName}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground w-4">{i + 1}</span>
                          <span className="font-medium truncate max-w-[140px]">{p.productName}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{p.totalQty} sold</span>
                          <span className="font-medium text-foreground">{formatCurrency(Number(p.totalRevenue))}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Daily breakdown */}
            <div className="border bg-card">
              <div className="px-4 py-3 border-b">
                <p className="font-medium text-sm">Daily Breakdown</p>
              </div>
              <div className="divide-y max-h-72 overflow-y-auto">
                {data.daily.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No data</p>
                ) : data.daily.map((d) => (
                  <div key={d.date} className="px-4 py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{d.date}</p>
                      <p className="text-xs text-muted-foreground">{d.totalCount} sale{d.totalCount !== 1 ? "s" : ""}</p>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(Number(d.totalRevenue))}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Transactions table */}
          <div className="border bg-card">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <p className="font-medium text-sm">All Transactions</p>
              <Badge variant="secondary">{data.sales.length} records</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground">Order ID</th>
                    <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground">Date</th>
                    <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground">Payment</th>
                    <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground">Status</th>
                    <th className="text-right p-3 text-[10px] uppercase tracking-widest text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sales.slice(0, 50).map((s) => (
                    <tr key={s.id} className="border-b hover:bg-muted/40">
                      <td className="p-3 font-mono text-xs">{s.id.slice(0, 8).toUpperCase()}</td>
                      <td className="p-3 text-xs text-muted-foreground">{formatDate(s.createdAt)}</td>
                      <td className="p-3 text-xs capitalize">{s.paymentMethod}</td>
                      <td className="p-3">
                        <Badge variant={s.status === "completed" ? "success" : "secondary"} className="text-[10px] capitalize">{s.status}</Badge>
                      </td>
                      <td className="p-3 text-right font-medium">{formatCurrency(Number(s.totalAmount))}</td>
                    </tr>
                  ))}
                  {data.sales.length > 50 && (
                    <tr><td colSpan={5} className="p-3 text-center text-xs text-muted-foreground">Showing 50 of {data.sales.length} — download Excel for full data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function BarChart3({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  );
}
