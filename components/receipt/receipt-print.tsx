"use client";
import { useState } from "react";
import { Printer } from "lucide-react";
import type { Sale, SaleItem } from "@/types/pos";

interface Props {
  sale: Sale;
  items?: SaleItem[];
  storeName: string;
  storePhone?: string;
  footer?: string;
}

export function ReceiptPrint({ sale, items = [], storeName, storePhone, footer }: Props) {
  const [printing, setPrinting] = useState(false);

  const formatUGX = (v: string | number) =>
    "UGX " + new Intl.NumberFormat("en-UG", { minimumFractionDigits: 0 }).format(Number(v));

  const handlePrint = () => {
    setPrinting(true);
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) { setPrinting(false); return; }

    const subtotal = Number(sale.subtotal);
    const tax = Number(sale.taxAmount ?? 0);
    const discount = Number(sale.discountAmount ?? 0);
    const total = Number(sale.totalAmount);
    const change = 0; // can be extended later

    win.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>Receipt ${sale.id.slice(0, 8).toUpperCase()}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      color: #000;
      background: #fff;
      padding: 8px;
      width: 280px;
      margin: 0 auto;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .big { font-size: 16px; font-weight: bold; }
    .divider { border: none; border-top: 1px dashed #000; margin: 8px 0; }
    .row { display: flex; justify-content: space-between; margin: 3px 0; }
    .row-total { display: flex; justify-content: space-between; margin: 4px 0; font-weight: bold; font-size: 14px; }
    .barcode { display: flex; justify-content: center; gap: 1.5px; margin: 8px 0; }
    .barcode span { display: inline-block; height: 32px; background: #000; }
    .footer { text-align: center; font-size: 10px; color: #555; margin-top: 8px; }
    @media print {
      body { width: 100%; padding: 0; }
      @page { margin: 4mm; size: 80mm auto; }
    }
  </style>
</head>
<body>
  <div class="center">
    <div class="big">${storeName}</div>
    ${storePhone ? `<div>${storePhone}</div>` : ""}
    <div>Kampala, Uganda</div>
  </div>
  <hr class="divider">
  <div class="row"><span>Order ID</span><span>${sale.id.slice(0, 8).toUpperCase()}</span></div>
  <div class="row"><span>Date</span><span>${new Date(sale.createdAt!).toLocaleDateString("en-UG")}</span></div>
  <div class="row"><span>Time</span><span>${new Date(sale.createdAt!).toLocaleTimeString("en-UG", { hour: "2-digit", minute: "2-digit" })}</span></div>
  <div class="row"><span>Payment</span><span style="text-transform:capitalize">${sale.paymentMethod}</span></div>
  <hr class="divider">
  <div class="bold" style="margin-bottom:4px">Items</div>
  ${items.length > 0
    ? items.map((item) => `
      <div class="row">
        <span>${item.productName} × ${item.quantity}</span>
        <span>${formatUGX(item.subtotal)}</span>
      </div>`).join("")
    : `<div class="row"><span>Items not available</span><span>—</span></div>`
  }
  <hr class="divider">
  <div class="row"><span>Subtotal</span><span>${formatUGX(subtotal)}</span></div>
  ${tax > 0 ? `<div class="row"><span>Tax</span><span>${formatUGX(tax)}</span></div>` : ""}
  ${discount > 0 ? `<div class="row"><span>Discount</span><span>-${formatUGX(discount)}</span></div>` : ""}
  <div class="row-total"><span>TOTAL</span><span>${formatUGX(total)}</span></div>
  <hr class="divider">
  <div class="barcode">
    <span style="width:1px"></span><span style="width:3px"></span><span style="width:1px"></span>
    <span style="width:2px"></span><span style="width:1px"></span><span style="width:3px"></span>
    <span style="width:2px"></span><span style="width:1px"></span><span style="width:3px"></span>
    <span style="width:1px"></span><span style="width:2px"></span><span style="width:3px"></span>
    <span style="width:1px"></span><span style="width:2px"></span><span style="width:1px"></span>
    <span style="width:3px"></span><span style="width:1px"></span><span style="width:2px"></span>
  </div>
  <div class="footer">
    ${footer ?? "Thank you for shopping with us!"}
    <br>Powered by TinyPOS · Binary Labs
  </div>
  <script>
    window.onload = function() { window.print(); window.close(); };
  </script>
</body>
</html>`);

    win.document.close();
    setTimeout(() => setPrinting(false), 1000);
  };

  return (
    <button
      onClick={handlePrint}
      disabled={printing}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border hover:bg-accent transition-colors disabled:opacity-50 font-mono"
    >
      <Printer className="h-3.5 w-3.5" />
      {printing ? "Opening…" : "Print receipt"}
    </button>
  );
}
