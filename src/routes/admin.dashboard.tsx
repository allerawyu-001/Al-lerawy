import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Stat, Card } from "@/components/AdminLayout";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
  head: () => ({ meta: [{ title: "Dashboard — Admin" }] }),
});

function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, producers: 0, pending: 0, gmv: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Total users
        const usersSnap = await getDocs(collection(db, "users"));
        const usersCount = usersSnap.size;

        // 2. Producers
        const producersQuery = query(collection(db, "users"), where("role", "==", "producer"));
        const producersSnap = await getDocs(producersQuery);
        const producersCount = producersSnap.size;

        // 3. Pending approvals
        const pendingQuery = query(collection(db, "users"), where("status", "==", "pending"));
        const pendingSnap = await getDocs(pendingQuery);
        const pendingCount = pendingSnap.size;

        // 4. GMV
        const paidOrdersQuery = query(collection(db, "orders"), where("payment_status", "==", "paid"));
        const paidOrdersSnap = await getDocs(paidOrdersQuery);
        const gmv = paidOrdersSnap.docs.reduce((acc, d) => acc + Number(d.data().total || 0), 0);

        setStats({ users: usersCount, producers: producersCount, pending: pendingCount, gmv });

        // 5. Recent Orders
        const recentQuery = query(collection(db, "orders"), orderBy("created_at", "desc"), limit(5));
        const recentSnap = await getDocs(recentQuery);
        const orders = await Promise.all(recentSnap.docs.map(async (d) => {
          const data = d.data();
          // Try to get profile name
          let customerName = "Unknown";
          if (data.user_id) {
            try {
              const { getDoc, doc: docRef } = await import("firebase/firestore");
              const profileSnap = await getDoc(docRef(db, "users", data.user_id));
              if (profileSnap.exists()) {
                const p = profileSnap.data();
                customerName = `${p.firstName || ''} ${p.secondName || ''}`.trim() || "Unknown";
              }
            } catch {}
          }
          return { id: d.id, ...data, customerName };
        }));
        setRecentOrders(orders);

      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Platform overview"
        description="Real-time pulse of every studio, order and customer on AL-LERAWY.com."
      />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Total Users" value={stats.users.toLocaleString()} delta="Lifetime" />
        <Stat label="Producers" value={stats.producers.toString()} delta="Active Studios" />
        <Stat label="GMV" value={`$${(stats.gmv/1000).toFixed(1)}k`} delta="Paid Orders" />
        <Stat label="Pending" value={stats.pending.toString()} delta="Needs Review" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-2xl">Recent orders</h2>
              <a className="inline-flex items-center gap-1 text-xs text-gold" href="/admin/orders">
                View all <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                  <th className="pb-3 font-medium">Order#</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Total</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {recentOrders.length === 0 ? (
                  <tr><td colSpan={4} className="py-4 text-center text-muted-foreground italic">No recent orders</td></tr>
                ) : (
                  recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td className="py-3 font-display text-base">#{o.id.slice(0, 6)}</td>
                      <td className="text-muted-foreground">{o.customerName}</td>
                      <td className="tabular-nums">${o.total}</td>
                      <td className="text-gold capitalize">{o.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </div>
        <Card>
          <h2 className="font-display text-2xl">Activity</h2>
          <ul className="mt-4 space-y-4 text-sm">
            <li className="text-muted-foreground italic">No recent activity</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
