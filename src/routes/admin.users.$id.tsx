import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageHeader, Card, Pill } from "@/components/AdminLayout";
import { useUser, usersStore, formatDate, relative } from "@/lib/users-store";
import { ArrowLeft, Ban, CheckCircle2, Mail, Phone, Trash2, Calendar, Shield } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState, type ReactNode } from "react";

export const Route = createFileRoute("/admin/users/$id")({
  component: UserDetailPage,
  head: () => ({ meta: [{ title: "User detail — Admin" }] }),
});

function UserDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const user = useUser(id);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!user) {
    return (
      <div className="grid place-items-center py-24 text-center">
        <p className="font-display text-3xl">User not found</p>
        <Link to="/admin/users" className="mt-4 text-sm text-gold hover:underline">
          ← Back to users
        </Link>
      </div>
    );
  }

  const suspended = user.status === "Suspended";

  return (
    <>
      <Link
        to="/admin/users"
        className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-gold"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All users
      </Link>

      <PageHeader
        title={user.name}
        description={user.email}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                suspended ? usersStore.activate(user.id) : usersStore.suspend(user.id);
                toast.success(suspended ? "Account reactivated" : "Account suspended");
              }}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs uppercase tracking-widest hover:border-gold/40"
            >
              {suspended ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
              {suspended ? "Reactivate" : "Suspend"}
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-xs uppercase tracking-widest text-destructive-foreground hover:opacity-90"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Profile card */}
        <Card>
          {suspended && (
            <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs">
              <p className="font-medium uppercase tracking-widest text-destructive">Suspended</p>
              {user.suspendedAt && (
                <p className="mt-1 text-muted-foreground">Since {formatDate(user.suspendedAt)}</p>
              )}
              {user.suspendReason && <p className="mt-1">Reason: {user.suspendReason}</p>}
            </div>
          )}
          <div className="flex flex-col items-center text-center">
            <img src={user.avatar} alt={user.name} className="h-24 w-24 rounded-full object-cover" />
            <p className="mt-4 font-display text-2xl">{user.name}</p>
            <div className="mt-2 flex items-center gap-2">
              <Pill tone={user.status === "Active" ? "gold" : user.status === "Pending" ? "warn" : "danger"}>
                {user.status}
              </Pill>
              <Pill tone="muted">{user.role}</Pill>
            </div>
          </div>
          <dl className="mt-6 space-y-3 text-sm">
            <Row icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={user.email} />
            <Row icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={user.phone} />
            <Row icon={<Shield className="h-3.5 w-3.5" />} label="Verified" value={user.verified ? "Yes" : "No"} />
            <Row icon={<Calendar className="h-3.5 w-3.5" />} label="Joined" value={formatDate(user.joined)} />
            <Row icon={<Calendar className="h-3.5 w-3.5" />} label="Last login" value={relative(user.lastLogin)} />
          </dl>
        </Card>

        {/* Right column */}
        <div className="grid gap-6">
          <Section title="Orders history">
            {user.orders?.length ? (
              <Table headers={["Order", "Date", "Total", "Status"]}>
                {user.orders.map((o) => (
                  <tr key={o.id} className="border-t border-border/40">
                    <td className="py-3 font-display">{o.id}</td>
                    <td className="text-muted-foreground">{formatDate(o.date)}</td>
                    <td className="tabular-nums">${o.total}</td>
                    <td><Pill tone="gold">{o.status}</Pill></td>
                  </tr>
                ))}
              </Table>
            ) : <Empty>No orders yet.</Empty>}
          </Section>

          <Section title="Uploaded products">
            {user.products?.length ? (
              <Table headers={["Product", "Price", "Status"]}>
                {user.products.map((p) => (
                  <tr key={p.id} className="border-t border-border/40">
                    <td className="py-3 font-display">{p.title}</td>
                    <td className="tabular-nums">${p.price}</td>
                    <td><Pill tone={p.status === "Live" ? "gold" : "muted"}>{p.status}</Pill></td>
                  </tr>
                ))}
              </Table>
            ) : <Empty>No products uploaded.</Empty>}
          </Section>

          <Section title="Custom requests">
            {user.requests?.length ? (
              <Table headers={["Request", "Date", "Status"]}>
                {user.requests.map((r) => (
                  <tr key={r.id} className="border-t border-border/40">
                    <td className="py-3 font-display">{r.title}</td>
                    <td className="text-muted-foreground">{formatDate(r.date)}</td>
                    <td><Pill tone="warn">{r.status}</Pill></td>
                  </tr>
                ))}
              </Table>
            ) : <Empty>No custom requests.</Empty>}
          </Section>

          <Section title="Activity log">
            {user.activity?.length ? (
              <ul className="space-y-3 text-sm">
                {user.activity.map((a, i) => (
                  <li key={i} className="flex gap-3 border-l-2 border-gold/40 pl-3">
                    <span className="font-mono text-xs text-muted-foreground w-24 shrink-0">{relative(a.date)}</span>
                    <span>{a.event}</span>
                  </li>
                ))}
              </ul>
            ) : <Empty>No recorded activity.</Empty>}
          </Section>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {user.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the account. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                usersStore.remove(user.id);
                toast.success("User deleted");
                navigate({ to: "/admin/users" });
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Row({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/30 pb-2 last:border-0">
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        {icon} {label}
      </span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <h2 className="mb-4 font-display text-xl">{title}</h2>
      {children}
    </Card>
  );
}

function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
            {headers.map((h) => <th key={h} className="pb-2 font-medium">{h}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>;
}
