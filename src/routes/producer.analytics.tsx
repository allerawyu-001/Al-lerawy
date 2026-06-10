import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardLayout, StatCard, Panel } from "@/components/DashboardLayout";
import { db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/producer/analytics")({
  component: ProducerAnalyticsPage,
  head: () => ({ meta: [{ title: "Analytics — Producer Studio" }] }),
});

function ProducerAnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    totalOrders: 0,
    acceptedRequests: 0,
    declinedRequests: 0,
    completedOrders: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    if (!user) return;
    loadAnalytics();
  }, [user]);

  const loadAnalytics = async () => {
    try {
      // Products count
      const pq = query(collection(db, "products"), where("producerId", "==", user!.uid));
      const pSnap = await getDocs(pq);

      // Orders from custom_requests
      const oq = query(collection(db, "custom_requests"), where("producer_id", "==", user!.uid));
      const oSnap = await getDocs(oq);

      let accepted = 0, completed = 0, revenue = 0;
      oSnap.docs.forEach(d => {
        const data = d.data();
        if (data.status === "completed") {
          completed++;
          revenue += Number(data.budget) || 0;
        }
        accepted++;
      });

      // Count how many requests this producer declined
      const allReqs = query(collection(db, "custom_requests"));
      const allSnap = await getDocs(allReqs);
      let declined = 0;
      allSnap.docs.forEach(d => {
        const data = d.data();
        if (data.declined_by?.includes(user!.uid)) {
          declined++;
        }
      });

      setMetrics({
        totalProducts: pSnap.size,
        totalOrders: accepted,
        acceptedRequests: accepted,
        declinedRequests: declined,
        completedOrders: completed,
        totalRevenue: revenue,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const conversionRate = metrics.acceptedRequests + metrics.declinedRequests > 0
    ? ((metrics.acceptedRequests / (metrics.acceptedRequests + metrics.declinedRequests)) * 100).toFixed(1)
    : "0.0";

  return (
    <DashboardLayout role="producer" title="Analytics">
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-8">
            <StatCard label="Total Products" value={metrics.totalProducts.toString()} hint="Active catalog" />
            <StatCard label="Total Orders" value={metrics.totalOrders.toString()} hint="Accepted requests" />
            <StatCard label="Revenue" value={`$${metrics.totalRevenue.toFixed(2)}`} hint="From completed" />
            <StatCard label="Conversion" value={`${conversionRate}%`} hint="Accept vs Decline" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Panel title="Request Activity">
              <div className="mt-4 space-y-4">
                <MetricBar label="Accepted Requests" value={metrics.acceptedRequests} max={Math.max(metrics.acceptedRequests, metrics.declinedRequests, 1)} color="bg-gold" />
                <MetricBar label="Declined Requests" value={metrics.declinedRequests} max={Math.max(metrics.acceptedRequests, metrics.declinedRequests, 1)} color="bg-destructive/70" />
                <MetricBar label="Completed Orders" value={metrics.completedOrders} max={Math.max(metrics.totalOrders, 1)} color="bg-green-500" />
              </div>
            </Panel>

            <Panel title="Catalog Health">
              <div className="mt-4 space-y-6">
                <div className="rounded-lg border border-border/40 bg-secondary/20 p-6">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Products Listed</p>
                  <p className="mt-2 font-display text-4xl tabular-nums">{metrics.totalProducts}</p>
                </div>
                <div className="rounded-lg border border-border/40 bg-secondary/20 p-6">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Avg Revenue Per Order</p>
                  <p className="mt-2 font-display text-4xl tabular-nums">
                    ${metrics.completedOrders > 0 ? (metrics.totalRevenue / metrics.completedOrders).toFixed(2) : "0.00"}
                  </p>
                </div>
                {metrics.totalProducts === 0 && metrics.totalOrders === 0 && (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <BarChart3 className="h-8 w-8 text-gold/40" />
                    <p className="text-xs text-muted-foreground">Analytics will populate as you upload products and accept orders.</p>
                  </div>
                )}
              </div>
            </Panel>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

function MetricBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-display tabular-nums">{value}</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-secondary/50 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
    </div>
  );
}
