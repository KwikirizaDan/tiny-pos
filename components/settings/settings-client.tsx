"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Save, Store, Receipt, Bell, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Vendor } from "@/db/schema";

const ACCENT_COLORS = [
  { label: "Violet", value: "#7c3aed" },
  { label: "Emerald", value: "#059669" },
  { label: "Blue", value: "#2563eb" },
  { label: "Orange", value: "#ea580c" },
  { label: "Pink", value: "#db2777" },
  { label: "Amber", value: "#d97706" },
  { label: "Teal", value: "#0891b2" },
  { label: "Red", value: "#dc2626" },
];

interface Props {
  vendor: Vendor;
  settings: Record<string, string>;
}

export function SettingsClient({ vendor, settings }: Props) {
  const [form, setForm] = useState({
    tax_rate: settings.tax_rate ?? "0",
    receipt_header: settings.receipt_header ?? vendor.name,
    receipt_footer: settings.receipt_footer ?? "Thank you for shopping with us!",
    low_stock_threshold: settings.low_stock_threshold ?? "5",
    currency: settings.currency ?? "UGX",
    accent_color: settings.accent_color ?? "#7c3aed",
  });
  const [loading, setLoading] = useState(false);

  const saveSetting = async (key: string, value: string) => {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await Promise.all(Object.entries(form).map(([key, value]) => saveSetting(key, value)));
      // Apply accent color immediately
      document.documentElement.style.setProperty("--accent-color", form.accent_color);
      localStorage.setItem("accent_color", form.accent_color);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-xl">

      {/* Store */}
      <div className="border bg-card">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Store className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Store</span>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-1.5">
            <Label>Receipt header</Label>
            <Input value={form.receipt_header}
              onChange={(e) => setForm({ ...form, receipt_header: e.target.value })}
              placeholder={vendor.name} />
          </div>
          <div className="space-y-1.5">
            <Label>Receipt footer</Label>
            <Input value={form.receipt_footer}
              onChange={(e) => setForm({ ...form, receipt_footer: e.target.value })}
              placeholder="Thank you!" />
          </div>
        </div>
      </div>

      {/* Tax & Currency */}
      <div className="border bg-card">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Receipt className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Tax & Currency</span>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-1.5">
            <Label>Currency code</Label>
            <Input value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              placeholder="UGX" />
          </div>
          <div className="space-y-1.5">
            <Label>Tax rate (%)</Label>
            <Input type="number" min="0" max="100" value={form.tax_rate}
              onChange={(e) => setForm({ ...form, tax_rate: e.target.value })}
              placeholder="0" />
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="border bg-card">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Alerts</span>
        </div>
        <div className="p-4">
          <div className="space-y-1.5">
            <Label>Low stock alert threshold (units)</Label>
            <Input type="number" min="0" value={form.low_stock_threshold}
              onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
              placeholder="5" />
            <p className="text-xs text-muted-foreground">
              Products with stock at or below this number will appear in the low stock alert
            </p>
          </div>
        </div>
      </div>

      {/* Accent color */}
      <div className="border bg-card">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Palette className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Appearance</span>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Accent colour</Label>
            <div className="flex flex-wrap gap-3">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  title={color.label}
                  onClick={() => setForm({ ...form, accent_color: color.value })}
                  className="relative w-8 h-8 transition-transform hover:scale-110 active:scale-95"
                  style={{ background: color.value }}
                >
                  {form.accent_color === color.value && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
                </button>
              ))}
              {/* Custom colour picker */}
              <div className="relative w-8 h-8">
                <input
                  type="color"
                  value={form.accent_color}
                  onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Custom colour"
                />
                <div className="w-8 h-8 border border-dashed border-border flex items-center justify-center text-muted-foreground text-xs">
                  +
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground font-mono">{form.accent_color}</p>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="border p-3 flex items-center gap-3">
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-medium text-white"
                style={{ background: form.accent_color }}
              >
                Charge UGX 25,000
              </button>
              <span
                className="text-xs font-medium"
                style={{ color: form.accent_color }}
              >
                UGX 12,500
              </span>
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: form.accent_color }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Store info */}
      <div className="border bg-card">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Store className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Store info</span>
        </div>
        <div className="p-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Store name</span>
            <span className="font-medium">{vendor.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Slug</span>
            <span className="font-mono text-xs">{vendor.slug}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Store ID</span>
            <span className="font-mono text-xs">{vendor.id.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        <Save className="h-4 w-4" />
        {loading ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
