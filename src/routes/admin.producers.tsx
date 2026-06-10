import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Card, Pill } from "@/components/AdminLayout";
import { Loader2, Search, Eye, Check, X, Ban, Trash2 } from "lucide-react";
import { db, auth } from "@/integrations/firebase/client";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useServerFn } from "@tanstack/react-start";
import { updateUserStatus, deleteUserAccount } from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/producers")({
  component: ProducersPage,
  head: () => ({ meta: [{ title: "Producers — Admin" }] }),
});

type FilterKey = "all" | "pending" | "approved" | "rejected" | "suspended";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All Producers" },
  { key: "pending", label: "Pending Approval" },
  { key: "approved", label: "Approved studios" },
  { key: "rejected", label: "Rejected" },
  { key: "suspended", label: "Suspended" },
];

const PAGE_SIZE = 10;

function ProducersPage() {
  const [allProducers, setAllProducers] = useState<any[]>([]);
  const [producers, setProducers] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateStatusFn = useServerFn(updateUserStatus);
  const deleteUserFn = useServerFn(deleteUserAccount);

  const fetchProducers = async () => {
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
      const q = query(usersRef, where("role", "==", "producer"));
      const snap = await getDocs(q);

      console.log("[Admin Producers] Firestore returned", snap.docs.length, "producer documents");

      let docs = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

      // Sort by createdAt descending (client-side)
      docs.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      setAllProducers(docs);
    } catch (err: any) {
      console.error("[Admin Producers] Firestore error:", err);
      const msg = err?.message || err?.code || "Unknown error";
      setError(msg);
      toast.error(`Firestore error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering, search, and pagination
  useEffect(() => {
    let result = [...allProducers];

    // Apply status filter
    if (filter !== "all") {
      result = result.filter((p) => p.status === filter);
    }

    // Apply search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p: any) =>
        p.firstName?.toLowerCase().includes(q) ||
        p.secondName?.toLowerCase().includes(q) ||
        p.username?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.business_name?.toLowerCase().includes(q)
      );
    }

    setTotalCount(result.length);

    // Apply pagination
    const start = (page - 1) * PAGE_SIZE;
    setProducers(result.slice(start, start + PAGE_SIZE));
  }, [allProducers, filter, search, page]);

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  useEffect(() => {
    fetchProducers();
  }, []);

  const handleAction = async (userId: string, action: "approved" | "rejected" | "suspended" | "delete") => {
    const confirmMsg =
      action === "delete"
        ? "Are you sure you want to PERMANENTLY delete this producer?"
        : `Change status to ${action}?`;
    if (!confirm(confirmMsg)) return;

    setBusy(userId);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Not authenticated");

      if (action === "delete") {
        await deleteUserFn({ data: { userId, adminId: currentUser.uid } });
        toast.success("Producer deleted permanently");
      } else {
        await updateStatusFn({ data: { userId, adminId: currentUser.uid, status: action } });
        toast.success(`Producer ${action}`);
      }
      fetchProducers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <>
      <PageHeader title="Producers" description="Studios and makers selling on the platform." />
      <Card>
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 md:max-w-md">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search studios by name, username, business..."
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
                <th className="pb-3 font-medium">Studio / Producer</th>
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
              ) : producers.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">No producers found</td></tr>
              ) : (
                producers.map((p) => (
                  <tr key={p.id} className="hover:bg-secondary/20">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.profilePicture || `https://ui-avatars.com/api/?name=${p.business_name || p.firstName}&background=random`} alt="" className="h-8 w-8 rounded-full border border-border" />
                        <div>
                          <div className="font-display text-base leading-tight">{p.business_name || "Personal Producer"}</div>
                          <div className="text-[10px] text-muted-foreground">{p.firstName} {p.secondName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-[11px] text-gold">@{p.username}</td>
                    <td>
                      <div className="text-[11px] leading-tight">{p.email}</div>
                      <div className="text-[10px] text-muted-foreground">{p.phoneNumber}</div>
                    </td>
                    <td className="text-[11px] text-muted-foreground">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td>
                      <Pill tone={
                        p.status === "approved" ? "gold" :
                        p.status === "pending" ? "warn" :
                        p.status === "rejected" ? "danger" : "muted"
                      }>
                        {p.status}
                      </Pill>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link to="/admin/users/$id" params={{ id: p.id }} className="p-1.5 hover:text-gold" title="View Details">
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        {p.status === "pending" && (
                          <>
                            <button onClick={() => handleAction(p.id, "approved")} disabled={!!busy} className="p-1.5 text-green-500 hover:bg-green-500/10 rounded" title="Approve">
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleAction(p.id, "rejected")} disabled={!!busy} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded" title="Reject">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        {p.status === "approved" && (
                          <button onClick={() => handleAction(p.id, "suspended")} disabled={!!busy} className="p-1.5 text-orange-500 hover:bg-orange-500/10 rounded" title="Suspend">
                            <Ban className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {p.status === "suspended" && (
                          <button onClick={() => handleAction(p.id, "approved")} disabled={!!busy} className="p-1.5 text-green-500 hover:bg-green-500/10 rounded" title="Reactivate">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button onClick={() => handleAction(p.id, "delete")} disabled={!!busy} className="p-1.5 text-muted-foreground hover:text-red-500 rounded" title="Delete Account">
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
