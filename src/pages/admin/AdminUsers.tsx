import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminPermissions, ALL_ADMIN_MODULES, MODULE_LABELS, AdminModule } from "@/hooks/useAdminPermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ShieldAlert, ShieldCheck, UserPlus, ArrowUp, ArrowDown, Trash2 } from "lucide-react";

interface UserRow {
  user_id: string;
  display_name: string | null;
  role: "admin" | "editor" | "viewer";
  modules: Set<AdminModule>;
}

type AddRole = "admin" | "editor";

export default function AdminUsers() {
  const { loading: permsLoading, isSuperAdmin } = useAdminPermissions();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Editors are not allowed analytics or user_management
  const EDITOR_FORBIDDEN: AdminModule[] = ["analytics", "user_management"];
  const EDITOR_ALLOWED_MODULES = ALL_ADMIN_MODULES.filter(
    (m) => !EDITOR_FORBIDDEN.includes(m),
  );

  // Add-admin dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addDisplayName, setAddDisplayName] = useState("");
  const [addRole, setAddRole] = useState<AddRole>("editor");
  const [addModules, setAddModules] = useState<Set<AdminModule>>(new Set());
  const [adding, setAdding] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    const { data: roleRows, error: rolesErr } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (rolesErr) {
      toast.error("Failed to load users");
      setLoading(false);
      return;
    }

    const userIds = Array.from(new Set((roleRows ?? []).map((r) => r.user_id)));

    const [{ data: profiles }, { data: perms }] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name").in("user_id", userIds),
      supabase.from("admin_permissions").select("user_id, module").in("user_id", userIds),
    ]);

    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p.display_name]));
    const permMap = new Map<string, Set<AdminModule>>();
    (perms ?? []).forEach((p) => {
      if (!permMap.has(p.user_id)) permMap.set(p.user_id, new Set());
      permMap.get(p.user_id)!.add(p.module as AdminModule);
    });

    const roleByUser = new Map<string, "admin" | "editor" | "viewer">();
    (roleRows ?? []).forEach((r) => {
      const cur = roleByUser.get(r.user_id);
      const rank = (x: string) => (x === "admin" ? 3 : x === "editor" ? 2 : 1);
      if (!cur || rank(r.role) > rank(cur)) roleByUser.set(r.user_id, r.role as any);
    });

    const built: UserRow[] = userIds.map((uid) => ({
      user_id: uid,
      display_name: profileMap.get(uid) ?? null,
      role: roleByUser.get(uid) ?? "viewer",
      modules: permMap.get(uid) ?? new Set(),
    }));

    built.sort((a, b) => {
      if (a.role !== b.role) return a.role === "admin" ? -1 : 1;
      return (a.display_name ?? "").localeCompare(b.display_name ?? "");
    });

    setRows(built);
    setLoading(false);
  };

  useEffect(() => {
    if (permsLoading) return;
    if (!isSuperAdmin) {
      setLoading(false);
      return;
    }
    void loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permsLoading, isSuperAdmin]);

  const toggleModule = async (userId: string, mod: AdminModule, checked: boolean) => {
    if (checked) {
      const { error } = await supabase
        .from("admin_permissions")
        .insert({ user_id: userId, module: mod });
      if (error) {
        toast.error(error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from("admin_permissions")
        .delete()
        .eq("user_id", userId)
        .eq("module", mod);
      if (error) {
        toast.error(error.message);
        return;
      }
    }
    setRows((prev) =>
      prev.map((r) => {
        if (r.user_id !== userId) return r;
        const next = new Set(r.modules);
        if (checked) next.add(mod);
        else next.delete(mod);
        return { ...r, modules: next };
      })
    );
    toast.success(`${checked ? "Granted" : "Revoked"} ${MODULE_LABELS[mod]}`);
  };

  const callFn = async (action: string, payload: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("admin-user-management", {
      body: { action, ...payload },
    });
    if (error) {
      // Try to extract friendly server message
      const ctx = (error as any)?.context;
      let msg = error.message;
      try {
        const txt = await ctx?.text?.();
        if (txt) {
          const j = JSON.parse(txt);
          if (j?.error) msg = j.error;
        }
      } catch { /* ignore */ }
      throw new Error(msg);
    }
    return data;
  };

  const handleAdd = async () => {
    if (!addEmail.trim()) {
      toast.error("Email is required");
      return;
    }
    if (addPassword && addPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setAdding(true);
    try {
      const cleanedModules =
        addRole === "editor"
          ? Array.from(addModules).filter((m) => !EDITOR_FORBIDDEN.includes(m))
          : [];
      await callFn("add_admin", {
        email: addEmail.trim(),
        password: addPassword || undefined,
        display_name: addDisplayName.trim() || undefined,
        role: addRole,
        modules: cleanedModules,
      });
      toast.success(`${addRole === "admin" ? "Super admin" : "Editor"} added`);
      setAddOpen(false);
      setAddEmail("");
      setAddPassword("");
      setAddDisplayName("");
      setAddRole("editor");
      setAddModules(new Set());
      await loadUsers();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAdding(false);
    }
  };

  const handleSetRole = async (userId: string, newRole: "admin" | "editor") => {
    try {
      await callFn("set_role", { user_id: userId, role: newRole });
      toast.success(`Role updated to ${newRole === "admin" ? "Super Admin" : "Editor"}`);
      await loadUsers();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      await callFn("remove_user", { user_id: userId });
      toast.success("Admin access revoked");
      await loadUsers();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (permsLoading || loading) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Super admin only</h2>
        <p className="text-muted-foreground max-w-md">
          Only super admins (L0) can manage user permissions.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            User Permissions
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Super admins automatically have access to every module. Add new admins or configure module access for editors below.
          </p>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Admin or Editor</DialogTitle>
              <DialogDescription>
                If the user already has an account, leave password blank. To create a new
                account, set a password (min 8 chars) — they can sign in immediately.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display name</Label>
                  <Input
                    id="display_name"
                    type="text"
                    placeholder="Optional"
                    value={addDisplayName}
                    onChange={(e) => setAddDisplayName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min 8 chars (new users)"
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={addRole} onValueChange={(v) => setAddRole(v as AddRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">Editor (limited modules)</SelectItem>
                    <SelectItem value="admin">Super Admin (full access)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {addRole === "editor" && (
                <div className="space-y-2">
                  <Label>Module access</Label>
                  <p className="text-xs text-muted-foreground">
                    Editors cannot be granted Analytics or User Management — those are super-admin only.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border rounded-md p-3 max-h-64 overflow-auto">
                    {EDITOR_ALLOWED_MODULES.map((mod) => (
                      <label
                        key={mod}
                        className="flex items-start gap-2 p-1 rounded hover:bg-accent/30 cursor-pointer"
                      >
                        <Checkbox
                          checked={addModules.has(mod)}
                          onCheckedChange={(c) => {
                            setAddModules((prev) => {
                              const n = new Set(prev);
                              if (c) n.add(mod);
                              else n.delete(mod);
                              return n;
                            });
                          }}
                          className="mt-0.5"
                        />
                        <span className="text-sm leading-tight">{MODULE_LABELS[mod]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)} disabled={adding}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={adding}>
                {adding ? "Adding…" : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {rows.map((row) => (
          <Card key={row.user_id}>
            <CardHeader className="flex flex-row items-center justify-between pb-3 gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base">
                  {row.display_name || row.user_id.slice(0, 8)}
                </CardTitle>
                <Badge variant={row.role === "admin" ? "default" : "secondary"}>
                  {row.role === "admin" ? "Super Admin (L0)" : row.role}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {row.role === "admin" ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <ArrowDown className="h-3.5 w-3.5 mr-1" />
                        Demote to Editor
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Demote to editor?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This user will lose super admin access and only retain explicitly
                          granted module permissions.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleSetRole(row.user_id, "editor")}>
                          Demote
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <ArrowUp className="h-3.5 w-3.5 mr-1" />
                        Promote to Super Admin
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Promote to super admin?</AlertDialogTitle>
                        <AlertDialogDescription>
                          They will gain full access to every admin module, including user management.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleSetRole(row.user_id, "admin")}>
                          Promote
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Remove
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove admin access?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This revokes the user's role and all module permissions. Their auth account is preserved.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleRemove(row.user_id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent>
              {row.role === "admin" ? (
                <p className="text-sm text-muted-foreground">
                  Has full access to all modules. Cannot be restricted.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {EDITOR_ALLOWED_MODULES.map((mod) => (
                    <label
                      key={mod}
                      className="flex items-start gap-2 p-2 rounded hover:bg-accent/30 cursor-pointer"
                    >
                      <Checkbox
                        checked={row.modules.has(mod)}
                        onCheckedChange={(c) => toggleModule(row.user_id, mod, !!c)}
                        className="mt-0.5"
                      />
                      <span className="text-sm leading-tight">{MODULE_LABELS[mod]}</span>
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {rows.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No admin or editor users yet. Click "Add Admin" to grant access to a signed-up user.
          </p>
        )}
      </div>
    </div>
  );
}
