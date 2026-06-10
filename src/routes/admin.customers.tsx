import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Loader2, Eye, X, Check, Ban, Trash2 } from "lucide-react";
import { PageHeader, Card, Pill } from "@/components/AdminLayout";
import { db, auth } from "@/integrations/firebase/client";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useServerFn } from "@tanstack/react-start";
import { updateUserStatus, deleteUserAccount } from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/customers")({
  component: CustomersPage,
  head: () => ({ meta: [{ title: "Customers — Admin" }] }),
});

type FilterKey = "all" | "pending" | "approved" | "rejected" | "suspended";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All Customers" },
  { key: "pending", label: "Pending Approval" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "suspended", label: "Suspended" },
];

const PAGE_SIZE = 10;

function CustomersPage() {
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateStatusFn = useServerFn(updateUserStatus);
  const deleteUserFn = useServerFn(deleteUserAccount);

  const fetchCustomers = async () => {
    if (!db) {
      setError("Firebase is not initialized. Check your environment variables.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Simple query: only filter by role — no composite index required
      const usersRef = collection(db as any, "users");
      const q = query(usersRef, where("role", "==", "customer"));
      const snap = await getDocs(q);
      
      console.log("[Admin Customers] Firestore returned", snap.docs.length, "customer documents");

      let docs = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

      // Sort by createdAt descending (client-side)
      docs.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      setAllCustomers(docs);
    } catch (err: any) {
      console.error("[Admin Customers] Firestore error:", err);
      const msg = err?.message || err?.code || "Unknown error";
      setError(msg);
      toast.error(`Firestore error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering, search, and pagination
  useEffect(() => {
    let result = [...allCustomers];

    // Apply status filter
    if (filter !== "all") {
      result = result.filter((c) => c.status === filter);
    }

    // Apply search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c: any) =>
        c.firstName?.toLowerCase().includes(q) ||
        c.secondName?.toLowerCase().includes(q) ||
        c.username?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      );
    }

    setTotalCount(result.length);

    // Apply pagination
    const start = (page - 1) * PAGE_SIZE;
    setCustomers(result.slice(start, start + PAGE_SIZE));
  }, [allCustomers, filter, search, page]);

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAction = async (userId: string, action: "approved" | "rejected" | "suspended" | "delete") => {
    const confirmMsg =
      action === "delete"
        ? "Are you sure you want to PERMANENTLY delete this user?"
        : `Change status to ${action}?`;
    if (!confirm(confirmMsg)) return;

    setBusy(userId);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Not authenticated");

      if (action === "delete") {
        await deleteUserFn({ data: { userId, adminId: currentUser.uid } });
        toast.success("User deleted permanently");
      } else {
        await updateStatusFn({ data: { userId, adminId: currentUser.uid, status: action } });
        toast.success(`User ${action}`);
      }
      fetchCustomers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <>
      <PageHeader title="Customers" description="Manage customer registrations and approval status." />
      <Card>
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 md:max-w-md">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, username, email…"
              className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value as FilterKey); setPage(1); }}
            className="h-9 rounded-md border border-border bg-secondary/40 px-3 text-xs"
          >
            {FILTERS.map((f) => (
              <option key={f.key} value={f.key}>{f.label}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Username</th>
                <th className="pb-3 font-medium">Contact</th>
                <th className="pb-3 font-medium">Joined</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                <tr><td colSpan={6} className="py-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-gold" /></td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">No customers found</td></tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-secondary/20">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <img src={c.profilePicture || `https://ui-avatars.com/api/?name=${c.firstName}+${c.secondName}&background=random`} alt="" className="h-8 w-8 rounded-full border border-border" />
                        <div>
                          <div className="font-display text-sm leading-tight">{c.firstName} {c.secondName}</div>
                          <div className="text-[10px] text-muted-foreground">{c.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-[11px] text-gold">@{c.username}</td>
                    <td>
                      <div className="text-[11px] leading-tight">{c.email || "No email"}</div>
                      <div className="text-[10px] text-muted-foreground">{c.phoneNumber || "No phone"}</div>
                    </td>
                    <td className="text-[11px] text-muted-foreground">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td>
                      <Pill tone={
                        c.status === "approved" ? "gold" :
                        c.status === "pending" ? "warn" :
                        c.status === "rejected" ? "danger" : "muted"
                      }>
                        {c.status}
                      </Pill>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link to="/admin/users/$id" params={{ id: c.id }} className="p-1.5 hover:text-gold" title="View Details">
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        {c.status === "pending" && (
                          <>
                            <button onClick={() => handleAction(c.id, "approved")} disabled={!!busy} className="p-1.5 text-green-500 hover:bg-green-500/10 rounded" title="Approve">
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleAction(c.id, "rejected")} disabled={!!busy} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded" title="Reject">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        {c.status === "approved" && (
                          <button onClick={() => handleAction(c.id, "suspended")} disabled={!!busy} className="p-1.5 text-orange-500 hover:bg-orange-500/10 rounded" title="Suspend">
                            <Ban className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {c.status === "suspended" && (
                          <button onClick={() => handleAction(c.id, "approved")} disabled={!!busy} className="p-1.5 text-green-500 hover:bg-green-500/10 rounded" title="Reactivate">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button onClick={() => handleAction(c.id, "delete")} disabled={!!busy} className="p-1.5 text-muted-foreground hover:text-red-500 rounded" title="Delete Account">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-xs border rounded disabled:opacity-50">Prev</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 text-xs border rounded disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
