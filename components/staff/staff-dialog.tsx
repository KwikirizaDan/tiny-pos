"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { User } from "@/db/schema";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: User | null;
  onSave: (member: User) => void;
}

export function StaffDialog({ open, onOpenChange, member, onSave }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "cashier" });

  useEffect(() => {
    if (member) setForm({ name: member.name ?? "", email: member.email ?? "", role: member.role ?? "cashier" });
    else setForm({ name: "", email: "", role: "cashier" });
  }, [member, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = member
        ? await fetch(`/api/staff/${member.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name, role: form.role }) })
        : await fetch("/api/staff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? "Failed"); }
      const saved = await res.json();
      onSave(saved);
      toast.success(member ? "Staff updated" : "Staff member added");
      onOpenChange(false);
    } catch (e: any) { toast.error(e.message ?? "Something went wrong"); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>{member ? "Edit staff member" : "Add staff member"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" required /></div>
          {!member && <div className="space-y-1.5"><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="staff@email.com" required /></div>}
          <div className="space-y-1.5">
            <Label>Role *</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cashier">Cashier</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving…" : member ? "Save changes" : "Add staff"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
