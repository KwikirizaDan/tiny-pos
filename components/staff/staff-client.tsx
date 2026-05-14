"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Users, Shield, ShieldCheck, ShieldAlert, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { StaffDialog } from "./staff-dialog";
import { formatDate } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/permissions";
import type { User, UserRole } from "@/types/pos";
import { deleteStaff, updateStaff } from "@/app/(dashboard)/staff/actions";

const roleIcon = { owner: ShieldAlert, manager: ShieldCheck, cashier: Shield };
const roleColor = { owner: "text-amber-500", manager: "text-primary", cashier: "text-muted-foreground" };
const roleBg   = { owner: "bg-amber-500/10 border-amber-500/20", manager: "bg-primary/10 border-primary/20", cashier: "bg-muted border-border" };

export function StaffClient({ staff: init, currentUserRole }: { staff: User[]; currentUserRole: UserRole }) {
  const [staff, setStaff] = useState(init);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteStaff(id);
      setStaff((p) => p.filter((s) => s.id !== id)); 
      toast.success("Staff member removed"); 
    } catch {
      toast.error("Failed to remove");
    }
  };

  const handleToggle = async (member: User) => {
    try {
      const updated = await updateStaff(member.id, { isActive: !member.isActive });
      setStaff((p) => p.map((s) => s.id === (updated as any).id ? (updated as any) : s));
      toast.success(`${(updated as any).name} ${(updated as any).isActive ? "activated" : "deactivated"}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleSave = (member: User) => {
    setStaff((prev) => {
      const idx = prev.findIndex((s) => s.id === member.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = member; return next; }
      return [member, ...prev];
    });
  };

  const isOwner = currentUserRole === "owner";

  return (
    <div className="space-y-4">
      {/* How-to banner */}
      <div className="flex items-start gap-2 border border-primary/20 bg-primary/5 p-3 text-xs text-primary">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>Add a staff member below, then ask them to <strong>sign up at this app using the same email</strong>. Their account will be linked automatically.</span>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{staff.length} team member{staff.length !== 1 ? "s" : ""}</p>
        {isOwner && (
          <Button size="sm" onClick={() => { setEditStaff(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4" /> Add staff
          </Button>
        )}
      </div>

      {staff.length === 0 ? (
        <div className="border p-12 text-center">
          <Users className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-sm text-muted-foreground">No staff members yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {staff.map((member) => {
            const role = (member.role ?? "cashier") as UserRole;
            const RoleIcon = roleIcon[role];
            return (
              <div key={member.id} className="border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 border flex items-center justify-center shrink-0 font-bold text-sm ${roleBg[role]} ${roleColor[role]}`}>
                      {(member.name ?? member.email ?? "?")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{member.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                  </div>
                  {isOwner && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditStaff(member); setDialogOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setConfirmDelete(member)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 border text-xs font-medium ${roleBg[role]} ${roleColor[role]}`}>
                    <RoleIcon className="h-3 w-3" />
                    {ROLE_LABELS[role]}
                  </div>
                  <button onClick={() => isOwner && handleToggle(member)} disabled={!isOwner}>
                    <Badge variant={member.isActive ? "default" : "secondary"} className="text-[10px] cursor-pointer">
                      {member.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground">Added {formatDate(member.createdAt!)}</p>
              </div>
            );
          })}
        </div>
      )}

      <StaffDialog open={dialogOpen} onOpenChange={setDialogOpen} member={editStaff} onSave={handleSave} />

      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete staff member "{confirmDelete?.name ?? confirmDelete?.email}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>No</Button>
            <Button variant="destructive" onClick={() => { if (confirmDelete) handleDelete(confirmDelete.id); setConfirmDelete(null); }}>Yes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
