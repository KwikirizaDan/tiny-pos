"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_CAPABILITIES } from "@/lib/permissions";
import type { User, UserRole } from "@/types/pos";
import { createStaff, updateStaff } from "@/app/(dashboard)/staff/actions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: User | null;
  onSave: (member: User) => void;
}

const ROLES: UserRole[] = ["cashier", "manager", "owner"];

export function StaffDialog({ open, onOpenChange, member, onSave }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "cashier" as UserRole });

  useEffect(() => {
    if (member) setForm({ name: member.name ?? "", email: member.email ?? "", role: (member.role ?? "cashier") as UserRole });
    else setForm({ name: "", email: "", role: "cashier" });
  }, [member, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const saved = member
        ? await updateStaff(member.id, { name: form.name, role: form.role })
        : await createStaff(form);
      onSave(saved as User);
      toast.success(member ? "Staff updated" : "Staff member added — they can now sign up with their email to access the system.");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{member ? "Edit staff member" : "Add staff member"}</DialogTitle>
          <DialogDescription>
            {member ? "Update this team member's details and role." : "Add a team member. They'll sign up using this email to access the system."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Full name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Nakato" required />
          </div>
          {!member && (
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@example.com" required />
              <p className="text-xs text-muted-foreground">They'll use this email to sign up and access the POS.</p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Role *</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserRole })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[form.role]}</p>
          </div>

          {/* Role capabilities */}
          <div className="border p-3 bg-muted/40 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">What {ROLE_LABELS[form.role]}s can do</p>
            <ul className="space-y-1">
              {ROLE_CAPABILITIES[form.role].map((cap) => (
                <li key={cap} className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                  {cap}
                </li>
              ))}
            </ul>
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
