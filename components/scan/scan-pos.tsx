"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  ShoppingCart, Trash2, Plus, Minus, CreditCard,
  Banknote, ScanLine, X, Zap, Camera, CheckCircle2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Product, Category, Vendor } from "@/db/schema";

interface CartItem { product: Product; quantity: number; }

export function ScanPOS({
  products, categories, vendor, cashierId,
}: {
  products: Product[];
  categories: Category[];
  vendor: Vendor;
  cashierId: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const cooldownRef = useRef(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [view, setView] = useState<"scan" | "cart" | "checkout">("scan");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [loading, setLoading] = useState(false);
  const [cameraState, setCameraState] = useState<"idle" | "starting" | "active" | "error">("idle");
  const [cameraError, setCameraError] = useState("");
  const [lastProduct, setLastProduct] = useState<Product | null>(null);
  const [flash, setFlash] = useState(false);
  const [saleComplete, setSaleComplete] = useState(false);

  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);
  const total = subtotal;

  const addToCart = useCallback((product: Product) => {
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
    setLastProduct(product);
    setFlash(true);
    setTimeout(() => setFlash(false), 500);
    toast.success(`${product.name} added`, { duration: 1000 });
  }, []);

  const handleScan = useCallback((text: string) => {
    if (cooldownRef.current || !text) return;
    cooldownRef.current = true;
    setTimeout(() => { cooldownRef.current = false; }, 2000);

    const scannedValue = text.trim();
    let product: Product | undefined;

    // 1. Try JSON parsing (supports {"id": "...", "sku": "..."})
    try {
      const data = JSON.parse(scannedValue);
      const searchId = typeof data === "object" ? data.id : data;
      const searchSku = typeof data === "object" ? data.sku : data;

      product = products.find((p) =>
        (searchId && p.id === searchId) ||
        (searchSku && p.sku && p.sku.toLowerCase() === String(searchSku).toLowerCase())
      );
    } catch {
      // 2. Fallback to raw string matching (ID or SKU)
      product = products.find((p) =>
        p.id === scannedValue ||
        (p.sku && p.sku.toLowerCase() === scannedValue.toLowerCase())
      );
    }

    if (product) {
      addToCart(product);
    } else {
      toast.error(`Product not found: ${scannedValue.slice(0, 20)}`, { duration: 2000 });
    }
  }, [products, addToCart]);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraState("idle");
  }, []);

  const startCamera = useCallback(async () => {
    setCameraState("starting");
    setCameraError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      videoRef.current.setAttribute("playsinline", "true");
      videoRef.current.muted = true;

      await new Promise<void>((resolve, reject) => {
        if (!videoRef.current) return reject();
        videoRef.current.onloadedmetadata = () => resolve();
        videoRef.current.onerror = () => reject(new Error("Video error"));
        setTimeout(() => reject(new Error("Video load timeout")), 8000);
      });

      await videoRef.current.play();
      setCameraState("active");

      // Start scanning loop
      const startScanning = async () => {
        // Try native BarcodeDetector first (Chrome Android)
        if ("BarcodeDetector" in window) {
          const detector = new (window as any).BarcodeDetector({
            formats: ["qr_code", "ean_13", "ean_8", "code_128", "code_39", "upc_a"],
          });

          const scan = async () => {
            if (!videoRef.current || videoRef.current.readyState < 2) {
              rafRef.current = requestAnimationFrame(scan);
              return;
            }
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes.length > 0) handleScan(codes[0].rawValue);
            } catch {}
            rafRef.current = requestAnimationFrame(scan);
          };
          rafRef.current = requestAnimationFrame(scan);
        } else {
          // ZXing fallback
          try {
            const { BrowserMultiFormatReader } = await import("@zxing/browser");
            const reader = new BrowserMultiFormatReader();
            if (videoRef.current) {
              reader.decodeFromVideoElement(videoRef.current, (result) => {
                if (result) handleScan(result.getText());
              });
            }
          } catch (e) {
            console.warn("ZXing failed:", e);
          }
        }
      };

      startScanning();

    } catch (err: any) {
      stopCamera();
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        setCameraError("Camera permission denied.\n\nGo to your browser settings and allow camera access for this site, then try again.");
      } else if (err?.name === "NotFoundError") {
        setCameraError("No camera found on this device.");
      } else if (err?.name === "NotReadableError" || err?.name === "TrackStartError") {
        setCameraError("Camera is in use by another app.\n\nClose other apps using the camera and try again.");
      } else if (err?.name === "OverconstrainedError") {
        // Retry with basic constraints
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            setCameraState("active");
          }
        } catch {
          setCameraError("Could not access camera. Please check permissions.");
        }
      } else {
        setCameraError(`Camera error: ${err?.message ?? "Unknown error"}`);
      }
      setCameraState("error");
    }
  }, [handleScan, stopCamera]);

  // Stop camera when leaving scan view
  useEffect(() => {
    if (view !== "scan") {
      cancelAnimationFrame(rafRef.current);
    }
    return () => {};
  }, [view]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleCheckout = async () => {
    if (!cart.length) return;
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: vendor.id,
          cashierId,
          items: cart.map((i) => ({
            productId: i.product.id,
            productName: i.product.name,
            quantity: i.quantity,
            unitPrice: i.product.price,
          })),
          subtotal: total.toFixed(2),
          tax: "0",
          discountAmount: "0",
          totalAmount: total.toFixed(2),
          paymentMethod,
        }),
      });
      if (!res.ok) throw new Error();
      setCart([]);
      setView("scan");
      setSaleComplete(true);
      setTimeout(() => setSaleComplete(false), 3000);
      toast.success("Sale complete!");
    } catch {
      toast.error("Checkout failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>

      {/* ── SCAN VIEW ── */}
      {view === "scan" && (
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Camera area */}
          <div className="relative flex-1 bg-black overflow-hidden">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />

            {/* Idle state — big start button */}
            {cameraState === "idle" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-zinc-950">
                <div className="w-20 h-20 rounded-full bg-violet-600/20 border-2 border-violet-500/50 flex items-center justify-center">
                  <Camera className="h-9 w-9 text-violet-400" />
                </div>
                <div className="text-center px-6">
                  <p className="text-white font-medium text-lg mb-1">Scan to Sell</p>
                  <p className="text-zinc-500 text-sm">Tap below to start your camera and scan product QR codes</p>
                </div>
                <button
                  onClick={startCamera}
                  className="px-8 py-4 bg-violet-600 text-white font-medium text-base active:bg-violet-700 touch-manipulation"
                >
                  Start Camera
                </button>
              </div>
            )}

            {/* Starting state */}
            {cameraState === "starting" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950">
                <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-zinc-400 text-sm font-mono">Starting camera…</p>
              </div>
            )}

            {/* Active — scan overlay */}
            {cameraState === "active" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="absolute inset-0 bg-black/30" />
                <div className={`relative w-64 h-64 transition-transform duration-200 ${flash ? "scale-110" : "scale-100"}`}>
                  <div className="absolute top-0 left-0 w-10 h-10 border-t-[3px] border-l-[3px] border-violet-400" />
                  <div className="absolute top-0 right-0 w-10 h-10 border-t-[3px] border-r-[3px] border-violet-400" />
                  <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[3px] border-l-[3px] border-violet-400" />
                  <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[3px] border-r-[3px] border-violet-400" />
                  <div className="absolute inset-x-4 top-1/2 h-0.5 bg-violet-400/80 animate-pulse" />
                </div>
                <p className="mt-4 text-white/60 text-xs font-mono relative z-10">
                  point at a product QR code
                </p>
              </div>
            )}

            {/* Error state */}
            {cameraState === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-zinc-950 p-8">
                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                  <Camera className="h-7 w-7 text-red-400" />
                </div>
                <p className="text-white text-sm text-center font-mono leading-relaxed whitespace-pre-line">
                  {cameraError}
                </p>
                <button
                  onClick={startCamera}
                  className="px-6 py-3 bg-violet-600 text-white text-sm font-mono active:bg-violet-700 touch-manipulation"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Sale complete flash */}
            {saleComplete && (
              <div className="absolute inset-0 flex items-center justify-center bg-emerald-600/90 pointer-events-none">
                <div className="text-center">
                  <CheckCircle2 className="h-16 w-16 text-white mx-auto mb-3" />
                  <p className="text-white text-xl font-bold">Sale Complete!</p>
                </div>
              </div>
            )}

            {/* Last scanned product */}
            {lastProduct && cameraState === "active" && (
              <div className="absolute bottom-0 left-0 right-0 bg-zinc-900/95 border-t border-zinc-800 p-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-violet-600/20 border border-violet-600/30 flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{lastProduct.name}</p>
                  <p className="text-xs text-violet-400">{formatCurrency(lastProduct.price)}</p>
                </div>
                <span className="text-xs text-zinc-500">added ✓</span>
              </div>
            )}
          </div>

          {/* Store info bar */}
          <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between shrink-0">
            <span className="text-xs text-zinc-500 font-mono">{vendor.name}</span>
            {cameraState === "active" && (
              <button onClick={stopCamera} className="text-xs text-zinc-600 font-mono touch-manipulation">
                Stop camera
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── CART VIEW ── */}
      {view === "cart" && (
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          <div className="px-4 py-3 border-b flex items-center gap-3 shrink-0">
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm flex-1">Cart</span>
            {itemCount > 0 && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5">
                {itemCount} items
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <ShoppingCart className="h-10 w-10 opacity-20" />
                <p className="text-sm">Cart is empty</p>
                <button
                  onClick={() => setView("scan")}
                  className="text-xs text-primary underline underline-offset-2 touch-manipulation"
                >
                  Go back to scan
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="border p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    <p className="text-xs text-primary mt-0.5">
                      {formatCurrency(Number(item.product.price) * item.quantity)}
                    </p>
                  </div>
                  <div className="flex items-center border">
                    <button
                      onClick={() => setCart((p) => p.map((i) => i.product.id === item.product.id ? { ...i, quantity: i.quantity - 1 } : i).filter((i) => i.quantity > 0))}
                      className="p-3 hover:bg-accent touch-manipulation"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-3 text-sm font-medium min-w-[2.5rem] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => setCart((p) => p.map((i) => i.product.id === item.product.id ? { ...i, quantity: i.quantity + 1 } : i))}
                      className="p-3 hover:bg-accent touch-manipulation"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => setCart((p) => p.filter((i) => i.product.id !== item.product.id))}
                    className="p-2 text-muted-foreground hover:text-destructive touch-manipulation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="border-t p-4 shrink-0 space-y-3">
              <div className="flex justify-between font-medium text-lg">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <button
                onClick={() => setView("checkout")}
                className="w-full h-12 bg-primary text-primary-foreground font-medium touch-manipulation"
              >
                Proceed to payment →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── CHECKOUT VIEW ── */}
      {view === "checkout" && (
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          <div className="px-4 py-3 border-b flex items-center gap-3 shrink-0">
            <button onClick={() => setView("cart")} className="p-1 hover:bg-accent touch-manipulation">
              <X className="h-4 w-4" />
            </button>
            <span className="font-medium text-sm">Payment</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            <div className="border p-4 space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
                Order summary
              </p>
              {cart.map((item) => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.product.name} × {item.quantity}
                  </span>
                  <span>{formatCurrency(Number(item.product.price) * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-medium text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
                Payment method
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(["cash", "card"] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`flex flex-col items-center gap-2 py-6 border transition-colors touch-manipulation ${
                      paymentMethod === method
                        ? "bg-primary/10 border-primary text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {method === "cash"
                      ? <Banknote className="h-8 w-8" />
                      : <CreditCard className="h-8 w-8" />
                    }
                    <span className="text-sm font-medium capitalize">{method}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t p-4 shrink-0">
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full h-14 bg-primary text-primary-foreground font-medium text-base disabled:opacity-50 touch-manipulation"
            >
              {loading ? "Processing…" : `Charge ${formatCurrency(total)}`}
            </button>
          </div>
        </div>
      )}

      {/* ── BOTTOM NAV ── */}
      <div
        className="border-t bg-zinc-900 flex shrink-0"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {[
          { v: "scan" as const, label: "Scan", Icon: ScanLine },
          { v: "cart" as const, label: `Cart${itemCount > 0 ? ` (${itemCount})` : ""}`, Icon: ShoppingCart },
          { v: "checkout" as const, label: "Pay", Icon: CreditCard },
        ].map(({ v, label, Icon }) => (
          <button
            key={v}
            onClick={() => {
              if (v === "checkout" && cart.length === 0) {
                toast.warning("Add items to cart first");
                return;
              }
              setView(v);
            }}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors touch-manipulation ${
              view === v ? "text-violet-400" : "text-zinc-500"
            }`}
          >
            <Icon className={`h-5 w-5 ${view === v ? "stroke-[2.5px]" : ""}`} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
