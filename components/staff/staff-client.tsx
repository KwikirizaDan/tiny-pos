"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Users, Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StaffDialog } from "./staff-dialog";
import { formatDate } from "@/lib/utils";
import type { User } from "@/db/schema";

const roleIcon = { owner: ShieldAlert, manager: ShieldCheck, cashier: Shield };
const roleColor = { owner: "text-orange-500", manager: "text-violet-400", cashier: "text-zinc-400" };

export function StaffClient({ staff: init }: { staff: User[] }) {
  const [staff, setStaff] = useState(init);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<User | null>(null);

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
    if (res.ok) { setStaff((p) => p.filter((s) => s.id !== id)); toast.success("Staff member removed"); }
    else toast.error("Failed to remove");
  };

  const handleToggle = async (member: User) => {
    const res = await fetch(`/api/staff/${member.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !member.isActive }) });
    if (res.ok) {
      const updated = await res.json();
      setStaff((p) => p.map((s) => s.id === updated.id ? updated : s));
      toast.success(`${updated.name} ${updated.isActive ? "activated" : "deactivated"}`);
    }
  };

  const handleSave = (member: User) => {
    setStaff((prev) => {
      const idx = prev.findIndex((s) => s.id === member.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = member; return next; }
      return [member, ...prev];
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{staff.length} team members</p>
        <Button size="sm" onClick={() => { setEditStaff(null); setDialogOpen(true); }}><Plus className="h-4 w-4" /> Add staff</Button>
      </div>

      {staff.length === 0 ? (
        <div className="border p-12 text-center">
          <Users className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-sm text-muted-foreground">No staff members yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {staff.map((member) => {
            const RoleIcon = roleIcon[member.role ?? "cashier"];
            return (
              <div key={member.id} className="border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 font-bold text-sm text-primary">
                      {(member.name ?? member.email ?? "?")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{member.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditStaff(member); setDialogOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(member.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <RoleIcon className={`h-3.5 w-3.5 ${roleColor[member.role ?? "cashier"]}`} />
                    <span className="text-xs capitalize font-medium">{member.role ?? "cashier"}</span>
                  </div>
                  <button onClick={() => handleToggle(member)}>
                    <Badge variant={member.isActive ? "success" : "secondary"} className="text-[10px] cursor-pointer">
                      {member.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground">Joined {formatDate(member.createdAt!)}</p>
              </div>
            );
          })}
        </div>
      )}

      <StaffDialog open={dialogOpen} onOpenChange={setDialogOpen} member={editStaff} onSave={handleSave} />
    </div>
  );
}
