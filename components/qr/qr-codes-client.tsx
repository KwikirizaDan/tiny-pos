"use client";
import { useEffect, useRef, useState } from "react";
import { Printer, QrCode, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/db/schema";

interface ProductQR { product: Product; dataUrl: string; }

export function QRCodesClient({ products, storeName }: { products: Product[]; storeName: string }) {
  const [qrCodes, setQrCodes] = useState<ProductQR[]>([]);
  const [generating, setGenerating] = useState(false);

  const generateQRs = async () => {
    if (!products.length) return;
    setGenerating(true);
    try {
      const QRCode = (await import("qrcode")).default;
      const result: ProductQR[] = [];
      for (const product of products) {
        const dataUrl = await QRCode.toDataURL(JSON.stringify({ id: product.id, name: product.name, sku: product.sku, price: product.price }), { width: 200, margin: 1, errorCorrectionLevel: "M" });
        result.push({ product, dataUrl });
      }
      setQrCodes(result);
    } finally { setGenerating(false); }
  };

  useEffect(() => { generateQRs(); }, []);

  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${storeName} QR Codes</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:monospace;background:#fff;padding:12mm}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm}.card{border:1px solid #e4e4e7;padding:4mm;text-align:center}.card img{width:38mm;height:38mm}.name{font-size:7pt;margin-top:2mm}.price{font-size:9pt;font-weight:bold}@media print{@page{size:A4;margin:12mm}}</style></head><body><h2 style="text-align:center;margin-bottom:8mm;font-size:14pt">${storeName} — Product QR Codes</h2><div class="grid">${qrCodes.map(({product,dataUrl})=>`<div class="card"><img src="${dataUrl}"/><div class="name">${product.name}</div><div class="price">${new Intl.NumberFormat("en-UG").format(Number(product.price))} UGX</div>${product.sku?`<div style="font-size:6pt;color:#71717a">SKU: ${product.sku}</div>`:""}</div>`).join("")}</div></body></html>`);
    win.document.close(); setTimeout(() => { win.print(); win.close(); }, 500);
  };

  if (!products.length) return <div className="border p-12 text-center text-muted-foreground"><QrCode className="h-8 w-8 mx-auto mb-3 opacity-30" /><p className="text-sm">No active products found.</p><a href="/products" className="text-xs text-primary underline mt-2 inline-block">Add products first →</a></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{generating ? "Generating…" : `${qrCodes.length} QR codes ready`}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={generateQRs} disabled={generating}><RefreshCw className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} /> Regenerate</Button>
          <Button size="sm" onClick={handlePrint} disabled={generating || !qrCodes.length}><Printer className="h-4 w-4" /> Print A4</Button>
        </div>
      </div>
      {generating ? <div className="border p-12 text-center text-muted-foreground text-sm">Generating QR codes…</div> : (
        <div className="border p-6">
          <div className="text-center mb-6 pb-4 border-b"><p className="font-medium">{storeName}</p><p className="text-xs text-muted-foreground mt-1">{products.length} products · {new Date().toLocaleDateString()}</p></div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {qrCodes.map(({ product, dataUrl }) => (
              <div key={product.id} className="border p-2 flex flex-col items-center gap-1.5">
                <img src={dataUrl} alt={product.name} className="w-20 h-20" />
                <p className="text-[10px] font-medium text-center leading-tight line-clamp-2">{product.name}</p>
                <p className="text-[11px] font-medium text-primary">{formatCurrency(product.price)}</p>
                {product.sku && <p className="text-[9px] text-muted-foreground">{product.sku}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
