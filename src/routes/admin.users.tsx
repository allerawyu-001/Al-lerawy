import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader, Card, Pill } from "@/components/AdminLayout";
import { useUsers, usersStore, type User, type UserRole, type UserStatus } from "@/lib/users-store";
import { Edit2, Trash2, Ban, CheckCircle2, Search, Plus, ArrowUpDown, Eye, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  component: UsersPage,
  head: () => ({ meta: [{ title: "Users — Admin" }] }),
});

type Filter = "All" | "Customer" | "Producer" | "Admin" | "Active" | "Suspended" | "Verified";
type SortKey = "name" | "role" | "status";

function UsersPage() {
  const users = useUsers();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "name", dir: "asc" });
  const [page, setPage] = useState(1);
  const perPage = 8;

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [suspending, setSuspending] = useState<User | null>(null);
  const [suspendReason, setSuspendReason] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = users.filter((u) => {
      if (q && !`${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(q)) return false;
      switch (filter) {
        case "All": return true;
        case "Customer":
        case "Producer":
        case "Admin": return u.role === filter;
        case "Active": return u.status === "Active";
        case "Suspended": return u.status === "Suspended";
        case "Verified": return u.verified;
      }
    });
    list = [...list].sort((a, b) => {
      const k = sort.key;
      const av = (a as any)[k] ?? "";
      const bv = (b as any)[k] ?? "";
      const cmp = String(av).localeCompare(String(bv));
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [users, query, filter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  const counts = useMemo(() => ({
    total: users.length,
    customers: users.filter((u) => u.role === "Customer").length,
    producers: users.filter((u) => u.role === "Producer").length,
    suspended: users.filter((u) => u.status === "Suspended").length,
  }), [users]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  const handleSuspendClick = (u: User) => {
    if (u.status === "Suspended") {
      usersStore.activate(u.id);
      toast.success(`${u.name} reactivated`);
    } else {
      setSuspendReason("");
      setSuspending(u);
    }
  };

  const confirmSuspend = () => {
    if (!suspending) return;
    usersStore.suspend(suspending.id, suspendReason.trim() || undefined);
    toast.success(`${suspending.name} suspended`);
    setSuspending(null);
  };

  const handleDelete = () => {
    if (!deleting) return;
    usersStore.remove(deleting.id);
    toast.success(`${deleting.name} deleted`);
    setDeleting(null);
  };

  return (
    <>
      <PageHeader
        title="Users"
        description="Every account on the platform — search, edit, suspend or remove."
        action={
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-xs font-medium uppercase tracking-widest text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            Add user
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MiniStat label="Total users" value={counts.total} />
        <MiniStat label="Customers" value={counts.customers} />
        <MiniStat label="Producers" value={counts.producers} />
        <MiniStat label="Suspended" value={counts.suspended} tone="danger" />
      </div>

      <Card>
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 md:w-96">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search by name, email or phone"
              className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {(["All", "Customer", "Producer", "Admin", "Active", "Suspended", "Verified"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(1); }}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${
                  filter === f ? "border-gold text-gold" : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <Th onClick={() => toggleSort("name")}>User</Th>
                <th className="pb-3 font-medium">Contact</th>
                <Th onClick={() => toggleSort("role")}>Role</Th>
                <Th onClick={() => toggleSort("status")}>Status</Th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {paged.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-sm text-muted-foreground">
                    No users match your filters.
                  </td>
                </tr>
              )}
              {paged.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-secondary/30">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <img src={u.avatar} alt={u.name} className="h-9 w-9 rounded-full object-cover" />
                      <div>
                        <div className="font-display text-base">{u.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-muted-foreground">
                    <div>{u.email}</div>
                    <div className="text-xs">{u.phone}</div>
                  </td>
                  <td className="text-muted-foreground">{u.role}</td>
                  <td>
                    <Pill tone={u.status === "Active" ? "gold" : u.status === "Pending" ? "warn" : "danger"}>
                      {u.status}
                    </Pill>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => navigate({ to: "/admin/users/$id", params: { id: u.id } })}
                        title="View"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-gold"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditing(u)}
                        title="Edit"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleSuspendClick(u)}
                        title={u.status === "Suspended" ? "Activate" : "Suspend"}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      >
                        {u.status === "Suspended" ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Ban className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setDeleting(u)}
                        title="Delete"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing {paged.length} of {filtered.length} · Page {safePage} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              disabled={safePage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md border border-border px-3 py-1.5 hover:border-gold/40 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-md border border-border px-3 py-1.5 hover:border-gold/40 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </Card>

      <UserFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add user"
        onSubmit={(v) => {
          usersStore.create(v);
          toast.success(`${v.name} created`);
          setAddOpen(false);
        }}
      />

      <UserFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Edit user"
        initial={editing ?? undefined}
        onSubmit={(v) => {
          if (!editing) return;
          usersStore.update(editing.id, v);
          toast.success(`${v.name} updated`);
          setEditing(null);
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the account, its orders history references, and uploaded products. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!suspending} onOpenChange={(o) => !o && setSuspending(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Suspend {suspending?.name}?</DialogTitle>
            <DialogDescription>
              The account will lose access immediately — they can't log in, list products, or place orders.
            </DialogDescription>
          </DialogHeader>
          <Field label="Reason (optional)">
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              rows={3}
              placeholder="e.g. Chargeback dispute, policy violation…"
              className="w-full rounded-md border border-border bg-secondary/40 p-3 text-sm outline-none focus:border-gold/60"
            />
          </Field>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setSuspending(null)}
              className="rounded-md border border-border px-4 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmSuspend}
              className="rounded-md bg-destructive px-4 py-2 text-xs uppercase tracking-widest text-destructive-foreground hover:opacity-90"
            >
              Suspend user
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Th({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <th className="pb-3 font-medium">
      <button onClick={onClick} className="inline-flex items-center gap-1 uppercase tracking-widest hover:text-gold">
        {children}
        {onClick && <ArrowUpDown className="h-3 w-3 opacity-60" />}
      </button>
    </th>
  );
}


function MiniStat({ label, value, tone }: { label: string; value: number; tone?: "danger" }) {
  return (
    <Card>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-2 font-display text-3xl tabular-nums ${tone === "danger" ? "text-destructive" : ""}`}>{value}</p>
    </Card>
  );
}

function UserFormDialog({
  open, onOpenChange, title, initial, onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  initial?: User;
  onSubmit: (v: Omit<User, "id" | "joined" | "lastLogin"> & { avatar?: string }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [role, setRole] = useState<UserRole>(initial?.role ?? "Customer");
  const [status, setStatus] = useState<UserStatus>(initial?.status ?? "Active");
  const [verified, setVerified] = useState<boolean>(initial?.verified ?? false);
  const [avatar, setAvatar] = useState(initial?.avatar ?? "");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setEmail(initial?.email ?? "");
    setPhone(initial?.phone ?? "");
    setRole(initial?.role ?? "Customer");
    setStatus(initial?.status ?? "Active");
    setVerified(initial?.verified ?? false);
    setAvatar(initial?.avatar ?? "");
    setPassword("");
  }, [open, initial]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    if (!initial && password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    onSubmit({ name, email, phone, role, status, verified, avatar });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{title}</DialogTitle>
          <DialogDescription>
            {initial ? "Update account details and role." : "Create a customer, producer, or admin account."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <Field label="Full name">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Email">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Phone">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
            </Field>
          </div>
          {!initial && (
            <Field label="Password">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="Min. 6 characters" />
            </Field>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Role">
              <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className={inputCls}>
                <option>Customer</option>
                <option>Producer</option>
                <option>Admin</option>
              </select>
            </Field>
            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value as UserStatus)} className={inputCls}>
                <option>Active</option>
                <option>Pending</option>
                <option>Suspended</option>
              </select>
            </Field>
          </div>
          <Field label="Profile image URL">
            <input value={avatar} onChange={(e) => setAvatar(e.target.value)} className={inputCls} placeholder="https://…" />
          </Field>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} />
            Mark as verified
          </label>
          <DialogFooter>
            <button type="button" onClick={() => onOpenChange(false)} className="rounded-md border border-border px-4 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
              Cancel
            </button>
            <button type="submit" className="rounded-md bg-gold px-4 py-2 text-xs uppercase tracking-widest text-primary-foreground hover:opacity-90">
              {initial ? "Save changes" : "Create user"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const inputCls =
  "h-10 w-full rounded-md border border-border bg-secondary/40 px-3 text-sm outline-none focus:border-gold/60";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
