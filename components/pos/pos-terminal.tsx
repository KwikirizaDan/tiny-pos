"use client";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Plus, Minus, Trash2, ShoppingCart, CreditCard,
  Banknote, Search, CheckCircle2, X, Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { Product, Category, Vendor, Sale } from "@/db/schema";
import { createOrder } from "@/app/(dashboard)/pos/actions";

interface CartItem { product: Product; quantity: number; }
const TAX_RATE = 0.0;

interface POSTerminalProps {
  products: Product[];
  categories: Category[];
  vendor: Vendor;
  cashierId: string;
  receiptFooter?: string;
}

export function POSTerminal({ products, categories, vendor, cashierId, receiptFooter }: POSTerminalProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [loading, setLoading] = useState(false);
  const [saleComplete, setSaleComplete] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [lastCartItems, setLastCartItems] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cartOpen, setCartOpen] = useState(false);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku ?? "").toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory === "all" || p.categoryId === selectedCategory;
      return matchSearch && matchCat && (p.stockQuantity ?? 0) > 0;
    });
  }, [products, search, selectedCategory]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= (product.stockQuantity ?? 0)) {
          toast.warning(`Only ${product.stockQuantity} in stock`);
          return prev;
        }
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((i) => i.product.id === id ? { ...i, quantity: i.quantity + delta } : i)
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => setCart((prev) => prev.filter((i) => i.product.id !== id));

  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const printReceipt = (sale: Sale, items: CartItem[]) => {
    const formatUGX = (v: number) =>
      "UGX " + new Intl.NumberFormat("en-UG", { minimumFractionDigits: 0 }).format(v);

    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) return;
    win.document.write(`
<!DOCTYPE html><html><head><title>Receipt</title>
<style>
* { margin:0;padding:0;box-sizing:border-box; }
body { font-family:'Courier New',monospace;font-size:12px;color:#000;background:#fff;padding:8px;width:280px;margin:0 auto; }
.center{text-align:center}.bold{font-weight:bold}.big{font-size:16px;font-weight:bold}
.divider{border:none;border-top:1px dashed #000;margin:8px 0}
.row{display:flex;justify-content:space-between;margin:3px 0}
.row-total{display:flex;justify-content:space-between;margin:4px 0;font-weight:bold;font-size:14px}
.barcode{display:flex;justify-content:center;gap:1.5px;margin:8px 0}
.barcode span{display:inline-block;height:32px;background:#000}
.footer{text-align:center;font-size:10px;color:#555;margin-top:8px}
@media print{body{width:100%;padding:0}@page{margin:4mm;size:80mm auto}}
</style></head><body>
<div class="center"><div class="big">${vendor.name}</div><div>+256 707 265 240</div><div>Kampala, Uganda</div></div>
<hr class="divider">
<div class="row"><span>Order</span><span>${sale.id.slice(0, 8).toUpperCase()}</span></div>
<div class="row"><span>Date</span><span>${new Date(sale.createdAt!).toLocaleDateString("en-UG")}</span></div>
<div class="row"><span>Time</span><span>${new Date(sale.createdAt!).toLocaleTimeString("en-UG", { hour: "2-digit", minute: "2-digit" })}</span></div>
<div class="row"><span>Payment</span><span style="text-transform:capitalize">${sale.paymentMethod}</span></div>
<hr class="divider">
${items.map((item) => `<div class="row"><span>${item.product.name} × ${item.quantity}</span><span>${formatUGX(Number(item.product.price) * item.quantity)}</span></div>`).join("")}
<hr class="divider">
<div class="row"><span>Subtotal</span><span>${formatUGX(subtotal)}</span></div>
${tax > 0 ? `<div class="row"><span>Tax</span><span>${formatUGX(tax)}</span></div>` : ""}
<div class="row-total"><span>TOTAL</span><span>${formatUGX(total)}</span></div>
<hr class="divider">
<div class="barcode"><span style="width:1px"></span><span style="width:3px"></span><span style="width:1px"></span><span style="width:2px"></span><span style="width:1px"></span><span style="width:3px"></span><span style="width:2px"></span><span style="width:1px"></span><span style="width:3px"></span><span style="width:1px"></span><span style="width:2px"></span><span style="width:3px"></span></div>
<div class="footer">${receiptFooter ?? "Thank you for shopping with us!"}<br>Powered by TinyPOS · Binary Labs</div>
<script>window.onload=function(){window.print();window.close();}<\/script>
</body></html>`);
    win.document.close();
  };

  const handleCheckout = async () => {
    if (!cart.length) { toast.warning("Cart is empty"); return; }
    setLoading(true);
    try {
      const payload = {
        subtotal: subtotal.toFixed(2),
        totalAmount: total.toFixed(2),
        paymentMethod,
        items: cart.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          quantity: i.quantity,
          unitPrice: i.product.price,
          subtotal: (Number(i.product.price) * i.quantity).toFixed(2),
        })),
      };

      const order = await createOrder(payload);
      setLastSale(order);
      setLastCartItems([...cart]);
      setCart([]);
      setCartOpen(false);
      setSaleComplete(true);
      toast.success("Sale complete!");
    } catch (e: any) {
      toast.error(e.message ?? "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100dvh-7rem)] gap-0 md:gap-4 -m-4 md:m-0">

      {/* Product grid */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden px-3 pt-3 md:px-0 md:pt-0">
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products or SKU…" className="pl-8 h-10"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
          <button onClick={() => setSelectedCategory("all")}
            className={`shrink-0 px-3 py-1.5 text-xs border transition-colors touch-manipulation ${selectedCategory === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
            All
          </button>
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 px-3 py-1.5 text-xs border transition-colors touch-manipulation capitalize ${selectedCategory === cat.id ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              {products.length === 0 ? "No products yet. Add products first." : "No products match your search."}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 content-start pb-24 md:pb-4">
              {filtered.map((product) => {
                const inCart = cart.find((i) => i.product.id === product.id);
                return (
                  <button key={product.id} onClick={() => addToCart(product)}
                    className={`relative border p-3 text-left transition-all active:scale-95 touch-manipulation ${inCart ? "border-primary/50 bg-primary/5" : "hover:border-primary/30 hover:bg-accent"}`}>
                    {inCart && (
                      <span className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 flex items-center justify-center">
                        {inCart.quantity}
                      </span>
                    )}
                    <p className="font-medium text-sm leading-tight line-clamp-2 mb-2 pr-5">{product.name}</p>
                    <p className="text-primary text-sm font-medium">{formatCurrency(product.price)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{product.stockQuantity} left</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mobile cart button */}
      {!cartOpen && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 px-3 pb-2 z-40">
          {saleComplete && lastSale ? (
            <div className="w-full bg-emerald-600 text-white h-12 flex items-center justify-between px-4 text-sm font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Sale complete!
              </div>
              <button onClick={() => printReceipt(lastSale, lastCartItems)}
                className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 touch-manipulation">
                <Printer className="h-3.5 w-3.5" /> Print
              </button>
            </div>
          ) : (
            <button onClick={() => setCartOpen(true)}
              className="w-full bg-primary text-primary-foreground h-12 flex items-center justify-between px-4 text-sm font-medium touch-manipulation">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                <span>{itemCount} {itemCount === 1 ? "item" : "items"}</span>
              </div>
              <span>{formatCurrency(total)}</span>
            </button>
          )}
        </div>
      )}

      {/* Mobile cart drawer */}
      {cartOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCartOpen(false)} />
          <div className="relative bg-card border-t flex flex-col max-h-[85dvh]">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                <span className="font-medium text-sm">Cart</span>
                {itemCount > 0 && <Badge variant="secondary">{itemCount}</Badge>}
              </div>
              <button onClick={() => setCartOpen(false)} className="p-1 hover:bg-accent touch-manipulation">
                <X className="h-4 w-4" />
              </button>
            </div>
            <CartContents cart={cart} updateQty={updateQty} removeFromCart={removeFromCart}
              subtotal={subtotal} tax={tax} total={total} paymentMethod={paymentMethod as any}
              setPaymentMethod={setPaymentMethod as any} onCheckout={handleCheckout}
              onClear={() => setCart([])} loading={loading} saleComplete={saleComplete}
              lastSale={lastSale} lastCartItems={lastCartItems}
              onPrint={() => lastSale && printReceipt(lastSale, lastCartItems)} />
          </div>
        </div>
      )}

      {/* Desktop cart */}
      <div className="hidden md:flex w-80 shrink-0 border bg-card flex-col">
        <div className="px-4 py-3 border-b flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Cart</span>
          {itemCount > 0 && <Badge variant="secondary" className="ml-auto">{itemCount} items</Badge>}
        </div>
        <CartContents cart={cart} updateQty={updateQty} removeFromCart={removeFromCart}
          subtotal={subtotal} tax={tax} total={total} paymentMethod={paymentMethod as any}
          setPaymentMethod={setPaymentMethod as any} onCheckout={handleCheckout}
          onClear={() => setCart([])} loading={loading} saleComplete={saleComplete}
          lastSale={lastSale} lastCartItems={lastCartItems}
          onPrint={() => lastSale && printReceipt(lastSale, lastCartItems)} />
      </div>
    </div>
  );
}

function CartContents({
  cart, updateQty, removeFromCart, subtotal, tax, total,
  paymentMethod, setPaymentMethod, onCheckout, onClear,
  loading, saleComplete, lastSale, lastCartItems, onPrint,
}: {
  cart: CartItem[];
  updateQty: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  subtotal: number; tax: number; total: number;
  paymentMethod: "cash" | "card";
  setPaymentMethod: (m: "cash" | "card") => void;
  onCheckout: () => void;
  onClear: () => void;
  loading: boolean;
  saleComplete: boolean;
  lastSale: Sale | null;
  lastCartItems: CartItem[];
  onPrint: () => void;
}) {
  return (
    <>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {saleComplete && lastSale && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Sale complete!
              </div>
              <button onClick={onPrint}
                className="flex items-center gap-1 text-xs bg-emerald-600 text-white px-2.5 py-1.5 touch-manipulation hover:bg-emerald-700">
                <Printer className="h-3 w-3" /> Print receipt
              </button>
            </div>
          </div>
        )}
        {cart.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
            Tap products to add
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.product.id} className="border p-2.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-tight flex-1 line-clamp-1">{item.product.name}</p>
                <button onClick={() => removeFromCart(item.product.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0 touch-manipulation">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center border">
                  <button onClick={() => updateQty(item.product.id, -1)} className="p-2 hover:bg-accent touch-manipulation">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="px-3 text-sm font-medium min-w-[2rem] text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(item.product.id, 1)} className="p-2 hover:bg-accent touch-manipulation"
                    disabled={item.quantity >= (item.product.stockQuantity ?? 0)}>
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <span className="text-sm font-medium">{formatCurrency(Number(item.product.price) * item.quantity)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t p-4 space-y-3">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
          </div>
          {tax > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Tax</span><span>{formatCurrency(tax)}</span>
            </div>
          )}
          <div className="flex justify-between font-medium text-base pt-1.5 border-t">
            <span>Total</span><span>{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={() => setPaymentMethod("cash")}
            className={`flex items-center justify-center gap-1.5 py-2.5 text-xs border transition-colors touch-manipulation ${paymentMethod === "cash" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
            <Banknote className="h-3.5 w-3.5" /> Cash
          </button>
          <button onClick={() => setPaymentMethod("card")}
            className={`flex items-center justify-center gap-1.5 py-2.5 text-xs border transition-colors touch-manipulation ${paymentMethod === "card" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
            <CreditCard className="h-3.5 w-3.5" /> Card
          </button>
        </div>

        <Button className="w-full h-12 text-sm" onClick={onCheckout} disabled={loading || cart.length === 0}>
          {loading ? "Processing…" : `Charge ${formatCurrency(total)}`}
        </Button>

        {cart.length > 0 && (
          <button onClick={onClear} className="w-full text-xs text-muted-foreground hover:text-destructive transition-colors text-center touch-manipulation">
            Clear cart
          </button>
        )}
      </div>
    </>
  );
}
