import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardLayout, Panel } from "@/components/DashboardLayout";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/customer/requests")({
  component: RequestsPage,
  head: () => ({ meta: [{ title: "Open requests — AL-LERAWY.com" }] }),
});

type Req = { id: string; title: string; status: string; producer_name: string | null; budget: number | null; created_at: string };

function statusClass(s: string) {
  if (s === "accepted" || s === "completed") return "bg-gold/15 text-gold";
  if (s === "responded" || s === "in_review") return "bg-accent/15 text-accent";
  if (s === "rejected") return "bg-destructive/15 text-destructive";
  return "bg-secondary text-muted-foreground";
}

function RequestsPage() {
  const { user, loading: authLoading } = useAuth();
  const [reqs, setReqs] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    (async () => {
      try {
        const q = query(
          collection(db, "custom_requests"),
          where("user_id", "==", user.uid),
          orderBy("created_at", "desc")
        );
        const snap = await getDocs(q);
        setReqs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Req)));
      } catch (e) {
        console.error("Failed to load requests", e);
      }
      setLoading(false);
    })();
  }, [user, authLoading]);

  if (!authLoading && !user) throw redirect({ to: "/login" });

  return (
    <DashboardLayout role="customer" title="Open requests">
      <Panel title="Custom cap requests" action={<Link to="/custom" className="text-xs text-gold hover:underline">+ New request</Link>}>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : reqs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
            <Sparkles className="h-8 w-8 text-gold" />
            <p>No custom requests yet.</p>
            <Link to="/custom" className="rounded-full bg-foreground px-4 py-2 text-sm text-background">Start a request</Link>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {reqs.map((r) => (
              <Link key={r.id} to="/customer/requests/$id" params={{ id: r.id }}
                className="grid grid-cols-[1fr_auto] items-center gap-4 py-4 -mx-2 px-2 rounded-md hover:bg-secondary/30 transition">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gold">{r.producer_name ?? "Unassigned"}</p>
                  <p className="mt-1 font-display text-lg">{r.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  {r.budget != null && <p className="font-display tabular-nums">${Number(r.budget).toFixed(0)}</p>}
                  <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-widest ${statusClass(r.status)}`}>{r.status.replace("_"," ")}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </DashboardLayout>
  );
}
