import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardLayout, StatCard, Panel } from "@/components/DashboardLayout";
import { db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Package } from "lucide-react";

export const Route = createFileRoute("/producer/orders")({
  component: ProducerOrdersPage,
  head: () => ({ meta: [{ title: "Orders — Producer Studio" }] }),
});

type OrderRow = {
  id: string;
  title: string;
  status: string;
  user_id?: string;
  budget?: number;
  accepted_at?: string;
};

function ProducerOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    try {
      // Accepted custom requests are treated as producer orders
      const q = query(
        collection(db, "custom_requests"),
        where("producer_id", "==", user!.uid)
      );
      const snap = await getDocs(q);
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as OrderRow)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const statusClass = (s: string) => {
    if (s === "accepted") return "bg-gold/15 text-gold";
    if (s === "completed") return "bg-green-500/15 text-green-500";
    if (s === "in_production") return "bg-blue-500/15 text-blue-500";
    return "bg-secondary text-muted-foreground";
  };

  return (
    <DashboardLayout role="producer" title="Orders">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-8">
        <StatCard label="Total Orders" value={orders.length.toString()} hint="All time" />
        <StatCard label="Active" value={orders.filter(o => o.status === "accepted" || o.status === "in_production").length.toString()} hint="In progress" />
        <StatCard label="Completed" value={orders.filter(o => o.status === "completed").length.toString()} hint="Delivered" />
      </div>

      <Panel title="Order Fulfillment">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
            <Package className="h-10 w-10 text-gold/50" />
            <p className="font-medium">No orders yet</p>
            <p className="text-xs max-w-sm">Accept custom requests from the Dashboard to see them here as orders in your production queue.</p>
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                  <th className="pb-3 font-medium">Order</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Budget</th>
                  <th className="pb-3 font-medium">Accepted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {orders.map((o) => (
                  <tr key={o.id} className="transition-colors hover:bg-secondary/30">
                    <td className="py-3 font-display text-base">{o.title}</td>
                    <td>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-widest ${statusClass(o.status)}`}>
                        {o.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="tabular-nums">{o.budget ? `$${Number(o.budget).toFixed(0)}` : "—"}</td>
                    <td className="text-muted-foreground text-xs">{o.accepted_at ? new Date(o.accepted_at).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </DashboardLayout>
  );
}
