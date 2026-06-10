import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardLayout, Panel } from "@/components/DashboardLayout";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { Loader2, ArrowLeft, Trash2 } from "lucide-react";

export const Route = createFileRoute("/customer/requests/$id")({
  component: RequestDetailPage,
  head: () => ({ meta: [{ title: "Request — AL-LERAWY.com" }] }),
});

type Req = {
  id: string; title: string; description: string; status: string;
  budget: number | null; producer_name: string | null;
  producer_response: string | null; responded_at: string | null; created_at: string;
};

function RequestDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [req, setReq] = useState<Req | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "custom_requests", id));
        if (snap.exists()) {
          const r = { id: snap.id, ...snap.data() } as Req;
          setReq(r);
          setTitle(r.title); setDescription(r.description); setBudget(r.budget?.toString() ?? "");
        }
      } catch (e) {
        console.error("Failed to load request", e);
      }
      setLoading(false);
    })();
  }, [id]);

  const save = async () => {
    if (!req) return;
    setBusy(true);
    try {
      await updateDoc(doc(db, "custom_requests", req.id), {
        title, description, budget: budget ? Number(budget) : null,
        updated_at: new Date().toISOString(),
      });
      setReq({ ...req, title, description, budget: budget ? Number(budget) : null });
      setEditing(false);
      toast.success("Request updated");
    } catch (error: any) {
      toast.error(error.message || "Update failed");
    }
    setBusy(false);
  };

  const remove = async () => {
    if (!req) return;
    if (!confirm("Delete this request?")) return;
    try {
      await deleteDoc(doc(db, "custom_requests", req.id));
      toast.success("Request deleted");
      navigate({ to: "/customer/requests" });
    } catch (error: any) {
      toast.error(error.message || "Delete failed");
    }
  };

  const canEdit = req && req.status === "pending";

  return (
    <DashboardLayout role="customer" title="Request details">
      <Link to="/customer/requests" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All requests
      </Link>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : !req ? (
        <Panel title="Not found"><p className="text-muted-foreground">This request doesn't exist or you don't have access.</p></Panel>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Panel title={editing ? "Edit request" : req.title} action={
              canEdit ? (
                editing
                  ? <button onClick={() => setEditing(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                  : <button onClick={() => setEditing(true)} className="text-xs text-gold hover:underline">Edit</button>
              ) : null
            }>
              {editing ? (
                <div className="space-y-4">
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm" />
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[120px] w-full rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm" />
                  <input value={budget} onChange={(e) => setBudget(e.target.value)} type="number" placeholder="Budget" className="w-full rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm" />
                  <button disabled={busy} onClick={save} className="rounded-full bg-foreground px-5 py-2 text-sm text-background disabled:opacity-50">
                    {busy ? "Saving…" : "Save"}
                  </button>
                </div>
              ) : (
                <>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{req.description}</p>
                  {req.budget != null && <p className="mt-4 text-sm">Budget: <span className="font-display tabular-nums">${Number(req.budget).toFixed(2)}</span></p>}
                  <p className="mt-2 text-xs text-muted-foreground">Created {new Date(req.created_at).toLocaleString()}</p>
                </>
              )}
            </Panel>
          </div>
          <div className="space-y-4">
            <Panel title="Status">
              <p className="text-sm">{req.status.replace("_", " ")}</p>
            </Panel>
            <Panel title="Producer response">
              {req.producer_response ? (
                <>
                  <p className="text-xs uppercase tracking-widest text-gold">{req.producer_name ?? "—"}</p>
                  <p className="mt-2 text-sm">{req.producer_response}</p>
                  {req.responded_at && <p className="mt-2 text-xs text-muted-foreground">{new Date(req.responded_at).toLocaleString()}</p>}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Awaiting producer response.</p>
              )}
            </Panel>
            {canEdit && (
              <button onClick={remove} className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-destructive/40 px-4 py-2 text-sm text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" /> Delete request
              </button>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
