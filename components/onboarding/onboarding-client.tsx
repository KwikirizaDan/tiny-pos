"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Logo } from "@/components/ui/logo";

export function OnboardingClient() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "" });

  const handleNameChange = (name: string) => {
    setForm({ name, slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const vendorRes = await fetch("/api/vendor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const vendorText = await vendorRes.text();
      if (!vendorRes.ok) {
        let msg = "Failed to create store";
        try { const p = JSON.parse(vendorText); msg = Array.isArray(p?.error) ? p.error.map((e: any) => e.message).join(", ") : (p?.error ?? msg); } catch {}
        throw new Error(msg);
      }
      const vendor = JSON.parse(vendorText);
      await fetch("/api/vendor/user", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vendorId: vendor.id, email: user?.primaryEmailAddress?.emailAddress, name: user?.fullName ?? "" }) });
      toast.success("Store created! Welcome to TinyPOS.");
      router.push("/dashboard");
    } catch (err: any) { toast.error(err.message ?? "Something went wrong"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(#7c3aed 1px, transparent 1px), linear-gradient(90deg, #7c3aed 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl" />
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Logo width={48} height={48} />
            <div className="text-left">
              <div className="text-white font-mono text-xl font-bold tracking-tight leading-tight">Tiny<span className="text-violet-400">POS</span></div>
              <div className="text-zinc-600 font-mono text-[10px] tracking-widest">by Binary Labs</div>
            </div>
          </div>
          <h1 className="text-white text-lg font-medium font-mono mb-1">Set up your store</h1>
          <p className="text-zinc-500 text-sm font-mono">{user?.firstName ? `Welcome ${user.firstName}! ` : ""}Give your store a name to get started.</p>
        </div>

        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 bg-violet-600 text-white text-xs flex items-center justify-center font-medium">1</div>
            <span className="text-zinc-400 text-xs font-mono">Store details</span>
          </div>
          <div className="h-px w-8 bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 bg-zinc-800 text-zinc-600 text-xs flex items-center justify-center font-medium">2</div>
            <span className="text-zinc-600 text-xs font-mono">Dashboard</span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-zinc-300 text-xs font-mono block">Store name *</label>
              <input value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="Mukwano General Store" className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 font-mono text-sm px-3 py-2 focus:outline-none focus:border-violet-500 transition-colors" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-zinc-300 text-xs font-mono block">Store URL *</label>
              <div className="flex items-center border border-zinc-700 bg-zinc-950 focus-within:border-violet-500 transition-colors">
                <span className="px-3 text-zinc-600 text-xs border-r border-zinc-700 h-9 flex items-center font-mono shrink-0">tinypos/</span>
                <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} placeholder="mukwano-store" className="flex-1 bg-transparent text-zinc-100 text-sm px-3 py-2 focus:outline-none font-mono" required />
              </div>
              <p className="text-[10px] text-zinc-600 font-mono">Lowercase letters, numbers and hyphens only</p>
            </div>
            {form.name && (
              <div className="border border-zinc-800 p-3 bg-zinc-950/50">
                <p className="text-[10px] text-zinc-600 font-mono mb-1">Preview</p>
                <p className="text-zinc-200 text-sm font-mono font-medium">{form.name}</p>
                <p className="text-zinc-600 text-xs font-mono">tinypos/{form.slug || "..."}</p>
              </div>
            )}
            <button type="submit" disabled={loading || !form.name || !form.slug} className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono text-sm py-3 transition-colors">
              {loading ? "Creating store…" : "Create store & continue →"}
            </button>
          </form>
        </div>

        {user && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="w-5 h-5 bg-violet-600/30 border border-violet-600/40 flex items-center justify-center text-[9px] text-violet-400 font-bold">
              {(user.firstName ?? user.emailAddresses[0]?.emailAddress ?? "?")[0].toUpperCase()}
            </div>
            <p className="text-zinc-600 text-[10px] font-mono">Signed in as {user.primaryEmailAddress?.emailAddress}</p>
          </div>
        )}
        <p className="text-center text-zinc-700 text-[10px] font-mono mt-4">TinyPOS · by Binary Labs · Kampala, Uganda</p>
      </div>
    </div>
  );
}
